/* ==========================================================================
   School Operations command centre
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var TABS = [
    { id: 'overview', label: 'Overview' }, { id: 'boarding', label: 'Boarding' }, { id: 'kitchen', label: 'Kitchen & Catering' },
    { id: 'facilities', label: 'Facilities & Maintenance' }, { id: 'security', label: 'Security & Reception' }, { id: 'infirmary', label: 'Infirmary' }
  ];
  var mf = { status: 'Active', priority: '' };

  MICS.page('operations', {
    title: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'overview'); }); return t && t.id !== 'overview' ? t.label : 'School Operations'; },
    roles: ['head', 'admin'],
    navKey: function (p) { return 'operations/' + (p[0] || 'overview'); },
    crumbs: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'overview'); }) || TABS[0]; return [['School Operations', '#/operations/overview'], [t.label]]; },
    render: function (el, params, query) {
      var tab = params[0] || 'overview';
      var m = sel.metrics();
      var openMaint = MICS.state.db.maintenance.filter(function (x) { return x.status !== 'Completed'; }).length;
      el.innerHTML = ui.pageHead({ eyebrow: 'Operations command centre', title: 'School Operations', desc: 'Boarding, catering, facilities, security and health services in one operational view. Every request and incident is tracked to resolution.',
        actions: '<button class="btn" id="ops-new-mr">' + ui.icon('wrench') + 'Log maintenance request</button>' }) +
        ui.tabs(TABS.map(function (t) { return { id: t.id, label: t.label, count: t.id === 'facilities' ? openMaint : t.id === 'boarding' ? MICS.state.db.exeats.filter(function (x) { return x.status === 'Pending'; }).length || null : null }; }), tab, 'data-otab') + '<div id="ops-body" class="mt-6"></div>';
      var body = el.querySelector('#ops-body');
      ({ overview: overview, boarding: boarding, kitchen: kitchen, facilities: facilities, security: security, infirmary: infirmary }[tab] || overview)(body, m, query);
      el.querySelectorAll('[data-otab]').forEach(function (b) { b.onclick = function () { location.hash = '#/operations/' + b.getAttribute('data-otab'); }; });
      el.querySelector('#ops-new-mr').onclick = newRequest;
    }
  });

  // ---------- Overview ----------
  function overview(body, m) {
    var db = MICS.state.db;
    var occ = sel.occupancy();
    var boarders = occ.reduce(function (a, o) { return a + o.occupied; }, 0), cap = occ.reduce(function (a, o) { return a + o.h.capacity; }, 0);
    var open = db.maintenance.filter(function (x) { return x.status !== 'Completed'; });
    var low = db.inventory.filter(function (i) { return i.stock <= i.reorder; });
    var onSite = db.visitors.filter(function (v) { return !v.timeOut; });
    var lastWk = db.infirmary.weekly[db.infirmary.weekly.length - 1];
    var lastKitchen = db.kitchenWeekly[db.kitchenWeekly.length - 1];
    body.innerHTML = '<div class="ops-strip">' +
      opsCard('bed', 'Boarding', Math.round(boarders / cap * 100) + '%', 'occupancy', boarders + ' of ' + cap + ' beds · ' + db.exeats.filter(function (x) { return x.status === 'Pending'; }).length + ' exeats pending', '#/operations/boarding') +
      opsCard('utensils', 'Kitchen & Catering', ui.num(lastKitchen.meals), 'meals this week', low.length ? '<span class="c-warning strong">' + low.length + ' items low</span> · ' + lastKitchen.wasteKg + ' kg waste' : 'Stock healthy', '#/operations/kitchen') +
      opsCard('wrench', 'Facilities', open.length, 'open requests', '<span class="c-danger strong">' + open.filter(function (x) { return x.priority === 'Critical' || x.priority === 'High'; }).length + ' high priority</span> · ' + open.filter(function (x) { return !x.assignee; }).length + ' unassigned', '#/operations/facilities') +
      opsCard('shield', 'Security & Reception', onSite.length, 'visitors on site', db.incidents.filter(function (i) { return i.status !== 'Closed'; }).length + ' open incident · gate log active', '#/operations/security') +
      opsCard('cross', 'Infirmary', lastWk.visits, 'visits this week', db.infirmary.referrals + ' referrals this term · aggregate only', '#/operations/infirmary') +
      '</div>' +
      '<div class="grid-12 mt-4">' +
      ui.card({ cls: 'col-7', title: 'Maintenance requests by priority', sub: 'Open requests and their assignment status', action: '<a class="card-link" href="#/operations/facilities">Manage ' + ui.icon('arrow-right') + '</a>', bodyCls: 'flush', body: maintList(open.slice().sort(prioritySort).slice(0, 6)) }) +
      ui.card({ cls: 'col-5', title: 'Boarding occupancy by house', sub: 'Beds occupied vs capacity', body: charts.hbars(occ.map(function (o) { return { label: o.h.name + ' · ' + o.h.gender, value: o.occupied, display: o.occupied + ' / ' + o.h.capacity + ' <span class="muted" style="font-weight:500">(' + o.rate.toFixed(0) + '%)</span>', marker: o.h.capacity * 0.9, color: o.rate > 95 ? 'var(--chart-4)' : 'var(--chart-1)' }; }), { max: 50, valueLabel: 'Boarders' }) + '<div class="text-xs muted mt-3">Marker shows 90% occupancy target.</div>' }) +
      ui.card({ cls: 'col-6', title: 'Kitchen: meals served & food waste', sub: 'Weekly, Term 1', body: '<div id="ops-waste"></div>' }) +
      ui.card({ cls: 'col-6', title: 'Low-stock items', sub: 'At or below reorder level', bodyCls: 'flush', body: low.length ? '<div class="list">' + low.map(function (i) { return '<div class="list-item"><span class="li-icon warning">' + ui.icon('alert') + '</span><div class="li-main"><div class="li-title">' + ui.esc(i.item) + '</div><div class="li-sub">' + i.stock + ' ' + i.unit + ' in stock · reorder at ' + i.reorder + ' · ' + (i.stock / i.dailyUse < 1 ? '< 1 day' : '~' + Math.floor(i.stock / i.dailyUse) + ' days') + ' cover</div></div>' + (i.onOrder ? ui.badge('On order', 'info') : '<button class="btn btn-sm" data-reorder="' + i.id + '">Raise requisition</button>') + '</div>'; }).join('') + '</div>' : ui.empty('All stock above reorder level', '', 'check-circle') }) +
      '</div>';
    charts.line(body.querySelector('#ops-waste'), { labels: db.kitchenWeekly.map(function (w) { return w.week; }), series: [{ name: 'Waste per meal (g)', color: 'var(--chart-4)', values: db.kitchenWeekly.map(function (w) { return Math.round(w.wasteKg * 1000 / w.meals); }) }], height: 200, area: true, target: 60, format: function (v) { return v + ' g'; }, tickFormat: function (v) { return v + 'g'; } });
    bindMaint(body); bindReorder(body);
  }

  function opsCard(icon, title, v, k, foot, href) {
    return '<button class="card ops-card clickable" data-href="' + href + '"><div class="ops-card-head"><span class="kpi-icon">' + ui.icon(icon) + '</span>' + title + '</div><div class="ops-card-metric"><span class="v">' + v + '</span><span class="k">' + k + '</span></div><div class="ops-card-foot">' + foot + '</div></button>';
  }
  function prioritySort(a, b) { var o = { Critical: 0, High: 1, Medium: 2, Low: 3 }; return o[a.priority] - o[b.priority] || a.reported.localeCompare(b.reported); }
  function maintList(items) {
    if (!items.length) return ui.empty('No open requests', 'All maintenance requests are completed.', 'check-circle');
    return '<div class="list">' + items.map(function (x) {
      var asg = x.assignee ? sel.emp(x.assignee) : null;
      return '<div class="list-item clickable" data-mr="' + x.id + '"><span class="li-icon ' + (x.priority === 'Critical' || x.priority === 'High' ? 'danger' : 'navy') + '">' + ui.icon(catIcon(x.category)) + '</span><div class="li-main"><div class="li-title">' + ui.esc(x.title) + '</div><div class="li-sub">' + x.id + ' · ' + ui.esc(x.location) + ' · ' + (asg ? ui.esc(asg.shortName) : '<span class="c-warning strong">Unassigned</span>') + '</div></div><div class="li-meta" style="flex-direction:row;gap:8px;align-items:center">' + ui.priority(x.priority) + ui.status(x.status) + '</div></div>';
    }).join('') + '</div>';
  }
  function catIcon(c) { return { Electrical: 'activity', Plumbing: 'wrench', Carpentry: 'wrench', ICT: 'grid', Grounds: 'map-pin', Painting: 'edit' }[c] || 'wrench'; }
  function bindMaint(root) { root.querySelectorAll('[data-mr]').forEach(function (r) { r.onclick = function () { openRequest(r.getAttribute('data-mr')); }; }); }
  function bindReorder(root) {
    root.querySelectorAll('[data-reorder]').forEach(function (b) { b.onclick = function () {
      var it = MICS.state.db.inventory.find(function (i) { return i.id === b.getAttribute('data-reorder'); });
      ui.confirm({ title: 'Raise purchase requisition?', sub: it.item, text: 'A requisition for <strong>' + it.item + '</strong> will be sent to ' + ui.esc(it.supplier) + ' via the procurement workflow (simulated).', confirmLabel: 'Raise requisition', icon: 'receipt', tone: '' }).then(function (r) { if (r.ok) { MICS.actions.reorderItem(it.id); ui.toast('Requisition raised', it.item); } });
    }; });
  }

  // ---------- Facilities & maintenance ----------
  function facilities(body, m, query) {
    var db = MICS.state.db;
    var all = db.maintenance;
    var open = all.filter(function (x) { return x.status !== 'Completed'; });
    var rows = all.filter(function (x) {
      if (mf.status === 'Active' && x.status === 'Completed') return false;
      if (mf.status === 'Completed' && x.status !== 'Completed') return false;
      if (mf.priority && x.priority !== mf.priority) return false;
      return true;
    }).sort(function (a, b) { return (a.status === 'Completed') - (b.status === 'Completed') || prioritySort(a, b); });
    var byPri = ['Critical', 'High', 'Medium', 'Low'].map(function (p) { return { p: p, n: open.filter(function (x) { return x.priority === p; }).length }; });
    var team = db.employees.filter(function (e) { return e.department === 'Facilities' || e.id === 'EMP-0018'; }).filter(function (e) { return ['Cleaner'].indexOf(e.role) < 0; });
    body.innerHTML = '<div class="grid grid-4 mb-4">' +
      MICS.statCard('Open requests', open.length, 'wrench') + MICS.statCard('Critical / high', open.filter(function (x) { return x.priority === 'Critical' || x.priority === 'High'; }).length, 'alert', 'danger') +
      MICS.statCard('Unassigned', open.filter(function (x) { return !x.assignee; }).length, 'user', 'gold') + MICS.statCard('Completed this term', all.filter(function (x) { return x.status === 'Completed'; }).length, 'check-circle', 'success') + '</div>' +
      '<div class="grid-12"><section class="card col-8"><div class="toolbar"><div class="segmented">' + ['Active', 'Completed', 'All'].map(function (s) { return '<button class="' + (mf.status === s ? 'active' : '') + '" data-mst="' + s + '">' + s + '</button>'; }).join('') + '</div>' +
      '<select class="select" id="mf-pri"><option value="">All priorities</option>' + ['Critical', 'High', 'Medium', 'Low'].map(function (p) { return '<option' + (mf.priority === p ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select><div class="grow"></div><span class="text-sm muted">Open a request to assign, update and complete it.</span></div><div id="mr-table"></div></section>' +
      '<div class="col-4 flex-col gap-4" style="display:flex">' +
        ui.card({ title: 'Open requests by priority', body: '<div class="stacked-bar mb-3">' + byPri.map(function (b, i) { return b.n ? '<span style="flex:' + b.n + ';background:' + ['var(--danger)', '#f79009', 'var(--chart-2)', 'var(--chart-muted)'][i] + '" data-tt="' + charts.tt(b.p, [{ label: 'Open', value: b.n }]) + '"></span>' : ''; }).join('') + '</div>' + byPri.map(function (b, i) { return '<div class="flex justify-between text-sm" style="padding:4px 0"><span class="flex items-center gap-2"><i style="width:10px;height:10px;border-radius:3px;background:' + ['var(--danger)', '#f79009', 'var(--chart-2)', 'var(--chart-muted)'][i] + '"></i>' + b.p + '</span><strong class="num">' + b.n + '</strong></div>'; }).join('') }) +
        ui.card({ title: 'Facilities team workload', sub: 'Open assignments', bodyCls: 'flush', body: '<div class="list">' + team.map(function (e) { var n = open.filter(function (x) { return x.assignee === e.id; }).length; return '<div class="list-item">' + ui.avatar(e.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(e.shortName) + '</div><div class="li-sub">' + ui.esc(e.role) + '</div></div><span class="badge ' + (n > 1 ? 'warning' : n ? 'info' : '') + '">' + n + ' open</span></div>'; }).join('') + '</div>' }) +
      '</div></div>';
    ui.table(body.querySelector('#mr-table'), { rows: rows, pageSize: 10, noun: 'requests', onRow: function (x) { openRequest(x.id); },
      cols: [
        { key: 'title', label: 'Request', render: function (x) { return '<div class="strong" style="color:var(--text)">' + ui.esc(x.title) + '</div><div class="text-xs muted">' + x.id + ' · ' + ui.esc(x.location) + '</div>'; } },
        { key: 'category', label: 'Category' },
        { key: 'priority', label: 'Priority', sort: function (x) { return { Critical: 0, High: 1, Medium: 2, Low: 3 }[x.priority]; }, render: function (x) { return ui.priority(x.priority); } },
        { key: 'assignee', label: 'Assigned to', sort: function (x) { return x.assignee ? sel.emp(x.assignee).shortName : 'zz'; }, render: function (x) { return x.assignee ? ui.person(sel.emp(x.assignee).shortName, sel.emp(x.assignee).role) : '<span class="badge warning outline">Unassigned</span>'; } },
        { key: 'reported', label: 'Reported', render: function (x) { return '<span class="nowrap">' + ui.date(x.reported) + '</span>'; } },
        { key: 'status', label: 'Status', render: function (x) { return ui.status(x.status); } }
      ] });
    body.querySelectorAll('[data-mst]').forEach(function (b) { b.onclick = function () { mf.status = b.getAttribute('data-mst'); MICS.router.render({ keepScroll: true }); }; });
    body.querySelector('#mf-pri').onchange = function (e) { mf.priority = e.target.value; MICS.router.render({ keepScroll: true }); };
    var req = query && query.get('req');
    if (req && !document.querySelector('.drawer')) { history.replaceState(null, '', '#/operations/facilities'); openRequest(req); }
  }

  /** Maintenance workflow drawer: review → assign → status → complete */
  function openRequest(id) {
    var dr = ui.drawer({ title: '' });
    function draw() {
      var x = sel.get('maintenance', id); if (!x) { dr.close(); return; }
      var reporter = sel.emp(x.reportedBy);
      var flow = ['Open', 'Assigned', 'In progress', 'Completed'];
      var si = flow.indexOf(x.status);
      var team = MICS.state.db.employees.filter(function (e) { return e.department === 'Facilities' || e.id === 'EMP-0018'; }).filter(function (e) { return e.role !== 'Cleaner'; });
      var body = '<div class="drawer-section"><div class="stepper">' + flow.map(function (s, i) { var c = i < si || x.status === 'Completed' ? 'done' : i === si ? 'current' : ''; return '<div class="step ' + c + '"><div class="s-dot">' + (c === 'done' ? ui.icon('check') : i + 1) + '</div>' + s + '</div>'; }).join('') + '</div></div>' +
        '<div class="drawer-section"><h4>Issue</h4><p style="line-height:1.6;color:var(--text-2)">' + ui.esc(x.description) + '</p><div class="dl-grid mt-4">' + kv('Location', x.location) + kv('Category', x.category) + kv('Reported by', reporter ? reporter.shortName : '—') + kv('Reported', ui.date(x.reported)) + kv('Age', ui.daysBetween(x.reported, x.completed || MICS.state.db.meta.today) + ' days') + kv('SLA', { Critical: '24 hours', High: '3 days', Medium: '7 days', Low: '14 days' }[x.priority]) + '</div></div>';
      if (x.status !== 'Completed') {
        body += '<div class="drawer-section"><h4>Assign & update</h4><div class="form-grid">' +
          ui.field({ id: 'mr-assignee', label: 'Responsible staff member', type: 'select', placeholder: 'Select staff…', value: x.assignee || '', options: team.map(function (e) { var n = MICS.state.db.maintenance.filter(function (m) { return m.assignee === e.id && m.status !== 'Completed'; }).length; return { value: e.id, label: e.shortName + ' — ' + e.role + ' (' + n + ' open)' }; }) }) +
          ui.field({ id: 'mr-priority', label: 'Priority', type: 'select', value: x.priority, options: ['Critical', 'High', 'Medium', 'Low'] }) +
          ui.field({ id: 'mr-status', label: 'Status', type: 'select', value: x.status, options: ['Open', 'Assigned', 'In progress'] }) +
          ui.field({ id: 'mr-note', label: 'Update note', type: 'textarea', full: true, placeholder: 'Optional — e.g. parts ordered, contractor contacted…' }) + '</div></div>';
      } else {
        body += '<div class="drawer-section"><div class="banner success">' + ui.icon('check-circle') + '<div><strong>Completed ' + ui.date(x.completed) + '</strong> by ' + ui.esc(x.assignee ? sel.emp(x.assignee).shortName : '—') + '. ' + ui.esc(x.resolution || '') + '</div></div></div>';
      }
      body += '<div class="drawer-section"><h4>Activity history</h4><div class="timeline">' + x.timeline.slice().reverse().map(function (t, i) { return '<div class="tl-item ' + (i === 0 && x.status !== 'Completed' ? 'current' : 'done') + '"><span class="tl-dot"></span><div class="tl-title">' + ui.esc(t.title) + '</div><div class="tl-sub">' + ui.esc(t.by) + ' · ' + ui.date(t.date) + '</div>' + (t.note ? '<div class="tl-note">' + ui.esc(t.note) + '</div>' : '') + '</div>'; }).join('') + '</div></div>';
      var foot = x.status !== 'Completed' ? '<button class="btn btn-ghost left" data-close-dr>Close</button><button class="btn" data-save>' + ui.icon('check') + 'Save changes</button><button class="btn btn-success" data-complete>' + ui.icon('check-circle') + 'Mark completed</button>' : '<button class="btn btn-primary" data-close-dr>Close</button>';
      dr.render({ title: x.title, sub: '<span class="mono">' + x.id + '</span>' + ui.priority(x.priority) + ui.status(x.status), lead: '<span class="li-icon ' + (x.priority === 'Critical' || x.priority === 'High' ? 'danger' : 'navy') + '" style="width:40px;height:40px">' + ui.icon('wrench') + '</span>', body: body, foot: foot,
        bind: function (root) {
          root.querySelectorAll('[data-close-dr]').forEach(function (b) { b.onclick = dr.close; });
          var save = root.querySelector('[data-save]');
          if (save) save.onclick = function () {
            var patch = { assignee: ui.val(root, 'mr-assignee') || null, priority: ui.val(root, 'mr-priority'), status: ui.val(root, 'mr-status') };
            if ((patch.status === 'Assigned' || patch.status === 'In progress') && !patch.assignee) { var f = root.querySelector('[data-field="mr-assignee"]'); f.classList.add('invalid'); f.querySelector('.field-error span').textContent = 'Assign a staff member before changing status.'; return; }
            if (patch.assignee === x.assignee) delete patch.assignee;
            var note = ui.val(root, 'mr-note');
            if (!patch.assignee && patch.priority === x.priority && patch.status === x.status && !note) { ui.toast('No changes to save', '', 'info'); return; }
            MICS.actions.updateMaintenance(id, patch, note);
            ui.toast('Request updated', x.id + ' · ' + sel.get('maintenance', id).status); draw();
          };
          var comp = root.querySelector('[data-complete]');
          if (comp) comp.onclick = function () {
            var asg = ui.val(root, 'mr-assignee') || x.assignee;
            if (!asg) { var f = root.querySelector('[data-field="mr-assignee"]'); f.classList.add('invalid'); f.querySelector('.field-error span').textContent = 'Assign the staff member who resolved the issue.'; return; }
            ui.confirm({ title: 'Mark request completed?', sub: x.id + ' · ' + x.title, text: 'Record how the issue was resolved. The requester and Facilities Manager are notified (simulated).', reason: true, reasonRequired: true, reasonLabel: 'Resolution notes', reasonPlaceholder: 'e.g. Replaced faulty pipe joints and tested for leaks.', confirmLabel: 'Mark completed', btnCls: 'btn-success', icon: 'check-circle', tone: 'success' }).then(function (r) {
              if (!r.ok) return;
              if (asg !== x.assignee) MICS.actions.updateMaintenance(id, { assignee: asg });
              MICS.actions.updateMaintenance(id, { status: 'Completed', resolution: r.reason });
              ui.toast('Request completed', x.title); draw();
            });
          };
        } });
    }
    draw();
  }
  MICS.openMaintenance = openRequest;

  function newRequest() {
    ui.modal({ title: 'Log maintenance request', icon: 'wrench', sub: 'Report a facilities issue for assignment',
      body: '<div class="form-grid">' + ui.field({ id: 'nm-title', label: 'Issue summary', required: true, full: true, placeholder: 'e.g. Broken window latch in B12' }) +
        ui.field({ id: 'nm-loc', label: 'Location', required: true, placeholder: 'Block / room' }) +
        ui.field({ id: 'nm-cat', label: 'Category', type: 'select', options: ['Electrical', 'Plumbing', 'Carpentry', 'ICT', 'Grounds', 'Painting'], value: 'Electrical' }) +
        ui.field({ id: 'nm-pri', label: 'Priority', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'], value: 'Medium' }) +
        ui.field({ id: 'nm-desc', label: 'Description', type: 'textarea', full: true, required: true, placeholder: 'What is the problem, and is there any safety risk?' }) + '</div>',
      actions: [{ label: 'Cancel' }, { label: 'Submit request', cls: 'btn-primary', onClick: function (api) {
        if (!ui.validate(api.el, { 'nm-title': ui.required('Issue summary'), 'nm-loc': ui.required('Location'), 'nm-desc': function (v) { return !v ? 'Description is required.' : v.length < 10 ? 'Please add a little more detail.' : null; } })) return false;
        var id = MICS.actions.createMaintenance({ title: ui.val(api.el, 'nm-title'), location: ui.val(api.el, 'nm-loc'), category: ui.val(api.el, 'nm-cat'), priority: ui.val(api.el, 'nm-pri'), description: ui.val(api.el, 'nm-desc') });
        ui.toast('Request logged', id + ' added to Facilities queue');
        if (location.hash.indexOf('#/operations/facilities') !== 0) location.hash = '#/operations/facilities';
      } }] });
  }

  // ---------- Boarding ----------
  function boarding(body) {
    var db = MICS.state.db;
    var occ = sel.occupancy();
    var tot = occ.reduce(function (a, o) { return a + o.occupied; }, 0), cap = occ.reduce(function (a, o) { return a + o.h.capacity; }, 0);
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Boarders', tot, 'bed') + MICS.statCard('Occupancy', (tot / cap * 100).toFixed(1) + '%', 'home', 'gold') + MICS.statCard('Beds available', cap - tot, 'check-circle', 'success') + MICS.statCard('Exeats pending', db.exeats.filter(function (x) { return x.status === 'Pending'; }).length, 'clock', 'danger') + '</div>' +
      '<div class="grid grid-4 mb-4">' + occ.map(function (o) {
        var mates = db.students.filter(function (s) { return s.boarding && s.house === o.h.id; });
        return '<div class="card house-card"><div class="flex justify-between items-center"><div><div class="strong" style="font-size:14px">' + o.h.name + '</div><div class="text-xs muted">' + o.h.gender + ' · ' + o.h.dorms + ' dormitories · ' + ui.esc(sel.emp(o.h.masterId).shortName) + '</div></div>' + charts.ring(o.rate, { size: 52, stroke: 5, fontSize: 12, color: o.rate > 95 ? 'var(--chart-4)' : 'var(--chart-1)' }) + '</div>' +
          '<div class="stat-strip mt-3" style="border:1px solid var(--divider);border-radius:var(--r-md)"><div style="padding:8px 12px"><div class="stat-k">Occupied</div><div class="stat-v" style="font-size:15px">' + o.occupied + '/' + o.h.capacity + '</div></div><div style="padding:8px 12px"><div class="stat-k">Avg attendance</div><div class="stat-v" style="font-size:15px">' + (mates.reduce(function (a, s) { return a + sel.attPct(s); }, 0) / (mates.length || 1)).toFixed(1) + '%</div></div></div></div>';
      }).join('') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-7', title: 'Exeat & leave requests', sub: 'Guardian consent verified before release', bodyCls: 'flush', body: '<div class="list">' + db.exeats.map(function (x) {
        var s = sel.student(x.studentId);
        return '<div class="list-item">' + ui.avatar(s.name, 'sm') + '<div class="li-main"><div class="li-title"><a href="#/students/' + s.id + '">' + ui.esc(s.name) + '</a> <span class="text-xs muted">' + ui.esc(sel.cls(s.classId).name) + ' · ' + s.house + '</span></div><div class="li-sub">' + ui.esc(x.type) + ' · ' + ui.dateShort(x.from) + (x.to !== x.from ? ' – ' + ui.dateShort(x.to) : '') + ' · ' + ui.esc(x.reason) + '</div></div><div class="li-meta" style="flex-direction:row;gap:6px;align-items:center">' +
          (x.status === 'Pending' ? '<span class="badge success outline">' + ui.icon('check', 'icon-sm') + 'Consent</span><button class="btn btn-sm btn-danger" data-ex="' + x.id + '" data-d="Rejected">Decline</button><button class="btn btn-sm btn-success" data-ex="' + x.id + '" data-d="Approved">Approve</button>' : ui.status(x.status)) + '</div></div>';
      }).join('') + '</div>' }) +
      ui.card({ cls: 'col-5', title: 'Accommodation overview', sub: 'Boarders by programme', body: charts.hbars(db.programmes.map(function (p) { var n = db.students.filter(function (s) { return s.boarding && s.programmeId === p.id; }).length; return { label: p.short, value: n, color: p.color }; }), { valueLabel: 'Boarders' }) + '<div class="banner neutral mt-4">' + ui.icon('info') + '<div>Primary (Basic 4–6) learners are day students. Room-level allocation and roll-call are part of the full build.</div></div>' }) + '</div>';
    body.querySelectorAll('[data-ex]').forEach(function (b) { b.onclick = function () {
      var x = db.exeats.find(function (e) { return e.id === b.getAttribute('data-ex'); }); var d = b.getAttribute('data-d');
      ui.confirm({ title: (d === 'Approved' ? 'Approve' : 'Decline') + ' exeat?', sub: sel.student(x.studentId).name + ' · ' + x.type, text: d === 'Approved' ? 'Guardian consent has been recorded. The gate and housemaster will be notified (simulated).' : 'The guardian will be informed of the decision (simulated).', reason: d !== 'Approved', reasonRequired: d !== 'Approved', confirmLabel: d === 'Approved' ? 'Approve' : 'Decline', tone: d === 'Approved' ? 'success' : 'danger', btnCls: d === 'Approved' ? 'btn-success' : '' }).then(function (r) {
        if (r.ok) { MICS.actions.decideExeat(x.id, d); ui.toast('Exeat ' + d.toLowerCase(), sel.student(x.studentId).name); }
      });
    }; });
  }

  // ---------- Kitchen ----------
  function kitchen(body) {
    var db = MICS.state.db;
    var today = ui.dayName(db.meta.today);
    var lastK = db.kitchenWeekly[db.kitchenWeekly.length - 1], prevK = db.kitchenWeekly[db.kitchenWeekly.length - 2];
    var wpm = Math.round(lastK.wasteKg * 1000 / lastK.meals), wpmPrev = Math.round(prevK.wasteKg * 1000 / prevK.meals);
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Meals served (week)', ui.num(lastK.meals), 'utensils') + MICS.statCard('Food waste (week)', lastK.wasteKg + ' kg', 'trend-down', 'success') + MICS.statCard('Waste per meal', wpm + ' g <span class="text-sm muted" style="font-weight:500">' + (wpm - wpmPrev) + ' g wk/wk</span>', 'activity', 'gold') + MICS.statCard('Items below reorder', db.inventory.filter(function (i) { return i.stock <= i.reorder; }).length, 'alert', 'danger') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-12', title: 'Weekly meal plan', sub: 'Week 10 · balanced menu approved by the School Nurse', action: '<button class="btn btn-sm" data-demo="Edit meal plan" data-demo-text="Menu planning with nutritional analysis and allergen flags is part of the full Kitchen & Catering module.">' + ui.icon('edit') + 'Edit plan</button>', bodyCls: 'flush',
        body: '<div class="table-wrap"><div class="menu-grid" style="min-width:720px"><div class="mh">Day</div><div class="mh">Breakfast</div><div class="mh">Lunch</div><div class="mh">Supper</div>' + db.menu.map(function (d) { var t = d.day === today ? ' today' : ''; return '<div class="md' + t + '">' + d.day + (t ? ' <span class="badge sm gold">Today</span>' : '') + '</div><div class="' + t + '">' + ui.esc(d.breakfast) + '</div><div class="' + t + '">' + ui.esc(d.lunch) + '</div><div class="' + t + '">' + ui.esc(d.supper) + '</div>'; }).join('') + '</div></div>' }) +
      '<section class="card col-8"><div class="card-head"><div><div class="card-title">Food inventory</div><div class="card-sub">Stock levels against reorder thresholds</div></div></div><div id="inv-table" class="mt-3"></div></section>' +
      ui.card({ cls: 'col-4', title: 'Consumption & wastage', sub: 'Waste (kg) per week', body: '<div id="k-waste"></div><div class="text-xs muted mt-2">Waste reduction initiative launched week 7: portion control and plate-waste monitoring.</div>' }) + '</div>';
    ui.table(body.querySelector('#inv-table'), { rows: db.inventory, paginate: false, compact: true,
      cols: [
        { key: 'item', label: 'Item', render: function (i) { return '<div class="strong" style="color:var(--text)">' + ui.esc(i.item) + '</div><div class="text-xs muted">' + ui.esc(i.supplier) + '</div>'; } },
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'In stock', num: true, render: function (i) { return i.stock + ' <span class="muted text-xs">' + i.unit + '</span>'; } },
        { key: 'reorder', label: 'Reorder at', num: true },
        { key: 'cover', label: 'Days cover', num: true, sort: function (i) { return i.stock / i.dailyUse; }, render: function (i) { var d = Math.floor(i.stock / i.dailyUse); return '<span class="' + (d < 3 ? 'c-danger strong' : '') + '">' + d + '</span>'; } },
        { key: 'st', label: 'Status', sort: function (i) { return i.stock / i.reorder; }, render: function (i) { return i.onOrder ? ui.badge('On order', 'info', true) : i.stock <= i.reorder ? ui.badge('Low stock', 'danger', true) : ui.badge('OK', 'success', true); } },
        { key: 'a', label: '', sortable: false, render: function (i) { return i.stock <= i.reorder && !i.onOrder ? '<button class="btn btn-sm" data-reorder="' + i.id + '">Reorder</button>' : ''; } }
      ], bind: bindReorder });
    charts.bars(body.querySelector('#k-waste'), { labels: db.kitchenWeekly.map(function (w) { return w.week; }), series: [{ name: 'Food waste', color: 'var(--chart-4)', values: db.kitchenWeekly.map(function (w) { return w.wasteKg; }) }], height: 190, format: function (v) { return v + ' kg'; } });
  }

  // ---------- Security ----------
  function security(body) {
    var db = MICS.state.db;
    var onSite = db.visitors.filter(function (v) { return !v.timeOut; });
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Visitors today', db.visitors.length, 'users') + MICS.statCard('Currently on site', onSite.length, 'map-pin', 'gold') + MICS.statCard('Open incidents', db.incidents.filter(function (i) { return i.status !== 'Closed'; }).length, 'alert', 'danger') + MICS.statCard('Incidents this term', db.incidents.length, 'shield') + '</div>' +
      '<div class="grid-12"><section class="card col-7"><div class="card-head"><div><div class="card-title">Visitor log — today</div><div class="card-sub">Reception & main gate · ' + ui.date(db.meta.today) + '</div></div><button class="btn btn-sm" data-demo="Check in visitor" data-demo-text="Visitor check-in with Ghana Card capture, host notification and badge printing is part of the full Security & Reception module.">' + ui.icon('plus') + 'Check in visitor</button></div><div id="vis-table" class="mt-3"></div></section>' +
      ui.card({ cls: 'col-5', title: 'Security incidents', sub: 'Term 1', bodyCls: 'flush', body: '<div class="list">' + db.incidents.map(function (i) { return '<div class="list-item" style="align-items:flex-start"><span class="li-icon ' + (i.severity === 'Medium' ? 'warning' : '') + '">' + ui.icon('shield') + '</span><div class="li-main"><div class="li-title">' + ui.esc(i.type) + ' · ' + ui.esc(i.location) + '</div><div class="li-sub">' + ui.esc(i.summary) + '</div><div class="text-xs faint mt-1">' + i.id + ' · ' + ui.date(i.date) + '</div></div><div class="li-meta">' + ui.status(i.status) + ui.priority(i.severity) + '</div></div>'; }).join('') + '</div>' }) + '</div>';
    ui.table(body.querySelector('#vis-table'), { rows: db.visitors, paginate: false, compact: true,
      cols: [
        { key: 'name', label: 'Visitor', render: function (v) { return '<div class="strong" style="color:var(--text)">' + ui.esc(v.name) + '</div><div class="text-xs muted">' + ui.esc(v.purpose) + '</div>'; } },
        { key: 'host', label: 'Host', sort: function (v) { return sel.emp(v.hostId).shortName; }, render: function (v) { return ui.esc(sel.emp(v.hostId).shortName); } },
        { key: 'timeIn', label: 'In', num: true },
        { key: 'timeOut', label: 'Out', num: true, render: function (v) { return v.timeOut || '<span class="badge info">On site</span>'; } },
        { key: 'badge', label: 'Badge', render: function (v) { return '<span class="mono">' + v.badge + '</span>'; } },
        { key: 'a', label: '', sortable: false, render: function (v) { return v.timeOut ? '' : '<button class="btn btn-sm" data-out="' + v.id + '">Check out</button>'; } }
      ], bind: function (t) { t.querySelectorAll('[data-out]').forEach(function (b) { b.onclick = function () { var v = db.visitors.find(function (x) { return x.id === b.getAttribute('data-out'); }); MICS.actions.checkoutVisitor(v.id); ui.toast('Visitor checked out', v.name + ' · badge ' + v.badge + ' returned'); }; }); } });
  }

  // ---------- Infirmary ----------
  function infirmary(body) {
    var inf = MICS.state.db.infirmary;
    var total = inf.categories.reduce(function (a, c) { return a + c.value; }, 0);
    body.innerHTML = '<div class="restricted mb-4">' + '<span class="li-icon navy">' + ui.icon('lock') + '</span><div><div class="strong">Confidential medical records are restricted</div><div class="text-sm muted mt-1">Individual student health records, diagnoses and medication are accessible only to authorised Infirmary staff under the school’s data protection policy. This view shows aggregated, non-identifiable operational statistics for management.</div></div></div>' +
      '<div class="grid grid-4 mb-4">' + MICS.statCard('Visits this week', inf.weekly[inf.weekly.length - 1].visits, 'cross') + MICS.statCard('Visits this term', inf.weekly.reduce(function (a, w) { return a + w.visits; }, 0) + 140, 'activity') + MICS.statCard('External referrals', inf.referrals, 'external', 'gold') + MICS.statCard('Staff on duty', inf.staffOnDuty, 'users', 'success') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-7', title: 'Weekly infirmary visits', sub: 'All students, weeks 5–10', body: '<div id="inf-wk"></div>' }) +
      ui.card({ cls: 'col-5', title: 'Visits by category', sub: 'Last 4 weeks · aggregated', body: charts.hbars(inf.categories.map(function (c) { return { label: c.label, value: c.value, display: c.value + ' <span class="muted" style="font-weight:500">(' + Math.round(c.value / total * 100) + '%)</span>' }; }), { valueLabel: 'Visits' }) }) + '</div>';
    charts.bars(body.querySelector('#inf-wk'), { labels: inf.weekly.map(function (w) { return w.week; }), series: [{ name: 'Visits', color: 'var(--chart-3)', values: inf.weekly.map(function (w) { return w.visits; }) }], height: 210 });
  }

  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
})();
