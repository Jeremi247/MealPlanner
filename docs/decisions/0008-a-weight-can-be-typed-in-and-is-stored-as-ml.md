# 0008 — A weight can be typed in, and is stored as ml

Scope: typing an estimated weight into a plate row. Supersedes the part of [0007](0007-weight-is-shown-as-an-estimate.md) that says a weight is never typed in; the rest of 0007 stands.

## Decision

**Each plate row's estimated weight is an input.** A weight typed there is turned into millilitres at once, through the row's own `gPerMl`, and only the millilitres are kept. The field then shows the weight of those millilitres, still marked as an estimate.

Volume stays the unit that is stored, summed and scored ([0001](0001-a-plate-is-measured-in-millilitres.md)). A weight is never saved, totalled or used by fit.

## Why

Jeremi asked for it after review. When a food has just been weighed out, typing the scale's reading is easier than working out its volume by hand.

## What it costs

- A volume entered as a weight carries the weight estimate's error. 100 g typed for a loose leaf can be a quite different volume from what is on the plate. The `~` and the tooltip stay on the field so it still reads as an estimate.
- Two inputs per row that edit the same value.

## Rejected

**Store the typed weight as well.** Then the row would hold two amounts that can disagree. That is the store-grams decision 0001 rejected.

## Consequences

- `Nutrition.mlFromGrams(food, g)` is the inverse of `Nutrition.grams`. It is the only function that turns a weight into a volume. Only the plate row calls it.
- The stored plate is unchanged: `[{ id, ml }]`.
- `Nutrition.AWeightTypedInBecomesTheVolumeItFills` holds the round trip.
