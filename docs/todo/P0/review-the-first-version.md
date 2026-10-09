# Review the first version

**Ask** — Jeremi uses the site and requests changes. The questions below were answered with a default so the build could land; each is Jeremi's call.

**Open**

- The default meal target: 600 kcal, 45 g protein, 20 g fat, 55 g carbs, 750 ml. Per meal, or should the target be per day with meals beneath it?
- One click adds 150 ml of a protein or starch, 250 ml of a volume food, one fat portion. Right sizes?
- Fat portions step by half a portion. Should they be entered in ml like the rest, or in portions?
- The counted-item portion volumes are estimates: 20 almonds ≈ 40 ml, 20 olives ≈ 100 ml, ½ avocado ≈ 100 ml, 2 eggs ≈ 100 ml, 7 walnut halves ≈ 30 ml, 25 pistachios ≈ 20 ml, 9 cashews ≈ 25 ml.
- A target of 0 is allowed, and today it makes that dimension read 100 % missing for ever and never overshoot, which skews every other score. Should 0 drop the dimension from balance, or penalise any amount of it?
- Boiled potatoes and white rice carry protein and fat with no `est` mark, but [food data](../../subsystems/food-data.md) says the table gives only kcal and carbs for starch. Does the table give them? If not, they are estimates to mark.

**Read**

- [Fit scoring](../../subsystems/fit-scoring.md) — what the colour means, and its own open questions
- [Food data](../../subsystems/food-data.md) — which values are estimated
- [0003](../../decisions/0003-fit-is-scored-against-what-the-plate-lacks.md) — the alternatives already rejected
