// A minimal test harness. Tests register with T.test; T.run writes one line per
// failure and a summary line into #summary, which Scripts/Test.ps1 reads.
(function () {
  'use strict';

  var tests = [];

  // A script that throws while loading registers none of its tests, so each error
  // is a failure of its own. Loaded first, this sees every script below it.
  var loadErrors = [];
  function name(url) { return (url || 'a script').split('/').pop(); }
  window.addEventListener('error', function (e) {
    var loading = document.currentScript ? document.currentScript.src : e.filename;
    loadErrors.push(name(loading) + ' — ' + e.message + ' at ' + name(e.filename) + ':' + e.lineno);
  });

  function fail(msg) { throw new Error(msg); }

  var T = {
    test: function (name, fn) { tests.push({ name: name, fn: fn }); },
    eq: function (a, b, msg) { if (a !== b) fail((msg || 'eq') + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a)); },
    near: function (a, b, tol, msg) { if (!(Math.abs(a - b) <= tol)) fail((msg || 'near') + ': expected ' + b + ' ±' + tol + ', got ' + a); },
    ok: function (cond, msg) { if (!cond) fail(msg || 'expected true'); },
    run: function () {
      var failed = loadErrors.map(function (e) { return 'Load ' + e; });
      var passed = 0;
      tests.forEach(function (t) {
        try { t.fn(); passed++; } catch (e) { failed.push(t.name + ' — ' + e.message); }
      });
      var out = document.getElementById('summary');
      var lines = failed.map(function (f) { return 'FAIL ' + f; });
      lines.push((failed.length ? 'FAILED' : 'PASSED') + ' ' + passed + '/' + (tests.length + loadErrors.length));
      out.textContent = lines.join('\n');
      document.title = failed.length ? 'FAILED' : 'PASSED';
    }
  };

  window.T = T;
})();
