// The box a food of your own is added or edited in. It suggests the food's category from what is
// typed (NM.Category), and a pick of your own overrides it. What a stored food holds is
// site/js/core/custom-foods.js; where it is kept is docs/decisions/0026-your-own-foods-are-kept-on-the-server.md.
(function (NM) {
  'use strict';

  var F = NM.Format;
  var el = F.el;

  var BASES = [['per100ml', 'per 100 ml'], ['per100g', 'per 100 g'], ['perPortion', 'per portion']];
  var VALUES = [['kcal', 'kcal'], ['protein', 'Protein g'], ['fat', 'Fat g'], ['carbs', 'Carbs g']];
  // The picture a new food starts with in each category, until one is picked.
  var PICTURE_FOR = { protein: 'cut-of-meat', volume: 'leafy-green', fat: 'jar', starch: 'potato' };

  var open = null;

  function close() {
    if (!open) return;
    var o = open;
    open = null;
    NM.Confirm.close(false);
    o.dim.remove();
    o.box.remove();
    document.removeEventListener('keydown', o.onKey);
    if (o.opener && o.opener.isConnected) o.opener.focus({ preventScroll: true });
  }

  function numberInput(key, value) {
    var input = el('input');
    input.type = 'number';
    input.min = '0';
    input.step = 'any';
    input.inputMode = 'decimal';
    input.dataset.key = key;
    if (typeof value === 'number') input.value = String(value);
    return input;
  }

  function field(label, input, cls) {
    var l = el('label', 'food-field' + (cls ? ' ' + cls : ''));
    l.appendChild(el('span', null, label));
    l.appendChild(input);
    return l;
  }

  function pressed(buttons, which) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.value === which ? 'true' : 'false'); });
  }

  // Opens the box. `ctx`: { foods (the stored foods of your own), editing (one of them, or null for a
  // new food), online, note (why it cannot be changed, when offline), icons (an NM.Icons style),
  // score(record) (a food's fit as the grid's tiles are scored now), subject (what they are scored
  // against), opener (the button that opened it), onSave(food, id, done), onRemove(food, done) }.
  // `done(error)` is called by the app when the server has answered; an error keeps the box open.
  function show(ctx) {
    close();
    var editing = ctx.editing;
    var dim = el('div', 'food-dim');
    var box = el('div', 'food-form');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', editing ? 'Edit ' + editing.name : 'Add a food of your own');

    var head = el('div', 'food-head');
    head.appendChild(el('h2', 'food-title', editing ? 'Edit “' + editing.name + '”' : 'Add a food'));
    var x = el('button', 'food-close', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', close);
    head.appendChild(x);
    box.appendChild(head);

    // A button per food of your own, drawn again when the list changes while the box is open.
    var mine = el('div', 'food-mine');
    var mineShown = null;
    function drawMine() {
      var key = JSON.stringify(ctx.foods.map(function (f) { return [f.id, f.name]; }));
      if (key === mineShown) return;
      mineShown = key;
      mine.textContent = '';
      mine.hidden = !ctx.foods.length;
      mine.appendChild(el('span', 'food-mine-label', 'Yours'));
      ctx.foods.forEach(function (f) {
        var b = el('button', 'food-chip', f.name); b.type = 'button';
        b.setAttribute('aria-pressed', editing && editing.id === f.id ? 'true' : 'false');
        b.title = 'Edit ' + f.name;
        b.addEventListener('click', function () { show(Object.assign({}, ctx, { editing: f })); });
        mine.appendChild(b);
      });
      if (editing) {
        var fresh = el('button', 'food-chip food-chip-new', '+ New'); fresh.type = 'button';
        fresh.addEventListener('click', function () { show(Object.assign({}, ctx, { editing: null })); });
        mine.appendChild(fresh);
      }
    }
    drawMine();
    box.appendChild(mine);

    // The fields, and beside them the tile the food will have, redrawn as they change.
    var body = el('div', 'food-body');
    var fields = el('div', 'food-fields');
    var side = el('div', 'food-preview');
    side.appendChild(el('span', 'food-preview-label', 'Preview'));
    var previewSlot = el('div', 'food-preview-slot');
    side.appendChild(previewSlot);
    var previewNote = el('p', 'food-hint food-preview-note');
    side.appendChild(previewNote);
    body.appendChild(fields);
    body.appendChild(side);
    box.appendChild(body);

    // What the form holds beyond its inputs.
    var basis = editing && editing.unit ? 'perPortion' : 'per100ml';
    var category = editing ? editing.category : null;
    var picked = !!editing;            // the category is the user's pick, not the suggestion
    var picture = editing ? NM.Icons.nameOf({ id: editing.id, icon: editing.icon }) : null;
    var pictureChosen = !!editing;

    var names = el('div', 'food-row');
    var name = el('input'); name.type = 'text'; name.maxLength = NM.CustomFoods.NAME_MAX; name.autocomplete = 'off';
    name.value = editing ? editing.name : '';
    var prep = el('input'); prep.type = 'text'; prep.maxLength = NM.CustomFoods.PREP_MAX; prep.autocomplete = 'off';
    prep.value = editing ? editing.prep : '';
    prep.placeholder = 'e.g. Cooked, drained';
    names.appendChild(field('Name', name, 'food-field-wide'));
    names.appendChild(field('Preparation', prep, 'food-field-wide'));
    fields.appendChild(names);

    var bases = el('div', 'food-toggle');
    bases.setAttribute('role', 'group');
    bases.setAttribute('aria-label', 'The values are');
    bases.appendChild(el('span', null, 'Values'));
    var basisButtons = BASES.map(function (b) {
      var btn = el('button', 'toggle-btn', b[1]); btn.type = 'button'; btn.dataset.value = b[0];
      btn.addEventListener('click', function () { basis = b[0]; refresh(); });
      bases.appendChild(btn);
      return btn;
    });
    fields.appendChild(bases);

    var portion = el('div', 'food-row food-portion');
    var per = numberInput('per', editing && editing.unit ? editing.unit.per : 1);
    var unitName = el('input'); unitName.type = 'text'; unitName.maxLength = NM.CustomFoods.UNIT_MAX; unitName.autocomplete = 'off';
    unitName.value = editing && editing.unit ? editing.unit.name : '';
    unitName.placeholder = 'tbsp, slice, egg';
    var portionMl = numberInput('portionMl', editing ? editing.portionMl : undefined);
    portion.appendChild(field('A portion is', per));
    portion.appendChild(field('Unit', unitName));
    portion.appendChild(field('It fills, ml', portionMl));
    fields.appendChild(portion);

    var values = el('div', 'food-row');
    var valueInputs = {};
    VALUES.forEach(function (v) {
      valueInputs[v[0]] = numberInput(v[0], editing ? editing[v[0]] : undefined);
      values.appendChild(field(v[1], valueInputs[v[0]], 'food-field-' + v[0]));
    });
    fields.appendChild(values);

    var weighRow = el('div', 'food-row');
    var grams = numberInput('grams', editing ? editing.grams : undefined);
    var gramsField = field('', grams);
    weighRow.appendChild(gramsField);
    var weighNote = el('p', 'food-hint');
    weighRow.appendChild(weighNote);
    fields.appendChild(weighRow);

    var cats = el('div', 'food-toggle food-cats');
    cats.setAttribute('role', 'group');
    cats.setAttribute('aria-label', 'Category');
    cats.appendChild(el('span', null, 'Category'));
    var catButtons = NM.categories.map(function (c) {
      var btn = el('button', 'toggle-btn food-cat food-cat-' + c.id, c.name.split(' ')[0]); btn.type = 'button'; btn.dataset.value = c.id;
      btn.title = c.name;
      btn.addEventListener('click', function () {
        category = c.id;
        picked = !suggestion || suggestion.id !== c.id;
        refresh();
      });
      cats.appendChild(btn);
      return btn;
    });
    fields.appendChild(cats);
    var suggestLine = el('p', 'food-suggest');
    fields.appendChild(suggestLine);
    var useSuggestion = el('button', 'food-link', 'Use the suggestion'); useSuggestion.type = 'button';
    // The link goes with the refresh, so focus moves to the category it chose.
    useSuggestion.addEventListener('click', function () {
      picked = false;
      refresh();
      var chosen = catButtons.find(function (b) { return b.dataset.value === category; });
      if (chosen) chosen.focus({ preventScroll: true });
    });

    var pics = el('div', 'food-pics');
    pics.setAttribute('role', 'group');
    pics.setAttribute('aria-label', 'Picture');
    var picButtons = NM.Icons.NAMES.map(function (n) {
      var btn = el('button', 'food-pic'); btn.type = 'button'; btn.dataset.value = n;
      btn.title = n.replace(/-/g, ' ');
      btn.setAttribute('aria-label', btn.title);
      btn.appendChild(F.icon(NM.Icons.named(n, ctx.icons), 'food-pic-icon'));
      btn.addEventListener('click', function () { picture = n; pictureChosen = true; refresh(); });
      pics.appendChild(btn);
      return btn;
    });
    fields.appendChild(field('Picture', pics, 'food-field-pics'));

    var status = el('p', 'food-status');
    box.appendChild(status);
    var serverError = null;

    var actions = el('div', 'food-actions');
    var remove = null;
    if (editing) {
      remove = el('button', 'confirm-btn confirm-btn-danger food-remove', 'Remove'); remove.type = 'button';
      remove.addEventListener('click', function () {
        NM.Confirm.ask(remove, 'Remove “' + editing.name + '”? Meals holding it will show without it.', 'Remove', function () {
          ctx.onRemove(editing, function (err) { if (err) { serverError = err; refresh(); } else close(); });
        });
      });
      actions.appendChild(remove);
    }
    var cancel = el('button', 'confirm-btn', 'Cancel'); cancel.type = 'button';
    cancel.addEventListener('click', close);
    var save = el('button', 'confirm-btn confirm-btn-go', editing ? 'Save' : 'Add food'); save.type = 'button';
    actions.appendChild(cancel);
    actions.appendChild(save);
    box.appendChild(actions);

    function num(input) { return input.value === '' ? NaN : input.valueAsNumber; }

    function entry(cat) {
      var e = { basis: basis, name: name.value, prep: prep.value, category: cat, icon: picture, grams: num(grams),
        portionMl: num(portionMl), per: num(per), unitName: unitName.value };
      VALUES.forEach(function (v) { e[v[0]] = num(valueInputs[v[0]]); });
      return e;
    }

    // The entry with each blank filled in, so the preview draws a tile before all is typed: a name,
    // 0 for a value, one unit to a portion of 100 ml, and the weight of as much water.
    function draft(cat) {
      var e = entry(cat);
      if (!e.name.trim()) e.name = 'Your food';
      VALUES.forEach(function (v) { if (isNaN(e[v[0]])) e[v[0]] = 0; });
      if (isNaN(e.per)) e.per = 1;
      if (!e.unitName.trim()) e.unitName = 'portion';
      if (isNaN(e.portionMl)) e.portionMl = 100;
      if (isNaN(e.grams)) e.grams = basis === 'perPortion' ? e.portionMl : 100;
      return e;
    }

    // Draws the tile `result` would have in the grid, or a draft of it while something is missing.
    function showPreview(result) {
      var made = result.food ? result : NM.CustomFoods.fromEntry(draft(category || 'protein'));
      previewSlot.textContent = '';
      side.classList.toggle('is-draft', !result.food);
      if (!made.food) {
        previewNote.textContent = 'No preview while ' + made.error + '.';
        return;
      }
      var food = made.food;
      if (!category) {
        var guess = NM.CustomFoods.suggest(food);
        food.category = guess ? guess.id : 'protein';
        if (!pictureChosen) food.icon = PICTURE_FOR[food.category];
      }
      var cat = NM.categories.find(function (c) { return c.id === food.category; });
      var row = NM.CustomFoods.toRow(Object.assign({ id: 'my-preview' }, food));
      var rec = NM.Nutrition.normalise([Object.assign({}, cat, { foods: [row] })])[0];
      previewSlot.appendChild(NM.Grid.preview(rec, ctx.score(rec), ctx.subject, ctx.icons));
      previewNote.textContent = result.food
        ? 'Coloured as the grid would colour it now, against ' + ctx.subject + '.'
        : 'A draft until everything is filled in.';
    }

    var suggestion = null;
    var saving = false;

    // Brings everything that depends on the inputs up to date, leaving focus where it is.
    function refresh() {
      pressed(basisButtons, basis);
      portion.hidden = basis !== 'perPortion';
      var perWhat = basis === 'perPortion' ? 'per portion' : basis === 'per100g' ? 'per 100 g' : 'per 100 ml';
      values.setAttribute('aria-label', 'Values ' + perWhat);
      gramsField.firstChild.textContent = basis === 'perPortion' ? 'A portion weighs, g' : '100 ml weighs, g';
      weighNote.textContent = basis === 'per100g'
        ? 'Kept per 100 ml, worked out from this weight. Fill a measuring jug to 100 ml and weigh it.'
        : 'Shown beside an amount as an estimate, and used when a weight is typed in.';

      // The rules need only the values, so a suggestion shows before the name is typed.
      var probe = NM.CustomFoods.fromEntry(Object.assign(entry('protein'), { name: 'x' }));
      suggestion = probe.food ? NM.CustomFoods.suggest(probe.food) : null;
      if (!picked && suggestion) category = suggestion.id;
      pressed(catButtons, category);
      catButtons.forEach(function (b) { b.classList.toggle('is-suggested', !!suggestion && b.dataset.value === suggestion.id); });
      suggestLine.textContent = '';
      if (suggestion) {
        var sName = NM.categories.find(function (c) { return c.id === suggestion.id; }).name;
        suggestLine.appendChild(document.createTextNode('◆ Suggested: ' + sName + ', as ' + suggestion.why + '. '));
        if (picked && category !== suggestion.id) suggestLine.appendChild(useSuggestion);
      } else {
        suggestLine.textContent = 'Fill in kcal, the macros and the weight, and a category is suggested.';
      }

      if (!pictureChosen && category) picture = PICTURE_FOR[category];
      pressed(picButtons, picture);

      var result = NM.CustomFoods.fromEntry(entry(category));
      status.classList.toggle('is-error', !!serverError);
      if (!ctx.online) status.textContent = ctx.note;
      else if (serverError) status.textContent = 'Not saved: ' + serverError + '.';
      else if (result.error) status.textContent = 'To ' + (editing ? 'save' : 'add') + ' it: ' + result.error + '.';
      else status.textContent = '';
      save.disabled = !ctx.online || !!result.error || saving;
      if (remove) remove.disabled = !ctx.online || saving;
      showPreview(result);
      return result;
    }

    function take() {
      var result = refresh();
      if (!result.food || !ctx.online || saving) return;
      saving = true;
      serverError = null;
      refresh();
      ctx.onSave(result.food, editing ? editing.id : null, function (err) {
        saving = false;
        if (err) { serverError = err; refresh(); } else close();
      });
    }

    box.addEventListener('input', function () { serverError = null; refresh(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); take(); }
    });
    save.addEventListener('click', take);
    dim.addEventListener('click', close);

    open = {
      box: box, dim: dim, opener: ctx.opener,
      // New foods, online and note from the app, taken without touching what is typed.
      update: function (patch) {
        ctx = Object.assign({}, ctx, patch);
        drawMine();
        refresh();
      },
      // Escape closes it unless a box dropped from inside it took the key first; Tab stays inside.
      onKey: function (e) {
        if (e.defaultPrevented) return;
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key !== 'Tab') return;
        var all = [].slice.call(box.querySelectorAll('input, button:not([disabled])')).filter(function (n) { return n.offsetParent !== null; });
        var i = all.indexOf(document.activeElement);
        if (i < 0 || (e.shiftKey ? i === 0 : i === all.length - 1)) {
          e.preventDefault();
          all[e.shiftKey ? all.length - 1 : 0].focus();
        }
      }
    };
    document.addEventListener('keydown', open.onKey);
    document.body.appendChild(dim);
    document.body.appendChild(box);
    refresh();
    name.focus({ preventScroll: true });
  }

  // Gives an open box what has changed of `ctx`: { foods, online, note }. Nothing when it is closed.
  function update(patch) { if (open) open.update(patch); }

  NM.FoodForm = { show: show, close: close, update: update };
})(window.NM = window.NM || {});
