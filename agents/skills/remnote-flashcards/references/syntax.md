# RemNote import syntax

Mechanics only. What is *worth* carding lives in `quality-rules.md`.

## Hard constraints

- Output is always a `.md` file.
- **No `-` bullets.** Leading dashes are an export artifact and break import.
  Hierarchy is expressed by indentation alone.
- Indent with 4 spaces per level, consistently.
- German text uses real `ä ö ü ß` — never `ae oe ue ss`. Exception: identifiers,
  slugs, code symbols, and file paths keep their ASCII form.
- If a requested format is uncommon and you are unsure of its exact syntax, say
  so and ask. Do not invent syntax.

## Card separators

| Syntax | Card type | Notes |
| --- | --- | --- |
| `==` | basic, one direction | the default; use for most cards |
| `<>` | two-way | both sides ≤ 3 words — see `two-way-policy` |
| `===` + newline + indent | multiline | two coupled clauses only, not sets |
| `==1.` + newline + indent | numbered list | order-dependent answers only |
| `==A)` + newline + indent | single choice | first line is the correct answer |
| `{{...}}` | cloze | one or more per line |
| `$...$` / `$$...$$` | MathJax inline / block | |
| `$$…{{c1::…}}…$$` | cloze inside MathJax | numbered cloze for ordered reveal |

## Examples

Nested basic cards:

```md
Konvergenzkriterien
    Notwendiges Kriterium
        Bedingung == $\lim_{k \to \infty} a_k = 0$
        Aussagekraft == Notwendig, aber nicht hinreichend für Konvergenz
```

Multiline and block math:

```md
Quotientenkriterium
    Formel ===
        $$\lim_{k \to \infty} \left| \frac{a_{k+1}}{a_k} \right|
        \begin{cases}
        < 1 & \text{absolut konvergent} \\
        = 1 & \text{keine Aussage} \\
        > 1 & \text{divergent}
        \end{cases}$$
```

Numbered list and single choice:

```md
Vorgehen bei Potenzreihen ==1.
    In $x_0$ und $a_k$ aufteilen
    Radius berechnen
    Randpunkte prüfen
Harmonische Reihe ==A)
    Entsteht bei $s=1$
    Konvergiert für alle $s > 0$
    Ist eine endliche Summe
```

Cloze:

```md
$\sum_{k=1}^{\infty}\frac{1}{k^s}$
    Konvergent == falls {{$s > 1$}}
    Divergent == falls {{$s \leq 1$}}
```

## Export syntax — read only, never write

RemNote **exports** use readable separators that are not valid for import:
`Frage→Antwort`, `Frage―Antwort`, `>>>`, `>>1.`, leading `-`.

A `―` (disabled separator) in an export means the user turned that card off.
Treat it as rejected content — see `learning-from-corrections`.

## MathJax notes

- Not every Unicode operator has a reliable macro. Relational-algebra outer joins
  (⟕ ⟖ ⟗) and semi-joins (⋉ ⋊) have no dependable MathJax command in RemNote —
  write them as literal Unicode outside `$…$`.
- Available and safe: `\sigma \pi \rho \gamma \bowtie \times \cup \cap \div
  \subseteq \subset \emptyset \in \notin \exists \forall \to \leftarrow \lceil
  \rceil \log \approx \cdot`.
- Escape German thousands separators inside math (`1{.}000{.}000`) so they are
  not typeset as decimal points.
