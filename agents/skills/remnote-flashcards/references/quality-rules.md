# Quality rules

Named rules. Each is independently overridable in `profile.md` by its name.
Every rule carries a bad → good pair drawn from real decks so the fix is
unambiguous.

Grounding: SuperMemo, *Twenty Rules of Formulating Knowledge*; Andy Matuschak,
*How to write good prompts*. A good prompt is **focused** (one detail),
**precise** (one reading), **consistent** (same answer every time),
**tractable** (~90% recall), and **effortful** (real retrieval, not inference).

---

## `no-sets`

Never make one card whose answer is an unordered collection of three or more
peers. This is the hardest possible thing to recall and it fails inconsistently:
miss one element and the whole card fails, differently each time.

`===` is legitimate only for **two tightly coupled clauses** that form one
mechanism, or for a genuinely ordered sequence (then use `==1.`).

Convert a set by one of:

- **Cued singles** — give each element its own prompt with a discriminating cue.
- **Cloze over a fixed list** — keep the list in one rem, clozed element by
  element, so the visual order stays stable across repetitions.
- **Cut** — if the elements are not individually examinable, keep only the
  contrast that matters and drop the rest.

```
✗  Vorteile des B+-Baums gegenüber dem B-Baum ===
       Effizientere Änderungsoperationen, besonders Löschen
       Geringere Baumhöhe, weil innere Knoten mehr Schlüssel aufnehmen
       Effiziente Bereichsanfragen durch verkettete Blattebene

✓  Warum sind Bereichsanfragen im B+-Baum effizienter als im B-Baum? == Die Blattebene ist verkettet und kann sequenziell traversiert werden
✓  Warum ist die Baumhöhe im B+-Baum geringer? == Innere Knoten tragen keine Nutzdaten und fassen dadurch mehr Schlüssel
✓  Welche Änderungsoperation profitiert im B+-Baum am deutlichsten? == Löschen, da kein Element aus einem Blatt für einen inneren Knoten nachgezogen werden muss
```

Enumerations that genuinely are ordered (procedures, ranked priorities) use
`==1.` and stay whole only if short. A procedure with more than ~5 steps gets
split by `procedure-decomposition` in `patterns.md`.

---

## `answer-budget`

An answer is one clause, roughly ≤ 12 words. Two facts are two cards. This is a
check, not a preference — count the facts, not the words, when in doubt.

```
✗  Kerngedanke == Dynamischer, balancierter Mehrwegeindexbaum, bei dem Indexeinträge auf Seiten der Hauptdatei zeigen
✓  Wie viele Wege hat ein B-Baum-Knoten? == Mehrere — er ist ein Mehrwegebaum, kein binärer
✓  Worauf zeigen die Indexeinträge eines B-Baums? == Auf Seiten der Hauptdatei

✗  Seitenzugriffe bei $10^6$ Sätzen und $m=50$ == $\log_{50}(10^6) \approx 4$; mit gepufferter Wurzel typischerweise 3
✓  Seitenzugriffe bei $10^6$ Sätzen und $m=50$ == $\approx 4$
✓  Warum genügen in der Praxis 3 statt 4 Seitenzugriffe? == Die Wurzelseite liegt permanent im Puffer
```

A trailing clause that is never tested ("…, was in der Praxis selten vorkommt")
is not an answer, it is a note. Cut it or make it its own card.

---

## `no-giveaway`

The answer's key word must not appear in the prompt, and the prompt must not be
answerable by inference alone. Watch for two failure shapes:

- **Echo** — the prompt names the thing it asks about.
- **Tautology** — the answer restates the question in other words.

```
✗  Warum hohler Baum? == Die inneren Knoten enthalten keine Nutzdaten
✓  Was enthalten die inneren Knoten eines B+-Baums? == Nur Suchschlüssel und Zeiger, keine Nutzdaten

✗  Warum wird ein B-Baum nicht vollständig ausgeglichen? == Weil vollständiges Ausgleichen zu teuer wäre
✓  Welche Eigenschaft opfert das B-Baum-Kriterium zugunsten billiger Änderungen? == Gleiche Eintragszahl je Knoten; garantiert wird nur die Mindestbelegung
```

Also avoid **binary prompts** (ja/nein, richtig/falsch). They are answerable at
50% by guessing and test nothing. Reframe as "how" or "why".

