import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { credentialKey, credentialRef } from '@deepseek-ai/dsh-credentials'
import { DSH_LAUNCH_ENVIRONMENT_KEY } from '@deepseek-ai/dsh-launch-environment'
import type { CredentialKey, CredentialRecord, CredentialRef } from '@deepseek-ai/dsh-credentials'
import { LocalCredentialProvider } from '../src/index.ts'

function writeCredentials(file: string, text: string): Promise<void> {
  return writeFile(file, text, { mode: 0o600 })
}

const ALPHA = credentialRef('DSH_REVIEW_ALPHA')
const BETA = credentialRef('DSH_REVIEW_BETA')
const INNER = credentialRef('DSH_REVIEW_INNER')

const cleanups: Array<() => Promise<void>> = []

afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()!()
})

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-cred-review-'))
  cleanups.push(() => rm(dir, { recursive: true, force: true }))
  return dir
}

async function boot(config: ConstructorParameters<typeof LocalCredentialProvider>[1]): Promise<Context> {
  const ctx = new Context()
  const fiber = ctx.plugin(LocalCredentialProvider, config)
  cleanups.push(async () => { await fiber.dispose() })
  await fiber
  return ctx
}

describe('read-modify-write', () => {
  it('folds an unobserved external edit into a write instead of overwriting it', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })
    const seen: string[] = []
    ctx.on('credentials/reference-updated', (ref) => { seen.push(ref) })
    await ctx.credentials.set(ALPHA, 'one')
    // The external edit has landed on disk but no watcher reported it (watch
    // is off — the same blind spot as a debounce window or a missed event).
    await writeCredentials(path, `version: 1\nrefs:\n  ${ALPHA}: one\n  ${BETA}: external\n`)
    await ctx.credentials.set(ALPHA, 'two')
    const text = await readFile(path, 'utf8')
    expect(text).toContain(`${BETA}: external`)
    expect(text).toContain(`${ALPHA}: two`)
    // The fold published the unobserved entry before the write's own commit.
    expect(seen).toEqual([ALPHA, BETA, ALPHA])
    expect(await ctx.credentials.resolve(BETA)).toEqual({ value: 'external', source: 'file' })
  })

  it('keeps both refs when two providers write the same document concurrently', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const first = await boot({ path, watch: false })
    const second = await boot({ path, watch: false })
    await Promise.all([
      (async () => { for (const value of ['1', '2', '3'] as const) await first.credentials.set(ALPHA, value) })(),
      (async () => { for (const value of ['1', '2', '3'] as const) await second.credentials.set(BETA, value) })(),
    ])
    const third = await boot({ path, watch: false })
    expect(await third.credentials.resolve(ALPHA)).toEqual({ value: '3', source: 'file' })
    expect(await third.credentials.resolve(BETA)).toEqual({ value: '3', source: 'file' })
  })

  it('creates the credentials directory owner-only', async () => {
    const dir = await tempDir()
    const home = join(dir, 'home')
    const ctx = await boot({ path: join(home, '.credentials.yaml'), watch: false })
    await ctx.credentials.set(ALPHA, 'one')
    if (process.platform !== 'win32') expect((await stat(home)).mode & 0o777).toBe(0o700)
  })

  it('holds every writer of the document to the record-mutation lock wait', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const holder = await boot({ path, watch: false })
    const contender = await boot({ path, watch: false })
    const doomed = credentialKey('llm-pi-ai', 'doomed')
    const slowKey = credentialKey('llm-pi-ai', 'slow')
    await holder.credentials.modifyRecord(doomed, () => Promise.resolve({ kind: 'api-key', key: 'x' }))
    const entered = Promise.withResolvers<undefined>()
    // The mutation holds the cross-process writer lock across a stand-in for
    // an OAuth refresh round trip — longer than withFileLock's 2s default.
    const slow = holder.credentials.modifyRecord(slowKey, async () => {
      entered.resolve(undefined)
      await new Promise(resolve => setTimeout(resolve, 2_400))
      return { kind: 'api-key', key: 'slow' }
    })
    await entered.promise
    // The other two writer paths — a reference write and a record delete —
    // share that file and that lock, so they must wait the refresh out rather
    // than fail at the file-work default.
    await Promise.all([
      contender.credentials.set(ALPHA, 'waited'),
      contender.credentials.deleteRecord(doomed),
    ])
    await slow
    const reread = await boot({ path, watch: false })
    expect(await reread.credentials.resolve(ALPHA)).toEqual({ value: 'waited', source: 'file' })
    expect(await reread.credentials.readRecord(doomed)).toBeUndefined()
    expect(await reread.credentials.readRecord(slowKey)).toEqual({ kind: 'api-key', key: 'slow' })
  })
})

