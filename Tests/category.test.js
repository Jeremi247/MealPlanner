// The rules that put a food in its category (site/js/core/category.js), against the table and
// at their edges.
(function () {
  'use strict';

  var C = NM.Category;

  // Per 100 ml, as a food row writes them, turned to per ml as Category.suggest takes them.
  function per100(kcal, protein, fat, carbs) {
    return { kcal: kcal / 100, protein: protein / 100, fat: fat / 100, carbs: carbs / 100 };
  }

  T.test('Category.EveryTableFoodSitsWhereTheRulesPutIt', function () {
    NM.Nutrition.normalise(NM.categories).forEach(function (f) {
      var s = C.suggest(f.perMl);
      T.eq(s.id, f.category, f.id + ' (' + s.why + ')');
    });
  });

  T.test('Category.TheRulesAreTriedInOrder', function () {
    // All fat, but under 30 kcal per 100 ml: volume comes first.
    T.eq(C.suggest(per100(20, 0, 2.2, 0)).id, 'volume', 'a thin fatty food');
    // Half its kcal from fat and the rest from protein: fat comes before protein.
    T.eq(C.suggest(per100(200, 25, 12, 0)).id, 'fat', 'a fatty protein food');
    T.eq(C.suggest(per100(100, 20, 0, 5)).id, 'protein', 'a lean protein food');
    T.eq(C.suggest(per100(100, 3, 0.5, 20)).id, 'starch', 'what none of the others takes');
  });

  T.test('Category.EachRuleHoldsEitherSideOfItsLine', function () {
    T.eq(C.suggest(per100(29, 0, 0, 7.5)).id, 'volume', '29 kcal per 100 ml');
    T.eq(C.suggest(per100(31, 0, 0, 7.5)).id, 'starch', '31 kcal per 100 ml');
    T.eq(C.suggest(per100(90, 2, 5.1, 9)).id, 'fat', 'fat gives 51%');
    T.eq(C.suggest(per100(90, 2, 4.9, 9.2)).id, 'starch', 'fat gives 49%');
    T.eq(C.suggest(per100(80, 7.2, 1, 11)).id, 'protein', 'protein gives 36%');
    T.eq(C.suggest(per100(80, 6.8, 1, 11)).id, 'starch', 'protein gives 34%');
    // Skim milk: 40% of its kcal from protein, but under the protein category's 6 g.
    var milk = C.suggest(per100(34, 3.4, 0.1, 5));
    T.eq(milk.id, 'starch', 'under the protein floor');
    T.ok(/6 g/.test(milk.why), 'says it is the floor: ' + milk.why);
  });

  T.test('Category.AFoodWithNoKcalIsVolume', function () {
    T.eq(C.suggest(per100(0, 0, 0, 0)).id, 'volume', 'water');
  });
})();
