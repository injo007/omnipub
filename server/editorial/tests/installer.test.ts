import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const installer = fs.readFileSync(path.join(root, "deployment/install-editorial-platform.sh"), "utf8");
const dockerignore = fs.readFileSync(path.join(root, ".dockerignore"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

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
});
