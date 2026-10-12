# TODO

Scope: the rules this backlog is kept by, the current milestone, and the four priority lists. **The items live in the priority files, and their detail in a file each** — this one holds nothing that is not a rule or a goal.

| List | Holds |
|---|---|
| [P0](todo/P0.md) | The milestone's critical path — the goal cannot be met without it |
| [P1](todo/P1.md) | Previous milestones' unpaid bills |
| [P2](todo/P2.md) | Deferred deliberately; nothing on the critical path |
| [P3](todo/P3.md) | Areas with no work started |

## How these lists are kept

**A list entry is one sentence and a link.** Everything else — open questions, blockers, what to read — lives in the item's detail file, one per item in the list's folder. Copy [todo/_item.md](todo/_item.md). Budget ~300 words.

**Open *questions* about a part of the app stay in its subsystem doc.** These files are for work we know we need to do.

**Completed items are deleted, not summarised**, and every link to the file is repointed at what closed it. History is git and the decision register.

**Add to a list when you find a gap**, rather than working around one.

**Priority is about dependency, not importance.**

**A shortcut is legitimate only when written down as one** — in a decision record, with the trigger that ends it and the seam that survives it. [0005](decisions/0005-state-lives-in-the-browser.md) is the worked example.

## Milestone goal

> **A first version Jeremi can use: pick foods by volume, and see every other food coloured by how well it would balance the plate.**

**Built; awaiting review.** Done means the reference table is in the app with every value it gives, the grid colours by fit as [0003](decisions/0003-fit-is-scored-against-what-the-plate-lacks.md) specifies, the plate shows its volume and macros against a target, and the gate is green. What stands between that and *met* is Jeremi's review ([P0](todo/P0.md)).

**Excluded until the review asks**: a history across days, export, micronutrients. Each is on a list below. Foods of your own were asked for and are built ([0026](decisions/0026-your-own-foods-are-kept-on-the-server.md)).

## See also
- [P0](todo/P0.md), [P1](todo/P1.md), [P2](todo/P2.md), [P3](todo/P3.md) — the items themselves
- [Architecture overview](architecture/overview.md) — the shape these fit into
- [Testing](testing.md) — the gate anything here has to pass
