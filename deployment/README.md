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

For a production-only deployment on a small Ubuntu 24.04 host:
```bash
sudo ./install-editorial-platform.sh install \
  --source /opt/editorial-platform/current \
  --production-only
```

Interactive installation prompts securely for `OPENROUTER_API_KEY` or `MINIMAX_API_KEY`. If PostgreSQL and vault secrets are blank, strong values are generated and saved in root-only files under `/etc/editorial-platform/`.

To migrate an existing snapshot, add:

```bash
--legacy-db /opt/editorial-platform/current/db.json
```

The import runs only against an empty production database and writes a durable migration marker. Rerunning the installer cannot overwrite populated PostgreSQL tables.

## Interrupted or incomplete installation

The installer handles `SIGINT` and `SIGTERM`, releases its lock, and preserves completed work. Rerun the same command after correcting the reported error. When `docker ps` is empty or deployment metadata is absent:

```bash
sudo tail -n 150 /var/log/editorial-platform/installer.log
sudo ./install-editorial-platform.sh status
```

A missing model key was a common cause in older runs. Export `OPENROUTER_API_KEY` or `MINIMAX_API_KEY`, or rerun interactively. Verification now fails immediately for missing containers and confirms that application readiness reports a healthy PostgreSQL backend.
