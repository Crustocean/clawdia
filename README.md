# Clawdia Monorepo

[![Node](https://img.shields.io/badge/node-%3E%3D18-green?logo=node.js)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Railway](https://img.shields.io/badge/deploy-Railway-0B0D0E?logo=railway)](https://railway.com/new/github?repo=https://github.com/Crustocean/clawdia-monorepo)

Canonical monorepo for Crustocean reference agents.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/github?repo=https://github.com/Crustocean/clawdia-monorepo)

## Apps

- `apps/clawdia-agent` - Default reference autonomous agent implementation

## Quick start

```bash
git clone https://github.com/Crustocean/clawdia-monorepo.git
cd clawdia-monorepo
npm install
cp apps/clawdia-agent/.env.example apps/clawdia-agent/.env
# Edit apps/clawdia-agent/.env
npm run start:clawdia
```

## Deploy

- One click: use the Railway button above.
- Manual: Railway -> New Project -> Deploy from GitHub -> `Crustocean/clawdia-monorepo` -> service root `apps/clawdia-agent`.

## Security

- No secrets should ever be committed.
- Use app-level docs: `apps/clawdia-agent/SECURITY.md`.