Keep prompts short for the same reason: a long, distinctive prompt is recognized
as a pattern rather than retrieved from memory.

---

## `twin-check`

Interference between near-identical items is the largest cause of forgetting in
a mature collection. Before finishing, list the concept pairs in the deck that
could plausibly be confused, and for each pair:

1. Write **one explicit contrast card** naming the discriminating property.
2. Add a **disambiguating cue** to both members' prompts so neither can be
   answered with the twin's content.

Typical twins in this material: B-Baum / B+-Baum, Primär- / Sekundärindex,
Relationen- / Index-Scan, Selektion / Projektion, Lesezugriffe *l* /
Schreibzugriffe *s*, KNF / DNF, logische / physische Optimierung.

```
✓  Unterschied Relationen-Scan und Index-Scan == Der Relationen-Scan liest in beliebiger Reihenfolge und nutzt Blockung, der Index-Scan liest in Sortierreihenfolge
```

The contrast card is the *only* legitimate place where an answer may hold two
facts, because the two halves are one comparison.

### Precedence over `dedupe` — decide before you write all three

`twin-check` asks for a contrast card; `dedupe` forbids restating a fact.
Resolve the conflict by asking whether each concept has substance **beyond**
the contrast:

- **Contrast card only** when the discriminating property *is* the whole
  definition. Two definitions plus a contrast that concatenates them is three
  cards competing over one fact — exactly the interference `dedupe` prevents.
- **All three cards** only when each concept carries content the comparison does
  not — its own mechanism, cost, failure mode, or use condition.

```
✗  Konjunktive Normalform (KNF) == Konjunktion von Disjunktionen einfacher Prädikate
✗  Disjunktive Normalform (DNF) == Disjunktion von Konjunktionen einfacher Prädikate
✗  Unterschied KNF und DNF == KNF: Und über Oder-Klauseln, DNF: Oder über Und-Klauseln
✓  Unterschied KNF und DNF == KNF ist eine Konjunktion von Disjunktionen, DNF eine Disjunktion von Konjunktionen

✓  (alle drei berechtigt) B-Baum und B+-Baum: jeder hat eigene Struktur-, Kosten- und
   Löschkarten; die Kontrastkarte trägt zusätzlich die Unterscheidung
```

Same test applies to `Operatorbaum / Zugriffsplan`, `lexikalische /
syntaktische Analyse`, `logische / physische Optimierung` — all definition-only
twins, all one card each.

---

## `dedupe`

One fact, one card. A fact already taught by a card may not reappear as an
element of another card's answer.

```
✗  Balancierter Suchbaum > Definition == Alle Pfade von der Wurzel zu den Blättern sind gleich lang
✗  … und im selben Deck: Bedingungen === … Alle Wege von der Wurzel zu den Blättern sind gleich lang …
✗  … und im selben Deck: Definition eines B-Baums === … Alle Blattseiten liegen auf derselben Stufe …
✓  Genau eine Karte für diesen Sachverhalt; die anderen Vorkommen entfallen oder werden zu Strukturzeilen ohne `==`
```

Three phrasings of one fact do not reinforce it — they compete, and the deck
teaches you to produce whichever wording you last saw.

---

## `two-way-policy`

`<>` is valid only when **both sides are ≤ 3 words and genuinely name each
other** — a symbol and its term, an abbreviation and its expansion. A symbol
paired with a definition must be one-way: the definition side gives the answer
away and the reverse card is pure pattern matching.

```
✗  $$\sigma$$ <> Selektion: filtert Tupel nach der tiefgestellten Bedingung
✓  $$\sigma$$ <> Selektion
✓  Selektion == Filtert Tupel nach der tiefgestellten Bedingung
```

Split, don't downgrade: the symbol↔name pair *is* worth both directions, the
definition is not.

---

## `self-sufficient-prompt`

Every prompt must be readable on its own. RemNote shows the parent breadcrumb,
but you cannot rely on it being read.

Bare label prompts (`Bedeutung ==`, `Verhalten ==`, `Vorgehen ==`, `Kosten ==`)
are permitted **only** when the immediate parent line is a proper noun naming
the subject — `Index-Scan > Kosten ==` is fine, `Entwurfsentscheidungen >
Knotengröße ==` is not.

Banned as prompts regardless of parent, because they name no relation:
`Einordnung`, `Effekt`, `Nutzt`, `Hinweis`, `Anmerkung`, `Allgemein`.

