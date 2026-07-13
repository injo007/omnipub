# Disaster Recovery Runbook

PostgreSQL is the sole staging and production database. The supported backup path is a custom-format `pg_dump` bundled with the root-readable application configuration.

## Backup

```bash
sudo ./deployment/install-editorial-platform.sh backup
sudo ./deployment/install-editorial-platform.sh remote-backup
```

The remote policy retains 7 daily, 4 weekly, and 12 monthly encrypted snapshots.

## Restore after host loss

1. Provision Ubuntu Server 24.04 LTS.
2. Clone the release into `/opt/editorial-platform/current`.
3. Retrieve the chosen backup archive.
4. Run `sudo ./deployment/install-editorial-platform.sh restore --backup <backup-id>`.
5. Run `sudo ./deployment/install-editorial-platform.sh verify`.

The restore flow creates a safety snapshot, validates the archive in isolation, starts the PostgreSQL container, performs `pg_restore --clean --if-exists`, and restarts the application.

## PostgreSQL outage

Check `docker compose ps`, `docker logs editorial-production-db`, volume capacity, connection count, and `/api/health/readiness`. Production fails closed; it does not switch to a second database or accept writes into a local cache.
