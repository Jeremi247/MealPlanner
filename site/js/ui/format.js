// Number and label formatting shared by the views.
(function (NM) {
  'use strict';

  var LABEL = { protein: 'Protein', fat: 'Fat', carbs: 'Carbs', volume: 'Volume', kcal: 'kcal' };
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

  function percent(f) {
    var p = Math.round(f * 100);
    return (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%';
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  NM.Format = { LABEL: LABEL, UNIT: UNIT, num: num, listed: listed, percent: percent, el: el };
})(window.NM = window.NM || {});
