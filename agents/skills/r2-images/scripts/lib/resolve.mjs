import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";
import { fail, loadBuckets, requireCredentials } from "./config.mjs";

/**
 * R2 endpoints are jurisdiction-scoped: an EU-jurisdiction bucket is only
 * reachable at <account>.eu.r2.cloudflarestorage.com and returns 403 on the
 * default host. Per-bucket "jurisdiction" or a full "endpoint" wins over the
 * global R2_ENDPOINT / R2_S3_API_URL override.
 */
const endpointFor = (entry) => {
  const { accountId, endpointOverride } = requireCredentials();
  if (entry.endpoint) {
    return entry.endpoint.replace(/\/$/, "");
  }
  if (entry.jurisdiction) {
    return `https://${accountId}.${entry.jurisdiction}.r2.cloudflarestorage.com`;
  }
  return endpointOverride ?? `https://${accountId}.r2.cloudflarestorage.com`;
};

export const PROJECT_CONFIG = ".r2.json";
const HOME = homedir();

const GERMAN_TRANSLITERATION = {
  "\u00e4": "ae",
  "\u00f6": "oe",
  "\u00fc": "ue",
  "\u00df": "ss",
};

/** "Filiale Au\u00dfen" -> "filiale-aussen": German umlauts transliterate the way
 *  German does it, remaining diacritics are stripped via NFD. */
export const sanitizeSegment = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[\u00e4\u00f6\u00fc\u00df]/g, (c) => GERMAN_TRANSLITERATION[c])
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

export const sanitizePrefix = (value) =>
  String(value)
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("/");

/** Converts a route glob ("dev/client-projects/*") into a regex anchored at $HOME. */
const routeMatcher = (pattern) => {
  const body = pattern
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment === "**"
        ? "(.+)"
        : segment === "*"
          ? "([^/]+)"
          : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${HOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/${body}(?:/|$)`);
};

const applyTemplate = (template, captures) =>
  template.replace(/\{(\d+)\}/g, (_, index) => captures[Number(index) - 1] ?? "");

/** Walks up from `start` looking for a committed .r2.json; stops at $HOME. */
const findProjectConfig = (start) => {
  let dir = start;
  while (true) {
    const candidate = resolve(dir, PROJECT_CONFIG);
    if (existsSync(candidate)) {
      return { dir, path: candidate };
    }
    const parent = dirname(dir);
    if (parent === dir || dir === HOME) {
      return null;
    }
    dir = parent;
  }
};

const readProjectConfig = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${path}: ${error.message}`);
  }
};

/**
 * Resolves cwd -> { bucket, prefix } using, in order:
 *   1. explicit --bucket / --prefix overrides
 *   2. the nearest committed .r2.json
 *   3. the route table in buckets.json
 *   4. hard failure -- never a silent default, so a stray cwd cannot publish
 *      one client's assets under another client's public prefix.
 */
