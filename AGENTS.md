# AGENTS.md

Sliver UI: React + Vite frontend (`frontend/`) and Go backend (`backend/`, module `sliverui`) that acts as a Sliver C2 client (gRPC mTLS) and serves the built frontend via `go:embed`. There is no root `go.mod` or `package.json` — run commands from the correct subdirectory (or use the Makefile from the root).

## Commands (from repo root use `make`)
- `make dev` — backend `go run . --addr 0.0.0.0:8080` + Vite dev server on :5173. Vite proxies `/api` and `/ws` to :8080, so UI work uses the Vite server.
- `make build` — `npm ci && npm run build`, copy `frontend/dist` into `backend/web/dist`, then `go build`. This is the only path that produces the single binary with the real UI embedded.
- `make test` — frontend `vitest run` + backend `go test ./...`.
- `make vet` — `go vet ./...` in `backend/`.
- Backend single test: `go test ./internal/sliver -run <TestName>` (from `backend/`).
- Frontend single test: `npx vitest run <file>` (from `frontend/`).
- Frontend typecheck is part of `npm run build` (`tsc` with `noEmit`); there is no separate typecheck script. `tsconfig` is strict with `noUnusedLocals`/`noUnusedParameters`.

## Gotchas
- `backend/web/dist` is gitignored (only `.gitkeep` is committed) but `backend/web/web.go` embeds it (`//go:embed all:dist`), and Go requires the dir to contain at least one file. A fresh checkout builds (thanks to `.gitkeep`) but `go run .` serves an empty UI. For UI work always use `make dev`, never `go run .` alone.
- `backend/vendor/` is a local, untracked directory (not committed). Go will silently build against it. If you change dependencies, run `go mod tidy && go mod vendor` in `backend/`; do not commit `vendor/`.
- Backend tests need no live Sliver server: handlers without a client return 503 and tests assert on that (see `internal/api/handlers_test.go`, `routes_test.go`).
- i18n: every UI string must be added to both `frontend/src/i18n/locales/en.ts` and `zh.ts` — a vitest test (`i18n.test.ts`) fails if the key structures diverge.
- Terminal WebSocket (`/ws/sessions/{id}/terminal`) uses a custom binary frame `[msgType][4-byte BE len][payload]` with types 0x01 data / 0x02 resize / 0x03 close. Keep `backend/internal/api/terminal.go` and `frontend/src/lib/terminal.ts` in sync.
- Windows builds are GUI-subsystem (no console); logs are mirrored to `sliver-ui.log`. The WebView2 window (`ui_windows.go`) is Windows-only — `ui_other.go` (`!windows`) serves via HTTP. Respect the build tags on these files.
- Sliver client profiles are read from `~/.sliver-client/configs/*.json` or the `SLIVER_CLIENT_CONFIGS` path list (`internal/sliver/client.go`).

## CI
- `.github/workflows/ci.yml` runs on push/PR to `main`: frontend `npm ci && npm run build && npm test`, backend `go vet ./... && go test ./...` (Node 20, Go version from `go.mod`).
- `.github/workflows/release.yml` runs on `v*` tags and cross-builds 5 OS/arch combos with `CGO_ENABLED=0` (`-H=windowsgui` on Windows).
