# Decision register

Scope: one line per decision — what was decided, and which record to trust when one supersedes another. The argument is in the record. Grep this file before writing a *because* in a comment or a doc ([docs & comments](../conventions/docs-and-comments.md)).

Append-only in substance: a reversal is a new record superseding the old one, never an edit.

- [0001 — A plate is measured in millilitres](0001-a-plate-is-measured-in-millilitres.md) — superseded in part by 0007: a weight is now shown
- [0002 — No build step and no dependencies](0002-no-build-step-and-no-dependencies.md) — superseded in part by 0023: `Serve.bat` runs `Server/shelf.py`
- [0003 — Fit is scored against what the plate lacks](0003-fit-is-scored-against-what-the-plate-lacks.md) — superseded in part by 0009: the scale is no longer the grid's
- [0004 — Estimates are marked, not hidden](0004-estimates-are-marked-not-hidden.md)
- [0005 — State lives in the browser](0005-state-lives-in-the-browser.md) — a recorded shortcut, with its trigger; superseded in part by 0023: the shelf, and by 0026: foods of your own
- [0006 — The test gate is a headless browser](0006-the-test-gate-is-a-headless-browser.md)
- [0007 — Weight is shown as an estimate](0007-weight-is-shown-as-an-estimate.md) — supersedes 0001's "no weight is shown"; superseded in part by 0008
- [0008 — A weight can be typed in, and is stored as ml](0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md) — supersedes 0007's "never typed in"
- [0009 — Colour is measured against the target](0009-colour-is-measured-against-the-target.md) — supersedes 0003's per-side normalisation
- [0010 — Track what a supplement cannot carry](0010-track-what-a-supplement-cannot-carry.md) — fibre is scored; four minerals are shown; the rest is left to the supplement
- [0011 — A day of meals against a daily target](0011-a-day-of-meals-against-a-daily-target.md) — supersedes 0003 and 0009's single plate and meal target; superseded in part by 0012
- [0012 — Colours can follow the selected meal](0012-colours-can-follow-the-selected-meal.md) — supersedes 0011's day-only colours; day colours stay the default
- [0013 — Foods are shown as Fluent 3D emoji](0013-foods-are-shown-as-fluent-3d-emoji.md) — copied into the site; a stand-in where no emoji is the food; superseded in part by 0015
- [0014 — The site is styled neon deco](0014-the-site-is-styled-neon-deco.md) — gold frames lit by the band's neon; dark only; two fonts copied into the site
- [0015 — Food pictures can be minimal icons](0015-food-pictures-can-be-minimal-icons.md) — supersedes 0013's one picture per food; the 3D emoji stays the default
- [0016 — Tile clicks are animated](0016-tile-clicks-are-animated.md) — neon double rings, a band flash and the amount floating up; a shake when refused; quick clicks stack
- [0017 — Cards glide to their new height](0017-cards-glide-to-their-new-height.md) — 250 ms; a closing card fades its rows; the sidebar never scrolls on its own
- [0018 — Every food is shown alike](0018-every-food-is-shown-alike.md) — the table's † rows are no longer dimmed or hidden; protein's one limit is ≥6 g protein; superseded in part by 0025: that limit is one of the category rules
- [0019 — Tile macros are drawn in grams](0019-tile-macros-are-drawn-in-grams.md) — a bar per macro, linear to a tick at 10 g, white-hot overflow up to 20 g
- [0020 — A portion is counted in its own unit](0020-a-portion-is-counted-in-its-own-unit.md) — "3x egg", "1.5x tbsp"; a +/- moves one unit, or half a spoon, and lands on a whole step
- [0021 — A confirmation drops from its button](0021-a-confirmation-drops-from-its-button.md) — a framed box under the button, Cancel and the action in red; replaces `window.confirm`
- [0022 — The site is also served on the home network](0022-the-site-is-also-served-on-the-home-network.md) — `Deploy.bat` after a green gate; Caddy in Docker on onee-chan at `https://mealplanner.home/`, its own CA, IPv4 and private addresses only; superseded in part by 0023: the server keeps the shelf
- [0023 — The shelf is kept on the server](0023-the-shelf-is-kept-on-the-server.md) — `Server/shelf.py`, standard library, one JSON file; changes sent as operations; read-only from the browser's last copy when unreachable; superseded in part by 0024: `move` is now `place` and `placeRow`, and by 0026: the file keeps foods of your own too
- [0024 — The shelf is ordered by hand](0024-the-shelf-is-ordered-by-hand.md) — the stored list's order is the shelf's; cards and rows are dragged, or moved with the arrow keys; the Move link is gone
- [0025 — A food's category follows its macros](0025-a-foods-category-follows-its-macros.md) — volume under 30 kcal/100 ml, then fat ≥50% of kcal, then protein ≥35% and ≥6 g, else starch; the three legumes move to starch
- [0026 — Your own foods are kept on the server](0026-your-own-foods-are-kept-on-the-server.md) — `/api/foods` in the shelf's file; per 100 ml or per portion, per 100 g converted; marked *Yours*; the rules' category suggested, the user's pick kept
