// What a tile plays when clicked: for an add, two stepped neon rings echoing out of the frame,
// a stepped flash of the band inside it and the amount floating up; for a refused click, a shake
// of the tile and of the day card's hint.
(function (NM) {
  'use strict';

  var el = NM.Format.el;

  // How long app.js keeps a click for: at least the longest effect in site/css/app.css.
  var LIFETIME_MS = 700;

  function aged(node, age) {
    node.style.animationDelay = -Math.round(age) + 'ms';
    return node;
  }

  function layer(className, age, text) {
    var node = el('span', className, text);
    node.setAttribute('aria-hidden', 'true');
    return aged(node, age);
  }

  // Adds to a freshly built tile the effects of its clicks still playing, oldest first:
  // [{ kind: 'add' or 'refused', age (ms since the click) }]. Each starts `age` ms into its
  // animation, so a render continues an effect and several adds stack. `label` is what one
  // click adds, as the tile's foot words it.
  function decorate(t, effects, label) {
    if (!effects || !effects.length) return;
    var adds = effects.filter(function (e) { return e.kind === 'add'; });
    var refused = effects.filter(function (e) { return e.kind === 'refused'; });
    t.classList.add('has-fx');
    // One flash, for the latest add: stacked, the band would wash out the tile.
    if (adds.length) t.appendChild(layer('fx-fill', adds[adds.length - 1].age));
    adds.forEach(function (e) {
      t.appendChild(layer('fx-ring fx-ring-gold', e.age));
      t.appendChild(layer('fx-ring fx-ring-band', e.age));
      t.appendChild(layer('fx-float', e.age, label));
    });
    if (refused.length) refuse(t, refused[refused.length - 1].age);
  }

  // Plays the refused click on `node`, `age` ms in: the tile and the day card's hint both use it.
  function refuse(node, age) { aged(node, age).classList.add('is-refused'); }

  NM.Fx = { decorate: decorate, refuse: refuse, LIFETIME_MS: LIFETIME_MS };
})(window.NM = window.NM || {});
