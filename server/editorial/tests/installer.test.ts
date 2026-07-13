import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const installer = fs.readFileSync(path.join(root, "deployment/install-editorial-platform.sh"), "utf8");
const dockerignore = fs.readFileSync(path.join(root, ".dockerignore"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const migrationScript = fs.readFileSync(path.join(root, "scripts/migrate-json-to-postgres.ts"), "utf8");
const ciWorkflow = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
const productionCompose = fs.readFileSync(path.join(root, "compose.production.yml"), "utf8");

describe("Ubuntu installer packaging contract", () => {
  it("builds only from the validated staged source directory", () => {
    expect(installer).toContain('validate_application_source "$SOURCE_DIR"');
    expect(installer).toContain('-f "${SOURCE_DIR}/Dockerfile" "$SOURCE_DIR"');
    expect(installer).not.toContain("docker build -t editorial-platform:production -f Dockerfile .");
  });

  it("starts PostgreSQL and performs legacy migration before application startup", () => {
    const databaseStart = installer.indexOf('up -d db');
    const roleReconciliation = installer.indexOf("reconcile_managed_postgres_credentials", databaseStart);
    const schemaBootstrap = installer.indexOf("initialize_postgres_schema", databaseStart);
    const migration = installer.indexOf("migrate_legacy_database_if_needed", databaseStart);
    const applicationStart = installer.indexOf('up -d --remove-orphans', migration);
    expect(databaseStart).toBeGreaterThan(-1);
    expect(roleReconciliation).toBeGreaterThan(databaseStart);
    expect(schemaBootstrap).toBeGreaterThan(roleReconciliation);
    expect(schemaBootstrap).toBeGreaterThan(databaseStart);
    expect(migration).toBeGreaterThan(schemaBootstrap);
    expect(migration).toBeGreaterThan(databaseStart);
    expect(applicationStart).toBeGreaterThan(migration);
  });

  it("pins the managed PostgreSQL identity and verifies authenticated health", () => {
    const collectConfigStart = installer.indexOf("function collect_config()");
    const templatesStart = installer.indexOf("function write_embedded_templates()", collectConfigStart);
    const collectConfig = installer.slice(collectConfigStart, templatesStart);
    expect(collectConfig).toContain('local pg_user="postgres"');
    expect(collectConfig).toContain('local pg_database="editorial_db"');
    expect(collectConfig).toContain('local pg_host="db"');
    expect(collectConfig).not.toContain("Enter PostgreSQL Username");
    expect(collectConfig).not.toContain("Enter PostgreSQL Database Name");
    expect(installer).toContain("function reconcile_managed_postgres_credentials()");
    expect(installer).toContain("ALTER ROLE postgres WITH LOGIN PASSWORD");
    expect(installer).toContain('^[A-Za-z0-9_-]{16,128}$');
    expect(installer).toContain("will be synchronized with the private managed PostgreSQL role");
    expect(installer).toContain("psql --host 127.0.0.1 --username postgres --dbname editorial_db");
    expect(productionCompose).toContain('$${POSTGRES_PASSWORD}');
    expect(productionCompose).toContain("--command 'SELECT 1'");
  });

  it("bundles the migration executable into the production build", () => {
    expect(packageJson.scripts.build).toContain("dist/migrate-json-to-postgres.cjs");
    expect(installer).toContain("node dist/migrate-json-to-postgres.cjs");
    expect(migrationScript).toContain('command === "--init-only"');
    expect(installer).toContain("node dist/migrate-json-to-postgres.cjs --init-only");
  });

  it("records deployment metadata only after schema and readiness gates", () => {
    const productionStart = installer.indexOf('Starting Production Stack via Docker Compose');
    const appHealthGate = installer.indexOf('wait_for_container_health "editorial-production-app" 180', productionStart);
    const readinessGate = installer.indexOf('application_reports_postgres_ready "editorial-production-app"', appHealthGate);
    const metadataWrite = installer.indexOf('cat <<EOF > "${BASE_DIR}/metadata/deployment.json"', readinessGate);
    expect(appHealthGate).toBeGreaterThan(productionStart);
    expect(readinessGate).toBeGreaterThan(appHealthGate);
    expect(metadataWrite).toBeGreaterThan(readinessGate);
    expect(installer).toContain('"schema_initialized": true');
    expect(installer).toContain('"health_verified": true');
  });

  it("prints container exit, OOM, restart, and recent-log diagnostics", () => {
    expect(installer).toContain("function report_container_failure()");
    expect(installer).toContain("oom_killed={{.State.OOMKilled}}");
    expect(installer).toContain("docker logs --tail 120");
  });

  it("runs schema bootstrap and production readiness against PostgreSQL 16 in CI", () => {
    expect(ciWorkflow).toContain("postgres:16-alpine");
    expect(ciWorkflow).toContain("node dist/migrate-json-to-postgres.cjs --init-only");
    expect(ciWorkflow).toContain("Verify Production Runtime PostgreSQL Readiness");
    expect(ciWorkflow).toContain('TEST_POSTGRES: true');
    expect(ciWorkflow).toContain('database?.backend !== "postgresql"');
  });

  it("keeps credentials, repository metadata, and legacy data out of Docker builds", () => {
    expect(dockerignore).toMatch(/^\.git$/m);
    expect(dockerignore).toMatch(/^\.env$/m);
    expect(dockerignore).toMatch(/^db\.json$/m);
  });

  it("requires application readiness to report a healthy PostgreSQL backend", () => {
    expect(installer).toContain('database?.backend !== "postgresql"');
    expect(installer).toContain("database?.pg?.ok !== true");
  });

  it("fails immediately when verification is requested before containers exist", () => {
    expect(installer).toContain('if [[ "$status" == "missing" ]]');
    expect(installer).toContain("The installation did not reach deployment");
  });

  it("supports interruption recovery and production-only sizing", () => {
    expect(installer).toContain("handle_interrupt SIGINT 130");
    expect(installer).toContain("--production-only");
    expect(installer).toContain('DEPLOY_STAGING=false');
  });

  it("keeps optional remote backup credentials out of application installation", () => {
    const collectConfigStart = installer.indexOf("function collect_config()");
    const templatesStart = installer.indexOf("function write_embedded_templates()", collectConfigStart);
    const collectConfig = installer.slice(collectConfigStart, templatesStart);
    expect(collectConfig).not.toContain("Remote Encrypted Cloud Backup Setup");
    expect(collectConfig).not.toContain("AWS_ACCESS_KEY_ID");
    expect(installer).toContain('"configure-backup")');
    expect(installer).toContain("REMOTE_BACKUP_ENABLED");
    expect(installer).toContain("require_remote_backup_config");
  });

  it("recovers malformed vault keys only for incomplete deployments", () => {
    expect(installer).toContain('if [[ ! -f "${BASE_DIR}/metadata/deployment.json" ]]');
    expect(installer).toContain("A new 32-character key was generated");
    expect(installer).toContain("will not rotate this encryption key automatically");
  });

  it("documents the former missing-model-key failure and recovery", () => {
    expect(readme).toContain("Configure OPENROUTER_API_KEY or MINIMAX_API_KEY");
    expect(readme).toContain("Website times out and `docker ps` is empty");
    expect(readme).toContain("Leaving AWS or Restic unset cannot stop deployment");
    expect(readme).toContain("configure-backup");
  });
});
