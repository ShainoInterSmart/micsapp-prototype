/* ==========================================================================
   Management Command Centre (Head of School / Administrator)
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var trendMode = 'scores';
  var actionTab = 'Admissions';

  function weekOfTerm(db) {
    var w = Math.floor(ui.daysBetween(db.meta.termStart, db.meta.today) / 7) + 1;
    var total = Math.ceil((ui.daysBetween(db.meta.termStart, db.meta.termEnd) + 1) / 7);
    return { w: w, total: total };
  }

  function alerts(db, m) {
    var out = [];
    db.maintenance.filter(function (x) { return x.status !== 'Completed' && x.priority === 'Critical'; }).forEach(function (x) {
      out.push({ tone: 'danger', icon: 'wrench', title: x.title, sub: x.id + ' · ' + x.status + (x.assignee ? ' · ' + sel.emp(x.assignee).shortName : ' · Unassigned'), href: '#/operations/facilities?req=' + x.id });
    });
    var overdue = db.actions.filter(function (a) { return sel.actionStatus(a).label === 'Overdue'; });
    if (overdue.length) out.push({ tone: 'danger', icon: 'flag', title: overdue.length + ' board action' + (overdue.length > 1 ? 's' : '') + ' past due date', sub: overdue[0].title, href: '#/governance/actions' });
    if (m.lowStock) out.push({ tone: 'warning', icon: 'utensils', title: m.lowStock + ' kitchen items below reorder level', sub: db.inventory.filter(function (i) { return i.stock <= i.reorder; }).map(function (i) { return i.item.split(' (')[0]; }).slice(0, 3).join(', ') + '…', href: '#/operations/kitchen' });
    var cmp = db.compliance.filter(function (c) { return c.status === 'Action required' || c.status === 'Due soon'; });
    cmp.slice(0, 2).forEach(function (c) { out.push({ tone: c.status === 'Action required' ? 'danger' : 'warning', icon: 'badge-check', title: c.item, sub: c.authority + ' · due ' + ui.date(c.due), href: '#/compliance' }); });
    if (m.finance.pendingCount) out.push({ tone: 'info', icon: 'receipt', title: m.finance.pendingCount + ' parent payment proofs awaiting verification', sub: ui.money(m.finance.pendingAmount) + ' submitted via parent portal', href: '#/finance/verification' });
    var pol = db.policies.filter(function (p) { return p.status === 'Overdue'; });
    pol.forEach(function (p) { out.push({ tone: 'warning', icon: 'file-text', title: 'Policy review overdue: ' + p.name, sub: 'Next review was due ' + ui.date(p.nextReview), href: '#/policies' }); });
    return out;
  }

  MICS.page('dashboard', {
    title: function () { return MICS.auth.role() === 'admin' ? 'Administration Overview' : 'Management Command Centre'; },
    roles: ['head', 'admin'],
    crumbs: function () { return [[MICS.auth.role() === 'admin' ? 'Administration Overview' : 'Command Centre']]; },
    render: function (el) {
      var db = MICS.state.db, m = sel.metrics(), f = m.finance, user = MICS.auth.user();
      var wk = weekOfTerm(db);
      var hour = new Date().getHours();
      var greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      var isHead = user.role === 'head';

      // ---------- Header ----------
      var html = '<div class="dash-hero"><div>' +
        '<div class="page-eyebrow">' + (isHead ? 'Management Command Centre' : 'Administration Overview') + '</div>' +
        '<h1>' + greet + ', ' + ui.esc(user.short) + '</h1>' +
        '<div class="dash-meta"><span>' + ui.longDate(db.meta.today) + '</span><span class="sep"></span><span>AY ' + db.meta.academicYear + ' · ' + db.meta.term + '</span><span class="sep"></span><span class="term-progress">Week ' + wk.w + ' of ' + wk.total + ui.progress(wk.w / wk.total * 100, 'gold') + '</span></div>' +
        '</div><div class="page-actions no-print">' +
        '<button class="btn" id="dash-print">' + ui.icon('printer') + 'Export brief</button>' +
        '<a class="btn btn-primary" href="#/ai">' + ui.icon('sparkle') + 'Ask AI Intelligence Centre</a>' +
        '</div></div>';

      // ---------- Needs attention ----------
      var overdueActions = db.actions.filter(function (a) { return sel.actionStatus(a).label === 'Overdue'; }).length;
      var chips = [];
      if (m.awaitingDecision) chips.push(['a', m.awaitingDecision, 'admission decision' + (m.awaitingDecision > 1 ? 's' : ''), '#/approvals?cat=Admissions']);
      if (m.criticalMaintenance) chips.push(['r', m.criticalMaintenance, 'high-priority maintenance', '#/operations/facilities']);
      if (f.pendingCount) chips.push(['a', f.pendingCount, 'payment proofs to verify', '#/finance/verification']);
      if (overdueActions) chips.push(['r', overdueActions, 'overdue board action', '#/governance/actions']);
      if (m.atRisk) chips.push(['a', m.atRisk, 'students needing academic attention', '#/students?filter=attention']);
      if (chips.length) {
        html += '<div class="attention-banner"><span class="ab-title">Needs attention today</span><div class="ab-items">' +
          chips.map(function (c) { return '<button class="ab-chip" data-href="' + c[3] + '"><span class="rag ' + c[0] + '"></span><strong>' + c[1] + '</strong> ' + c[2] + '</button>'; }).join('') + '</div></div>';
      }

      // ---------- KPIs ----------
      var lastWeekAtt = db.attendanceDaily.slice(-10, -5).reduce(function (a, d) { return a + d.rate; }, 0) / 5;
      var thisWeekAtt = db.attendanceDaily.slice(-5).reduce(function (a, d) { return a + d.rate; }, 0) / 5;
      html += '<div class="kpi-grid">' +
        ui.kpi({ label: 'Enrolled students', icon: 'users', value: ui.num(m.enrolled), href: '#/students', spark: [371, 376, 379, 384, 386, m.enrolled], delta: ui.delta(m.enrolled - 386, '', false, 0), foot: 'vs last term · ' + m.boarders + ' boarders' }) +
        ui.kpi({ label: 'Average attendance', icon: 'check-square', value: m.attendance.toFixed(1) + '<span class="unit">%</span>', href: '#/academics/attendance', spark: db.attendanceDaily.map(function (d) { return d.rate; }), delta: ui.delta(thisWeekAtt - lastWeekAtt, ' pts'), foot: 'week on week · target 95%' }) +
        ui.kpi({ label: 'Active staff', icon: 'id-card', value: ui.num(m.staff), href: '#/hr/directory', foot: m.teaching + ' teaching · ' + m.nonTeaching + ' non-teaching', badge: m.onLeave ? '<span class="badge sm">' + m.onLeave + ' on leave</span>' : '' }) +
        ui.kpi({ label: 'Pending admissions', icon: 'user-plus', tone: 'gold', value: ui.num(m.pendingAdmissions), href: '#/admissions', spark: [6, 8, 9, 11, 12, m.pendingAdmissions], sparkTone: 'gold', foot: '<strong class="text-2">' + m.awaitingDecision + '</strong> awaiting your decision' }) +
        ui.kpi({ label: 'Outstanding fees', icon: 'wallet', tone: 'danger', value: ui.moneyShort(f.outstanding).replace('GHS ', '<span class="unit" style="margin:0 4px 0 0">GHS</span>'), href: '#/finance/overview', spark: [1.42, 1.31, 1.22, 1.15, 1.09, f.outstanding / 1e6], sparkTone: 'danger', foot: 'Collection ' + f.rate.toFixed(1) + '% · target 92%' }) +
        ui.kpi({ label: 'Pending approvals', icon: 'inbox', value: ui.num(m.pendingApprovals), href: '#/approvals', foot: m.highPriorityApprovals ? '<span class="c-danger strong">' + m.highPriorityApprovals + ' high priority</span> · across 4 queues' : 'across 4 queues' }) +
        '</div>';

      // ---------- Academic performance ----------
      html += '<div class="section-title"><div><h2>Academic performance</h2><div class="section-sub">Mid-term 1 results and attendance across all four programmes</div></div><a class="card-link" href="#/academics/exams">Examinations & results ' + ui.icon('arrow-right') + '</a></div>';
      html += '<div class="grid-12">' +
        ui.card({ cls: 'col-8', title: 'Performance trend by programme', sub: trendMode === 'scores' ? 'Average attainment (%), last six terms' : 'Average attendance (%), last six terms',
          action: '<div class="segmented" role="tablist" aria-label="Trend measure"><button class="' + (trendMode === 'scores' ? 'active' : '') + '" data-trend="scores">Attainment</button><button class="' + (trendMode === 'att' ? 'active' : '') + '" data-trend="att">Attendance</button></div>',
          body: '<div id="trend-legend" class="mb-3"></div><div id="trend-chart"></div>' }) +
        ui.card({ cls: 'col-4', title: 'Students by curriculum', sub: 'Current enrolment · ' + db.meta.academicYear, body: '<div class="donut-wrap"><div id="curr-donut"></div><div class="donut-legend" id="curr-legend"></div></div>' }) +
        ui.card({ cls: 'col-7', title: 'Examination performance overview', sub: 'Mid-Term 1 · share of students by attainment band', action: '<span class="badge sm">' + db.students.length + ' students</span>', body: '<div id="band-legend" class="mb-3"></div><div id="band-chart"></div>' }) +
        ui.card({ cls: 'col-5', title: 'Students requiring academic attention', sub: 'Attendance below 85% or average below 50%', action: '<span class="badge warning">' + m.atRisk + ' flagged</span>', bodyCls: 'flush', body: '<div class="list" id="risk-list"></div>', foot: '<span class="muted">Learning support via the 7+1 peer model</span><a class="card-link" href="#/students?filter=attention">View all ' + ui.icon('arrow-right') + '</a>' }) +
        '</div>';

      // ---------- Financial overview ----------
      html += '<div class="section-title"><div><h2>Financial overview</h2><div class="section-sub">Fees, receivables and budget position · all figures illustrative</div></div><div class="flex gap-2 items-center">' + ui.qbBadge() + '<a class="card-link" href="#/finance/overview">Finance ' + ui.icon('arrow-right') + '</a></div></div>';
      var collectedPct = f.collected / f.invoiced * 100, pendingPct = f.pendingAmount / f.invoiced * 100;
      html += '<div class="grid-12">' +
        ui.card({ cls: 'col-4', title: 'Term 1 fee collection', sub: 'Invoiced ' + ui.money(f.invoiced),
          body: '<div class="fee-hero"><span class="big">' + ui.moneyShort(f.collected) + '</span><span class="muted">collected · <strong class="text-2">' + f.rate.toFixed(1) + '%</strong></span></div>' +
            '<div class="fee-bar" aria-label="Collection breakdown"><span style="width:' + collectedPct + '%;background:var(--chart-1)" data-tt="' + charts.tt('Collected', [{ label: 'Amount', value: ui.money(f.collected) }]) + '"></span><span style="width:' + pendingPct + '%;background:var(--chart-2)" data-tt="' + charts.tt('Pending verification', [{ label: 'Amount', value: ui.money(f.pendingAmount) }]) + '"></span></div>' +
            charts.legend([{ label: 'Collected', color: 'var(--chart-1)' }, { label: 'Pending verification', color: 'var(--chart-2)' }, { label: 'Outstanding', color: 'var(--surface-sunken)' }]) +
            '<div class="mt-4 mb-2 text-sm strong">Receivables ageing</div>' +
            charts.hbars([
              { label: 'Part-paid (≥ 60% settled)', value: f.ageing[0], color: 'var(--seq-2)' },
              { label: 'Part-paid (< 60% settled)', value: f.ageing[1], color: 'var(--seq-3)' },
              { label: 'Unpaid — Term 1', value: f.ageing[2], color: 'var(--seq-4)' },
              { label: 'Prior-term arrears', value: f.ageing[3], color: 'var(--seq-5)' }
            ], { format: ui.moneyShort, valueLabel: 'Outstanding' }),
          foot: '<span class="muted">' + f.debtors + ' accounts with balances</span><a class="card-link" href="#/finance/fees">Debtors ' + ui.icon('arrow-right') + '</a>' }) +
        ui.card({ cls: 'col-8', title: 'Budget vs actual by department', sub: 'FY 2026/27 year-to-date · plan phased at ' + Math.round(db.meta.ytdPhase * 100) + '% of annual budget',
          action: charts.legend([{ label: 'Actual', color: 'var(--chart-1)' }, { label: 'Committed', color: 'var(--seq-2)' }, { label: 'YTD plan', color: 'var(--text)' }]),
          body: '<div class="grid grid-2" style="column-gap:32px">' + charts.bullets(db.budgets.slice(0, 5).map(function (b) { return { label: b.dept, plan: b.plan, actual: b.actual, committed: b.committed }; })) + charts.bullets(db.budgets.slice(5).map(function (b) { return { label: b.dept, plan: b.plan, actual: b.actual, committed: b.committed }; })) + '</div>' +
            '<div class="split-stat mt-6"><div><div class="stat-k">Annual budget</div><div class="stat-v">' + ui.moneyShort(f.budget) + '</div></div><div><div class="stat-k">YTD actual vs plan</div><div class="stat-v">' + ui.moneyShort(f.actual) + ' <small>/ ' + ui.moneyShort(f.plan) + '</small></div></div><div><div class="stat-k">Variance</div><div class="stat-v ' + (f.actual > f.plan ? 'c-danger' : 'c-success') + '">' + (f.actual > f.plan ? '+' : '') + ((f.actual - f.plan) / f.plan * 100).toFixed(1) + '%</div></div></div>',
          foot: '<span class="muted">Variance = YTD actual vs phased plan. Over-plan departments shown in red.</span><a class="card-link" href="#/finance/budgets">Cost centres ' + ui.icon('arrow-right') + '</a>' }) +
        '</div>';

      // ---------- Institutional performance ----------
      var sp = sel.strategicProgress();
      var overall = sel.overallStrategic();
      html += '<div class="section-title"><div><h2>Institutional performance</h2><div class="section-sub">Strategic Plan 2025–2029, departmental KPIs and board actions</div></div><a class="card-link" href="#/strategy">Strategic plan ' + ui.icon('arrow-right') + '</a></div>';
      html += '<div class="grid-12">' +
        ui.card({ cls: 'col-4', title: 'Strategic Plan 2025–2029', sub: 'Year 2 of 5 · overall progress', action: charts.ring(overall, { size: 52, stroke: 5, fontSize: 12, color: 'var(--brand-gold)' }),
          body: sp.map(function (s) {
            return '<div class="pillar"><div class="grow"><div class="pillar-name">' + ui.esc(s.p.pillar) + '</div><div class="pillar-sub">' + ui.progress(s.progress, s.rag === 'g' ? '' : 'gold') + '</div></div><div class="right" style="min-width:64px"><div class="strong num">' + s.progress + '%</div><div class="text-xs muted flex items-center gap-1 justify-end">' + ui.rag(s.rag) + ui.ragLabel(s.rag) + '</div></div></div>';
          }).join('') }) +
        ui.card({ cls: 'col-4', title: 'Departmental KPIs', sub: 'Current vs target', bodyCls: 'flush',
          body: '<table class="table compact"><tbody>' + db.kpis.map(function (k) {
            var v = sel.kpiValue(k, m); var r = sel.kpiRag(k, v);
            return '<tr><td><div class="text-sm strong" style="color:var(--text)">' + ui.esc(k.name) + '</div><div class="text-xs muted">' + ui.esc(k.dept) + '</div></td><td class="num nowrap"><span class="strong" style="color:var(--text)">' + (k.unit === '%' ? v.toFixed(1) + '%' : v + k.unit) + '</span><div class="text-xs muted">target ' + k.target + k.unit + '</div></td><td style="width:28px">' + ui.rag(r) + '</td></tr>';
          }).join('') + '</tbody></table>' }) +
        ui.card({ cls: 'col-4', title: 'Board & management actions', sub: 'Open actions from board resolutions', bodyCls: 'flush',
          body: '<div class="list">' + db.actions.filter(function (a) { return a.status !== 'Completed'; }).sort(function (a, b) { return a.due.localeCompare(b.due); }).slice(0, 5).map(function (a) {
            var st = sel.actionStatus(a);
            return '<div class="list-item clickable" data-href="#/governance/actions?open=' + a.id + '"><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(sel.emp(a.ownerId).shortName) + ' · due ' + ui.dateShort(a.due) + '</div><div class="mt-2" style="max-width:220px">' + ui.progress(a.progress, st.tone === 'danger' ? 'danger' : '') + '</div></div><div class="li-meta">' + ui.status(st.label, st.tone) + '<span class="num">' + a.progress + '%</span></div></div>';
          }).join('') + '</div>', foot: '<span class="muted">Next Board meeting: ' + ui.date('2026-12-03') + '</span><a class="card-link" href="#/governance/actions">All actions ' + ui.icon('arrow-right') + '</a>' }) +
        '</div>';

      // ---------- Executive actions ----------
      var cats = ['Admissions', 'Departmental', 'HR', 'Operational'];
      var pend = db.approvals.filter(function (a) { return a.status === 'Pending'; });
      var al = alerts(db, m);
      html += '<div class="section-title"><div><h2>Executive actions</h2><div class="section-sub">Decisions awaiting you and issues requiring attention</div></div><a class="card-link" href="#/approvals">Approvals inbox ' + ui.icon('arrow-right') + '</a></div>';
      html += '<div class="grid-12">' +
        '<section class="card col-8 exec-actions"><div class="card-head"><div><div class="card-title">Pending decisions</div><div class="card-sub">Open a request to review details, then approve, reject or mark as reviewed</div></div></div>' +
        '<div class="mt-3">' + ui.tabs(cats.map(function (c) { return { id: c, label: c === 'Departmental' ? 'Departmental requests' : c === 'HR' ? 'HR approvals' : c === 'Operational' ? 'Operational issues' : 'Admissions', count: pend.filter(function (a) { return a.category === c; }).length }; }), actionTab, 'data-atab') + '</div>' +
        '<div class="list" id="exec-list"></div></section>' +
        ui.card({ cls: 'col-4', title: 'Institutional alerts', sub: al.length + ' items across modules', bodyCls: 'flush',
          body: al.length ? al.slice(0, 6).map(function (a) { return '<div class="alert-item" data-href="' + a.href + '"><span class="li-icon ' + a.tone + '">' + ui.icon(a.icon) + '</span><div class="grow"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(a.sub) + '</div></div></div>'; }).join('') : ui.empty('No active alerts', 'All monitored indicators are within thresholds.', 'check-circle') }) +
        '</div>';

      // ---------- Activity & events ----------
      html += '<div class="grid-12 mt-4">' +
        ui.card({ cls: 'col-8 activity-feed', title: 'Live activity across MICSAPP', sub: 'Every module writes to one shared institutional record', bodyCls: 'flush',
          body: '<div class="list">' + db.activity.slice(0, 7).map(function (a) {
            return '<div class="list-item ' + (a.link ? 'clickable' : '') + '" ' + (a.link ? 'data-href="' + a.link + '"' : '') + '><span class="li-icon navy">' + ui.icon(moduleIcon(a.module)) + '</span><div class="li-main"><div class="li-title" style="font-weight:500">' + ui.esc(a.text) + '</div><div class="li-sub">' + ui.esc(a.actor) + ' · ' + ui.esc(a.module) + '</div></div><div class="li-meta nowrap">' + ui.rel(a.time) + '</div></div>';
          }).join('') + '</div>' }) +
        ui.card({ cls: 'col-4', title: 'Upcoming events', sub: 'Next 30 days', bodyCls: 'flush',
          body: '<div class="list">' + db.events.filter(function (e) { return e.date >= db.meta.today; }).slice(0, 5).map(function (e) {
            return '<div class="list-item">' + ui.dateBlock(e.date) + '<div class="li-main"><div class="li-title">' + ui.esc(e.title) + '</div><div class="li-sub">' + ui.esc(e.location) + (e.end ? ' · until ' + ui.dateShort(e.end) : '') + '</div></div><span class="tag">' + ui.esc(e.type) + '</span></div>';
          }).join('') + '</div>' }) +
        '</div>';

      el.innerHTML = html;

      // ---------- Charts ----------
      var trend = sel.programmeTrend();
      var series = trend.series.map(function (s) { return { name: s.name, color: s.color, values: trendMode === 'scores' ? s.scores : s.att }; });
      el.querySelector('#trend-legend').innerHTML = charts.legend(series.map(function (s) { return { label: s.name, color: s.color }; }), true);
      charts.line(el.querySelector('#trend-chart'), { labels: trend.labels, series: series, height: 240, directLabels: true, target: trendMode === 'scores' ? 70 : 95, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; }, label: 'Performance trend by programme', labelNudge: labelNudges(series) });

      var ps = sel.programmeStats();
      var total = ps.reduce(function (a, p) { return a + p.count; }, 0);
      charts.donut(el.querySelector('#curr-donut'), { items: ps.map(function (p) { return { label: p.p.name, value: p.count, color: p.p.color }; }), center: { value: ui.num(total), label: 'students' }, size: 156, stroke: 20 });
      el.querySelector('#curr-legend').innerHTML = ps.map(function (p) { return '<div class="dl-row"><i style="background:' + p.p.color + '"></i><span class="dl-label">' + ui.esc(p.p.short) + '<span class="text-xs muted" style="display:block">' + ui.esc(p.p.exam) + ' · avg ' + p.avg + '%</span></span><span class="dl-val">' + p.count + '</span><span class="dl-pct">' + (p.count / total * 100).toFixed(0) + '%</span></div>'; }).join('');

      var bands = sel.gradeBands();
      var bandSeries = [
        { name: 'Distinction (≥ 75%)', color: 'var(--seq-5)' }, { name: 'Credit (60–74%)', color: 'var(--seq-4)' },
        { name: 'Pass (50–59%)', color: 'var(--seq-2)' }, { name: 'Below 50%', color: 'var(--chart-4)' }
      ].map(function (s, i) { return { name: s.name, color: s.color, values: bands.map(function (b) { return Math.round(b.values[i] / b.total * 1000) / 10; }) }; });
      el.querySelector('#band-legend').innerHTML = charts.legend(bandSeries.map(function (s) { return { label: s.name, color: s.color }; }));
      charts.bars(el.querySelector('#band-chart'), { labels: bands.map(function (b) { return b.label; }), series: bandSeries, stacked: true, max: 100, height: 220, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; }, showTotal: false, label: 'Attainment bands by programme' });

      el.querySelector('#risk-list').innerHTML = sel.atRisk().slice(0, 6).map(function (r) {
        return '<div class="list-item clickable" data-href="#/students/' + r.s.id + '">' + ui.avatar(r.s.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(r.s.name) + '</div><div class="li-sub">' + ui.esc(sel.cls(r.s.classId).name) + ' · ' + r.reasons.join(' · ') + '</div></div><div class="li-meta">' + ui.badge(r.severity, r.severity === 'High' ? 'danger' : 'warning') + '</div></div>';
      }).join('');

      renderExecList(el);

      // ---------- Interactions ----------
      el.querySelectorAll('[data-trend]').forEach(function (b) { b.onclick = function () { trendMode = b.getAttribute('data-trend'); MICS.router.render({ keepScroll: true }); }; });
      el.querySelectorAll('[data-atab]').forEach(function (b) { b.onclick = function () { actionTab = b.getAttribute('data-atab'); el.querySelectorAll('[data-atab]').forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-selected', x === b); }); renderExecList(el); }; });
      el.querySelector('#dash-print').onclick = function () { ui.toast('Preparing executive brief', 'Use your browser’s print dialog to save as PDF.', 'info'); setTimeout(function () { window.print(); }, 300); };
    }
  });

  function renderExecList(el) {
    var db = MICS.state.db;
    var items = db.approvals.filter(function (a) { return a.status === 'Pending' && a.category === actionTab; });
    var list = el.querySelector('#exec-list');
    list.innerHTML = items.length ? items.map(function (a) {
      var req = sel.emp(a.requesterId);
      return '<div class="list-item clickable" data-apr="' + a.id + '"><span class="li-icon ' + (a.priority === 'High' ? 'danger' : 'navy') + '">' + ui.icon(catIcon(a.category)) + '</span><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(a.subtitle) + ' · ' + ui.esc(req ? req.shortName : '') + ' · ' + ui.rel(a.submitted) + '</div></div><div class="li-meta" style="flex-direction:row;align-items:center;gap:10px">' + ui.priority(a.priority) + '<button class="btn btn-sm" data-apr-btn="' + a.id + '">Review</button></div></div>';
    }).join('') : ui.empty('Nothing pending in ' + actionTab, 'All requests in this queue have been decided. Decisions are recorded in the approvals history.', 'check-circle');
    list.querySelectorAll('[data-apr]').forEach(function (r) { r.onclick = function () { MICS.openApproval(r.getAttribute('data-apr')); }; });
  }

  function labelNudges(series) {
    // Nudge direct labels apart when end values are within ~1.5 units
    var ends = series.map(function (s, i) { return { i: i, v: s.values[s.values.length - 1] }; }).sort(function (a, b) { return b.v - a.v; });
    var out = {}; var lastV = null, push = 0;
    ends.forEach(function (e) { if (lastV != null && lastV - e.v < 1.6) push += 12; else push = 0; out[e.i] = push; lastV = e.v; });
    return out;
  }
  function catIcon(c) { return { Admissions: 'user-plus', Departmental: 'briefcase', HR: 'id-card', Operational: 'wrench' }[c] || 'inbox'; }
  function moduleIcon(mod) {
    return { 'Admissions': 'user-plus', 'Facilities': 'wrench', 'Finance': 'wallet', 'HRMS': 'id-card', 'Kitchen & Catering': 'utensils', 'Security & Reception': 'shield', 'Approvals': 'inbox', 'Attendance': 'check-square', 'Governance': 'landmark', 'Boarding': 'bed', 'Parent Portal': 'home', 'Security': 'lock', 'Library': 'library', 'Policies': 'file-text', 'User Access': 'key' }[mod] || 'activity';
  }
  MICS.moduleIcon = moduleIcon;
  MICS.catIcon = catIcon;
})();
