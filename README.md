# Sliver UI

<p align="center">
  <strong>A modern web interface for Sliver C2</strong>
</p>

<p align="center">
  <a href="https://github.com/9Insomnie/sliver_ui">
    <img src="https://img.shields.io/github/stars/9Insomnie/sliver_ui?style=flat-square" alt="GitHub Stars">
  </a>
  <a href="https://github.com/9Insomnie/sliver_ui/issues">
    <img src="https://img.shields.io/github/issues/9Insomnie/sliver_ui?style=flat-square" alt="GitHub Issues">
  </a>
  <a href="https://github.com/9Insomnie/sliver_ui">
    <img src="https://img.shields.io/github/actions/workflow/status/9Insomnie/sliver_ui/ci.yml?style=flat-square" alt="CI">
  </a>
  <a href="https://github.com/9Insomnie/sliver_ui">
    <img src="https://img.shields.io/github/last-commit/9Insomnie/sliver_ui?style=flat-square" alt="Last Commit">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/9Insomnie/sliver_ui?style=flat-square" alt="License">
  </a>
</p>

A browser-based interface for interacting with and managing [Sliver](https://github.com/BishopFox/sliver) — the open-source adversary simulation and C2 framework.

---

## Overview

**Sliver UI** is a web console that speaks to a Sliver server over its gRPC API. It is built around the real Sliver RPC surface (`sessions`, `beacons`, `jobs`, `loot`, `implants`, `socks`, `portfwd`, etc.), so everything you see maps to an actual Sliver operation.

It is intended to **complement the Sliver CLI**, not replace it. Use it for authorized security assessments, red-team engagements, labs, CTFs, and security research.

```text
             ┌──────────────────────┐
             │       Browser        │
             │   Sliver UI (React)  │
             └──────────┬───────────┘
                        │  HTTP API / WebSocket
                        ▼
             ┌──────────────────────┐
             │   Go backend server  │
             │  (single binary)     │
             └──────────┬───────────┘
                        │  gRPC (Sliver RPC)
                        ▼
             ┌──────────────────────┐
             │     Sliver Server    │
             │    C2 / Sessions     │
             └──────────────────────┘
```

The Go backend embeds the built frontend (`go:embed`), so production is a **single static binary** that serves both the UI and the API.

---

## Features

- **Dashboard** — live counts (sessions, beacons, jobs, builders, socks), active sessions, jobs and recent events, auto-refreshing.
- **Sessions** — list, search, kill, rename, and a full detail view with tabs: Terminal (xterm.js + WebSocket), Execute, Files (browse/upload/download/mkdir/mv/rm), Processes (list/kill/migrate/dump), Network (ifconfig/netstat), Environment, Registry, Port Forwarding, Token Operations, Advanced Execution (sideload/spawn-dll/exec-assembly), Screenshot.
- **Beacons** — list, rename, remove, and per-beacon task history with output.
- **Listeners / Jobs** — start listeners (mtls/dns/wireguard/http/https), stop jobs.
- **Implants** — implant profiles, build listing, regenerate, and profile management.
- **SOCKS5 proxy** — per-session SOCKS proxies managed from the UI.
- **Loot** — browse files/credentials, preview content.
- **Files (host)** — host-side file management.
- **Network / Processes** — standalone pages for netstat/ifconfig and process management.
- **Events** — live event stream.
- **Command palette** — `Ctrl+K`/`Ctrl+/` global search and navigation (pages, sessions, beacons, actions).
- **Keyboard shortcuts** — per-list refresh/search shortcuts (`R`/`T`/`F`).
- **i18n** — English and 简体中文, switchable from the sidebar.
- **Single-binary production build** + multi-platform release assets.
- **CI** — GitHub Actions runs frontend build/tests and backend vet/tests on every PR to `main`.

---

## Tech Stack

| Layer     | Stack                                                              |
| --------- | ------------------------------------------------------------------ |
| Frontend  | React 18, TypeScript, Vite 5, react-router, i18next, xterm.js, Vitest + Testing Library |
| Backend   | Go (`net/http` with method routing), WebSocket (terminal)          |
| Sliver    | gRPC client (`github.com/bishopfox/sliver` v1.15.x RPC)            |

---

## Requirements

- **Go 1.25+** — backend.
- **Node.js 20+ and npm** — frontend development only.
- A running **Sliver server**.
- Sliver client **profiles** (for the connection of your choice), typically in `~/.sliver-client/configs/<name>.json`.

---

## Quick Start (development)

The frontend dev server proxies `/api` and `/ws` to the backend on `localhost:8080`, so run both:

**Terminal 1 — backend**

```bash
cd backend
go run . --addr 0.0.0.0:8080
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

### One-command dev

```bash
make dev            # macOS / Linux
./start.ps1         # Windows PowerShell
./start.sh          # POSIX shell
```

---

## Production build (single binary)

```bash
make build
./sliver-ui --addr 0.0.0.0:8080
```

What `make build` does:

1. `npm ci && npm run build` in `frontend/`.
2. Copies `frontend/dist/*` into `backend/web/dist/`.
3. `go build` the backend, embedding the frontend via `go:embed`.

The resulting binary serves the UI at `/`, the API at `/api`, and the terminal WebSocket at `/ws` — nothing else to install or configure.

Flags:

```text
-addr "0.0.0.0:8080"   listen address
-profile "<name>"      auto-connect to a sliver-client profile on startup
```

---

## Releases

Tag a release to trigger the [release workflow](.github/workflows/release.yml):

```bash
git tag v0.1.0
git push origin v0.1.0
```

It builds the single binary for `linux/amd64`, `linux/arm64`, `windows/amd64`, `darwin/amd64` and `darwin/arm64`, then uploads the assets to a GitHub Release.

---

## Tests

```bash
make test
```

or individually:

```bash
cd frontend && npm test        # Vitest (component + unit + i18n parity)
cd backend  && go test ./...   # Go unit + handler tests
cd backend  && go vet ./...
```

---

## Project Structure

```text
sliver_ui/
├── .github/workflows/       # CI + release workflows
├── backend/
│   ├── main.go              # entrypoint (flags: -addr, -profile)
│   ├── connect.go           # profile connection helper
│   ├── internal/
│   │   ├── api/             # HTTP handlers, terminal WS, static serving
│   │   └── sliver/          # Sliver gRPC client + ops (files, socks, loot, ...)
│   └── web/                 # embedded frontend (dist is populated at build time)
├── frontend/
│   ├── src/
│   │   ├── components/      # common + session tab components
│   │   ├── pages/           # per-route pages
│   │   ├── i18n/locales/    # en.ts, zh.ts
│   │   └── lib/             # api client, types, connection state, terminal
│   ├── package.json
│   └── vite.config.ts
├── Makefile
└── start.ps1 / start.sh     # one-command dev scripts
```

---

## Configuration & Connection

Profiles are the same JSON files the Sliver client uses (`~/.sliver-client/configs/<name>.json`). Connect in the UI:

- **Settings → Saved profiles** — pick a profile to connect immediately.
- **Settings → Manual connection** — profile name + optional `LHost`/`LPort` overrides.
- Or pass `--profile <name>` to the server to auto-connect at startup.

State lives in memory; restarting Sliver UI reconnects through the UI or the `--profile` flag.

---

## Security

Sliver UI is a security tool. **Deploy and use it only where you have explicit authorization** — authorized penetration testing, red-team engagements, adversary simulation, research, CTFs, isolated labs, and internal testing.

For production or sensitive environments:

- Do not expose the Sliver server directly to the public Internet.
- Restrict access to the web interface (VPN / firewall / SSO).
- Use HTTPS/TLS in front of the UI.
- Keep Sliver and its dependencies updated.
- Never commit credentials, private keys, certificates, operator configs, or infrastructure details to the repository.

### Security Disclosure

To report a vulnerability, prefer GitHub's private security reporting. Include the affected component, reproduction steps, expected vs. actual behavior, impact, and any suggested mitigation. Do not include real-world credentials or infrastructure details.

---

## Responsible Use

By using this project you are responsible for ensuring your activities comply with applicable laws, organizational policies, rules of engagement, and authorization requirements. The maintainers do not endorse unauthorized access, persistence, data theft, or disruption of systems.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/foo`).
3. Make changes and test them (`make test`).
4. Keep the pull request focused and well-described.

Rulesets on `main` require changes to land via a pull request; force-pushes to `main` are blocked.

---

## Related Projects

- [Sliver](https://github.com/BishopFox/sliver) — the underlying adversary simulation and C2 framework.
- [Sliver UI](https://github.com/9Insomnie/sliver_ui) — this project.

---

## Disclaimer

Sliver UI is provided for authorized security testing, research, education, and adversary simulation, **as-is**, without warranty of any kind. The maintainers and contributors are not responsible for unauthorized use, damage to systems, data loss, operational disruption, or violations of applicable laws. Always obtain appropriate authorization before use.

---

## License

Sliver UI is released under the [MIT License](LICENSE).

---

## Acknowledgements

Sliver UI would not exist without the Sliver project and its contributors.

**Sliver:** https://github.com/BishopFox/sliver
