// The food table against Jeremi's reference table. Its "kcal vs original average"
// column is reproduced here in full, so a mistyped kcal value fails by name.
(function () {
  'use strict';

  var VS_BASELINE = {
    'chicken-breast': 41, 'shrimp': -11, 'egg-whites': -21, 'tuna': -3, 'tilapia': 4, 'greek-yogurt-0': -11,
    'cottage-0': 0, 'skyr': -17, 'cottage-1': 3, 'cottage-4': 40, 'turkey': 49, 'chicken-thigh': 58,
    'chicken-gizzards': 39, 'cod': -27, 'canned-salmon': 36, 'crab': -24, 'lobster': -11, 'edamame': 19,
    'lentils': 44, 'kidney-beans': 41, 'split-peas': 46, 'pork-loin': 76, 'lean-beef': 79,
    'broccoli': 7, 'cabbage': -26, 'lettuce': -75, 'spinach': -75, 'mushrooms': -46, 'cucumber': -42,
    'cauliflower': -9, 'zucchini': -34, 'kimchi': -17, 'pumpkin': 73, 'carrots': 82, 'summer-squash': 16,
    'arugula': -83, 'celery': -50, 'napa-cabbage': -50, 'radishes': -34, 'bok-choy': -34, 'tomatoes': 16,
    'red-pepper': 32, 'eggplant': 24, 'asparagus': 40, 'green-beans': 57, 'strawberries': 73,
    'watermelon': 57, 'cantaloupe': 90, 'konjac': -38, 'jello-sf': -34,
    'oil': 10, 'mayo-half': -63, 'chia': 19, 'olives': -18, 'avocado': 28, 'eggs': 42, 'almonds': 28,
    'cream-cheese-light': -45, 'peanut-butter': -14, 'almond-butter': -10, 'tahini': -19, 'walnuts': -15,
    'pistachios': -26, 'cashews': -28,
    'potatoes': -15, 'white-rice': 30
  };

  // The macros the reference table gives, as a second copy of foods.js. The table has no
  // column to check these against, so this catches an edit, not a first transcription.
  var TABLE_MACROS = {
    'chicken-breast': { protein: [17, 18], fat: [1.8, 2.1] }, 'shrimp': { protein: 15, fat: 0.2 },
    'egg-whites': { protein: 11, fat: 0.2 }, 'tuna': { protein: [13, 17], fat: [0.4, 1] },
    'tilapia': { protein: 14.5, fat: 1.2 }, 'greek-yogurt-0': { protein: 10, fat: [0, 0.4] },
    'cottage-0': { protein: 10, fat: 0 }, 'skyr': { protein: 10.5, fat: 0 }, 'cottage-1': { protein: 12, fat: 1 },
    'cottage-4': { protein: 10.5, fat: 4.1 }, 'turkey': { protein: 17, fat: 2.9 },
    'chicken-thigh': { protein: 14.7, fat: 4.8 }, 'chicken-gizzards': { protein: 18.5, fat: 1.6 },
    'cod': { protein: 11, fat: 0.3 }, 'canned-salmon': { protein: 13, fat: 4 }, 'crab': { protein: 10, fat: 0.9 },
    'lobster': { protein: 12.5, fat: 0.4 }, 'edamame': { protein: 7.8, fat: 3.4 },
    'lentils': { protein: 7.6, fat: 0.3 }, 'kidney-beans': { protein: 6.5, fat: 0.4 },
    'split-peas': { protein: 6.9, fat: 0.3 }, 'pork-loin': { protein: 16, fat: 5.4 },
    'lean-beef': { protein: 16.7, fat: 5.4 },
    'oil': { fat: 14 }, 'mayo-half': { fat: [3.5, 4.5] }, 'chia': { fat: 8 }, 'olives': { fat: [7, 10] },
    'avocado': { fat: [11, 15] }, 'eggs': { fat: 11 }, 'almonds': { fat: 12 }, 'cream-cheese-light': { fat: 4.5 },
    'peanut-butter': { fat: 8.1 }, 'almond-butter': { fat: 8.9 }, 'tahini': { fat: 8.1 }, 'walnuts': { fat: 9.2 },
    'pistachios': { fat: 6.4 }, 'cashews': { fat: 6.2 },
    'potatoes': { carbs: 13.2 }, 'white-rice': { carbs: 18.8 }
  };

  var foods = NM.Nutrition.normalise(NM.categories);

  T.test('Data.EveryRowOfTheReferenceTableIsPresentOnce', function () {
    var seen = {};
    foods.forEach(function (f) {
      T.ok(!seen[f.id], 'duplicate id ' + f.id);
      seen[f.id] = true;
      T.ok(f.id in VS_BASELINE, f.id + ' is not in the reference table');
    });
    T.eq(foods.length, Object.keys(VS_BASELINE).length, 'row count');
  });

  T.test('Data.KcalReproducesTheTablesComparisonColumn', function () {
    foods.forEach(function (f) {
      // The table rounded from unrounded underlying values, so one point either way is agreement.
      T.near(NM.Nutrition.vsBaseline(f) * 100, VS_BASELINE[f.id], 1, f.id + " kcal vs average, %");
    });
  });

  T.test('Data.MacrosFromTheTableAreUnchanged', function () {
    foods.forEach(function (f) {
      var given = TABLE_MACROS[f.id] || {};
      Object.keys(given).forEach(function (k) {
        T.eq(JSON.stringify(f.listed[k]), JSON.stringify(given[k]), f.id + ' ' + k);
        T.ok(f.est.indexOf(k) < 0, f.id + ': ' + k + ' is from the table, so not an estimate');
      });
    });
  });

  T.test('Data.ProteinFoodsMeetTheProteinFloor', function () {
    foods.filter(function (f) { return f.category === 'protein'; }).forEach(function (f) {
      T.ok(f.perMl.protein * 100 >= 6, f.id + ' has ≥6 g protein per 100 ml');
    });
  });

  // A portion's listed text starts with how many units it holds, as in "20 almonds" or "½ avocado".
  T.test('Data.APortionIsCountedInTheUnitsItLists', function () {
    NM.categories.filter(function (c) { return c.basis === 'perPortion'; }).forEach(function (c) {
      c.foods.forEach(function (f) {
        var u = f.unit || {};
        var lead = f.portion.split(' ')[0];
        T.eq(u.per, lead === '½' ? 0.5 : Number(lead), f.id + ': units to a portion');
        T.ok(typeof u.name === 'string' && u.name.length > 0, f.id + ': names its unit');
        T.eq(u.step || 1, u.name === 'tbsp' || u.name === 'tsp' || f.id === 'avocado' ? 0.5 : 1, f.id + ': step');
      });
    });
  });

  T.test('Data.EstimatesNameRealFields', function () {
    var allowed = ['kcal', 'protein', 'fat', 'carbs', 'portionMl', 'grams', 'raw'];
    foods.forEach(function (f) {
      f.est.forEach(function (k) { T.ok(allowed.indexOf(k) >= 0, f.id + ' estimates unknown field ' + k); });
      T.ok(f.est.indexOf('kcal') < 0, f.id + ': kcal always comes from the table');
    });
  });

  // The table gives no weights. A density outside what any food on the list can have is
  // a typo, or a per-100 ml value entered on a per-portion row.
  T.test('Data.EveryRowHasAPlausibleEstimatedWeight', function () {
    foods.forEach(function (f) {
      T.ok(f.est.indexOf('grams') >= 0, f.id + ': weight is an estimate, so marked as one');
      T.ok(f.gPerMl >= 0.05 && f.gPerMl <= 1.2, f.id + ': ' + f.gPerMl + ' g per ml');
    });
  });

  // Boiling swells a grain about threefold and barely moves a potato, peel aside. A factor
  // outside that is a typo, or cooked-per-raw entered the wrong way round.
  T.test('Data.AWeightBeforeBoilingIsMarkedPlausibleAndNamed', function () {
    foods.filter(function (f) { return f.raw; }).forEach(function (f) {
      T.ok(f.est.indexOf('raw') >= 0, f.id + ': weight before boiling is an estimate, so marked as one');
      T.ok(f.raw.perG >= 0.25 && f.raw.perG <= 1.3, f.id + ': ' + f.raw.perG + ' g before boiling per g');
      T.ok(typeof f.raw.word === 'string' && f.raw.word.length > 0, f.id + ': says what the weight is of');
    });
  });

  // An estimated macro that disagrees badly with the listed kcal is a typo, not an estimate.
  // Fibre is counted as carbs here, so the macros may overshoot; they may not undershoot much.
  T.test('Data.MacrosRoughlyAccountForTheListedKcal', function () {
    foods.forEach(function (f) {
      var p = f.perMl, fromMacros = p.protein * 4 + p.fat * 9 + p.carbs * 4;
      var kcal = p.kcal, per = f.portion ? f.portionMl : 100;
      T.ok(fromMacros * per >= kcal * per * 0.7 - 2, f.id + ': macros give ' + (fromMacros * per).toFixed(1) + ' kcal of ' + (kcal * per).toFixed(1));
      T.ok(fromMacros * per <= kcal * per * 1.6 + 3, f.id + ': macros give ' + (fromMacros * per).toFixed(1) + ' kcal of ' + (kcal * per).toFixed(1));
    });
  });
  T.test('Data.EveryFoodHasAnIconAndEveryIconAFood', function () {
    var ids = foods.map(function (f) { return f.id; });
    ids.forEach(function (id) { T.ok(id in NM.Icons.BY_FOOD, id + ' has no icon'); });
    Object.keys(NM.Icons.BY_FOOD).forEach(function (id) { T.ok(ids.indexOf(id) >= 0, 'icon for unknown food ' + id); });
  });

  // Synchronous, so the harness needs no async tests; Scripts/Test.ps1 allows file:// reads.
  T.test('Data.EveryIconFileExists', function () {
    var seen = {};
    foods.forEach(function (f) {
      var src = NM.Icons.src(f.id);
      if (seen[src]) return;
      seen[src] = true;
      var x = new XMLHttpRequest();
      x.overrideMimeType('text/plain; charset=x-user-defined');
      try {
        x.open('GET', '../site/' + src, false);
        x.send();
      } catch (e) { T.ok(false, f.id + ': cannot read site/' + src); }
      T.ok(x.responseText.length > 0, f.id + ': site/' + src + ' is missing or empty');
    });
  });
  T.test('Data.EveryIconHasAMinimalVersion', function () {
    foods.forEach(function (f) {
      var paths = NM.Icons.picture(f.id, 'minimal').paths;
      T.ok(Array.isArray(paths) && paths.length > 0, f.id + ': no minimal paths for ' + NM.Icons.BY_FOOD[f.id]);
      (paths || []).forEach(function (p) {
        var d = typeof p === 'string' ? p : p[0];
        T.ok(/^M[\d.\s,-]/.test(d), f.id + ': a minimal path does not start with a move');
      });
    });
  });
})();
