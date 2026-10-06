# MOVED — canonical home is now a standalone repo

This directory is the legacy location. The canonical, versioned home of the dyno-pony
arsenal is:

    ~/Projects/dyno-pony        (github.com/faresrafat3/dyno-pony, v1.1.0)

The loader recipe tries, in order:
  1. ~/.dsh/dyno-pony/packages/dyno-pony.js        (deployed by scripts/install.sh)
  2. ~/Projects/dyno-pony/packages/dyno-pony.js    (canonical)
  3. this legacy location                          (migration safety only)

Do not edit sources here. Edit the canonical repo, run its tests, then install.sh.
