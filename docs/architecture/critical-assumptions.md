# Critical assumptions

Scope: the premises every change is checked against, whatever part of the app it touches. An entry is cross-cutting and expensive to retrofit; a constraint that shaped one part is a decision record instead.

## Volume, not weight

Every amount the app enters, stores, sums or scores is millilitres of the food **as prepared** — loosely filled, drained, chopped as the table's preparation column says ([0001](../decisions/0001-a-plate-is-measured-in-millilitres.md)). Grams of food appear only as a marked estimate beside a volume ([0007](../decisions/0007-weight-is-shown-as-an-estimate.md)). A weight typed into a plate row is turned into millilitres at once ([0008](../decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md)). Grams of a *nutrient* are real values.

**A change has ignored it when a weight is stored, totalled or scored, or entered other than as a stand-in for ml**, or when it treats two preparations of one food as the same volume. Raw loose spinach and cooked spinach are two rows, not one row and a conversion.

Fat portions are listed per portion (1 tbsp, 20 almonds) because that is how they are measured in a kitchen. Each still carries the volume one portion fills, so the plate's volume total includes them.

## The reference table is the source of truth

Jeremi's table decides every value it lists, ranges included ([food data](../subsystems/food-data.md)). Anything else is an estimate, and **an estimate is marked where it is shown** ([0004](../decisions/0004-estimates-are-marked-not-hidden.md)). A food of your own is not the table's and carries the user's values, marked as *Yours* ([0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)). The tests reproduce the table's own kcal comparison column, so a mistyped kcal fails by name, and keep a copy of the macros it gives, so an edited macro fails too ([testing](../testing.md)).

**A change has ignored it when a number enters `foods.js` with no source and no mark.**

## Local, private, and zero-install

The app runs from a folder with Python and a browser ([0002](../decisions/0002-no-build-step-and-no-dependencies.md)). It requests nothing but its own files and its own origin's `/api/shelf` and `/api/foods`. The shelf of premade meals and the foods of your own are the two things kept on the server that serves the site, in one file, by a script on Python's standard library ([0023](../decisions/0023-the-shelf-is-kept-on-the-server.md), [0026](../decisions/0026-your-own-foods-are-kept-on-the-server.md)). Everything else the user enters stays in that browser ([0005](../decisions/0005-state-lives-in-the-browser.md)).

**A change has ignored it when it adds a package manager, a CDN, a bundler, a request to another origin, or a server-side store beyond the shelf and the foods of your own.** Each is a recorded decision first, with the trigger that justifies it.

## See also
- [Overview](overview.md) — the files these constrain
- [Decision register](../decisions/README.md) — the records cited above
