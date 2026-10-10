# UI

Scope: `site/js/app.js`, `site/js/ui/` and `site/css/app.css` — the grid, the day and meal cards, and how state reaches them. It does not cover how a score is computed ([fit scoring](fit-scoring.md)).

## State

One object, owned by `app.js`: the daily `target`, `meals` (one `[{ id, ml }]` per meal), `selected` (a meal's index, or `'day'`) and `view` (sort, search, `colours`: `'day'` or `'selection'`, and `icons`: `'emoji'` or `'minimal'`). Every change goes through `update()`, which schedules one render for after the current event: save, rank, re-render both views. Nothing else holds state, except three things kept unsaved: the ranking from before the latest change to the meals or target, for the change arrows (dropped when what the tiles are scored against changes, which includes the number of meals), the tile clicks of the last 0.7 s, for their effects, and the meal removed since the last render, so the sidebar's glide matches each card with its own meal. The day's shape is [0011](../decisions/0011-a-day-of-meals-against-a-daily-target.md).

## The grid

One section per category, in the table's order. A tile shows, from top to bottom:

- set into a gap in the top of its frame, its band as a meter of one to five lit diamonds (one per step up from the worst band) and a short word from `Format.TIER_SHORT`
- the food's picture ([0013](../decisions/0013-foods-are-shown-as-fluent-3d-emoji.md)), its name, and **ml per 100 kcal** — the volume 100 kcal of the food buys, in the band's colour
- preparation, or for a fat portion the portion and its volume
- kcal as listed
- protein, fat and carbs as listed; `~` marks a non-zero estimate
- a bar of where the food's calories come from
- what a click adds, and under it how much the selected meal already holds (the whole day when the day is selected), each with its estimated weight
- after a change to the meals or target, a green ↑ or red ↓ on the picture's corner if the tile moved band, from `Fit.compare`. It stays until the next change, and leaving or entering the empty plate shows none
- on hover or focus, its band, why it moved if it did, and up to three reasons behind its colour, as an overlay that does not move the grid

**A click plays an effect** ([0016](../decisions/0016-tile-clicks-are-animated.md)). An add sends two stepped rings, gold and the band's colour, out of the frame, flashes a stepped panel of the band under the content and floats the amount up from the foot. A click refused while the day is selected shakes the tile, and the day card's hint shakes and flashes red. Each render rebuilds a tile's effects started as far in as they have run, so quick clicks stack. With reduced motion the rings and movement are dropped.

**The band colour** is the tile's band ([fit scoring](fit-scoring.md#bands)), one neon colour each, held in `--fit-<band>` tokens on `:root`. From best: green, lime, yellow (`--fair`), orange (`--caution`), red. A `.fit-<band>` class sets the tile's `--fit-c`, which colours the line inside its gold frame, the glow inside it and its ml per 100 kcal ([0014](../decisions/0014-the-site-is-styled-neon-deco.md)). The **Colours** toggle in the header scores every tile against the whole day (**Day**, the default) or the selected meal against its share (**Selection**); with the day selected both are the day ([0012](../decisions/0012-colours-can-follow-the-selected-meal.md)). The hover reasons and the line under the legend name which. The legend is one gradient through the same five tokens, worst on the left. The hover overlay and the tile's aria label open with the band's name, from `Format.TIER_LABEL`. Tokens are in `:root`; the site is dark only.

**The Icons toggle** shows the 3D emoji (**3D**, the default) or the same emoji as one-colour icons (**Minimal**), in the grid and the meal rows ([0015](../decisions/0015-food-pictures-can-be-minimal-icons.md)). A minimal icon is an inline SVG in `currentColor`: on a tile it takes the band colour, in a row it is gold.

Every food is shown alike ([0018](../decisions/0018-every-food-is-shown-alike.md)). Sort orders apply within each category.

## The day and its meals

The sidebar is a stack of cards: the day, then one card per meal, then **+ Add meal**. Clicking a card, or its title, selects it. A click on a control inside a card does only what the control does. One card is selected at a time, outlined in the accent colour. A card whose height changes glides to it, and the sidebar never scrolls on its own: there is always room below the last card to keep its position ([0017](../decisions/0017-cards-glide-to-their-new-height.md)).

**The day card**

- **Clear all** in its head empties every meal, asking first, and keeps the meals. It is greyed out while the day is empty.
- **Daily target**: five number inputs, in the order kcal, volume, protein, fat, carbs. A warning appears when protein, fat and carbs add up to more than 10 % away from the kcal target.
- **Totals** of every meal: total volume as the headline, the day's ml per 100 kcal, then a bar per dimension in the target's order. Past its target a bar rescales and the overshoot is hatched red.
- **Short on**: the day's most-missing balance dimensions, or *Nothing added yet* while the day is empty.
- Always, a line asking for a meal to add foods to, so selecting the day never resizes the card; dimmed while a meal is selected. A tile clicked while the day is selected adds nothing.

**A meal card**

- Its name, how many foods it holds and **Clear**, then bars for volume, protein and carbs against the meal's share of the day, on every meal whether selected or not. Clear empties that meal without selecting it, asking first, and is greyed out while the meal is empty.
- Selected, its rows as well. Selection changes nothing else on the card.
- **×** removes the meal, asking first if it holds food. The last meal has no ×. Meals are named by position, so removing one renumbers the rest.
- **Rows**: the food's picture and name, −/+ by the food's step, or type an ml value. Zero removes the row. Under the ml is the estimated weight, which is also an input. A weight typed there is converted to ml ([0008](../decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md)).

A weight is always marked `~` and carries a tooltip ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). There is no weight total.

## Rules

- Elements are built with `Format.el()` and `textContent`. No `innerHTML` with data.
- Every control is a `button`, `input` or `select`.
- Every control a render replaces carries a `data-focus` key, unique on the page (rows show for the selected meal only, so a food id is enough); the render gives focus back to the control with the key that had it.
- **A click never changes a tile's size**, as a taller tile grows its whole row and moves every row below it. The held line is reserved while blank, neither foot line wraps, and the change arrow sits on the picture rather than in the name.
- **Tiles in a row line up below the head.** The spare height of a short name sits under it, so preparation, kcal, macros and the foot share their lines across the row.
- The layout stacks below 900 px, with the day and meals above the grid.

## See also
- [Fit scoring](fit-scoring.md) — what `norm` means
- [JS style](../conventions/js-style.md) — the namespace and script order
