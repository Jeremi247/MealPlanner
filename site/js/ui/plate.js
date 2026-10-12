// The sidebar: the day card (daily target and totals) and one card per meal, each with
// its meal-level nutrients against its share of the day and, when selected, its rows.
(function (NM) {
  'use strict';

  var F = NM.Format;
  var el = F.el;
  var TARGET_FIELDS = ['kcal', 'volume', 'protein', 'fat', 'carbs'];
  var MEAL_FIELDS = ['volume', 'protein', 'carbs'];

  function targetForm(target, onTarget) {
    var form = el('div', 'target');
    TARGET_FIELDS.forEach(function (k) {
      var lab = el('label', 'target-field target-' + k);
      lab.appendChild(el('span', null, F.LABEL[k]));
      var input = el('input');
      input.type = 'number'; input.min = '0'; input.step = k === 'volume' || k === 'kcal' ? '25' : '1';
      input.value = target[k];
      input.dataset.focus = 'target:' + k;
      input.addEventListener('change', function () {
        var v = parseFloat(input.value);
        if (isFinite(v) && v >= 0) onTarget(k, v); else input.value = target[k];
      });
      lab.appendChild(input);
      lab.appendChild(el('small', null, F.UNIT[k]));
      form.appendChild(lab);
    });
    var fromMacros = target.protein * 4 + target.fat * 9 + target.carbs * 4;
    if (Math.abs(fromMacros - target.kcal) > target.kcal * 0.1) {
      form.appendChild(el('p', 'target-warn', 'The macros add up to ' + F.num(fromMacros) + ' kcal, not ' + F.num(target.kcal) + '.'));
    }
    return form;
  }

  function bar(key, value, target) {
    var row = el('div', 'bar bar-' + key);
    var label = el('div', 'bar-label');
    label.appendChild(el('span', null, F.LABEL[key]));
    label.appendChild(el('span', 'bar-value', F.num(value) + ' / ' + F.num(target) + ' ' + F.UNIT[key]));
    row.appendChild(label);
    var track = el('div', 'bar-track');
    var frac = target > 0 ? value / target : 0;
    var fill = el('span', 'bar-fill');
    // Past the target the track rescales so the overshoot stays visible.
    var scale = Math.max(1, frac);
    fill.style.width = (Math.min(frac, 1) / scale * 100).toFixed(1) + '%';
    track.appendChild(fill);
    if (frac > 1) {
      var over = el('span', 'bar-over');
      over.style.width = ((frac - 1) / scale * 100).toFixed(1) + '%';
      track.appendChild(over);
      row.classList.add('is-over');
    }
    var mark = el('span', 'bar-mark');
    mark.style.left = (1 / scale * 100).toFixed(1) + '%';
    track.appendChild(mark);
    row.appendChild(track);
    return row;
  }

  function summary(totals, target) {
    var box = el('div', 'summary');

    var hero = el('div', 'hero');
    var v = el('div', 'hero-volume');
    v.appendChild(el('b', null, F.num(totals.volume)));
    v.appendChild(document.createTextNode(' ml'));
    hero.appendChild(v);
    var dens = el('div', 'hero-density');
    dens.appendChild(el('b', null, totals.kcal > 0 ? F.num(totals.volume / totals.kcal * 100, 0) : '—'));
    dens.appendChild(document.createTextNode(' ml per 100 kcal'));
    var targetDensity = target.kcal > 0 ? target.volume / target.kcal * 100 : 0;
    dens.title = 'The target asks for ' + F.num(targetDensity, 0) + ' ml per 100 kcal';
    hero.appendChild(dens);
    box.appendChild(hero);

    TARGET_FIELDS.forEach(function (k) { box.appendChild(bar(k, totals[k], target[k])); });

    var p = el('p', 'missing');
    var missing = NM.Fit.mostMissing(totals, target).filter(function (m) { return m.need > 0.05; });
    if (!(totals.volume > 0)) p.textContent = 'Nothing added yet.';
    else if (!missing.length) p.textContent = 'Every balance target is met.';
    else p.textContent = 'Short on ' + missing.slice(0, 3).map(function (m) {
      return F.LABEL[m.dim].toLowerCase() + ' (' + Math.round(m.need * 100) + '%)';
    }).join(', ') + '.';
    box.appendChild(p);
    return box;
  }

  function itemRow(food, ml, onSet, icons) {
    var row = el('li', 'item');
    var a = NM.Nutrition.amount(food, ml);
    var name = el('div', 'item-name');
    var title = el('span', 'item-title');
    title.appendChild(F.icon(NM.Icons.picture(food, icons), 'item-icon'));
    title.appendChild(document.createTextNode(food.name));
    name.appendChild(title);
    name.appendChild(el('small', null, food.unit ? F.amount(food, ml) : food.prep));
    row.appendChild(name);

    var ctl = el('div', 'item-ctl');
    var minus = el('button', 'step', '−'); minus.type = 'button';
    minus.setAttribute('aria-label', 'Less ' + food.name);
    minus.dataset.focus = 'less:' + food.id;
    minus.addEventListener('click', function () { onSet(food, NM.Nutrition.stepped(food, ml, -1)); });
    var input = el('input', 'item-ml');
    input.type = 'number'; input.min = '0'; input.step = String(food.stepMl); input.value = F.num(ml, 1);
    input.setAttribute('aria-label', food.name + ' in ml');
    input.dataset.focus = 'ml:' + food.id;
    input.addEventListener('change', function () {
      var v = parseFloat(input.value);
      onSet(food, isFinite(v) && v >= 0 ? v : ml);
    });
    var plus = el('button', 'step', '+'); plus.type = 'button';
    plus.setAttribute('aria-label', 'More ' + food.name);
    plus.dataset.focus = 'more:' + food.id;
    plus.addEventListener('click', function () { onSet(food, NM.Nutrition.stepped(food, ml, 1)); });
    ctl.appendChild(minus); ctl.appendChild(input); ctl.appendChild(el('span', 'unit', 'ml')); ctl.appendChild(plus);
    row.appendChild(ctl);

    // A weight typed here becomes ml at once; only the ml is kept.
    var w = el('label', 'item-weight');
    w.title = F.GRAMS_TITLE;
    w.appendChild(el('span', null, '~'));
    var g = el('input', 'item-g');
    g.type = 'number'; g.min = '0'; g.step = '1'; g.value = F.num(NM.Nutrition.grams(food, ml), 0);
    g.setAttribute('aria-label', food.name + ' in grams, estimated');
    g.dataset.focus = 'g:' + food.id;
    g.addEventListener('change', function () {
      var v = parseFloat(g.value);
      onSet(food, isFinite(v) && v >= 0 ? NM.Nutrition.mlFromGrams(food, v) : ml);
    });
    w.appendChild(g);
    w.appendChild(el('span', null, 'g'));
    row.appendChild(w);

    var nums = el('div', 'item-nums');
    nums.appendChild(el('span', null,
      F.num(a.kcal, 0) + ' kcal · P ' + F.num(a.protein) + ' · F ' + F.num(a.fat) + ' · C ' + F.num(a.carbs)));
    if (food.raw) {
      var raw = el('span', 'item-raw', food.raw.word + ' ');
      raw.title = F.RAW_TITLE;
      raw.appendChild(el('b', null, F.grams(NM.Nutrition.rawGrams(food, ml))));
      nums.appendChild(raw);
    }
    row.appendChild(nums);

    var rm = el('button', 'item-rm', '×'); rm.type = 'button';
    rm.setAttribute('aria-label', 'Remove ' + food.name);
    rm.dataset.focus = 'remove:' + food.id;
    rm.addEventListener('click', function () { onSet(food, 0); });
    row.appendChild(rm);
    return row;
  }

  // A click on a card selects it, unless it lands on one of the card's own controls.
  function selectOnClick(card, onSelect) {
    card.addEventListener('click', function (e) {
      if (!e.target.closest('input, button, label')) onSelect();
    });
  }

  // A head's text button: disabled, not hidden, when there is nothing for it to do. `onClick`
  // is given the button, for a confirmation to drop from.
  function headLink(label, focusKey, enabled, onClick) {
    var b = el('button', 'link', label); b.type = 'button';
    b.dataset.focus = focusKey;
    b.disabled = !enabled;
    b.addEventListener('click', function () { onClick(b); });
    return b;
  }

  function cardHead(title, sub, focusKey, selected, onSelect) {
    var head = el('div', 'card-head');
    var b = el('button', 'card-title'); b.type = 'button';
    b.setAttribute('aria-pressed', selected ? 'true' : 'false');
    b.dataset.focus = focusKey;
    b.appendChild(el('span', 'card-name', title));
    if (sub) b.appendChild(sub);
    b.addEventListener('click', onSelect);
    head.appendChild(b);
    return head;
  }

  function dayCard(ctx) {
    var selected = ctx.selected === 'day';
    var card = el('section', 'panel card card-day' + (selected ? ' is-selected' : ''));
    var onSelect = function () { ctx.onSelect('day'); };
    var head = cardHead('Day', el('small', 'card-sub', ctx.meals.length + ' meals'), 'select:day', selected, onSelect);
    var any = ctx.meals.some(function (m) { return m.items.length; });
    head.appendChild(headLink('Clear all', 'clear:day', any, ctx.onClearAll));
    card.appendChild(head);
    card.appendChild(el('h3', null, 'Daily target'));
    card.appendChild(targetForm(ctx.target, ctx.onTarget));
    card.appendChild(summary(ctx.dayTotals, ctx.target));
    // Always shown, so selecting the day never resizes its card.
    var hint = el('p', 'day-hint', 'Select a meal below to add foods to it.');
    if (ctx.refused !== null) NM.Fx.refuse(hint, ctx.refused);
    card.appendChild(hint);
    selectOnClick(card, onSelect);
    return card;
  }

  function mealCard(meal, i, ctx) {
    var selected = ctx.selected === i;
    var share = NM.Fit.mealShare(ctx.target, ctx.meals.length);
    var card = el('section', 'panel card card-meal' + (selected ? ' is-selected' : ''));
    var onSelect = function () { ctx.onSelect(i); };
    var count = meal.items.length;
    var sub = el('small', 'card-sub', count ? count + (count === 1 ? ' food' : ' foods') : 'empty');
    var head = cardHead(meal.name, sub, 'select:meal:' + i, selected, onSelect);
    head.appendChild(headLink('Clear', 'clear:' + i, count > 0, function (b) { ctx.onClear(i, b); }));
    if (ctx.meals.length > 1) {
      var rm = el('button', 'item-rm', '×'); rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + meal.name);
      rm.dataset.focus = 'remove-meal:' + i;
      rm.addEventListener('click', function () { ctx.onRemoveMeal(i, rm); });
      head.appendChild(rm);
    }
    card.appendChild(head);

    var bars = el('div', 'meal-bars');
    MEAL_FIELDS.forEach(function (k) { bars.appendChild(bar(k, meal.totals[k], share[k])); });
    card.appendChild(bars);
    if (selected) {
      if (!meal.items.length) {
        card.appendChild(el('p', 'empty-note', 'Nothing yet. Pick a food from the grid to add it here.'));
      } else {
        var ul = el('ul', 'items');
        meal.items.forEach(function (it) { ul.appendChild(itemRow(it.food, it.ml, ctx.onSet, ctx.icons)); });
        card.appendChild(ul);
      }
    }
    selectOnClick(card, onSelect);
    return card;
  }

  // How long a card takes to glide to its new height, and the curve it follows (docs/decisions/0017).
  var GLIDE_MS = 250;
  var GLIDE_EASE = 'cubic-bezier(.22, .8, .28, 1)';
  // What a card shows only while selected: it fades in on opening and out on closing.
  var OPEN_PARTS = '.items, .empty-note';

  function cardKey(card) {
    var t = card.querySelector('.card-title');
    return t ? t.dataset.focus : null;
  }

  var MEAL_KEY = 'select:meal:';

  // Each card on the page by its title's focus key: its height as drawn now, mid-glide included.
  // `removed` is the index of a meal removed since: its card is kept under `removed`, and the
  // cards after it under the keys they have now, so each is matched with its own meal.
  function measure(root, removed) {
    var cards = {};
    Array.prototype.forEach.call(root.querySelectorAll('.card'), function (c) {
      var k = cardKey(c);
      if (!k) return;
      var i = k.indexOf(MEAL_KEY) === 0 ? Number(k.slice(MEAL_KEY.length)) : -1;
      if (removed !== null && i === removed) k = 'removed';
      else if (removed !== null && i > removed) k = MEAL_KEY + (i - 1);
      cards[k] = { el: c, h: c.getBoundingClientRect().height, selected: c.classList.contains('is-selected'), index: i };
    });
    return cards;
  }

  // Shows a removed meal's card, inert, where it was, folding it away to nothing.
  function collapse(root, old) {
    var gap = parseFloat(getComputedStyle(root).rowGap) || 0;
    var cs = getComputedStyle(old.el);
    var c = old.el;
    var key = c.querySelector('.card-title');
    if (key) delete key.dataset.focus;  // measured by no later render, and no duplicate focus key
    c.inert = true;
    c.classList.add('is-gliding', 'is-removed');
    var next = root.querySelectorAll('.card-meal')[old.index] || root.querySelector('.add-meal');
    root.insertBefore(c, next);
    c.animate([
      { height: old.h + 'px', paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
        borderTopWidth: cs.borderTopWidth, borderBottomWidth: cs.borderBottomWidth, marginBottom: '0px', opacity: 1 },
      { height: '0px', paddingTop: '0px', paddingBottom: '0px',
        borderTopWidth: '0px', borderBottomWidth: '0px', marginBottom: -gap + 'px', opacity: 0 }
    ], { duration: GLIDE_MS, easing: GLIDE_EASE }).onfinish = function () { c.remove(); };
  }

  // Glides every rebuilt card from the height it had to its new one, so the cards below slide
  // rather than jump. A closing meal card is its old element, inert, until the glide ends, so
  // its rows fade out instead of vanishing; a render meanwhile measures it like any card.
  function glide(root, before) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (before.removed) collapse(root, before.removed);
    Array.prototype.forEach.call(root.querySelectorAll('.card'), function (c) {
      var old = before[cardKey(c)];
      if (!old) return;
      var to = c.getBoundingClientRect().height;
      if (Math.abs(to - old.h) < 1) return;
      var opened = !old.selected && c.classList.contains('is-selected');
      var shown = c;
      if (old.selected && !c.classList.contains('is-selected') && to < old.h && old.el.classList.contains('card-meal')) {
        shown = old.el;
        shown.classList.remove('is-selected');
        shown.inert = true;
        c.replaceWith(shown);
        Array.prototype.forEach.call(shown.querySelectorAll(OPEN_PARTS), function (n) {
          n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: GLIDE_MS * 0.6, easing: 'ease-out', fill: 'forwards' });
        });
      }
      // Clipped while it glides; and kept from shrinking, as the sidebar is a scrolling flex column.
      shown.classList.add('is-gliding');
      shown.animate([{ height: old.h + 'px' }, { height: to + 'px' }], { duration: GLIDE_MS, easing: GLIDE_EASE })
        .onfinish = function () {
          if (shown !== c) { if (shown.isConnected && !shown.classList.contains('is-removed')) shown.replaceWith(c); }
          else c.classList.remove('is-gliding');
        };
      if (opened) {
        Array.prototype.forEach.call(c.querySelectorAll(OPEN_PARTS), function (n) {
          n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: GLIDE_MS, delay: GLIDE_MS * 0.25, easing: 'ease-out', fill: 'backwards' });
        });
      }
    });
  }

  // `ctx`: { target (daily), meals [{ name, items [{food, ml}], totals }], dayTotals, selected (index
  // or 'day'), refused (ms since a tile click was refused for the day being selected, while it plays, or null), icons (an Icons style), onTarget(k, v),
  // onSelect(index | 'day'), onSet(food, ml) on the selected meal, onClear(index, button), onClearAll(button), onAddMeal,
  // onRemoveMeal(index, button), each given the button clicked,
  // removed (the index of a meal removed since the last render, or null) }.
  //
  // The sidebar's scroll position never moves on its own (docs/decisions/0017): the room below
  // the add button is sized so the cards still reach as far down as the reader has scrolled,
  // at the glide's start and at its end, and so at every frame between. Until it is measured
  // it is that far by itself, so the range never shrinks.
  function render(root, ctx) {
    var top = root.scrollTop, view = root.clientHeight;
    var removed = ctx.removed === undefined ? null : ctx.removed;
    var before = measure(root, removed);
    root.textContent = '';
    root.appendChild(dayCard(ctx));
    ctx.meals.forEach(function (m, i) { root.appendChild(mealCard(m, i, ctx)); });
    var add = el('button', 'add-meal', '+ Add meal'); add.type = 'button';
    add.dataset.focus = 'add-meal';
    add.addEventListener('click', ctx.onAddMeal);
    root.appendChild(add);
    var room = el('div', 'plate-room');
    room.setAttribute('aria-hidden', 'true');
    room.style.height = (top + view) + 'px';
    root.appendChild(room);
    var end = room.offsetTop;
    glide(root, before);
    var start = room.offsetTop;
    room.style.height = Math.max(0, top + view - Math.min(start, end)) + 'px';
    root.scrollTop = top;
  }

  NM.Plate = { render: render };
})(window.NM = window.NM || {});
