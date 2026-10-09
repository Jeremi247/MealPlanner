# 0003 — Fit is scored against what the plate lacks

Scope: what a tile's colour measures. The formula and its constants are in [fit scoring](../subsystems/fit-scoring.md); this record is why it has that shape.

## Decision

**A tile's colour says whether one more portion of that food would make the plate more balanced, relative to the other tiles.** Balance is measured as an even fill across protein, fat, carbs and volume against a meal target:

- With food on the plate, a portion scores by adding what the plate lacks more than average, minus what it is already ahead on.
- With an empty plate, a food scores by how evenly it covers the dimensions on its own.
- Overshooting a target is penalised in both cases, kcal most heavily.
- Each side of the grid is normalised to its own extreme, so the best option is full green and the worst full red.

## The specification it was built to

Jeremi's example: after picking something high in fat, other fatty foods go red, redder the more fat they carry, and foods supplying what the plate is missing go green. `Fit.AfterAFattyPickFatFoodsAreRedAndVolumeFoodsGreen` is that sentence as a test.

## Rejected

**Distance to target.** Score = how much closer the plate gets to the target. After one tablespoon of peanut butter the fat target is far from met, so oil moves the plate *closer* and goes green — the opposite of the example. Absolute progress rewards whatever is large, not whatever balances.

**Ratio only.** Compare the plate's macro split to a target split. Matches the example, but knows nothing of how much food there is, so it cannot see an overshoot, and volume has no place in a ratio of calories.

**Cosine against the need vector.** Direction without magnitude: oil and half-fat mayo point the same way and score the same, though the example wants oil redder.

**Centring on the mean need** gives direction and magnitude together, and the overshoot term supplies what the ratio approach lacked.

## What it does not decide

The default meal target's numbers, and whether the target should be per meal or per day. Those are Jeremi's ([P0](../todo/P0/review-the-first-version.md)).

## Consequences

- Colour is relative. A full-green tile is the best available move, not proof the plate will balance.
- An empty plate shows a different measure from a full one; the legend says which is showing.
- kcal never rewards, only penalises: it is the macros counted again.
