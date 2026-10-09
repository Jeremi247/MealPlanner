# 0007 — Weight is shown as an estimate

Scope: the estimated weight shown beside a volume. Supersedes the part of [0001](0001-a-plate-is-measured-in-millilitres.md) that says no weight of food is shown; the rest of 0001 stands.

## Decision

**Every row carries `grams`, the estimated weight of its 100 ml or its portion, and the app shows it beside a volume**: on a tile, for what a click adds and what is on the plate, and under each plate row's ml. It is marked as an estimate ([0004](0004-estimates-are-marked-not-hidden.md)).

Volume stays the unit that is entered, stored, summed and scored. A weight is never typed in, saved, totalled or used by fit.

## Why

Jeremi asked for it in review. A weight lets a volume be checked against a label, or weighed out on a scale instead of measured in a jug.

## How a weight is made

The [0004](0004-estimates-are-marked-not-hidden.md) method, read the other way: the row's kcal per 100 ml (its midpoint, if a range) divided by a per-100 g reference kcal for the same preparation gives grams per 100 ml. For a fat portion it is the portion's kcal over the reference's kcal per gram. Where a common cup measure was to hand, the result was checked against it and agreed within about 20 %.

## What it costs

- Every weight is an estimate. The table gives none, and a loose leaf's weight per ml depends on packing as much as its volume does.
- A second number on tiles and rows that are already dense.
- The decision 0001 rejected — store grams, display ml — is still rejected: the weight is derived, shown, and discarded.

## Consequences

- `foods.js` rows gain `grams`, named in every row's `est`. A weight from a sourced reference replaces the number and leaves the mark, since the table still does not give it.
- `Nutrition.grams(food, ml)` is the only function that returns a weight of food. Nothing in `core/fit.js` or the stored state reads it.
- `Data.EveryRowHasAPlausibleEstimatedWeight` catches a typo and a per-100 ml value on a per-portion row; it cannot catch a careful wrong estimate.
