import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Master Bash Installer Unit Checks", () => {
  const scriptPath = path.resolve(__dirname, "../install-editorial-platform.sh");

  it("should exist and be readable", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("should expose the required help commands without spawning a sandboxed shell", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    const helpStart = content.indexOf("function show_help()");
    const helpEnd = content.indexOf("function validate_application_source()", helpStart);
    const help = content.slice(helpStart, helpEnd);
    expect(help).toContain("Usage:");
    expect(help).toContain("install");
    expect(help).toContain("verify");
    expect(help).toContain("rollback");
    expect(help).toContain("configure-backup");
  });

  it("should contain clean error trap logic and strict execution shell directives", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("set -Eeuo pipefail");
    expect(content).toContain("trap cleanup_lock EXIT");
    expect(content).toContain("handle_interrupt SIGINT 130");
    expect(content).toContain("handle_interrupt SIGTERM 143");
  });

  it("should prevent double lock execution", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("LOCK_FILE=");
    expect(content).toContain("acquire_lock");
  });

  it("should warn, rather than reject, when production-only disk space is below the recommended target", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("Production-only recommends ${MIN_PRODUCTION_DISK_GB} GB free disk");
    expect(content).not.toContain("Production-only requires at least ${MIN_PRODUCTION_CPU} CPU, ${MIN_PRODUCTION_RAM_MB} MB RAM, and ${MIN_PRODUCTION_DISK_GB} GB free disk");
  });
});
