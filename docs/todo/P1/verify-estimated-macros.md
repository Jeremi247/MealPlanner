# Verify the estimated macros

**Ask** — check every value named in a row's `est` list against a published per-100 g source, converted through the row's own density, and correct any that are off. Not in it: changing a value the reference table gives.

**Open**

- Which source is canonical when two disagree — myfooddata, fatsecret or USDA FoodData Central?
- Should fibre be split out of carbs while the values are being checked? That would make it available as a fit dimension.

**Unblocked.**

**Read**

- [Food data](../../subsystems/food-data.md) — which fields are estimated, and how
- [0004](../../decisions/0004-estimates-are-marked-not-hidden.md) — how an estimate is made, and what removing one from `est` means
- `Tests/data.test.js` — the sanity bound every corrected value must still meet
