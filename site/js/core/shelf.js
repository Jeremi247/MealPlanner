// The shelf of premade meals, as data: what a stored shelf may hold, its rows, and a premade
// meal put into a meal of the day. Where it is kept is site/js/server-store.js, and why on the
// server is docs/decisions/0023-the-shelf-is-kept-on-the-server.md.
(function (NM) {
  'use strict';

  // The longest name and row the server takes (Server/shelf.py), in characters as Python counts
  // them: an emoji is one, where a JS string's length counts it as two.
  var NAME_MAX = 60, ROW_MAX = 40;

  function text(v, max) {
    if (typeof v !== 'string') return '';
    v = v.split(/\s+/).filter(Boolean).join(' ');
    return Array.from(v).length <= max ? v : '';
  }

  // The well-formed meals of a stored shelf, [{ id, name, row, items [{ id, ml }], portions, missing }],
  // in the shelf's order. A meal stored without a count of portions makes 1. A food not known, gone from the table or a food of your own removed or not
  // yet loaded, is left out of `items` and counted in `missing`; a meal left with no food at all
  // is kept while it holds one, so it can still be removed. `byId` maps a food id to its record.
  function clean(doc, byId) {
    var meals = doc && Array.isArray(doc.meals) ? doc.meals : [];
    var out = [];
    meals.forEach(function (m) {
      if (!m || typeof m.id !== 'string' || !Array.isArray(m.items)) return;
      var name = text(m.name, NAME_MAX), row = text(m.row, ROW_MAX);
      if (!name || !row) return;
      var seen = {}, missing = 0;
      var items = m.items.filter(function (it) {
        var ok = it && typeof it.id === 'string' && !seen[it.id] &&
          typeof it.ml === 'number' && isFinite(it.ml) && it.ml > 0;
        if (!ok) return false;
        seen[it.id] = true;
        if (!byId[it.id]) missing++;
        return !!byId[it.id];
      }).map(function (it) { return { id: it.id, ml: it.ml }; });
      if (items.length || missing) out.push({ id: m.id, name: name, row: row, items: items, portions: NM.Nutrition.portions(m.portions), missing: missing });
    });
    return out;
  }

  // The shelf's rows, [{ name, meals }]: a row for every name in use, in the order its first meal
  // comes, its meals in the shelf's order. Server/shelf.py keeps that order by hand.
  function rows(meals) {
    var out = [], at = Object.create(null);
    meals.forEach(function (m) {
      if (!(m.row in at)) { at[m.row] = out.length; out.push({ name: m.row, meals: [] }); }
      out[at[m.row]].meals.push(m);
    });
    return out;
  }

  function flat(rs) { return [].concat.apply([], rs.map(function (r) { return r.meals; })); }

  // The meals with meal `id` moved into `row`: before the meal `before`, which must be in that
  // row, or after the row's last meal, or starting the row at the end when no meal is in it. As
  // Server/shelf.py's `place` does it, so the shelf can show it before the server answers. Null
  // when `id` or `before` is not on the shelf, or `before` is in another row.
  function place(meals, id, row, before) {
    var m = meals.find(function (x) { return x.id === id; });
    var rest = meals.filter(function (x) { return x !== m; });
    var at = rest.findIndex(function (x) { return x.id === before; });
    if (!m || (before && (at < 0 || rest[at].row !== row))) return null;
    if (!before) {
      at = rest.length;
      rest.forEach(function (x, i) { if (x.row === row) at = i + 1; });
    }
    rest.splice(at, 0, Object.assign({}, m, { row: row }));
    return flat(rows(rest));
  }

  // The meals with every meal in `row` moved, together, before the row `before`, or to the end
  // when `before` is null; as Server/shelf.py's `placeRow` does it. Null when either row is not on
  // the shelf.
  function placeRow(meals, row, before) {
    var rs = rows(meals);
    var names = rs.map(function (r) { return r.name; });
    var from = names.indexOf(row);
    if (from < 0 || (before && (before === row || names.indexOf(before) < 0))) return null;
    var moving = rs.splice(from, 1)[0];
    rs.splice(before ? names.filter(function (n) { return n !== row; }).indexOf(before) : rs.length, 0, moving);
    return flat(rs);
  }

  // Every row name in use, in shelf order.
  function rowNames(meals) { return rows(meals).map(function (r) { return r.name; }); }

  // A meal of the day's rows, [{ id, ml }], with a premade meal's foods added on top: a food already
  // in it gets the premade amount added to its own, and the rest follow in the premade meal's order.
  // The whole recipe goes in, whatever portions either makes
  // (docs/decisions/0027-a-meal-says-how-many-portions-it-makes.md).
  function into(meal, items) {
    var out = meal.map(function (p) { return { id: p.id, ml: p.ml }; });
    items.forEach(function (it) {
      var cur = out.find(function (p) { return p.id === it.id; });
      if (cur) cur.ml += it.ml;
      else out.push({ id: it.id, ml: it.ml });
    });
    return out;
  }

  // What one portion of a meal of the day gains from a premade meal: its rows, making `own`
  // portions. Into puts the whole recipe in a meal making `into` portions, so its rows over `into`;
  // with no meal to put it into (`into` null), one of its own portions, as New meal gives.
  function gained(rows, own, into) { return NM.Nutrition.perPortion(rows, into === null ? own : into); }

  // The shelf's meals with meal `id` making `n` portions, as Server/shelf.py's `portions` does it.
  function withPortions(meals, id, n) {
    return meals.map(function (m) { return m.id === id ? Object.assign({}, m, { portions: n }) : m; });
  }

  // Whether a premade meal matches a search: its name, its row or one of its foods' names.
  function matches(meal, query, byId) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return true;
    var words = [meal.name, meal.row].concat(meal.items.map(function (it) { return byId[it.id].name; }));
    return words.some(function (w) { return w.toLowerCase().indexOf(q) >= 0; });
  }

  NM.Shelf = { NAME_MAX: NAME_MAX, ROW_MAX: ROW_MAX, clean: clean, rows: rows, rowNames: rowNames, place: place, placeRow: placeRow, into: into, gained: gained, withPortions: withPortions, matches: matches };
})(window.NM = window.NM || {});
