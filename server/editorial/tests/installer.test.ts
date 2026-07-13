import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const installer = fs.readFileSync(path.join(root, "deployment/install-editorial-platform.sh"), "utf8");
const dockerignore = fs.readFileSync(path.join(root, ".dockerignore"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

describe("Ubuntu installer packaging contract", () => {
  it("builds only from the validated staged source directory", () => {
    expect(installer).toContain('validate_application_source "$SOURCE_DIR"');
    expect(installer).toContain('-f "${SOURCE_DIR}/Dockerfile" "$SOURCE_DIR"');
    expect(installer).not.toContain("docker build -t editorial-platform:production -f Dockerfile .");
  });

  it("starts PostgreSQL and performs legacy migration before application startup", () => {
    const databaseStart = installer.indexOf('up -d db');
    const migration = installer.indexOf("migrate_legacy_database_if_needed", databaseStart);
    const applicationStart = installer.indexOf('up -d --remove-orphans', migration);
    expect(databaseStart).toBeGreaterThan(-1);
    expect(migration).toBeGreaterThan(databaseStart);
    expect(applicationStart).toBeGreaterThan(migration);
  });

  it("bundles the migration executable into the production build", () => {
    expect(packageJson.scripts.build).toContain("dist/migrate-json-to-postgres.cjs");
    expect(installer).toContain("node dist/migrate-json-to-postgres.cjs");
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
