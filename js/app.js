/* ==========================================================================
   Bootstrap
   ========================================================================== */
(function () {
  'use strict';
  MICS.state.load();
  MICS.renderLogos(document.getElementById("app"));
  MICS.auth.init();
  MICS.shell.init();

  // Re-render the current view whenever demo state changes (keeps every
  // dashboard counter, badge and list consistent after any workflow action).
  var pending = null;
  MICS.state.on(function () {
    if (!MICS.auth.user()) return;
    clearTimeout(pending);
    pending = setTimeout(function () { MICS.router.render({ keepScroll: true, keepLayers: true }); }, 0);
  });

  window.addEventListener('hashchange', function () { MICS.router.render(); });
  var resizeT = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (Math.abs(window.innerWidth - lastW) < 40) return;
    lastW = window.innerWidth;
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { if (MICS.auth.user()) MICS.router.render({ keepScroll: true, keepLayers: true }); }, 200);
  });
  MICS.router.render();
})();
