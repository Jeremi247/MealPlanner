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

    if (totals.volume > 0) {
      var missing = NM.Fit.mostMissing(totals, target).filter(function (m) { return m.need > 0.05; });
      var p = el('p', 'missing');
      if (!missing.length) p.textContent = 'Every balance target is met.';
      else p.textContent = 'Short on ' + missing.slice(0, 3).map(function (m) {
        return F.LABEL[m.dim].toLowerCase() + ' (' + Math.round(m.need * 100) + '%)';
      }).join(', ') + '.';
      box.appendChild(p);
    }
    return box;
  }

  function itemRow(food, ml, onSet) {
    var row = el('li', 'item');
    var a = NM.Nutrition.amount(food, ml);
    var name = el('div', 'item-name');
    var title = el('span', 'item-title');
    title.appendChild(F.icon(NM.Icons.src(food.id), 'item-icon'));
    title.appendChild(document.createTextNode(food.name));
    name.appendChild(title);
    var sub = food.portion
      ? F.num(ml / food.portionMl, 2) + ' × ' + food.portion
      : food.prep;
    name.appendChild(el('small', null, sub));
    row.appendChild(name);

    var ctl = el('div', 'item-ctl');
    var minus = el('button', 'step', '−'); minus.type = 'button';
    minus.setAttribute('aria-label', 'Less ' + food.name);
    minus.dataset.focus = 'less:' + food.id;
    minus.addEventListener('click', function () { onSet(food, Math.max(0, ml - food.stepMl)); });
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
    plus.addEventListener('click', function () { onSet(food, ml + food.stepMl); });
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

    row.appendChild(el('div', 'item-nums',
      F.num(a.kcal, 0) + ' kcal · P ' + F.num(a.protein) + ' · F ' + F.num(a.fat) + ' · C ' + F.num(a.carbs)));

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
    card.appendChild(cardHead('Day', el('small', 'card-sub', ctx.meals.length + ' meals'), 'select:day', selected, onSelect));
    card.appendChild(el('h3', null, 'Daily target'));
    card.appendChild(targetForm(ctx.target, ctx.onTarget));
    card.appendChild(summary(ctx.dayTotals, ctx.target));
    if (selected) {
      card.appendChild(el('p', 'day-hint' + (ctx.unplaced ? ' is-alert' : ''), ctx.unplaced
        ? 'Select a meal below to add ' + ctx.unplaced.name + ' to it.'
        : 'Select a meal below to add foods to it.'));
    }
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
    if (selected && meal.items.length) {
      var clear = el('button', 'link', 'Clear'); clear.type = 'button';
      clear.dataset.focus = 'clear:' + i;
      clear.addEventListener('click', ctx.onClear);
      head.appendChild(clear);
    }
    if (ctx.meals.length > 1) {
      var rm = el('button', 'item-rm', '×'); rm.type = 'button';
      rm.setAttribute('aria-label', 'Remove ' + meal.name);
      rm.dataset.focus = 'remove-meal:' + i;
      rm.addEventListener('click', function () { ctx.onRemoveMeal(i); });
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
        meal.items.forEach(function (it) { ul.appendChild(itemRow(it.food, it.ml, ctx.onSet)); });
        card.appendChild(ul);
      }
    }
    selectOnClick(card, onSelect);
    return card;
  }

  // `ctx`: { target (daily), meals [{ name, items [{food, ml}], totals }], dayTotals, selected (index
  // or 'day'), unplaced (a food clicked while the day was selected, or null), onTarget(k, v),
  // onSelect(index | 'day'), onSet(food, ml) on the selected meal, onClear, onAddMeal, onRemoveMeal(index) }.
  function render(root, ctx) {
    root.textContent = '';
    root.appendChild(dayCard(ctx));
    ctx.meals.forEach(function (m, i) { root.appendChild(mealCard(m, i, ctx)); });
    var add = el('button', 'add-meal', '+ Add meal'); add.type = 'button';
    add.dataset.focus = 'add-meal';
    add.addEventListener('click', ctx.onAddMeal);
    root.appendChild(add);
  }

  NM.Plate = { render: render };
})(window.NM = window.NM || {});
