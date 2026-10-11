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

  // Tile clicks whose effect may still be playing, oldest first: { id, kind, at }. A render
  // hands each tile its own with their ages, so the effects carry on across renders (NM.Fx).
  var effects = [];
  function played(id, kind) { effects.push({ id: id, kind: kind, at: performance.now() }); }

  // The meal removed since the last render, so the sidebar matches each card with its own meal.
  var removed = null;

  // The shelf of premade meals, as the server last gave it or this browser last saw it. `online`
  // is whether the server answered the latest request; `at` is when a cached copy was seen;
  // `error` is the last change it refused. Whether it is open, and its search, are not saved.
  var cachedShelf = NM.ShelfStore.cached();
  var shelf = { meals: cachedShelf ? cachedShelf.doc.meals : [], online: false, loading: true, at: cachedShelf ? cachedShelf.at : null, error: null };
  var shelfOpen = false, shelfQuery = '';

  function shelfAnswer(err, doc, answered) {
    shelf.loading = false;
    if (err) {
      if (!answered) shelf.online = false;
      shelf.error = answered ? err : null;
    } else {
      shelf.meals = doc.meals;
      shelf.online = true;
      shelf.at = Date.now();
      shelf.error = null;
    }
    update();
  }

  // A fetch that fails for any reason, a server without the shelf included, leaves the shelf offline.
  function refreshShelf() {
    NM.ShelfStore.load(function (err, doc) {
      if (!err) { shelfAnswer(null, doc); return; }
      shelf.loading = false;
      shelf.online = false;
      update();
    });
  }

  // Sends one change. `local`, if given, is the shelf's meals as the change leaves them, shown
  // until the server answers; a change it refuses or never gets puts the shelf back.
  function changeShelf(op, local) {
    if (!shelf.online) return;
    var was = shelf.meals;
    if (local) { shelf.meals = local; update(); }
    NM.ShelfStore.send(op, function (err, doc, answered) {
      if (err && local && shelf.meals === local) shelf.meals = was;
      shelfAnswer(err, doc, answered);
    });
  }

  function placeMeal(m, row, before) {
    var local = NM.Shelf.place(shelf.meals, m.id, row, before);
    if (local) changeShelf({ op: 'place', id: m.id, row: row, before: before }, local);
  }

  function rowNames() { return NM.Shelf.rowNames(NM.Shelf.clean({ meals: shelf.meals }, byId)); }

  function openShelf(open) {
    if (shelfOpen === open) return;
    shelfOpen = open;
    NM.Confirm.close(false);
    if (open) refreshShelf();
    update();
    // After the render, so the panel is visible when it takes focus.
    setTimeout(function () { (open ? shelfPanel : shelfTab).focus({ preventScroll: true }); }, 0);
  }

  function shelve(anchor) {
    var meal = typeof state.selected === 'number' ? state.meals[state.selected] : null;
    if (!meal || !meal.length) return;
    var rows = rowNames();
    NM.Confirm.prompt(anchor, 'Shelve ' + mealName(state.selected), [
      { key: 'name', label: 'Name', value: '', max: NM.Shelf.NAME_MAX },
      { key: 'row', label: 'Row', value: rows[0] || '', max: NM.Shelf.ROW_MAX, choices: rows }
    ], 'Shelve', function (v) {
      changeShelf({ op: 'add', name: v.name, row: v.row, items: meal.map(function (p) { return { id: p.id, ml: p.ml }; }) });
    });
  }

  var shelfActions = {
    onInto: function (m) {
      if (typeof state.selected !== 'number') return;
      state.meals[state.selected] = NM.Shelf.into(state.meals[state.selected], m.items);
      update();
    },
    onNewMeal: function (m) { state.meals.push(NM.Shelf.into([], m.items)); select(state.meals.length - 1); },
    onRename: function (m, anchor) {
      NM.Confirm.prompt(anchor, 'Rename “' + m.name + '”', [{ key: 'name', label: 'Name', value: m.name, max: NM.Shelf.NAME_MAX }],
        'Rename', function (v) { changeShelf({ op: 'rename', id: m.id, name: v.name }); });
    },
    onCopy: function (m) { changeShelf({ op: 'copy', id: m.id }); },
    onPlace: placeMeal,
    onPlaceRow: function (row, before) {
      var local = NM.Shelf.placeRow(shelf.meals, row, before);
      if (local) changeShelf({ op: 'placeRow', row: row, before: before }, local);
    },
    onNewRow: function (m, anchor) {
      NM.Confirm.prompt(anchor, 'Start a new row with “' + m.name + '”', [{ key: 'row', label: 'Row', value: '', max: NM.Shelf.ROW_MAX }],
        'Move', function (v) { placeMeal(m, v.row, null); });
    },
    onRemove: function (m, anchor) {
      NM.Confirm.ask(anchor, 'Remove “' + m.name + '” from the shelf?', 'Remove', function () { changeShelf({ op: 'remove', id: m.id }); });
    },
    onRenameRow: function (row, anchor) {
      NM.Confirm.prompt(anchor, 'Rename the row “' + row + '”', [{ key: 'to', label: 'Row', value: row, max: NM.Shelf.ROW_MAX }],
        'Rename', function (v) { if (v.to !== row) changeShelf({ op: 'renameRow', from: row, to: v.to }); });
    }
  };

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
    if (state.selected === 'day') { played(food.id, 'refused'); update(); return; }
    played(food.id, 'add');
    var cur = state.meals[state.selected].find(function (p) { return p.id === food.id; });
    setMl(food, (cur ? cur.ml : 0) + food.defaultMl);
  }

  function select(which) {
    if (state.selected === which) return;
    state.selected = which; update();
  }

  function addMeal() { state.meals.push([]); select(state.meals.length - 1); }

  // Each asks first, beside `anchor`, the button that was clicked (NM.Confirm).
  function clearMeal(i, anchor) {
    NM.Confirm.ask(anchor, 'Clear ' + mealName(i) + '?', 'Clear', function () {
      state.meals[i] = [];
      update();
    });
  }

  function clearAll(anchor) {
    NM.Confirm.ask(anchor, 'Clear every meal of the day?', 'Clear all', function () {
      state.meals = state.meals.map(function () { return []; });
      update();
    });
  }

  // An empty meal goes without asking.
  function removeMeal(i, anchor) {
    if (state.meals.length <= 1) return;
    function remove() {
      state.meals.splice(i, 1);
      removed = i;
      if (typeof state.selected === 'number' && state.selected >= i) state.selected = Math.max(0, state.selected - 1);
      update();
    }
    if (!state.meals[i].length) remove();
    else NM.Confirm.ask(anchor, 'Remove ' + mealName(i) + ' and everything on it?', 'Remove', remove);
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
    var playing = {}, refused = null;
    effects.forEach(function (e) {
      (playing[e.id] = playing[e.id] || []).push({ kind: e.kind, age: now - e.at });
      if (e.kind === 'refused') refused = now - e.at;
    });

    NM.Grid.render(gridRoot, {
      categories: NM.categories, foods: foods, ranked: ranked, changes: NM.Fit.compare(before, ranked),
      inScope: inScope, scopeLabel: state.selected === 'day' ? 'today' : 'in ' + mealName(state.selected),
      addTo: state.selected === 'day' ? null : mealName(state.selected), subject: subject,
      effects: playing, view: state.view, onAdd: addPortion
    });
    NM.Plate.render(plateRoot, {
      target: state.target, meals: meals, dayTotals: NM.Nutrition.totals(day), selected: state.selected, refused: refused,
      icons: state.view.icons,
      onTarget: function (k, v) { state.target[k] = v; update(); },
      onSelect: select,
      onSet: setMl,
      onClear: clearMeal,
      onClearAll: clearAll,
      onAddMeal: addMeal,
      onRemoveMeal: removeMeal,
      removed: removed
    });
    removed = null;
    renderShelf(meals, day, byMeal, subject);
    document.getElementById('regime').textContent = (ranked.regime === 'empty'
      ? (byMeal ? subject + ' is empty' : 'Nothing eaten yet') + ': tiles show how balanced each food is on its own.'
      : 'Tiles show how one more portion would balance ' + (byMeal ? subject + ', against its share of the day.' : 'the whole day.'))
      + (state.selected === 'day' ? ' Select a meal to add foods.' : '');
    coloursDay.setAttribute('aria-pressed', state.view.colours === 'day' ? 'true' : 'false');
    coloursSel.setAttribute('aria-pressed', state.view.colours === 'selection' ? 'true' : 'false');
    iconsEmoji.setAttribute('aria-pressed', state.view.icons === 'emoji' ? 'true' : 'false');
    iconsMinimal.setAttribute('aria-pressed', state.view.icons === 'minimal' ? 'true' : 'false');

    // Escaped: a row's name is in its key, and may hold a quote.
    var back = focusKey && document.querySelector('[data-focus="' + CSS.escape(focusKey) + '"]');
    if (back) back.focus({ preventScroll: true });
  }

  // The shelf's cards are coloured as the tiles are: against the day, or the selected meal and its share.
  // They are built only while the shelf is open; opening it renders.
  function renderShelfBody(meals, day, byMeal, into) {
    var share = NM.Fit.mealShare(state.target, meals.length);
    var all = NM.Shelf.clean({ meals: shelf.meals }, byId);
    var shown = all.filter(function (m) { return NM.Shelf.matches(m, shelfQuery, byId); });
    var rows = NM.Shelf.rows(shown).map(function (r) {
      return {
        name: r.name,
        entries: r.meals.map(function (m) {
          var its = items(m.items);
          var totals = NM.Nutrition.totals(its);
          var fit = byMeal
            ? NM.Fit.scoreMeal(meals[state.selected].items, totals, share)
            : NM.Fit.scoreMeal(day, totals, state.target, meals.length);
          return { meal: m, items: its, totals: totals, fit: fit };
        })
      };
    });
    var note = '';
    if (shelf.error) note = 'Not saved: ' + shelf.error + '.';
    else if (!shelf.online && shelf.loading) note = 'Fetching the shelf…';
    else if (!shelf.online && location.protocol === 'file:') {
      note = 'This page was opened as a file, so it has no shelf. Run Serve.bat, which opens it at http://127.0.0.1:8737/.';
    } else if (!shelf.online) {
      note = 'The shelf cannot be reached' + (shelf.at
        ? '. This is the copy this browser saw on ' + new Date(shelf.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + ', and it cannot be changed until the shelf is back.'
        : ', and this browser has no copy of it yet.');
    }
    NM.ShelfView.render(shelfBody, {
      rows: rows, total: all.length, query: shelfQuery, online: shelf.online, note: note, into: into,
      share: share, icons: state.view.icons,
      onInto: shelfActions.onInto, onNewMeal: shelfActions.onNewMeal, onRename: shelfActions.onRename, onCopy: shelfActions.onCopy,
      onRemove: shelfActions.onRemove, onRenameRow: shelfActions.onRenameRow,
      onPlace: shelfActions.onPlace, onPlaceRow: shelfActions.onPlaceRow, onNewRow: shelfActions.onNewRow
    });
  }

  function renderShelf(meals, day, byMeal, subject) {
    var into = typeof state.selected === 'number' ? mealName(state.selected) : null;
    if (shelfOpen) renderShelfBody(meals, day, byMeal, into);
    document.body.classList.toggle('shelf-open', shelfOpen);
    shelfTab.setAttribute('aria-expanded', shelfOpen ? 'true' : 'false');
    shelfTab.setAttribute('aria-label', shelfOpen ? 'Close the shelf' : 'Open the shelf of premade meals');
    shelfTab.textContent = shelfOpen ? '»' : '«';
    shelfSub.textContent = 'Premade meals, coloured by how each would balance ' +
      (byMeal ? subject + ', against its share of the day.' : 'the whole day.');
    var selectedMeal = typeof state.selected === 'number' ? state.meals[state.selected] : null;
    shelfSave.textContent = '+ Shelve ' + (into || 'a meal');
    shelfSave.disabled = !shelf.online || !selectedMeal || !selectedMeal.length;
    shelfSave.title = !shelf.online ? 'The shelf cannot be reached'
      : !selectedMeal ? 'Select a meal to shelve it'
      : !selectedMeal.length ? into + ' is empty' : 'Put ' + into + ' on the shelf';
  }

  var shelfTab = document.getElementById('shelf-tab');
  var shelfPanel = document.getElementById('shelf');
  var shelfBody = document.getElementById('shelf-body');
  var shelfSub = document.getElementById('shelf-sub');
  var shelfSave = document.getElementById('shelf-save');
  var shelfSearch = document.getElementById('shelf-search');
  shelfTab.addEventListener('click', function () { openShelf(!shelfOpen); });
  document.getElementById('shelf-close').addEventListener('click', function () { openShelf(false); });
  document.getElementById('shelf-dim').addEventListener('click', function () { openShelf(false); });
  // A box dropped from a shelf button takes its own Escape first, and marks it handled.
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && shelfOpen && !e.defaultPrevented) openShelf(false); });
  shelfSearch.addEventListener('input', function () { shelfQuery = shelfSearch.value; update(); });
  shelfSave.addEventListener('click', function () { shelve(shelfSave); });
  refreshShelf();

  var search = document.getElementById('search');
  var sort = document.getElementById('sort');
  var coloursDay = document.getElementById('colours-day');
  var coloursSel = document.getElementById('colours-selection');
  var iconsEmoji = document.getElementById('icons-emoji');
  var iconsMinimal = document.getElementById('icons-minimal');
  search.value = state.view.query;
  sort.value = state.view.sort;
  search.addEventListener('input', function () { state.view.query = search.value; update(); });
  sort.addEventListener('change', function () { state.view.sort = sort.value; update(); });
  coloursDay.addEventListener('click', function () { state.view.colours = 'day'; update(); });
  coloursSel.addEventListener('click', function () { state.view.colours = 'selection'; update(); });
  iconsEmoji.addEventListener('click', function () { state.view.icons = 'emoji'; update(); });
  iconsMinimal.addEventListener('click', function () { state.view.icons = 'minimal'; update(); });

  update();
})(window.NM = window.NM || {});
