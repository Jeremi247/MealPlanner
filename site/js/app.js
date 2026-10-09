// Holds the state, and re-renders both views from it on every change.
(function (NM) {
  'use strict';

  var foods = NM.Nutrition.normalise(NM.categories);
  var byId = {};
  foods.forEach(function (f) { byId[f.id] = f; });

  var state = NM.Store.load();
  state.plate = state.plate.filter(function (p) { return byId[p.id]; });

  var gridRoot = document.getElementById('grid');
  var plateRoot = document.getElementById('plate');

  function items() {
    return state.plate.map(function (p) { return { food: byId[p.id], ml: p.ml }; });
  }

  function setMl(food, ml) {
    var i = state.plate.findIndex(function (p) { return p.id === food.id; });
    if (ml <= 0) { if (i >= 0) state.plate.splice(i, 1); }
    else if (i >= 0) state.plate[i].ml = ml;
    else state.plate.push({ id: food.id, ml: ml });
    update();
  }

  function addPortion(food) {
    var cur = state.plate.find(function (p) { return p.id === food.id; });
    setMl(food, (cur ? cur.ml : 0) + food.defaultMl);
  }

  // Every change schedules one render for after the current event. Rendering inside a
  // field's change event would replace the field Tab is moving focus away from.
  var pending = false;
  function update() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; render(); }, 0);
  }

  // The ranking from before the latest change to the plate or target, kept until the next
  // one, so a tile that moved band says so however often the view re-renders.
  var lastKey = null, lastRanked = null, before = null;

  // A render replaces every control, so the one that had focus is found again by its
  // `data-focus` key. A control whose row is gone leaves focus where the browser puts it.
  function render() {
    var active = document.activeElement;
    var focusKey = active && active.dataset ? active.dataset.focus : null;
    NM.Store.save(state);
    var its = items();
    var ranked = NM.Fit.rank(foods, its, state.target);
    var key = JSON.stringify([state.plate, state.target]);
    if (key !== lastKey) { before = lastRanked; lastKey = key; }
    lastRanked = ranked;
    var plateMl = {};
    state.plate.forEach(function (p) { plateMl[p.id] = p.ml; });

    NM.Grid.render(gridRoot, {
      categories: NM.categories, foods: foods, ranked: ranked, changes: NM.Fit.compare(before, ranked), plateMl: plateMl,
      view: state.view, onAdd: addPortion
    });
    NM.Plate.render(plateRoot, {
      target: state.target, items: its, totals: ranked.totals,
      onTarget: function (k, v) { state.target[k] = v; update(); },
      onSet: setMl,
      onClear: function () { state.plate = []; update(); }
    });
    document.getElementById('regime').textContent = ranked.regime === 'empty'
      ? 'Plate is empty: tiles show how balanced each food is on its own.'
      : 'Tiles show how one more portion would balance the current plate.';

    var back = focusKey && document.querySelector('[data-focus="' + focusKey + '"]');
    if (back) back.focus();
  }

  var search = document.getElementById('search');
  var sort = document.getElementById('sort');
  var ref = document.getElementById('show-reference');
  search.value = state.view.query;
  sort.value = state.view.sort;
  ref.checked = state.view.showReference;
  search.addEventListener('input', function () { state.view.query = search.value; update(); });
  sort.addEventListener('change', function () { state.view.sort = sort.value; update(); });
  ref.addEventListener('change', function () { state.view.showReference = ref.checked; update(); });

  update();
})(window.NM = window.NM || {});