Preferred prompt vocabulary — see `profile.md` to adjust:
`Warum`, `Wann`, `Wodurch`, `Welches Problem`, `Voraussetzung`, `Problem`,
`Lösung`, `Folge`, `Vorteil`, `Nachteil`, `Unterschied`, `Formel`, `Beispiel`.

---

## `causal-framing`

Where the source explains *why* something matters, prefer a causal, contrastive,
or problem/solution prompt over a neutral label/value prompt. The mechanism is
what transfers to an exam question; the label rarely is.

```
✗  Frequency Partitioning == Tupel nach Codelänge gruppieren
✓  Welches Problem löst Frequency Partitioning? == Variable Codelängen machen den direkten Zugriff auf den n-ten Spaltenwert teuer
```

---

## `no-dangling-reference`

A card may not require producing a name, symbol, or rule the deck never teaches.
If a prompt or answer mentions `SelUnion`, that rule needs its own card — or the
mention has to go.

This bites hardest after `cut-list`: cutting an item that a surviving card
references leaves a prompt you cannot answer. After cutting, re-scan the
remaining cards for names you removed.

```
✗  Einfacher Optimierungsalgorithmus ==1.
       …
       Selektionen mit SelJoin, SelProj, SelUnion, SelDiff Richtung Blätter verschieben
   (SelUnion und ProjUnion kommen im Deck sonst nicht vor)

✓  Karten für SelUnion und ProjUnion ergänzen — beides Einzeiler
✓  oder: Schritt generisch formulieren („Selektionen mit den Sel-Regeln Richtung Blätter verschieben")
```

The same applies to letters in a classification (`Typ N`, `Typ JA`): if later
cards use the labels, one card must let you decode them.

---

## `formula-triple`

Applies to **quantitative formulas** — costs, sizes, thresholds. For symbolic
**equivalence rules** (`KommJoin`, `AssozJoin`, `ProjUnion`), use name → shape
as a single card; a cloze pass over a symmetric one-liner tests nothing. Add a
*why* or *condition* card only where the source justifies or constrains the
rule, which for equivalences is the interesting part:

```
✓  SelJoin: Wann darf $\sigma$ vor den Verbund gezogen werden? == Wenn alle Selektionsattribute aus einer der beiden Relationen stammen
```

A quantitative formula worth knowing gets up to three cards, and usually needs
all three:

1. **Shape** — the formula itself, prompted by its name.
2. **Cloze** on the one term that carries the insight.
3. **Why** — one card justifying that term.

```
✓  Kosten des externen Sortierens == $$\mathrm{cost}_{SORT} = 2b_r\left(1 + \log_{mem-1}\frac{b_r}{mem}\right)$$
✓  Kosten des externen Sortierens == $$\mathrm{cost}_{SORT} = {{2b_r}}\left(1 + \log_{mem-1}\frac{b_r}{mem}\right)$$
✓  Warum steht im Sortieraufwand der Faktor $2b_r$? == Jeder Mischlauf liest und schreibt alle Blöcke
```

This is the sanctioned form of redundancy: the same fact from different angles in
*separate* items does not violate minimum information.

---

## `cut-list`

Optimize for exam-relevant recall, not archival coverage. Omit by default:

- restatements of a fact already carried by another card
- motivational or "this is important/common" framing with no testable content
- implementation trivia that only supports a mechanism already carded
- lists of variants where membership itself is not examinable
- isolated data-structure details serving only as context

Keep: named concepts, mechanisms, distinctions, thresholds and constants,
prerequisites, tradeoffs, failure modes, high-value formulas, ordered procedures.

The test: *would this be a useful prompt on its own, six months from now?* If
not, cut it — do not park it in a `===` list.

---

## `learning-from-corrections`

When the user supplies a corrected RemNote **export**, judge content only, never
the export syntax (`→`, `―`, `>>>`, `>>1.`, leading `-`). Never copy export
syntax into import output.

- A **disabled separator** (`―` instead of an active arrow) means that content
  was rejected. Omit it entirely — not as a disabled card, not as a note.
- Several small cards merged into one broader card means those details form one
  recall unit; merge similar material in future.
- A neutral label rewritten as a causal question means `causal-framing` should
  have applied; apply it harder next time.

Append each lesson to `rejections.md` as one line: what was rejected, and why it
was rejected. That file is read on every run.
