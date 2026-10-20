#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { parseArgs, describeTarget } from "./lib/args.mjs";
import {
  pinProjectConfig,
  relativeToProject,
  requirePublicBase,
  resolveTarget,
  sanitizeSegment,
} from "./lib/resolve.mjs";
import { writeManifest } from "./lib/manifest.mjs";

const mimeByExt = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};

const usage = [
  "Usage: node scripts/upload.mjs <file> [file...] [options]",
  "",
  "Options:",
  "  --group <name>     folder under the project prefix (default: images)",
  "  --name <slug>      override the filename slug (single file only)",
  "  --bucket <logical> override the resolved bucket (personal|clients)",
  "  --prefix <path>    override the resolved project prefix",
  "  --dry-run          print planned keys and URLs, upload nothing",
  "  --no-pin           do not write .r2.json when resolved from a route",
  "  --no-manifest      do not record uploads in .r2-manifest.json",
  "  --force            re-upload even if the key already exists",
].join("\n");

const { positional, options } = parseArgs(process.argv.slice(2), {
  flags: ["group", "name", "bucket", "prefix", "cwd"],
  booleans: ["dry-run", "no-pin", "no-manifest", "force"],
});

if (positional.length === 0) {
  console.error(usage);
  process.exit(1);
}

const files = positional.map((f) => resolve(f));
for (const file of files) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }
}
if (options.name && files.length > 1) {
  console.error("--name applies to a single file only.");
  process.exit(1);
}

const target = resolveTarget({
  cwd: options.cwd ?? process.cwd(),
  bucket: options.bucket,
  prefix: options.prefix,
});
const publicBase = requirePublicBase(target);
const group = sanitizeSegment(options.group ?? target.defaultGroup);

const planned = files.map((file) => {
  const bytes = readFileSync(file);
  const ext = extname(file).toLowerCase();
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const slug =
    sanitizeSegment(options.name ?? basename(file, extname(file))) || "asset";
  const key = `${target.prefix}/${group}/${slug}-${sha256.slice(0, 8)}${ext}`;
  return {
    file,
    bytes,
    sha256,
    key,
    contentType: mimeByExt[ext] ?? "application/octet-stream",
    url: `${publicBase}/${key}`,
  };
});

if (options.dryRun) {
  console.log(
    JSON.stringify(
      {
        target: describeTarget(target),
        uploads: planned.map((p) => ({
          name: basename(p.file),
          key: p.key,
          url: p.url,
          bytes: p.bytes.length,
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

// Imported lazily so --dry-run works before credentials are configured.
const { headObject, putObject } = await import("./lib/s3.mjs");

if (!options.noPin) {
  const pinned = pinProjectConfig(target);
  if (pinned) {
    console.error(
      `Pinned destination -> ${pinned} (bucket=${target.logicalBucket} prefix=${target.prefix}). Review and commit it.`,
    );
  }
}

const uploadedAt = new Date().toISOString();
const records = [];
let hadError = false;

for (const item of planned) {
  const name = basename(item.file);
  try {
    const existing = options.force ? null : await headObject(target, item.key);
    if (!existing) {
      await putObject(target, item.key, item.bytes, {
        contentType: item.contentType,
        // Safe because the key embeds a content hash: new bytes -> new key.
        cacheControl: "public, max-age=31536000, immutable",
      });
    }
    records.push({
      key: item.key,
      url: item.url,
      file: relativeToProject(item.file, target.projectRoot) ?? name,
      sha256: item.sha256,
      bytes: item.bytes.length,
      uploadedAt,
    });
    console.log(
      JSON.stringify({
        name,
        url: item.url,
        key: item.key,
        sha256: item.sha256,
        bytes: item.bytes.length,
        reused: Boolean(existing),
      }),
    );
  } catch (error) {
    hadError = true;
    console.error(JSON.stringify({ name, error: error.message }));
  }
}

if (records.length > 0 && target.manifest && !options.noManifest) {
  const path = writeManifest(target.projectRoot, target, records);
  console.error(`Manifest updated -> ${path}`);
}

if (hadError) {
  process.exit(1);
}
