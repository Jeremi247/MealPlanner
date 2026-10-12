# Shelf

Scope: the shelf of premade meals: `site/js/core/shelf.js`, `site/js/server-store.js`, `site/js/ui/shelf.js`, the shelf's part of `site/js/app.js` and `site/css/app.css`, and `Server/shelf.py`. Where it is kept, and why on the server, is [0023](../decisions/0023-the-shelf-is-kept-on-the-server.md). How a card's band is computed is [fit scoring](fit-scoring.md).

A premade meal holds rows as a meal of the day does, `{ id, ml }`: volumes, never weights ([critical assumptions](../architecture/critical-assumptions.md#volume-not-weight)). Its totals are worked out from the table when it is shown, and never stored.

## What is on it

A premade meal is a **name**, a **row** and its foods. **Rows come from their meals**: a row is a name some meal is in. A row goes when its last meal leaves it. There is no separate list of rows to manage.

**The order is kept by hand** ([0024](../decisions/0024-the-shelf-is-ordered-by-hand.md)): the stored list's order is the shelf's, each row's meals together. A newly shelved meal goes first in its row, and a new row last. A copy goes after its original.

## The panel

- **The tab** is a « on the sidebar's left edge, halfway down the window, and » while the shelf is open. Stacked below 900 px, it sits on the window's right edge.
- **The shelf opens over the page from that edge**, and moves nothing. The grid is dimmed; the sidebar stays above it, so a meal can be selected with the shelf open. The ×, the dimmed page, the tab or Escape closes it. Opening it fetches the shelf again.
- **The head** holds a search, which matches a meal's name, its row or one of its foods, and **+ Shelve Meal N**. That asks for a name and a row, offering the rows in use. It is greyed out with the day selected, an empty meal, or the server unreachable.
- **Rows** of cards, two to a plank, one below 520 px. A row's name renames the row, which moves every meal in it.
- **Asking for text** uses the confirmation's box with fields, `NM.Confirm.prompt` ([0021](../decisions/0021-a-confirmation-drops-from-its-button.md)). Enter takes it; the action is off while a field is blank.

## A card

From the top:

- the name, with room for two lines, so the band sits at one height across a plank
- the band: one lit diamond per step up from the worst band, as on a tile but without the unlit ones, and the tile's short word, in the band's colour
- a line per food: its picture in the Icons style, its name, a dotted leader, and its amount as it is counted ([0020](../decisions/0020-a-portion-is-counted-in-its-own-unit.md))
- at the foot, under a double rule: ml, ml per 100 kcal in the band's colour, and kcal; grams of protein, fat and carbs; a glowing tube each, full at one meal's share of the target
- **Into Meal N**, then New meal, Rename, Copy and Remove. Remove asks first.
- a grip, ⠿, in the top left corner, to move it by

## Moving a meal or a row

- **Drag a card** to where it should go, in its row or another. **Drag a row** by its head, and only the rows' heads show while it moves. A mouse drags from anywhere off a button; a finger or a pen from the grip.
- **The card or row stays as a dashed gap** where it would drop, and a copy follows the pointer. Near the top or bottom of the list, the list scrolls. Escape puts it back.
- **Within its row, the gap takes the slot of any card the pointer is on.** In another row, it goes before or after a card, by which half the pointer is on, or to the end when the pointer is past the last card. Between cards, it stays put.
- **A card dropped on *Drop a meal here to start a new row*** asks for the row's name.
- **The arrow keys on a grip move it.** A card's: ← → along its row, ↑ to the end of the row above, ↓ to the start of the row below, or past the last row into a new one. A row's: ↑ ↓.
- **A move shows at once**, and goes back if the server refuses it or cannot be reached.

**The colour** is the whole meal scored as one addition by `Fit.scoreMeal`, against what the tiles are scored against: the day, or with selection colours the selected meal and its share ([0012](../decisions/0012-colours-can-follow-the-selected-meal.md)).

## Putting a meal into the day

- **Into Meal N adds on top**: a food the meal already holds gets the premade amount added to its own, and the rest follow. With the day selected it is greyed out.
- **New meal** adds a meal of the day holding the premade meal, and selects it.

Neither changes the shelf, and both work with the server unreachable.

## Changes and the server

Each change is one operation sent to `Server/shelf.py`, which answers with the whole shelf. The server refuses a name over 60 characters, a row over 40, a meal of no foods or over 60, an amount not in 0–20 000 ml, or a food id that is not one. A food of your own is one ([0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)). A refused change shows *Not saved* and the reason until the next one succeeds.

**When the server cannot be reached**, the shelf shows the copy this browser last saw and says when it was seen. Shelve, Rename, Copy, Remove, the grips and the rows' names are greyed out, and nothing can be dragged. Opening the shelf again tries again.

**Locally, `Server/shelf.py` will not start on a port already served**, and `Serve.bat` stays open to say so. On Windows a second server would otherwise bind beside the first and get none of its requests, leaving an old static server answering *the shelf answered 404*.

A meal holding a food not known, one gone from the table or a food of your own removed or not yet loaded, is shown and scored without it, with a line counting the foods *not found*. A meal none of whose foods is found stays on the shelf so it can be removed, with Into and New meal greyed out.

## Open questions

- Should a premade meal be put in at a scale, half or double, rather than as it is?
- Is one meal's share the right length for a full tube?

## See also
- [0023](../decisions/0023-the-shelf-is-kept-on-the-server.md) — where it is kept, and what was rejected
- [0024](../decisions/0024-the-shelf-is-ordered-by-hand.md) — the order kept by hand, and dragging
- [UI](ui.md) — the grid and the sidebar the shelf opens over
- [Deploy](../deploy.md) — the shelf's container and volume on onee-chan
