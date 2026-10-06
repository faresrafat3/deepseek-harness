---
name: ts-deep-modules
description: Wire dependency-cruiser into a TypeScript repo so each package is a deep module — implementation hidden in subfolders, reachable only through its entry-point files at the package root. Use when the user has a TypeScript repo with multiple packages and wants to enforce the deep-module discipline structurally.
whenToUse: "(1) Detect the package manager and packages root. (2) Install dependency-cruiser as a devDependency. (3) Write .dependency-cruiser.cjs with the four rules (entry-point boundary, intra-package freedom, tests through entry points, no cycles). (4) Wire `lint:boundaries` into the existing umbrella check. (5) Scaffold an example package. (6) Prove the rules bite (a deliberate deep import must fail)."
metadata:
  category: engineering
  scope: boundaries
  author: dyno-pony/sprint-4
  upstream: derived from mattpocock/skills (MIT, setup-ts-deep-modules)
---

# TS Deep Modules

Make every package in this repo a **deep module**: a lot of behaviour behind a small interface. A package's public surface is its **entry points** (the files at the package root), and everything in its subfolders is hidden. This skill installs `dependency-cruiser` and the rules that make the entry points the only way in, then proves the rules bite.

For the vocabulary (deep module, interface, seam, depth), see the `domain` skill (Part 2: codebase design).

## The shape this enforces

```
src/packages/
  <name>/
    index.ts        ← an entry point (public). Import this from outside.
    client.ts       ← another entry point. Packages may expose SEVERAL.
    lib/            ← implementation: hidden from outside, free to import each other.
    tests/          ← co-located tests + fixtures (a subfolder, so private).
```

The public surface is the package's **root files**, not one designated `index.ts`. Implementation lives in `lib/` and tests in `tests/` by convention — every package has the same two-folder shape. The rule is general, though: *anything* in *any* subfolder is private, so you never extend the config to add a folder.

## Four rules, all `error`

1. **Entry-point boundary** — code outside a package may import only that package's entry points (its root files), never anything in its subfolders.
2. **Intra-package freedom** — a package's own files import each other freely.
3. **Tests through the entry points** — files under `<pkg>/tests/` may import any package's entry points and their own `tests/` fixtures, but never any package's subfolder internals (not even their own). Integration tests across packages are fine; deep imports are not.
4. **No cycles** — no dependency cycles.

## Steps

### 1. Detect the environment

- **Package manager**: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, else npm. Use it for every command below.
- **Packages root**: if `src/` exists use `src/packages`, else `packages`. Confirm with the user if the repo already has a different obvious convention.
- **Existing config**: check for a `.dependency-cruiser.*` file. If one exists, do **not** overwrite it — merge the four rules and the options in, and tell the user what you added.

**Done when:** package manager, packages root, and existing-config status are all known.

### 2. Install dependency-cruiser

Install as a devDependency with the detected package manager.

**Done when:** `dependency-cruiser` is in `devDependencies`.

### 3. Write the config

Copy the dependency-cruiser config to the repo root as `.dependency-cruiser.cjs`. Set `PACKAGES_ROOT` to the root detected in step 1. The rules are path-depth based and extension-agnostic, so nothing else needs adapting.

**Done when:** `.dependency-cruiser.cjs` exists with the correct `PACKAGES_ROOT`, and the four forbidden rules are present.

### 4. Wire it into the checks

- Add a `lint:boundaries` script: `depcruise <packages-root>` (or `depcruise src`).
- Fold it into the repo's umbrella check command (the one that already runs typecheck). Do **not** touch `tsconfig` or add path aliases.
- If there is no umbrella script, add `lint:boundaries` and tell the user to include it in CI.

**Done when:** `lint:boundaries` exists and runs as part of the same command as typecheck.

### 5. Scaffold the example package

Create a committed `<packages-root>/example/` as a copy-me template:

- `index.ts` is an entry point. Export one function that delegates to an internal file (so the package is visibly *deep*, not a pass-through).
- `lib/impl.ts`: an internal file in a **subfolder**, imported by `index.ts`, not reachable from outside.
- `tests/example.test.ts` imports **only** `../index` (an entry point) and asserts against the public function.

Tell the user this is a starter template to copy or delete.

**Done when:** the example package exists, exposes its behaviour through a root entry point, and hides `impl` in a subfolder.

### 6. Prove the rules bite

This is the completion criterion for the whole skill: a config that doesn't fail on a violation is worthless.

1. Run `lint:boundaries`. It must **pass** on the clean example.
2. Temporarily add a deep import to `tests/example.test.ts` (e.g. `import { thing } from "../lib/impl"`). Run `lint:boundaries` again; it must **fail** with `tests-through-entrypoints`.
3. Revert the deep import. Run once more, and it must **pass**.

**Done when:** you have observed a pass, then a fail on the deep import, then a pass again. If step 2 does not fail, the rules are not wired correctly, so fix before finishing.

### 7. Document the convention

Write a `README.md` **in the packages folder** (`<packages-root>/README.md`, next to the packages it governs) covering: the `src/packages/<name>/` layout, "import only through a package's entry points (its root files)", and how to run `lint:boundaries`. **Discourage barrel files** explicitly. Then add a **context pointer** to it from the repo's agent-instructions file (`CLAUDE.md` if present, else `AGENTS.md`).

**Done when:** `<packages-root>/README.md` exists and discourages barrels, and the repo's `CLAUDE.md`/`AGENTS.md` links to it.

## Notes

- The config's `$1` back-references (dependency-cruiser's group matching) are what let a package reach its own internals while outsiders can't.
- Public vs private is decided by **depth**: a package's root files are entry points; anything in a subfolder is private.
- Packages are **flat**: one tier of immediate children under the root. A package's internals may nest as deep as you like; a package may not contain another package.
- Use `.cjs` (not `.js`) so the config's `module.exports` works even in `"type": "module"` repos.
