// Number and label formatting shared by the views.
(function (NM) {
  'use strict';

  var LABEL = { protein: 'Protein', fat: 'Fat', carbs: 'Carbs', volume: 'Volume', kcal: 'kcal' };
  var TIER_LABEL = {
    recommended: 'Recommended', alright: 'Alright to add', may: 'You may add it',
    doubtful: 'Might not be the best idea, but sure', against: 'Recommended against adding it'
  };
  // The band's word on a tile's frame, short enough to fit the gap in its top line.
  var TIER_SHORT = { recommended: 'Best', alright: 'Alright', may: 'May fit', doubtful: 'Doubtful', against: 'Against' };
  var UNIT = { protein: 'g', fat: 'g', carbs: 'g', volume: 'ml', kcal: 'kcal' };

  function num(x, digits) {
    if (!isFinite(x)) return '∞';
    if (digits === undefined) digits = Math.abs(x) >= 10 ? 0 : 1;
    var s = x.toFixed(digits);
    return s.indexOf('.') >= 0 ? s.replace(/\.?0+$/, '') : s;
  }

  // A listed value, as the reference table wrote it: a number or a "min–max" range.
  function listed(v, scale) {
    scale = scale || 1;
    if (Array.isArray(v)) return num(v[0] * scale) + '–' + num(v[1] * scale);
    return num(v * scale);
  }

  // An estimated weight of food, marked as an estimate (docs/decisions/0004-estimates-are-marked-not-hidden.md).
  var GRAMS_TITLE = 'Estimated weight — not from the reference table';
  function grams(g) { return '~' + num(g, 0) + ' g'; }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // A food's picture, from Icons.picture. Decorative: the food's name always sits beside it.
  // Minimal paths draw as an inline SVG filled with `currentColor`.
  function icon(pic, cls) {
    if (pic.paths) {
      var svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('class', cls + ' icon-minimal');
      svg.setAttribute('viewBox', '0 0 32 32');
      svg.setAttribute('width', '32');
      svg.setAttribute('height', '32');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      pic.paths.forEach(function (p) {
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', typeof p === 'string' ? p : p[0]);
        if (typeof p !== 'string') path.setAttribute('fill-rule', p[1]);
        svg.appendChild(path);
      });
      return svg;
    }
    var img = el('img', cls);
    img.src = pic.src;
    img.alt = '';
    return img;
  }

  NM.Format = { LABEL: LABEL, TIER_LABEL: TIER_LABEL, TIER_SHORT: TIER_SHORT, UNIT: UNIT, num: num, listed: listed, grams: grams, GRAMS_TITLE: GRAMS_TITLE, el: el, icon: icon };
})(window.NM = window.NM || {});
