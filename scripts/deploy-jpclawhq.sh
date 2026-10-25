#!/usr/bin/env bash
set -euo pipefail

# Installed root-owned; systemd executes this as frc1884-scouting-deploy, never root.
# Requests carry no trusted inputs. Only this fixed main branch is built.
rm -f /var/lib/frc1884-scouting-request/pending
cd /srv/frc1884-scouting
# Fast-forward keeps unrelated operator edits and refuses conflicting changes.
git fetch origin main
git switch main
git merge --ff-only origin/main
corepack yarn install --immutable
corepack yarn workspace @griffins-scout/logger build
corepack yarn workspace @griffins-scout/game build
corepack yarn workspace @griffins-scout/controller gen
corepack yarn workspace @griffins-scout/controller push
corepack yarn workspace @griffins-scout/controller build
corepack yarn workspace @griffins-scout/api build
corepack yarn workspace @griffins-scout/scanner build
# The fixed activation unit only restarts this app; it executes no repo code.
touch /var/lib/frc1884-scouting-activate/ready