export const resolveTarget = ({ cwd = process.cwd(), bucket, prefix } = {}) => {
  const registry = loadBuckets();
  const start = resolve(cwd);

  let source = "flags";
  let projectRoot = start;
  let logicalBucket = bucket ?? null;
  let bucketPrefix = prefix ?? null;
  let projectConfig = null;
  let projectConfigPath = null;

  const found = findProjectConfig(start);
  if (found) {
    projectConfig = readProjectConfig(found.path);
    projectRoot = found.dir;
    projectConfigPath = found.path;
    logicalBucket = logicalBucket ?? projectConfig.bucket;
    bucketPrefix = bucketPrefix ?? projectConfig.prefix;
    source = bucket || prefix ? "flags+project-config" : "project-config";
  }

  if (!logicalBucket || !bucketPrefix) {
    for (const route of registry.routes ?? []) {
      const match = routeMatcher(route.match).exec(start);
      if (!match) {
        continue;
      }
      const captures = match.slice(1);
      logicalBucket = logicalBucket ?? route.bucket;
      bucketPrefix = bucketPrefix ?? applyTemplate(route.prefix, captures);
      if (!found) {
        projectRoot = match[0].replace(/\/$/, "");
        source = bucket || prefix ? "flags+route" : "route";
      }
      break;
    }
  }

  if (!logicalBucket || !bucketPrefix) {
    fail([
      `Cannot determine an R2 destination for ${start}.`,
      "",
      "No --bucket/--prefix given, no .r2.json found walking up to $HOME,",
      "and no route in buckets.json matches this path.",
      "",
      "Fix by either:",
      `  1. writing ${PROJECT_CONFIG} in the project root:`,
      '     { "bucket": "clients", "prefix": "<client>/<project>" }',
      "  2. passing --bucket <logical> --prefix <path> explicitly",
      "  3. adding a route to the skill's buckets.json",
      "",
      `Known buckets: ${Object.keys(registry.buckets ?? {}).join(", ") || "(none)"}`,
    ]);
  }

  const bucketEntry = registry.buckets?.[logicalBucket];
  if (!bucketEntry) {
    fail([
      `Unknown bucket "${logicalBucket}".`,
      `Known buckets: ${Object.keys(registry.buckets ?? {}).join(", ") || "(none)"}`,
    ]);
  }

  return {
    source,
    projectRoot,
    projectConfigPath,
    logicalBucket,
    bucketName: bucketEntry.name,
    endpoint: endpointFor(bucketEntry),
    publicBase: (bucketEntry.publicBase ?? "").replace(/\/$/, ""),
    prefix: sanitizePrefix(bucketPrefix),
    defaultGroup: projectConfig?.defaultGroup ?? registry.defaultGroup ?? "images",
    manifest: projectConfig?.manifest ?? registry.manifest ?? true,
  };
};

/** Fails before any bytes move, so an unreachable object is never created. */
export const requirePublicBase = (target) => {
  // The S3 API host needs a signed request on every GET: pasting such a URL into
  // source yields HTTP 400 InvalidArgument in a browser, so reject it up front.
  if (/\.r2\.cloudflarestorage\.com/.test(target.publicBase)) {
    fail([
      `Bucket "${target.logicalBucket}" has an S3 API URL as its publicBase:`,
      `  ${target.publicBase}`,
      "",
      "That endpoint requires SigV4 auth on every request, so the URL would be",
      "dead in a browser. publicBase must be a public URL:",
      "",
      "  - Cloudflare dashboard -> R2 -> the bucket -> Settings -> Public access",
      "    -> Allow Access, which yields https://pub-<id>.r2.dev",
      "  - or attach a custom domain",
      "",
      `Then set buckets.${target.logicalBucket}.publicBase in the skill's buckets.json.`,
    ]);
  }
  if (!target.publicBase) {
    fail([
      `Bucket "${target.logicalBucket}" (${target.bucketName}) has no publicBase.`,
      "",
      "Uploading would produce an object with no usable URL, so this is a hard stop.",
      "Enable public access on the bucket in the Cloudflare dashboard, then set",
      `  buckets.${target.logicalBucket}.publicBase`,
      "in the skill's buckets.json to the r2.dev URL (or a custom domain).",
    ]);
  }
  return target.publicBase;
};

/** Pins a route-inferred destination so later runs are deterministic and reviewable. */
export const pinProjectConfig = (target) => {
  if (target.projectConfigPath) {
    return null;
  }
  const path = resolve(target.projectRoot, PROJECT_CONFIG);
  writeFileSync(
    path,
    `${JSON.stringify({ bucket: target.logicalBucket, prefix: target.prefix }, null, 2)}\n`,
  );
  return path;
};

export const relativeToProject = (filePath, projectRoot) => {
  const abs = resolve(filePath);
  return abs.startsWith(projectRoot + sep) ? abs.slice(projectRoot.length + 1) : null;
};
