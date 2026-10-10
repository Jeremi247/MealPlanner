# 0017 — Cards glide to their new height

Scope: how the day and meal cards change size when a render changes what they hold, and how the sidebar keeps its scroll position meanwhile. It does not change what a card shows ([UI](../subsystems/ui.md)).

## Decision

- **Every card glides from the height it had to its new one, in 250 ms on `cubic-bezier(.22, .8, .28, 1)`.** Opening a meal, closing one, adding a row and removing a meal all glide, so the cards below slide instead of jumping.
- **A card that opens fades its rows and Clear in once the glide is under way.** A meal card that closes is shown as its old element, inert, while its rows fade out, and is swapped for the new one when the glide ends.
- **A removed meal's card folds away where it was**, inert, while the cards after it glide up.
- **`Plate.render` measures each card before it rebuilds the sidebar and animates the new cards with the Web Animations API.** Cards are matched by their title's `data-focus` key, shifted past a removed meal, which `app.js` passes for one render. A render mid-glide measures the card as drawn, so the next glide starts from there.
- **The sidebar never scrolls on its own** (wide layout only). Its scroll position is the same after every render, scroll anchoring is off, and focus is given back without scrolling.
- **Room below the add button keeps that possible.** It is at least enough to scroll the add button to the top, and grows when the cards shrink under the reader, so the scroll range always reaches as far down as they had scrolled. It is sized for the shorter of the cards' heights at the glide's start and end, which bound every frame between. Each render sizes it from the current position, so it shrinks back once they scroll up.
- **The day card never resizes on selection**: its hint is always shown.
- **Reduced motion drops the glide.**

## Why

Jeremi found the layout snapping when a card was clicked abrupt, and chose Glide at 250 ms from four demos: the snap as it was, Glide, Glide with a gold edge and cascading rows, and a stepped opening. Jeremi then asked for room below the last meal, as closing a long card shortened the scroll area and moved the whole sidebar, and then that the sidebar never move up on its own: the browser's scroll anchoring still shifted it as a card above the clicked one closed.

## Rejected

- **Keeping the cards across renders and animating `height: auto` in CSS.** It would make the sidebar the only view updated in place ([0016](0016-tile-clicks-are-animated.md#rejected) rejects the same for tiles).
- **The stepped opening.** Jeremi chose the smooth one.
- **Keeping the clicked card still on screen**, by scroll anchoring. The whole sidebar then moves whenever a card above shrinks; Jeremi asked for a fixed distance from the top instead.

## Consequences

- A card is clipped while it glides, and kept from shrinking in the sidebar's scrolling column.
- The sidebar can always scroll past its last card, even when every card fits, and further after a card shrinks under the reader.
- A card above the one clicked that closes moves the clicked card up by as much as it shrank.
- The glide is not under test. It is checked by clicking between cards in the open site ([testing](../testing.md)).
