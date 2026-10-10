// The food table. Every value is per 100 ml of the food as prepared, except a fat
// portion, which is per its listed portion and carries that portion's volume.
// A value is a number, or [min, max] where the source gives a range.
// `grams` is the weight of that volume or portion, shown and never scored (docs/decisions/0007-weight-is-shown-as-an-estimate.md).
// `est` names the fields not taken from Jeremi's reference table — see docs/subsystems/food-data.md.
(function (NM) {
  'use strict';

  var protein = [
    { id: 'chicken-breast', name: 'Chicken breast', prep: 'Cooked, skinless, diced', kcal: [90, 100], grams: 58, protein: [17, 18], fat: [1.8, 2.1], carbs: 0, est: ['carbs'] },
    { id: 'shrimp', name: 'Shrimp', prep: 'Cooked, peeled', kcal: 60, grams: 61, protein: 15, fat: 0.2, carbs: 0.2, est: ['carbs'] },
    { id: 'egg-whites', name: 'Egg whites', prep: 'Liquid, before cooking', kcal: 53, grams: 102, protein: 11, fat: 0.2, carbs: 0.7, est: ['carbs'] },
    { id: 'tuna', name: 'Tuna', prep: 'Canned in water, drained chunks', kcal: [55, 75], grams: 56, protein: [13, 17], fat: [0.4, 1], carbs: 0, est: ['carbs'] },
    { id: 'tilapia', name: 'Tilapia', prep: 'Steamed, loosely flaked', kcal: 70, grams: 55, protein: 14.5, fat: 1.2, carbs: 0, est: ['carbs'] },
    { id: 'greek-yogurt-0', name: '0% Greek yogurt', prep: 'Plain, high-protein formulation', kcal: 60, grams: 102, protein: 10, fat: [0, 0.4], carbs: 4, est: ['carbs'] },
    { id: 'cottage-0', name: '0% cottage cheese', prep: 'Moist curds', kcal: 67, grams: 93, protein: 10, fat: 0, carbs: 3.5, est: ['carbs'] },
    { id: 'skyr', name: 'Plain nonfat skyr', prep: 'High-protein formulation', kcal: 56, grams: 95, protein: 10.5, fat: 0, carbs: 3.8, est: ['carbs'] },
    { id: 'cottage-1', name: '1% cottage cheese', prep: 'Moist curds', kcal: 69, grams: 96, protein: 12, fat: 1, carbs: 2.8, est: ['carbs'] },
    { id: 'cottage-4', name: 'Regular cottage cheese, ~4% fat', prep: 'Small curds, loosely filled', kcal: 94, grams: 96, protein: 10.5, fat: 4.1, carbs: 3.2, est: ['carbs'] },
    { id: 'turkey', name: 'Turkey', prep: 'Roasted, skinless, diced', kcal: 100, grams: 68, protein: 17, fat: 2.9, carbs: 0, est: ['carbs'] },
    { id: 'chicken-thigh', name: 'Chicken thigh meat', prep: 'Roasted, skinless, boneless, diced', kcal: 106, grams: 59, protein: 14.7, fat: 4.8, carbs: 0, est: ['carbs'] },
    { id: 'chicken-gizzards', name: 'Chicken gizzards', prep: 'Simmered, diced', kcal: 93, grams: 60, protein: 18.5, fat: 1.6, carbs: 0, est: ['carbs'] },
    { id: 'cod', name: 'Cod', prep: 'Steamed, flaked', kcal: 49, grams: 47, protein: 11, fat: 0.3, carbs: 0, est: ['carbs'] },
    { id: 'canned-salmon', name: 'Canned salmon', prep: 'Drained, flaked, not oil-packed', kcal: 91, grams: 65, protein: 13, fat: 4, carbs: 0, est: ['carbs'] },
    { id: 'crab', name: 'Crab meat', prep: 'Cooked, loosely flaked', kcal: 51, grams: 61, protein: 10, fat: 0.9, carbs: 0, est: ['carbs'] },
    { id: 'lobster', name: 'Lobster meat', prep: 'Boiled or steamed, pieces', kcal: 60, grams: 67, protein: 12.5, fat: 0.4, carbs: 0.8, est: ['carbs'] },
    { id: 'edamame', name: 'Edamame', prep: 'Cooked, shelled beans', kcal: 80, grams: 66, protein: 7.8, fat: 3.4, carbs: 5.9, est: ['carbs'] },
    { id: 'lentils', name: 'Lentils', prep: 'Boiled, drained', kcal: 97, grams: 84, protein: 7.6, fat: 0.3, carbs: 16.8, est: ['carbs'] },
    { id: 'kidney-beans', name: 'Kidney beans', prep: 'Boiled, drained', kcal: 95, grams: 75, protein: 6.5, fat: 0.4, carbs: 17, est: ['carbs'] },
    { id: 'split-peas', name: 'Split peas', prep: 'Cooked thick, not soup', kcal: 98, grams: 83, protein: 6.9, fat: 0.3, carbs: 17.4, est: ['carbs'] },
    { id: 'pork-loin', name: 'Pork loin — schab', prep: 'Roasted, visible fat removed, diced', kcal: 118, grams: 66, protein: 16, fat: 5.4, carbs: 0, est: ['carbs'] },
    { id: 'lean-beef', name: 'Lean beef', prep: 'Cooked, visible fat removed, diced', kcal: 120, grams: 60, protein: 16.7, fat: 5.4, carbs: 0, est: ['carbs'] }
  ];

  var volume = [
    { id: 'broccoli', name: 'Broccoli', prep: 'Raw, chopped', kcal: 13, grams: 38, protein: 1.1, fat: 0.15, carbs: 2.5 },
    { id: 'cabbage', name: 'Cabbage', prep: 'Raw, chopped', kcal: 9, grams: 36, protein: 0.5, fat: 0.04, carbs: 2.1 },
    { id: 'lettuce', name: 'Lettuce', prep: 'Raw, loosely shredded', kcal: [2, 4], grams: 20, protein: 0.22, fat: 0.05, carbs: 0.6 },
    { id: 'spinach', name: 'Spinach', prep: 'Raw, loose leaves', kcal: 3, grams: 13, protein: 0.38, fat: 0.05, carbs: 0.47 },
    { id: 'mushrooms', name: 'Mushrooms', prep: 'Raw, pieces', kcal: [6, 7], grams: 30, protein: 0.93, fat: 0.1, carbs: 1 },
    { id: 'cucumber', name: 'Cucumber', prep: 'Raw, sliced', kcal: 7, grams: 47, protein: 0.3, fat: 0.05, carbs: 1.7 },
    { id: 'cauliflower', name: 'Cauliflower', prep: 'Raw, small pieces', kcal: 11, grams: 44, protein: 0.84, fat: 0.13, carbs: 2.2 },
    { id: 'zucchini', name: 'Zucchini', prep: 'Raw, sliced', kcal: 8, grams: 47, protein: 0.56, fat: 0.14, carbs: 1.5 },
    { id: 'kimchi', name: 'Kimchi', prep: 'Prepared, some liquid retained', kcal: 10, grams: 67, protein: 0.74, fat: 0.33, carbs: 1.6 },
    { id: 'pumpkin', name: 'Pumpkin', prep: 'Boiled, drained, mashed', kcal: 21, grams: 105, protein: 0.76, fat: 0.07, carbs: 5.1 },
    { id: 'carrots', name: 'Carrots', prep: 'Raw, chopped', kcal: 22, grams: 54, protein: 0.5, fat: 0.13, carbs: 5.2 },
    { id: 'summer-squash', name: 'Squash — summer variety', prep: 'Cooked', kcal: 14, grams: 70, protein: 0.64, fat: 0.2, carbs: 3 },
    { id: 'arugula', name: 'Rocket / arugula', prep: 'Raw, loose leaves', kcal: 2, grams: 8, protein: 0.21, fat: 0.06, carbs: 0.3 },
    { id: 'celery', name: 'Celery', prep: 'Raw, chopped', kcal: 6, grams: 43, protein: 0.26, fat: 0.06, carbs: 1.1 },
    { id: 'napa-cabbage', name: 'Napa / Chinese cabbage', prep: 'Cooked, drained', kcal: 6, grams: 50, protein: 0.55, fat: 0.1, carbs: 0.9 },
    { id: 'radishes', name: 'Radishes', prep: 'Raw, sliced', kcal: 8, grams: 50, protein: 0.35, fat: 0.05, carbs: 1.7 },
    { id: 'bok-choy', name: 'Bok choy', prep: 'Cooked, drained', kcal: 8, grams: 67, protein: 1.06, fat: 0.1, carbs: 1.2 },
    { id: 'tomatoes', name: 'Tomatoes', prep: 'Raw, chopped', kcal: 14, grams: 78, protein: 0.7, fat: 0.16, carbs: 3 },
    { id: 'red-pepper', name: 'Red bell pepper', prep: 'Raw, chopped', kcal: 16, grams: 52, protein: 0.52, fat: 0.16, carbs: 3.1 },
    { id: 'eggplant', name: 'Aubergine / eggplant', prep: 'Boiled, drained', kcal: 15, grams: 43, protein: 0.35, fat: 0.1, carbs: 3.7 },
    { id: 'asparagus', name: 'Asparagus', prep: 'Cooked, drained', kcal: 17, grams: 77, protein: 1.85, fat: 0.17, carbs: 3.2 },
    { id: 'green-beans', name: 'Green beans', prep: 'Cooked, drained', kcal: 19, grams: 54, protein: 1, fat: 0.15, carbs: 4.3 },
    { id: 'strawberries', name: 'Strawberries', prep: 'Raw, halved', kcal: 21, grams: 66, protein: 0.46, fat: 0.2, carbs: 5.1 },
    { id: 'watermelon', name: 'Watermelon', prep: 'Raw, diced', kcal: 19, grams: 63, protein: 0.38, fat: 0.1, carbs: 4.8 },
    { id: 'cantaloupe', name: 'Cantaloupe', prep: 'Raw, cubed', kcal: 23, grams: 68, protein: 0.57, fat: 0.13, carbs: 5.6 },
    { id: 'konjac', name: 'Konjac noodles', prep: 'Prepared, drained', kcal: [5, 10], grams: 95, protein: 0, fat: 0, carbs: 2.5 },
    { id: 'jello-sf', name: 'Sugar-free Jell-O', prep: 'Prepared jelly', kcal: 8, grams: 100, protein: 0.8, fat: 0, carbs: 0.7 }
  ];
  volume.forEach(function (f) { f.est = ['protein', 'fat', 'carbs']; });

  // Per portion as listed; `portionMl` is the volume one portion fills.
  var fat = [
    { id: 'oil', name: 'Olive or sesame oil', portion: '1 tbsp', portionMl: 15, kcal: 120, grams: 14, fat: 14, protein: 0, carbs: 0, est: ['protein', 'carbs'] },
    { id: 'mayo-half', name: 'Half-fat mayonnaise', portion: '1 tbsp', portionMl: 15, kcal: [35, 45], grams: 15, fat: [3.5, 4.5], protein: 0.1, carbs: 1, est: ['protein', 'carbs'] },
    { id: 'chia', name: 'Chia seeds', portion: '2 tbsp, dry', portionMl: 30, kcal: 130, grams: 27, fat: 8, protein: 4.4, carbs: 11, est: ['protein', 'carbs'] },
    { id: 'olives', name: 'Olives', portion: '20 medium', portionMl: 100, kcal: [80, 100], grams: 78, fat: [7, 10], protein: 0.7, carbs: 5, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'avocado', name: 'Avocado', portion: '½ avocado', portionMl: 100, kcal: [120, 160], grams: 88, fat: [11, 15], protein: 2, carbs: 8.5, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'eggs', name: 'Whole eggs', portion: '2 large, hard-boiled', portionMl: 100, kcal: 155, grams: 100, fat: 11, protein: 12.6, carbs: 1.1, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'almonds', name: 'Almonds', portion: '20 almonds', portionMl: 40, kcal: 140, grams: 24, fat: 12, protein: 5, carbs: 5, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'cream-cheese-light', name: 'Light cream cheese', portion: '2 tbsp', portionMl: 30, kcal: 60, grams: 30, fat: 4.5, protein: 2.5, carbs: 2, est: ['protein', 'carbs'] },
    { id: 'peanut-butter', name: 'Peanut butter', portion: '1 level tbsp', portionMl: 15, kcal: 94, grams: 16, fat: 8.1, protein: 3.6, carbs: 3.1, est: ['protein', 'carbs'] },
    { id: 'almond-butter', name: 'Almond butter', portion: '1 level tbsp', portionMl: 15, kcal: 98, grams: 16, fat: 8.9, protein: 3.4, carbs: 3, est: ['protein', 'carbs'] },
    { id: 'tahini', name: 'Tahini', portion: '1 level tbsp', portionMl: 15, kcal: 89, grams: 15, fat: 8.1, protein: 2.6, carbs: 3.2, est: ['protein', 'carbs'] },
    { id: 'walnuts', name: 'Walnuts', portion: '7 halves', portionMl: 30, kcal: 93, grams: 14, fat: 9.2, protein: 2.1, carbs: 1.9, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'pistachios', name: 'Pistachios', portion: '25 shelled kernels', portionMl: 20, kcal: 81, grams: 14, fat: 6.4, protein: 2.9, carbs: 3.9, est: ['protein', 'carbs', 'portionMl'] },
    { id: 'cashews', name: 'Cashews', portion: '9 whole kernels', portionMl: 25, kcal: 79, grams: 14, fat: 6.2, protein: 2.6, carbs: 4.3, est: ['protein', 'carbs', 'portionMl'] }
  ];

  var starch = [
    { id: 'potatoes', name: 'Boiled potatoes', prep: 'Peeled, pieces, not mashed', kcal: 57, grams: 66, protein: 1.1, fat: 0.1, carbs: 13.2 },
    { id: 'white-rice', name: 'White rice', prep: 'Cooked long-grain, loosely filled', kcal: 87, grams: 67, protein: 1.8, fat: 0.2, carbs: 18.8 }
  ];

  // The table gives no weights, so every row's `grams` is an estimate.
  [protein, volume, fat, starch].forEach(function (rows) {
    rows.forEach(function (f) { f.est = (f.est || []).concat('grams'); });
  });

  // `baseline` is the "original average" the reference table compares kcal against.
  // `defaultMl` is what one click adds; `stepMl` is what a +/- moves.
  NM.categories = [
    { id: 'protein', name: 'Protein foods', basis: 'per100ml', baseline: 67.1, defaultMl: 150, stepMl: 25, foods: protein,
      note: '≥6 g protein per 100 ml.' },
    { id: 'volume', name: 'Volume foods', basis: 'per100ml', baseline: 12.1, defaultMl: 250, stepMl: 50, foods: volume,
      note: 'Volume is the food as prepared: loose raw leaves and cooked, collapsed leaves are not interchangeable.' },
    { id: 'fat', name: 'Fat portions', basis: 'perPortion', baseline: 109.4, foods: fat,
      note: 'Listed per portion, not per equal volume. Brand and item size move the totals.' },
    { id: 'starch', name: 'Starchy options', basis: 'per100ml', baseline: 67.1, defaultMl: 150, stepMl: 25, foods: starch,
      note: 'Measured portions.' }
  ];
})(window.NM = window.NM || {});
