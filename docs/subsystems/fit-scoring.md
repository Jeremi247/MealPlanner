# Fit scoring

Scope: `site/js/core/fit.js` — how each tile's colour is computed from the plate and the meal target. It does not cover how the colour is drawn ([UI](ui.md)). The argument for this shape is [0003](../decisions/0003-fit-is-scored-against-what-the-plate-lacks.md).

## Inputs

- The **target**: kcal, protein, fat, carbs and volume for one meal.
- The **plate**: `[{ food, ml }]`, summed by `Nutrition.totals`.
- Each candidate food at its **default portion** — what one click would add.

## Dimensions

**Balanced:** protein, fat, carbs, volume. **Budgeted:** the same four plus kcal. kcal is a budget only, since it is the macros counted again.

For each balanced dimension, `need` is how much of the target is still missing, clamped to 0…1. `share` is the fraction of the target one portion adds.

## The score

**Plate has food — the balance regime.** A portion is rewarded for adding what the plate is missing *more than average*, and penalised for adding what the plate is already ahead on:

```
balance = Σ share[d] × (need[d] − mean(need))
```

**Plate is empty — the empty regime.** Every need is 1, so the balance term is zero for every food. Instead a food is scored by how evenly it covers the dimensions on its own — the cosine between its `share` vector and the all-ones vector — and the grid is centred on its mean.

**Both regimes** subtract the overshoot the portion is responsible for, past 100 % of target, weighted per dimension: 1 for each macro, 0.25 for volume, 1.5 for kcal.

## Normalisation

`norm` is the raw score scaled to −1…1 across the grid, **each side by its own extreme**: the best fit is full green and the worst full red, however lopsided the raw scores are. A floor on each side (0.02, or 0.05 when empty) keeps a near-flat grid from being stretched to full colour.

A colour is therefore **relative to the other tiles**, never absolute. A full-green tile is the best option available, not a guarantee the plate will be balanced.

## Invariants the tests hold

- After a fatty pick, every fat portion scores below zero and every volume food above, and more fat per portion is redder.
- An overshoot of a met target is penalised, and the worst one is −1.
- Every `norm` is in −1…1, with both extremes reached.

## Open questions

- Whether the default portion should be the scoring basis, or a user-chosen one.
- Whether fibre should be a dimension once the data carries it.
- Whether a ratio target (percent of kcal from each macro) should be offered beside the absolute one.

## See also
- [0003](../decisions/0003-fit-is-scored-against-what-the-plate-lacks.md) — the argument and the rejected alternatives
- [UI](ui.md) — how `norm` becomes a tint, and the reasons shown on hover
