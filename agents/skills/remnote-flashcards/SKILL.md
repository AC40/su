---
name: remnote-flashcards
description: Generate RemNote-importable flashcards as Markdown, or audit and repair an existing deck. Use when the user asks to create flashcards, convert notes into RemNote format, write study cards, prepare `.md` content for RemNote import, or improve/audit flashcards they already have.
disable-model-invocation: true
---

# RemNote Flashcards

Produce RemNote-import-ready Markdown that follows evidence-based prompt-writing
practice (SuperMemo's _Twenty Rules_, Matuschak's _How to write good prompts_),
not bullet-for-bullet transcription of a source.

## Files in this skill

Read the ones a given run needs; do not read all of them by reflex.

| File                          | Read it when                                                            | Volatility   |
| ----------------------------- | ----------------------------------------------------------------------- | ------------ |
| `profile.md`                  | **Always, first.** The user's own knobs. Overrides every default below. | edited often |
| `references/quality-rules.md` | **Always** before writing or auditing cards. The named rules.           | occasionally |
| `references/patterns.md`      | While drafting — source shape → card shape recipes.                     | occasionally |
| `references/syntax.md`        | Whenever unsure about RemNote import syntax.                            | rarely       |
| `rejections.md`               | **Always** before writing. Content the user has already rejected.       | append-only  |

Precedence when two files disagree: the user's message in this conversation →
`profile.md` → `rejections.md` → `references/quality-rules.md` → everything else.

## Modes

### Create (default)

The user hands over source material and wants a deck.

1. **Strip source metadata.** Filenames, extensions, folder names, page labels,
   lecture numbers, import banners — **and the document or lecture title itself**.
   Never make a root bullet out of any of them. The first line of the deck is the
   first real concept, at indentation level 0. Stripping `10 - ` from
   `10 - Grundlagen der Anfrageverarbeitung.pdf` and keeping the rest as a root
   bullet is still a violation: it nests the whole deck one level deep and adds a
   node that carries no recall load.
2. **Read `profile.md` and `rejections.md`.** Apply the density target, language,
   and label vocabulary found there.
3. **Identify the learning goals** before writing anything. What would actually be
   asked in an exam or needed in practice? Everything else is a candidate for the
   cut list.
4. **Build a topic tree** of plain structural lines. Structural nodes are not cards.
5. **Draft cards** against `references/patterns.md`. Default to `==` basic cards.
6. **Cut before you add.** Remove low-yield microdetail first; only then consider
   densifying tightly linked facts.
7. **Run the self-check pass** (below). Non-optional.
8. **Write the `.md` file** and report the self-check counts.

### Audit

The user points at an existing deck (`audit <file>`, "fix these cards",
"improve my deck") or hands over a corrected RemNote export.

1. Read the deck and `references/quality-rules.md`.
2. Walk the rules in order, marking every violation with its rule name.
3. Produce the repaired deck as a **new file** next to the original
   (`<name>.v2.remnote.md`) unless the user asks to overwrite — never silently
   replace a deck they have already been reviewing, because RemNote review
   history is attached to the existing rems.
4. Report violations by rule name and count, with 2–3 representative before/after
   pairs. Do not paste the whole diff.

When the input is a **corrected export** rather than a raw deck, additionally
append what you learned to `rejections.md` — see the rules file for how to read
disabled separators.

## Self-check pass

After drafting and before writing the file, re-read your own draft once per rule
and fix what fails. Then report a single line:

```
Self-check — no-sets: 4 converted · answer-budget: 6 split · dedupe: 2 merged · twins: 3 pairs · two-way: 1 downgraded
```

Report zeros too (`no-sets: 0`) — a silent check is indistinguishable from a
skipped one. If a rule was deliberately overridden by `profile.md` or by the
user, name it as `overridden` rather than dropping it from the line.

**Counting cards.** Report cards, not rems. One `==` line is 1 card; one `<>`
line is 2; one `==1.` or `==A)` block is 1; a line with _n_ cloze deletions is
_n_ cards. A rem with six clozes in it is six cards against the density budget,
not one.

## Output expectations

- Always write a `.md` file. Do not dump a deck into the chat.
- No `-` bullets — those are an export artifact and break import. Indentation only.
- No explanatory prose inside the deck file unless asked.
- Outside the file, keep the accompanying message to the self-check line plus
  anything genuinely non-obvious (a syntax compromise, a section you cut and why).
- Match the language of the source unless `profile.md` or the user says otherwise.
  German means real `ä ö ü ß`, never `ae oe ue ss`.