describe('contained update fan-out', () => {
  it('does not fail a committed set when a listener throws, and later listeners still run', async () => {
    const dir = await tempDir()
    const ctx = await boot({ path: join(dir, '.credentials.yaml'), watch: false })
    ctx.on('credentials/reference-updated', () => {
      throw new Error('observer boom')
    })
    const second = vi.fn()
    ctx.on('credentials/reference-updated', second)
    await expect(ctx.credentials.set(ALPHA, 'one')).resolves.toBeUndefined()
    expect(second).toHaveBeenCalledWith(ALPHA)
    expect(await ctx.credentials.resolve(ALPHA)).toEqual({ value: 'one', source: 'file' })
  })

  it('contains an async listener rejection', async () => {
    const dir = await tempDir()
    const ctx = await boot({ path: join(dir, '.credentials.yaml'), watch: false })
    // An unknown-returning function keeps the typed surface legal while the
    // runtime value is still the rejected promise the containment must handle.
    const boom = (): unknown => Promise.reject(new Error('async observer boom'))
    ctx.on('credentials/reference-updated', boom)
    await expect(ctx.credentials.set(ALPHA, 'one')).resolves.toBeUndefined()
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  it('rethrows an invariant-coded failure after the commit and the remaining listeners', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })
    ctx.on('credentials/reference-updated', () => {
      throw Object.assign(new Error('forged relation'), { code: 'INVARIANT' })
    })
    const second = vi.fn()
    ctx.on('credentials/reference-updated', second)
    await expect(ctx.credentials.set(ALPHA, 'one')).rejects.toThrow(/forged relation/)
    // Harness-fatal by design — but the write itself committed first.
    expect(second).toHaveBeenCalledWith(ALPHA)
    expect(await readFile(path, 'utf8')).toContain(`${ALPHA}: one`)
    expect(await ctx.credentials.resolve(ALPHA)).toEqual({ value: 'one', source: 'file' })
  })
})

describe('document editor', () => {
  it('leaves a sibling multi-line value untouched while patching one entry', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const wrapped = `version: 1\nrefs:\n  DSH_REVIEW_WRAPPED: |-\n    line1\n    line2\n  ${ALPHA}: a\n`
    await writeCredentials(path, wrapped)
    const ctx = await boot({ path, watch: false })
    await ctx.credentials.set(ALPHA, 'b')
    expect(await readFile(path, 'utf8'))
      .toBe(`version: 1\nrefs:\n  DSH_REVIEW_WRAPPED: |-\n    line1\n    line2\n  ${ALPHA}: b\n`)
    expect(await ctx.credentials.resolve(credentialRef('DSH_REVIEW_WRAPPED')))
      .toEqual({ value: 'line1\nline2', source: 'file' })
  })

  it('stores a value that looks like another entry without creating one', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })
    // The stored text must stay a value: a quoted-scalar write that leaked its
    // own structure would silently mint a credential nobody stored.
    await ctx.credentials.set(ALPHA, `${INNER}: injected`)
    const reread = await boot({ path, watch: false })
    expect(await reread.credentials.resolve(ALPHA)).toEqual({ value: `${INNER}: injected`, source: 'file' })
    expect(await reread.credentials.resolve(INNER)).toBeUndefined()
  })
})

