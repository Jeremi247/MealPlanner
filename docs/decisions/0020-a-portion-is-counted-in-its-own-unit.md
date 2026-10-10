# 0020 — A portion is counted in its own unit

Scope: how a fat portion's amount is shown and stepped in a meal row and on a tile. What a click adds, and what is stored, do not change ([0001](0001-a-plate-is-measured-in-millilitres.md)).

## Decision

- **Each fat portion names the unit it is counted in**: `unit` in `foods.js`, with how many of them the listed portion holds (20 almonds, 2 eggs, 1 tbsp, ½ avocado).
- **A row says its amount in that unit, as a count and the unit's name**: "3x egg", "23x almond", "1.5x tbsp". It no longer says "1.5 × 2 large". The name is never pluralised, so the format holds in any language.
- **A +/- moves one unit.** A spoon unit moves half a spoon, and so does an avocado, whose portion is a half.
- **A +/- lands on a whole step**, for every food: from a volume between steps, as a typed one can be, it goes to the next step up or down rather than keeping the offset.
- **A tile says what a click adds, and what the meal holds, in the same unit**: "+ 20x almond", "in Meal 2: 23x almond".

## Why

Jeremi asked for it on review. A step of half a portion made "1.5 × 20 medium" olives, which has to be multiplied out to be read, and could not reach 19 olives or 3 eggs at all. Jeremi chose the "3x egg" form so that no unit needs a plural.

## Rejected

- **A step of a whole portion, shown as a count.** Readable, but still cannot reach 23 almonds.
- **Typing a count.** The ml and the weight inputs already edit the amount; a third input for the same value was not asked for.
- **A whole avocado as the step.** From a click's ½ it could not get back to ½ with a −.
- **"3 eggs", with a singular and a plural name per unit.** English-only, and "1 eggs" when a typed count rounds to a whole one.

## Consequences

- `Nutrition.normalise` gives a portion food `unit` (its `name` and `ml` per unit), and `stepMl` is one unit's ml times its step. `Nutrition.units` and `Nutrition.stepped` are the only ways a count is read and a step taken.
- A unit's ml is the portion's volume divided by its count, so it carries the portion volume's estimate (`portionMl` in `est`).
- A count is shown to one decimal, so a typed volume can read "23.4x almond" until the next +/-.
- A volume food's +/- now snaps to its 50 ml grid, and a protein's or starch's to 25 ml.
- `Data.APortionIsCountedInTheUnitsItLists` holds each unit's count to the listed portion text.
