(function () {
  'use strict';

  // Replaces window.localStorage for the duration of fn.
  function withStorage(fake, fn) {
    var desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return fake(); } });
    try { fn(); } finally { Object.defineProperty(window, 'localStorage', desc); }
  }

  function saved(obj) {
    var raw = JSON.stringify(obj);
    return function () { return { getItem: function () { return raw; }, setItem: function () {} }; };
  }

  T.test('Store.UnavailableStorageGivesTheDefaults', function () {
    withStorage(function () { throw new Error('blocked'); }, function () {
      var s = NM.Store.load();
      T.eq(s.target.kcal, NM.Store.DEFAULTS.target.kcal, 'default target');
      T.eq(s.meals.length, 3, 'three meals');
      T.eq(s.meals[0].length, 0, 'each empty');
      T.eq(s.selected, 0, 'the first meal selected');
      NM.Store.save(s); // must not throw
    });
  });

  T.test('Store.MalformedFieldsAreDroppedNotTrusted', function () {
    withStorage(saved({
      target: { kcal: -5, protein: 'x', fat: 30 },
      meals: [[{ id: 'oil', ml: 15 }, { id: 3 }, { id: 'cod', ml: 0 }, { id: 'tuna', ml: '150' }, { id: 'oil', ml: 30 }], 'x'],
      selected: 1
    }), function () {
      var s = NM.Store.load();
      T.eq(s.target.kcal, NM.Store.DEFAULTS.target.kcal, 'negative kcal rejected');
      T.eq(s.target.protein, NM.Store.DEFAULTS.target.protein, 'string protein rejected');
      T.eq(s.target.fat, 30, 'valid fat kept');
      T.eq(s.meals.length, 2, 'both saved meals kept');
      T.eq(s.meals[0].length, 1, 'only the first well-formed entry survives: no zero, text or repeated id');
      T.eq(s.meals[0][0].ml, 15, 'the first oil entry is kept');
      T.eq(s.meals[1].length, 0, 'a meal that is not a list is empty');
      T.eq(s.selected, 1, 'a valid selection is kept');
      T.eq(s.view.colours, 'day', 'colours default to the day');
    });
  });

  T.test('Store.ASelectionThatNamesNoMealFallsBackToTheFirst', function () {
    [5, -1, 0.5, 'lunch', null].forEach(function (sel) {
      withStorage(saved({ meals: [[], []], selected: sel }), function () {
        T.eq(NM.Store.load().selected, 0, JSON.stringify(sel));
      });
    });
    withStorage(saved({ view: { colours: 'meal' } }), function () {
      T.eq(NM.Store.load().view.colours, 'day', 'an unknown colour mode is the day');
    });
    withStorage(saved({ view: { colours: 'selection' } }), function () {
      T.eq(NM.Store.load().view.colours, 'selection', 'selection colours are kept');
    });
    withStorage(saved({ meals: [], selected: 'day' }), function () {
      var s = NM.Store.load();
      T.eq(s.meals.length, 3, 'no meals gives the default three');
      T.eq(s.selected, 'day', 'the day stays selected');
    });
  });

  T.test('Store.AnUnknownIconStyleIsTheEmoji', function () {
    withStorage(saved({ view: { icons: 'pixel' } }), function () {
      T.eq(NM.Store.load().view.icons, 'emoji', 'an unknown icon style is the emoji');
    });
    withStorage(saved({ view: { icons: 'minimal' } }), function () {
      T.eq(NM.Store.load().view.icons, 'minimal', 'minimal icons are kept');
    });
    withStorage(saved({ view: {} }), function () {
      T.eq(NM.Store.load().view.icons, 'emoji', 'saved state from before the switch gets the emoji');
    });
  });

  T.test('Store.AV1PlateBecomesTheFirstMealAndItsTargetIsDropped', function () {
    var v1 = JSON.stringify({ target: { kcal: 600, protein: 45 }, plate: [{ id: 'oil', ml: 15 }, { id: 'cod', ml: 0 }] });
    withStorage(function () {
      return { getItem: function (k) { return k === 'nutrientmanager.v1' ? v1 : null; }, setItem: function () {} };
    }, function () {
      var s = NM.Store.load();
      T.eq(s.meals.length, 3, 'still three meals');
      T.eq(s.meals[0].length, 1, 'the plate, validated, is the first meal');
      T.eq(s.meals[0][0].id, 'oil', 'the oil row');
      T.eq(s.meals[1].length, 0, 'the other meals are empty');
      T.eq(s.target.kcal, NM.Store.DEFAULTS.target.kcal, 'a meal target is not taken as a daily one');
    });
  });
})();