describe('render key guard', () => {
  const RECORD: CredentialRecord = { kind: 'api-key' }
  // The corruption this guard exists for arrived from a JavaScript plugin that
  // passed a plain object where the seam brands a string; every such write
  // minted a fresh complex mapping key until the document stopped parsing.
  const OBJECT_KEY = { ns: 'agentrouter-pool', kind: 'state', id: 'route' } as unknown as CredentialKey
  const OBJECT_REF = { ns: 'agentrouter-pool' } as unknown as CredentialRef

  it('refuses a record write under a non-string key without touching the document', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const seed = 'version: 1\nrefs:\n  DSH_REVIEW_ALPHA: one\n'
    await writeCredentials(path, seed)
    const ctx = await boot({ path, watch: false })
    const mutate = vi.fn(() => Promise.resolve(RECORD))
    // Twice: the bug grew the document by one unmappable pair per write, so
    // the regression is two refused attempts leaving the bytes identical.
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(ctx.credentials.modifyRecord(OBJECT_KEY, mutate))
        .rejects.toThrow(/storable credential key/)
    }
    expect(mutate).not.toHaveBeenCalled()
    expect(await readFile(path, 'utf8')).toBe(seed)
  })

  it('refuses a reference write under a non-string ref without touching the document', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const seed = 'version: 1\nrefs:\n  DSH_REVIEW_ALPHA: one\n'
    await writeCredentials(path, seed)
    const ctx = await boot({ path, watch: false })
    await expect(ctx.credentials.set(OBJECT_REF, 'value')).rejects.toThrow(/storable credential reference/)
    expect(await readFile(path, 'utf8')).toBe(seed)
  })

  it('refuses a well-typed string outside the stored grammar', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const seed = 'version: 1\nrefs:\n  DSH_REVIEW_ALPHA: one\n'
    await writeCredentials(path, seed)
    const ctx = await boot({ path, watch: false })
    await expect(ctx.credentials.set('not a ref' as CredentialRef, 'value')).rejects.toThrow(/storable credential reference/)
    await expect(ctx.credentials.modifyRecord('a/b/c' as unknown as CredentialKey, () => Promise.resolve(RECORD)))
      .rejects.toThrow(/storable credential key/)
    await expect(ctx.credentials.modifyRecord('a/B' as unknown as CredentialKey, () => Promise.resolve(RECORD)))
      .rejects.toThrow(/storable credential key/)
    await expect(ctx.credentials.modifyRecord('no-segment' as unknown as CredentialKey, () => Promise.resolve(RECORD)))
      .rejects.toThrow(/storable credential key/)
    expect(await readFile(path, 'utf8')).toBe(seed)
  })

  it('rejects an invalid key before an absent delete can no-op', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })

    await expect(ctx.credentials.deleteRecord(OBJECT_KEY)).rejects.toThrow(/storable credential key/)
    await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('does not coerce untrusted key values in refusal diagnostics', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })
    const values: unknown[] = [
      Object.create(null),
      { toString: () => { throw new Error('must not run') } },
    ]

    for (const value of values) {
      await expect(ctx.credentials.set(value as CredentialRef, 'value')).rejects.toThrow(/non-string value/)
    }
    await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rejects a non-string reference value before creating a document', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })

    await expect(ctx.credentials.set(ALPHA, 123 as unknown as string)).rejects.toThrow(/values must be strings/)
    await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('refuses record values the parser could not read back', async () => {
    const candidates: unknown[] = [
      { kind: 'api-key', key: 123 },
      { kind: 'api-key', env: [] },
      { kind: 'api-key', env: { AWS_PROFILE: 123 } },
      { kind: 'grant', payload: 1, extra: true },
      { kind: 'not-a-record-kind' },
    ]

    for (const candidate of candidates) {
      const dir = await tempDir()
      const path = join(dir, '.credentials.yaml')
      const ctx = await boot({ path, watch: false })
      await expect(ctx.credentials.modifyRecord(
        credentialKey('llm-pi-ai', 'validation'),
        () => Promise.resolve(candidate as CredentialRecord),
      )).rejects.toThrow(/record "llm-pi-ai\/validation"/)
      await expect(readFile(path, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    }
  })

  it('validates a reference before consulting the launch environment', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = new Context()
    const getFrom = vi.fn(() => { throw new Error('environment lookup must not run') })
    ctx.provide(DSH_LAUNCH_ENVIRONMENT_KEY, { get: vi.fn(), getFrom })
    const fiber = ctx.plugin(LocalCredentialProvider, { path, watch: false })
    cleanups.push(async () => { await fiber.dispose() })
    await fiber

    await expect(ctx.credentials.set(OBJECT_REF, 'value')).rejects.toThrow(/storable credential reference/)
    expect(getFrom).not.toHaveBeenCalled()
  })

  it('still stores everything the grammar admits', async () => {
    const dir = await tempDir()
    const path = join(dir, '.credentials.yaml')
    const ctx = await boot({ path, watch: false })
    await ctx.credentials.set(ALPHA, 'two')
    await ctx.credentials.modifyRecord(credentialKey('llm-pi-ai', 'openai-codex'), () => Promise.resolve(RECORD))
    const reread = await boot({ path, watch: false })
    expect(await reread.credentials.resolve(ALPHA)).toEqual({ value: 'two', source: 'file' })
    expect(await reread.credentials.readRecord(credentialKey('llm-pi-ai', 'openai-codex'))).toEqual(RECORD)
  })
})

