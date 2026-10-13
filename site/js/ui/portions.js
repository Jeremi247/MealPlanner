// The count of portions a meal makes, with − and + either side of it, shared by a meal card in
// the sidebar and a card on the shelf (docs/decisions/0027-a-meal-says-how-many-portions-it-makes.md).
(function (NM) {
  'use strict';

  var el = NM.Format.el;
  var MAX = NM.Nutrition.PORTIONS_MAX;

  // A stepper showing `n`. `key` prefixes its controls' focus keys; `what` names the meal in their
  // labels; `disabled` greys it all out; `onSet(count)` is given a new count from 1 to the most.
  // The count can be typed, then taken with Enter or by leaving it, or stepped with ↑ ↓.
  function stepper(n, key, what, disabled, onSet) {
    var box = el('div', 'portions');
    function set(v) {
      v = Math.round(v);
      if (!isFinite(v)) v = n;
      v = Math.max(1, Math.min(MAX, v));
      if (v !== n) onSet(v);
      else count.value = n;
    }
    function stepKey(cls, text, label, focus, dir) {
      var b = el('button', 'portions-key ' + cls, text);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.dataset.focus = key + ':' + focus;
      b.disabled = disabled;
      // At the limit it stays focusable, so a key held down to it keeps focus; `set` ignores it.
      if (dir < 0 ? n <= 1 : n >= MAX) b.setAttribute('aria-disabled', 'true');
      b.addEventListener('click', function () { set(n + dir); });
      return b;
    }
    var mid = el('label', 'portions-mid');
    var count = el('input', 'portions-count');
    count.type = 'number'; count.min = '1'; count.max = String(MAX); count.step = '1';
    count.inputMode = 'numeric';
    count.value = n;
    count.disabled = disabled;
    count.setAttribute('aria-label', 'Portions ' + what + ' makes');
    count.dataset.focus = key + ':count';
    count.addEventListener('change', function () { set(parseFloat(count.value)); });
    count.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); set(n + (e.key === 'ArrowUp' ? 1 : -1)); }
    });
    count.addEventListener('focus', function () { count.select(); });
    mid.appendChild(count);
    mid.appendChild(el('span', 'portions-word', n === 1 ? 'portion' : 'portions'));
    box.appendChild(stepKey('portions-less', '−', 'One portion fewer', 'less', -1));
    box.appendChild(mid);
    box.appendChild(stepKey('portions-more', '+', 'One portion more', 'more', 1));
    return box;
  }

  // The caption a split card's numbers sit under: *One portion · 1 of N*, or `whole` for one portion.
  function caption(n, whole) {
    var c = el('div', 'portions-cap');
    if (n === 1) { c.textContent = whole; return c; }
    c.appendChild(document.createTextNode('One portion '));
    c.appendChild(el('em', null, '· 1 of ' + n));
    return c;
  }

  NM.Portions = { stepper: stepper, caption: caption };
})(window.NM = window.NM || {});
