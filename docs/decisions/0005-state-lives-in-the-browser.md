# 0005 — State lives in the browser

Scope: where the target, the plate and the view preferences are kept between visits. **This is a recorded shortcut**, and the section headed Trigger is the one to read before building on it.

## Decision

**State is one JSON object in `localStorage` under `nutrientmanager.v1`**, read by `site/js/store.js`. Every read validates field by field and falls back to defaults; every write may fail silently. The app runs correctly with no storage at all.

## Why

The first version holds one plate and one target. A file on disk would need a server that writes, which [0002](0002-no-build-step-and-no-dependencies.md) does not have.

## What it costs

- State is per browser and per port. Another browser, a cleared profile, or a different port starts empty.
- Nothing can read it but the page. Claude cannot see a saved plate, and neither can a backup.

## Trigger

**This ends when anything needs to outlive one browser profile**: a meal log, custom foods, or a second device. The seam that survives is `NM.Store.load` and `NM.Store.save`; a file-backed store replaces their bodies, not their callers. Tracked as [P2](../todo/P2/export-and-import.md).

## Consequences

- No server-side code exists, and none is needed yet.
- The storage key is versioned, so a change of shape is a new key rather than a migration.
