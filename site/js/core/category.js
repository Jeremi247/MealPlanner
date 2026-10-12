// Which category a food belongs in, from its kcal and macros: the first rule it meets, in
// order, with starch taking what none of the others does
// (docs/decisions/0025-a-foods-category-follows-its-macros.md). Every table row sits where
// these put it, and a food of your own is offered the category they suggest.
(function (NM) {
  'use strict';

  // Volume: under this many kcal per 100 ml.
  var VOLUME_KCAL = 30;
  // Fat: fat gives at least this share of the kcal.
  var FAT_SHARE = 0.5;
  // Protein: protein gives at least this share of the kcal, and the food holds this many grams
  // of protein per 100 ml, the protein category's one limit.
  var PROTEIN_SHARE = 0.35;
  var PROTEIN_FLOOR = 6;

  // `perMl` is { kcal, protein, fat, carbs } per ml, as Nutrition.normalise gives it.
  // Answers { id, why }: the category's id, and the rule that put it there in a few words.
  function suggest(perMl) {
    var kcal100 = perMl.kcal * 100;
    var fatShare = perMl.kcal > 0 ? perMl.fat * 9 / perMl.kcal : 0;
    var proteinShare = perMl.kcal > 0 ? perMl.protein * 4 / perMl.kcal : 0;
    var protein100 = perMl.protein * 100;
    function pct(x) { return Math.round(x * 100) + '%'; }
    if (kcal100 < VOLUME_KCAL) return { id: 'volume', why: 'under ' + VOLUME_KCAL + ' kcal per 100 ml' };
    if (fatShare >= FAT_SHARE) return { id: 'fat', why: 'fat gives ' + pct(fatShare) + ' of its kcal' };
    if (proteinShare >= PROTEIN_SHARE && protein100 >= PROTEIN_FLOOR) {
      return { id: 'protein', why: 'protein gives ' + pct(proteinShare) + ' of its kcal' };
    }
    return {
      id: 'starch',
      why: proteinShare >= PROTEIN_SHARE ? 'under ' + PROTEIN_FLOOR + ' g protein per 100 ml' : 'protein gives only ' + pct(proteinShare) + ' of its kcal'
    };
  }

  NM.Category = {
    VOLUME_KCAL: VOLUME_KCAL, FAT_SHARE: FAT_SHARE, PROTEIN_SHARE: PROTEIN_SHARE, PROTEIN_FLOOR: PROTEIN_FLOOR,
    suggest: suggest
  };
})(window.NM = window.NM || {});
