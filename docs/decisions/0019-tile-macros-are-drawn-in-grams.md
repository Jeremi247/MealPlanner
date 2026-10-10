# 0019 — Tile macros are drawn in grams

Scope: the bars under a tile's protein, fat and carbs. What the tile prints and how it is scored do not change ([UI](../subsystems/ui.md)).

## Decision

- **Each macro has its own bar of grams on the food's listed basis**: per 100 ml, or per portion for a fat portion. The tile's single bar of where its calories come from is gone.
- **The bar is linear to a tick at 10 g, three quarters along.** Past the tick, the last quarter holds 10–20 g, so the overflow is squeezed to a third of the scale below it. A value over 20 g fills the bar.
- **Up to the tick the bar is a neon tube in the macro's colour. Past it, it is white-hot with the macro's glow.**
- **The bar's tooltip gives the value and its basis, and says when it is estimated.** The `~` on the printed value stays the mark.

## Why

Jeremi asked for an absolute measure rather than a relative one, with 10 g as the expected maximum and room for the foods that cross it. In this table 26 of 66 foods have a macro over 10 g, and the highest is 18.8 g, so a second 10 g fits every current food. Jeremi chose this from three rounds of mockups: six absolute designs, twelve variations on the broken axis, the gram cells and the mini columns, and twelve colour and deco treatments of the single track with a tick.

## Rejected

- **Clipping at 10 g with the overflow written as "+7.5".** It prints a number the line above already shows.
- **A bar that laps itself past 10 g, or 20 linear cells.** Both read well, and neither was chosen.
- **A square-root scale.** It shows the vegetables' small values, but lengths are no longer proportional.
- **Mini columns beside the kcal and macro lines.** Narrow, so hard to compare across tiles.
- **A gold overflow.** Gold-bright is already the volume colour on the day card's bars.

## Consequences

- Every tile is about 15 px taller, by the same amount on every tile.
- The volume foods' bars are short slivers, as every one is under about 5 g of each macro per 100 ml.
- A fat portion's bar is per portion, so it is not comparable with a per-100 ml bar beside it.
- `Nutrition.macroKcalSplit` had no other caller and is removed.
- If a food is added with a macro over 20 g, its bar shows 20 g. Raising the 10 g tick is the change to make then.
