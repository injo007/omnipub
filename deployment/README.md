# Enterprise Autonomous Editorial Intelligence Platform: Deployment System

This folder houses the self-hosted deployment engine, installer templates, automation playbooks, and load testing assets.

## Directory Layout

*   `install-editorial-platform.sh`: Master installation, verification, rollback and recovery orchestrator.
*   `templates/`: Active configuration blueprints for system configuration templates.
*   `tests/`: Deployment-level safety and simulation test suites.
*   `load/`: Performance assessment scripts and load definitions (e.g. via k6).

## Basic Usage

Run the master installer:
```bash
chmod +x install-editorial-platform.sh
sudo ./install-editorial-platform.sh help
```

To run a complete, non-interactive secure staging deployment:
```bash
sudo GEMINI_API_KEY="AI_KEY_REPRESENTATIVE_HERE" ./install-editorial-platform.sh install
```
