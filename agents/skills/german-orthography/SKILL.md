---
name: german-orthography
description: Check and fix German user-facing text where umlauts or sharp s were written as ASCII transliterations. Use when asked to audit, normalize, or fix German vowels, umlauts, ae/oe/ue/ss, ß, or German copy.
disable-model-invocation: true
---

# German Orthography

Use this skill when checking German text for ASCII transliterations that should be written directly as German characters in user-facing copy.

## Goal

Find and fix confirmed user-facing cases of:

- `ae` -> `ä`
- `oe` -> `ö`
- `ue` -> `ü`
- `ss` -> `ß`

Keep ASCII transliterations in compatibility-sensitive contexts such as IDs, URL paths, slugs, anchors, filenames, env var names, API fields, object keys used as stable identifiers, database keys, enum values, CSS selectors/classes, analytics event names, test IDs, import paths, and code symbols.

## Workflow

1. Search with `rg` first. Never read `.env` files unless the user explicitly asks.
2. Exclude dependencies, generated output, binaries, lockfiles, caches, and secrets.
3. Start with likely user-facing sources: UI components, templates, translations, Markdown/content files, emails, validation messages, labels, notifications, metadata, and documentation.
4. Treat every `ae`, `oe`, `ue`, and `ss` match as a candidate, not an automatic replacement. Inspect surrounding context before editing.
5. Fix only confirmed German user-facing text. Preserve casing where applicable: `Ae` -> `Ä`, `Oe` -> `Ö`, `Ue` -> `Ü`; use `SS` -> `ẞ` only when the surrounding German copy is intentionally all-caps and `ẞ` is appropriate.
6. Leave ambiguous candidates unchanged unless the surrounding word or phrase makes the intended German spelling clear.
7. Track skipped candidates that are intentionally left ASCII because they are slugs, URLs, IDs, code symbols, or other compatibility-sensitive values.

## Search Commands

Use targeted searches like these and adapt extensions to the repo:

```bash
rg -n --hidden --glob '!.env*' --glob '!node_modules/**' --glob '!dist/**' --glob '!build/**' --glob '!.next/**' --glob '!coverage/**' --glob '!*.lock' --glob '!package-lock.json' --glob '!pnpm-lock.yaml' --glob '!yarn.lock' -i '\b[[:alpha:]]*(ae|oe|ue|ss)[[:alpha:]]*\b'
```

For JSON/YAML translation catalogs, Markdown, and frontend files, narrow by extension when useful:

```bash
rg -n --hidden --glob '!.env*' --glob '!node_modules/**' --glob '!dist/**' --glob '!build/**' --glob '!.next/**' --glob '!coverage/**' -i '\b[[:alpha:]]*(ae|oe|ue|ss)[[:alpha:]]*\b' -- '*.json' '*.yml' '*.yaml' '*.md' '*.mdx' '*.ts' '*.tsx' '*.js' '*.jsx' '*.vue' '*.svelte' '*.html'
```

## Fixing Rules

- Replace transliterations in visible German copy, including button text, headings, paragraphs, labels, alt text, tooltips, validation errors, toast messages, email copy, SEO titles/descriptions, and content files.
- Do not replace inside URLs, route paths, slugs, anchors, filenames, imports, package names, CSS class names, IDs, test selectors, event names, API schema keys, database identifiers, enum members, or object keys whose exact ASCII spelling is part of a contract.
- Do not blindly replace substrings inside unrelated words. Examples such as `neue`, `bauen`, `Queue`, or English words may contain these sequences without representing German umlauts.
- When a value is both a user-facing label and a slug/identifier, fix the label and leave the identifier ASCII.

## Final Response

Report:

- Files changed.
- Confirmed replacements made.
- Relevant matches intentionally skipped because they were in URL path, slug, ID, code symbol, or another compatibility-sensitive context.
- Ambiguous candidates left unchanged, if any.
