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

**Sliver UI** is a browser-based console for operating [Sliver](https://github.com/BishopFox/sliver) — the open-source adversary simulation and C2 framework. It speaks directly to a Sliver server over its real gRPC/RPC surface, so every action you take maps to an actual Sliver operation: session control, beacon tasking, implant generation, listener management, loot handling, SOCKS proxying, and much more.

Built with a Go backend and a React frontend, the whole product ships as a **single static binary** — the backend embeds the built UI, serving the interface and the HTTP API together with nothing else to install.

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

## Highlights

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
| Sliver    | gRPC client (`github.com/bishopfox/sliver` v1.15.x RPC)            |

Sliver UI is designed for authorized security assessments, red-team engagements, adversary simulation, research, CTFs, and isolated labs.
