# 0011 — A day of meals against a daily target

Scope: what the target is set for, how a day is split into meals, and what a tile's colour is measured against once there are several meals. Supersedes the part of [0003](0003-fit-is-scored-against-what-the-plate-lacks.md) and [0009](0009-colour-is-measured-against-the-target.md) that scores against one plate and a meal target. Their score, regimes and fixed scale stand.

## Decision

- **The target is daily**, set on its own. The default is three times the old meal target: 1800 kcal, 2250 ml, 135 g protein, 60 g fat, 165 g carbs.
- **A day holds meals**, three by default. A meal can be added or removed, down to one. Each meal's share is the daily target divided evenly by the number of meals.
- **A tile's colour is scored against the whole day.** `need` is what the sum of every meal still lacks against the daily target. A portion's `share` and its overshoot are measured against one meal's share, so a portion moves the colour as much as it did against a meal target.
- **Per-meal numbers are protein, carbs and volume**, each against the meal's share, shown on the meal's card. The day card holds the target and all five daily totals.
- **One meal or the day is selected.** A tile click adds to the selected meal. With the day selected it adds nothing and asks for a meal.
- The day stays in the browser under [0005](0005-state-lives-in-the-browser.md). It is one day's plan, not a history, so it does not outlive a browser profile and does not trip 0005's trigger.

## Why

Jeremi asked for it in review. Protein, carbs, fat and fibre count mostly over a day. Protein has a per-meal floor, carbs a per-meal ceiling (the glucose spike), and volume is fullness meal by meal. Jeremi picked those three for the meal cards. Fat and kcal are left to the day.

Measuring `share` against the daily target would cut every colour to a third with three meals, because the fixed scale ([0009](0009-colour-is-measured-against-the-target.md)) was tuned to a meal-sized target.

## Rejected

**A daily target that sums meal targets.** It would make the day only as right as each meal, and the colours are meant to follow the day.

**Adding to the last selected meal while the day is selected.** Jeremi chose that the day only shows, and asks for a meal.

## Consequences

- Early in the day every dimension is still mostly missing, so `need − mean(need)` is small and the colours are paler than against a meal. They sharpen as the day fills up.
- A meal can go far past its share without a red tile if the day still has room. Only the meal card's numbers show it.
- The storage key is now `nutrientmanager.v2`. A plate saved under v1 becomes the first meal; its meal target is dropped, since it would be wrong as a daily one.
- `Fit.APortionIsWeighedAgainstOneMealsShareOfTheDay` holds the share scaling.
