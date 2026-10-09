# Architecture overview

Scope: the app in one page — what each file is, and how a click becomes a coloured grid. Rules live in the docs linked from each section.

## Shape

A static site in `site/`, served by Python's `http.server` from `Serve.bat`, with no build step and no dependencies ([0002](../decisions/0002-no-build-step-and-no-dependencies.md)). Scripts are classic `<script>` tags sharing one global namespace, `NM`, loaded in dependency order by `site/index.html`.

| File | Is | Owned by |
|---|---|---|
| `site/js/data/foods.js` | The food table, as Jeremi's reference table lists it | [food data](../subsystems/food-data.md) |
| `site/js/core/nutrition.js` | Normalises the table to per-ml records; sums a plate | [food data](../subsystems/food-data.md) |
| `site/js/core/fit.js` | Scores one more portion of each food against the plate | [fit scoring](../subsystems/fit-scoring.md) |
| `site/js/store.js` | Per-browser persistence of target, plate and view | [0005](../decisions/0005-state-lives-in-the-browser.md) |
| `site/js/ui/format.js` | Number formatting and the `el()` DOM helper | [JS style](../conventions/js-style.md) |
| `site/js/ui/grid.js` | The tinted food grid | [UI](../subsystems/ui.md) |
| `site/js/ui/plate.js` | Target form, totals against target, plate rows | [UI](../subsystems/ui.md) |
| `site/js/app.js` | State, and the re-render on every change | [UI](../subsystems/ui.md) |

`core/` reads no DOM and is what `Tests/` exercises. `ui/` reads `core/` and never the reverse.

## A click, end to end

1. A tile click adds the food's default portion in ml to `state.plate`.
2. `app.js` saves the state, then calls `NM.Fit.rank(foods, plate, target)`.
3. `rank` sums the plate, scores every food's default portion against it, and normalises the grid to −1…1.
4. `Grid.render` and `Plate.render` rebuild their roots from the result.

There is no incremental update. The grid is ~66 tiles and a full rebuild is below a frame.

## See also
- [Critical assumptions](critical-assumptions.md) — what every change here is checked against
- [Decision register](../decisions/README.md) — why it is shaped this way
- [Testing](../testing.md) — what proves it works
