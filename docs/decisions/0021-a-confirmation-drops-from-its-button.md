# 0021 — A confirmation drops from its button

Scope: how the app asks before a Clear, a Clear all or a remove of a meal that holds food. It does not change which actions ask ([UI](../subsystems/ui.md)).

## Decision

- **The question is a small gold-framed box under the button that asked**, reaching just past its right edge, an arrow pointing at the button's middle. It holds the question, **Cancel** and the action in red: **Clear**, **Clear all** or **Remove**.
- **It opens above the button when there is no room below**, and stays inside the window.
- **Cancel has focus when it opens, and Tab moves only between Cancel and the action.** Escape, a click elsewhere, focus leaving the box, a scroll or a resize cancels. Clicking the button again closes it. Cancel and Escape give focus back to the button.
- **`NM.Confirm.ask(button, message, action, onYes)` in `site/js/ui/confirm.js` is the one way to ask.** The box is fixed-position on `document.body`, outside the sidebar. One is open at a time.
- **Reduced motion drops the box's slide**; it only fades in.

## Why

Jeremi disliked the browser's `window.confirm` dialog, and chose this from four demos on the real sidebar: the box under the button, the head's links turning into the question, a click-again button with a draining fuse, and acting at once with an Undo chip.

## Rejected

- **The links turning into the question.** The card's head fits two words, so "Remove Meal 2 and everything on it?" became "Remove?".
- **Click again to confirm.** A double click goes straight through, which is the slip a confirmation is for.
- **Undo instead of asking.** Jeremi asked for a question by the button.
- **The box inside its card.** The sidebar scrolls and clips what overflows it, so the last card's box would be cut off.
- **Tabbing out of the box to cancel it.** The box is last on the page, so focus would go on to the browser's toolbar rather than back to the button.

## Consequences

- The box does not follow a scroll; it cancels. Nothing else moves the sidebar while it is open, since any click elsewhere closes it first.
- A render while it is open would leave it pointing at a replaced button. Only a click elsewhere causes one, and that closes it.
- The views are not under test. The box is checked in the open site ([testing](../testing.md)).
