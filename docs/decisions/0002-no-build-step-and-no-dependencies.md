# 0002 — No build step and no dependencies

Scope: what the site is made of and what it takes to run. It does not decide where state lives ([0005](0005-state-lives-in-the-browser.md)).

## Decision

**The site is hand-written HTML, CSS and classic scripts, served as static files.** No package manager, no bundler, no framework, no CDN. `Serve.bat` runs Python's built-in `http.server` on 127.0.0.1:8737.

- Scripts share one global namespace, `NM`, and are ordered by `<script>` tags ([JS style](../conventions/js-style.md)).
- The machine needs Python and a browser, both already present.

## Why

The app is ~66 foods, two views and one formula. A framework's cost — an install, a lockfile, a build, an upgrade path — buys nothing at this size, and every one of those is a way for a local tool to stop working after a year untouched.

Classic scripts rather than ES modules: modules refuse to load from `file://`, which would make the test page need a server too ([0006](0006-the-test-gate-is-a-headless-browser.md)).

## Trigger to revisit

A second page with shared components, or a view whose re-render becomes visibly slow. Either is a new record.

## Consequences

- Nothing to install, nothing to upgrade, nothing to rebuild after an edit: reload the page.
- Script order in two HTML files is the dependency graph, and must be kept in step by hand.
- No type checker. The tests are the only check on `core/`.
