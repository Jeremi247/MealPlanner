# 0010 — Track what a supplement cannot carry

Scope: which nutrients the app tracks beyond kcal, protein, fat and carbs, and which of them the fit score uses. How a nutrient field is added to a row is [food data](../subsystems/food-data.md). It assumes the diet is supplemented with a standard multivitamin.

## Decision

**A nutrient is tracked only if a pill cannot realistically supply it**: either it is too bulky to fit in a tablet, or it is the food itself.

| Tier | Nutrients | How |
|---|---|---|
| Scored per meal | protein (already), **fibre** | Balanced fit dimensions with a meal target |
| Shown, not scored | potassium, sodium, calcium, magnesium | Plate total against a daily reference |
| Not tracked | vitamins, zinc, iodine, selenium, omega-3, saturated fat, sugar; iron if the supplement carries it | The supplement, or the food list itself, covers them |

## Why

**Fibre** has the strongest whole-food evidence after energy. Intakes of 25–29 g a day or more go with 15–30 % fewer deaths from all causes and cardiovascular disease, and less type 2 diabetes and colorectal cancer, and the benefit keeps rising past that range (Reynolds, *Lancet* 2019). A psyllium supplement is one fibre, not the mix food gives. The grid does not deliver fibre by itself: ranking by ml per kcal rewards air, and fibre per ml varies about thirtyfold, from ~0.2 g per 100 ml for lettuce to ~6.5 g for lentils (both estimates). A 750 ml plate can hold 3 g or 20 g.

**Protein** protects lean mass on a deficit at ~1.6 g/kg a day (Morton 2018), and 2.3–3.1 g/kg of fat-free mass for lean people cutting while training (Helms 2014). Per meal, ~0.4 g/kg (Schoenfeld & Aragon 2018).

**Potassium** is under-eaten, and US over-the-counter pills are capped below 100 mg. Reference: 3400 mg for men, 2600 mg for women (NASEM 2019). **Sodium** is among the best-evidenced dietary levers: a salt substitute cut stroke and death in SSaSS (NEJM 2021). The reference limit is 2300 mg. Added salt usually dominates, and the table cannot see it. **Calcium** (1000 mg) and **magnesium** (400–420 mg for men, 310–320 mg for women) are too bulky for a multivitamin, which usually carries 200 mg and 100 mg or less.

These four are shown but not scored, because they balance over a day, not a meal.

**Not tracked.** A multivitamin covers the vitamins and trace minerals. Iron is covered only if the supplement contains it. Omega-3 comes from fish oil or about two oily-fish meals a week. Saturated fat and sugar stay low on this food list without a counter.

These citations are from memory and have not been checked against the papers yet ([P3](../todo/P3/micronutrients.md)).

## Rejected

**A full micronutrient panel.** Every value would be an estimate converted through density ([0004](0004-estimates-are-marked-not-hidden.md)), for nutrients the supplement already covers.

**Scoring the minerals per meal.** They balance over a day, and a meal-level score would push the grid around for no gain.

## Consequences

- Fibre must leave carbs, which needs one definition of carbs across sources: US data includes fibre, EU labels exclude it ([fibre](../todo/P2/fibre.md)).
- The minerals need a daily view or a share of the day per meal, and sodium needs a way to enter added salt ([micronutrients](../todo/P3/micronutrients.md)).
- A supplement that carries calcium, magnesium or fish oil takes that nutrient out of the list. One without iron puts iron on it.
