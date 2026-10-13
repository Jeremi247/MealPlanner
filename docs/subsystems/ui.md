# UI

Scope: `site/js/app.js`, `site/js/ui/` and `site/css/app.css` — the grid, and how state reaches it and the sidebar. The sidebar's cards are [plate](plate.md). It does not cover how a score is computed ([fit scoring](fit-scoring.md)).

## State

One object, owned by `app.js`: the daily `target`, `meals` (one `{ items [{ id, ml }], portions }` per meal, its rows the whole recipe), `selected` (a meal's index, or `'day'`) and `view` (sort, search, `colours`: `'day'` or `'selection'`, and `icons`: `'emoji'` or `'minimal'`). Every change goes through `update()`, which schedules one render for after the current event: save, rank, re-render both views. Nothing else holds state, except the shelf ([shelf](shelf.md)), the foods of your own as the server last gave them, and three things kept unsaved: the ranking from before the latest change to the meals or target, for the change arrows (dropped when what the tiles are scored against changes, which includes the number of meals and the list of foods), the tile clicks of the last 0.7 s, for their effects, and the meal removed since the last render, so the sidebar's glide matches each card with its own meal. The day's shape is [0011](../decisions/0011-a-day-of-meals-against-a-daily-target.md). **The day counts one portion of each meal**: the totals, the bars, the tiles and the shelf's colours work on its rows divided by its portions ([0027](../decisions/0027-a-meal-says-how-many-portions-it-makes.md)).

## The grid

One section per category, in the table's order. A tile shows, from top to bottom:

- set into a gap in the top of its frame, its band as a meter of one to five lit diamonds (one per step up from the worst band) and a short word from `Format.TIER_SHORT`
- the food's picture ([0013](../decisions/0013-foods-are-shown-as-fluent-3d-emoji.md)), its name (broken at a hyphen only where neither part is under three letters), and **ml per 100 kcal** — the volume 100 kcal of the food buys, in the band's colour, its unit on two short lines to leave the name room
- preparation, or for a portion food the portion and its volume; for a food of your own, *Yours* before it
- kcal as listed
- protein, fat and carbs as listed; `~` marks a non-zero estimate
- a bar per macro of its grams on the listed basis: a glowing tube up to a tick at 10 g, then white-hot past it, with up to 10 g more squeezed into the last quarter ([0019](../decisions/0019-tile-macros-are-drawn-in-grams.md))
- what a click adds, and under it how much the selected meal already holds, a fat portion in its unit ([0020](../decisions/0020-a-portion-is-counted-in-its-own-unit.md)) (the whole day when the day is selected), each with its estimated weight. For a split meal both are one portion's, the second labelled *per portion*, and a click adds the amount to each portion.
- after a change to the meals or target, a green ↑ or red ↓ on the picture's corner if the tile moved band, from `Fit.compare`. It stays until the next change, and leaving or entering the empty plate shows none
- on hover or focus, its band, why it moved if it did, and up to three reasons behind its colour, as an overlay that does not move the grid

**A click plays an effect** ([0016](../decisions/0016-tile-clicks-are-animated.md)). An add sends two stepped rings, gold and the band's colour, out of the frame, flashes a stepped panel of the band under the content and floats the amount up from the foot. A click refused while the day is selected shakes the tile, and the day card's hint shakes and flashes red. Each render rebuilds a tile's effects started as far in as they have run, so quick clicks stack. With reduced motion the rings and movement are dropped.

**The band colour** is the tile's band ([fit scoring](fit-scoring.md#bands)), one neon colour each, held in `--fit-<band>` tokens on `:root`. From best: green, lime, yellow (`--fair`), orange (`--caution`), red. A `.fit-<band>` class sets the tile's `--fit-c`, which colours the line inside its gold frame, the glow inside it and its ml per 100 kcal ([0014](../decisions/0014-the-site-is-styled-neon-deco.md)). The **Colours** toggle in the header scores every tile against the whole day (**Day**, the default) or the selected meal against its share (**Selection**); with the day selected both are the day ([0012](../decisions/0012-colours-can-follow-the-selected-meal.md)). The hover reasons and the line under the legend name which. The legend is one gradient through the same five tokens, worst on the left. The hover overlay and the tile's aria label open with the band's name, from `Format.TIER_LABEL`. Tokens are in `:root`; the site is dark only.

**The Icons toggle** shows the 3D emoji (**3D**, the default) or the same emoji as one-colour icons (**Minimal**), in the grid and the meal rows ([0015](../decisions/0015-food-pictures-can-be-minimal-icons.md)). A minimal icon is an inline SVG in `currentColor`: on a tile it takes the band colour, in a row it is gold.

Every food is shown alike ([0018](../decisions/0018-every-food-is-shown-alike.md)). Sort orders apply within each category.

## Adding a food of your own

**+ Add food** in the header opens the box a food of your own is added or edited in ([your foods](your-foods.md)).

## The day and its meals

The sidebar's day card and meal cards, and how a meal is split into portions, are [plate](plate.md).

## Rules

- Elements are built with `Format.el()` and `textContent`. No `innerHTML` with data.
- Every control is a `button`, `input` or `select`.
- Every control a render replaces carries a `data-focus` key, unique on the page (rows show for the selected meal only, so a food id is enough); the render gives focus back to the control with the key that had it.
- **A click never changes a tile's size**, as a taller tile grows its whole row and moves every row below it. The held line is reserved while blank, neither foot line wraps, and the change arrow sits on the picture rather than in the name.
- **Tiles in a row line up below the head.** The spare height of a short name sits under it, so preparation, kcal, macros and the foot share their lines across the row.
- The layout stacks below 900 px, with the day and meals above the grid.

## See also
- [Plate](plate.md) — the day card and the meal cards
- [Fit scoring](fit-scoring.md) — what `norm` means
- [Your foods](your-foods.md) — the box a food of your own is added in
- [JS style](../conventions/js-style.md) — the namespace and script order
