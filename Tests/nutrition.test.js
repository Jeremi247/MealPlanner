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
  });

  T.test('Nutrition.AStepIsOneUnitOrHalfASpoon', function () {
    T.eq(food('eggs').stepMl, 50, 'one egg of a two-egg portion');
    T.eq(food('almonds').stepMl, 2, 'one almond of twenty');
    T.eq(food('oil').stepMl, 7.5, 'half a tbsp');
    T.eq(food('chia').stepMl, 7.5, 'half a tbsp of a two-tbsp portion');
    T.near(N.units(food('almonds'), 46), 23, 1e-9, '46 ml is 23 almonds');
    T.eq(N.units(food('broccoli'), 100), null, 'a food measured in ml');
  });

  T.test('Nutrition.APlusOrMinusLandsOnAWholeStep', function () {
    var e = food('eggs'), c = food('cashews');
    T.eq(N.stepped(e, 100, 1), 150, '2 eggs, plus');
    T.eq(N.stepped(e, 100, -1), 50, '2 eggs, minus');
    T.eq(N.stepped(e, 120, 1), 150, 'between steps, plus');
    T.eq(N.stepped(e, 120, -1), 100, 'between steps, minus');
    T.eq(N.stepped(e, 30, -1), 0, 'never below zero');
    T.near(N.units(c, N.stepped(c, N.stepped(c, 25, 1), 1)), 11, 1e-9, 'a non-integer unit volume steps cleanly');
    T.eq(N.stepped(food('broccoli'), 250, 1), 300, 'a food measured in ml steps by its category');
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

  T.test('Nutrition.WeightBeforeBoilingScalesWithTheWeightAsPrepared', function () {
    T.near(N.rawGrams(food('white-rice'), 150), 150 * 0.67 * 0.35, 1e-9, 'rice 150 ml, dry');
    T.near(N.rawGrams(food('potatoes'), 100), 66 * 1.15, 1e-9, 'potatoes 100 ml, unpeeled');
    T.eq(N.rawGrams(food('broccoli'), 250), null, 'a food without one');
  });

  T.test('Nutrition.DensityIsVolumePer100Kcal', function () {
    T.near(N.mlPer100Kcal(food('cucumber').perMl.kcal), 100 / 0.07, 1e-6, 'cucumber');
    T.eq(N.mlPer100Kcal(0), Infinity, 'zero-kcal food');
  });
})();
