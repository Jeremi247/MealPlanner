// Per-browser persistence of the target, the plate and view preferences.
// Storage can be absent or throw (private window, file:// policy); every call
// falls back to the defaults and the app runs without it.
(function (NM) {
  'use strict';

  var KEY = 'nutrientmanager.v1';

  var DEFAULTS = {
    target: { kcal: 600, protein: 45, fat: 20, carbs: 55, volume: 750 },
    plate: [],            // [{ id, ml }]
    view: { sort: 'table', query: '', showReference: true }
  };

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function load() {
    var state = clone(DEFAULTS);
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return state;
      var saved = JSON.parse(raw);
      Object.keys(state.target).forEach(function (k) {
        if (saved.target && typeof saved.target[k] === 'number' && saved.target[k] >= 0) state.target[k] = saved.target[k];
      });
      if (Array.isArray(saved.plate)) {
        var seen = {};
        state.plate = saved.plate.filter(function (p) {
          var ok = p && typeof p.id === 'string' && !seen[p.id] && typeof p.ml === 'number' && isFinite(p.ml) && p.ml > 0;
          if (ok) seen[p.id] = true;
          return ok;
        });
      }
      if (saved.view) Object.keys(state.view).forEach(function (k) {
        if (typeof saved.view[k] === typeof state.view[k]) state.view[k] = saved.view[k];
      });
    } catch (e) { /* fall through to defaults */ }
    return state;
  }

  function save(state) {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* not persisted */ }
  }

  NM.Store = { DEFAULTS: DEFAULTS, load: load, save: save };
})(window.NM = window.NM || {});
