// The small framed box that asks before a Clear or a remove, dropped from the button that asked
// (docs/decisions/0021-a-confirmation-drops-from-its-button.md).
(function (NM) {
  'use strict';

  var el = NM.Format.el;

  // The gap between the button and the box, which the box's arrow spans.
  var GAP = 9;
  // How far the box reaches past the button's right edge.
  var OVERHANG = 8;
  // The closest the box comes to the window's edge.
  var EDGE = 8;

  var open = null;

  // Closes the open box, if any. `refocus` gives focus back to the button that opened it.
  function close(refocus) {
    if (!open) return;
    var o = open;
    open = null;
    o.box.remove();
    document.removeEventListener('pointerdown', o.onPointer, true);
    document.removeEventListener('keydown', o.onKey, true);
    window.removeEventListener('scroll', o.onMove, true);
    window.removeEventListener('resize', o.onMove);
    if (refocus && o.anchor.isConnected) o.anchor.focus({ preventScroll: true });
  }

  // Below the button, reaching just past its right edge, or above it when there is no room
  // below; kept inside the window. The arrow points at the button's middle.
  function place(box, anchor) {
    var a = anchor.getBoundingClientRect();
    var w = box.offsetWidth, h = box.offsetHeight;
    var left = Math.min(Math.max(EDGE, a.right + OVERHANG - w), window.innerWidth - EDGE - w);
    var above = a.bottom + GAP + h > window.innerHeight - EDGE && a.top - GAP - h >= EDGE;
    box.style.left = left + 'px';
    box.style.top = (above ? a.top - GAP - h : a.bottom + GAP) + 'px';
    box.style.setProperty('--confirm-arrow', (a.left + a.width / 2 - left) + 'px');
    box.classList.toggle('is-above', above);
  }

  // Asks `message` beside `anchor`, the button that was clicked, with Cancel and `action`.
  // `onYes` runs only on the action. Escape, a click elsewhere, focus leaving the box or a
  // scroll cancels; Tab stays inside. Asking again from the same button closes the box.
  function ask(anchor, message, action, onYes) {
    var again = open && open.anchor === anchor;
    close(false);
    if (again) return;

    var box = el('div', 'confirm');
    box.setAttribute('role', 'alertdialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', message);
    box.appendChild(el('p', 'confirm-msg', message));
    var actions = el('div', 'confirm-actions');
    var no = el('button', 'confirm-btn', 'Cancel'); no.type = 'button';
    var yes = el('button', 'confirm-btn confirm-btn-danger', action); yes.type = 'button';
    actions.appendChild(no);
    actions.appendChild(yes);
    box.appendChild(actions);

    no.addEventListener('click', function () { close(true); });
    yes.addEventListener('click', function () { close(true); onYes(); });
    // Focus going back to the button is left to its click, as below.
    box.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (!to || (!box.contains(to) && !anchor.contains(to))) close(false);
    });

    open = {
      box: box, anchor: anchor,
      // The button itself is left to its own click, which closes the box through `again`.
      onPointer: function (e) { if (!box.contains(e.target) && !anchor.contains(e.target)) close(false); },
      // Tab either way goes to the other of the two buttons, so the keyboard never leaves the box
      // for wherever comes after it at the end of the page.
      onKey: function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(true); }
        else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === no ? yes : no).focus(); }
      },
      onMove: function (e) { if (!e.target || !e.target.nodeType || !box.contains(e.target)) close(false); }
    };
    document.addEventListener('pointerdown', open.onPointer, true);
    document.addEventListener('keydown', open.onKey, true);
    window.addEventListener('scroll', open.onMove, true);
    window.addEventListener('resize', open.onMove);

    document.body.appendChild(box);
    place(box, anchor);
    no.focus({ preventScroll: true });
  }

  NM.Confirm = { ask: ask, close: close };
})(window.NM = window.NM || {});
