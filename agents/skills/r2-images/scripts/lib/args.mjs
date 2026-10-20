export const parseArgs = (argv, { flags = [], booleans = [] } = {}) => {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (booleans.includes(name)) {
      options[camel] = true;
      continue;
    }
    if (flags.includes(name)) {
      options[camel] = argv[++i];
      continue;
    }
    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }
  return { positional, options };
};

export const describeTarget = (target) => ({
  bucket: target.logicalBucket,
  r2Bucket: target.bucketName,
  endpoint: target.endpoint,
  prefix: target.prefix,
  publicBase: target.publicBase || null,
  projectRoot: target.projectRoot,
  resolvedFrom: target.source,
});
