# 0004 — Estimates are marked, not hidden

Scope: what happens to a value the reference table does not give. Which fields are estimated, row by row, is [food data](../subsystems/food-data.md).

## Decision

**A value the table does not give is estimated, recorded in the row's `est` list, and shown with a `~` and a tooltip.** kcal is never estimated.

## Why

Fit scoring needs protein, fat and carbs for every food ([0003](0003-fit-is-scored-against-what-the-plate-lacks.md)). The table lists only kcal for volume foods, and carbs for almost nothing. Leaving those at zero would score cucumber as pure volume and lentils as carb-free — wrong in a way nobody would see.

Estimating silently is worse than either: the table is the source of truth, and an unmarked estimate would read as part of it.

## How an estimate is made

A per-100 g reference value, converted through the row's own density: the table's kcal per 100 ml divided by the reference's kcal per 100 g. That keeps an estimate consistent with the kcal the table did give.

## Consequences

- The table's values and the estimates can be told apart in the data and on screen.
- A careful-but-wrong estimate passes the sanity test. Checking them against a source is [P1](../todo/P1/verify-estimated-macros.md).
- Replacing an estimate with a sourced value means removing its name from `est`, nothing else.
