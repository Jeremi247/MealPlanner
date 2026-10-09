# Docs & comments

Scope: how prose is kept here — word budgets, who owns a fact, and what a code comment may say. Taken from SolEngine's convention of the same name, cut to this project's size. Naming and language use are [JS style](js-style.md).

Starting a new topic doc? Copy [docs/_template.md](../_template.md).

## Budget in words, by how a file is loaded

The less a reader chose to open a file, the tighter its budget.

| | Loaded | Budget | `Scripts/CheckDocs.ps1` |
|---|---|---|---|
| [CLAUDE.md](../../CLAUDE.md) | always | ~400 words | fails over 480 |
| A topic doc | before a change to what it owns | ~1200 words | fails over 1440 |
| A todo detail file | when work starts | ~300 words | fails over 360 |
| A decision record | when a citation is followed | ~400 words of opening | fails over 480 |

A record's opening is its Scope paragraph, its Decision and its Consequences. The argument between them is not budgeted.

Over budget means split or cut, not reformat.

## One fact, one owner

Every fact has exactly one doc that argues it. Everywhere else it is a claim plus a link. **If you are writing "because" outside the owning doc, stop and link instead.**

**Updating is rewriting.** Replace the sentence; do not append the new state beside the old.

**A topic doc states rules, not reasons.** Every *why* is a link to the record that owns it.

**Decisions are append-only in substance.** A reversal is a new record superseding the old one, and the register notes it.

## Comments

A file header says what the file is. A comment at a declaration says what a caller must know. A comment containing *because*, *rather than* or *the reason* is arguing, and the argument belongs in a record — except a hazard local to the code, or a one-clause reason a caller cannot act correctly without.

**A path in a comment is written from the repository root** (`docs/testing.md`, `site/js/core/fit.js`).

## Links

One topic per file. End with "See also" links instead of repeating their content. Link only to files that exist; `Scripts/CheckDocs.ps1` fails on a relative link that does not resolve, including its `#anchor`.

## See also
- [Template](../_template.md) — the shape of a new topic doc
- [Decision register](../decisions/README.md) — grep it for the record that owns an argument
- [Todo](../todo.md) — how the lists and detail files are kept
