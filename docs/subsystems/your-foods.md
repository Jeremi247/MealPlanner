# Your foods

Scope: foods of your own — `site/js/core/custom-foods.js`, `site/js/ui/food-form.js`, their part of `site/js/app.js` and `site/css/app.css`, and `/api/foods` in `Server/shelf.py`. Where they are kept and how they are marked is [0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md); which category is suggested is [0025](../decisions/0025-a-foods-category-follows-its-macros.md). A row's fields are [food data](food-data.md).

## What one holds

Kept on the server, not in `foods.js`. `CustomFoods.toRow` turns one into a row of the table's shape ([food data](food-data.md#a-row)), with `custom` set and `icon` naming its picture, and `CustomFoods.withCustom` adds them after the table's rows in their category. Every value is the user's: none is in `est`, and none is checked against the table. A food entered per 100 g is kept per 100 ml, its values scaled by the weight of 100 ml. The category is the user's pick, offered from `CustomFoods.suggest`; nothing holds a food of your own to the rules.

The server holds a food to the same limits as `CustomFoods.check`: a name up to 60 characters and a preparation up to 80, one of the four categories, each value 0–5000, a weight above 0, and for a portion a volume above 0, a count above 0, a unit up to 20 characters and a step of ½ or 1. A malformed picture name is dropped; one the site has no picture for shows as `Icons.FALLBACK`.

## The box

**+ Add food** in the header opens a framed box over the dimmed page ([0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)). From the top:

- **Yours**: a button per food of your own, which switches the box to editing it, and **+ New** while one is being edited
- name and preparation
- **Values** per 100 ml, per 100 g or per portion; per portion asks how many units a portion is, the unit's name and the ml it fills
- kcal, protein, fat and carbs, then the weight of 100 ml, or of a portion
- **Category**, four toggles. Until one is picked, the toggle follows the rules' suggestion as the values are typed ([0025](../decisions/0025-a-foods-category-follows-its-macros.md)); the line under it names the suggestion and the rule. A pick other than the suggestion stays, with *Use the suggestion* to go back
- **Picture**, a strip of every picture there is, in the Icons style. Until one is picked it follows the category
- a line saying what is still missing, or why it was not saved; then Remove when editing, which asks first, Cancel, and **Add food** or **Save**

Beside the fields, below them on a narrow screen, is a **preview**: the tile the food will have in the grid, built by `Grid.preview` and scored by the app as the grid's tiles are now, redrawn on every change. Its reasons show without a hover. Until every field is filled in it is a faded draft, with a blank name drawn as *Your food*, a blank value as 0, a blank portion as one unit of 100 ml and a blank weight as that of water.

Add food and Save are off while anything is missing or the server cannot be reached. Enter in a field saves; Escape, ×, Cancel or a click on the dimmed page closes it without saving. Focus stays inside, and goes back to + Add food when it closes.

## When the server cannot be reached

The foods this browser last saw are shown, and the box opens with Add food, Save and Remove off and a line saying why. + Add food fetches the foods again, and an answer that comes while the box is open is taken into it, keeping what is typed. A change the server refuses or never gets keeps the box open, with *Not saved* and the reason. A meal holding a food not yet known, or removed, is shown and scored without it, and keeps it ([0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)).

## See also
- [Food data](food-data.md) — the row a food of your own becomes, and the category rules
- [UI](ui.md) — the grid its tiles join
- [Shelf](shelf.md) — the server and file it shares
