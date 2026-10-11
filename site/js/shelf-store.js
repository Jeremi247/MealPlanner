// Fetches the shelf from the server and sends it changes, and keeps the last shelf seen in this
// browser so it can be shown, read-only, when the server cannot be reached
// (docs/decisions/0023-the-shelf-is-kept-on-the-server.md). Every callback gets
// (error, doc): `doc` is the server's whole shelf, `error` a message or null.
(function (NM) {
  'use strict';

  var URL = 'api/shelf';
  var CACHE_KEY = 'nutrientmanager.shelf.v1';
  var TIMEOUT_MS = 8000;

  // The last shelf seen, { doc, at } with `at` in ms since the epoch, or null.
  function cached() {
    try {
      var c = JSON.parse(window.localStorage.getItem(CACHE_KEY));
      return c && c.doc && Array.isArray(c.doc.meals) && typeof c.at === 'number' ? c : null;
    } catch (e) { return null; }
  }

  function keep(doc) {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ doc: doc, at: Date.now() })); } catch (e) { /* not kept */ }
  }

  function request(init, done) {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, TIMEOUT_MS) : null;
    if (ctl) init.signal = ctl.signal;
    init.cache = 'no-store';
    var res;
    fetch(URL, init)
      .then(function (r) { res = r; return r.json(); })
      .then(function (body) {
        clearTimeout(timer);
        if (!res.ok) { done(body && body.error ? body.error : 'the shelf refused it (' + res.status + ')', null, true); return; }
        keep(body);
        done(null, body);
      }, function () {
        clearTimeout(timer);
        done(res ? 'the shelf answered ' + res.status : 'the shelf cannot be reached', null, !!res);
      });
  }

  // Fetches the whole shelf. A third argument, true, means the server answered but refused.
  function load(done) { request({ method: 'GET' }, done); }

  // Sends one change, { op, ... } as Server/shelf.py takes it, and gets the whole shelf back.
  function send(op, done) {
    request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op) }, done);
  }

  NM.ShelfStore = { cached: cached, load: load, send: send };
})(window.NM = window.NM || {});
