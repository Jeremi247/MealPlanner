# Architecture overview

Scope: the app in one page — what each file is, and how a click becomes a coloured grid. Rules live in the docs linked from each section.

## Shape

A static site in `site/`, served by Python's `http.server` from `Serve.bat`, with no build step and no dependencies ([0002](../decisions/0002-no-build-step-and-no-dependencies.md)). Scripts are classic `<script>` tags sharing one global namespace, `NM`, loaded in dependency order by `site/index.html`.

| File | Is | Owned by |
|---|---|---|
| `site/js/data/foods.js` | The food table, as Jeremi's reference table lists it | [food data](../subsystems/food-data.md) |
| `site/js/data/icons.js`, `site/js/data/icons-minimal.js`, `site/img/foods/` | The emoji picture for each food, 3D or minimal | [0013](../decisions/0013-foods-are-shown-as-fluent-3d-emoji.md), [0015](../decisions/0015-food-pictures-can-be-minimal-icons.md) |
| `site/css/app.css`, `site/fonts/` | The neon deco look, and its two fonts | [0014](../decisions/0014-the-site-is-styled-neon-deco.md) |
| `site/js/core/nutrition.js` | Normalises the table to per-ml records; sums a plate | [food data](../subsystems/food-data.md) |
| `site/js/core/fit.js` | Scores one more portion of each food against the day | [fit scoring](../subsystems/fit-scoring.md) |
| `site/js/store.js` | Per-browser persistence of target, meals, selection and view | [0005](../decisions/0005-state-lives-in-the-browser.md) |
| `site/js/ui/format.js` | Number formatting and the `el()` DOM helper | [JS style](../conventions/js-style.md) |
| `site/js/ui/grid.js` | The tinted food grid | [UI](../subsystems/ui.md) |
| `site/js/ui/plate.js` | The day card and the meal cards | [UI](../subsystems/ui.md) |
| `site/js/app.js` | State, and the re-render on every change | [UI](../subsystems/ui.md) |

`core/` reads no DOM and is what `Tests/` exercises. `ui/` reads `core/` and never the reverse.

## A click, end to end

1. A tile click adds the food's default portion in ml to the selected meal in `state.meals`.
2. `app.js` saves the state, then calls `NM.Fit.rank(foods, day, target, meals)` with every meal's rows together.
3. `rank` sums the day, scores every food's default portion against it, and maps each score to −1…1 on a fixed scale.
4. `Grid.render` and `Plate.render` rebuild their roots from the result.

There is no incremental update. The grid is ~66 tiles and a full rebuild is below a frame.

## See also
- [Critical assumptions](critical-assumptions.md) — what every change here is checked against
- [Decision register](../decisions/README.md) — why it is shaped this way
- [Testing](../testing.md) — what proves it works
