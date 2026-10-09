# 0009 — Colour is measured against the target

Scope: the scale a tile's fit score is drawn on. Supersedes the part of [0003](0003-fit-is-scored-against-what-the-plate-lacks.md) that normalises each side of the grid to its own extreme; 0003's score, its regimes and the fatty-pick example stand.

## Decision

**A tile's colour is its raw score on a fixed scale**, the same for every plate. Full green and full red are fixed raw values. A colour depends only on the plate, the target and the food itself, never on which other tiles are shown.

- With food on the plate, the 0003 score is used unchanged. After a fatty pick, fatty foods still go red, because the plate is ahead on fat.
- With an empty plate, the plate can use anything. A food covering one dimension only is neutral, an even food is green, and only a portion that overshoots a target is red.

## Why

Jeremi asked for it in review. A tile should be green when the plate could use that food and red when the plate already has too much of what it adds. A grid-relative scale always painted some tile full green, even on a plate that needed nothing more.

## Rejected

**Red only past a target.** This would leave oil green after a tablespoon of peanut butter, because the fat target still has room. That contradicts the example 0003 was built to. Jeremi kept the example.

## What it costs

- The full-colour points are tuning constants (`FULL_GOOD`, `FULL_BAD` in `site/js/core/fit.js`), not quantities with units.
- Early on a plate, the greens are paler than before. Nothing is stretched to full green any more.

## Consequences

- A full-green tile means a strong fit in absolute terms, not just the best one available. A plate with every target nearly met shows no green.
- `Fit.ColourIsMeasuredAgainstTheTargetNotTheGrid` scores each food alone and within the grid, and expects the same colour both ways.
