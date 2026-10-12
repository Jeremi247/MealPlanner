// Fetches what the server keeps and sends it changes: the shelf (docs/decisions/0023-the-shelf-is-kept-on-the-server.md)
// and the foods of your own (docs/decisions/0026-your-own-foods-are-kept-on-the-server.md). Each
// keeps the last copy seen in this browser, so it can be shown, read-only, when the server cannot
// be reached. Every callback gets (error, doc): `doc` is the server's whole list, `error` a
// message or null.
(function (NM) {
  'use strict';

  var TIMEOUT_MS = 8000;

  // A store for one address. `key` is the list its answers hold ('meals' or 'foods'), and `what`
  // names it in a message.
  function make(url, cacheKey, key, what) {
    // The last copy seen, { doc, at } with `at` in ms since the epoch, or null.
    function cached() {
      try {
        var c = JSON.parse(window.localStorage.getItem(cacheKey));
        return c && c.doc && Array.isArray(c.doc[key]) && typeof c.at === 'number' ? c : null;
      } catch (e) { return null; }
    }

    function keep(doc) {
      try { window.localStorage.setItem(cacheKey, JSON.stringify({ doc: doc, at: Date.now() })); } catch (e) { /* not kept */ }
    }

    function request(init, done) {
      var ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : null;
      if (ctl) init.signal = ctl.signal;
      init.cache = 'no-store';
      var res;
      fetch(url, init)
        .then(function (r) { res = r; return r.json(); })
        .then(function (body) {
          clearTimeout(timer);
          if (!res.ok) { done(body && body.error ? body.error : what + ' refused it (' + res.status + ')', null, true); return; }
          keep(body);
          done(null, body);
        }, function () {
          clearTimeout(timer);
          done(res ? what + ' answered ' + res.status : what + ' cannot be reached', null, !!res);
        });
    }

    // Fetches the whole list. A third argument, true, means the server answered but refused.
    function load(done) { request({ method: 'GET' }, done); }

    // Sends one change, { op, ... } as Server/shelf.py takes it, and gets the whole list back.
    function send(op, done) {
      request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) }, done);
    }

    return { cached: cached, load: load, send: send };
  }

  NM.ShelfStore = make('api/shelf', 'nutrientmanager.shelf.v1', 'meals', 'the shelf');
  NM.FoodStore = make('api/foods', 'nutrientmanager.foods.v1', 'foods', 'your foods');
})(window.NM = window.NM || {});
