# Food data

Scope: `site/js/data/foods.js` and the normalisation in `site/js/core/nutrition.js` — what a row holds, where its numbers come from, and how a row becomes per-ml. It does not cover how a food is scored ([fit scoring](fit-scoring.md)).

## A row

| Field | Holds |
|---|---|
| `id` | Stable kebab-case id. The plate is stored by it, so renaming one empties that entry from saved plates |
| `name`, `prep` | As the reference table writes them |
| `kcal`, `protein`, `fat`, `carbs` | A number, or `[min, max]` where the table gives a range |
| `est` | The fields not taken from the table ([0004](../decisions/0004-estimates-are-marked-not-hidden.md)) |
| `reference` | The table's † rows: listed for comparison, outside the category's limit |
| `portion`, `portionMl` | Fat portions only: the portion as listed, and the volume it fills |

**Per 100 ml** for the protein, volume and starch categories; **per portion** for fat. The category's `basis` says which.

## Normalisation

`Nutrition.normalise` turns each row into a record whose `perMl` holds every nutrient per millilitre:

- A range is carried at its midpoint in `perMl` and kept whole in `range`.
- A per-portion value is divided by `portionMl`. One click adds one portion; a step is half of one.
- `listed` keeps the row's values as written, for display.

## Where the numbers come from

- **kcal** — always the table, for every row. Never estimated.
- **Protein and fat** — the table, for protein foods and fat portions.
- **Carbs** — the table only for the starch rows. Elsewhere estimated from per-100 g references and the row's own kcal-per-ml density. Fibre is counted in carbs.
- **Protein, fat and carbs of volume foods** — estimated the same way; the table lists only their kcal.
- **`portionMl`** — measured spoon volumes for tbsp portions; estimated for counted items (almonds, olives, eggs).

`Data.MacrosRoughlyAccountForTheListedKcal` holds every row's macros to its kcal within a tolerance, which catches a typo but not a careful wrong estimate. Checking the estimates against a source is [P1](../todo/P1/verify-estimated-macros.md).

## Category limits

The protein category admits ≥6 g protein and ≤107.4 kcal per 100 ml; a row outside it is `reference`. `Data.ProteinFoodsMeetTheCategoryLimitUnlessReference` enforces both directions.

`baseline` is each category's "original average" kcal, which the table's comparison column is computed against. Starch has none and uses protein's.

## See also
- [0001](../decisions/0001-a-plate-is-measured-in-millilitres.md) — why volume
- [0004](../decisions/0004-estimates-are-marked-not-hidden.md) — why estimates are marked rather than left out
- [Testing](../testing.md) — the data tests
