import { requireCredentials } from "./config.mjs";
import { signRequest } from "./sigv4.mjs";

const creds = requireCredentials();

// `bucket` is the resolved target: { bucketName, endpoint }.
const objectUrl = (bucket, key) =>
  `${bucket.endpoint}/${bucket.bucketName}/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

const send = async (method, url, { headers = {}, body } = {}) => {
  const payload = body === undefined ? undefined : Buffer.from(body);
  const signed = signRequest({
    method,
    url,
    headers,
    body: payload,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
  });
  return fetch(url, { method, headers: signed, body: payload });
};

export const headObject = async (bucket, key) => {
  const response = await send("HEAD", objectUrl(bucket, key));
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`HEAD ${key} failed: ${response.status} ${response.statusText}`);
  }
  return {
    size: Number(response.headers.get("content-length") ?? 0),
    etag: response.headers.get("etag"),
  };
};

export const putObject = async (bucket, key, body, { contentType, cacheControl } = {}) => {
  const headers = { "content-type": contentType ?? "application/octet-stream" };
  if (cacheControl) {
    headers["cache-control"] = cacheControl;
  }
  const response = await send("PUT", objectUrl(bucket, key), { headers, body });
  if (!response.ok) {
    throw new Error(
      `PUT ${key} failed: ${response.status} ${response.statusText}\n${await response.text()}`,
    );
  }
};

export const deleteObject = async (bucket, key) => {
  const response = await send("DELETE", objectUrl(bucket, key));
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `DELETE ${key} failed: ${response.status} ${response.statusText}\n${await response.text()}`,
    );
  }
  return response.status !== 404;
};

const tagValues = (xml, tag) => {
  const matches = xml.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"));
  return [...matches].map((m) => m[1]);
};

export const listObjects = async (bucket, prefix, { limit = 1000 } = {}) => {
  const results = [];
  let token = null;
  do {
    const url = new URL(`${bucket.endpoint}/${bucket.bucketName}`);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("max-keys", String(Math.min(limit - results.length, 1000)));
    if (prefix) {
      url.searchParams.set("prefix", prefix);
    }
    if (token) {
      url.searchParams.set("continuation-token", token);
    }
    const response = await send("GET", url.toString());
    const xml = await response.text();
    if (!response.ok) {
      throw new Error(`LIST failed: ${response.status} ${response.statusText}\n${xml}`);
    }
    for (const chunk of xml.split("<Contents>").slice(1)) {
      results.push({
        key: tagValues(chunk, "Key")[0],
        size: Number(tagValues(chunk, "Size")[0] ?? 0),
        lastModified: tagValues(chunk, "LastModified")[0],
      });
    }
    token =
      tagValues(xml, "IsTruncated")[0] === "true"
        ? tagValues(xml, "NextContinuationToken")[0]
        : null;
  } while (token && results.length < limit);
  return results.slice(0, limit);
};
