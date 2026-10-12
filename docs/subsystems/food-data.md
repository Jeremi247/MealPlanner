# Food data

Scope: `site/js/data/foods.js`, the normalisation in `site/js/core/nutrition.js`, the category rules in `site/js/core/category.js`, and how a food of your own becomes a row — what a row holds, where its numbers come from, which category it is in, and how a row becomes per-ml. It does not cover how a food is scored ([fit scoring](fit-scoring.md)).

## A row

| Field | Holds |
|---|---|
| `id` | Stable kebab-case id. The plate is stored by it, so renaming one empties that entry from saved plates |
| `name`, `prep` | As the reference table writes them |
| `kcal`, `protein`, `fat`, `carbs` | A number, or `[min, max]` where the table gives a range |
| `est` | The fields not taken from the table ([0004](../decisions/0004-estimates-are-marked-not-hidden.md)) |
| `portion`, `portionMl` | Portion foods only: the portion as listed, and the volume it fills |
| `unit` | Portion foods only: what the portion is counted in — `per` units to a portion, with the unit's singular `name`, and a `step` of ½ for a spoon or an avocado ([0020](../decisions/0020-a-portion-is-counted-in-its-own-unit.md)) |
| `grams` | The weight of the row's basis, always estimated ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). Normalised to `gPerMl`; shown, and converts a typed weight to ml; never summed or scored |
| `raw` | Foods usually weighed before boiling: `perG`, grams before boiling per gram as prepared, and the `word` it is shown with (`dry`, `unpeeled`). An average, always estimated, shown only |

**Per portion** when the row has a `unit`, and **per 100 ml** otherwise. Every table row in fat is per portion and every other table row per 100 ml, as the category's `basis` says. A food of your own may be either in any category; one in fat per 100 ml adds 15 ml a click and steps by 5.

## Normalisation

`Nutrition.normalise` turns each row into a record whose `perMl` holds every nutrient per millilitre:

- A range is carried at its midpoint in `perMl` and kept whole in `range`.
- A per-portion value is divided by `portionMl`. One click adds one portion; a step is one unit, or half of one for a spoon or an avocado. A +/- lands on a whole step (`Nutrition.stepped`).
- `listed` keeps the row's values as written, for display.

## Where the numbers come from

- **kcal** — always the table, for every row. Never estimated.
- **Protein and fat** — the table, for the rows of its protein and fat sections: the protein foods, the fat portions, and lentils, kidney beans and split peas, which the rules put in starch.
- **Carbs** — the table only for potatoes and rice. Elsewhere estimated from per-100 g references and the row's own kcal-per-ml density. Fibre is counted in carbs.
- **Protein, fat and carbs of volume foods** — estimated the same way; the table lists only their kcal.
- **`grams`** — estimated for every row, by the method in [0007](../decisions/0007-weight-is-shown-as-an-estimate.md#how-a-weight-is-made).
- **`raw`** — an averaged yield, not a measured one: rice about triples when boiled (0.35), and a peeled boiled potato weighs what it did raw, plus about 15% for the peel (1.15). Adding it to another food is one field.
- **`portionMl`** — measured spoon volumes for tbsp portions; estimated for counted items (almonds, olives, eggs).

`Data.MacrosRoughlyAccountForTheListedKcal` holds every row's macros to its kcal within a tolerance, which catches a typo but not a careful wrong estimate. Checking the estimates against a source is [P1](../todo/P1/verify-estimated-macros.md).

## Categories

A food is in the first category whose rule it meets ([0025](../decisions/0025-a-foods-category-follows-its-macros.md)), from its listed values, ranges at their midpoint:

| Order | Category | Rule |
|---|---|---|
| 1 | Volume | under 30 kcal per 100 ml |
| 2 | Fat | fat gives ≥50% of its kcal |
| 3 | Protein | protein gives ≥35% of its kcal, and ≥6 g protein per 100 ml |
| 4 | Starch | everything else |

Every table row is in the list `foods.js` writes it in, and `Category.EveryTableFoodSitsWhereTheRulesPutIt` holds each where the rules put it. Kcal is not a limit: pork loin and lean beef run over the table's 107.4 and are shown like any other row ([0018](../decisions/0018-every-food-is-shown-alike.md)).

`baseline` is each category's "original average" kcal, which the table's comparison column is computed against. Starch has none and uses protein's, so the legumes' comparison is the table's.

## Foods of your own

Kept on the server, not in `foods.js`, and added after the table's rows in their category ([your foods](your-foods.md)). Nothing holds one to the category rules.

## See also
- [0001](../decisions/0001-a-plate-is-measured-in-millilitres.md) — why volume
- [0025](../decisions/0025-a-foods-category-follows-its-macros.md) — the category rules, and where they are thin
- [0004](../decisions/0004-estimates-are-marked-not-hidden.md) — why estimates are marked rather than left out
- [Testing](../testing.md) — the data tests
