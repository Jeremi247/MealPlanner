# 0018 — Every food is shown alike

Scope: the reference table's † rows, pork loin and lean beef, and the protein category's kcal limit. Their values do not change ([food data](../subsystems/food-data.md)).

## Decision

- **The two † rows are shown like every other protein food**: not dimmed, no †, and no header toggle to hide them. Food rows no longer carry `reference`.
- **The protein category's one limit is ≥6 g protein per 100 ml.** The table's 107.4 kcal per 100 ml is no longer a limit the data is checked against.
- **Their values stay the table's**, and the tests still reproduce the table's kcal comparison column for them.

## Why

The tiles are coloured by how a food fits what the day lacks ([0009](0009-colour-is-measured-against-the-target.md)), so a row over the category's calorie limit already shows as a worse fit where it is one. Dimming it as well judged it a second time, by a grouping rule of the table's that the app does not score. Jeremi removed the marking in the same change as [0017](0017-cards-glide-to-their-new-height.md).

## Rejected

- **Dimming the rows and marking them †, as before.** It said "reference only" about two foods the planner may well eat.
- **Keeping the toggle with the rows shown by default.** A setting nobody needs once the rows are treated alike.

## Consequences

- `Data.ProteinFoodsMeetTheProteinFloor` replaces the test that held the limit in both directions. A protein row over 107.4 kcal passes.
- A saved `showReference` is dropped when the state loads, as `Store.load` keeps only the keys it knows.
- If the table gains a † row that is not a food to eat, this record is the one to supersede.
