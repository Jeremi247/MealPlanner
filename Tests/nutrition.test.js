(function () {
  'use strict';

  var N = NM.Nutrition;
  var foods = N.normalise(NM.categories);
  function food(id) { return foods.filter(function (f) { return f.id === id; })[0]; }

  T.test('Nutrition.ARangeIsCarriedAtItsMidpoint', function () {
    var c = food('chicken-breast');
    T.near(c.perMl.kcal, 0.95, 1e-9, 'kcal per ml');
    T.near(c.range.kcal[0], 0.9, 1e-9, 'low');
    T.near(c.range.kcal[1], 1.0, 1e-9, 'high');
  });

  T.test('Nutrition.APortionIsSpreadOverItsVolume', function () {
    var oil = food('oil');
    T.near(oil.perMl.kcal, 8, 1e-9, 'oil kcal per ml');
    T.near(oil.perMl.fat, 14 / 15, 1e-9, 'oil fat per ml');
    T.eq(oil.defaultMl, 15, 'one click adds one portion');
    T.eq(oil.stepMl, 7.5, 'a step is half a portion');
  });

  // The reference table's own portion examples, before rounding.
  T.test('Nutrition.StarchPortionsMatchTheTable', function () {
    T.near(N.amount(food('potatoes'), 150).kcal, 85, 1, 'potatoes 150 ml');
    T.near(N.amount(food('potatoes'), 250).kcal, 142, 1, 'potatoes 250 ml');
    T.near(N.amount(food('white-rice'), 150).kcal, 130, 1, 'rice 150 ml');
    T.near(N.amount(food('white-rice'), 250).kcal, 217, 1, 'rice 250 ml');
  });

  T.test('Nutrition.APlateSumsVolumeAndNutrients', function () {
    var t = N.totals([{ food: food('oil'), ml: 15 }, { food: food('broccoli'), ml: 200 }]);
    T.eq(t.volume, 215, 'volume');
    T.near(t.kcal, 120 + 26, 1e-9, 'kcal');
    T.near(t.fat, 14 + 0.3, 1e-9, 'fat');
  });

  T.test('Nutrition.AWeightTypedInBecomesTheVolumeItFills', function () {
    T.near(N.mlFromGrams(food('oil'), 14), 15, 1e-9, 'one oil portion by weight');
    var b = food('broccoli');
    T.near(N.grams(b, N.mlFromGrams(b, 100)), 100, 1e-9, 'broccoli round trip');
  });

  T.test('Nutrition.WeightScalesWithVolume', function () {
    T.near(N.grams(food('oil'), 15), 14, 1e-9, 'one oil portion');
    T.near(N.grams(food('oil'), 7.5), 7, 1e-9, 'half an oil portion');
    T.near(N.grams(food('broccoli'), 250), 95, 1e-9, 'broccoli 250 ml');
  });

  T.test('Nutrition.DensityIsVolumePer100Kcal', function () {
    T.near(N.mlPer100Kcal(food('cucumber').perMl.kcal), 100 / 0.07, 1e-6, 'cucumber');
    T.eq(N.mlPer100Kcal(0), Infinity, 'zero-kcal food');
  });
})();
