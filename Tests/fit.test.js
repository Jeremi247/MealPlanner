(function () {
  'use strict';

  var foods = NM.Nutrition.normalise(NM.categories);
  var target = { kcal: 600, protein: 45, fat: 20, carbs: 55, volume: 750 };
  function food(id) { return foods.filter(function (f) { return f.id === id; })[0]; }
  function plate(pairs) { return pairs.map(function (p) { return { food: food(p[0]), ml: p[1] }; }); }
  function ofCategory(cat) { return foods.filter(function (f) { return f.category === cat; }); }

  T.test('Fit.AnEmptyPlateRanksFoodsByHowEvenlyTheyCoverTheTarget', function () {
    var r = NM.Fit.rank(foods, [], target);
    T.eq(r.regime, 'empty', 'regime');
    T.ok(r.results['edamame'].norm > r.results['oil'].norm, 'edamame beats oil on its own');
    T.ok(r.results['lentils'].norm > r.results['shrimp'].norm, 'lentils beat shrimp on its own');
  });

  // The example the app was specified by: after a fatty pick, fatty foods go red,
  // redder the more fat they carry, and what the plate lacks goes green.
  T.test('Fit.AfterAFattyPickFatFoodsAreRedAndVolumeFoodsGreen', function () {
    var r = NM.Fit.rank(foods, plate([['peanut-butter', 15]]), target).results;
    ofCategory('fat').forEach(function (f) { T.ok(r[f.id].norm < 0, f.id + ' should be red, is ' + r[f.id].norm); });
    ofCategory('volume').forEach(function (f) { T.ok(r[f.id].norm > 0, f.id + ' should be green, is ' + r[f.id].norm); });
    T.ok(r['oil'].norm < r['almonds'].norm, 'oil (14 g fat) redder than almonds (12 g)');
    T.ok(r['almonds'].norm < r['mayo-half'].norm, 'almonds (12 g fat) redder than half-fat mayo (4 g)');
  });

  T.test('Fit.OvershootingAMetTargetIsPenalised', function () {
    var p = plate([['oil', 22.5]]); // 21 g fat, past the 20 g target
    var r = NM.Fit.rank(foods, p, target).results;
    T.ok(r['oil'].penalty > 0, 'oil adds overshoot');
    T.ok(r['oil'].over.fat > 0, 'fat is the overshoot');
    T.eq(r['oil'].norm, -1, 'the worst overshoot is full red');
  });

  // A tile's colour depends on the plate and the target only, never on which other tiles are shown.
  T.test('Fit.ColourIsMeasuredAgainstTheTargetNotTheGrid', function () {
    [[], plate([['peanut-butter', 15]]), plate([['chicken-breast', 150], ['broccoli', 250]])].forEach(function (p) {
      var all = NM.Fit.rank(foods, p, target).results;
      foods.forEach(function (f) {
        T.ok(all[f.id].norm >= -1 && all[f.id].norm <= 1, f.id + ' norm in range: ' + all[f.id].norm);
        T.near(NM.Fit.rank([f], p, target).results[f.id].norm, all[f.id].norm, 1e-12, f.id + ' scored alone');
      });
    });
  });

  T.test('Fit.APlateWithEveryTargetNearlyMetHasNoGreenTile', function () {
    var p = plate([['chicken-breast', 150], ['broccoli', 250], ['potatoes', 250], ['oil', 15]]);
    var r = NM.Fit.rank(foods, p, target).results;
    foods.forEach(function (f) { T.ok(r[f.id].norm < 0, f.id + ' should be red, is ' + r[f.id].norm); });
  });

  T.test('Fit.OnAnEmptyPlateOnlyAnOvershootIsRed', function () {
    var r = NM.Fit.rank(foods, [], target).results;
    foods.forEach(function (f) {
      if (r[f.id].penalty === 0) T.ok(r[f.id].norm >= 0, f.id + ' overshoots nothing, is ' + r[f.id].norm);
    });
    var huge = NM.Fit.rank(foods, [], { kcal: 50, protein: 45, fat: 20, carbs: 55, volume: 750 }).results;
    T.ok(huge['oil'].norm < 0, 'oil past a 50 kcal budget is red');
  });

  T.test('Fit.EachScoreFallsInOneOfFiveBands', function () {
    T.eq(NM.Fit.tier(1), 'recommended', 'full green');
    T.eq(NM.Fit.tier(0.6), 'recommended', 'a boundary belongs to the band above');
    T.eq(NM.Fit.tier(0.4), 'alright', 'light green');
    T.eq(NM.Fit.tier(0), 'may', 'neutral');
    T.eq(NM.Fit.tier(-0.4), 'doubtful', 'orange');
    T.eq(NM.Fit.tier(-1), 'against', 'full red');
    var r = NM.Fit.rank(foods, plate([['peanut-butter', 15]]), target).results;
    T.eq(r['oil'].tier, 'against', 'oil after peanut butter');
    T.eq(r['lentils'].tier, 'recommended', 'lentils after peanut butter');
  });

  // A tile can move up a band after a green pick: the rule compares each dimension with the rest.
  T.test('Fit.CompareNamesTheBandChangeAndTheDimensionThatMovedIt', function () {
    function rk(pairs) { return NM.Fit.rank(foods, plate(pairs), target); }
    var chicken = rk([['chicken-breast', 150]]);
    var up = NM.Fit.compare(chicken, rk([['chicken-breast', 150], ['lentils', 150]]))['almonds'] || {};
    T.eq(up.dir, 'up', 'almonds move up once protein and carbs are in');
    T.eq(up.dim, 'fat', 'because fat is now furthest behind');
    var down = NM.Fit.compare(chicken, rk([['chicken-breast', 150], ['potatoes', 150]]))['potatoes'] || {};
    T.eq(down.dir, 'down', 'more potatoes move down after potatoes');
    T.eq(down.dim, 'carbs', 'because carbs caught up');
    T.eq(Object.keys(NM.Fit.compare(rk([]), chicken)).length, 0, 'leaving the empty plate reports nothing');
    T.eq(Object.keys(NM.Fit.compare(chicken, chicken)).length, 0, 'no change reports nothing');
  });

  T.test('Fit.MostMissingIsOrderedByNeed', function () {
    var p = plate([['chicken-breast', 150]]);
    var m = NM.Fit.mostMissing(NM.Nutrition.totals(p), target);
    T.eq(m[0].dim, 'carbs', 'chicken leaves carbs most missing');
    for (var i = 1; i < m.length; i++) T.ok(m[i - 1].need >= m[i].need, 'descending');
  });
})();
