# Fit scoring

Scope: `site/js/core/fit.js` — how each tile's colour is computed from the day's meals and the daily target, or from one meal and its share ([0012](../decisions/0012-colours-can-follow-the-selected-meal.md)). It does not cover how the colour is drawn ([UI](ui.md)). The argument for this shape is [0003](../decisions/0003-fit-is-scored-against-what-the-plate-lacks.md).

## Inputs

- The **target**: kcal, protein, fat, carbs and volume for one day.
- The **day**: every meal's rows together, `[{ food, ml }]`, summed by `Nutrition.totals`. In this doc "the plate" is that sum.
- The **number of meals**. `Fit.mealShare(target, meals)` is one meal's share, the target divided evenly.
- With **selection colours**, the selected meal's rows stand in for the day and its share for the target, with one meal. Everything below applies unchanged.
- Each candidate food at its **default portion** — what one click would add.
- Or a **premade meal** from the shelf, its foods summed and scored as one addition by `Fit.scoreMeal`, on the same scale and against the same day or meal ([shelf](shelf.md)).

## Dimensions

**Balanced:** protein, fat, carbs, volume. **Budgeted:** the same four plus kcal. kcal is a budget only, since it is the macros counted again.

For each balanced dimension, `need` is how much of the daily target is still missing, clamped to 0…1. `share` is the fraction of **one meal's share** one portion adds ([0011](../decisions/0011-a-day-of-meals-against-a-daily-target.md)). With one meal the two targets are the same.

## The score

**Plate has food — the balance regime.** A portion is rewarded for adding what the plate is missing *more than average*, and penalised for adding what the plate is already ahead on:

```
balance = Σ share[d] × (need[d] − mean(need))
```

**Plate is empty — the empty regime.** Every need is 1, so the balance term is zero for every food. Instead a food is scored by how evenly it covers the dimensions on its own: the cosine between its `share` vector and the all-ones vector. That cosine runs from ½ for a food covering one dimension to 1 for an even one, and is mapped to 0…`FULL_GOOD`.

**Both regimes** subtract the overshoot the portion is responsible for past 100 % of the daily target, as a fraction of one meal's share, weighted per dimension: 1 for each macro, 0.25 for volume, 1.5 for kcal.

## Normalisation

`norm` is the raw score on a **fixed scale** ([0009](../decisions/0009-colour-is-measured-against-the-target.md)): `raw / FULL_GOOD` when positive and `raw / FULL_BAD` when negative, clamped to −1…1. `FULL_GOOD` is 0.1 and `FULL_BAD` is 0.3.

A colour is therefore **measured against the target**, never against the other tiles. A plate that needs nothing more has no green tile. An empty plate has no red tile unless a portion overshoots.

## Bands

`Fit.tier(norm)` puts every score in one of five bands, and the tile is drawn in that band's colour ([UI](ui.md)):

| Band | `norm` | Reads |
|---|---|---|
| `recommended` | ≥ 0.6 | Recommended |
| `alright` | 0.2 … 0.6 | Alright to add |
| `may` | −0.2 … 0.2 | You may add it |
| `doubtful` | −0.6 … −0.2 | Might not be the best idea, but sure |
| `against` | < −0.6 | Recommended against adding it |

A boundary belongs to the band above it. The cuts are in `TIERS` in `site/js/core/fit.js`.

## Band changes

A pick can move other tiles **up** a band as well as down. "Ahead" is measured against the rest of the plate, so filling one dimension makes the others relatively further behind. After chicken then lentils, the fat portions move up, because fat is now furthest behind. This is the rule working, and it is not smoothed away.

`Fit.compare(before, after)` names each food whose band changed between two rankings. For each one it gives the direction and the dimension whose part of the score moved most that way. That dimension is labelled `over` when the change came from overshoot, and `balance` otherwise. A change into or out of the empty regime is a different measure, and reports nothing.

## Invariants the tests hold

- After a fatty pick, every fat portion scores below zero and every volume food above, and more fat per portion is redder.
- An overshoot of a met target is penalised, and the worst one is −1.
- Every `norm` is in −1…1, and a food scores the same alone as in the grid.
- With every target nearly met, no tile is green. With an empty plate, only an overshoot is red.
- After a tablespoon of peanut butter, oil is `against` and lentils `recommended`.
- After chicken, adding lentils moves almonds up for fat, and adding potatoes moves potatoes down for carbs.
- A day of three identical meals balances each food exactly as one of those meals does against a third of the target.
- A premade meal of one food at its default portion scores exactly as that food's tile.

## Open questions

- Whether the default portion should be the scoring basis, or a user-chosen one.
- Whether a ratio target (percent of kcal from each macro) should be offered beside the absolute one.
- Early in the day the colours are pale, because every need is still near 1. Should `need` be measured against the meals started so far instead of the whole day?
- Should a meal far past its share colour anything, or stay a number on its card?

## See also
- [0003](../decisions/0003-fit-is-scored-against-what-the-plate-lacks.md) — the argument and the rejected alternatives
- [UI](ui.md) — how a band becomes a colour, and the reasons shown on hover
