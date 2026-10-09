---
description: Run the gate — tests, links and word budgets — and report pass/fail
allowed-tools: Bash(powershell -NoProfile -ExecutionPolicy Bypass -File Scripts/Gate.ps1:*), PowerShell(powershell -NoProfile -ExecutionPolicy Bypass -File Scripts/Gate.ps1:*)
---

Run the gate:

```
powershell -NoProfile -ExecutionPolicy Bypass -File Scripts/Gate.ps1
```

Report the result:

- All green — say so in one line and stop.
- Anything failed — show the findings, grouped by which check produced them (tests, links, budgets).
  A data test failing by a food's id is a value disagreeing with Jeremi's reference table; say which
  value and which side looks wrong rather than loosening the test.

Do not fix anything unless asked. This command reports.
