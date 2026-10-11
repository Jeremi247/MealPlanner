# 0023 — The shelf is kept on the server

Scope: where the shelf of premade meals is kept, and how the site reaches it. The day's plan, target and view stay in the browser ([0005](0005-state-lives-in-the-browser.md)). What the shelf shows and does is [shelf](../subsystems/shelf.md).

## Decision

- **The shelf is one JSON file kept by `Server/shelf.py`**, a small HTTP service on Python's standard library. `GET /api/shelf` answers the whole shelf. `POST /api/shelf` takes one change (`add`, `copy`, `rename`, `move`, `remove`, `renameRow`), checks it, writes the file and then answers the whole shelf.
- **A change is an operation, not a saved copy of the shelf**, so two devices changing different meals cannot overwrite each other.
- **Only a JSON body is taken**, and no other origin is ever told yes, so a page elsewhere cannot write to it.
- **On onee-chan it runs in a second container**, `python:3.12.15-alpine`, beside Caddy. The file is in the `mealplanner_shelf_data` volume, and Caddy forwards `/api/` to it behind the same private-addresses rule ([0022](0022-the-site-is-also-served-on-the-home-network.md)). It publishes no port.
- **`Serve.bat` runs the same script**, serving `site/` and its own shelf in `shelf.local.json`, which git ignores. The local shelf and the home server's never meet.
- **The browser keeps the last shelf it saw** and shows it, read-only and with a note, when the server cannot be reached. A premade meal can still be put into the day.
- Supersedes in part [0005](0005-state-lives-in-the-browser.md) (the shelf is the first state past its trigger, a second device), [0002](0002-no-build-step-and-no-dependencies.md) (`Serve.bat` no longer runs `http.server`) and [0022](0022-the-site-is-also-served-on-the-home-network.md) (the server now stores what a user enters: the shelf).

## Why

Jeremi wanted the same shelf on the phone and the PC, and chose each part of this shape when asked (2026-10-11). A store that only appends operations needs no merge, and the standard library needs nothing installed.

## Rejected

- **Caddy writing the file itself, over WebDAV.** A custom Caddy build with a third-party module, and whole-file saves where the last device to save wins.
- **Saving the whole shelf with a version check.** A clash would throw one device's change away, or need a merge.
- **Queueing changes made offline.** More code, and two devices both changing things offline would need merging. Jeremi chose read-only.
- **The local copy using the home server's shelf.** Work on the site would edit the real shelf, and the server would need cross-origin rules.
- **Moving the whole plan to the server.** Not asked for.

## Consequences

- **The site makes one kind of request beyond its own files**: to its own origin's `/api/shelf` ([critical assumptions](../architecture/critical-assumptions.md#local-private-and-zero-install)).
- **The shelf is in a Docker volume with no backup.** `down -v` deletes it along with the CA ([P2](../todo/P2/back-up-the-shelf.md)).
- **A plain `http.server` still serves the site**, with the shelf unreachable.
- **The server's code is under test**: `Tests/test_shelf.py`, run by the gate ([testing](../testing.md)).
- A food removed from the table is dropped from a shelved meal when it is shown, not from the file.
