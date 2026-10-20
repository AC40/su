---
name: r2-images
description: >-
  Hosts bulky or generated images, audio, video and PDFs on personal Cloudflare
  R2 and references the returned public URLs in code instead of committing
  binaries. Routes each project to the right bucket and client folder
  automatically. Use when adding photos, screenshots, ad creatives, generated
  assets or other large media to a repo; when the user mentions R2, object
  storage, CDN URLs, or repo image bloat.
---

# R2 media hosting

Avoid committing bulky media to git. Upload to personal R2, wire the returned
public URL into source/data files, then delete the local binary.

Two buckets, selected automatically from the project path:

| Logical | R2 bucket | Holds |
|---|---|---|
| `personal` | `ac-media-personal` | own sites, products, tools, experiments |
| `clients` | `ac-media-client` | client work, one folder per client |

Object keys are `{prefix}/{group}/{slug}-{hash8}.{ext}` — readable enough to
audit the bucket by eye, content-hashed so re-uploading identical bytes is a
no-op and URLs are safely cache-immutable.

## Policy

### Keep in the repo (commit)

- Company/client **logos** (`public/logo.svg`, `public/logo.png`)
- **Favicons** and tiny UI icons
- Small **SVG** placeholders
- Anything that must work **fully offline**, or is under ~20 KB and brand-critical

### Upload to R2 (do not commit)

- Photography, hero images, galleries, team shots
- Screenshots, ad creatives, social cards
- Audio, video, large PDFs
- Generated assets that would bloat git history

## Choosing bucket and folder

**Never guess.** Resolution runs in this order and hard-fails rather than
falling back to a default — a wrong guess publishes one client's assets under
another client's public URL.

1. Explicit `--bucket` / `--prefix` flags
2. The nearest `.r2.json`, found by walking up from cwd
3. A route in `buckets.json` matched against the absolute path
4. **Error**, listing the three ways to fix it

`.r2.json` lives in the project root, is committed (it holds no secrets), and
looks like:

```json
{ "bucket": "clients", "prefix": "evangelische-allianz/jugendallianz" }
```

Optional keys: `defaultGroup` (default `images`), `manifest` (default `true`).

On the first upload in a project with no `.r2.json`, the route-inferred
destination is **written to `.r2.json`** and reported on stderr. Directory name
often is not the client name (`pt-kuelbel.de` is the client Katrin Külbel;
`stefanrichter` is sr-leadership.de), so **check the pinned value and correct
the prefix** before committing. After that it is fixed and reviewable in a diff.

Default routes (see `buckets.json` to add more):

| Path | Bucket | Prefix |
|---|---|---|
| `~/dev/client-projects/<x>` | `clients` | `<x>` |
| `~/dev/beyond925/<x>` | `clients` | `beyond925/<x>` |
| `~/dev/websites/<x>`, `prvt`, `packages`, `extensions`, `tools`, `ml` | `personal` | `<x>` |

For a client with several projects, use a two-level prefix:
`<client>/<project>` — e.g. `remm-augenoptik/website`.

## Secret setup (one-time)

The skill lives in the shared store at `~/.agents/skills/r2-images/`; Claude Code,
Codex and Cursor all reach it through symlinks, so credentials are set once.

```bash
cp ~/.agents/skills/r2-images/.env.example ~/.agents/skills/r2-images/.env
# Fill in R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
```

Bucket names and public base URLs are not secret and live in `buckets.json`.
A bucket with an empty `publicBase` refuses to upload — the object would have
no usable URL. Set it to the bucket's `pub-<id>.r2.dev` URL (or a custom
domain) once public access is enabled in the Cloudflare dashboard.

No npm deps: the scripts sign S3 requests with Node built-ins.

## Commands

Run from inside the project so routing resolves. All output is JSON.

```bash
S=~/.agents/skills/r2-images/scripts

# Show the resolved destination without uploading
node $S/where.mjs

# Upload; prints one JSON line per file with the public url
node $S/upload.mjs public/images/filiale-aussen.jpg --group images

# Preview keys and URLs, move no bytes (works without credentials)
node $S/upload.mjs hero.png --dry-run

# List what is already in this project's prefix, optionally filtered
node $S/ls.mjs filiale
node $S/ls.mjs --all --limit 500

# Delete (irreversible; live URLs will 404)
node $S/rm.mjs remm-augenoptik/website/images/old-9f3a1c2d.jpg --yes
```

Upload flags: `--group`, `--name`, `--bucket`, `--prefix`, `--dry-run`,
`--no-pin`, `--no-manifest`, `--force`.

Successful upload prints:

```json
{"name":"filiale-aussen.jpg","url":"https://.../remm-augenoptik/website/images/filiale-aussen-9f3a1c2d.jpg","key":"...","sha256":"...","bytes":204813,"reused":false}
```

Use the `url` field in code.

## Manifest

Each upload is recorded in `.r2-manifest.json` in the project root (key, url,
original local path, sha256, size, date), sorted for clean diffs. Once the
local binary is deleted this is the only local record of what a URL points at —
grep it to find an existing asset before re-uploading. Disable per project with
`"manifest": false` in `.r2.json`, or per run with `--no-manifest`.

## Agent checklist

1. Classify each file: **repo** vs **R2**
2. Run `where.mjs` and confirm the bucket and client folder are right
3. If it just pinned a new `.r2.json`, sanity-check the client name in the prefix
4. Upload; paste each returned `url` into the data/source file
5. **Delete** the local binaries — do not commit them
6. Verify: `curl -sI "<url>" | head -1`
