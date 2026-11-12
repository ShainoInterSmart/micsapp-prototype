/* ==========================================================================
   Hash router — static-host friendly (#/page/param)
   ========================================================================== */
(function () {
  'use strict';
  var pages = {};
  MICS.pages = pages;

  /**
   * Register a page.
   * def: { title, roles[], crumbs(params)->[[label, href]], render(el, params), navKey(params) }
   */
  MICS.page = function (key, def) { pages[key] = def; };

  var current = { key: null, params: [], def: null };
  var router = {
    current: function () { return current; },
    parse: function () {
      var h = (location.hash || '').replace(/^#\/?/, '');
      var q = h.split('?');
      var parts = q[0].split('/').filter(Boolean).map(decodeURIComponent);
      return { key: parts[0] || '', params: parts.slice(1), query: new URLSearchParams(q[1] || '') };
    },
    go: function (hash) { if (location.hash === hash) router.render(); else location.hash = hash; },
    render: function (opts) {
      opts = opts || {};
      var r = router.parse();
      var user = MICS.auth.user();
      if (!user) {
        if (r.key !== 'login') { history.replaceState(null, '', '#/login'); }
        MICS.shell.hide();
        pages.login.render(document.getElementById('login-root'), []);
        document.title = 'Sign in · MICSAPP';
        return;
      }
      if (!r.key || r.key === 'login') { history.replaceState(null, '', user.landing); r = router.parse(); }
      var def = pages[r.key];
      MICS.shell.show();
      var content = document.getElementById('content');
      var sameView = current.key === r.key && current.params.join('/') === r.params.join('/');
      current = { key: r.key, params: r.params, query: r.query, def: def };
      if (!opts.keepLayers) MICS.ui.closeAllLayers();
      MICS.ui.closePopover();
      MICS.charts.hideTip();
      if (!def) {
        MICS.shell.setHeader('Page not found', [['Home', user.landing], ['Not found']], null);
        content.innerHTML = MICS.ui.empty('Page not found', 'The page you are looking for does not exist in this prototype.', 'search', '<a class="btn btn-primary" href="' + user.landing + '">Back to home</a>');
        return;
      }
      if (def.roles && def.roles.indexOf(user.role) < 0) {
        MICS.shell.setHeader(def.title, [['Home', user.landing], [def.title]], def.navKey ? def.navKey(r.params) : r.key);
        content.innerHTML = '<div class="card" style="max-width:640px;margin:48px auto">' + MICS.ui.empty('Not available for your role', 'The ' + def.title + ' module is restricted to authorised roles. Access is controlled through role-based permissions (see User Access & Authorisation).', 'lock', '<a class="btn btn-primary" href="' + user.landing + '">Go to my dashboard</a>') + '</div>';
        return;
      }
      var crumbs = def.crumbs ? def.crumbs(r.params, r.query) : [[def.title]];
      MICS.shell.setHeader(typeof def.title === 'function' ? def.title(r.params) : def.title, crumbs, def.navKey ? def.navKey(r.params, r.query) : r.key);
      var scrollY = window.scrollY;
      content.innerHTML = '';
      content.className = 'content page-' + r.key;
      try { def.render(content, r.params, r.query); }
      catch (e) { console.error(e); content.innerHTML = MICS.ui.empty('Something went wrong', 'This screen could not be displayed. Try resetting demo data from the profile menu.', 'alert'); }
      MICS.charts.sparks(content);
      MICS.ui.bindLinks(content);
      if (opts.keepScroll || sameView) window.scrollTo(0, scrollY); else window.scrollTo(0, 0);
      var t = typeof def.title === 'function' ? def.title(r.params) : def.title;
      document.title = t + ' · MICSAPP';
    }
  };
  MICS.router = router;
})();
