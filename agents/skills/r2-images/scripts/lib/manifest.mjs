import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export const MANIFEST_FILE = ".r2-manifest.json";

const manifestPath = (projectRoot) => resolve(projectRoot, MANIFEST_FILE);

export const readManifest = (projectRoot) => {
  const path = manifestPath(projectRoot);
  if (!existsSync(path)) {
    return { assets: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return { ...parsed, assets: parsed.assets ?? {} };
  } catch {
    return { assets: {} };
  }
};

/** Keys are written sorted so re-uploads produce minimal, reviewable diffs. */
export const writeManifest = (projectRoot, target, entries) => {
  const path = manifestPath(projectRoot);
  const current = readManifest(projectRoot);
  const assets = { ...current.assets };
  for (const entry of entries) {
    assets[entry.key] = {
      url: entry.url,
      file: entry.file,
      sha256: entry.sha256,
      bytes: entry.bytes,
      uploadedAt: entry.uploadedAt,
    };
  }
  const sorted = Object.fromEntries(
    Object.keys(assets)
      .sort()
      .map((key) => [key, assets[key]]),
  );
  writeFileSync(
    path,
    `${JSON.stringify(
      { bucket: target.logicalBucket, prefix: target.prefix, assets: sorted },
      null,
      2,
    )}\n`,
  );
  return path;
};
