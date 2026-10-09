(function () {
  'use strict';

  // Replaces window.localStorage for the duration of fn.
  function withStorage(fake, fn) {
    var desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { return fake(); } });
    try { fn(); } finally { Object.defineProperty(window, 'localStorage', desc); }
  }

  T.test('Store.UnavailableStorageGivesTheDefaults', function () {
    withStorage(function () { throw new Error('blocked'); }, function () {
      var s = NM.Store.load();
      T.eq(s.target.kcal, NM.Store.DEFAULTS.target.kcal, 'default target');
      T.eq(s.plate.length, 0, 'empty plate');
      NM.Store.save(s); // must not throw
    });
  });

  T.test('Store.MalformedFieldsAreDroppedNotTrusted', function () {
    var saved = JSON.stringify({ target: { kcal: -5, protein: 'x', fat: 30 }, plate: [{ id: 'oil', ml: 15 }, { id: 3 }, { id: 'cod', ml: 0 }, { id: 'tuna', ml: '150' }, { id: 'oil', ml: 30 }] });
    withStorage(function () { return { getItem: function () { return saved; }, setItem: function () {} }; }, function () {
      var s = NM.Store.load();
      T.eq(s.target.kcal, NM.Store.DEFAULTS.target.kcal, 'negative kcal rejected');
      T.eq(s.target.protein, NM.Store.DEFAULTS.target.protein, 'string protein rejected');
      T.eq(s.target.fat, 30, 'valid fat kept');
      T.eq(s.plate.length, 1, 'only the first well-formed entry survives: no zero, text or repeated id');
      T.eq(s.plate[0].ml, 15, 'the first oil entry is kept');
    });
  });
})();
