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
    <img src="https://img.shields.io/github/last-commit/9Insomnie/sliver_ui?style=flat-square" alt="Last Commit">
  </a>
  <a href="https://github.com/9Insomnie/sliver_ui">
    <img src="https://img.shields.io/github/license/9Insomnie/sliver_ui?style=flat-square" alt="License">
  </a>
</p>

<p align="center">
  A browser-based interface for interacting with and managing <a href="https://github.com/BishopFox/sliver">Sliver</a>.
</p>

---

## Overview

**Sliver UI** is a web-based interface built around the [Sliver C2 framework](https://github.com/BishopFox/sliver).

Sliver is a powerful open-source adversary simulation and C2 framework. While its CLI provides extensive functionality, a graphical interface can make day-to-day operations easier to visualize and manage.

Sliver UI aims to provide a clean and intuitive interface for authorized security assessments, red-team engagements, labs, CTFs, and security research.

```text
                         ┌──────────────────────┐
                         │      Sliver UI       │
                         │      Web Client      │
                         └──────────┬───────────┘
                                    │
                                    │ API / RPC
                                    ▼
                         ┌──────────────────────┐
                         │    Sliver Server     │
                         │        C2            │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             Implants           Sessions         Listeners
```

## Features

### Dashboard

A centralized interface for viewing the current Sliver environment and its operational state.

### Session Management

Manage and inspect active Sliver sessions through a graphical interface.

### Implant Management

View and work with Sliver implants without relying exclusively on the command-line interface.

### Listener Management

Interact with the configured Sliver listeners from a unified web interface.

### Web-based Workflow

Access the management interface through a browser instead of maintaining multiple terminal sessions.

### Sliver Integration

Designed around the Sliver ecosystem rather than attempting to replace Sliver itself.

---

## Screenshots

> Screenshots can be added here as the UI evolves.

```text
docs/
└── screenshots/
    ├── dashboard.png
    ├── sessions.png
    └── implants.png
```

Example:

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Sliver UI Dashboard" width="900">
</p>

---

## Requirements

Before running Sliver UI, make sure your environment provides the dependencies required by the project.

Typical requirements include:

- Node.js
- npm / pnpm / yarn
- A running Sliver server
- Network connectivity between Sliver UI and the Sliver server

Check the project's package configuration for the exact runtime versions supported by the current release.

---

## Installation

### Clone the repository

```bash
git clone https://github.com/9Insomnie/sliver_ui.git
cd sliver_ui
```

### Install dependencies

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

### Configure the application

If the project provides an environment template:

```bash
cp .env.example .env
```

Then edit the configuration:

```bash
nano .env
```

Configure the connection details required by your Sliver environment.

---

## Development

Start the development server:

```bash
npm run dev
```

The application should then be available through the development server URL printed by the application.

For projects using pnpm:

```bash
pnpm dev
```

---

## Production Build

Build the application:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```

The exact production commands may vary depending on the framework and package scripts used by the current version.

---

## Configuration

Configuration should be kept outside of the source code whenever possible.

A typical deployment may require settings similar to:

```env
SLIVER_HOST=127.0.0.1
SLIVER_PORT=31337
```

> The actual environment variables supported by the current version should be taken from the project's configuration files and `.env.example`.

Never commit:

- Sliver credentials
- Private keys
- Certificates
- Operator configuration
- C2 infrastructure details
- Production secrets

to a public repository.

---

## Usage

A typical workflow looks like this:

```text
1. Start Sliver Server
        │
        ▼
2. Start Sliver UI
        │
        ▼
3. Open the Web Interface
        │
        ▼
4. Connect to Sliver
        │
        ▼
5. Manage Sessions / Implants / Listeners
```

Sliver UI is intended to complement the Sliver CLI rather than replace it.

For advanced Sliver functionality, operators should continue to use the official Sliver client and documentation.

---

## Project Structure

The project structure may change as development progresses. A typical layout is:

```text
sliver_ui/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── ...
├── package.json
├── README.md
└── ...
```

Refer to the repository itself for the authoritative project structure.

---

## Architecture

Sliver UI follows a separation between the user interface and the Sliver infrastructure.

```text
┌─────────────────────────────────────────┐
│                Browser                  │
│                                         │
│              Sliver UI                  │
└────────────────────┬────────────────────┘
                     │
                     │ Application API
                     ▼
┌─────────────────────────────────────────┐
│              UI Backend                 │
│                                         │
│  Authentication / API / Sliver Client   │
└────────────────────┬────────────────────┘
                     │
                     │ RPC / API
                     ▼
┌─────────────────────────────────────────┐
│             Sliver Server               │
│                                         │
│     C2 / Sessions / Implants / Jobs     │
└─────────────────────────────────────────┘
```

This architecture allows the UI layer to evolve independently while keeping Sliver as the underlying C2 framework.

---

## Security

Sliver UI is a security tool.

It should only be deployed and used in environments where you have explicit authorization.

Appropriate use cases include:

- Authorized penetration testing
- Red-team engagements
- Adversary simulation
- Security research
- CTF competitions
- Isolated security laboratories
- Internal security testing

Do **not** use this project to access, control, or compromise systems without authorization.

### Deployment Recommendations

For production or sensitive environments:

- Do not expose the Sliver server directly to the public Internet.
- Restrict access to the web interface.
- Use HTTPS/TLS.
- Use strong authentication.
- Keep Sliver and its dependencies updated.
- Store credentials and private keys securely.
- Restrict network access using firewalls or VPNs.
- Monitor access logs.
- Do not expose management interfaces unnecessarily.

---

## Security Disclosure

If you discover a security vulnerability in Sliver UI, please avoid publicly disclosing the issue before the maintainers have had an opportunity to investigate it.

Open a private security report through GitHub's available security reporting mechanisms when possible.

When reporting a vulnerability, include:

- Affected component
- Reproduction steps
- Expected behavior
- Actual behavior
- Impact assessment
- Relevant logs or screenshots
- Suggested mitigation, if available

Please do not include real-world target credentials, secrets, or sensitive infrastructure information in public issues.

---

## Responsible Use

Sliver UI is developed for legitimate security operations and research.

By using this project, you are responsible for ensuring that your activities comply with:

- Applicable laws
- Organizational policies
- Rules of engagement
- Scope restrictions
- Authorization requirements

The maintainers do not endorse unauthorized access, persistence, data theft, or disruption of systems.

---

## Contributing

Contributions are welcome.

Before opening a pull request:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Keep the pull request focused.
6. Provide a clear description of the change.

Example:

```bash
git checkout -b feature/my-feature

git add .

git commit -m "feat: add my feature"

git push origin feature/my-feature
```

Then open a pull request against the main repository.

---

## Development Guidelines

When contributing to Sliver UI:

- Keep security-sensitive code easy to review.
- Avoid hard-coded credentials.
- Do not commit secrets.
- Keep dependencies up to date.
- Prefer small, focused changes.
- Document non-obvious behavior.
- Test changes before submitting a pull request.

---

## Related Projects

### Sliver

The underlying adversary simulation and C2 framework:

https://github.com/BishopFox/sliver

### Sliver UI

This project:

https://github.com/9Insomnie/sliver_ui

---

## Disclaimer

Sliver UI is provided for authorized security testing, research, education, and adversary simulation.

The software is provided **as-is**, without warranty of any kind.

The maintainers and contributors are not responsible for:

- Unauthorized use
- Damage to systems or infrastructure
- Data loss
- Operational disruption
- Misuse of the software
- Violations of applicable laws or regulations

Always obtain appropriate authorization before using Sliver UI against systems you do not own.

---

## License

See the [`LICENSE`](LICENSE) file for the license applicable to this project.

---

## Acknowledgements

Sliver UI would not exist without the work of the Sliver project and its contributors.

Special thanks to the Sliver community for building and maintaining an open-source adversary simulation framework.

**Sliver:**
https://github.com/BishopFox/sliver

---

<p align="center">
  <strong>Sliver UI</strong>
  <br>
  Web interface for Sliver C2
</p>

<p align="center">
  <a href="https://github.com/9Insomnie/sliver_ui">GitHub</a>
  ·
  <a href="https://github.com/9Insomnie/sliver_ui/issues">Issues</a>
</p>
