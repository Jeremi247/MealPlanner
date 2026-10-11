# NutrientManager

A local website for building a meal by volume and balancing its macros. [Architecture overview](docs/architecture/overview.md) is the app in one page. This file is only how to work in it.

## Before you touch anything

Read the doc that owns what you are changing. It holds the rule; this file does not repeat it.

| About to | Read first, and before writing |
|---|---|
| Start any work | [todo](docs/todo.md) — the milestone and [P0](docs/todo/P0.md). Add to a list when you find a gap rather than working around one |
| Change anything at all | [critical assumptions](docs/architecture/critical-assumptions.md), [overview](docs/architecture/overview.md), [JS style](docs/conventions/js-style.md) |
| Touch foods, a value or a portion | [food data](docs/subsystems/food-data.md) |
| Touch how tiles are coloured | [fit scoring](docs/subsystems/fit-scoring.md) |
| Touch the grid or the plate | [UI](docs/subsystems/ui.md) |
| Touch the shelf of premade meals | [shelf](docs/subsystems/shelf.md) |
| Touch `Deploy.bat` or `Server/` | [deploy](docs/deploy.md), and for `Server/shelf.py` [shelf](docs/subsystems/shelf.md) |
| Write a comment, doc or record | [docs & comments](docs/conventions/docs-and-comments.md) |
| Decide something structural | [the register](docs/decisions/README.md) — grep it before writing a *because* |
| Call a change done | [testing](docs/testing.md) — the gate, and what a green run does not prove |

## How you work

- **Load narrowly.** The row above for what you are doing, and nothing more.
- **Jeremi's reference table is the source of truth** for every value it lists. A value it does not list is an estimate, and is marked as one.
- **A response states the finding, the evidence, and what it costs.** No preamble, no recap of what was just read.

## Commands

Run the site and a local shelf (opens the browser):

```bash
Serve.bat
```

The gate, before calling a change done:

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File Scripts/Gate.ps1
```

Deploy to https://mealplanner.home/ (runs the gate first):

```bash
Deploy.bat
```

## Where things are

[todo](docs/todo.md) · [decisions](docs/decisions/README.md) · [subsystems](docs/subsystems/) · [architecture](docs/architecture/) · [conventions](docs/conventions/) · [testing](docs/testing.md)
