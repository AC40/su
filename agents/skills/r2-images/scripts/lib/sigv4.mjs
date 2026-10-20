import { createHash, createHmac } from "node:crypto";

const sha256hex = (data) => createHash("sha256").update(data).digest("hex");
const hmac = (key, data) => createHmac("sha256", key).update(data).digest();

export const EMPTY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export const hashBody = (body) =>
  body === undefined || body === null || body.length === 0
    ? EMPTY_SHA256
    : sha256hex(body);

const uriEncode = (value) =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const canonicalPath = (pathname) =>
  pathname
    .split("/")
    .map((segment) => uriEncode(decodeURIComponent(segment)))
    .join("/");

const canonicalQuery = (searchParams) =>
  [...searchParams.entries()]
    .map(([k, v]) => [uriEncode(k), uriEncode(v)])
    .sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

const amzStamps = (date = new Date()) => {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
};

/**
 * Signs an S3-compatible request with AWS SigV4 and returns the headers to send.
 * R2 uses region "auto" and service "s3".
 */
export const signRequest = ({
  method,
  url,
  headers = {},
  body,
  accessKeyId,
  secretAccessKey,
  region = "auto",
  service = "s3",
  date,
}) => {
  const target = new URL(url);
  const { amzDate, dateStamp } = amzStamps(date);
  const payloadHash = hashBody(body);

  const signed = {
    ...headers,
    host: target.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const entries = Object.entries(signed)
    .map(([k, v]) => [k.toLowerCase(), String(v).trim().replace(/\s+/g, " ")])
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));

  const canonicalHeaders = `${entries.map(([k, v]) => `${k}:${v}`).join("\n")}\n`;
  const signedHeaders = entries.map(([k]) => k).join(";");

  const canonicalRequest = [
    method,
    canonicalPath(target.pathname),
    canonicalQuery(target.searchParams),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join("\n");

  const signingKey = ["aws4_request"].reduce(
    (key, part) => hmac(key, part),
    hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), service),
  );
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    ...signed,
    authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
};
