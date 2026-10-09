# UI

Scope: `site/js/app.js`, `site/js/ui/` and `site/css/app.css` — the grid, the plate sidebar, and how state reaches them. It does not cover how a score is computed ([fit scoring](fit-scoring.md)).

## State

One object, owned by `app.js`: `target`, `plate` (`[{ id, ml }]`) and `view` (sort, search, whether reference rows show). Every change goes through `update()`, which schedules one render for after the current event: save, rank, re-render both views. Nothing else holds state.

## The grid

One section per category, in the table's order. A tile shows, from top to bottom:

- name, and **ml per 100 kcal** — the volume 100 kcal of the food buys
- preparation, or for a fat portion the portion and its volume
- kcal as listed, and the table's comparison to the category average
- protein, fat and carbs as listed; `~` marks a non-zero estimate
- a bar of where the food's calories come from
- what a click adds, and how much is already on the plate
- on hover or focus, up to three reasons behind its colour, as an overlay that does not move the grid

**The tint** mixes the fit colour into the tile background: `norm × 58 %` of green, or of red when negative. Tokens are in `:root`, with a dark set under `prefers-color-scheme`.

Reference rows (†) are dimmed and can be hidden. Sort orders apply within each category.

## The plate

- **Meal target**: five number inputs. A warning appears when protein, fat and carbs add up to more than 10 % away from the kcal target.
- **Totals**: total volume as the headline, the plate's ml per 100 kcal, then a bar per dimension. Past its target a bar rescales and the overshoot is hatched red.
- **Short on**: the most-missing balance dimensions.
- **Rows**: −/+ by the food's step, or type an ml value. Zero removes the row.

## Rules

- Elements are built with `Format.el()` and `textContent`. No `innerHTML` with data.
- Every control is a `button`, `input` or `select`.
- Every control a render replaces carries a `data-focus` key, unique on the page; the render gives focus back to the control with the key that had it.
- The layout stacks below 900 px, with the plate above the grid.

## See also
- [Fit scoring](fit-scoring.md) — what `norm` means
- [JS style](../conventions/js-style.md) — the namespace and script order
