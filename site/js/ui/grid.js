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

  // Grams a macro bar fills to its tick, on the food's listed basis. Past it, the last quarter
  // of the bar holds up to as much again (docs/decisions/0019-tile-macros-are-drawn-in-grams.md).
  var GRAMS_FULL = 10;
  var GRAMS_KNEE = 0.75;

  function gramBars(food) {
    var basis = food.portion ? 'per portion' : 'per 100 ml';
    var bars = el('div', 'tile-grams');
    bars.style.setProperty('--gram-knee', GRAMS_KNEE * 100 + '%');
    ['protein', 'fat', 'carbs'].forEach(function (k) {
      var g = NM.Nutrition.mid(food.listed[k]);
      var under = Math.min(g / GRAMS_FULL, 1);
      var over = Math.max(0, Math.min((g - GRAMS_FULL) / GRAMS_FULL, 1));
      var bar = el('div', 'tile-gram tile-gram-' + k);
      var fill = el('span', 'tile-gram-fill');
      fill.style.width = (under * GRAMS_KNEE * 100).toFixed(1) + '%';
      bar.appendChild(fill);
      if (over > 0) {
        var past = el('span', 'tile-gram-over');
        past.style.width = (over * (1 - GRAMS_KNEE) * 100).toFixed(1) + '%';
        bar.appendChild(past);
      }
      var estimated = food.est.indexOf(k) >= 0 && g > 0;
      bar.title = F.LABEL[k] + ' ' + F.listed(food.listed[k]) + ' g ' + basis + (estimated ? ', estimated' : '') + '. The tick is ' + GRAMS_FULL + ' g.';
      bars.appendChild(bar);
    });
    return bars;
  }

  function weight(food, ml) {
    var w = el('span', 'tile-weight', F.grams(NM.Nutrition.grams(food, ml)));
    w.title = F.GRAMS_TITLE;
    return w;
  }

  // The band on the tile's frame: one lit diamond per step up from the worst band, then its word.
  // Decorative, as the tile's aria label already names the band.
  function bandLegend(tier) {
    var lit = NM.Fit.TIERS.length - NM.Fit.TIERS.map(function (t) { return t.id; }).indexOf(tier);
    var legend = el('span', 'tile-band');
    legend.setAttribute('aria-hidden', 'true');
    var meter = el('span', 'tile-meter', new Array(lit + 1).join('◆'));
    meter.appendChild(el('span', 'tile-meter-off', new Array(NM.Fit.TIERS.length - lit + 1).join('◆')));
    legend.appendChild(meter);
    legend.appendChild(el('span', 'tile-band-word', F.TIER_SHORT[tier]));
    return legend;
  }

  // The name may break at a hyphen only where no part is under three letters, so JELL-O never
  // strands its O on a line of its own.
  function tileName(name) {
    var n = el('span', 'tile-name');
    name.split(/(\s+)/).forEach(function (word) {
      var parts = word.split('-');
      var whole = parts.length > 1 && parts.some(function (p) { return p.length < 3; });
      n.appendChild(whole ? el('span', 'tile-name-whole', word) : document.createTextNode(word));
    });
    return n;
  }

  // `ctx.preview` builds the tile as a picture of a food not yet in the grid: not a button.
  function tile(food, r, change, inScopeMl, ctx) {
    var t = el(ctx.preview ? 'div' : 'button', 'tile');
    if (!ctx.preview) t.type = 'button';
    if (inScopeMl) t.classList.add('is-on-plate');
    if (!ctx.addTo) t.classList.add('is-idle');
    t.classList.add('fit-' + r.tier);
    t.dataset.fit = r.norm.toFixed(2);
    t.dataset.id = food.id;
    t.dataset.focus = 'tile:' + food.id;
    t.appendChild(bandLegend(r.tier));

    // The change arrow sits on the picture's corner, so it never rewraps the name.
    var head = el('div', 'tile-head');
    var pic = el('span', 'tile-pic');
    pic.appendChild(F.icon(NM.Icons.picture(food, ctx.view.icons), 'tile-icon'));
    if (change) {
      var arrow = el('span', 'tile-change tile-change-' + change.dir, change.dir === 'up' ? '↑' : '↓');
      arrow.title = changeText(change, ctx.subject);
      pic.appendChild(arrow);
    }
    head.appendChild(pic);
    head.appendChild(tileName(food.name));
    var density = NM.Nutrition.mlPer100Kcal(food.perMl.kcal);
    var d = el('span', 'tile-density');
    d.appendChild(el('b', null, F.num(density, 0)));
    // The unit takes two short lines, so the number's column leaves the name more room.
    d.appendChild(el('span', 'tile-density-unit', 'ml per'));
    d.appendChild(el('span', 'tile-density-unit', '100 kcal'));
    d.title = 'Volume that 100 kcal of this buys';
    head.appendChild(d);
    t.appendChild(head);

    var prep = el('div', 'tile-prep');
    // A food of your own says so where the table's would show its preparation.
    if (food.custom) {
      var yours = el('span', 'tile-mine', 'Yours');
      yours.title = 'A food of your own, not from the reference table. + Add food edits it.';
      prep.appendChild(yours);
    }
    prep.appendChild(document.createTextNode(food.portion ? food.portion + ' · ≈' + F.num(food.portionMl) + ' ml' + (food.est.indexOf('portionMl') >= 0 ? '~' : '') : food.prep));
    t.appendChild(prep);

    var kcal = el('div', 'tile-kcal');
    kcal.appendChild(el('b', null, F.listed(food.listed.kcal)));
    kcal.appendChild(document.createTextNode(food.portion ? ' kcal' : ' kcal/100 ml'));
    t.appendChild(kcal);

    t.appendChild(macroLine(food));
    t.appendChild(gramBars(food));

    var foot = el('div', 'tile-foot');
    var amount = F.amount(food, food.defaultMl);
    var add = el('span', 'tile-add', '+ ' + amount + ' ');
    add.appendChild(weight(food, food.defaultMl));
    foot.appendChild(add);
    // The held line is there even when empty, so the first add does not grow the tile.
    var on = el('span', 'tile-onplate', inScopeMl ? ctx.scopeLabel + ': ' + F.amount(food, inScopeMl) + ' ' : '');
    if (inScopeMl) on.appendChild(weight(food, inScopeMl));
    foot.appendChild(on);
    t.appendChild(foot);

    var why = reasons(food, r, ctx.subject);
    var ul = el('ul', 'tile-why');
    ul.appendChild(el('li', 'why-tier', F.TIER_LABEL[r.tier]));
    if (change) ul.appendChild(el('li', 'why-change why-' + (change.dir === 'up' ? 'good' : 'bad'), changeText(change, ctx.subject)));
    why.forEach(function (w) { ul.appendChild(el('li', w.good ? 'why-good' : 'why-bad', w.text)); });
    t.appendChild(ul);

    var action = ctx.preview ? 'Preview of ' + food.name : ctx.addTo ? 'Add ' + food.name + ' to ' + ctx.addTo : food.name + ', select a meal to add it';
    t.setAttribute('aria-label', action + '. ' + F.TIER_LABEL[r.tier] + '. ' + (change ? changeText(change, ctx.subject) + '. ' : '') + why.map(function (w) { return w.text; }).join('; '));
    if (ctx.preview) {
      t.setAttribute('role', 'img');
      return t;
    }
    t.addEventListener('click', function () { ctx.onAdd(food); });
    NM.Fx.decorate(t, ctx.effects[food.id], '+' + amount);
    return t;
  }

  // The tile `food` (a record from Nutrition.normalise) would have in the grid, scored as `r`
  // against `subject`, for the box a food of your own is entered in.
  function preview(food, r, subject, icons) {
    return tile(food, r, null, 0, { preview: true, subject: subject, addTo: null, view: { icons: icons } });
  }

  // `ctx`: { categories, foods, ranked, changes (id → Fit.compare entry), inScope (id → ml in the
  // selected meal, or the day), scopeLabel, addTo (the selected meal's name, null for the day),
  // subject (what the tiles are scored against, 'the day' or a meal's name), effects (id → that
  // tile's clicks still playing, for Fx.decorate), view, onAdd }.
  function render(root, ctx) {
    root.textContent = '';
    var q = ctx.view.query.trim().toLowerCase();
    var sort = SORTS[ctx.view.sort] || SORTS.table;
    var shown = 0;

    ctx.categories.forEach(function (cat) {
      var foods = ctx.foods.filter(function (f) {
        if (f.category !== cat.id) return false;
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

  NM.Grid = { render: render, reasons: reasons, preview: preview };
})(window.NM = window.NM || {});
