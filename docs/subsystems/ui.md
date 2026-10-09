# UI

Scope: `site/js/app.js`, `site/js/ui/` and `site/css/app.css` — the grid, the day and meal cards, and how state reaches them. It does not cover how a score is computed ([fit scoring](fit-scoring.md)).

## State

One object, owned by `app.js`: the daily `target`, `meals` (one `[{ id, ml }]` per meal), `selected` (a meal's index, or `'day'`) and `view` (sort, search, whether reference rows show, and `colours`: `'day'` or `'selection'`). Every change goes through `update()`, which schedules one render for after the current event: save, rank, re-render both views. Nothing else holds state, except two things kept unsaved: the ranking from before the latest change to the meals or target, for the change arrows (dropped when what the tiles are scored against changes, which includes the number of meals), and the food last clicked while the day was selected, for the day card's hint. The day's shape is [0011](../decisions/0011-a-day-of-meals-against-a-daily-target.md).

## The grid

One section per category, in the table's order. A tile shows, from top to bottom:

- the food's picture ([0013](../decisions/0013-foods-are-shown-as-fluent-3d-emoji.md)), its name, and **ml per 100 kcal** — the volume 100 kcal of the food buys
- preparation, or for a fat portion the portion and its volume
- kcal as listed, and the table's comparison to the category average
- protein, fat and carbs as listed; `~` marks a non-zero estimate
- a bar of where the food's calories come from
- what a click adds, and how much the selected meal already holds (the whole day when the day is selected), each with its estimated weight
- after a change to the meals or target, a green ↑ or red ↓ beside the name if the tile moved band, from `Fit.compare`. It stays until the next change, and leaving or entering the empty plate shows none
- on hover or focus, its band, why it moved if it did, and up to three reasons behind its colour, as an overlay that does not move the grid

**The tint** is the tile's band ([fit scoring](fit-scoring.md#bands)), one flat colour each, held in `--fit-<band>` tokens on `:root`. From best: strong green, light green, yellow-green (`--fair`), yellow-orange (`--caution`), red. A `.fit-<band>` class gives a tile its colour. The **Colours** toggle in the header scores every tile against the whole day (**Day**, the default) or the selected meal against its share (**Selection**); with the day selected both are the day ([0012](../decisions/0012-colours-can-follow-the-selected-meal.md)). The hover reasons and the line under the legend name which. The legend is one gradient through the same five tokens, worst on the left. The hover overlay and the tile's aria label open with the band's name, from `Format.TIER_LABEL`. Tokens are in `:root`, with a dark set under `prefers-color-scheme`.

Reference rows (†) are dimmed and can be hidden. Sort orders apply within each category.

## The day and its meals

The sidebar is a stack of cards: the day, then one card per meal, then **+ Add meal**. Clicking a card, or its title, selects it. A click on a control inside a card does only what the control does. One card is selected at a time, outlined in the accent colour.

**The day card**

- **Daily target**: five number inputs, in the order kcal, volume, protein, fat, carbs. A warning appears when protein, fat and carbs add up to more than 10 % away from the kcal target.
- **Totals** of every meal: total volume as the headline, the day's ml per 100 kcal, then a bar per dimension in the target's order. Past its target a bar rescales and the overshoot is hatched red.
- **Short on**: the day's most-missing balance dimensions.
- When selected, a line asking for a meal. A tile clicked meanwhile adds nothing, and the line names it.

**A meal card**

- Its name and how many foods it holds, then bars for volume, protein and carbs against the meal's share of the day, on every meal whether selected or not.
- Selected, its rows and **Clear** as well. Selection changes nothing else on the card.
- **×** removes the meal, asking first if it holds food. The last meal has no ×. Meals are named by position, so removing one renumbers the rest.
- **Rows**: the food's picture and name, −/+ by the food's step, or type an ml value. Zero removes the row. Under the ml is the estimated weight, which is also an input. A weight typed there is converted to ml ([0008](../decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md)).

A weight is always marked `~` and carries a tooltip ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). There is no weight total.

## Rules

- Elements are built with `Format.el()` and `textContent`. No `innerHTML` with data.
- Every control is a `button`, `input` or `select`.
- Every control a render replaces carries a `data-focus` key, unique on the page (rows show for the selected meal only, so a food id is enough); the render gives focus back to the control with the key that had it.
- The layout stacks below 900 px, with the day and meals above the grid.

## See also
- [Fit scoring](fit-scoring.md) — what `norm` means
- [JS style](../conventions/js-style.md) — the namespace and script order
