# PostgreSQL Backup and Restore Runbook

Production data lives in the private `editorial-production-db` PostgreSQL 16 container and the `pg-data` Docker volume.

## Create a backup

Use the Ubuntu 24.04 installer so configuration and the database are captured together:

```bash
sudo ./deployment/install-editorial-platform.sh backup
```

The installer runs `pg_dump --format custom --no-owner`, copies the dump out of the container, packages it with the root-readable configuration, and stores the archive under `/opt/editorial-platform/backups`.

## Restore

```bash
sudo ./deployment/install-editorial-platform.sh restore --backup <backup-id>
```

Restore first creates a safety backup, validates the archive in a temporary directory, starts PostgreSQL, runs `pg_restore --clean --if-exists --no-owner`, restarts the application, and executes health verification.

## Manual verification

```bash
docker exec editorial-production-db pg_isready -U postgres -d editorial_db
docker exec editorial-production-db psql -U postgres -d editorial_db -c 'SELECT count(*) FROM articles;'
curl -fsS https://publish.example.com/api/health/readiness
```

Keep at least 7 daily, 4 weekly, and 12 monthly encrypted remote snapshots. Test a restore on an isolated host at least quarterly.
