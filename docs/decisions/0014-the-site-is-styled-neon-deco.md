# 0014 — The site is styled neon deco

Scope: how the site looks — its palette, its type, and how a tile shows its band. It does not change what a tile shows or how a band is chosen ([UI](../subsystems/ui.md), [fit scoring](../subsystems/fit-scoring.md)).

## Decision

- **Neon deco: black tiles in thin gold art deco frames, lit from inside by the band's neon colour.** The band is a neon line inside the frame and a faint glow filling the tile. The tile's ml per 100 kcal is set in neon in the same colour.
- **The five bands are five neon hues, worst to best:** red, orange, yellow, lime, green. They are `--fit-<band>` tokens, and the legend is a gradient through them.
- **The band is also set into a gap in the top of the frame, as a meter and a word:** one to five lit diamonds, then Against, Doubtful, May fit, Alright or Best. The band never rests on colour alone.
- **Dark only.** There is one set of tokens, and no light theme under `prefers-color-scheme`.
- **Two display fonts, copied into `site/fonts/` with their licences:** Poiret One (OFL) for titles, food names and headings, and Tilt Neon (OFL) for the neon numbers. Body text and every other number stay in the system font. The site never loads a font from the web ([critical assumptions](../architecture/critical-assumptions.md#local-private-and-zero-install)).
- Corners are square. Gold marks what is selected or on a plate; the band colours mark fit and nothing else.

## Why

Jeremi asked for a better-looking site and chose this from about thirty mockups across four rounds: clean, playful and editorial restyles; layouts without tiles; ten art styles; then ten variations on synthwave and art deco. Jeremi asked to keep selectable tiles. Neon deco keeps the band readable at a glance, as a coloured line and a coloured number, while the rest of the tile stays dark and calm.

## Rejected

- **A light theme beside it.** The look depends on light on black. A light counterpart (Miami deco was the candidate) is a new record if wanted.
- **A colour-blind-safe palette** (blue–orange, cyan–magenta, a lightness ramp). Jeremi kept the neon colours; the meter carries the order for anyone who cannot tell them apart.
- **Poiret One for every number.** It is thin and hard to read at 11–12 px. It is kept for words set large.
- **Loading the fonts from Google Fonts.** The site makes no network request.

## Consequences

- Rows of tiles sit 18 px apart, to leave room for the meter above each frame.
- The tile background no longer carries the band. The colour is the frame line and the glow, so from a distance the band reads a little less strongly than a fully tinted tile did.
- Lime (alright) and green (recommended) are the closest pair, and merge for red-green colour blindness. The meter and word tell them apart.
- `site/fonts/` is ~0.7 MB, served locally. Before it loads, text falls back to the system font.
