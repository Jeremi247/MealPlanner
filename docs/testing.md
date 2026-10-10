# Testing

Scope: how the app is verified, and what a green run does and does not prove. Why the gate is a headless browser is [0006](decisions/0006-the-test-gate-is-a-headless-browser.md).

## The gate

```
powershell -NoProfile -ExecutionPolicy Bypass -File Scripts/Gate.ps1
```

Runs, in order:

- **`Scripts/Test.ps1`** — `Tests/index.html` in headless Chrome. Exit code is the failure count.
- **`Scripts/CheckDocs.ps1`** — every relative markdown link and `#anchor` resolves, and every file is inside its word budget ([docs & comments](conventions/docs-and-comments.md)).

Either can be run on its own. Before calling a change done, run the gate and open the site.

## What is tested

| File | Holds |
|---|---|
| `Tests/data.test.js` | Every row of Jeremi's table is present once, reproduces the table's own kcal comparison column, keeps the macros the table gives, and respects its category's limits; estimated macros roughly account for the listed kcal; every row has a marked, plausible weight; every food has a picture, its file exists, and it has a minimal version |
| `Tests/nutrition.test.js` | Ranges at midpoint, portions spread over their volume, the table's own starch portion examples, plate sums, weight scaling with volume, a typed weight's volume |
| `Tests/fit.test.js` | The specifying example, overshoot, the fixed colour scale, the five bands, band changes between picks, a nearly-met plate, the empty regime, a portion weighed against one meal's share of the day |
| `Tests/store.test.js` | Unavailable and malformed storage both fall back to defaults; a selection that names no meal falls back to the first; an unknown colour mode is the day; an unknown icon style is the 3D emoji; a v1 plate becomes the first meal without its meal target |

A new test file is added to `Tests/index.html` below the scripts it uses. A script that throws while loading fails the run by name, since its tests never register.

**A test whose name claims a failure mode has been shown to fail by making that mistake on purpose**, then reverting. A kcal typo in a row, an edited protein value, a text `ml` in saved state, a syntax error in `foods.js`, a food missing from `icons.js`, a missing picture file, a missing minimal icon, a sign flip of the overshoot penalty and a `share` left unscaled by the number of meals all fail the suite by name.

## What a green run does not prove

- **The views are not under test.** `ui/` and `app.js` are checked by opening the site, picking foods and reading the tiles. The empty day, one fatty pick, and an overshoot are the states worth looking at, then selecting the day, clicking a tile, adding and removing a meal, and switching the colour toggle with a meal selected. Click one tile several times quickly: the effects stack rather than restart.
- **A table macro mistyped when first entered passes.** The table has no column to check protein or fat against, so the test holds a second copy, which catches an edit and not the first transcription.
- **An estimate can be wrong and pass.** The data test catches a typo, not a careful bad estimate ([0004](decisions/0004-estimates-are-marked-not-hidden.md)).
- **The colours' meaning is a judgement.** The fit tests hold the specified example, not that the formula is the best one ([0003](decisions/0003-fit-is-scored-against-what-the-plate-lacks.md)).

## See also
- [Fit scoring](subsystems/fit-scoring.md) — the invariants the fit tests hold
- [Food data](subsystems/food-data.md) — what the data tests check against
