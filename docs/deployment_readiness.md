# Ubuntu 24.04 Deployment Readiness

Staging and production run as isolated Docker Compose stacks on Ubuntu Server 24.04 LTS. Each stack contains the Node.js application, PostgreSQL 16, and a Caddy reverse proxy on private Docker networks.

## Required production values

* `NODE_ENV=production`
* `POSTGRES_REQUIRED=true`
* `PGHOST=db`, `PGPORT=5432`, `PGDATABASE`, `PGUSER`, and a strong `PGPASSWORD`
* Exactly 32 bytes in `CREDENTIALS_VAULT_KEY`
* `OPENROUTER_API_KEY` or `MINIMAX_API_KEY` for MiniMax-M3
* HTTPS `APP_URL`

PostgreSQL has no published host port. Secrets live in `/etc/editorial-platform/production.env` with mode `0600`; WordPress credentials are encrypted before database persistence.

## Release gate

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `bash -n deployment/install-editorial-platform.sh`
6. Start PostgreSQL first and, during a first cutover, import the snapshot with `--legacy-db` before either application starts.
7. Verify both in-container `/api/health/readiness` responses report `database.backend=postgresql` and `database.pg.ok=true`.
8. Promote the same image to production and create a verified `pg_dump` backup.
