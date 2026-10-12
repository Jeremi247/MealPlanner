(function () {
  'use strict';

  var foods = NM.Nutrition.normalise(NM.categories);
  var byId = {};
  foods.forEach(function (f) { byId[f.id] = f; });
  var target = { kcal: 1800, protein: 135, fat: 60, carbs: 165, volume: 2250 };

  function meal(id, row, name, items) { return { id: id, name: name || id, row: row, items: items || [{ id: 'skyr', ml: 200 }] }; }

  T.test('Shelf.CleanKeepsWellFormedMealsAndDropsTheRest', function () {
    var doc = { meals: [
      meal('a', 'Breakfast'),
      { id: 'b', name: '', row: 'Lunch', items: [{ id: 'skyr', ml: 100 }] },
      { id: 'c', name: 'No row', items: [{ id: 'skyr', ml: 100 }] },
      { id: 'd', name: 'Bad amounts', row: 'Lunch', items: [{ id: 'skyr', ml: '100' }, { id: 'tuna', ml: -5 }, { id: 'cod', ml: Infinity }] },
      null, 'junk'
    ] };
    var out = NM.Shelf.clean(doc, byId);
    T.eq(out.length, 1, 'only the well-formed meal');
    T.eq(out[0].id, 'a');
    T.eq(NM.Shelf.clean(null, byId).length, 0, 'no shelf is an empty one');
    T.eq(NM.Shelf.clean({ meals: 'x' }, byId).length, 0, 'a shelf without a list is empty');
  });

  T.test('Shelf.ANameIsMeasuredInCharactersAsTheServerCountsThem', function () {
    // 52 letters and an emoji, copied: 60 characters on the server, 61 in a JS string's length.
    var name = new Array(53).join('a') + '🍳 (copy)';
    var out = NM.Shelf.clean({ meals: [meal('a', 'R', name)] }, byId);
    T.eq(out.length, 1, 'a copy whose name has an emoji is kept');
    T.eq(NM.Shelf.clean({ meals: [meal('a', 'R', name + 'x')] }, byId).length, 0, 'one character over is dropped');
  });

  T.test('Shelf.AFoodNotKnownIsCountedAndAMealOfNoneStaysToBeRemoved', function () {
    var out = NM.Shelf.clean({ meals: [
      meal('a', 'R', 'Mixed', [{ id: 'skyr', ml: 200 }, { id: 'dragonfruit', ml: 100 }]),
      meal('b', 'R', 'Gone', [{ id: 'my-0123456789ab', ml: 100 }])
    ] }, byId);
    T.eq(JSON.stringify(out[0].items), JSON.stringify([{ id: 'skyr', ml: 200 }]), 'the unknown food is left out');
    T.eq(out[0].missing, 1, 'and counted');
    T.eq(out.length, 2, 'a meal of foods not known stays, so it can be removed');
    T.eq(out[1].items.length + '/' + out[1].missing, '0/1', 'with nothing to show but the count');
    T.ok(NM.Shelf.matches(out[1], 'gone', byId), 'and is found by its name');
  });

  function ids(meals) { return meals.map(function (m) { return m.id; }).join(','); }

  T.test('Shelf.RowsFollowTheirFirstMealInTheShelfsOrder', function () {
    var rows = NM.Shelf.rows([meal('a', 'Lunch'), meal('b', 'Breakfast'), meal('c', 'Lunch'), meal('d', 'Dinner'), meal('e', 'Breakfast')]);
    T.eq(rows.map(function (r) { return r.name; }).join(','), 'Lunch,Breakfast,Dinner', 'row order');
    T.eq(ids(rows[0].meals), 'a,c', 'shelf order in a row');
    T.eq(NM.Shelf.rows([meal('a', 'constructor'), meal('b', 'toString')]).length, 2, 'a row may be named anything');
    T.eq(NM.Shelf.rowNames([]).length, 0, 'an empty shelf has no rows');
  });

  // Rows A, B and C, holding a1 a2, b1 b2 and c1, as Tests/test_shelf.py's three_rows.
  function threeRows() { return [meal('a1', 'A'), meal('a2', 'A'), meal('b1', 'B'), meal('b2', 'B'), meal('c1', 'C')]; }

  T.test('Shelf.PlaceMovesAMealAsTheServerDoes', function () {
    var s = threeRows();
    T.eq(ids(NM.Shelf.place(s, 'b2', 'B', 'b1')), 'a1,a2,b2,b1,c1', 'within a row');
    T.eq(ids(NM.Shelf.place(s, 'a1', 'A', null)), 'a2,a1,b1,b2,c1', 'the row keeps its place when its first meal moves');
    var into = NM.Shelf.place(s, 'c1', 'A', 'a2');
    T.eq(ids(into), 'a1,c1,a2,b1,b2', 'into another row');
    T.eq(into[1].row, 'A', 'takes the row');
    T.eq(s[4].row, 'C', 'the shelf it was given is not changed');
    var fresh = NM.Shelf.place(s, 'a1', 'D', null);
    T.eq(ids(fresh) + '/' + fresh[4].row, 'a2,b1,b2,c1,a1/D', 'a row no meal is in starts at the end');
    T.eq(NM.Shelf.place(s, 'a1', 'A', 'b1'), null, 'a before in another row');
    T.eq(NM.Shelf.place(s, 'a1', 'A', 'a1'), null, 'before itself');
    T.eq(NM.Shelf.place(s, 'zz', 'A', null), null, 'a meal not on the shelf');
  });

  T.test('Shelf.PlaceRowMovesEveryMealInItTogether', function () {
    var s = threeRows();
    T.eq(ids(NM.Shelf.placeRow(s, 'C', 'A')), 'c1,a1,a2,b1,b2', 'before a row');
    T.eq(ids(NM.Shelf.placeRow(s, 'A', 'C')), 'b1,b2,a1,a2,c1', 'before a later row');
    T.eq(ids(NM.Shelf.placeRow(s, 'A', null)), 'b1,b2,c1,a1,a2', 'to the end');
    T.eq(NM.Shelf.placeRow(s, 'Z', null), null, 'a row not on the shelf');
    T.eq(NM.Shelf.placeRow(s, 'A', 'Z'), null, 'before a row not on the shelf');
    T.eq(NM.Shelf.placeRow(s, 'A', 'A'), null, 'before itself');
  });

  T.test('Shelf.IntoAddsOnTopSummingAFoodAlreadyInTheMeal', function () {
    var day = [{ id: 'skyr', ml: 100 }, { id: 'oil', ml: 15 }];
    var out = NM.Shelf.into(day, [{ id: 'strawberries', ml: 200 }, { id: 'skyr', ml: 200 }]);
    T.eq(JSON.stringify(out), JSON.stringify([{ id: 'skyr', ml: 300 }, { id: 'oil', ml: 15 }, { id: 'strawberries', ml: 200 }]));
    T.eq(day[0].ml, 100, 'the meal it was given is not changed');
  });

  T.test('Shelf.SearchMatchesNameRowOrAFood', function () {
    var m = meal('a', 'Breakfast', 'Berry bowl', [{ id: 'skyr', ml: 200 }, { id: 'strawberries', ml: 200 }]);
    ['berry', 'BREAK', 'strawb', '', '  '].forEach(function (q) { T.ok(NM.Shelf.matches(m, q, byId), q + ' matches'); });
    T.ok(!NM.Shelf.matches(m, 'tuna', byId), 'tuna does not');
  });

  // A premade meal of one food at its default portion is the same addition as that food's tile.
  T.test('Fit.AOneFoodMealScoresAsItsTileDoes', function () {
    var day = [{ food: byId['peanut-butter'], ml: 15 }, { food: byId['chicken-breast'], ml: 150 }];
    [[], day].forEach(function (items) {
      var ranked = NM.Fit.rank(foods, items, target, 3).results;
      ['oil', 'lentils', 'broccoli', 'eggs'].forEach(function (id) {
        var f = byId[id];
        var r = NM.Fit.scoreMeal(items, NM.Nutrition.amount(f, f.defaultMl), target, 3);
        T.near(r.norm, ranked[id].norm, 1e-12, id + ' with ' + items.length + ' foods eaten');
        T.eq(r.tier, ranked[id].tier, id + ' band');
      });
    });
  });

  T.test('Fit.AMealThatBurstsTheDayIsAgainst', function () {
    var day = [{ food: byId['lean-beef'], ml: 900 }];
    var big = NM.Nutrition.totals([{ food: byId['oil'], ml: 90 }, { food: byId['white-rice'], ml: 600 }]);
    T.eq(NM.Fit.scoreMeal(day, big, target, 3).tier, 'against');
  });

  T.test('ShelfStore.AMissingOrMalformedCopyIsNone', function () {
    var KEY = 'nutrientmanager.shelf.v1';
    var saved;
    try { saved = window.localStorage.getItem(KEY); } catch (e) { return; /* no storage to test */ }
    try {
      window.localStorage.removeItem(KEY);
      T.eq(NM.ShelfStore.cached(), null, 'missing');
      window.localStorage.setItem(KEY, '{not json');
      T.eq(NM.ShelfStore.cached(), null, 'not JSON');
      window.localStorage.setItem(KEY, JSON.stringify({ doc: { meals: 'x' }, at: 1 }));
      T.eq(NM.ShelfStore.cached(), null, 'no list of meals');
      window.localStorage.setItem(KEY, JSON.stringify({ doc: { meals: [] }, at: 5 }));
      T.eq(NM.ShelfStore.cached().at, 5, 'a good copy');
    } finally {
      if (saved === null) window.localStorage.removeItem(KEY); else window.localStorage.setItem(KEY, saved);
    }
  });
})();
