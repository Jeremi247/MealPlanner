// Holds the state, and re-renders both views from it on every change.
(function (NM) {
  'use strict';

  var foods = NM.Nutrition.normalise(NM.categories);
  var byId = {};
  foods.forEach(function (f) { byId[f.id] = f; });

  var state = NM.Store.load();
  state.meals = state.meals.map(function (m) { return m.filter(function (p) { return byId[p.id]; }); });

  var gridRoot = document.getElementById('grid');
  var plateRoot = document.getElementById('plate');

  // The food a tile click tried to add while the day was selected, until the next selection.
  var unplaced = null;

  // Tile clicks whose effect may still be playing, oldest first: { id, kind, at }. A render
  // hands each tile its own with their ages, so the effects carry on across renders (NM.Fx).
  var effects = [];
  function played(id, kind) { effects.push({ id: id, kind: kind, at: performance.now() }); }

  function items(meal) {
    return meal.map(function (p) { return { food: byId[p.id], ml: p.ml }; });
  }

  function mealName(i) { return 'Meal ' + (i + 1); }

  function setMl(food, ml) {
    var meal = state.meals[state.selected];
    if (!meal) return;
    var i = meal.findIndex(function (p) { return p.id === food.id; });
    if (ml <= 0) { if (i >= 0) meal.splice(i, 1); }
    else if (i >= 0) meal[i].ml = ml;
    else meal.push({ id: food.id, ml: ml });
    update();
  }

  function addPortion(food) {
    if (state.selected === 'day') { unplaced = food; played(food.id, 'refused'); update(); return; }
    played(food.id, 'add');
    var cur = state.meals[state.selected].find(function (p) { return p.id === food.id; });
    setMl(food, (cur ? cur.ml : 0) + food.defaultMl);
  }

  // Reselecting the selected card does nothing, so it keeps the day card's hint.
  function select(which) {
    if (state.selected === which) return;
    state.selected = which; unplaced = null; update();
  }

  function addMeal() { state.meals.push([]); select(state.meals.length - 1); }

  function removeMeal(i) {
    if (state.meals.length <= 1) return;
    if (state.meals[i].length && !window.confirm('Remove ' + mealName(i) + ' and everything on it?')) return;
    state.meals.splice(i, 1);
    if (typeof state.selected === 'number' && state.selected >= i) state.selected = Math.max(0, state.selected - 1);
    update();
  }

  // Every change schedules one render for after the current event. Rendering inside a
  // field's change event would replace the field Tab is moving focus away from.
  var pending = false;
  function update() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; render(); }, 0);
  }

  // The ranking from before the latest change to the meals or target, kept until the next
  // one, so a tile that moved band says so however often the view re-renders. A change of
  // what the tiles are scored against is a different measure, and drops it.
  var lastBasis = null, lastKey = null, lastRanked = null, before = null;

  // A render replaces every control, so the one that had focus is found again by its
  // `data-focus` key. A control whose row is gone leaves focus where the browser puts it.
  function render() {
    var active = document.activeElement;
    var focusKey = active && active.dataset ? active.dataset.focus : null;
    NM.Store.save(state);
    var meals = state.meals.map(function (m, i) {
      var its = items(m);
      return { name: mealName(i), items: its, totals: NM.Nutrition.totals(its) };
    });
    var day = [].concat.apply([], meals.map(function (m) { return m.items; }));
    // Selection colours score the selected meal against its share of the day; with the day
    // selected they are the day colours.
    var byMeal = state.view.colours === 'selection' && state.selected !== 'day';
    var ranked = byMeal
      ? NM.Fit.rank(foods, meals[state.selected].items, NM.Fit.mealShare(state.target, meals.length))
      : NM.Fit.rank(foods, day, state.target, meals.length);
    var subject = byMeal ? mealName(state.selected) : 'the day';
    // The number of meals is part of the measure: it sets each meal's share.
    var basis = (byMeal ? 'meal:' + state.selected : 'day') + '/' + meals.length;
    if (basis !== lastBasis) { lastBasis = basis; lastKey = null; lastRanked = null; before = null; }
    var key = JSON.stringify([state.meals, state.target]);
    if (key !== lastKey) { before = lastRanked; lastKey = key; }
    lastRanked = ranked;

    // A tile shows how much of it the selected meal holds, or the whole day when the day is selected.
    var scope = state.selected === 'day' ? day : meals[state.selected].items;
    var inScope = {};
    scope.forEach(function (it) { inScope[it.food.id] = (inScope[it.food.id] || 0) + it.ml; });

    var now = performance.now();
    effects = effects.filter(function (e) { return now - e.at < NM.Fx.LIFETIME_MS; });
    var playing = {};
    effects.forEach(function (e) { (playing[e.id] = playing[e.id] || []).push({ kind: e.kind, age: now - e.at }); });

    NM.Grid.render(gridRoot, {
      categories: NM.categories, foods: foods, ranked: ranked, changes: NM.Fit.compare(before, ranked),
      inScope: inScope, scopeLabel: state.selected === 'day' ? 'today' : 'in ' + mealName(state.selected),
      addTo: state.selected === 'day' ? null : mealName(state.selected), subject: subject,
      effects: playing, view: state.view, onAdd: addPortion
    });
    NM.Plate.render(plateRoot, {
      target: state.target, meals: meals, dayTotals: NM.Nutrition.totals(day), selected: state.selected, unplaced: unplaced,
      icons: state.view.icons,
      onTarget: function (k, v) { state.target[k] = v; update(); },
      onSelect: select,
      onSet: setMl,
      onClear: function () { state.meals[state.selected] = []; update(); },
      onAddMeal: addMeal,
      onRemoveMeal: removeMeal
    });
    document.getElementById('regime').textContent = (ranked.regime === 'empty'
      ? (byMeal ? subject + ' is empty' : 'Nothing eaten yet') + ': tiles show how balanced each food is on its own.'
      : 'Tiles show how one more portion would balance ' + (byMeal ? subject + ', against its share of the day.' : 'the whole day.'))
      + (state.selected === 'day' ? ' Select a meal to add foods.' : '');
    coloursDay.setAttribute('aria-pressed', state.view.colours === 'day' ? 'true' : 'false');
    coloursSel.setAttribute('aria-pressed', state.view.colours === 'selection' ? 'true' : 'false');
    iconsEmoji.setAttribute('aria-pressed', state.view.icons === 'emoji' ? 'true' : 'false');
    iconsMinimal.setAttribute('aria-pressed', state.view.icons === 'minimal' ? 'true' : 'false');

    var back = focusKey && document.querySelector('[data-focus="' + focusKey + '"]');
    if (back) back.focus();
  }

  var search = document.getElementById('search');
  var sort = document.getElementById('sort');
  var ref = document.getElementById('show-reference');
  var coloursDay = document.getElementById('colours-day');
  var coloursSel = document.getElementById('colours-selection');
  var iconsEmoji = document.getElementById('icons-emoji');
  var iconsMinimal = document.getElementById('icons-minimal');
  search.value = state.view.query;
  sort.value = state.view.sort;
  ref.checked = state.view.showReference;
  search.addEventListener('input', function () { state.view.query = search.value; update(); });
  sort.addEventListener('change', function () { state.view.sort = sort.value; update(); });
  ref.addEventListener('change', function () { state.view.showReference = ref.checked; update(); });
  coloursDay.addEventListener('click', function () { state.view.colours = 'day'; update(); });
  coloursSel.addEventListener('click', function () { state.view.colours = 'selection'; update(); });
  iconsEmoji.addEventListener('click', function () { state.view.icons = 'emoji'; update(); });
  iconsMinimal.addEventListener('click', function () { state.view.icons = 'minimal'; update(); });

  update();
})(window.NM = window.NM || {});
