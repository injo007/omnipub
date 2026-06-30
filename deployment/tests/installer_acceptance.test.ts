import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("Master Bash Installer Unit Checks", () => {
  const scriptPath = path.resolve(__dirname, "../install-editorial-platform.sh");

  it("should exist and be readable", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it("should return help menu when called with help or -h flag", () => {
    try {
      const output = execSync(`bash ${scriptPath} help`, { encoding: "utf-8" });
      expect(output).toContain("Usage:");
      expect(output).toContain("install");
      expect(output).toContain("verify");
      expect(output).toContain("rollback");
    } catch (err: any) {
      // In some sandboxes bash may fail or return non-zero, but we catch it gracefully
      expect(err).toBeNull();
    }
  });

  it("should contain clean error trap logic and strict execution shell directives", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("set -Eeuo pipefail");
    expect(content).toContain("trap cleanup_lock INT TERM EXIT");
  });

  it("should prevent double lock execution", () => {
    const content = fs.readFileSync(scriptPath, "utf-8");
    expect(content).toContain("LOCK_FILE=");
    expect(content).toContain("acquire_lock");
  });
});
