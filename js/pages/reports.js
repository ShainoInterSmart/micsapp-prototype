/* ==========================================================================
   Reports & analytics
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel;
  var rf = { prog: '', from: '2026-09-07', to: '2026-11-11' };

  function progFilter(s) { return !rf.prog || s.programmeId === rf.prog; }
  var REPORTS = [
    { id: 'academic', title: 'Academic performance summary', desc: 'Class averages, pass rates and attainment bands by class.', icon: 'bar-chart', module: 'Academics',
      build: function (db) {
        var rows = db.classes.filter(function (c) { return !rf.prog || c.programmeId === rf.prog; }).map(function (c) { var st = sel.classStudents(c.id); var avg = st.reduce(function (a, s) { return a + s.avg; }, 0) / st.length; return [c.name, sel.prog(c.programmeId).short, st.length, avg.toFixed(1) + '%', (st.filter(function (s) { return s.avg >= 50; }).length / st.length * 100).toFixed(0) + '%', st.filter(function (s) { return s.avg >= 75; }).length, st.filter(function (s) { return s.avg < 50; }).length]; });
        return { head: ['Class', 'Programme', 'Students', 'Average', 'Pass rate', 'Distinctions', 'Below 50%'], rows: rows, num: [2, 3, 4, 5, 6] };
      } },
    { id: 'attendance', title: 'Attendance report', desc: 'Attendance rates and chronic absence by class.', icon: 'check-square', module: 'Attendance',
      build: function (db) {
        var rows = db.classes.filter(function (c) { return !rf.prog || c.programmeId === rf.prog; }).map(function (c) { var st = sel.classStudents(c.id); var att = st.reduce(function (a, s) { return a + sel.attPct(s); }, 0) / st.length; return [c.name, sel.emp(c.tutorId).shortName, st.length, att.toFixed(1) + '%', st.filter(function (s) { return sel.attPct(s) < 85; }).length, st.filter(function (s) { return sel.attPct(s) >= 98; }).length]; });
        return { head: ['Class', 'Form tutor', 'Students', 'Attendance', 'Below 85%', '≥ 98%'], rows: rows, num: [2, 3, 4, 5] };
      } },
    { id: 'fees', title: 'Fee collection & receivables', desc: 'Invoiced, collected and outstanding by programme.', icon: 'wallet', module: 'Finance',
      build: function (db) {
        var rows = db.programmes.filter(function (p) { return !rf.prog || p.id === rf.prog; }).map(function (p) { var inv = db.invoices.filter(function (i) { return sel.student(i.studentId).programmeId === p.id; }); var a = inv.reduce(function (s, i) { return s + i.amount; }, 0), c = inv.reduce(function (s, i) { return s + i.paid; }, 0), o = inv.reduce(function (s, i) { return s + sel.balance(i); }, 0); return [p.name, inv.length, ui.money(a), ui.money(c), ui.money(o), (c / a * 100).toFixed(1) + '%']; });
        return { head: ['Programme', 'Invoices', 'Invoiced', 'Collected', 'Outstanding', 'Collection rate'], rows: rows, num: [1, 2, 3, 4, 5], note: 'QuickBooks Read-Only Integration — Simulated for Prototype. Figures illustrative.' };
      } },
    { id: 'budget', title: 'Budget variance report', desc: 'YTD plan vs actual and commitments by cost centre.', icon: 'target', module: 'Finance',
      build: function (db) { return { head: ['Cost centre', 'Annual budget', 'YTD plan', 'YTD actual', 'Committed', 'Variance'], rows: db.budgets.map(function (b) { return [b.dept, ui.money(b.budget), ui.money(b.plan), ui.money(b.actual), ui.money(b.committed), ((b.actual - b.plan) / b.plan * 100).toFixed(1) + '%']; }), num: [1, 2, 3, 4, 5], note: 'Illustrative figures.' }; } },
    { id: 'admissions', title: 'Admissions pipeline report', desc: 'Applications by stage, programme and source.', icon: 'user-plus', module: 'Admissions',
      build: function (db) {
        var rows = db.admissions.filter(function (a) { return (!rf.prog || a.programmeId === rf.prog) && a.submitted >= rf.from && a.submitted <= rf.to; }).map(function (a) { return [a.id, a.name, sel.cls(a.targetClass).name, MICS.stageName(a.stage), a.score != null ? a.score + '%' : '—', a.source, ui.date(a.submitted)]; });
        return { head: ['Ref', 'Applicant', 'Entry class', 'Stage', 'Assessment', 'Source', 'Submitted'], rows: rows, num: [4] };
      } },
    { id: 'staff', title: 'Staff & HR summary', desc: 'Headcount, appraisal and attendance by department.', icon: 'id-card', module: 'HRMS',
      build: function (db) {
        var d = {}; db.employees.forEach(function (e) { d[e.department] = d[e.department] || []; d[e.department].push(e); });
        return { head: ['Department', 'Staff', 'Teaching', 'Appraisals complete', 'Avg attendance'], rows: Object.keys(d).sort().map(function (k) { var l = d[k]; return [k, l.length, l.filter(function (e) { return e.type === 'Teaching'; }).length, l.filter(function (e) { return e.appraisal === 'Completed'; }).length + '/' + l.length, (l.reduce(function (a, e) { return a + e.attendance; }, 0) / l.length).toFixed(1) + '%']; }), num: [1, 2, 3, 4] };
      } },
    { id: 'operations', title: 'Operations & maintenance report', desc: 'Requests by status, priority and turnaround.', icon: 'wrench', module: 'Operations',
      build: function (db) { return { head: ['Request', 'Location', 'Category', 'Priority', 'Status', 'Reported', 'Days open'], rows: db.maintenance.filter(function (m) { return m.reported >= rf.from && m.reported <= rf.to; }).map(function (m) { return [m.id + ' ' + m.title, m.location, m.category, m.priority, m.status, ui.date(m.reported), ui.daysBetween(m.reported, m.completed || db.meta.today)]; }), num: [6] }; } },
    { id: 'kpi', title: 'Strategic KPI report', desc: 'Institutional KPIs vs targets for the Board.', icon: 'landmark', module: 'Governance',
      build: function (db) { var m = sel.metrics(); return { head: ['KPI', 'Department', 'Current', 'Target', 'Status'], rows: db.kpis.map(function (k) { var v = sel.kpiValue(k, m); return [k.name, k.dept, k.unit === '%' ? v.toFixed(1) + '%' : v + ' ' + k.unit, k.target + (k.unit === '%' ? '%' : ' ' + k.unit), ui.ragLabel(sel.kpiRag(k, v))]; }), num: [2, 3] }; } }
  ];

  MICS.page('reports', {
    title: 'Reports & Analytics', roles: ['head', 'admin'],
    crumbs: function (p) { var r = REPORTS.find(function (x) { return x.id === p[0]; }); return r ? [['Reports & Analytics', '#/reports'], [r.title]] : [['Reports & Analytics']]; },
    render: function (el, params) {
      var r = REPORTS.find(function (x) { return x.id === params[0]; });
      if (!r) {
        el.innerHTML = ui.pageHead({ title: 'Reports & Analytics', desc: 'Standard institutional reports generated from live MICSAPP data. Filter, print to PDF or export to CSV.' }) +
          '<div class="grid grid-4">' + REPORTS.map(function (x) { return '<button class="card report-card clickable" data-href="#/reports/' + x.id + '"><span class="li-icon navy">' + ui.icon(x.icon) + '</span><span><span class="rc-t" style="display:block">' + ui.esc(x.title) + '</span><span class="rc-d" style="display:block">' + ui.esc(x.desc) + '</span><span class="tag mt-2">' + x.module + '</span></span></button>'; }).join('') + '</div>' +
          '<div class="banner neutral mt-6">' + ui.icon('info') + '<div>Scheduled report delivery (e.g. weekly Board digest by email) is a planned capability of the full system.</div></div>';
        return;
      }
      var db = MICS.state.db, out = r.build(db), u = MICS.auth.user();
      el.innerHTML = '<a class="btn btn-ghost btn-sm mb-3 no-print" href="#/reports">' + ui.icon('arrow-left') + 'All reports</a>' +
        '<section class="card mb-4 no-print"><div class="toolbar"><span class="text-sm strong">Filters</span><select class="select" id="rp-prog"><option value="">All programmes</option>' + db.programmes.map(function (p) { return '<option value="' + p.id + '"' + (rf.prog === p.id ? ' selected' : '') + '>' + p.short + '</option>'; }).join('') + '</select>' +
        '<label class="text-sm muted">From <input class="input" style="height:34px;width:auto;display:inline-block" type="date" id="rp-from" value="' + rf.from + '"></label><label class="text-sm muted">To <input class="input" style="height:34px;width:auto;display:inline-block" type="date" id="rp-to" value="' + rf.to + '"></label>' +
        '<div class="grow"></div><button class="btn" id="rp-csv">' + ui.icon('download') + 'Export CSV</button><button class="btn btn-primary" id="rp-print">' + ui.icon('printer') + 'Print / PDF</button></div></section>' +
        '<div class="report-doc"><div class="report-doc-head"><div><div class="page-eyebrow">Morgan International Community School · MICSAPP</div><h2>' + ui.esc(r.title) + '</h2><div class="text-sm muted mt-1">' + ui.esc(r.desc) + '</div></div><div class="text-sm muted right">Generated ' + ui.date(db.meta.today) + '<br>by ' + ui.esc(u.name) + '<br>Period ' + ui.date(rf.from) + ' – ' + ui.date(rf.to) + (rf.prog ? '<br>Programme: ' + sel.prog(rf.prog).short : '') + '</div></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' + out.head.map(function (h, i) { return '<th class="' + (out.num.indexOf(i) > -1 ? 'num' : '') + '">' + ui.esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + (out.rows.length ? out.rows.map(function (row) { return '<tr>' + row.map(function (c, i) { return '<td class="' + (out.num.indexOf(i) > -1 ? 'num' : '') + '">' + ui.esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + out.head.length + '">' + ui.empty('No records for the selected filters', 'Widen the date range or clear the programme filter.', 'search') + '</td></tr>') + '</tbody></table></div>' +
        '<div class="text-xs muted mt-4">' + out.rows.length + ' rows · Demonstration data — fictional records. ' + (out.note || '') + '</div></div>';
      el.querySelector('#rp-prog').onchange = function (e) { rf.prog = e.target.value; MICS.router.render({ keepScroll: true }); };
      el.querySelector('#rp-from').onchange = function (e) { if (e.target.value > rf.to) { ui.toast('Invalid date range', 'Start date must be before the end date.', 'error'); e.target.value = rf.from; return; } rf.from = e.target.value; MICS.router.render({ keepScroll: true }); };
      el.querySelector('#rp-to').onchange = function (e) { if (e.target.value < rf.from) { ui.toast('Invalid date range', 'End date must be after the start date.', 'error'); e.target.value = rf.to; return; } rf.to = e.target.value; MICS.router.render({ keepScroll: true }); };
      el.querySelector('#rp-csv').onclick = function () { ui.downloadCSV('micsapp-' + r.id + '-report.csv', out.head, out.rows); };
      el.querySelector('#rp-print').onclick = function () { window.print(); };
    }
  });
})();
