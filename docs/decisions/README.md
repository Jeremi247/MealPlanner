# Decision register

Scope: one line per decision — what was decided, and which record to trust when one supersedes another. The argument is in the record. Grep this file before writing a *because* in a comment or a doc ([docs & comments](../conventions/docs-and-comments.md)).

Append-only in substance: a reversal is a new record superseding the old one, never an edit.

- [0001 — A plate is measured in millilitres](0001-a-plate-is-measured-in-millilitres.md) — superseded in part by 0007: a weight is now shown
- [0002 — No build step and no dependencies](0002-no-build-step-and-no-dependencies.md)
- [0003 — Fit is scored against what the plate lacks](0003-fit-is-scored-against-what-the-plate-lacks.md) — superseded in part by 0009: the scale is no longer the grid's
- [0004 — Estimates are marked, not hidden](0004-estimates-are-marked-not-hidden.md)
- [0005 — State lives in the browser](0005-state-lives-in-the-browser.md) — a recorded shortcut, with its trigger
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
