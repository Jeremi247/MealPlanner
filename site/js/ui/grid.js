// The food grid: one section per category, one tile per food, tinted by fit.
(function (NM) {
  'use strict';

  var F = NM.Format;
  var el = F.el;

  // Strongest tint a tile reaches at |fit| = 1, in percent of the fit colour.
  var MAX_TINT = 58;

  var SORTS = {
    table: function (a, b) { return a.order - b.order; },
    fit: function (a, b, r) { return r[b.id].norm - r[a.id].norm; },
    density: function (a, b) { return NM.Nutrition.mlPer100Kcal(b.perMl.kcal) - NM.Nutrition.mlPer100Kcal(a.perMl.kcal); },
    name: function (a, b) { return a.name.localeCompare(b.name); }
  };

  // Plain-language reasons behind one food's score, strongest first.
  function reasons(food, r) {
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
          ? { good: true, w: c, text: 'adds ' + label + ' the plate is short on' }
          : { good: false, w: -c, text: 'adds ' + label + ' the plate already leads on' });
      });
    }
    Object.keys(r.over).forEach(function (d) {
      if (r.over[d] > 0.005) out.push({ good: false, w: r.over[d] * 2, text: 'pushes ' + F.LABEL[d].toLowerCase() + ' ' + Math.round(r.over[d] * 100) + '% over target' });
    });
    return out.sort(function (a, b) { return b.w - a.w; }).slice(0, 3);
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

  function tile(food, r, inPlateMl, onAdd) {
    var t = el('button', 'tile');
    t.type = 'button';
    if (food.reference) t.classList.add('is-reference');
    if (inPlateMl) t.classList.add('is-on-plate');
    var g = Math.max(0, r.norm) * MAX_TINT, b = Math.max(0, -r.norm) * MAX_TINT;
    t.style.setProperty('--good-amt', g.toFixed(1) + '%');
    t.style.setProperty('--bad-amt', b.toFixed(1) + '%');
    t.dataset.fit = r.norm.toFixed(2);
    t.dataset.id = food.id;
    t.dataset.focus = 'tile:' + food.id;

    var head = el('div', 'tile-head');
    head.appendChild(el('span', 'tile-name', food.name + (food.reference ? ' †' : '')));
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
    foot.appendChild(el('span', 'tile-add', '+ ' + (food.portion ? '1 portion' : F.num(food.defaultMl) + ' ml')));
    if (inPlateMl) foot.appendChild(el('span', 'tile-onplate', 'on plate: ' + F.num(inPlateMl) + ' ml'));
    t.appendChild(foot);

    var why = reasons(food, r);
    var ul = el('ul', 'tile-why');
    why.forEach(function (w) { ul.appendChild(el('li', w.good ? 'why-good' : 'why-bad', w.text)); });
    if (why.length) t.appendChild(ul);

    t.setAttribute('aria-label', 'Add ' + food.name + '. Fit ' + Math.round(r.norm * 100) + '. ' + why.map(function (w) { return w.text; }).join('; '));
    t.addEventListener('click', function () { onAdd(food); });
    return t;
  }

  // `ctx`: { categories, foods, ranked, plateMl (id → ml), view, onAdd }.
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
      foods.forEach(function (f) { grid.appendChild(tile(f, ctx.ranked.results[f.id], ctx.plateMl[f.id] || 0, ctx.onAdd)); });
      sec.appendChild(grid);
      root.appendChild(sec);
    });

    if (!shown) root.appendChild(el('p', 'empty-note', 'No food matches “' + ctx.view.query + '”.'));
  }

  NM.Grid = { render: render, reasons: reasons };
})(window.NM = window.NM || {});
