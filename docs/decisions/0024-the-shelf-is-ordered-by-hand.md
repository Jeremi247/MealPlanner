# 0024 — The shelf is ordered by hand

Scope: how premade meals and their rows are put in order and moved between rows. Where the shelf is kept is [0023](0023-the-shelf-is-kept-on-the-server.md); what the panel shows is [shelf](../subsystems/shelf.md).

## Decision

- **The order of the stored list is the order the shelf shows.** Each row's meals are kept together, and rows run in the order their first meal comes. The server regroups after every change, so a row renamed to one in use joins it.
- **A card is dragged** within its row, or into another, and **a row is dragged by its head**. The card or row stays in the list as a dashed gap that moves to where it would drop, and a copy follows the pointer.
- **A mouse drags from anywhere off a button; a finger or pen from the grip** (⠿), which takes touch so the list still scrolls under a finger elsewhere.
- **The arrow keys on a grip move it**: a card ← → along its row and ↑ ↓ to the next row; a row ↑ ↓.
- **A card dropped on *Drop a meal here to start a new row*** asks for the row's name. ↓ past the last row does the same.
- **The Move link is gone.** `POST /api/shelf` takes `place` (a meal, its row, and the meal it goes before or none) and `placeRow` (a row, and the row it goes before or none) in place of `move`.
- **The shelf shows a move at once**, from the same rule worked out in the browser (`NM.Shelf.place`), and puts it back if the server refuses it or cannot be reached.
- A new meal goes first in its row; a copy goes after its original.
- Supersedes in part [0023](0023-the-shelf-is-kept-on-the-server.md): its `move` change.

## Why

Jeremi asked to drop Move and drag meals instead, to reorder and switch rows easily (2026-10-11). A shelf ordered by when meals were shelved could not be reordered at all.

## Rejected

- **The browser's own drag and drop** (`draggable`). It does not start from a finger on most phones, and the shelf is used on one.
- **A stored position number per meal.** The list's order already is one, and two numbers could disagree.
- **Keeping Move beside dragging.** Two ways to do one thing; the arrow keys cover what dragging cannot.

## Consequences

- **A shelf stored before this shows each row oldest first**, where it showed newest first. Its rows keep their order.
- **Dragging is under no automated test**: the order rule is (`Tests/shelf.test.js`, `Tests/test_shelf.py`), the gestures are checked by hand ([testing](../testing.md)).
