// Foods of your own (site/js/core/custom-foods.js): what a stored one may hold, an entry turned
// into one, and how one joins the table.
(function () {
  'use strict';

  var CF = NM.CustomFoods;

  var QUARK = { id: 'my-000000000001', name: 'Quark', prep: 'Plain, 0%', category: 'protein', kcal: 68, protein: 12, fat: 0.2, carbs: 4, grams: 105, icon: 'bowl-with-spoon' };
  var CAKE = { id: 'my-000000000002', name: 'Rice cake', prep: '', category: 'starch', kcal: 35, protein: 0.7, fat: 0.3, carbs: 7.3, grams: 9, icon: null,
    portionMl: 40, unit: { per: 1, name: 'cake', step: 1 } };

  function entry(over) {
    return Object.assign({ basis: 'per100ml', name: 'Quark', prep: 'Plain, 0%', category: 'protein', icon: 'bowl-with-spoon',
      kcal: 68, protein: 12, fat: 0.2, carbs: 4, grams: 105 }, over);
  }

  T.test('CustomFoods.AStoredListKeepsOnlyWellFormedFoods', function () {
    var kept = CF.clean({ foods: [QUARK, CAKE, QUARK, Object.assign({}, QUARK, { id: 'my-bad' }),
      Object.assign({}, QUARK, { id: 'my-000000000003', kcal: -1 }), Object.assign({}, QUARK, { id: 'my-000000000004', category: 'dessert' }),
      Object.assign({}, QUARK, { id: 'my-000000000005', grams: 0 }), Object.assign({}, CAKE, { id: 'my-000000000006', unit: { per: 1, name: 'cake', step: 2 } }),
      'junk', null] });
    T.eq(kept.map(function (f) { return f.id; }).join(), QUARK.id + ',' + CAKE.id, 'kept');
    T.eq(JSON.stringify(kept[0]), JSON.stringify(QUARK), 'a food is kept whole');
    T.eq(CF.clean(null).length, 0, 'nothing stored');
    T.eq(CF.clean({ foods: 'x' }).length, 0, 'no list');
  });

  T.test('CustomFoods.AnEntryPer100gIsKeptPer100ml', function () {
    // Labelled per 100 g, and 100 ml of it weighs 50 g: per 100 ml is half the label.
    var f = CF.fromEntry(entry({ basis: 'per100g', kcal: 360, protein: 8, fat: 1, carbs: 78, grams: 50 })).food;
    T.eq([f.kcal, f.protein, f.fat, f.carbs, f.grams].join(), '180,4,0.5,39,50', 'per 100 ml');
    T.ok(!f.unit, 'per 100 ml has no unit');
  });

  T.test('CustomFoods.APortionIsCountedInItsUnitAndASpoonByHalves', function () {
    var f = CF.fromEntry(entry({ basis: 'perPortion', portionMl: 15, per: 1, unitName: 'tbsp' })).food;
    T.eq(JSON.stringify(f.unit), JSON.stringify({ per: 1, name: 'tbsp', step: 0.5 }), 'a spoon');
    T.eq(f.portionMl, 15, 'its volume');
    T.eq(CF.fromEntry(entry({ basis: 'perPortion', portionMl: 40, per: 2, unitName: 'cake' })).food.unit.step, 1, 'anything else');
  });

  T.test('CustomFoods.AnEntryMissingWhatItNeedsSaysWhat', function () {
    T.ok(/name/.test(CF.fromEntry(entry({ name: '  ' })).error), 'a blank name');
    T.ok(/kcal/.test(CF.fromEntry(entry({ kcal: NaN })).error), 'no kcal');
    T.ok(/weight/.test(CF.fromEntry(entry({ grams: 0 })).error), 'no weight');
    T.ok(/category/.test(CF.fromEntry(entry({ category: '' })).error), 'no category');
    T.ok(/volume/.test(CF.fromEntry(entry({ basis: 'perPortion', portionMl: 0, per: 1, unitName: 'cake' })).error), 'no portion volume');
    T.ok(/unit/.test(CF.fromEntry(entry({ basis: 'perPortion', portionMl: 40, per: 1, unitName: '' })).error), 'no unit');
  });

  T.test('CustomFoods.JoinTheirCategoryAfterTheTablesRows', function () {
    var tableRows = NM.categories[0].foods.length;
    var cats = CF.withCustom(NM.categories, [QUARK, CAKE]);
    var foods = NM.Nutrition.normalise(cats);
    var quark = foods.find(function (f) { return f.id === QUARK.id; });
    var cake = foods.find(function (f) { return f.id === CAKE.id; });
    T.eq(quark.category, 'protein', 'in its category');
    T.eq(quark.order, NM.categories[0].foods.length, 'after the table rows');
    T.ok(quark.custom && quark.est.length === 0, 'marked as yours, nothing as an estimate');
    T.near(quark.perMl.protein, 0.12, 1e-9, 'per ml');
    T.eq(quark.defaultMl, 150, 'a click adds what its category adds');
    T.eq(cake.portion, '1 cake', 'a portion is named by its count and unit');
    T.near(cake.perMl.kcal, 35 / 40, 1e-9, 'a portion is spread over its volume');
    T.eq(cake.defaultMl, 40, 'a click adds a portion');
    T.eq(NM.categories[0].foods.length, tableRows, 'the table is left alone');
  });

  T.test('CustomFoods.AFatFoodPer100mlIsAddedBySpoonfuls', function () {
    var cheese = Object.assign({}, QUARK, { id: 'my-000000000007', category: 'fat', kcal: 350, protein: 25, fat: 28, carbs: 1 });
    var f = NM.Nutrition.normalise(CF.withCustom(NM.categories, [cheese])).find(function (x) { return x.id === cheese.id; });
    T.eq(f.unit, null, 'counted in ml');
    T.eq(f.defaultMl, 15, 'one click');
    T.eq(f.stepMl, 5, 'one step');
  });

  T.test('CustomFoods.TheSuggestionIsTheRules', function () {
    T.eq(CF.suggest(QUARK).id, 'protein', 'quark');
    T.eq(CF.suggest(CAKE).id, 'starch', 'a rice cake');
    T.eq(CF.suggest(Object.assign({}, QUARK, { kcal: 15, protein: 1, fat: 0.1, carbs: 3 })).id, 'volume', 'a thin one');
  });

  T.test('CustomFoods.AFoodOfYourOwnShowsItsChosenPicture', function () {
    T.eq(NM.Icons.picture({ id: QUARK.id, icon: 'egg' }, 'emoji').src, 'img/foods/egg.png', 'its own');
    T.eq(NM.Icons.picture({ id: QUARK.id, icon: 'no-such' }, 'emoji').src, 'img/foods/' + NM.Icons.FALLBACK + '.png', 'unknown');
    T.eq(NM.Icons.picture({ id: QUARK.id, icon: null }, 'emoji').src, 'img/foods/' + NM.Icons.FALLBACK + '.png', 'none');
  });

  T.test('FoodStore.AMissingOrMalformedCopyIsNone', function () {
    var desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
    var raw = null;
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return { getItem: function () { return raw; }, setItem: function () {} }; } });
    try {
      T.eq(NM.FoodStore.cached(), null, 'missing');
      raw = '{"doc":{"meals":[]},"at":5}';
      T.eq(NM.FoodStore.cached(), null, 'the shelf, not foods');
      raw = '{"doc":{"foods":[]},"at":5}';
      T.eq(NM.FoodStore.cached().at, 5, 'a good copy');
    } finally { Object.defineProperty(window, 'localStorage', desc); }
  });
})();
