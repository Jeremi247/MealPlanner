# 0026 — Your own foods are kept on the server

Scope: foods the user adds beside the table: what one holds, where it is kept, and how it is marked. Which category it joins is [0025](0025-a-foods-category-follows-its-macros.md). The form is [UI](../subsystems/ui.md); a row's fields are [food data](../subsystems/food-data.md).

## Decision

- **A food of your own is kept by `Server/shelf.py`, in the shelf's own file**, under `foods` beside `meals`. `GET /api/foods` answers them all; `POST /api/foods` takes one change, `add`, `edit` or `remove`, and answers them all. The server gives each an id, `my-` and twelve hex digits.
- **It holds** a name, a preparation, a category, kcal, protein, fat and carbs, the weight of its basis, and a picture's name. Its values are per 100 ml, or per portion with the volume a portion fills and the unit it is counted in. A single number each, never a range.
- **Values on a label per 100 g are entered as such**, with the weight of 100 ml, and kept per 100 ml.
- **Its values are the user's own**, so none is marked as an estimate. Its tile says *Yours* instead.
- **It joins its category after the table's rows**, and is shown, scored, shelved and searched like any of them.
- **The browser keeps the last list it saw**, and shows those foods when the server cannot be reached, unchangeable until it can.
- **A meal of the day or a shelved meal keeps a food that is not known**, as one of your own before the list has loaded or one removed since, and is shown and scored without it.
- Supersedes in part [0005](0005-state-lives-in-the-browser.md) (custom foods, past its trigger, are kept on the server), [0023](0023-the-shelf-is-kept-on-the-server.md) (the server keeps foods as well as the shelf) and the [critical assumption](../architecture/critical-assumptions.md#local-private-and-zero-install) that the shelf is the only server-side store.

## Why

Jeremi asked to add foods at the press of a button, with the category suggested and overridable (2026-10-12), and chose the server over the browser when asked. The shelf is on the server, and a shelved meal holding a food that only one browser knows would lose it on every other device.

## Rejected

- **In the browser, as the day's plan is kept.** One device only, lost with the profile, and the shelf would show such a meal without the food elsewhere.
- **A second data file.** Another volume path in `compose.yaml`, `Serve.bat` and the launch config, for data that is backed up and lost together with the shelf anyway.
- **Editing the table's rows.** The table stays Jeremi's reference, read-only.

## Consequences

- The site makes two kinds of request beyond its own files: `/api/shelf` and `/api/foods`, both its own origin's.
- **The foods share the shelf's volume and its missing backup** ([P2](../todo/P2/back-up-the-shelf.md)).
- **Removing a food leaves it in shelved meals' stored items.** It reappears if a food with that id ever comes back, which an id from the server never does.
- `Tests/test_shelf.py` holds what the server takes and refuses; `Tests/custom-foods.test.js` the browser's side.
