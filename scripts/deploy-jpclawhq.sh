#!/usr/bin/env bash
set -euo pipefail

cd /srv/frc1884-scouting

corepack enable >/dev/null 2>&1 || true

corepack yarn install --immutable
corepack yarn workspace @griffins-scout/logger build
corepack yarn workspace @griffins-scout/game build
corepack yarn workspace @griffins-scout/controller gen
corepack yarn workspace @griffins-scout/controller push
corepack yarn workspace @griffins-scout/controller build
corepack yarn workspace @griffins-scout/api build
corepack yarn workspace @griffins-scout/scanner build

sudo systemctl restart frc1884-scouting-controller.service
sudo systemctl status --no-pager frc1884-scouting-controller.service
sudo nginx -t
sudo systemctl reload nginx
