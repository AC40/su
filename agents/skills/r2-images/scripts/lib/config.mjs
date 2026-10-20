import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const skillRoot = resolve(__dirname, "..", "..");
export const envPath = resolve(skillRoot, ".env");
export const bucketsPath = resolve(skillRoot, "buckets.json");

export const fail = (lines) => {
  console.error(Array.isArray(lines) ? lines.join("\n") : lines);
  process.exit(1);
};

export const loadEnvFile = (path = envPath) => {
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

export const requireCredentials = () => {
  loadEnvFile();
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    fail([
      "Missing R2 credentials.",
      "",
      `Create ${envPath} with:`,
      "  R2_ACCOUNT_ID=<cloudflare account id>",
      "  R2_ACCESS_KEY_ID=<r2 s3 access key id>",
      "  R2_SECRET_ACCESS_KEY=<r2 s3 secret access key>",
      "",
      "See .env.example in the skill directory.",
    ]);
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    // Explicit override for local testing / S3-compatible hosts. Otherwise the
    // endpoint is derived per bucket, since jurisdiction is a bucket property.
    endpointOverride:
      (process.env.R2_ENDPOINT?.trim() || process.env.R2_S3_API_URL?.trim() || "")
        .replace(/\/$/, "") || null,
  };
};

export const loadBuckets = () => {
  if (!existsSync(bucketsPath)) {
    fail(`Missing bucket registry: ${bucketsPath}`);
  }
  try {
    return JSON.parse(readFileSync(bucketsPath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${bucketsPath}: ${error.message}`);
  }
};
