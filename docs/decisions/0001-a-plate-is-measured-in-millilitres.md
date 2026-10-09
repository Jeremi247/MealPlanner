# 0001 — A plate is measured in millilitres

Scope: the unit every amount of food is shown, entered and stored in. Grams of a nutrient are not affected.

## Decision

**Every amount of food is millilitres of the food as prepared.** Values are per 100 ml; fat portions are per listed portion and carry the volume it fills. No weight of food is stored, shown or converted to.

## Why volume

The app exists to build meals that are large for their calories. Volume is the quantity that decides how full a plate looks and how full a meal feels; weight is a proxy for it that a dense food and an airy one share equally. 100 g of spinach and 100 g of oil are the same number and nothing alike on a plate.

Volume is also what a kitchen measures without a scale: a cup, a ladle, a container marked in ml.

## What it costs

- **Volume depends on preparation**, which weight does not. Loose raw leaves fill several times the volume of the same leaves cooked. So preparation is part of a food's identity: two preparations are two rows.
- **Packing varies.** "Loosely filled" rice and pressed rice differ. The table names the packing, and the app inherits that uncertainty unmarked.
- **Most published data is per 100 g.** Any value the table does not give must be converted through the row's own density, which is an estimate ([0004](0004-estimates-are-marked-not-hidden.md)).

## Rejected

**Store grams, display ml.** Needs a density per row that is itself an estimate, and makes the stored truth the unit the user does not use.

**Let the user choose.** Two units in every view, and fit scoring would have to pick one anyway — volume is one of its dimensions ([0003](0003-fit-is-scored-against-what-the-plate-lacks.md)).

## Consequences

- Volume is a first-class balanced dimension in the fit score, with its own target.
- The headline number on the plate is its volume, and each tile shows ml per 100 kcal.
- A food added later needs its preparation stated, or its volume means nothing.
