# 0016 — Tile clicks are animated

Scope: what a tile plays when it is clicked, and how an effect survives the re-render the click causes. It does not change what a click does ([UI](../subsystems/ui.md)).

## Decision

- **An add plays three effects at once.** Two rings with stepped deco corners, gold and then the band's colour 5 px inside it, grow 30 px out of the frame and fade. A stepped panel of the band flashes under the content. The amount added floats up from the foot. The rings have a 2 px line and 4 px steps, and play in 0.52 s.
- **A refused click, made while the day is selected, shakes the tile.**
- **Effects stack.** Each click adds its own rings and float, so quick clicks show several at once, each at its own stage. Only the newest add's panel shows.
- **`app.js` keeps the clicks whose effect may still be playing, unsaved, for 0.7 s.** Each render hands every tile its own clicks with their ages. `NM.Fx.decorate` adds the effects to the new tile, each started that far into its animation with a negative `animation-delay`. An effect carries on across renders, and follows its tile when a re-sort moves it.
- **The ring is a CSS `polygon()` whose points are `calc(100% - n px)`**, and its `inset` is what animates. The steps and line keep their size as it grows, and no script reads the tile's size.
- **Reduced motion drops the rings and every movement.** The panel and the amount only fade, and a refused click flashes the frame red.

## Why

Jeremi asked for short animations on clicked tiles, and chose these from three rounds of demos: four simple effects, seven complex ones and two refusals, then eight variations on the ziggurat echo, with the speed, step, ring count, line and reach set on sliders. Jeremi asked that quick clicks stack rather than restart. A render replaces every tile ([overview](../architecture/overview.md#a-click-end-to-end)), so an effect attached only to the tile restarted on every click.

## Rejected

- **Keeping the tile across renders**, by updating tiles in place. It would be the only incremental view in an app that rebuilds both views on every change.
- **An overlay outside the grid, positioned over the tile.** The panel has to sit under the content, which only a layer inside the tile can do, and an overlay stays behind when the tile moves.
- **Growing the ring with `scale()`.** That stretches the line and the steps. The first demo did this.

## Consequences

- A tile with an effect playing sits above its neighbours, which the rings cross. A hovered tile is still above it.
- `.tile` is `isolation: isolate`, so the panel can sit under the content. The hover reasons stay inside the tile's stacking order, which hover already raises.
- The effect's durations live in `site/css/app.css` and must stay within `Fx.LIFETIME_MS`. A longer one would be cut off at its next render.
- The views are not under test. The effects are checked by clicking quickly in the open site ([testing](../testing.md)).
