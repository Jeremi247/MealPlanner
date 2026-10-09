// Scores how well one more portion of a food fits the plate against the meal target.
// The rule, its two regimes and its weights are docs/subsystems/fit-scoring.md;
// this file implements that doc and argues nothing it does not.
(function (NM) {
  'use strict';

  // Dimensions the plate is balanced across. kcal is a budget, not a dimension.
  var BALANCE = ['protein', 'fat', 'carbs', 'volume'];
  var OVERSHOOT = ['protein', 'fat', 'carbs', 'volume', 'kcal'];
  var OVERSHOOT_WEIGHT = { protein: 1, fat: 1, carbs: 1, volume: 0.25, kcal: 1.5 };

  // Below this, a grid's spread is noise and is not stretched to full colour.
  var MIN_SPREAD = { balance: 0.02, empty: 0.05 };

  function ratio(x, t) { return t > 0 ? x / t : 0; }
  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }

  // How much of each balance dimension is still missing, 0 (met) to 1 (untouched).
  function needs(totals, target) {
    var n = {};
    BALANCE.forEach(function (d) { n[d] = clamp01(1 - ratio(totals[d], target[d])); });
    return n;
  }

  function mean(obj, keys) {
    return keys.reduce(function (s, k) { return s + obj[k]; }, 0) / keys.length;
  }

  // Overshoot this addition is responsible for, per dimension, as a fraction of target.
  function addedOvershoot(totals, added, target) {
    var o = {};
    OVERSHOOT.forEach(function (d) {
      var before = Math.max(0, ratio(totals[d], target[d]) - 1);
      var after = Math.max(0, ratio(totals[d] + added[d], target[d]) - 1);
      o[d] = after - before;
    });
    return o;
  }

  // Raw score of adding `added` (an amount) to `totals`. Larger is a better fit.
  function scoreOne(totals, added, target, regime) {
    var need = needs(totals, target);
    var share = {};
    BALANCE.forEach(function (d) { share[d] = ratio(added[d], target[d]); });

    var balance;
    if (regime === 'empty') {
      // Nothing chosen yet: reward a food for covering the dimensions evenly on its own.
      var dot = 0, sn = 0;
      BALANCE.forEach(function (d) { dot += share[d]; sn += share[d] * share[d]; });
      balance = sn > 0 ? dot / (Math.sqrt(sn) * Math.sqrt(BALANCE.length)) : 0;
    } else {
      // Reward what the plate is missing more of than average; penalise what it is ahead on.
      var m = mean(need, BALANCE);
      balance = BALANCE.reduce(function (s, d) { return s + share[d] * (need[d] - m); }, 0);
    }

    var over = addedOvershoot(totals, added, target);
    var penalty = OVERSHOOT.reduce(function (s, d) { return s + OVERSHOOT_WEIGHT[d] * over[d]; }, 0);

    return { raw: balance - penalty, balance: balance, penalty: penalty, share: share, need: need, over: over };
  }

  // Scores every food at its default portion and normalises the grid to [-1, 1].
  // `items` is the plate, [{ food, ml }]. Returns a map from food id to its result.
  function rank(foods, items, target) {
    var totals = NM.Nutrition.totals(items);
    var regime = totals.volume > 0 ? 'balance' : 'empty';
    var results = {};
    foods.forEach(function (f) {
      results[f.id] = scoreOne(totals, NM.Nutrition.amount(f, f.defaultMl), target, regime);
    });

    // The empty regime's raw score is always positive, so it is centred on the grid.
    var ids = Object.keys(results);
    var centre = 0;
    if (regime === 'empty' && ids.length) {
      centre = ids.reduce(function (s, id) { return s + results[id].raw; }, 0) / ids.length;
    }
    // Each side is scaled by its own extreme, so the best fit is full green and the worst full red.
    var up = MIN_SPREAD[regime], down = MIN_SPREAD[regime];
    ids.forEach(function (id) {
      var c = results[id].raw - centre;
      if (c > up) up = c;
      if (-c > down) down = -c;
    });
    ids.forEach(function (id) {
      var r = results[id], c = r.raw - centre;
      r.norm = c >= 0 ? Math.min(1, c / up) : Math.max(-1, c / down);
      r.regime = regime;
    });
    return { results: results, totals: totals, regime: regime, need: needs(totals, target) };
  }

  // Balance dimensions ordered from most to least missing.
  function mostMissing(totals, target) {
    var n = needs(totals, target);
    return BALANCE.slice().sort(function (a, b) { return n[b] - n[a]; }).map(function (d) {
      return { dim: d, need: n[d] };
    });
  }

  NM.Fit = { BALANCE: BALANCE, OVERSHOOT_WEIGHT: OVERSHOOT_WEIGHT, needs: needs, scoreOne: scoreOne, rank: rank, mostMissing: mostMissing };
})(window.NM = window.NM || {});
