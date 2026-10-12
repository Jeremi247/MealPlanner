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

  // One record per food, listed per portion when the row counts one in a `unit`, and per 100 ml
  // otherwise. Every table row in the fat category is per portion; a food of your own may be either.
  function normalise(categories) {
    var out = [];
    categories.forEach(function (cat) {
      cat.foods.forEach(function (f, order) {
        var perPortion = !!f.unit;
        var basisMl = perPortion ? f.portionMl : 100;
        var unit = perPortion ? { name: f.unit.name, ml: f.portionMl / f.unit.per } : null;
        var rec = {
          id: f.id, name: f.name, category: cat.id, order: order,
          prep: f.prep || '', portion: f.portion || null, portionMl: f.portionMl || null,
          est: f.est || [], custom: !!f.custom, icon: f.icon || null,
          perMl: {}, range: {}, listed: {},
          gPerMl: f.grams / basisMl,
          raw: f.raw || null,
          unit: unit,
          defaultMl: perPortion ? f.portionMl : cat.defaultMl,
          stepMl: perPortion ? unit.ml * (f.unit.step || 1) : cat.stepMl,
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

  // Estimated weight of `ml` of a food before boiling, in grams, or null for a food without one.
  function rawGrams(food, ml) { return food.raw ? grams(food, ml) * food.raw.perG : null; }

  // How many of a portion food's units `ml` holds, or null for a food measured in ml.
  function units(food, ml) { return food.unit ? ml / food.unit.ml : null; }

  // The ml a +/- moves `ml` to: the next whole step up (`dir` 1) or down (-1), never below 0.
  // A volume between steps, as a typed one can be, lands on a step rather than off by as much.
  function stepped(food, ml, dir) {
    var n = ml / food.stepMl;
    var k = dir > 0 ? Math.floor(n + 1e-6) + 1 : Math.ceil(n - 1e-6) - 1;
    return Math.max(0, k * food.stepMl);
  }

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

  // The reference table's "kcal vs original average" column, as a fraction.
  function vsBaseline(food) {
    var listedKcal = mid(food.listed.kcal);
    return food.baseline ? listedKcal / food.baseline - 1 : 0;
  }

  NM.Nutrition = {
    NUTRIENTS: NUTRIENTS, mid: mid, normalise: normalise, amount: amount, grams: grams, rawGrams: rawGrams, units: units, stepped: stepped, mlFromGrams: mlFromGrams, zero: zero, add: add,
    totals: totals, mlPer100Kcal: mlPer100Kcal, vsBaseline: vsBaseline
  };
})(window.NM = window.NM || {});
