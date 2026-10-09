# 0015 — Food pictures can be minimal icons

Scope: a second style for the picture beside each food, chosen by a toggle. Supersedes the part of [0013](0013-foods-are-shown-as-fluent-3d-emoji.md) that gives every food one picture. 0013's choice of emoji, its stand-ins and its local copies stand, and the 3D emoji stays the default.

## Decision

- **A toggle at the top, Icons: 3D | Minimal**, chooses the picture style for the grid and the meal rows. It is saved with the view (`view.icons`, `'emoji'` or `'minimal'`).
- **Minimal is the same emoji's Fluent "High Contrast" SVG**, from the same repository and under the same MIT licence. Its path data is held in `site/js/data/icons-minimal.js` (`NM.MinimalIcons`, by emoji name), and `NM.Icons.picture(id, style)` gives a food's picture in either style.
- **A minimal icon is drawn as an inline SVG filled with `currentColor`, so it takes a colour from the page.** On a tile it glows in the tile's band colour. In a meal row it is gold.

## Why

Jeremi asked for an easy switch to minimal icons alongside the neon deco look ([0014](0014-the-site-is-styled-neon-deco.md)). Using the High Contrast versions of the emoji already chosen keeps every match and stand-in from 0013, so the switch needs one entry of path data per emoji and no new mapping.

## Rejected

- **A general outline icon set** (Tabler, Lucide). It has far fewer foods than the emoji, so every stand-in would have to be chosen again.
- **The SVG files used as a CSS mask.** A mask image is fetched with CORS, which Chrome refuses for a page opened from disk ([0002](0002-no-build-step-and-no-dependencies.md) keeps that working), and the icon depends on the stylesheet to show at all. The first build did this, and Jeremi saw no icons.

## Consequences

- With minimal icons the band shows in the icon as well as the frame.
- Each High Contrast SVG has one fill, which is what lets one colour stand for it. An emoji added later needs its paths converted into `icons-minimal.js` by hand.
- `icons-minimal.js` is ~95 KB. `Data.EveryIconHasAMinimalVersion` fails a food whose emoji has none ([testing](../testing.md)).
