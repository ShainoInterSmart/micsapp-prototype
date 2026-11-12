/* ==========================================================================
   UI helpers & shared components
   ========================================================================== */
(function () {
  'use strict';
  var ui = {};
  MICS.ui = ui;

  // ---------- Formatting ----------
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  ui.esc = function (s) { return s == null ? '' : String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  ui.num = function (n, d) { return n == null || isNaN(n) ? '—' : Number(n).toLocaleString('en-GB', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  ui.money = function (n) { return 'GHS ' + ui.num(Math.round(n)); };
  ui.moneyShort = function (n) {
    var a = Math.abs(n);
    if (a >= 1e6) return 'GHS ' + (n / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'm';
    if (a >= 1e3) return 'GHS ' + (n / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'k';
    return 'GHS ' + Math.round(n);
  };
  ui.pct = function (n, d) { return n == null ? '—' : Number(n).toFixed(d == null ? 1 : d) + '%'; };
  ui.parseDate = function (s) { return new Date((s.length <= 10 ? s + 'T00:00:00' : s)); };
  ui.date = function (s) { if (!s) return '—'; var d = ui.parseDate(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  ui.dateShort = function (s) { if (!s) return '—'; var d = ui.parseDate(s); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  ui.month = function (s) { var d = ui.parseDate(s); return MONTHS[d.getMonth()]; };
  ui.dayName = function (s) { return DAYS[ui.parseDate(s).getDay()]; };
  ui.longDate = function (s) { var d = ui.parseDate(s); return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear(); };
  ui.time = function (s) { return s && s.length > 10 ? s.slice(11, 16) : ''; };
  ui.daysBetween = function (a, b) { return Math.round((ui.parseDate(b) - ui.parseDate(a)) / 86400000); };
  ui.rel = function (s) {
    var today = MICS.state.db.meta.today;
    var day = s.slice(0, 10);
    var diff = ui.daysBetween(day, today);
    if (diff === 0) return s.length > 10 ? 'Today, ' + ui.time(s) : 'Today';
    if (diff === 1) return 'Yesterday' + (s.length > 10 ? ', ' + ui.time(s) : '');
    if (diff > 1 && diff < 7) return diff + ' days ago';
    if (diff === -1) return 'Tomorrow';
    if (diff < -1 && diff > -7) return 'In ' + (-diff) + ' days';
    return ui.date(day);
  };

  // ---------- Atoms ----------
  ui.icon = function (name, cls) { return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>'; };
  ui.initials = function (name) {
    var parts = String(name).replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Nurse)\s+/, '').split(/\s+/);
    return ((parts[0] || '')[0] + ((parts[parts.length - 1] || '')[0] || '')).toUpperCase();
  };
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  ui.avatar = function (name, size) { return '<span class="avatar ' + (size || '') + ' c' + (hashStr(name) % 6 + 1) + '" aria-hidden="true">' + ui.esc(ui.initials(name)) + '</span>'; };
  ui.person = function (name, sub, size) {
    return '<div class="person">' + ui.avatar(name, size || 'sm') + '<div style="min-width:0"><div class="person-name">' + ui.esc(name) + '</div>' + (sub ? '<div class="person-sub">' + ui.esc(sub) + '</div>' : '') + '</div></div>';
  };
  ui.badge = function (text, tone, dot) { return '<span class="badge ' + (tone || '') + '">' + (dot ? '<span class="bdot"></span>' : '') + ui.esc(text) + '</span>'; };
  var toneMap = {
    'Pending': 'warning', 'Approved': 'success', 'Rejected': 'danger', 'Reviewed': 'info', 'Verified': 'success',
    'Open': 'warning', 'Assigned': 'info', 'In progress': 'navy', 'Completed': 'success', 'Closed': 'neutral', 'Under review': 'warning',
    'Critical': 'danger', 'High': 'danger', 'Medium': 'warning', 'Low': 'neutral',
    'Active': 'success', 'Scheduled': 'info', 'Planning': 'neutral', 'Planned': 'neutral',
    'Recorded': 'success', 'Pending sync': 'warning', 'Not recorded': 'neutral', 'Not found': 'danger',
    'Paid': 'success', 'Part-paid': 'warning', 'Unpaid': 'danger', 'Overdue': 'danger',
    'Not started': 'neutral', 'Implemented': 'success', 'Requested': 'warning', 'Confirmed': 'success',
    'On track': 'success', 'Due soon': 'warning', 'Action required': 'danger', 'In preparation': 'info',
    'Current': 'success', 'Review due': 'warning', 'Mitigating': 'info', 'Monitoring': 'neutral',
    'Marking': 'warning', 'Graded': 'success', 'On loan': 'info', 'Minutes approved': 'success',
    'Management response due': 'warning', 'Actions in progress': 'info', 'Self-review submitted': 'info', 'Manager review': 'warning'
  };
  ui.status = function (text, toneOverride) { return ui.badge(text, toneOverride || toneMap[text] || 'neutral', true); };
  ui.toneOf = function (t) { return toneMap[t] || 'neutral'; };
  ui.priority = function (p) {
    var t = { Critical: 'danger', High: 'danger', Medium: 'warning', Low: 'neutral' }[p] || 'neutral';
    return '<span class="badge ' + t + ' outline">' + ui.esc(p) + '</span>';
  };
  ui.rag = function (r) { return '<span class="rag ' + r + '" title="' + ({ g: 'On track', a: 'At risk', r: 'Off track', n: 'Not rated' }[r]) + '"></span>'; };
  ui.ragLabel = function (r) { return { g: 'On track', a: 'At risk', r: 'Off track' }[r]; };
  ui.delta = function (v, suffix, invert, digits) {
    if (v == null) return '';
    var up = v > 0, flat = Math.abs(v) < 0.05;
    var good = invert ? !up : up;
    var cls = flat ? 'flat' : good ? 'up' : 'down';
    return '<span class="delta ' + cls + '">' + ui.icon(flat ? 'minus' : up ? 'trend-up' : 'trend-down') + (v > 0 ? '+' : '') + Number(v).toFixed(digits == null ? 1 : digits) + (suffix || '') + '</span>';
  };
  ui.progress = function (v, tone, lg) { return '<div class="progress ' + (tone || '') + (lg ? ' lg' : '') + '" role="progressbar" aria-valuenow="' + Math.round(v) + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + Math.max(0, Math.min(100, v)) + '%"></span></div>'; };
  ui.empty = function (title, text, icon, action) {
    return '<div class="empty"><div class="empty-icon">' + ui.icon(icon || 'inbox') + '</div><div class="empty-title">' + ui.esc(title) + '</div>' + (text ? '<div class="empty-text">' + ui.esc(text) + '</div>' : '') + (action || '') + '</div>';
  };
  ui.dateBlock = function (s) { var d = ui.parseDate(s); return '<div class="date-block"><div class="m">' + MONTHS[d.getMonth()] + '</div><div class="d">' + d.getDate() + '</div></div>'; };
  ui.pageHead = function (o) {
    return '<div class="page-head"><div>' + (o.eyebrow ? '<div class="page-eyebrow">' + ui.esc(o.eyebrow) + '</div>' : '') + '<h1>' + ui.esc(o.title) + '</h1>' + (o.desc ? '<p class="page-desc">' + o.desc + '</p>' : '') + '</div>' + (o.actions ? '<div class="page-actions">' + o.actions + '</div>' : '') + '</div>';
  };
  ui.card = function (o) {
    return '<section class="card ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + '>' +
      (o.title ? '<div class="card-head' + (o.bordered ? ' bordered' : '') + '"><div style="min-width:0"><div class="card-title">' + o.title + '</div>' + (o.sub ? '<div class="card-sub">' + o.sub + '</div>' : '') + '</div>' + (o.action || '') + '</div>' : '') +
      '<div class="card-body ' + (o.bodyCls || '') + '">' + (o.body || '') + '</div>' + (o.foot ? '<div class="card-foot">' + o.foot + '</div>' : '') + '</section>';
  };
  ui.kpi = function (o) {
    return '<button class="card kpi clickable" type="button" ' + (o.href ? 'data-href="' + o.href + '"' : '') + ' aria-label="' + ui.esc(o.label) + '">' +
      '<div class="kpi-top"><span class="kpi-label"><span class="kpi-icon ' + (o.tone || '') + '">' + ui.icon(o.icon) + '</span>' + ui.esc(o.label) + '</span>' + (o.badge || '') + '</div>' +
      '<div class="kpi-row"><div class="kpi-value">' + o.value + '</div>' + (o.spark ? '<div class="kpi-spark" data-spark="' + o.spark.join(',') + '" data-spark-tone="' + (o.sparkTone || '') + '"></div>' : '') + '</div>' +
      '<div class="kpi-foot">' + (o.delta || '') + '<span>' + (o.foot || '') + '</span></div></button>';
  };
  ui.banner = function (html, tone, icon) { return '<div class="banner ' + (tone || '') + '">' + ui.icon(icon || 'info') + '<div>' + html + '</div></div>'; };
  ui.qbBadge = function () { return '<span class="badge gold outline" title="Simulated for prototype — no live connection">' + ui.icon('link', 'icon-sm') + 'QuickBooks · simulated</span>'; };

  // ---------- Toasts ----------
  var toastWrap;
  ui.toast = function (title, text, type) {
    if (!toastWrap) { toastWrap = document.createElement('div'); toastWrap.className = 'toasts'; toastWrap.setAttribute('role', 'status'); toastWrap.setAttribute('aria-live', 'polite'); document.body.appendChild(toastWrap); }
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.innerHTML = ui.icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check-circle') + '<div><div class="toast-title">' + ui.esc(title) + '</div>' + (text ? '<div class="toast-text">' + ui.esc(text) + '</div>' : '') + '</div>';
    toastWrap.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 220); }, 3800);
  };

  // ---------- Modal ----------
  var openLayers = [];
  function trapKeys(e) {
    if (e.key === 'Escape' && openLayers.length) { openLayers[openLayers.length - 1].close(); }
  }
  document.addEventListener('keydown', trapKeys);

  ui.modal = function (o) {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="mdl-t">' +
      '<div class="modal-head">' + (o.icon ? '<div class="modal-icon ' + (o.tone || '') + '">' + ui.icon(o.icon) + '</div>' : '') +
      '<div style="min-width:0;flex:1"><h3 id="mdl-t">' + ui.esc(o.title) + '</h3>' + (o.sub ? '<div class="modal-sub">' + o.sub + '</div>' : '') + '</div>' +
      '<button class="close-x" data-close aria-label="Close">' + ui.icon('x') + '</button></div>' +
      (o.body ? '<div class="modal-body">' + o.body + '</div>' : '') +
      '<div class="modal-foot">' + (o.actions || []).map(function (a, i) { return '<button class="btn ' + (a.cls || '') + '" data-act="' + i + '">' + ui.esc(a.label) + '</button>'; }).join('') + '</div></div>';
    document.body.appendChild(ov);
    var api = {
      el: ov,
      close: function () { ov.remove(); openLayers = openLayers.filter(function (x) { return x !== api; }); if (o.onClose) o.onClose(); }
    };
    openLayers.push(api);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) api.close(); });
    ov.querySelector('[data-close]').onclick = api.close;
    (o.actions || []).forEach(function (a, i) {
      ov.querySelector('[data-act="' + i + '"]').onclick = function () { if (a.onClick) { if (a.onClick(api) !== false) api.close(); } else api.close(); };
    });
    if (o.onOpen) o.onOpen(ov, api);
    var focusEl = ov.querySelector('input, textarea, select') || ov.querySelector('.modal-foot .btn:last-child');
    if (focusEl) setTimeout(function () { focusEl.focus(); }, 30);
    return api;
  };

  /** Confirmation dialog. Resolves with {ok, reason}. */
  ui.confirm = function (o) {
    return new Promise(function (resolve) {
      var done = false;
      var body = (o.text ? '<p>' + o.text + '</p>' : '') + (o.reason ? '<div class="field mt-4" id="cf-field"><label for="cf-reason">' + ui.esc(o.reasonLabel || 'Reason') + (o.reasonRequired ? '<span class="req">*</span>' : ' <span class="muted" style="font-weight:400">(optional)</span>') + '</label><textarea class="textarea" id="cf-reason" placeholder="' + ui.esc(o.reasonPlaceholder || 'Add a note for the record…') + '"></textarea><div class="field-error">' + ui.icon('alert', 'icon-sm') + 'Please provide a reason.</div></div>' : '');
      ui.modal({
        title: o.title, sub: o.sub, icon: o.icon || (o.tone === 'danger' ? 'x-circle' : 'check-circle'), tone: o.tone || 'success', body: body,
        actions: [
          { label: o.cancelLabel || 'Cancel', cls: '' },
          { label: o.confirmLabel || 'Confirm', cls: o.tone === 'danger' ? 'btn-danger-solid' : (o.btnCls || 'btn-primary'), onClick: function (api) {
            var reason = '';
            if (o.reason) {
              var ta = api.el.querySelector('#cf-reason'); reason = ta.value.trim();
              if (o.reasonRequired && !reason) { api.el.querySelector('#cf-field').classList.add('invalid'); ta.focus(); return false; }
            }
            done = true; resolve({ ok: true, reason: reason });
          } }
        ],
        onClose: function () { if (!done) resolve({ ok: false }); }
      });
    });
  };

  ui.demoOnly = function (feature, detail) {
    ui.modal({
      title: feature, icon: 'sparkle', tone: 'gold',
      sub: 'Planned capability — demonstration only',
      body: '<p>' + (detail || 'This capability is part of the full MICSAPP build scope. In this prototype it is shown for demonstration purposes and does not perform a live action.') + '</p><div class="banner neutral mt-4">' + ui.icon('info') + '<div>Prototype limitation: no backend, integrations or external services are connected. All data is fictional.</div></div>',
      actions: [{ label: 'Got it', cls: 'btn-primary' }]
    });
  };

  // ---------- Drawer ----------
  ui.drawer = function (o) {
    var ov = document.createElement('div'); ov.className = 'drawer-overlay';
    var dr = document.createElement('aside'); dr.className = 'drawer ' + (o.wide ? 'wide' : ''); dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-modal', 'true');
    document.body.appendChild(ov); document.body.appendChild(dr);
    var api = {
      el: dr,
      render: function (c) {
        dr.innerHTML = '<div class="drawer-head">' + (c.lead || '') + '<div style="min-width:0;flex:1"><h3>' + ui.esc(c.title) + '</h3>' + (c.sub ? '<div class="drawer-sub">' + c.sub + '</div>' : '') + '</div><button class="close-x" data-close aria-label="Close">' + ui.icon('x') + '</button></div>' +
          '<div class="drawer-body">' + (c.body || '') + '</div>' + (c.foot ? '<div class="drawer-foot">' + c.foot + '</div>' : '');
        dr.querySelector('[data-close]').onclick = api.close;
        if (c.bind) c.bind(dr, api);
      },
      close: function () { ov.remove(); dr.remove(); openLayers = openLayers.filter(function (x) { return x !== api; }); if (o.onClose) o.onClose(); }
    };
    openLayers.push(api);
    ov.onclick = api.close;
    api.render(o);
    return api;
  };
  ui.closeAllLayers = function () { openLayers.slice().forEach(function (l) { l.close(); }); };

  // ---------- Popover ----------
  var openPop = null;
  ui.popover = function (anchor, html, o) {
    ui.closePopover();
    o = o || {};
    var p = document.createElement('div');
    p.className = 'popover ' + (o.cls || '');
    p.innerHTML = html;
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect();
    var w = p.offsetWidth;
    var left = o.alignLeft ? r.left : r.right - w;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    p.style.top = (r.bottom + 6 + window.scrollY) + 'px';
    p.style.left = left + 'px';
    openPop = { el: p, anchor: anchor };
    if (o.bind) o.bind(p);
    return p;
  };
  ui.closePopover = function () { if (openPop) { openPop.el.remove(); openPop = null; } };
  document.addEventListener('mousedown', function (e) {
    if (openPop && !openPop.el.contains(e.target) && !openPop.anchor.contains(e.target)) ui.closePopover();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ui.closePopover(); });

  // ---------- Tabs ----------
  ui.tabs = function (items, active, attr) {
    return '<div class="tabs" role="tablist">' + items.map(function (t) {
      return '<button class="tab ' + (t.id === active ? 'active' : '') + '" role="tab" aria-selected="' + (t.id === active) + '" ' + (attr || 'data-tab') + '="' + t.id + '">' + ui.esc(t.label) + (t.count != null ? '<span class="count">' + t.count + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  };

  // ---------- Data table ----------
  /**
   * Render a sortable, paginated table into `el`.
   * cols: [{key, label, render(row), sort(row)->value, num, cls, width}]
   */
  ui.table = function (el, o) {
    var st = o.state || { sortKey: o.sortKey || null, dir: o.dir || 1, page: 1 };
    var size = o.pageSize || 10;
    function draw() {
      var rows = o.rows.slice();
      if (st.sortKey) {
        var col = o.cols.find(function (c) { return c.key === st.sortKey; });
        var get = col.sort || function (r) { return r[col.key]; };
        rows.sort(function (a, b) { var x = get(a), y = get(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; });
      }
      var pages = Math.max(1, Math.ceil(rows.length / size));
      if (st.page > pages) st.page = pages;
      var slice = o.paginate === false ? rows : rows.slice((st.page - 1) * size, st.page * size);
      var html = '<div class="table-wrap"><table class="table ' + (o.compact ? 'compact' : '') + '"><thead><tr>' + o.cols.map(function (c) {
        var sortable = c.sortable !== false && (c.sort || c.key);
        return '<th class="' + (c.num ? 'num ' : '') + (sortable ? 'sortable ' : '') + (st.sortKey === c.key ? 'sorted' : '') + '"' + (c.width ? ' style="width:' + c.width + '"' : '') + (sortable ? ' data-sort="' + c.key + '"' : '') + '>' + ui.esc(c.label) + (sortable ? '<span class="sort-ind">' + (st.sortKey === c.key ? (st.dir > 0 ? '▲' : '▼') : '↕') + '</span>' : '') + '</th>';
      }).join('') + '</tr></thead><tbody>';
      if (!slice.length) html += '<tr><td colspan="' + o.cols.length + '">' + ui.empty(o.emptyTitle || 'No records found', o.emptyText || 'Try adjusting your search or filters.', 'search') + '</td></tr>';
      slice.forEach(function (r, i) {
        html += '<tr class="' + (o.onRow ? 'clickable' : '') + '" data-ri="' + ((st.page - 1) * size + i) + '"' + (o.rowId ? ' data-id="' + ui.esc(o.rowId(r)) + '"' : '') + '>' + o.cols.map(function (c) {
          return '<td class="' + (c.num ? 'num ' : '') + (c.cls || '') + '">' + (c.render ? c.render(r) : ui.esc(r[c.key])) + '</td>';
        }).join('') + '</tr>';
      });
      html += '</tbody></table></div>';
      if (o.paginate !== false && rows.length > size) {
        var from = (st.page - 1) * size + 1, to = Math.min(st.page * size, rows.length);
        html += '<div class="table-foot"><span>Showing <strong>' + from + '–' + to + '</strong> of <strong>' + rows.length + '</strong> ' + (o.noun || 'records') + '</span><div class="pager">' +
          '<button data-pg="prev" ' + (st.page === 1 ? 'disabled' : '') + ' aria-label="Previous page">' + ui.icon('chevron-left', 'icon-sm') + '</button>' +
          pageList(st.page, pages).map(function (p) { return p === '…' ? '<span class="muted" style="padding:0 4px">…</span>' : '<button data-pg="' + p + '" class="' + (p === st.page ? 'active' : '') + '">' + p + '</button>'; }).join('') +
          '<button data-pg="next" ' + (st.page === pages ? 'disabled' : '') + ' aria-label="Next page">' + ui.icon('chevron-right', 'icon-sm') + '</button></div></div>';
      } else if (o.footNote) html += '<div class="table-foot">' + o.footNote + '</div>';
      el.innerHTML = html;
      el.querySelectorAll('th[data-sort]').forEach(function (th) {
        th.onclick = function () { var k = th.getAttribute('data-sort'); if (st.sortKey === k) st.dir *= -1; else { st.sortKey = k; st.dir = 1; } draw(); };
      });
      el.querySelectorAll('[data-pg]').forEach(function (b) {
        b.onclick = function () { var v = b.getAttribute('data-pg'); st.page = v === 'prev' ? st.page - 1 : v === 'next' ? st.page + 1 : +v; draw(); };
      });
      if (o.onRow) el.querySelectorAll('tbody tr.clickable').forEach(function (tr) {
        tr.onclick = function (e) { if (e.target.closest('button, a, input, select')) return; var r = rows[+tr.getAttribute('data-ri')]; if (r) o.onRow(r); };
      });
      if (o.bind) o.bind(el, rows);
    }
    function pageList(cur, n) {
      if (n <= 7) return Array.from({ length: n }, function (_, i) { return i + 1; });
      var out = [1]; if (cur > 3) out.push('…');
      for (var i = Math.max(2, cur - 1); i <= Math.min(n - 1, cur + 1); i++) out.push(i);
      if (cur < n - 2) out.push('…'); out.push(n); return out;
    }
    draw();
    return { redraw: draw, state: st };
  };

  // ---------- Forms ----------
  ui.field = function (o) {
    var id = o.id;
    var control;
    if (o.type === 'select') control = '<select id="' + id + '" name="' + id + '">' + (o.placeholder ? '<option value="">' + ui.esc(o.placeholder) + '</option>' : '') + o.options.map(function (op) { var v = typeof op === 'string' ? op : op.value, l = typeof op === 'string' ? op : op.label; return '<option value="' + ui.esc(v) + '"' + (o.value === v ? ' selected' : '') + '>' + ui.esc(l) + '</option>'; }).join('') + '</select>';
    else if (o.type === 'textarea') control = '<textarea class="textarea" id="' + id + '" name="' + id + '" placeholder="' + ui.esc(o.placeholder || '') + '">' + ui.esc(o.value || '') + '</textarea>';
    else control = '<input class="input" id="' + id + '" name="' + id + '" type="' + (o.type || 'text') + '" placeholder="' + ui.esc(o.placeholder || '') + '" value="' + ui.esc(o.value || '') + '"' + (o.min != null ? ' min="' + o.min + '"' : '') + (o.max != null ? ' max="' + o.max + '"' : '') + (o.step ? ' step="' + o.step + '"' : '') + '>';
    return '<div class="field ' + (o.full ? 'full' : '') + '" data-field="' + id + '"><label for="' + id + '">' + ui.esc(o.label) + (o.required ? '<span class="req">*</span>' : '') + '</label>' + control + (o.hint ? '<div class="field-hint">' + o.hint + '</div>' : '') + '<div class="field-error">' + ui.icon('alert', 'icon-sm') + '<span>' + ui.esc(o.error || 'This field is required.') + '</span></div></div>';
  };
  /** Validate fields. rules: {id: fn(value)->errorString|null} */
  ui.validate = function (root, rules) {
    var ok = true, first = null;
    Object.keys(rules).forEach(function (id) {
      var f = root.querySelector('[data-field="' + id + '"]'); var input = root.querySelector('#' + id);
      var err = rules[id](input ? input.value.trim() : '');
      if (f) {
        f.classList.toggle('invalid', !!err);
        if (err) f.querySelector('.field-error span').textContent = err;
      }
      if (err) { ok = false; if (!first) first = input; }
    });
    if (first) first.focus();
    return ok;
  };
  ui.val = function (root, id) { var i = root.querySelector('#' + id); return i ? i.value.trim() : ''; };
  ui.required = function (label) { return function (v) { return v ? null : (label || 'This field') + ' is required.'; }; };

  // ---------- CSV export ----------
  ui.downloadCSV = function (filename, header, rows) {
    var csv = [header].concat(rows).map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    ui.toast('Export ready', filename + ' (' + rows.length + ' rows) — demo data', 'success');
  };

  // ---------- Delegated helpers ----------
  /** Wire [data-href] navigation within a root */
  ui.bindLinks = function (root) {
    root.querySelectorAll('[data-href]').forEach(function (n) {
      n.addEventListener('click', function (e) { if (e.target.closest('[data-stop]')) return; location.hash = n.getAttribute('data-href'); });
    });
    root.querySelectorAll('[data-demo]').forEach(function (n) {
      n.addEventListener('click', function () { ui.demoOnly(n.getAttribute('data-demo'), n.getAttribute('data-demo-text')); });
    });
  };
  ui.on = function (root, sel, evt, fn) { root.querySelectorAll(sel).forEach(function (n) { n.addEventListener(evt, function (e) { fn(e, n); }); }); };
})();
