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

  T.test('Fit.ScoresAreNormalisedToTheGridOnEachSide', function () {
    [[], plate([['peanut-butter', 15]]), plate([['chicken-breast', 150], ['broccoli', 250]])].forEach(function (p) {
      var res = NM.Fit.rank(foods, p, target).results;
      var norms = Object.keys(res).map(function (id) { return res[id].norm; });
      norms.forEach(function (n) { T.ok(n >= -1 && n <= 1, 'norm in range: ' + n); });
      T.eq(Math.max.apply(null, norms), 1, 'the best fit is full green');
      T.eq(Math.min.apply(null, norms), -1, 'the worst fit is full red');
    });
  });

  T.test('Fit.MostMissingIsOrderedByNeed', function () {
    var p = plate([['chicken-breast', 150]]);
    var m = NM.Fit.mostMissing(NM.Nutrition.totals(p), target);
    T.eq(m[0].dim, 'carbs', 'chicken leaves carbs most missing');
    for (var i = 1; i < m.length; i++) T.ok(m[i - 1].need >= m[i].need, 'descending');
  });
})();
