// The inside of the shelf: its rows of premade meals, two cards to a plank, each card coloured by
// how the meal would balance the day or the selected meal, and dragging a card or a row to put it
// elsewhere. The panel, its tab and its head are in site/index.html; site/js/app.js opens it and
// owns what it shows.
(function (NM) {
  'use strict';

  var F = NM.Format;
  var el = F.el;

  var MACROS = ['protein', 'fat', 'carbs'];
  var SHORT = { protein: 'P', fat: 'F', carbs: 'C' };

  // One lit diamond per step up from the worst band, as on a tile, without the unlit ones.
  function band(tier) {
    var lit = NM.Fit.TIERS.length - NM.Fit.TIERS.map(function (t) { return t.id; }).indexOf(tier);
    var b = el('div', 'shelf-card-band');
    b.setAttribute('aria-hidden', 'true');
    b.appendChild(el('span', 'shelf-card-meter', new Array(lit + 1).join('◆')));
    b.appendChild(el('span', 'shelf-card-word', F.TIER_SHORT[tier]));
    return b;
  }

  function foods(entry, icons) {
    var list = el('ul', 'shelf-foods');
    entry.items.forEach(function (it) {
      var li = el('li', 'shelf-food');
      li.appendChild(F.icon(NM.Icons.picture(it.food, icons), 'shelf-food-icon'));
      li.appendChild(el('span', 'shelf-food-name', it.food.name));
      li.appendChild(el('span', 'shelf-food-dots'));
      li.appendChild(el('span', 'shelf-food-amount', F.amount(it.food, it.ml)));
      list.appendChild(li);
    });
    // A food not known: a food of your own removed, or not loaded yet. The meal still holds it.
    var missing = entry.meal.missing;
    if (missing) {
      var gone = el('li', 'shelf-food shelf-food-missing', missing + (missing === 1 ? ' food' : ' foods') + ' not found');
      gone.title = 'A food of your own that was removed, or has not loaded yet. The meal still holds it, and shows and scores without it.';
      list.appendChild(gone);
    }
    return list;
  }

  // One portion's ml, ml per 100 kcal and kcal; grams of each macro; then a tube each, full at one meal's share.
  function numbers(t, share) {
    var foot = el('div', 'shelf-card-nums');
    var line = el('div', 'shelf-card-line');
    [['', t.volume, ' ml'], ['shelf-card-density', NM.Nutrition.mlPer100Kcal(t.volume > 0 ? t.kcal / t.volume : 0), ' ml/100 kcal'], ['', t.kcal, ' kcal']]
      .forEach(function (n) {
        var d = el('div', n[0]);
        d.appendChild(el('b', null, F.num(n[1], 0)));
        d.appendChild(el('span', null, n[2]));
        line.appendChild(d);
      });
    foot.appendChild(line);
    var mac = el('div', 'shelf-card-macros');
    MACROS.forEach(function (k) { mac.appendChild(el('span', 'macro-' + k, SHORT[k] + ' ' + F.num(t[k]) + ' g')); });
    foot.appendChild(mac);
    var tubes = el('div', 'shelf-tubes');
    MACROS.forEach(function (k) {
      var tube = el('div', 'shelf-tube shelf-tube-' + k);
      var fill = el('span');
      fill.style.width = (Math.min(1, share[k] > 0 ? t[k] / share[k] : 0) * 100).toFixed(1) + '%';
      tube.appendChild(fill);
      tube.title = F.LABEL[k] + ' ' + F.num(t[k]) + ' g, against a meal’s share of ' + F.num(share[k]) + ' g';
      tubes.appendChild(tube);
    });
    foot.appendChild(tubes);
    return foot;
  }

  function link(text, key, disabled, onClick) {
    var b = el('button', 'shelf-card-link', text);
    b.type = 'button';
    b.dataset.focus = key;
    b.disabled = disabled;
    b.addEventListener('click', function () { onClick(b); });
    return b;
  }

  // The handle a card or a row is moved by: dragged by any pointer, or with the arrow keys.
  // A mouse can also drag the card, or the row's head, from anywhere off a button.
  function grip(key, label, title, disabled, onKey) {
    var b = el('button', 'shelf-grip', '⠿');
    b.type = 'button';
    b.dataset.focus = key;
    b.disabled = disabled;
    b.setAttribute('aria-label', label);
    b.title = title;
    b.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) < 0) return;
      e.preventDefault();
      onKey(e.key, b);
    });
    return b;
  }

  // ← → along its row; ↑ to the end of the row above, ↓ to the start of the row below, or past
  // the last row into a new one, which asks for its name.
  function cardKey(m, key, b, ctx) {
    var r = ctx.rows.findIndex(function (row) { return row.name === m.row; });
    var es = ctx.rows[r].entries;
    var i = es.findIndex(function (e) { return e.meal.id === m.id; });
    var next = ctx.rows[r + 1];
    if (key === 'ArrowLeft' && i > 0) ctx.onPlace(m, m.row, es[i - 1].meal.id);
    else if (key === 'ArrowRight' && i < es.length - 1) ctx.onPlace(m, m.row, es[i + 2] ? es[i + 2].meal.id : null);
    else if (key === 'ArrowUp' && r > 0) ctx.onPlace(m, ctx.rows[r - 1].name, null);
    else if (key === 'ArrowDown' && next) ctx.onPlace(m, next.name, next.entries[0].meal.id);
    else if (key === 'ArrowDown' && es.length > 1) ctx.onNewRow(m, b);
  }

  function rowKey(name, key, ctx) {
    var r = ctx.rows.findIndex(function (row) { return row.name === name; });
    if (key === 'ArrowUp' && r > 0) ctx.onPlaceRow(name, ctx.rows[r - 1].name);
    else if (key === 'ArrowDown' && r < ctx.rows.length - 1) ctx.onPlaceRow(name, ctx.rows[r + 2] ? ctx.rows[r + 2].name : null);
  }

  // ---- Dragging ----
  // A press on a card or a row becomes a drag once the pointer has moved a few pixels. The item
  // stays in the list as a dashed gap that moves to wherever it would drop, and a copy of it
  // follows the pointer. Near the list's top or bottom, the list scrolls. Escape puts it back;
  // a render drops the drag.

  var START_PX = 5;
  var EDGE_PX = 48;
  var drag = null;

  function press(e, kind, item, ctx) {
    var onGrip = e.target.closest('.shelf-grip');
    if (drag || e.button !== 0 || !ctx.online) return;
    if (!onGrip && (e.pointerType !== 'mouse' || e.target.closest('button, input, a, label'))) return;
    drag = {
      kind: kind, item: item, ctx: ctx, root: item.closest('.shelf-body'), pointer: e.pointerId,
      x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, live: false,
      home: item.parentNode, homeNext: item.nextElementSibling, ghost: null, zone: null, frame: 0
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    document.addEventListener('keydown', onKey, true);
  }

  function lift() {
    var d = drag;
    d.live = true;
    var shown = d.kind === 'row' ? d.item.querySelector('.shelf-row-head') : d.item;
    var r = shown.getBoundingClientRect();
    var ghost = d.kind === 'row' ? el('div') : d.item.cloneNode(true);
    if (d.kind === 'row') ghost.appendChild(shown.cloneNode(true));
    ghost.classList.add('shelf-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = r.width + 'px';
    ghost.style.left = r.left + 'px';
    ghost.style.top = r.top + 'px';
    document.body.appendChild(ghost);
    d.ghost = ghost;
    d.item.classList.add('is-lifted');
    d.root.classList.add(d.kind === 'row' ? 'is-sorting-rows' : 'is-sorting-cards');
    document.body.classList.add('shelf-dragging');
    if (window.getSelection) window.getSelection().removeAllRanges();
    // Only the rows' heads are left while a row moves: keep the lifted one under the pointer.
    if (d.kind === 'row') d.root.scrollTop += shown.getBoundingClientRect().top - r.top;
    d.frame = requestAnimationFrame(scroll);
  }

  function onMove(e) {
    var d = drag;
    if (!d || e.pointerId !== d.pointer) return;
    d.x = e.clientX; d.y = e.clientY;
    if (!d.live) {
      if (Math.abs(d.x - d.x0) + Math.abs(d.y - d.y0) < START_PX) return;
      lift();
    }
    e.preventDefault();
    d.ghost.style.transform = 'translate(' + (d.x - d.x0) + 'px, ' + (d.y - d.y0) + 'px)';
    locate();
  }

  // Moves the gap to where the pointer is. A card in the gap's own row gives up its slot to the
  // gap as soon as the pointer is on it; one in another row takes the gap before or after it, by
  // which half of the card the pointer is on. Past a row's last card, the gap goes to its end.
  // Anywhere else, between cards included, the gap stays where it is.
  function locate() {
    var d = drag;
    var hit = document.elementFromPoint(d.x, d.y);
    if (!hit || !d.root.contains(hit)) return;
    var zone = d.kind === 'card' ? hit.closest('.shelf-new-row') : null;
    if (d.zone !== zone) {
      if (d.zone) d.zone.classList.remove('is-over');
      if (zone) zone.classList.add('is-over');
      d.zone = zone;
    }
    if (zone) return;
    var r;
    if (d.kind === 'row') {
      var section = hit.closest('.shelf-row');
      if (!section || section === d.item) return;
      r = section.getBoundingClientRect();
      d.root.insertBefore(d.item, d.y > r.top + r.height / 2 ? section.nextSibling : section);
      return;
    }
    var card = hit.closest('.shelf-card');
    if (card === d.item) return;
    if (card) {
      var plank = card.parentNode, after;
      if (plank === d.item.parentNode) {
        var at = Array.prototype.indexOf;
        after = at.call(plank.children, card) > at.call(plank.children, d.item);
      } else {
        var across = getComputedStyle(plank).gridTemplateColumns.split(' ').length > 1;
        r = card.getBoundingClientRect();
        after = across ? d.x > r.left + r.width / 2 : d.y > r.top + r.height / 2;
      }
      plank.insertBefore(d.item, after ? card.nextSibling : card);
      return;
    }
    var row = hit.closest('.shelf-row');
    if (!row) return;
    var shelved = row.querySelectorAll('.shelf-plank > .shelf-card:not(.is-lifted)');
    if (shelved.length) {
      r = shelved[shelved.length - 1].getBoundingClientRect();
      if (d.y < r.top || (d.y <= r.bottom && d.x < r.right)) return;
    }
    row.querySelector('.shelf-plank').appendChild(d.item);
  }

  // Scrolls the list while the pointer is near its top or bottom, faster the nearer.
  function scroll() {
    var d = drag;
    if (!d || !d.live) return;
    var r = d.root.getBoundingClientRect();
    var by = d.y < r.top + EDGE_PX ? d.y - r.top - EDGE_PX : d.y > r.bottom - EDGE_PX ? d.y - r.bottom + EDGE_PX : 0;
    if (by) {
      var was = d.root.scrollTop;
      d.root.scrollTop += Math.max(-EDGE_PX, Math.min(EDGE_PX, by)) / 3;
      if (d.root.scrollTop !== was) locate();
    }
    d.frame = requestAnimationFrame(scroll);
  }

  // Ends the drag, if any, and returns it. `back` puts the item where it was lifted from.
  function end(back) {
    var d = drag;
    drag = null;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    document.removeEventListener('keydown', onKey, true);
    if (!d || !d.live) return d;
    cancelAnimationFrame(d.frame);
    d.ghost.remove();
    d.item.classList.remove('is-lifted');
    d.root.classList.remove('is-sorting-rows', 'is-sorting-cards');
    document.body.classList.remove('shelf-dragging');
    if (d.zone) d.zone.classList.remove('is-over');
    if (back && d.home.isConnected) d.home.insertBefore(d.item, d.homeNext);
    return d;
  }

  function onCancel(e) { if (drag && e.pointerId === drag.pointer) end(true); }

  // Taken before the shelf's own Escape, so the shelf stays open.
  function onKey(e) {
    if (e.key !== 'Escape' || !drag) return;
    e.preventDefault();
    e.stopPropagation();
    end(true);
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.pointer) return;
    var d = drag, item = d.item, ctx = d.ctx;
    var next = item.nextElementSibling;
    var moved = item.parentNode !== d.home || next !== d.homeNext;
    // A card dropped to start a new row goes back until the row is named, and stays back if it is not.
    end(!!d.zone);
    if (!d.live) return;
    if (d.kind === 'row') {
      if (moved) ctx.onPlaceRow(item.dataset.row, next && next.classList.contains('shelf-row') ? next.dataset.row : null);
      return;
    }
    var m = ctx.byId[item.dataset.id];
    if (d.zone) ctx.onNewRow(m, d.zone);
    else if (moved) ctx.onPlace(m, item.closest('.shelf-row').dataset.row, next ? next.dataset.id : null);
  }

  function card(entry, ctx) {
    var m = entry.meal, fit = entry.fit.tier;
    var c = el('article', 'shelf-card fit-' + fit + (ctx.online ? ' is-movable' : ''));
    c.dataset.id = m.id;
    c.setAttribute('aria-label', m.name + ': ' + F.TIER_LABEL[fit]);
    c.appendChild(grip('shelf-grip:' + m.id, 'Move “' + m.name + '”',
      'Drag to move. Arrow keys: ← → along the row, ↑ ↓ to the row above or below', !ctx.online,
      function (key, b) { cardKey(m, key, b, ctx); }));
    c.addEventListener('pointerdown', function (e) { press(e, 'card', c, ctx); });
    c.addEventListener('dragstart', function (e) { e.preventDefault(); });
    c.appendChild(el('h4', 'shelf-card-name', m.name));
    c.appendChild(band(fit));
    // How many portions the recipe makes; set on the server, so not while it cannot be reached.
    var n = m.portions;
    var portions = NM.Portions.stepper(n, 'shelf-portions:' + m.id, '“' + m.name + '”', !ctx.online,
      function (v) { ctx.onPortions(m, v); });
    if (!ctx.online) portions.title = 'The shelf cannot be reached';
    c.appendChild(portions);
    c.appendChild(el('div', 'shelf-foods-cap', n === 1 ? 'Makes one portion' : 'The recipe, for ' + n));
    c.appendChild(foods(entry, ctx.icons));

    // The numbers are one portion's.
    var foot = el('div', 'shelf-card-foot');
    foot.appendChild(NM.Portions.caption(n, 'The whole meal'));
    foot.appendChild(numbers(entry.totals, ctx.share));
    var into = el('button', 'shelf-card-into', ctx.into ? 'Into ' + ctx.into : 'Select a meal');
    into.type = 'button';
    into.dataset.focus = 'shelf-into:' + m.id;
    // A meal whose every food is not found has nothing to put in.
    var empty = !entry.items.length;
    into.disabled = !ctx.into || empty;
    into.title = empty ? 'None of its foods is found' : !ctx.into ? 'Select a meal to put this into'
      : 'Add the whole meal to ' + ctx.into;
    into.addEventListener('click', function () { ctx.onInto(m); });
    foot.appendChild(into);

    var links = el('div', 'shelf-card-links');
    var off = !ctx.online;
    [
      link('New meal', 'shelf-new:' + m.id, empty, function () { ctx.onNewMeal(m); }),
      link('Rename', 'shelf-rename:' + m.id, off, function (b) { ctx.onRename(m, b); }),
      link('Copy', 'shelf-copy:' + m.id, off, function () { ctx.onCopy(m); }),
      link('Remove', 'shelf-remove:' + m.id, off, function (b) { ctx.onRemove(m, b); })
    ].forEach(function (b) { links.appendChild(b); });
    foot.appendChild(links);
    c.appendChild(foot);
    return c;
  }

  // `ctx`: { rows [{ name, entries [{ meal, items [{food, ml}] (the whole recipe), totals (one portion's),
  // fit }] }], total (meals on the shelf, before the search), query, online, note (a line on the
  // shelf's state, or ''), into (the selected meal's name, or null for the day), share (one meal's share of the target), icons, onInto(meal), onNewMeal(meal),
  // onPortions(meal, count), onRename(meal, button), onCopy(meal), onRemove(meal, button),
  // onRenameRow(name, button), onPlace(meal, row, before: a meal's id or null),
  // onPlaceRow(name, before: a row's name or null), onNewRow(meal, anchor) }.
  function render(root, ctx) {
    end(false);
    ctx.byId = {};
    ctx.rows.forEach(function (row) { row.entries.forEach(function (e) { ctx.byId[e.meal.id] = e.meal; }); });
    root.textContent = '';
    if (ctx.note) root.appendChild(el('p', 'shelf-note', ctx.note));
    if (!ctx.rows.length) {
      root.appendChild(el('p', 'shelf-empty', ctx.total
        ? 'No premade meal matches “' + ctx.query.trim() + '”.'
        : 'Nothing on the shelf yet. Select a meal and shelve it.'));
      return;
    }
    ctx.rows.forEach(function (row) {
      var section = el('section', 'shelf-row');
      section.dataset.row = row.name;
      var head = el('div', 'shelf-row-head' + (ctx.online ? ' is-movable' : ''));
      head.appendChild(grip('shelf-row-grip:' + row.name, 'Move the row “' + row.name + '”',
        'Drag to move the row. Arrow keys: ↑ ↓', !ctx.online, function (key) { rowKey(row.name, key, ctx); }));
      head.addEventListener('pointerdown', function (e) { press(e, 'row', section, ctx); });
      var name = el('button', 'shelf-row-name', row.name);
      name.type = 'button';
      name.dataset.focus = 'shelf-row:' + row.name;
      name.disabled = !ctx.online;
      name.title = 'Rename this row';
      name.addEventListener('click', function () { ctx.onRenameRow(row.name, name); });
      head.appendChild(name);
      head.appendChild(el('span', 'shelf-row-count', String(row.entries.length)));
      section.appendChild(head);
      var plank = el('div', 'shelf-plank');
      row.entries.forEach(function (entry) { plank.appendChild(card(entry, ctx)); });
      section.appendChild(plank);
      root.appendChild(section);
    });
    if (ctx.online) root.appendChild(el('div', 'shelf-new-row', 'Drop a meal here to start a new row'));
  }

  NM.ShelfView = { render: render };
})(window.NM = window.NM || {});
