# Architecture overview

Scope: the app in one page — what each file is, and how a click becomes a coloured grid. Rules live in the docs linked from each section.

## Shape

A static site in `site/`, with no build step and no dependencies ([0002](../decisions/0002-no-build-step-and-no-dependencies.md)), and one small service, `Server/shelf.py`, that keeps the shelf of premade meals and the foods of your own ([0023](../decisions/0023-the-shelf-is-kept-on-the-server.md), [0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)). `Serve.bat` runs that script, which serves the site too. `Deploy.bat` copies both to the home server, where Caddy serves the site and forwards `/api/` to the shelf ([deploy](../deploy.md)). Scripts are classic `<script>` tags sharing one global namespace, `NM`, loaded in dependency order by `site/index.html`.

| File | Is | Owned by |
|---|---|---|
| `site/js/data/foods.js` | The food table, as Jeremi's reference table lists it | [food data](../subsystems/food-data.md) |
| `site/js/data/icons.js`, `site/js/data/icons-minimal.js`, `site/img/foods/` | The emoji picture for each food, 3D or minimal | [0013](../decisions/0013-foods-are-shown-as-fluent-3d-emoji.md), [0015](../decisions/0015-food-pictures-can-be-minimal-icons.md) |
| `site/css/app.css`, `site/fonts/`, `site/img/favicon.svg` | The neon deco look, its two fonts, and the tab icon (lean beef's minimal picture, lit green) | [0014](../decisions/0014-the-site-is-styled-neon-deco.md) |
| `site/js/core/nutrition.js` | Normalises the table to per-ml records; sums a plate; one portion of a meal | [food data](../subsystems/food-data.md) |
| `site/js/core/category.js` | The rules that put a food in its category | [0025](../decisions/0025-a-foods-category-follows-its-macros.md) |
| `site/js/core/custom-foods.js` | Foods of your own as data: what a stored one may hold, a form's entry, the table with them added | [food data](../subsystems/food-data.md) |
| `site/js/core/fit.js` | Scores one more portion of each food, or one premade meal, against the day | [fit scoring](../subsystems/fit-scoring.md) |
| `site/js/core/shelf.js` | The shelf as data: what a stored one may hold, its rows, a meal or a row moved, a premade meal put into a meal | [shelf](../subsystems/shelf.md) |
| `site/js/store.js` | Per-browser persistence of target, meals, selection and view | [0005](../decisions/0005-state-lives-in-the-browser.md) |
| `site/js/server-store.js` | Fetches the shelf and the foods of your own, sends them changes, keeps the last copy of each seen | [0023](../decisions/0023-the-shelf-is-kept-on-the-server.md), [0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md) |
| `site/js/ui/format.js` | Number formatting and the `el()` DOM helper | [JS style](../conventions/js-style.md) |
| `site/js/ui/fx.js` | The effect a clicked tile plays | [0016](../decisions/0016-tile-clicks-are-animated.md) |
| `site/js/ui/confirm.js` | The box a Clear or a remove asks in, or a name is typed in | [0021](../decisions/0021-a-confirmation-drops-from-its-button.md) |
| `site/js/ui/portions.js` | The count of portions a meal makes, between − and +, on a meal card and a shelf card | [plate](../subsystems/plate.md) |
| `site/js/ui/grid.js` | The tinted food grid | [UI](../subsystems/ui.md) |
| `site/js/ui/plate.js` | The day card and the meal cards | [plate](../subsystems/plate.md) |
| `site/js/ui/shelf.js` | The shelf's rows and cards, and dragging them | [shelf](../subsystems/shelf.md) |
| `site/js/ui/food-form.js` | The box a food of your own is added or edited in | [UI](../subsystems/ui.md) |
| `site/js/app.js` | State, and the re-render on every change | [UI](../subsystems/ui.md) |
| `Server/shelf.py` | Keeps the shelf and the foods of your own in one JSON file and answers `/api/shelf` and `/api/foods`; with `--site`, serves the site | [shelf](../subsystems/shelf.md), [0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md) |

`core/` reads no DOM and is what `Tests/` exercises. `ui/` reads `core/` and never the reverse.

## A click, end to end

1. A tile click adds the food's default portion in ml to the selected meal in `state.meals`, once for each portion the meal makes.
2. `app.js` saves the state, then calls `NM.Fit.rank(foods, day, target, meals)` with one portion of every meal's rows together.
3. `rank` sums the day, scores every food's default portion against it, and maps each score to −1…1 on a fixed scale.
4. `Grid.render`, `Plate.render` and `ShelfView.render` rebuild their roots from the result.

There is no incremental update. The grid is ~66 tiles and a full rebuild is below a frame.

## See also
- [Critical assumptions](critical-assumptions.md) — what every change here is checked against
- [Decision register](../decisions/README.md) — why it is shaped this way
- [Testing](../testing.md) — what proves it works
