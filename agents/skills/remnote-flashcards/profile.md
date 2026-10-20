# Profile — my knobs

This file is mine to edit. It overrides the defaults in `references/`.
The skill reads it first on every run.

To relax a rule, name it under **Rule overrides** with a reason. To turn one off
entirely, write `off`. Anything not listed here keeps its default.

---

## Language

- Match the source language. German sources → German cards, real `ä ö ü ß`.
- Keep technical terms in the form the source uses (`Blockungsfaktor`, `TID`,
  `Fan-In`) rather than translating them.
- SQL keywords stay uppercase and in backticks.

## Density

- Target: **exam-focused**, not archival. A ~40-slide lecture should land around
  40–70 cards, not 150.
- When over budget, cut by `cut-list` first. Never solve density by merging
  unrelated facts into one broad card.

## Card type mix

- `==` basic — the default, should be the large majority.
- `<>` two-way — rare, symbol/abbreviation ↔ term only.
- `===` multiline — rare, two coupled clauses only.
- `==1.` numbered — only where order is the knowledge.
- `==A)` single choice — avoid; a distractor list is usually a `no-sets` problem
  in disguise.
- `{{cloze}}` — for thresholds, constants, symbolic parts, and fixed lists.

## Prompt vocabulary

Preferred: `Warum`, `Wann`, `Wodurch`, `Welches Problem`, `Voraussetzung`,
`Problem`, `Lösung`, `Folge`, `Vorteil`, `Nachteil`, `Unterschied`, `Formel`,
`Beispiel`, `Kosten`, `Kerngedanke`.

Banned: `Einordnung`, `Effekt`, `Nutzt`, `Hinweis`, `Anmerkung`, `Allgemein`.

## File naming and location

- Write next to the source material, named `<Thema>.remnote.md`.
- Audit output: `<Thema>.v2.remnote.md` — never overwrite a deck already in
  review, since RemNote review history hangs off the existing rems.
- No filename, lecture number, or PDF title as the root bullet.

## Optional features — currently off

- **Source stamping** (SuperMemo #18): off. Turn on by writing `on` here if I
  start needing to trace cards back to slides.
- **Date stamping** (SuperMemo #19): off. This material is not volatile.
- **Personalized / emotional examples** (SuperMemo #14–15): off for technical
  subjects; they add noise to systems material.
- **Imagery and graphic deletion** (SuperMemo #6–8): not available in a
  text-import pipeline. Ignore.

## Rule overrides

*(none yet — add lines like `no-sets: off for vocabulary decks`)*

## Subject notes

### Datenbanken II

- Recurring twins to disambiguate on sight: B-Baum / B+-Baum, Primär- /
  Sekundärindex, Relationen- / Index-Scan, Selektion / Projektion, Lese- *l* /
  Schreibzugriffe *s*, KNF / DNF, logische / physische Optimierung,
  Kreuzprodukt / Verbund.
- Cost formulas are examinable: apply `formula-triple` rather than cutting.
  Algebraic equivalence rules are not cost formulas — name → shape, plus a
  condition card where one exists.
- Slide decks are bullet-heavy and repeat themselves across lectures — `dedupe`
  matters more here than usual.
