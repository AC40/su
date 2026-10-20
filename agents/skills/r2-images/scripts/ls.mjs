#!/usr/bin/env node
// Lists objects under the resolved project prefix (or --prefix / --all).
import { parseArgs, describeTarget } from "./lib/args.mjs";
import { resolveTarget } from "./lib/resolve.mjs";
import { listObjects } from "./lib/s3.mjs";

const { positional, options } = parseArgs(process.argv.slice(2), {
  flags: ["bucket", "prefix", "cwd", "limit", "grep"],
  booleans: ["all"],
});

const target = resolveTarget({
  cwd: options.cwd ?? process.cwd(),
  bucket: options.bucket,
  prefix: options.prefix,
});

const prefix = options.all ? "" : target.prefix;
const pattern = options.grep ?? positional.join(" ").trim();

const objects = await listObjects(target, prefix, {
  limit: Number(options.limit ?? 200),
});

const filtered = pattern
  ? objects.filter((o) => o.key.toLowerCase().includes(pattern.toLowerCase()))
  : objects;

console.log(
  JSON.stringify(
    {
      target: describeTarget(target),
      searchedPrefix: prefix || "(entire bucket)",
      query: pattern || null,
      count: filtered.length,
      objects: filtered.map((o) => ({
        ...o,
        url: target.publicBase ? `${target.publicBase}/${o.key}` : null,
      })),
    },
    null,
    2,
  ),
);
