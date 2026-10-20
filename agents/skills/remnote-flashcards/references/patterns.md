# Patterns: source shape → card shape

Recipes for turning a kind of source material into cards. Each names the rules it
enforces so a violation is traceable back here.

---

## Definition of a named concept

One card for the name→meaning direction. Add the reverse only if the meaning side
is a short label (`two-way-policy`).

```
B-Baum-Kriterium == Jede Seite außer der Wurzel enthält zwischen $m$ und $2m$ Einträge
```

Do not follow a definition with a `Kerngedanke` card that says the same thing in
other words (`dedupe`).

---

## Symbol or notation

Symbol ↔ term as `<>`, meaning as a separate one-way card. Never symbol ↔
definition.

```
$$\pi$$ <> Projektion
Projektion == Behält die tiefgestellten Attribute, entfernt Duplikate
Projektion in SQL == `SELECT spalte1, spalte2` mit implizitem `DISTINCT`
```

---

## Two adjacent concepts (`twin-check`)

Ask first: does each concept carry content the comparison does not?

**No** — the definitions *are* the contrast. One card, not three.

```
Unterschied KNF und DNF == KNF ist eine Konjunktion von Disjunktionen, DNF eine Disjunktion von Konjunktionen
```

**Yes** — each concept has its own mechanism, cost, or use condition. Then three
cards: one per concept plus the contrast, which is the one place a two-part
answer is allowed.

```
Primärindex == Liefert zu einem Wert höchstens ein Tupel
Sekundärindex == Liefert zu einem Wert im Allgemeinen mehrere Tupel
Unterschied Primär- und Sekundärindex == Der Primärindex ist eindeutig, der Sekundärindex liefert TID-Listen
```

---

## Unordered set of properties, advantages, conditions (`no-sets`)

Never one card. Pick one:

**Cued singles** when each element is individually examinable — preferred.

```
Warum sind Bereichsanfragen im B+-Baum effizient? == Die Blattebene ist verkettet
```

**Cloze over a stable list** when membership itself must be known and the
elements are short. Keep the order fixed so the visual layout stays constant.

```
Katalogparameter für Kostenschätzung
    Blockgröße == {{$bsize$}}
    Puffergröße in Blöcken == {{$mem$}}
    Anzahl Blöcke von $r$ == {{$b_r$}}
```

**Cut** when the elements exist only to pad a slide.

---

## Ordered procedure

Keep the sequence as `==1.` only when the order itself is the knowledge and the
list is short (≤ 5 steps). Otherwise use `procedure-decomposition`: card the
**trigger condition**, the **critical step**, and the **termination**, and skip
the mechanical middle.

```
Wann entsteht beim B-Baum-Insert ein Split? == Wenn die Zielseite bereits $2m$ Elemente enthält
Was passiert beim Split mit dem mittleren Element? == Es wandert in die darüberliegende Indexseite
Wie weit kann ein Split fortgesetzt werden? == Rekursiv bis zur Wurzel
```

Three focused cards beat one six-step list you will fail on step four forever.

---

## Quantitative formula (cost, size, threshold)

Apply `formula-triple`: shape, cloze on the decisive term, why. Do not card a
formula you cannot also justify — an unjustified formula is `cut-list` material
unless it is an exam-guaranteed constant.

## Algebraic equivalence rule

Name → shape as one card. No cloze pass: a symmetric one-liner has no decisive
term to hide. Add a second card only where the rule has a **condition** or a
non-obvious **reason**, which is where the exam value sits.

```
KommJoin == $r_1 \bowtie r_2 \iff r_2 \bowtie r_1$
SelJoin: Wann darf $\sigma$ vor den Verbund gezogen werden? == Wenn alle Selektionsattribute aus einer der beiden Relationen stammen
```

If the deck names a rule in a procedure or overview, that rule needs its own
card — see `no-dangling-reference`.

---

## Threshold, constant, magic number

Cloze inside its sentence rather than as a bare label/value pair, so the number
is retrieved in the context that makes it meaningful.

```
Das B-Baum-Kriterium garantiert mindestens {{50 %}} Speicherplatzausnutzung
```

---

## Cost or tradeoff discussion

Card the *decision*, not the description: when is it worth it, and what breaks
when it is not.

```
Wann ist ein Index-Scan besser als ein Relationen-Scan? == Wenn nur wenige Tupel benötigt werden
Wann ist er schlechter? == Beim Lesen vieler Tupel, weil die Blockung schlechter genutzt wird
```

---

## Failure mode or anomaly

Trigger and consequence as two cards. These are exam favourites.

```
Wodurch entsteht das Halloween-Problem? == Index-Scan über ein aktualisiertes Attribut mit sofortiger Indexaktualisierung
Folge des Halloween-Problems == Sätze werden erneut getroffen, im Extremfall endlos aktualisiert
```

---

## Naming trivia and etymology

Usually `cut-list`. Keep only when it prevents a real misconception.

```
✗  Wofür steht das B im B-Baum? == Balanciert, breit, buschig oder Bayer
✓  Wofür steht das B im B-Baum nicht? == Für binär
```

---

## Structural nodes

Plain lines with no separator, used freely for grouping. They are not cards and
carry no recall load, so nest generously — but keep the tree shallow enough that
a prompt's parent is still visible (`self-sufficient-prompt`).
