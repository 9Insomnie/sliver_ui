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
  <a href="https://github.com/9Insomnie/sliver_ui/releases">
    <img src="https://img.shields.io/github/downloads/9Insomnie/sliver_ui/total?style=flat-square" alt="Downloads">
  </a>
  <a href="https://github.com/9Insomnie/sliver_ui">
    <img src="https://img.shields.io/github/last-commit/9Insomnie/sliver_ui?style=flat-square" alt="Last Commit">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/9Insomnie/sliver_ui?style=flat-square" alt="License">
  </a>
</p>

**Sliver UI** is a browser-based console for operating [Sliver](https://github.com/BishopFox/sliver) — the open-source adversary simulation and C2 framework. It speaks directly to a Sliver server over its real gRPC/RPC surface, so every action you take maps to an actual Sliver operation: session control, beacon tasking, implant generation, listener management, loot handling, SOCKS proxying, and much more.

Built with a Go backend and a React frontend, the whole product ships as a **single static binary** — the backend embeds the built UI, serving the interface and the HTTP API together with nothing else to install.

## How it runs

On Windows the binary opens a **native WebView2 desktop window**; on Linux and macOS it runs as a plain HTTP server and opens your default browser. You can force server-only mode (no desktop window) with `--no-window`:

```text
┌──────────────────────────┐
│  Browser / WebView2      │
│  Sliver UI (React)       │
└──────────┬───────────────┘
           │  HTTP API / WebSocket
           ▼
┌──────────────────────────┐
│  Go backend server       │
│  (single binary)         │
└──────────┬───────────────┘
           │  gRPC (Sliver RPC)
           ▼
┌──────────────────────────┐
│  Sliver Server           │
│  C2 / Sessions           │
└──────────────────────────┘
```

## Connecting to a Sliver server

Sliver UI connects using a **sliver-client config file** (the `*.json` produced by Sliver). Two ways to connect:

1. **In the UI** — open **Settings**, load the config file (e.g. `local.json`), inspect the parsed operator/lhost/lport, then connect. Saved profiles can be switched with one click afterwards.
2. **At startup** — pass a profile name with `--profile <name>` and the backend connects to a saved sliver-client profile before serving the UI.

```
# generate a client config on the Sliver server (once)
sliver-client config generate operator

# then either load local.json in the UI, or launch with a saved profile
sliver-ui --profile operator
```

## Highlights

- **Desktop window (Windows)** — embedded frontend in a native WebView2 window; on other platforms it falls back to the default browser automatically.
- **Visualized dashboard** — live counts (sessions, beacons, listeners, builders, SOCKS) alongside charted breakdowns: sessions by OS, transport-mix donuts (mTLS / HTTP / DNS / WG), top hosts and recent-activity bars, auto-refreshing.
- **Sessions** — search, kill, rename, and a full detail workspace with tabs: Terminal (xterm.js over WebSocket), Execute, Files (browse/upload/download/mkdir/mv/rm), Processes (list/kill/migrate/dump), Network (ifconfig/netstat), Environment, Registry, Port Forwarding, Token Operations, Advanced Execution (shellcode, sideload, spawn-dll, exec-assembly, PsExec), Screenshot.
- **Beacons** — list, rename, remove, per-beacon task history with output, and age-based pruning of stale beacons.
- **Listeners / Jobs** — start and stop listeners (mtls / dns / wireguard / http / https).
- **Implants** — profiles, build listing, regenerate, compiler info.
- **SOCKS5 proxy** — per-session SOCKS proxies managed from the UI.
- **Loot** — browse captured files and credentials, preview content, download, one-click copy of secrets.
- **Aliases** — install extension bundles (tar.gz) and run them on any session, with automatic assembly / DLL / sideload dispatch.
- **Canaries** — DNS canary tracking with trigger state.
- **Pivots, WireGuard, Services, SSH, Extensions, MSF, Backdoor & DLL Hijack** — remote ops exposed with the same profile- and session-centric workflows as the CLI.
- **i18n** — English and 简体中文, switchable from the sidebar.

## Tech Stack

| Layer     | Stack                                                              |
| --------- | ------------------------------------------------------------------ |
| Frontend  | React 18, TypeScript, Vite 5, react-router, i18next, xterm.js, Vitest + Testing Library |
| Backend   | Go (`net/http` with method routing), WebSocket (terminal)          |
| Desktop   | WebView2 (`github.com/jchv/go-webview2`, Windows only)             |
| Sliver    | gRPC client (`github.com/bishopfox/sliver` RPC)                    |

## Usage

### Prebuilt releases

Download the matching binary from the [Releases](https://github.com/9Insomnie/sliver_ui/releases) page:

| Platform | Binary |
| -------- | ------ |
| Windows x86_64 | `sliver-ui-windows-amd64.exe` |
| Linux x86_64 / arm64 | `sliver-ui-linux-amd64` / `sliver-ui-linux-arm64` |
| macOS x86_64 / arm64 | `sliver-ui-darwin-amd64` / `sliver-ui-darwin-arm64` |

```
./sliver-ui --profile operator --no-window
```

### Flags

| Flag            | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `--addr`        | Listen address for the API server (default `0.0.0.0:8080`)         |
| `--profile`     | Sliver-client profile to connect to on startup (optional)          |
| `--no-window`   | Run as a plain HTTP server without the desktop UI window           |
| `--no-browser`  | Do not open the web UI in the default browser (server mode only)   |

When running as a GUI-subsystem binary, console output is mirrored to `sliver-ui.log` next to the binary for debugging.

## Building from source

Requires **Go** and **Node.js** (with npm).

```
# full single-binary production build
make build
./sliver-ui --addr 0.0.0.0:8080

# run the API server + Vite dev server (hot reload, frontend proxies /api)
make dev

# tests and vet
make test
make vet

# clean build artifacts
make clean
```

Or manually:

```
cd frontend && npm ci && npm run build
cp -r frontend/dist/* backend/web/dist/
cd backend && go build -o ../sliver-ui .
```

## Development

```
make dev   # backend on 0.0.0.0:8080, frontend dev server with proxy to /api
```

CI runs `go vet` + `go test` on the backend and a type-checked build + Vitest on the frontend for every push and pull request against `main`. Release binaries for all platforms are built automatically when a `v*` tag is pushed.

Sliver UI is designed for authorized security assessments, red-team engagements, adversary simulation, research, CTFs, and isolated labs.

## License

[MIT](./LICENSE)
