# 0006 — The test gate is a headless browser

Scope: how the JavaScript is tested, given a machine with no Node. What the tests cover is [testing](../testing.md).

## Decision

**Tests run in `Tests/index.html`, loaded by headless Chrome (or Edge) from `Scripts/Test.ps1`.** The page writes a summary into `#summary`; the script reads it from `--dump-dom` and exits with the failure count. A page that never ran prints `NOT RUN` and fails.

## Why

The code under test is browser JavaScript, and Chrome is installed. Node is not, and installing it for a test runner would be the first dependency [0002](0002-no-build-step-and-no-dependencies.md) refused.

The harness is ~40 lines in `Tests/harness.js`. A framework would be a download, for `test`, `eq`, `near` and `ok`.

## Rejected

**Run the tests in the page the user opens.** Mixes test code into the app, and needs a person to look.

**Python with a JS engine.** None ships with Python.

## Consequences

- The gate needs Chrome or Edge, found at their standard install paths.
- Tests load `site/js/` directly from `file://`, which is why scripts are classic rather than modules.
- Only `core/`, `data/` and `store.js` are under test. The DOM views are checked by eye ([testing](../testing.md)).
