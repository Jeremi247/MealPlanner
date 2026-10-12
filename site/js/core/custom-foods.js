// Foods of your own, as data: what a stored one may hold, a form's entry turned into one, and the
// table's categories with them added. They are kept on the server beside the shelf
// (docs/decisions/0026-your-own-foods-are-kept-on-the-server.md), fetched by
// site/js/server-store.js. A stored food is the shape Server/shelf.py keeps:
// { id, name, prep, category, kcal, protein, fat, carbs, grams, icon }, its values per 100 ml,
// or per portion with `portionMl` and `unit` { per, name, step } as a fat row has them.
(function (NM) {
  'use strict';

  // The limits Server/shelf.py holds a food to; a name's length as Python counts it.
  var NAME_MAX = 60, PREP_MAX = 80, UNIT_MAX = 20;
  var VALUE_MAX = 5000;      // kcal, or grams of a macro, per 100 ml or per portion
  var GRAMS_MAX = 20000;     // the weight of 100 ml or of a portion
  var PORTION_ML_MAX = 5000;
  var PER_MAX = 1000;        // units to a portion
  var ID = /^my-[0-9a-f]{12}$/;
  var PICTURE = /^[a-z0-9-]{1,40}$/;
  var MACROS = ['kcal', 'protein', 'fat', 'carbs'];

  function categoryIds() { return NM.categories.map(function (c) { return c.id; }); }

  // Text with its spaces collapsed: '' when there is none, null when it is longer than `max`.
  function text(v, max) {
    if (typeof v !== 'string') return '';
    v = v.split(/\s+/).filter(Boolean).join(' ');
    return Array.from(v).length <= max ? v : null;
  }

  function number(v, min, max) {
    return typeof v === 'number' && isFinite(v) && v >= min && v <= max ? v : null;
  }

  // A spoon is counted in halves, anything else in wholes, as the table's portions are.
  function stepOf(unitName) { return unitName === 'tbsp' || unitName === 'tsp' ? 0.5 : 1; }

  // One stored food checked as Server/shelf.py checks it: the food, or a message saying what is wrong.
  function check(f) {
    if (!f || typeof f !== 'object') return { error: 'a food is malformed' };
    var name = text(f.name, NAME_MAX);
    if (name === null) return { error: 'the name is longer than ' + NAME_MAX + ' characters' };
    if (!name) return { error: 'the name is missing' };
    var prep = f.prep === undefined ? '' : text(f.prep, PREP_MAX);
    if (prep === null) return { error: 'the preparation is longer than ' + PREP_MAX + ' characters' };
    if (categoryIds().indexOf(f.category) < 0) return { error: 'the category is not one of the four' };
    var out = { name: name, prep: prep, category: f.category };
    for (var i = 0; i < MACROS.length; i++) {
      var k = MACROS[i];
      out[k] = number(f[k], 0, VALUE_MAX);
      if (out[k] === null) return { error: (k === 'kcal' ? 'kcal' : k) + ' is not a number from 0 to ' + VALUE_MAX };
    }
    out.grams = number(f.grams, 0, GRAMS_MAX);
    if (!out.grams) return { error: 'the weight is not a number of grams above 0' };
    out.icon = typeof f.icon === 'string' && PICTURE.test(f.icon) ? f.icon : null;
    if (f.unit !== undefined && f.unit !== null) {
      var u = f.unit;
      out.portionMl = number(f.portionMl, 0, PORTION_ML_MAX);
      if (!out.portionMl) return { error: 'a portion’s volume is not a number of ml above 0' };
      var per = u && number(u.per, 0, PER_MAX), unitName = u && text(u.name, UNIT_MAX);
      if (!per) return { error: 'a portion’s count is not a number above 0' };
      if (unitName === null) return { error: 'a portion’s unit is longer than ' + UNIT_MAX + ' characters' };
      if (!unitName) return { error: 'a portion’s unit is missing' };
      if (u.step !== 0.5 && u.step !== 1) return { error: 'a portion’s step is not ½ or 1' };
      out.unit = { per: per, name: unitName, step: u.step };
    }
    return { food: out };
  }

  // The well-formed foods of a stored list, the first of each id, in the stored order.
  function clean(doc) {
    var list = doc && Array.isArray(doc.foods) ? doc.foods : [];
    var seen = {}, out = [];
    list.forEach(function (f) {
      if (!f || typeof f.id !== 'string' || !ID.test(f.id) || seen[f.id]) return;
      var c = check(f);
      if (!c.food) return;
      seen[f.id] = true;
      out.push(Object.assign({ id: f.id }, c.food));
    });
    return out;
  }

  // A stored food as a row of site/js/data/foods.js, for Nutrition.normalise. Its values are your
  // own, so none is marked as an estimate; the tile marks the food as yours instead.
  function toRow(f) {
    var row = {
      id: f.id, name: f.name, prep: f.prep, kcal: f.kcal, protein: f.protein, fat: f.fat, carbs: f.carbs,
      grams: f.grams, icon: f.icon, custom: true, est: []
    };
    if (f.unit) {
      row.portion = f.unit.per + ' ' + f.unit.name;
      row.portionMl = f.portionMl;
      row.unit = f.unit;
    }
    return row;
  }

  // The categories with each stored food added at the end of its own.
  function withCustom(categories, foods) {
    return categories.map(function (cat) {
      var mine = foods.filter(function (f) { return f.category === cat.id; }).map(toRow);
      return mine.length ? Object.assign({}, cat, { foods: cat.foods.concat(mine) }) : cat;
    });
  }

  function round(x) { return Math.round(x * 100) / 100; }

  // A form's entry as a stored food without its id: { food } or { error }. `entry` holds
  // `basis` ('per100ml', 'per100g' or 'perPortion'), name, prep, category, icon, the four values
  // on that basis, `grams` (the weight of 100 ml, or of one portion), and for a portion `portionMl`,
  // `per` and `unitName`. Values per 100 g are turned into per 100 ml by the weight of 100 ml, so
  // what is kept is a volume (docs/architecture/critical-assumptions.md).
  function fromEntry(entry) {
    var f = { name: entry.name, prep: entry.prep, category: entry.category, icon: entry.icon, grams: entry.grams };
    var scale = entry.basis === 'per100g' && entry.grams > 0 ? entry.grams / 100 : 1;
    MACROS.forEach(function (k) { f[k] = typeof entry[k] === 'number' ? round(entry[k] * scale) : entry[k]; });
    if (entry.basis === 'perPortion') {
      f.portionMl = entry.portionMl;
      f.unit = { per: entry.per, name: entry.unitName, step: stepOf(text(entry.unitName, UNIT_MAX)) };
    }
    return check(f);
  }

  // The category the rules suggest for a stored food (NM.Category.suggest).
  function suggest(f) {
    var rec = NM.Nutrition.normalise([{ id: '', foods: [toRow(Object.assign({ id: '' }, f))] }])[0];
    return NM.Category.suggest(rec.perMl);
  }

  NM.CustomFoods = {
    NAME_MAX: NAME_MAX, PREP_MAX: PREP_MAX, UNIT_MAX: UNIT_MAX,
    check: check, clean: clean, toRow: toRow, withCustom: withCustom, fromEntry: fromEntry, suggest: suggest, stepOf: stepOf
  };
})(window.NM = window.NM || {});
