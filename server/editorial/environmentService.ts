/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["local", "test", "development", "staging", "production"]).default("local"),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  MINIMAX_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CREDENTIALS_VAULT_KEY: z.string().optional(),
  DEV_BYPASS_TOKEN: z.string().optional(),
  APP_API_TOKEN: z.string().optional(),
  AUTH_REQUIRED: z.string().optional(),
  BYPASS_AUTH: z.string().optional(),
  APP_URL: z.string().optional(),
  PGHOST: z.string().default("localhost"),
  PGPORT: z.string().default("5432"),
  PGDATABASE: z.string().default("editorial_db"),
  PGUSER: z.string().default("postgres"),
  PGPASSWORD: z.string().optional(),
  POSTGRES_REQUIRED: z.string().optional(),
  // Worker & queue configurations with safe boundaries
  WORKER_CONCURRENCY: z.preprocess((val) => val === undefined || val === null || val === "" ? 5 : parseInt(val as string, 10), z.number().min(1).max(20).default(5)),
  WORKER_LEASE_DURATION_SEC: z.preprocess((val) => val === undefined || val === null || val === "" ? 60 : parseInt(val as string, 10), z.number().min(5).max(300).default(60)),
  MAX_PUBLISHING_RETRIES: z.preprocess((val) => val === undefined || val === null || val === "" ? 5 : parseInt(val as string, 10), z.number().min(1).max(10).default(5)),
});

export type RuntimeEnvironment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, any>): RuntimeEnvironment {
  const result = EnvironmentSchema.safeParse(env);
  if (!result.success) {
    console.error("❌ Environment configuration validation failed:", result.error.format());
    throw new Error(`Environment validation failed: ${JSON.stringify(result.error.format())}`);
  }

  const parsed = result.data;

  // 1. Unknown environment name checks
  if (!["local", "test", "development", "staging", "production"].includes(parsed.NODE_ENV)) {
    throw new Error(`Unknown environment name: ${parsed.NODE_ENV}`);
  }

  // 2. Strict checks for production deployment readiness
  if (parsed.NODE_ENV === "production" || parsed.NODE_ENV === "staging") {
    // Check for missing crucial keys
    if (!parsed.PGPASSWORD || parsed.PGPASSWORD.trim() === "") {
      throw new Error(`Missing required PGPASSWORD in ${parsed.NODE_ENV} environment`);
    }
    if (!parsed.CREDENTIALS_VAULT_KEY || Buffer.byteLength(parsed.CREDENTIALS_VAULT_KEY) !== 32) {
      throw new Error(`CREDENTIALS_VAULT_KEY must be exactly 32 bytes in ${parsed.NODE_ENV} environment`);
    }
    if (!parsed.MINIMAX_API_KEY && !parsed.OPENROUTER_API_KEY) {
      throw new Error(`MINIMAX_API_KEY or OPENROUTER_API_KEY is required in ${parsed.NODE_ENV} environment`);
    }

    // Check for placeholder secrets
    const placeholders = ["MY_GEMINI_API_KEY", "your-key", "placeholder", "REPLACE_ME", "mock-key", "MY_APP_URL"];
    if (parsed.OPENROUTER_API_KEY && placeholders.some(p => parsed.OPENROUTER_API_KEY?.includes(p))) {
      throw new Error(`Placeholder secret detected for OPENROUTER_API_KEY in ${parsed.NODE_ENV}`);
    }

    // App URL format check
    if (parsed.APP_URL) {
      try {
        const url = new URL(parsed.APP_URL);
        if (parsed.NODE_ENV === "production" && url.protocol !== "https:") {
          throw new Error("Production APP_URL must be a secure HTTPS endpoint.");
        }
      } catch (err: any) {
        throw new Error(`Malformed APP_URL configured in ${parsed.NODE_ENV}: ${err.message}`);
      }
    }
  }

  // 3. Reject public exposure of server-only variables (sanity warning)
  const forbiddenPrefixes = ["VITE_GEMINI_API_KEY", "VITE_OPENROUTER_API_KEY", "VITE_MINIMAX_API_KEY"];
  for (const prefix of forbiddenPrefixes) {
    if (env[prefix]) {
      throw new Error(`Security breach: Server-only key prefix found in public configuration namespace: ${prefix}`);
    }
  }

  return parsed;
}

/**
 * Validates remote site configurations for security compliance.
 */
export function validateWordPressUrl(urlStr: string, nodeEnv: string): void {
  if (!urlStr) return;
  try {
    const url = new URL(urlStr);
    if (nodeEnv === "production" && url.protocol !== "https:") {
      throw new Error(`Security Violations: Non-SSL WordPress endpoint detected in production environment: ${urlStr}`);
    }
  } catch (err: any) {
    throw new Error(`Malformed WordPress Target URL: ${err.message}`);
  }
}
