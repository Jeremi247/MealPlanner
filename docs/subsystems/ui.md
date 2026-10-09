# UI

Scope: `site/js/app.js`, `site/js/ui/` and `site/css/app.css` — the grid, the plate sidebar, and how state reaches them. It does not cover how a score is computed ([fit scoring](fit-scoring.md)).

## State

One object, owned by `app.js`: `target`, `plate` (`[{ id, ml }]`) and `view` (sort, search, whether reference rows show). Every change goes through `update()`, which schedules one render for after the current event: save, rank, re-render both views. Nothing else holds state, except the ranking from before the latest change to the plate or target. `app.js` keeps it, unsaved, for the change arrows.

## The grid

One section per category, in the table's order. A tile shows, from top to bottom:

- name, and **ml per 100 kcal** — the volume 100 kcal of the food buys
- preparation, or for a fat portion the portion and its volume
- kcal as listed, and the table's comparison to the category average
- protein, fat and carbs as listed; `~` marks a non-zero estimate
- a bar of where the food's calories come from
- what a click adds, and how much is already on the plate, each with its estimated weight
- after a change to the plate or target, a green ↑ or red ↓ beside the name if the tile moved band, from `Fit.compare`. It stays until the next change, and leaving or entering the empty plate shows none
- on hover or focus, its band, why it moved if it did, and up to three reasons behind its colour, as an overlay that does not move the grid

**The tint** is the tile's band ([fit scoring](fit-scoring.md#bands)), one flat colour each, held in `--fit-<band>` tokens on `:root`. From best: strong green, light green, yellow-green (`--fair`), yellow-orange (`--caution`), red. A `.fit-<band>` class gives a tile its colour. The legend is one gradient through the same five tokens, worst on the left. The hover overlay and the tile's aria label open with the band's name, from `Format.TIER_LABEL`. Tokens are in `:root`, with a dark set under `prefers-color-scheme`.

Reference rows (†) are dimmed and can be hidden. Sort orders apply within each category.

## The plate

- **Meal target**: five number inputs. A warning appears when protein, fat and carbs add up to more than 10 % away from the kcal target.
- **Totals**: total volume as the headline, the plate's ml per 100 kcal, then a bar per dimension. Past its target a bar rescales and the overshoot is hatched red.
- **Short on**: the most-missing balance dimensions.
- **Rows**: −/+ by the food's step, or type an ml value. Zero removes the row. Under the ml is the estimated weight, which is also an input. A weight typed there is converted to ml ([0008](../decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md)).

A weight is always marked `~` and carries a tooltip ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). There is no weight total.

## Rules

- Elements are built with `Format.el()` and `textContent`. No `innerHTML` with data.
- Every control is a `button`, `input` or `select`.
- Every control a render replaces carries a `data-focus` key, unique on the page; the render gives focus back to the control with the key that had it.
- The layout stacks below 900 px, with the plate above the grid.

## See also
- [Fit scoring](fit-scoring.md) — what `norm` means
- [JS style](../conventions/js-style.md) — the namespace and script order
