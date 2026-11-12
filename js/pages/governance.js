/* ==========================================================================
   Governance & Board · Strategic Plan & KPIs
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var TABS = [{ id: 'overview', label: 'Board overview' }, { id: 'meetings', label: 'Meetings & resolutions' }, { id: 'actions', label: 'Action items' }];

  MICS.page('governance', {
    title: 'Governance & Board', roles: ['head', 'admin'],
    navKey: function (p) { return 'governance/' + (p[0] || 'overview'); },
    crumbs: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'overview'); }) || TABS[0]; return [['Governance & Board', '#/governance/overview'], [t.label]]; },
    render: function (el, params, query) {
      var tab = params[0] || 'overview';
      var db = MICS.state.db;
      var open = db.actions.filter(function (a) { return a.status !== 'Completed'; });
      var overdue = open.filter(function (a) { return sel.actionStatus(a).label === 'Overdue'; });
      var next = db.meetings.filter(function (m) { return m.date >= db.meta.today; }).sort(function (a, b) { return a.date.localeCompare(b.date); })[0];
      el.innerHTML = ui.pageHead({ eyebrow: 'Institutional governance', title: 'Governance & Board', desc: 'Board meetings, resolutions, action tracking and management approvals, linked to the Strategic Plan 2025–2029.',
        actions: '<a class="btn" href="#/strategy">' + ui.icon('target') + 'Strategic plan</a><button class="btn btn-primary" data-demo="Board pack" data-demo-text="Board packs combining papers, KPIs and action status are compiled automatically in the full system and shared securely with Board members.">' + ui.icon('file-text') + 'Prepare board pack</button>' }) +
        '<div class="grid grid-4 mb-4">' + MICS.statCard('Next meeting', next ? ui.dateShort(next.date) : '—', 'calendar', 'gold') + MICS.statCard('Open actions', open.length, 'flag') + MICS.statCard('Overdue actions', overdue.length, 'alert', overdue.length ? 'danger' : 'success') + MICS.statCard('Resolutions in progress', db.resolutions.filter(function (r) { return r.status === 'In progress'; }).length, 'landmark') + '</div>' +
        ui.tabs(TABS, tab, 'data-gtab') + '<div class="mt-6" id="gv-body"></div>';
      var body = el.querySelector('#gv-body');
      ({ overview: overview, meetings: meetings, actions: actions }[tab] || overview)(body, query);
      el.querySelectorAll('[data-gtab]').forEach(function (b) { b.onclick = function () { location.hash = '#/governance/' + b.getAttribute('data-gtab'); }; });
    }
  });

  function overview(body) {
    var db = MICS.state.db;
    var sp = sel.strategicProgress();
    var pendApr = db.approvals.filter(function (a) { return a.status === 'Pending'; });
    var cats = ['Admissions', 'Departmental', 'HR', 'Operational'];
    body.innerHTML = '<div class="grid-12">' +
      ui.card({ cls: 'col-7', title: 'Upcoming meetings', bodyCls: 'flush', body: '<div class="list">' + db.meetings.filter(function (m) { return m.date >= db.meta.today; }).map(meetingRow).join('') + '</div>' }) +
      ui.card({ cls: 'col-5', title: 'Strategic Plan 2025–2029', sub: 'Pillar progress · Year 2 of 5', action: '<a class="card-link" href="#/strategy">Details ' + ui.icon('arrow-right') + '</a>', body: '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:12px">' + sp.map(function (s) { return '<div class="center">' + '<div style="display:flex;justify-content:center">' + charts.ring(s.progress, { size: 64, stroke: 6, color: s.rag === 'g' ? 'var(--chart-1)' : 'var(--chart-2)' }) + '</div><div class="text-xs mt-2" style="color:var(--text-2);line-height:1.3">' + ui.esc(s.p.pillar.split(' & ')[0]) + '</div></div>'; }).join('') + '</div>' }) +
      ui.card({ cls: 'col-7', title: 'Open action items', action: '<a class="card-link" href="#/governance/actions">All actions ' + ui.icon('arrow-right') + '</a>', bodyCls: 'flush', body: '<div class="list">' + db.actions.filter(function (a) { return a.status !== 'Completed'; }).sort(function (a, b) { return a.due.localeCompare(b.due); }).map(actionRow).join('') + '</div>' }) +
      ui.card({ cls: 'col-5', title: 'Management approvals', sub: 'Pending decisions by queue', body: cats.map(function (c) { var n = pendApr.filter(function (a) { return a.category === c; }).length; return '<div class="flex items-center gap-3" style="padding:8px 0;border-bottom:1px solid var(--divider)"><span class="li-icon navy">' + ui.icon(MICS.catIcon(c)) + '</span><span class="grow text-sm">' + c + '</span><strong class="num">' + n + '</strong></div>'; }).join(''), foot: '<span class="muted">' + pendApr.length + ' pending in total</span><a class="card-link" href="#/approvals">Approvals inbox ' + ui.icon('arrow-right') + '</a>' }) +
      ui.card({ cls: 'col-12', title: 'Board resolutions', bodyCls: 'flush', body: resTable() }) + '</div>';
    bindActions(body);
  }
  function meetingRow(m) {
    return '<div class="list-item" style="align-items:flex-start">' + ui.dateBlock(m.date) + '<div class="li-main"><div class="li-title">' + ui.esc(m.title) + '</div><div class="li-sub">' + ui.esc(m.venue) + ' · ' + m.agenda.length + ' agenda items</div><div class="flex wrap gap-1 mt-2">' + m.agenda.map(function (a) { return '<span class="tag">' + ui.esc(a) + '</span>'; }).join('') + '</div></div><div class="li-meta">' + ui.status(m.status) + (m.status === 'Scheduled' ? '<span class="text-xs">Papers ' + m.papersReady + '/' + m.agenda.length + '</span>' : '') + '</div></div>';
  }
  function actionRow(a) {
    var st = sel.actionStatus(a);
    return '<div class="list-item clickable" data-act="' + a.id + '"><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + a.id + ' · ' + ui.esc(sel.emp(a.ownerId).shortName) + ' · due ' + ui.date(a.due) + '</div><div class="mt-2" style="max-width:260px">' + ui.progress(a.progress, st.tone === 'danger' ? 'danger' : st.tone === 'success' ? 'success' : '') + '</div></div><div class="li-meta">' + ui.status(st.label, st.tone) + '<span class="num">' + a.progress + '%</span></div></div>';
  }
  function resTable() {
    var db = MICS.state.db;
    return '<table class="table"><thead><tr><th>Resolution</th><th>Meeting</th><th>Date</th><th>Linked actions</th><th>Status</th></tr></thead><tbody>' + db.resolutions.map(function (r) { var n = db.actions.filter(function (a) { return a.resolutionId === r.id; }).length; return '<tr><td><div class="strong" style="color:var(--text)">' + ui.esc(r.title) + '</div><div class="text-xs muted mono">' + r.id + '</div></td><td class="mono text-sm">' + r.meetingId + '</td><td class="nowrap">' + ui.date(r.date) + '</td><td class="num">' + (n || '—') + '</td><td>' + ui.status(r.status) + '</td></tr>'; }).join('') + '</tbody></table>';
  }

  function meetings(body) {
    var db = MICS.state.db;
    body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-12', title: 'Board & committee meetings', sub: 'FY 2026/27', bodyCls: 'flush', body: '<div class="list">' + db.meetings.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(meetingRow).join('') + '</div>' }) +
      ui.card({ cls: 'col-12', title: 'Resolutions register', bodyCls: 'flush', body: resTable() }) + '</div>';
  }

  function actions(body, query) {
    var db = MICS.state.db;
    body.innerHTML = '<section class="card"><div class="card-head"><div><div class="card-title">Action items</div><div class="card-sub">Select an action to review progress and post an update</div></div></div><div id="act-table" class="mt-3"></div></section>';
    ui.table(body.querySelector('#act-table'), { rows: db.actions, paginate: false, sortKey: 'due', onRow: function (a) { openAction(a.id); },
      cols: [
        { key: 'title', label: 'Action', render: function (a) { return '<div class="strong" style="color:var(--text)">' + ui.esc(a.title) + '</div><div class="text-xs muted">' + a.id + (a.resolutionId ? ' · ' + a.resolutionId : '') + '</div>'; } },
        { key: 'owner', label: 'Owner', sort: function (a) { return sel.emp(a.ownerId).shortName; }, render: function (a) { return ui.person(sel.emp(a.ownerId).shortName, sel.emp(a.ownerId).role); } },
        { key: 'due', label: 'Due', render: function (a) { return '<span class="nowrap">' + ui.date(a.due) + '</span>'; } },
        { key: 'priority', label: 'Priority', render: function (a) { return ui.priority(a.priority); } },
        { key: 'progress', label: 'Progress', render: function (a) { return '<div class="flex items-center gap-2"><div style="width:90px">' + ui.progress(a.progress, sel.actionStatus(a).tone === 'danger' ? 'danger' : a.status === 'Completed' ? 'success' : '') + '</div><span class="num text-sm">' + a.progress + '%</span></div>'; } },
        { key: 'status', label: 'Status', sort: function (a) { return sel.actionStatus(a).label; }, render: function (a) { var s = sel.actionStatus(a); return ui.status(s.label, s.tone); } }
      ] });
    var open = query && query.get('open');
    if (open && !document.querySelector('.drawer')) { history.replaceState(null, '', '#/governance/actions'); openAction(open); }
  }
  function bindActions(root) { root.querySelectorAll('[data-act]').forEach(function (r) { r.onclick = function () { openAction(r.getAttribute('data-act')); }; }); }

  function openAction(id) {
    var dr = ui.drawer({ title: '' });
    function draw() {
      var a = sel.get('actions', id); if (!a) { dr.close(); return; }
      var st = sel.actionStatus(a), owner = sel.emp(a.ownerId), res = a.resolutionId ? MICS.state.db.resolutions.find(function (r) { return r.id === a.resolutionId; }) : null;
      var body = '<div class="drawer-section"><div class="dl-grid">' + kv('Owner', owner.shortName) + kv('Role', owner.role) + kv('Due date', ui.date(a.due)) + kv('Priority', a.priority) + kv('Progress', a.progress + '%') + kv('Status', st.label) + '</div>' +
        (res ? '<div class="banner navy mt-4">' + ui.icon('landmark') + '<div>Linked to <strong>' + res.id + '</strong>: ' + ui.esc(res.title) + '</div></div>' : '') +
        (st.label === 'Overdue' ? '<div class="banner danger mt-3">' + ui.icon('alert') + '<div>This action is past its due date. Update progress or agree a revised date.</div></div>' : '') + '</div>' +
        '<div class="drawer-section"><h4>Post an update</h4><div class="form-grid">' +
          ui.field({ id: 'ac-status', label: 'Status', type: 'select', value: a.status, options: ['Not started', 'In progress', 'Completed'] }) +
          ui.field({ id: 'ac-due', label: 'Due date', type: 'date', value: a.due }) +
          '<div class="field full"><label for="ac-progress">Progress: <span id="ac-pv" class="num">' + a.progress + '%</span></label><input type="range" class="range" id="ac-progress" min="0" max="100" step="5" value="' + a.progress + '"></div>' +
          ui.field({ id: 'ac-comment', label: 'Update comment', type: 'textarea', full: true, required: true, placeholder: 'What has been done since the last update?' }) + '</div></div>' +
        '<div class="drawer-section"><h4>Update history</h4><div class="timeline">' + a.updates.map(function (u, i) { return '<div class="tl-item ' + (i === 0 ? 'current' : 'done') + '"><span class="tl-dot"></span><div class="tl-title">' + ui.esc(u.by) + '</div><div class="tl-sub">' + ui.date(u.date) + '</div><div class="tl-note">' + ui.esc(u.text) + '</div></div>'; }).join('') + '</div></div>';
      dr.render({ title: a.title, sub: '<span class="mono">' + a.id + '</span>' + ui.status(st.label, st.tone) + ui.priority(a.priority), lead: '<span class="li-icon navy" style="width:40px;height:40px">' + ui.icon('flag') + '</span>', body: body,
        foot: '<button class="btn btn-ghost left" data-close-dr>Close</button><button class="btn btn-primary" data-save>' + ui.icon('check') + 'Save update</button>',
        bind: function (root) {
          root.querySelector('[data-close-dr]').onclick = dr.close;
          var rng = root.querySelector('#ac-progress'), sts = root.querySelector('#ac-status');
          rng.oninput = function () { root.querySelector('#ac-pv').textContent = rng.value + '%'; if (+rng.value === 100) sts.value = 'Completed'; else if (+rng.value > 0 && sts.value === 'Not started') sts.value = 'In progress'; };
          sts.onchange = function () { if (sts.value === 'Completed') { rng.value = 100; root.querySelector('#ac-pv').textContent = '100%'; } };
          root.querySelector('[data-save]').onclick = function () {
            if (!ui.validate(root, { 'ac-comment': function (v) { return !v ? 'Please add a short update comment.' : null; }, 'ac-due': ui.required('Due date') })) return;
            MICS.actions.updateAction(id, { status: sts.value, progress: +rng.value, due: ui.val(root, 'ac-due') }, ui.val(root, 'ac-comment'));
            ui.toast('Action updated', a.id + ' · ' + sts.value + ' (' + rng.value + '%)'); draw();
          };
        } });
    }
    draw();
  }

  // ---------- Strategic plan & KPIs ----------
  MICS.page('strategy', {
    title: 'Strategic Plan & KPIs', roles: ['head', 'admin'],
    crumbs: function () { return [['Governance & Compliance'], ['Strategic Plan & KPIs']]; },
    render: function (el) {
      var db = MICS.state.db, m = sel.metrics();
      var sp = sel.strategicProgress(), overall = sel.overallStrategic();
      var objs = []; db.strategicPlan.forEach(function (p) { objs = objs.concat(p.objectives); });
      el.innerHTML = ui.pageHead({ eyebrow: 'Strategic Planning & KPIs', title: 'Strategic Plan 2025–2029', desc: 'Year 2 progress against five strategic pillars, with institutional KPIs drawn live from academic, finance, HR and operations data. Pillars and targets are illustrative for this prototype.' }) +
        '<div class="grid grid-4 mb-4">' + MICS.statCard('Overall progress', overall + '%', 'target', 'gold') + MICS.statCard('Objectives on track', objs.filter(function (o) { return o.rag === 'g'; }).length + ' / ' + objs.length, 'check-circle', 'success') + MICS.statCard('At risk', objs.filter(function (o) { return o.rag === 'a'; }).length, 'alert', 'gold') + MICS.statCard('Off track', objs.filter(function (o) { return o.rag === 'r'; }).length, 'x-circle', 'danger') + '</div>' +
        '<div class="grid grid-2 mb-4">' + sp.map(function (s) {
          return '<div class="card pillar-card"><div class="flex items-center gap-4 mb-3">' + charts.ring(s.progress, { size: 60, stroke: 6, color: s.rag === 'g' ? 'var(--chart-1)' : 'var(--chart-2)' }) + '<div class="grow"><div class="text-xs muted strong upper">' + s.p.id + ' · Pillar</div><div class="strong" style="font-size:15px;color:var(--text)">' + ui.esc(s.p.pillar) + '</div><div class="text-xs muted mt-1">Lead: ' + ui.esc(sel.emp(s.p.owner).shortName) + '</div></div>' + ui.badge(ui.ragLabel(s.rag), s.rag === 'g' ? 'success' : 'warning', true) + '</div>' +
            s.p.objectives.map(function (o) { return '<div class="objective"><span class="on flex items-center gap-2">' + ui.rag(o.rag) + ui.esc(o.name) + '</span>' + ui.progress(o.progress, o.rag === 'r' ? 'danger' : o.rag === 'a' ? 'gold' : '') + '<span class="op">' + o.progress + '%</span></div>'; }).join('') + '</div>';
        }).join('') + '</div>' +
        ui.card({ title: 'Institutional KPIs', sub: 'Live values from MICSAPP modules', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>KPI</th><th>Department</th><th class="num">Current</th><th class="num">Target</th><th style="width:180px">vs target</th><th>Status</th></tr></thead><tbody>' + db.kpis.map(function (k) {
          var v = sel.kpiValue(k, m), r = sel.kpiRag(k, v);
          var pct = k.lowerIsBetter ? Math.min(100, k.target / v * 100) : Math.min(100, v / k.target * 100);
          return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(k.name) + '</td><td>' + ui.esc(k.dept) + '</td><td class="num strong">' + (k.unit === '%' ? v.toFixed(1) + '%' : v + ' ' + k.unit) + '</td><td class="num">' + k.target + (k.unit === '%' ? '%' : ' ' + k.unit) + '</td><td>' + ui.progress(pct, r === 'g' ? 'success' : r === 'a' ? 'gold' : 'danger') + '</td><td><span class="flex items-center gap-2 text-sm">' + ui.rag(r) + ui.ragLabel(r) + '</span></td></tr>';
        }).join('') + '</tbody></table>' });
    }
  });

  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
})();
