// Turns the food table into per-millilitre records, and sums a plate.
// Every quantity downstream of here is per ml or in ml. The one weight of food is
// `gPerMl`, an estimate for display and for typing a weight in, that nothing stores,
// sums or scores (docs/decisions/0007-weight-is-shown-as-an-estimate.md,
// docs/decisions/0008-a-weight-can-be-typed-in-and-is-stored-as-ml.md).
(function (NM) {
  'use strict';

  var NUTRIENTS = ['kcal', 'protein', 'fat', 'carbs'];

  function mid(v) { return Array.isArray(v) ? (v[0] + v[1]) / 2 : v; }
  function low(v) { return Array.isArray(v) ? v[0] : v; }
  function high(v) { return Array.isArray(v) ? v[1] : v; }

  // One record per food, whatever basis its category is listed on.
  function normalise(categories) {
    var out = [];
    categories.forEach(function (cat) {
      cat.foods.forEach(function (f, order) {
        var perPortion = cat.basis === 'perPortion';
        var basisMl = perPortion ? f.portionMl : 100;
        var rec = {
          id: f.id, name: f.name, category: cat.id, order: order,
          prep: f.prep || '', portion: f.portion || null, portionMl: f.portionMl || null,
          est: f.est || [],
          perMl: {}, range: {}, listed: {},
          gPerMl: f.grams / basisMl,
          defaultMl: perPortion ? f.portionMl : cat.defaultMl,
          stepMl: perPortion ? f.portionMl / 2 : cat.stepMl,
          baseline: cat.baseline
        };
        NUTRIENTS.forEach(function (n) {
          var v = f[n] === undefined ? 0 : f[n];
          rec.listed[n] = v;
          rec.perMl[n] = mid(v) / basisMl;
          rec.range[n] = [low(v) / basisMl, high(v) / basisMl];
        });
        out.push(rec);
      });
    });
    return out;
  }

  // What `ml` of a food carries. `volume` is the ml itself.
  function amount(food, ml) {
    var a = { volume: ml };
    NUTRIENTS.forEach(function (n) { a[n] = food.perMl[n] * ml; });
    return a;
  }

  // Estimated weight of `ml` of a food, in grams.
  function grams(food, ml) { return food.gPerMl * ml; }

  // The volume an estimated weight of a food fills: the inverse of `grams`.
  function mlFromGrams(food, g) { return g / food.gPerMl; }

  function zero() { return { volume: 0, kcal: 0, protein: 0, fat: 0, carbs: 0 }; }

  function add(x, y) {
    var r = {};
    Object.keys(x).forEach(function (k) { r[k] = x[k] + (y[k] || 0); });
    return r;
  }

  // `items` is [{ food, ml }].
  function totals(items) {
    return items.reduce(function (t, it) { return add(t, amount(it.food, it.ml)); }, zero());
  }

  // Satiety density: how much volume 100 kcal of this buys. Infinity for a zero-kcal food.
  function mlPer100Kcal(kcalPerMl) { return kcalPerMl > 0 ? 100 / kcalPerMl : Infinity; }

  // Share of a food's own calories from each macro, at 4/9/4 kcal per gram.
  function macroKcalSplit(perMl) {
    var p = perMl.protein * 4, f = perMl.fat * 9, c = perMl.carbs * 4, sum = p + f + c;
    if (sum <= 0) return { protein: 0, fat: 0, carbs: 0 };
    return { protein: p / sum, fat: f / sum, carbs: c / sum };
  }

  // The reference table's "kcal vs original average" column, as a fraction.
  function vsBaseline(food) {
    var listedKcal = mid(food.listed.kcal);
    return food.baseline ? listedKcal / food.baseline - 1 : 0;
  }

  NM.Nutrition = {
    NUTRIENTS: NUTRIENTS, mid: mid, normalise: normalise, amount: amount, grams: grams, mlFromGrams: mlFromGrams, zero: zero, add: add,
    totals: totals, mlPer100Kcal: mlPer100Kcal, macroKcalSplit: macroKcalSplit, vsBaseline: vsBaseline
  };
})(window.NM = window.NM || {});
