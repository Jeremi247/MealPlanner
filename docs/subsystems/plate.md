# Plate

Scope: the sidebar: `site/js/ui/plate.js`, `site/js/ui/portions.js` and their part of `site/js/app.js` and `site/css/app.css`. The day card, the meal cards, and a meal split into portions ([0027](../decisions/0027-a-meal-says-how-many-portions-it-makes.md)). The state they show, the grid beside them and the rules every view keeps are [UI](ui.md).

## The sidebar

The sidebar is a stack of cards: the day, then one card per meal, then **+ Add meal**. Clicking a card, or its title, selects it. A click on a control inside a card does only what the control does. One card is selected at a time, outlined in the accent colour. A card whose height changes glides to it, and the sidebar never scrolls on its own: there is always room below the last card to keep its position ([0017](../decisions/0017-cards-glide-to-their-new-height.md)). **Asking first** is a small box dropped from the button clicked, with Cancel and the action ([0021](../decisions/0021-a-confirmation-drops-from-its-button.md)). The shelf opens from a tab on the sidebar's left edge ([shelf](shelf.md)).

**The day card**

- **Clear all** in its head empties every meal, asking first, and keeps the meals. It is greyed out while the day is empty.
- **Daily target**: five number inputs, in the order kcal, volume, protein, fat, carbs. A warning appears when protein, fat and carbs add up to more than 10 % away from the kcal target.
- **Totals** of every meal: total volume as the headline, the day's ml per 100 kcal, then a bar per dimension in the target's order. Past its target a bar rescales and the overshoot is hatched red.
- **Short on**: the day's most-missing balance dimensions, or *Nothing added yet* while the day is empty.
- Always, in small type close under it, a line saying the day counts one portion of each meal and how many are split, so splitting a meal never resizes the card.
- Always, a line asking for a meal to add foods to, so selecting the day never resizes the card; dimmed while a meal is selected. A tile clicked while the day is selected adds nothing.

**A meal card**

- Its name, how many foods it holds and **Clear**. Clear empties that meal without selecting it, asking first, keeps its portions, and is greyed out while the meal is empty.
- **Splits into**: how many portions it makes, 1 to 20, with − and + either side of the count, which can be typed or stepped with ↑ ↓ ([0027](../decisions/0027-a-meal-says-how-many-portions-it-makes.md)). Beside it, *Eaten whole*, or *Day counts 1 of N*.
- Bars for volume, protein and carbs of one portion against the meal's share of the day, on every meal whether selected or not, under a rule. Split, the rule is captioned *One portion · 1 of N*, at the same height, so splitting a meal never resizes its card.
- Selected, its rows as well, the whole recipe, and a *Whole recipe* line under them summing the rows, at every count for the same reason. Selection changes nothing else on the card.
- **×** removes the meal, asking first if it holds food. The last meal has no ×. Meals are named by position, so removing one renumbers the rest.
- **Rows**: the food's picture and name, under it its preparation or, for a fat portion, its count (`3x egg`, `1.5x tbsp`), and −/+ by the food's step to the next whole step, or type an ml value. Zero removes the row. Under the ml is the estimated weight, which is also an input. A weight typed there is converted to ml ([0008](../decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md)). A food with a weight before cooking ([food data](food-data.md)) shows it at the right end of its macros line, as `dry ~35 g`.

A weight is always marked `~` and carries a tooltip ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). There is no weight total.

## See also
- [UI](ui.md) — the state, the grid, and the rules every view keeps
- [Shelf](shelf.md) — the premade meals that go into a meal
- [0011](../decisions/0011-a-day-of-meals-against-a-daily-target.md) — a day of meals against a daily target
