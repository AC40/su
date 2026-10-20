#!/usr/bin/env node
// Deletes objects by full bucket key. Requires --yes: public URLs may be live.
import { parseArgs } from "./lib/args.mjs";
import { resolveTarget } from "./lib/resolve.mjs";
import { deleteObject } from "./lib/s3.mjs";

const { positional, options } = parseArgs(process.argv.slice(2), {
  flags: ["bucket", "prefix", "cwd"],
  booleans: ["yes"],
});

if (positional.length === 0) {
  console.error("Usage: node scripts/rm.mjs <key> [key...] --yes");
  process.exit(1);
}

const target = resolveTarget({
  cwd: options.cwd ?? process.cwd(),
  bucket: options.bucket,
  prefix: options.prefix,
});

if (!options.yes) {
  console.error(
    [
      `Would delete from ${target.bucketName}:`,
      ...positional.map((key) => `  ${key}`),
      "",
      "Deletion is irreversible and any live public URL will 404.",
      "Re-run with --yes to confirm.",
    ].join("\n"),
  );
  process.exit(1);
}

let hadError = false;
for (const key of positional) {
  try {
    const existed = await deleteObject(target, key);
    console.log(JSON.stringify({ key, deleted: existed, missing: !existed }));
  } catch (error) {
    hadError = true;
    console.error(JSON.stringify({ key, error: error.message }));
  }
}
if (hadError) {
  process.exit(1);
}
