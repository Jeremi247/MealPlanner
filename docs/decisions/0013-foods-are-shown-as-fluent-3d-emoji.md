# 0013 — Foods are shown as Fluent 3D emoji

Scope: the picture beside each food, where it comes from and where it is kept. It does not change what a tile or row shows otherwise ([UI](../subsystems/ui.md)).

## Decision

- **Every food has one picture: a Microsoft Fluent 3D emoji**, 256 px PNG, from [github.com/microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji) (MIT).
- **Where no emoji is the food itself, the closest one for the food or its group stands in.** A drumstick for every chicken cut, a fish for every fish fillet, a chestnut for every tree nut, a cheese wedge for the cottage cheeses. `site/js/data/icons.js` lists the matches and the stand-ins apart.
- **The images are copied into `site/img/foods/`, named after the emoji**, one file per emoji however many foods share it, with the source's `LICENSE` beside them. The site never loads one from the web, which keeps it offline and private ([critical assumptions](../architecture/critical-assumptions.md#local-private-and-zero-install)).
- `NM.Icons` maps a food id to its file. It is kept outside `foods.js`, so that file stays the reference table.
- The picture is decorative (`alt=""`); the name is always beside it.

## Why

Jeremi asked for a picture on every food, and chose this set from four samples: pixelated photos, a hand-drawn pixel-art pack, plain photos and these emoji. The emoji are one consistent style at high resolution. The site is for Jeremi's use only, so the source's licence did not narrow the choice.

## Rejected

- **Hand-drawn pixel art** (the LPC food pack, 32 px). It has a sprite for ~50 of the foods, and the rest would have needed another style.
- **Photos, plain or pixelated.** They cover every food but read poorly at 40 px.
- **A different emoji for every food.** Only 21 of the 66 foods have an emoji of their own. For the other 45, a shared, recognisable stand-in reads better than a far-fetched one.

## Consequences

- Foods that share a stand-in look alike. The name tells them apart.
- `site/img/foods/` is ~1.4 MB, served locally.
- `Data.EveryFoodHasAnIconAndEveryIconAFood` and `Data.EveryIconFileExists` fail a new food without a picture, or a missing file ([testing](../testing.md)).
