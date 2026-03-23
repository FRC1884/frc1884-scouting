# Run Locally

This repo is a monorepo with these app workspaces:

- `apps/client`: Expo mobile scouting app
- `apps/controller`: Express + tRPC + Prisma backend
- `apps/scanner`: Vite/Vue QR scanner and match station UI
- `apps/tba`: The Blue Alliance sync worker
- `apps/sheet`: Google Sheets export worker

The shared packages live in `packages/`.

## What "run everything" means

For the main scouting workflow on a local network, the minimum stack is:

- `controller`
- `client`
- `scanner`

Optional background services:

- `tba`: pulls match data from The Blue Alliance into the controller
- `sheet`: exports records to Google Sheets

## Prerequisites

- Node.js installed
- Corepack or Yarn available on `PATH`
- Postgres running locally or remotely
- A database URL for Prisma

This repo is pinned to `yarn@4.1.0` in the root `package.json`, so the clean path is:

```bash
corepack enable
corepack prepare yarn@4.1.0 --activate
yarn --version
```

If `yarn` is missing, the root `yarn dev` workflow will fail.

## Install dependencies

From the repo root:

```bash
yarn install
```

## Environment files

Create these files before starting the services.

### `apps/controller/.env`

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
```

### `apps/tba/.env`

```dotenv
EVENT_CODE=2026xxxx
CONTROLLER_URL=http://127.0.0.1:8080
X_TBA_AUTH_KEY=your_tba_key
```

### `apps/sheet/.env`

```dotenv
CONTROLLER_URL=http://127.0.0.1:8080
CRED_PATH=/absolute/path/to/google-service-account.json
SHEET_ID=your_google_sheet_id
```

The scanner can run without a `.env` file. If needed, it reads:

- `SCOUTING_CONTROLLER_ORIGIN` defaulting to `http://127.0.0.1:8080`
- `SCOUTING_BASE_PATH` for non-root deploys

## First-time backend setup

If you want a local Postgres via Docker:

```bash
docker run --name frc1884-scouting-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=frc1884_scouting \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Then set:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/frc1884_scouting
```

Generate Prisma client and push the schema:

```bash
yarn workspace @griffins-scout/controller gen
yarn workspace @griffins-scout/controller push
```

Build the generated game package:

```bash
yarn workspace @griffins-scout/game build
```

## Start the main local stack

From the repo root:

```bash
yarn dev
```

`yarn dev` now does the required package builds first, then starts:

- controller
- client
- scanner
- viewer

Expected local endpoints:

- controller: `http://localhost:8080`
- scanner: `http://localhost:3001`
- viewer: `http://localhost:3002`
- client: Expo dev server in the terminal, then open on a device/emulator

## Start optional services

Run these in separate terminals if you want TBA sync and Google Sheets export:

```bash
yarn workspace @griffins-scout/tba dev
```

```bash
yarn workspace @griffins-scout/sheet dev
```

## Useful individual commands

```bash
yarn workspace @griffins-scout/game build
yarn workspace @griffins-scout/controller dev
yarn workspace @griffins-scout/scanner dev
yarn workspace @griffins-scout/client start
yarn workspace @griffins-scout/tba dev
yarn workspace @griffins-scout/sheet dev
```
