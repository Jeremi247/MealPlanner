# 0025 — A food's category follows its macros

Scope: which of the four categories a food sits in, for the table's rows and for foods of your own. What a category changes, the grid section and what a click adds, is [food data](../subsystems/food-data.md) and [UI](../subsystems/ui.md).

## Decision

- **A food's category is the first of these it meets, in order**, from its kcal and macros on its listed basis, ranges at their midpoint (`NM.Category.suggest`, `site/js/core/category.js`):
  1. **Volume**: under 30 kcal per 100 ml.
  2. **Fat**: fat gives at least 50% of its kcal.
  3. **Protein**: protein gives at least 35% of its kcal, and it holds at least 6 g protein per 100 ml.
  4. **Starch**: everything else.
- **Every table row sits where the rules put it**, and a test holds it there. Lentils, kidney beans and split peas move from protein to starch; nothing else moves.
- **A food of your own is offered the rules' category**, and a pick of the user's overrides it ([0026](0026-your-own-foods-are-kept-on-the-server.md)).
- The rules read kcal, protein and fat, never carbs, and each reaches only rows whose figures for it come from the table: volume is decided on kcal alone, before an estimated macro is read.
- Supersedes in part [0018](0018-every-food-is-shown-alike.md): the protein category's limit is now part of the rules rather than a check on a hand-made list.

## Why

Jeremi asked for a ruleset tried in order, volume then fat then protein, with starch as the fallback (2026-10-12), so that a food's place can be worked out rather than copied from the table's sections, and suggested for a food of their own. Applied to the table, the three legumes were the only rows the table placed against their macros: protein gives them 27–31% of their kcal, against 8% for potatoes and rice and 45% or more for every animal protein.

## Rejected

- **Keeping the table's sections as the categories.** Nothing could place a new food, and nothing checked that a row was where it belonged.
- **Protein when protein outweighs carbs, by grams.** Wider margins, but it reads carbs, which are estimated on every protein row.
- **Dropping the 6 g floor.** It would let skim milk into protein at 3.4 g per 100 ml.

## Where it is thin

The fat line sits between 41% (chicken thigh) and 55% (chia), and the volume line between 23 kcal (cantaloupe) and 49 (cod). The protein line is tighter: edamame at 39% and lentils at 31%. A new food near 35% lands on a side by its exact figures.

## Consequences

- `Category.EveryTableFoodSitsWhereTheRulesPutIt` fails by name when a row is in a list its macros do not put it in, or when a figure changes enough to move it.
- Starch now holds five rows, three of them with carbs estimated. Its baseline is protein's, so the table's comparison column is unchanged for them.
- Changing a threshold is a new record, and moves whatever rows cross it.
