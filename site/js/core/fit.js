// Scores how well one more portion of a food fits the day's meals against the daily target.
// The rule, its two regimes and its weights are docs/subsystems/fit-scoring.md;
// this file implements that doc and argues nothing it does not.
(function (NM) {
  'use strict';

  // Dimensions the plate is balanced across. kcal is a budget, not a dimension.
  var BALANCE = ['protein', 'fat', 'carbs', 'volume'];
  var OVERSHOOT = ['protein', 'fat', 'carbs', 'volume', 'kcal'];
  var OVERSHOOT_WEIGHT = { protein: 1, fat: 1, carbs: 1, volume: 0.25, kcal: 1.5 };

  // Raw score at which a tile reaches full green or full red. Fixed, so a colour is
  // measured against the target and never against the other tiles.
  var FULL_GOOD = 0.1, FULL_BAD = 0.3;

  // The evenness of a food that covers one dimension only: 1/sqrt(4).
  var ONE_DIMENSION = 1 / Math.sqrt(BALANCE.length);

  // The five bands a tile's colour is drawn from, best first. A `norm` falls in the
  // first band whose `min` it reaches.
  var TIERS = [
    { id: 'recommended', min: 0.6 },
    { id: 'alright', min: 0.2 },
    { id: 'may', min: -0.2 },
    { id: 'doubtful', min: -0.6 },
    { id: 'against', min: -Infinity }
  ];

  function tier(norm) {
    for (var i = 0; i < TIERS.length; i++) if (norm >= TIERS[i].min) return TIERS[i].id;
    return TIERS[TIERS.length - 1].id;
  }

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

  // One meal's share of the daily target: the target split evenly across `meals`.
  function mealShare(target, meals) {
    var s = {};
    Object.keys(target).forEach(function (k) { s[k] = target[k] / meals; });
    return s;
  }

  // Overshoot this addition is responsible for, per dimension, as a fraction of one meal's share.
  function addedOvershoot(totals, added, target, meals) {
    var o = {};
    OVERSHOOT.forEach(function (d) {
      var before = Math.max(0, ratio(totals[d], target[d]) - 1);
      var after = Math.max(0, ratio(totals[d] + added[d], target[d]) - 1);
      o[d] = (after - before) * meals;
    });
    return o;
  }

  // Raw score of adding `added` (an amount) to `totals`, the day so far. `need` is measured
  // against the daily target, `share` and overshoot against one meal's share of it.
  function scoreOne(totals, added, target, regime, meals) {
    meals = meals || 1;
    var need = needs(totals, target);
    var share = {};
    BALANCE.forEach(function (d) { share[d] = ratio(added[d], target[d]) * meals; });

    var balance;
    if (regime === 'empty') {
      // Nothing chosen yet: reward a food for covering the dimensions evenly on its own,
      // from 0 for one dimension to FULL_GOOD for all four equally.
      var dot = 0, sn = 0;
      BALANCE.forEach(function (d) { dot += share[d]; sn += share[d] * share[d]; });
      var even = sn > 0 ? dot / (Math.sqrt(sn) * Math.sqrt(BALANCE.length)) : ONE_DIMENSION;
      balance = (even - ONE_DIMENSION) / (1 - ONE_DIMENSION) * FULL_GOOD;
    } else {
      // Reward what the plate is missing more of than average; penalise what it is ahead on.
      var m = mean(need, BALANCE);
      balance = BALANCE.reduce(function (s, d) { return s + share[d] * (need[d] - m); }, 0);
    }

    var over = addedOvershoot(totals, added, target, meals);
    var penalty = OVERSHOOT.reduce(function (s, d) { return s + OVERSHOOT_WEIGHT[d] * over[d]; }, 0);

    return { raw: balance - penalty, balance: balance, penalty: penalty, share: share, need: need, over: over };
  }

  // Scores every food at its default portion and maps each raw score to [-1, 1] on the
  // fixed scale. `items` is every meal of the day, [{ food, ml }]; `target` is daily, split
  // across `meals` (1 if omitted). Returns a map from food id to its result.
  function rank(foods, items, target, meals) {
    var totals = NM.Nutrition.totals(items);
    var regime = totals.volume > 0 ? 'balance' : 'empty';
    var results = {};
    foods.forEach(function (f) {
      var r = scoreOne(totals, NM.Nutrition.amount(f, f.defaultMl), target, regime, meals);
      r.norm = r.raw >= 0 ? Math.min(1, r.raw / FULL_GOOD) : Math.max(-1, r.raw / FULL_BAD);
      r.tier = tier(r.norm);
      r.regime = regime;
      results[f.id] = r;
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

  // One dimension's part of a raw score: its balance term less the overshoot it adds.
  function parts(r) {
    var m = mean(r.need, BALANCE), out = {};
    OVERSHOOT.forEach(function (d) {
      var bal = BALANCE.indexOf(d) >= 0 ? r.share[d] * (r.need[d] - m) : 0;
      out[d] = { bal: bal, over: OVERSHOOT_WEIGHT[d] * r.over[d] };
    });
    return out;
  }

  // Which foods changed band between two `rank` results, and the dimension that moved
  // each most. Returns a map from food id to { dir: 'up'|'down', dim, kind: 'balance'|'over' }.
  // A change into or out of the empty regime is a different measure, and reports nothing.
  function compare(before, after) {
    var out = {};
    if (!before || before.regime !== 'balance' || after.regime !== 'balance') return out;
    var order = TIERS.map(function (t) { return t.id; });
    Object.keys(after.results).forEach(function (id) {
      var a = after.results[id], b = before.results[id];
      if (!b || a.tier === b.tier) return;
      var dir = order.indexOf(a.tier) < order.indexOf(b.tier) ? 'up' : 'down';
      var pa = parts(a), pb = parts(b), best = null;
      OVERSHOOT.forEach(function (d) {
        var dBal = pa[d].bal - pb[d].bal, dOver = pa[d].over - pb[d].over, delta = dBal - dOver;
        var score = dir === 'up' ? delta : -delta;
        if (!best || score > best.score) {
          best = { score: score, dim: d, kind: Math.abs(dOver) > Math.abs(dBal) ? 'over' : 'balance' };
        }
      });
      out[id] = { dir: dir, dim: best.dim, kind: best.kind };
    });
    return out;
  }

  NM.Fit = {
    BALANCE: BALANCE, OVERSHOOT_WEIGHT: OVERSHOOT_WEIGHT, TIERS: TIERS, tier: tier, needs: needs, mealShare: mealShare,
    scoreOne: scoreOne, rank: rank, mostMissing: mostMissing, compare: compare
  };
})(window.NM = window.NM || {});
