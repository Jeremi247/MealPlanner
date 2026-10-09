# Fibre as a fit dimension

**Ask** — give every row a `fibre` value per 100 ml (per portion for fat), take it out of carbs, and add it to fit scoring as a balanced dimension with its own meal target ([0010](../../decisions/0010-track-what-a-supplement-cannot-carry.md)). Not in it: other nutrients ([P3](../P3/micronutrients.md)).

**Open**

- The default meal target. ~10 g, a third of 30 g a day, follows the evidence in 0010.
- Overshoot weight. The evidence gives no harmful upper bound, only gut tolerance. 0, or a small weight like volume's 0.25?
- Does the carbs dimension become fibre-free carbs, and does the default 55 g carbs target move with it?
- Does fibre count in the empty regime's evenness cosine, or only in the balance term? A fifth dimension makes every zero-fibre food less even, so every empty-plate colour moves and `FULL_GOOD` may need retuning.
- Do the reference table's starch carbs include fibre? If they do, the split is an estimate on those rows too.

**Blocked on** — the canonical source and its carbs definition, which [P1](../P1/verify-estimated-macros.md) chooses.

**Read**

- [Fit scoring](../../subsystems/fit-scoring.md) — the dimensions, need and share, the overshoot weights
- [Food data](../../subsystems/food-data.md) — how carbs are estimated today
- [0004](../../decisions/0004-estimates-are-marked-not-hidden.md) — every fibre value is an estimate unless the table gives it
- `Tests/data.test.js` — the kcal sanity bound assumes fibre is counted in carbs
