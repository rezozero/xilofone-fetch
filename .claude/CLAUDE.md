# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm build          # compile TypeScript to dist/
pnpm test           # run Vitest suite (vitest run)
pnpm lint           # ESLint

# run a single test file
pnpm vitest run client.test.ts

# run tests matching a name pattern
pnpm vitest run -t "buildDownloadURL"
```

## Architecture

This is a two-file ESM TypeScript CLI package (`"type": "module"`).

**`client.ts`** — pure, exportable functions. Every function takes `baseURL` as an explicit first parameter so tests can call them directly without environment variables:
- `resolveURL(baseURL, ...paths)` — normalises and joins URL segments
- `authenticate(baseURL, user, pass)` — tries `POST /api/login_check` (v2, JSON) first; falls back to `POST /api/token` (v1, FormData) on 404; returns `{ token, isV2 }`
- `buildDownloadURL(baseURL, id, locale, isV2)` — selects the right download path per API version
- `fetchJSON<T>(response)`, `createHeaders(token)`, `getFileName(base, locale)`

**`index.ts`** — top-level script with `await` at module level (no `main()` wrapper). Reads all config from `process.env`, calls functions from `client.ts`, and writes locale JSON files via `fs-extra`.

**`@types/index.d.ts`** — global ambient type declarations (`TokenResponse`, `XilofoneFile`, `XilofoneProject`, `XilofoneMessageFile`). No `export` — available everywhere without importing.

**`client.test.ts`** — Vitest suite split into two groups:
- Unit tests (no network): `resolveURL` and `buildDownloadURL` URL-shape assertions
- Integration tests (`describe.skipIf` when `.env` vars are absent): real HTTP calls using credentials from `.env`

## API version compatibility

The library supports both Xilofone v1 and v2 via a BC layer in `authenticate()`. Version is detected once at login by probing the v2 endpoint; `isV2` is then threaded through to `buildDownloadURL`. Path differences:

| | v1 | v2 |
|---|---|---|
| Auth | `POST /api/token` (FormData) | `POST /api/login_check` (JSON) |
| Download | `GET /download/files/{id}/{locale}/translated/json` | `GET /api/download/files/{id}/{locale}/json?translated=true` |

## Environment variables

Copy `.env.sample` to `.env`. All variables are required at runtime except `XILOFONE_OUTPUT_FILE_NAME` (defaults to the file's `name` field from the API, minus extension).

| Variable | Purpose |
|---|---|
| `XILOFONE_BASE_URL` | API server root (protocol optional) |
| `XILOFONE_USERNAME` / `XILOFONE_PASSWORD` | credentials |
| `XILOFONE_FILE_ID` | numeric ID of the Xilofone file to fetch |
| `XILOFONE_OUTPUT` | directory to write locale JSON files into |
| `XILOFONE_OUTPUT_FILE_NAME` | base name for output files; use `{locale}` as placeholder |
