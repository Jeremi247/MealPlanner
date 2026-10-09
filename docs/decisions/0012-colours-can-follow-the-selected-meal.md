# 0012 — Colours can follow the selected meal

Scope: a second basis for a tile's colour, chosen by a toggle. Supersedes the part of [0011](0011-a-day-of-meals-against-a-daily-target.md) that scores tiles against the whole day only. 0011's day, meal shares and per-meal numbers stand, and day colours stay the default.

## Decision

- **A toggle at the top, Colours: Day | Selection**, chooses what every tile is scored against. It is saved with the view.
- **Day** is 0011: the sum of every meal against the daily target, a portion weighed against one meal's share.
- **Selection** scores the selected meal alone against its share of the day, `Fit.mealShare(target, meals)`, with the unchanged single-plate rule ([fit scoring](../subsystems/fit-scoring.md)). An empty selected meal is the empty regime.
- With the day selected, Selection is the same as Day.
- Changing what the tiles are scored against, by the toggle, by selecting another meal in Selection mode, or by adding or removing a meal (which changes every share), shows no change arrows. It is a different measure, like leaving the empty regime.
- Every meal card always shows its volume, protein and carbs bars. Selecting a meal only shows its rows.

## Why

Jeremi asked for it in review, to see the balance of one meal as well as of the day. Day colours answer "what does the day still need", and selection colours answer "what does this meal need". Each is right for a different moment.

## Rejected

**Selection colours scored against the day's remaining need, split over the meals not yet filled.** It needs a rule for which meals count as filled, and Jeremi asked for the meal's own balance.

## Consequences

- A meal coloured on its own can look balanced while the day is not, and the reverse. The toggle and the regime line say which one the tiles show.
- The hover reasons name what is scored: "the day is short on" or "Meal 2 is short on".
