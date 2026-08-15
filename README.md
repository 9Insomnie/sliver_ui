# Sliver UI

<p align="center">
  <strong>A modern web & desktop interface for Sliver C2</strong>
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
  <a href="https://github.com/9Insomnie/sliver_ui/releases">
    <img src="https://img.shields.io/github/downloads/9Insomnie/sliver_ui/total?style=flat-square" alt="Downloads">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/9Insomnie/sliver_ui?style=flat-square" alt="License">
  </a>
</p>

**Sliver UI** is a graphical console for operating [Sliver](https://github.com/BishopFox/sliver) — the open-source adversary simulation / C2 framework. The backend acts as a **Sliver client**: it authenticates to a Sliver server over its native gRPC/RPC surface and exposes the operations through an HTTP API, while the frontend (React) renders them in a browser or a native desktop window.

Everything ships as a **single static binary** — the built frontend is embedded into the Go backend (`go:embed`), so there is nothing else to install.

```text
┌───────────────────────────────┐
│  Browser / WebView2 window    │
│  Sliver UI (React + xterm.js) │
└──────────────┬────────────────┘
               │  HTTP API / WebSocket
               ▼
┌───────────────────────────────┐
│  Go backend  (sliver client)  │
│  embedded frontend + API      │
└──────────────┬────────────────┘
               │  gRPC / RPC (mTLS + token)
               ▼
┌───────────────────────────────┐
│  Sliver Server                │
│  sessions · beacons · jobs    │
└───────────────────────────────┘
```

## Running the app

- **Windows** — starts in a native **WebView2 desktop window** (1440×900). Use `--no-window` to run as a plain HTTP server instead.
- **Linux / macOS** — runs as an HTTP server and opens the default browser automatically.

```
# plain server mode (any OS)
sliver-ui --no-window --addr 0.0.0.0:8080
```

| Flag           | Description                                                       |
| -------------- | ----------------------------------------------------------------- |
| `--addr`       | HTTP listen address (default `0.0.0.0:8080`)                       |
| `--profile`    | Connect to a saved Sliver profile at startup (optional)            |
| `--no-window`  | Run as an HTTP server, skip the desktop window                     |
| `--no-browser` | Don't open the browser (server mode only)                          |

When running as a GUI-subsystem binary the console log is mirrored to `sliver-ui.log` next to the binary.

## Connecting to a Sliver server

Sliver UI connects like `sliver-client` would, using a **client config file** — the `*.json` profile generated for an operator. Connection can be done either in the UI or at startup.

```
# on the Sliver server, generate a config for an operator (once)
sliver-client config generate <operator>      # -> local.json
```

1. **From the UI (Settings page):**
   - Click "load config file" and pick `local.json`. The file is parsed and the operator / lhost / lport are shown for confirmation, then **Connect**.
   - After the first connection the profile is also available as a **saved profile** — any profile under `~/.sliver-client/configs/` (or the `SLIVER_CLIENT_CONFIGS` path list) can be switched to with one click.
2. **At startup:** pass the profile name — `sliver-ui --profile <operator>` — and the backend connects before serving the UI.

Once connected the UI stays in sync with the server; all operational data (sessions, beacons, loot, hosts…) lives on the Sliver server, and the backend itself is stateless.

## Features

### Sidebar: six sections

| Section    | Pages                                                        |
| ---------- | ------------------------------------------------------------ |
| Operations | Dashboard, Sessions, Beacons, Listeners                      |
| Payloads   | Implants, SOCKS5                                             |
| Tasking    | Jobs, Tasks, Loot, Canaries, Aliases                         |
| Host       | Processes, Network, Files                                    |
| Analysis   | Hosts, Websites, Events                                      |
| System     | Settings                                                     |

Sidebar entries carry **live count badges** (sessions, beacons, listeners, jobs, implants, socks) and can be **favorited** into a pinned section; the sidebar collapses on narrow screens.

### Dashboard

Live overview polling: stat cards (sessions / beacons / listeners / builders / SOCKS), donut charts (sessions by OS, transport mix: mTLS / HTTP / DNS / WireGuard), top-hosts and recent-activity bars, plus a recent-activity feed and tables of active sessions and listeners.

### Sessions

Session list with search / sort / inline rename / kill / prune, and a **detail workspace with 13 tabs**:

- **Terminal** — full-screen `xterm.js` shell over a binary WebSocket (`/ws/sessions/{id}/terminal`; resize-aware frame protocol)
- **Files** — browse, upload, download, view, mkdir, mv, rm
- **Processes** — list, kill, migrate, process dump
- **Network** — `ifconfig` interfaces and `netstat` connections
- **Env** — get / set / unset environment variables
- **Exec** — run a command and stream output
- **Screenshot** — capture the remote screen
- **Port Forward** — TCP port forwarding per session
- **Registry** — Windows registry subkeys / values / read / write / create / delete
- **Advanced** — execute-assembly, sideload, spawn-dll, MSF (inject / remote handler), session reconfigure
- **Tokens** — impersonate, make-token, rev2self, getsystem, run-as, whoami, privs, execute-token
- **WireGuard** — WG client config, port forwards and SOCKS servers over WireGuard
- **Pivots & Services** — pivot listeners (with graph), Windows service start/stop/remove, SSH command, extension list/register/call

Session properties panel: ID, hostname, user, OS/arch, transport, remote address, last check-in, active C2, agent version, plus inline Ping / Rename / Kill / Close.

### Beacons

Beacon list with rename, monitor on/off, removal, age-based **prune**, per-beacon **task history** with decoded output, and "open session" to convert a beacon into an interactive session.

### Implants & Listeners

- **Implants** — full generation form (OS: win/linux/darwin/freebsd, arch, format: exe/shared/shellcode, C2: mTLS/HTTP/HTTPS/DNS/WireGuard, interval/jitter, evasion, obfuscate, limit-domain-joined), saved **implant profiles**, build list with download / regenerate / delete, compiler info, registered operators.
- **Listeners** — start/stop C2 listeners: mTLS, HTTP(S), DNS, WireGuard.
- **Jobs** — active jobs table with stop action.

### Loot, Canaries, Aliases

- **Loot** — captured files & credentials (filter by type), add / rename / remove, view content, download, one-click copy of secrets.
- **Canaries** — DNS canary tracking with burned / clean filter.
- **Aliases** — install extension bundles (`.tar.gz`), remove, and run any alias on a session (args, process, arch, method, class).

### Host, Analysis, SOCKS

- **Processes / Network / Files** — same session tabs in page form with a session picker, for cross-session workflows.
- **Hosts** — host database learned from server events, with per-host **IOC** management.
- **Websites** — static site hosting: add/remove sites and manage their content.
- **Events** — server event stream (session / beacon / listener) with type filters.
- **SOCKS5** — start per-session SOCKS5 proxies (optional bind address / port / auth), stop, list.

### UI extras

Dark theme, **i18n (English / 简体中文)** toggle in the sidebar footer, toasts, animated page transitions, offline banner while disconnected.

## Tech stack

| Layer     | Stack                                                        |
| --------- | ------------------------------------------------------------ |
| Frontend  | React 18, TypeScript, Vite 5, react-router, i18next, xterm.js, Vitest + Testing Library |
| Backend   | Go 1.25, `net/http` with method routing, WebSocket terminal |
| Desktop   | WebView2 (`github.com/jchv/go-webview2`, Windows only)       |
| Sliver    | `github.com/bishopfox/sliver` v1.7.3 gRPC client (mTLS + token auth) |

## Building from source

Requires Go and Node.js.

```
# one-shot production build (frontend build + copy into embed dir + Go build)
make build
./sliver-ui --no-window

# dev mode: Go API on :8080 + Vite dev server on :5173 (proxies /api and /ws)
make dev

# tests and vet
make test
make vet

# clean build artifacts (frontend/dist, embedded dist, binary)
make clean
```

Prebuilt binaries for **Windows, Linux and macOS (amd64 + arm64)** are attached to every [release](https://github.com/9Insomnie/sliver_ui/releases); CI runs backend `go vet` + `go test` and a type-checked frontend build + Vitest on every push/PR to `main`.

## License

[MIT](./LICENSE)

*Sliver UI is intended for authorized security assessments, red-team engagements, adversary simulation, research, CTFs, and isolated labs only.*
