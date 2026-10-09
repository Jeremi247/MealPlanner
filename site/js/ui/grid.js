// The food grid: one section per category, one tile per food, tinted by fit.
(function (NM) {
  'use strict';

  var F = NM.Format;
  var el = F.el;

  var SORTS = {
    table: function (a, b) { return a.order - b.order; },
    // By raw score: `norm` is clamped at full colour, so many tiles tie at ±1.
    fit: function (a, b, r) { return r[b.id].raw - r[a.id].raw; },
    density: function (a, b) { return NM.Nutrition.mlPer100Kcal(b.perMl.kcal) - NM.Nutrition.mlPer100Kcal(a.perMl.kcal); },
    name: function (a, b) { return a.name.localeCompare(b.name); }
  };

  // Plain-language reasons behind one food's score, strongest first. `subject` names what
  // the tiles are scored against: 'the day' or a meal's name.
  function reasons(food, r, subject) {
    var out = [];
    if (r.regime === 'empty') {
      NM.Fit.BALANCE.forEach(function (d) {
        if (r.share[d] >= 0.05) out.push({ good: true, w: r.share[d], text: 'covers ' + Math.round(r.share[d] * 100) + '% of ' + F.LABEL[d].toLowerCase() });
      });
    } else {
      var m = NM.Fit.BALANCE.reduce(function (s, d) { return s + r.need[d]; }, 0) / NM.Fit.BALANCE.length;
      NM.Fit.BALANCE.forEach(function (d) {
        var c = r.share[d] * (r.need[d] - m);
        if (Math.abs(c) < 0.004) return;
        var label = F.LABEL[d].toLowerCase();
        out.push(c > 0
          ? { good: true, w: c, text: 'adds ' + label + ' ' + subject + ' is short on' }
          : { good: false, w: -c, text: 'adds ' + label + ' ' + subject + ' already leads on' });
      });
    }
    Object.keys(r.over).forEach(function (d) {
      if (r.over[d] > 0.005) out.push({ good: false, w: r.over[d] * 2, text: 'pushes ' + F.LABEL[d].toLowerCase() + ' ' + Math.round(r.over[d] * 100) + '% over target' });
    });
    return out.sort(function (a, b) { return b.w - a.w; }).slice(0, 3);
  }

  // Why a tile moved band with the last change to the meals or target. `c` is from Fit.compare.
  function changeText(c, subject) {
    var label = F.LABEL[c.dim].toLowerCase();
    if (c.kind === 'over') return c.dir === 'up' ? 'Moved up: pushes ' + label + ' less far over target now' : 'Moved down: would now push ' + label + ' over target';
    return c.dir === 'up'
      ? 'Moved up: ' + subject + ' is now further behind on ' + label
      : 'Moved down: ' + subject + ' is now further ahead on ' + label;
  }

  function macroLine(food) {
    var perPortion = !!food.portion;
    var scale = perPortion ? food.portionMl : 100;
    var line = el('div', 'tile-macros');
    [['protein', 'P'], ['fat', 'F'], ['carbs', 'C']].forEach(function (pair) {
      var key = pair[0];
      var v = el('span', 'macro macro-' + key);
      v.appendChild(el('b', null, pair[1]));
      var estimated = food.est.indexOf(key) >= 0 && NM.Nutrition.mid(food.listed[key]) > 0;
      v.appendChild(document.createTextNode(' ' + F.listed(food.listed[key]) + (estimated ? '~' : '')));
      if (estimated) v.title = 'Estimated — not from the reference table';
      line.appendChild(v);
    });
    line.appendChild(el('span', 'tile-basis', perPortion ? 'per portion' : 'per ' + scale + ' ml'));
    return line;
  }

  function splitBar(food) {
    var s = NM.Nutrition.macroKcalSplit(food.perMl);
    var bar = el('div', 'split');
    ['protein', 'fat', 'carbs'].forEach(function (k) {
      var seg = el('span', 'split-' + k);
      seg.style.width = (s[k] * 100).toFixed(1) + '%';
      bar.appendChild(seg);
    });
    bar.title = 'Calories from protein ' + Math.round(s.protein * 100) + '%, fat ' + Math.round(s.fat * 100) + '%, carbs ' + Math.round(s.carbs * 100) + '%';
    return bar;
  }

  function weight(food, ml) {
    var w = el('span', 'tile-weight', F.grams(NM.Nutrition.grams(food, ml)));
    w.title = F.GRAMS_TITLE;
    return w;
  }

  function tile(food, r, change, inScopeMl, ctx) {
    var t = el('button', 'tile');
    t.type = 'button';
    if (food.reference) t.classList.add('is-reference');
    if (inScopeMl) t.classList.add('is-on-plate');
    if (!ctx.addTo) t.classList.add('is-idle');
    t.classList.add('fit-' + r.tier);
    t.dataset.fit = r.norm.toFixed(2);
    t.dataset.id = food.id;
    t.dataset.focus = 'tile:' + food.id;

    var head = el('div', 'tile-head');
    head.appendChild(F.icon(NM.Icons.src(food.id), 'tile-icon'));
    var name = el('span', 'tile-name', food.name + (food.reference ? ' †' : ''));
    if (change) {
      var arrow = el('span', 'tile-change tile-change-' + change.dir, change.dir === 'up' ? '↑' : '↓');
      arrow.title = changeText(change, ctx.subject);
      name.appendChild(arrow);
    }
    head.appendChild(name);
    var density = NM.Nutrition.mlPer100Kcal(food.perMl.kcal);
    var d = el('span', 'tile-density');
    d.appendChild(el('b', null, F.num(density, 0)));
    d.appendChild(document.createTextNode(' ml/100 kcal'));
    d.title = 'Volume that 100 kcal of this buys';
    head.appendChild(d);
    t.appendChild(head);

    t.appendChild(el('div', 'tile-prep', food.portion ? food.portion + ' · ≈' + F.num(food.portionMl) + ' ml' + (food.est.indexOf('portionMl') >= 0 ? '~' : '') : food.prep));

    var kcal = el('div', 'tile-kcal');
    kcal.appendChild(el('b', null, F.listed(food.listed.kcal)));
    kcal.appendChild(document.createTextNode(food.portion ? ' kcal' : ' kcal/100 ml'));
    var vs = el('span', 'tile-vs', F.percent(NM.Nutrition.vsBaseline(food)));
    vs.title = 'kcal vs the category\'s original average (' + F.num(food.baseline, 1) + ')';
    kcal.appendChild(vs);
    t.appendChild(kcal);

    t.appendChild(macroLine(food));
    t.appendChild(splitBar(food));

    var foot = el('div', 'tile-foot');
    var add = el('span', 'tile-add', '+ ' + (food.portion ? '1 portion' : F.num(food.defaultMl) + ' ml') + ' ');
    add.appendChild(weight(food, food.defaultMl));
    foot.appendChild(add);
    if (inScopeMl) {
      var on = el('span', 'tile-onplate', ctx.scopeLabel + ': ' + F.num(inScopeMl) + ' ml ');
      on.appendChild(weight(food, inScopeMl));
      foot.appendChild(on);
    }
    t.appendChild(foot);

    var why = reasons(food, r, ctx.subject);
    var ul = el('ul', 'tile-why');
    ul.appendChild(el('li', 'why-tier', F.TIER_LABEL[r.tier]));
    if (change) ul.appendChild(el('li', 'why-change why-' + (change.dir === 'up' ? 'good' : 'bad'), changeText(change, ctx.subject)));
    why.forEach(function (w) { ul.appendChild(el('li', w.good ? 'why-good' : 'why-bad', w.text)); });
    t.appendChild(ul);

    var action = ctx.addTo ? 'Add ' + food.name + ' to ' + ctx.addTo : food.name + ', select a meal to add it';
    t.setAttribute('aria-label', action + '. ' + F.TIER_LABEL[r.tier] + '. ' + (change ? changeText(change, ctx.subject) + '. ' : '') + why.map(function (w) { return w.text; }).join('; '));
    t.addEventListener('click', function () { ctx.onAdd(food); });
    return t;
  }

  // `ctx`: { categories, foods, ranked, changes (id → Fit.compare entry), inScope (id → ml in the
  // selected meal, or the day), scopeLabel, addTo (the selected meal's name, null for the day),
  // subject (what the tiles are scored against, 'the day' or a meal's name), view, onAdd }.
  function render(root, ctx) {
    root.textContent = '';
    var q = ctx.view.query.trim().toLowerCase();
    var sort = SORTS[ctx.view.sort] || SORTS.table;
    var shown = 0;

    ctx.categories.forEach(function (cat) {
      var foods = ctx.foods.filter(function (f) {
        if (f.category !== cat.id) return false;
        if (!ctx.view.showReference && f.reference) return false;
        return !q || (f.name + ' ' + f.prep + ' ' + (f.portion || '')).toLowerCase().indexOf(q) >= 0;
      }).sort(function (a, b) { return sort(a, b, ctx.ranked.results); });
      if (!foods.length) return;
      shown += foods.length;

      var sec = el('section', 'cat cat-' + cat.id);
      var h = el('header', 'cat-head');
      h.appendChild(el('h2', null, cat.name));
      h.appendChild(el('span', 'cat-count', foods.length + ''));
      h.appendChild(el('p', 'cat-note', cat.note));
      sec.appendChild(h);
      var grid = el('div', 'grid');
      foods.forEach(function (f) { grid.appendChild(tile(f, ctx.ranked.results[f.id], ctx.changes[f.id], ctx.inScope[f.id] || 0, ctx)); });
      sec.appendChild(grid);
      root.appendChild(sec);
    });

    if (!shown) root.appendChild(el('p', 'empty-note', 'No food matches “' + ctx.view.query + '”.'));
  }

  NM.Grid = { render: render, reasons: reasons };
})(window.NM = window.NM || {});
