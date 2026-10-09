# JS style

Scope: how the site's JavaScript and CSS are written. Prose rules are [docs & comments](docs-and-comments.md).

## Files and loading

- **Classic scripts, one namespace.** Each file is an IIFE taking `NM` and adding one member (`NM.Fit`, `NM.Grid`). No `import`, no bundler ([0002](../decisions/0002-no-build-step-and-no-dependencies.md)).
- **Order is the dependency graph.** `site/index.html` and `Tests/index.html` list scripts data → core → store → ui → app. A file may use only what is listed above it.
- **`core/` touches no DOM.** It is what the tests load, and it must run with no UI present.
- `'use strict'` at the top of every IIFE.

## Language

- ES5 syntax plus the array and object methods every current browser has. No arrow functions, `let`, `class` or template literals, so every file reads alike.
- Names are camelCase for values and functions, PascalCase for namespace members.
- A function that formats or builds DOM takes its data as arguments and reads no global state.

## DOM and CSS

- Build elements with `NM.Format.el(tag, className, text)`. Set text with `textContent`. Never `innerHTML` with data.
- Colours are tokens on `:root`, redefined under `prefers-color-scheme: dark`. A component never names a raw colour.
- Class names are kebab-case and prefixed by their component (`tile-`, `bar-`, `item-`).

## See also
- [Overview](../architecture/overview.md) — the files these rules cover
- [UI](../subsystems/ui.md) — the components the class prefixes name
