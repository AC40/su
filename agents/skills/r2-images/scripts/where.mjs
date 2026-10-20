#!/usr/bin/env node
// Resolves the current directory to an R2 destination without uploading anything.
import { parseArgs, describeTarget } from "./lib/args.mjs";
import { resolveTarget } from "./lib/resolve.mjs";

const { options } = parseArgs(process.argv.slice(2), {
  flags: ["bucket", "prefix", "cwd"],
});

const target = resolveTarget({
  cwd: options.cwd ?? process.cwd(),
  bucket: options.bucket,
  prefix: options.prefix,
});

console.log(
  JSON.stringify(
    {
      ...describeTarget(target),
      defaultGroup: target.defaultGroup,
      exampleKey: `${target.prefix}/${target.defaultGroup}/<slug>-<hash8>.<ext>`,
      exampleUrl: target.publicBase
        ? `${target.publicBase}/${target.prefix}/${target.defaultGroup}/<slug>-<hash8>.<ext>`
        : null,
      pinned: Boolean(target.projectConfigPath),
    },
    null,
    2,
  ),
);
