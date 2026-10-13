// Per-browser persistence of the daily target, the day's meals and view preferences.
// Storage can be absent or throw (private window, file:// policy); every call
// falls back to the defaults and the app runs without it.
(function (NM) {
  'use strict';

  var KEY = 'nutrientmanager.v2';
  // The single-plate state from before the day of meals. Only its plate is carried over, into
  // the first meal; its target was per meal and would be wrong as a daily one.
  var OLD_KEY = 'nutrientmanager.v1';

  // A meal of the day: its rows, the whole recipe, and how many portions they make
  // (docs/decisions/0027-a-meal-says-how-many-portions-it-makes.md).
  function meal(items, portions) { return { items: items || [], portions: portions || 1 }; }

  var DEFAULTS = {
    target: { kcal: 1800, protein: 135, fat: 60, carbs: 165, volume: 2250 },  // per day
    meals: [meal(), meal(), meal()],  // each { items [{ id, ml }], portions }
    selected: 0,          // a meal's index, or 'day'
    view: { sort: 'table', query: '', colours: 'day', icons: 'emoji' }  // colours: 'day' or 'selection'; icons: an NM.Icons style
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // One meal's rows: well-formed entries only, the first of each food.
  function plate(saved) {
    if (!Array.isArray(saved)) return [];
    var seen = {};
    return saved.filter(function (p) {
      var ok = p && typeof p.id === 'string' && !seen[p.id] && typeof p.ml === 'number' && isFinite(p.ml) && p.ml > 0;
      if (ok) seen[p.id] = true;
      return ok;
    });
  }

  // A saved meal; one saved as a bare list of rows, from before meals made portions, makes 1.
  function savedMeal(saved) {
    if (Array.isArray(saved)) return meal(plate(saved));
    return saved && typeof saved === 'object' ? meal(plate(saved.items), NM.Nutrition.portions(saved.portions)) : meal();
  }

  function load() {
    var state = clone(DEFAULTS);
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) {
        var old = JSON.parse(window.localStorage.getItem(OLD_KEY));
        if (old) state.meals[0] = meal(plate(old.plate));
        return state;
      }
      var saved = JSON.parse(raw);
      Object.keys(state.target).forEach(function (k) {
        if (saved.target && typeof saved.target[k] === 'number' && saved.target[k] >= 0) state.target[k] = saved.target[k];
      });
      if (Array.isArray(saved.meals) && saved.meals.length) state.meals = saved.meals.map(savedMeal);
      var sel = saved.selected;
      if (sel === 'day' || (typeof sel === 'number' && sel >= 0 && sel < state.meals.length && sel % 1 === 0)) state.selected = sel;
      if (saved.view) Object.keys(state.view).forEach(function (k) {
        if (typeof saved.view[k] === typeof state.view[k]) state.view[k] = saved.view[k];
      });
      if (state.view.colours !== 'selection') state.view.colours = 'day';
      if (state.view.icons !== 'minimal') state.view.icons = 'emoji';
    } catch (e) { /* fall through to defaults */ }
    return state;
  }

  function save(state) {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not persisted */ }
  }

  NM.Store = { DEFAULTS: DEFAULTS, meal: meal, load: load, save: save };
})(window.NM = window.NM || {});
