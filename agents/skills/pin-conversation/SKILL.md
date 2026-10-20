---
name: pin-conversation
description: Pin the current conversation (or a specific result from it) into Craft via the acraft CLI — write the content to today's daily note and index a dated, summarized link in the "Pinned AI Conversations" doc. Use when the user says "pin this", "pin this conversation/result", "save this to Craft", or similar.
argument-hint: "Optional: what to pin / a short title"
disable-model-invocation: true
---

# Pin a conversation into Craft

Persist a conversation or a specific result into the user's Craft space with two moves:

1. **Write the content as a sub-page** inside **today's daily note** (a nested `page` block — it stays collapsed so it never bloats the daily note; this is the durable copy).
2. **Index it** in the **"Pinned AI Conversations"** doc as one dated, summarized line that links straight to that sub-page.

Everything runs through the `acraft` CLI (a thin wrapper over the Craft API). The fixed IDs and exact commands are below — use them directly, don't rediscover them.

## Fixed values (already discovered — do not re-probe)

| Thing | Value |
| --- | --- |
| Connection (active) | `personal` (`full_space`) — no `--connection` flag needed |
| Space ID | `e880ddd5-9bf9-ecb7-4b1a-a0eaeb4bfcbe` |
| "Pinned AI Conversations" page ID | `B63480D9-A7A4-4A49-9600-5E17F278F97C` |
| Today's daily note | fetch by date — see step 1 |
| Internal link format | `[label](block://<blockId>)` |

`acraft` outputs JSON by default. Every response has `"ok": true/false`; inserted/returned blocks are under `.data.items` (insert) or `.data` (get). Check `ok` before proceeding.

## Steps

### 0. Compose the content and a summary

- Decide **what** to pin: the whole conversation distilled, or the one result the user pointed at. If ambiguous, ask.
- Write a **concise summary** (one line, ≤ ~120 chars) for the index entry.
- Pick a short **title**.
- Get the timestamp: `date "+%Y-%m-%d %H:%M"` and today's date `date +%F`.

### 1. Write the content as a sub-page in today's daily note

Get today's daily note page ID (the daily note is addressed by date, not by a stored ID):

```bash
DATE=$(date +%F)
DN=$(acraft blocks get --query "date=$DATE" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['id'])")
```

Create **one** `page` block (a sub-document) with all the conversation content nested inside its `content` array, appended to the **end** of the daily note. This is a single insert call — the sub-page's `markdown` is its title, and everything under it stays collapsed inside the sub-page. `textStyle` accepts `h1`–`h4`/`body` (omit for normal text); `listStyle` accepts `bullet`/`toggle`. Markdown inside `markdown` is rendered (links, bold, lists, code):

```bash
INSERT_OUTPUT=$(acraft blocks insert --body "$(python3 -c '
import json
title = "TITLE HERE"
content = [
  {"type":"text","textStyle":"h2","markdown":"Summary"},
  {"type":"text","markdown":"MULTILINE\nCONTENT / RESULT IN MARKDOWN"},
  # add as many blocks as you like — they all live inside the sub-page
]
page = {"type":"page","markdown":"🤖 " + title, "content":content}
print(json.dumps({"blocks":[page],"position":{"pageId":"'"$DN"'","position":"end"}}))
')")
```

**The sub-page's own ID is the link anchor** — it comes back as `.data.items[0].id`:

```bash
ANCHOR=$(echo "$INSERT_OUTPUT" | python3 -c "import sys,json;print(json.load(sys.stdin)['data']['items'][0]['id'])")
```

> Building the body with `python3 -c` (as above) is the safe way to embed multi-line markdown and quotes into JSON.
>
> If the content is large, you can instead create the empty sub-page first, then append content into it with a second `acraft blocks insert` targeting `{"pageId":"<sub-page id>","position":"end"}`. The one-shot nested form above is preferred.

### 2. Index it in the "Pinned AI Conversations" doc

Append one line linking to the sub-page, with date/time + summary:

```bash
STAMP=$(date "+%Y-%m-%d %H:%M")
ENTRY="- $STAMP · [TITLE HERE](block://$ANCHOR) — SUMMARY HERE"
acraft blocks insert --body "$(python3 -c '
import json,sys
print(json.dumps({
  "blocks":[{"type":"text","listStyle":"bullet","markdown":sys.argv[1]}],
  "position":{"pageId":"B63480D9-A7A4-4A49-9600-5E17F278F97C","position":"end"}
}))
' "$ENTRY")"
```

### 3. Confirm

Report to the user: the title, that it's a sub-page in today's daily note, and that the indexed link is in "Pinned AI Conversations". Include the summary line you wrote.

## Command reference

- **Fetch daily note by date:** `acraft blocks get --query "date=YYYY-MM-DD"` → `.data.id` is the page ID, `.data.content[]` the blocks.
- **Fetch any page/block:** `acraft blocks get --query "id=<blockId>"`.
- **Insert blocks:**
  `acraft blocks insert --body '{"blocks":[<block>,...],"position":<position>}'`
  - `position` is one of:
    - `{"pageId":"<id>","position":"start"|"end"}` — at start/end of a page
    - `{"siblingId":"<blockId>","position":"before"|"after"}` — relative to a sibling
    - or the string `"start"`/`"end"` (rarely useful — no target)
  - text block shape: `{"type":"text","markdown":"...","textStyle":"h1|h2|h3|h4|body"?,"listStyle":"bullet|toggle"?}`
  - **page (sub-document) block:** `{"type":"page","markdown":"<title>","content":[<block>,...]}` — nesting children under `content` builds a collapsed sub-page in one call. Its returned `.id` is a normal block/page ID you can link to and insert more into.
  - returns created blocks with real IDs under `.data.items`.
- **Delete blocks (to fix a mistake):** `acraft blocks delete --yes --body '{"blockIds":["<id>",...]}'`. Deleting a `page` block removes the whole sub-page and its nested content.
- **Search documents:** `acraft documents search --query "include=<text>"` (needs at least one `include` or `regexp` term).

## Notes & gotchas

- The active connection is `personal`. If `acraft` errors with `capability_not_supported` for `daily_notes.*`, that's expected — daily notes on this `full_space` connection are reached via `blocks get --query "date=..."`, **not** `daily-notes search`.
- Links: inserting `[x](craftdocs://open?spaceId=...&blockId=<id>)` is auto-normalized to `[x](block://<id>)`; just use `block://<id>` directly.
- Craft interprets markdown on insert (e.g. `__x__` → bold). Escape or avoid stray `_`/`*` if you need them literal.
- Don't re-probe the schema on every run — the IDs above are stable. Only re-discover if a command starts failing with a validation error.
