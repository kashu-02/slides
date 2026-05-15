# Marp Presentations

Server-rendered Marp presentation slides using Hono, Marp Core, GitHub Actions, and Cloudflare Workers.

## Overview

This repository contains slide decks written in Marp Markdown. A build script scans `slides/`, generates a TypeScript manifest for the worker bundle, and the Hono app renders each deck on demand through `@marp-team/marp-core`.

## Repository Layout

```text
slides/
  <presentation>/
    slide.md
    fig/
server/
  app.ts
  routes/
  generated/
scripts/
  build-all.js
.github/workflows/
  deploy.yml
wrangler.jsonc
```

## Local Development

Install dependencies:

```bash
npm install
```

Generate the worker manifest:

```bash
npm run build
```

Run the worker locally:

```bash
npm run dev
```

## Presentation Source Rules

- Canonical presentation source lives in `slides/<slug>/slide.md`
- Public URLs stay flat: `/<slug>/`
- Assets should live under `slides/<slug>/fig/`
- `.unlisted` and `unlisted: true` hide a deck from `/` but do not disable direct access

## Runtime Routes

- `/` renders the presentation index
- `/<presentation>/` renders a slide deck through Marp Core
- `/<presentation>/fig/...` serves deck assets

## Deployment

The GitHub Actions workflow builds the manifest on every push and pull request. Pushes to `main` and `create-ci-cd` deploy the worker through Wrangler.

Required secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Worker configuration lives in `wrangler.jsonc`.
