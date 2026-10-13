# 0027 — A meal says how many portions it makes

Scope: how many portions a meal of the day or a premade meal makes, and what the day counts of it. What the cards show is [plate](../subsystems/plate.md) and [shelf](../subsystems/shelf.md); how a meal is scored is [fit scoring](../subsystems/fit-scoring.md).

## Decision

- **A meal of the day and a premade meal each make a number of portions**, a whole number from 1 to 20, and 1 unless set. Its rows are the whole recipe: listed, typed and stepped as cooked.
- **The day counts one portion of each meal.** Every total, bar and score is worked out from the rows divided by the meal's portions: the day card, a meal's bars, the tiles and the shelf's cards. What a tile says a meal holds is one portion's.
- **Both cards set it with − and + around the count**, which can also be typed or stepped with ↑ ↓. A meal of the day sets it under its head, a premade meal under its band.
- **A tile click gives each portion one more default portion**: it adds the default portion times the portions to the rows.
- **Into Meal N adds the whole premade meal**: every row as stored, whatever portions either meal makes. The meal keeps its own count. **New meal** and **Shelve** carry the portions with the rows.
- **A premade meal's band scores what Into would add**: the whole recipe over the portions the selected meal makes. With the day selected, where Into is off, it scores one portion of the premade meal, as New meal gives. The card's numbers stay one portion of its own.
- **The server keeps a premade meal's `portions`.** `add` takes it, `copy` keeps it, and a new change, `portions`, sets it. A stored meal without one makes 1.
- **The browser saves a meal of the day as `{ items, portions }`.** A meal saved before this, a bare list of rows, makes 1.
- Supersedes in part [0011](0011-a-day-of-meals-against-a-daily-target.md): the day was every meal's rows summed whole; and [0023](0023-the-shelf-is-kept-on-the-server.md): its list of changes.

## Why

Jeremi asked for a meal card that says how many portions it makes, easily changed, with its numbers for one portion and its foods for the whole recipe, and then for the day's meal cards to split the same way (2026-10-12). *Dorsz po koreańsku* is cooked as three servings; shelved whole, it scored as one meal three times too big.

## Rejected

- **Listing the foods for one portion.** The prototype offered both, and Jeremi chose the whole recipe: it is what is cooked and measured.
- **Into giving each portion of the meal one portion of the premade meal**, the rows times the meal's portions over the premade meal's. Jeremi found it put in a fraction of a recipe and asked for the whole of it, always (2026-10-13).
- **The band scoring one portion of the premade meal, whatever is selected.** Into then added more or less than the band showed, by the ratio of the two counts: three times as much for a recipe of three put into a meal of one (2026-10-13).
- **A click adding one default portion to the whole recipe.** The tile is scored as one more portion eaten, and the click would have given each portion a fraction of one.
- **Putting a premade meal in at a scale, half or double.** The open question on the shelf; portions say what one serving is, where a scale is a guess made at every use.
- **The count as an unsaved view setting.** It describes the recipe, and would be gone on a reload or on the other device.
- **Fractions of a portion.** A recipe is shared out in whole portions, and a whole number steps cleanly with − and +.
- **The mouse wheel stepping the count.** Scrolling the sidebar past a card would change its meal.

## Consequences

- **A meal of one portion is what a meal was before**, so a day and a shelf saved before this read as they did.
- **Two scales on one card**: the rows and the *Whole recipe* line are the recipe; the bars, the tiles and the day are one portion. Each split card says which with *One portion · 1 of N*.
- **A shelf card's band and numbers can measure different amounts**: the band what Into would add, the numbers one portion of the premade meal. They agree when the two meals make as many portions. The shelf's subtitle says what the band is of.
- **The steppers are under no automated test**; the counting, putting in and the server's checks are (`Tests/nutrition.test.js`, `Tests/store.test.js`, `Tests/shelf.test.js`, `Tests/test_shelf.py`).
