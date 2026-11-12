/* ==========================================================================
   HRMS
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var TABS = [{ id: 'directory', label: 'Employee directory' }, { id: 'leave', label: 'Leave & attendance' }, { id: 'appraisals', label: 'Appraisals & training' }, { id: 'payroll', label: 'Payroll overview' }];
  var hf = { q: '', type: '', dept: '' };
  var PAY = { L1: 28000, L2: 18000, L3: 14000, L4: 11000, T5: 9500, T4: 8200, T3: 7000, T2: 6000, S5: 5200, S4: 4400, S3: 3600, S2: 3000, S1: 2600 };

  MICS.page('hr', {
    title: 'HRMS', roles: ['head', 'admin'],
    navKey: function (p) { var t = p[0] || 'directory'; return 'hr/' + (t === 'training' ? 'appraisals' : t); },
    crumbs: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'directory'); }) || TABS[0]; return [['HRMS', '#/hr/directory'], [t.label]]; },
    render: function (el, params, query) {
      var tab = params[0] || 'directory';
      if (tab === 'training') tab = 'appraisals';
      var db = MICS.state.db, m = sel.metrics();
      el.innerHTML = ui.pageHead({ eyebrow: 'Human Resources', title: 'HRMS', desc: 'Staff records, leave, appraisals, training and payroll summaries for teaching and non-teaching staff.' }) +
        '<div class="grid grid-4 mb-4">' + MICS.statCard('Active staff', m.staff, 'id-card') + MICS.statCard('Teaching · Non-teaching', m.teaching + ' · ' + m.nonTeaching, 'users') + MICS.statCard('Pending leave requests', db.leaves.filter(function (l) { return l.status === 'Pending'; }).length, 'calendar', 'gold') + MICS.statCard('Appraisals complete', m.appraisalsPct + '%', 'check-circle', m.appraisalsPct < 80 ? 'danger' : 'success') + '</div>' +
        ui.tabs(TABS.map(function (t) { return { id: t.id, label: t.label, count: t.id === 'leave' ? db.leaves.filter(function (l) { return l.status === 'Pending'; }).length || null : null }; }), tab, 'data-htab') + '<div class="mt-6" id="hr-body"></div>';
      var body = el.querySelector('#hr-body');
      ({ directory: directory, leave: leave, appraisals: appraisals, payroll: payroll }[tab])(body, query);
      el.querySelectorAll('[data-htab]').forEach(function (b) { b.onclick = function () { location.hash = '#/hr/' + b.getAttribute('data-htab'); }; });
    }
  });

  function directory(body, query) {
    var db = MICS.state.db;
    var depts = {}; db.employees.forEach(function (e) { depts[e.department] = (depts[e.department] || 0) + 1; });
    var deptList = Object.keys(depts).sort(function (a, b) { return depts[b] - depts[a]; });
    var rows = db.employees.filter(function (e) {
      if (hf.q && (e.name + e.id + e.role).toLowerCase().indexOf(hf.q.toLowerCase()) < 0) return false;
      if (hf.type && e.type !== hf.type) return false;
      if (hf.dept && e.department !== hf.dept) return false;
      return true;
    });
    body.innerHTML = '<div class="grid-12"><section class="card col-8"><div class="toolbar"><div class="search-input">' + ui.icon('search') + '<input type="search" id="hr-q" placeholder="Name, ID or role…" value="' + ui.esc(hf.q) + '"></div>' +
      '<select class="select" id="hr-type"><option value="">All staff</option><option' + (hf.type === 'Teaching' ? ' selected' : '') + '>Teaching</option><option' + (hf.type === 'Non-teaching' ? ' selected' : '') + '>Non-teaching</option></select>' +
      '<select class="select" id="hr-dept"><option value="">All departments</option>' + deptList.map(function (d) { return '<option' + (hf.dept === d ? ' selected' : '') + '>' + ui.esc(d) + '</option>'; }).join('') + '</select></div><div id="hr-table"></div></section>' +
      ui.card({ cls: 'col-4', title: 'Staff distribution', sub: 'By department', body: charts.hbars(deptList.slice(0, 12).map(function (d) { var t = db.employees.filter(function (e) { return e.department === d && e.type === 'Teaching'; }).length; return { label: d, value: depts[d], color: t ? 'var(--chart-1)' : 'var(--chart-3)' }; }), { valueLabel: 'Staff' }) + '<div class="mt-3">' + charts.legend([{ label: 'Teaching departments', color: 'var(--chart-1)' }, { label: 'Support functions', color: 'var(--chart-3)' }]) + '</div>' }) + '</div>';
    ui.table(body.querySelector('#hr-table'), { rows: rows, pageSize: 12, noun: 'staff', onRow: function (e) { empDrawer(e.id); },
      cols: [
        { key: 'name', label: 'Employee', sort: function (e) { return e.last; }, render: function (e) { return ui.person(e.name, e.id + ' · ' + e.email); } },
        { key: 'role', label: 'Role', render: function (e) { return '<div class="text-sm" style="color:var(--text)">' + ui.esc(e.role) + '</div><div class="text-xs muted">' + ui.esc(e.department) + '</div>'; } },
        { key: 'type', label: 'Type', render: function (e) { return '<span class="tag">' + e.type + '</span>'; } },
        { key: 'contract', label: 'Contract' },
        { key: 'attendance', label: 'Attendance', num: true, render: function (e) { return e.attendance.toFixed(1) + '%'; } },
        { key: 'status', label: 'Status', render: function (e) { var onLeave = db.leaves.some(function (l) { return l.empId === e.id && l.status === 'Approved' && l.from <= db.meta.today && l.to >= db.meta.today; }); return onLeave ? ui.badge('On leave', 'warning', true) : ui.status('Active'); } }
      ] });
    var t, q = body.querySelector('#hr-q');
    q.oninput = function () { clearTimeout(t); t = setTimeout(function () { hf.q = q.value; MICS.router.render({ keepScroll: true }); var n = document.getElementById('hr-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
    body.querySelector('#hr-type').onchange = function (e) { hf.type = e.target.value; MICS.router.render({ keepScroll: true }); };
    body.querySelector('#hr-dept').onchange = function (e) { hf.dept = e.target.value; MICS.router.render({ keepScroll: true }); };
    var emp = query && query.get('emp');
    if (emp && !document.querySelector('.drawer')) { history.replaceState(null, '', '#/hr/directory'); empDrawer(emp); }
  }

  function empDrawer(id) {
    var e = sel.emp(id); if (!e) return;
    var classes = sel.teacherClasses(id);
    ui.drawer({ title: e.name, sub: ui.esc(e.role) + ' · ' + ui.esc(e.department) + ' · <span class="mono">' + e.id + '</span>', lead: ui.avatar(e.name, 'lg'),
      body: '<div class="drawer-section"><div class="dl-grid">' + kv('Email', e.email) + kv('Phone', e.phone) + kv('Joined', ui.date(e.joined)) + kv('Contract', e.contract) + kv('Grade', e.grade) + kv('Leave balance', e.leaveBalance + ' days') + kv('Attendance', e.attendance + '%') + kv('Appraisal', e.appraisal) + kv('Type', e.type) + '</div></div>' +
        (classes.length ? '<div class="drawer-section"><h4>Teaching allocation</h4><div class="flex wrap gap-2">' + classes.map(function (c) { return '<span class="tag">' + ui.esc(c.cls.name) + ' · ' + ui.esc(c.subject) + '</span>'; }).join('') + '</div></div>' : '') +
        '<div class="drawer-section"><h4>Training records</h4><table class="table compact"><tbody>' + e.training.map(function (t) { return '<tr><td>' + ui.esc(t.course) + '</td><td class="nowrap">' + ui.date(t.date) + '</td><td>' + ui.status(t.status === 'Scheduled' ? 'Scheduled' : 'Completed') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="banner neutral">' + ui.icon('lock') + '<div>Salary, bank and personal identification details are restricted to HR and Finance roles.</div></div>' });
  }

  function leave(body) {
    var db = MICS.state.db;
    var pending = db.leaves.filter(function (l) { return l.status === 'Pending'; });
    var types = {}; db.leaves.forEach(function (l) { types[l.type] = (types[l.type] || 0) + l.days; });
    body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Leave requests', sub: 'Decisions sync with the Approvals inbox', bodyCls: 'flush', body: '<div class="list">' + db.leaves.map(function (l) {
        var e = sel.emp(l.empId); var apr = db.approvals.find(function (a) { return a.ref && a.ref.kind === 'leave' && a.ref.id === l.id; });
        return '<div class="list-item">' + ui.avatar(e.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(e.shortName) + ' <span class="text-xs muted" style="font-weight:400">' + ui.esc(e.role) + '</span></div><div class="li-sub">' + ui.esc(l.type) + ' · ' + ui.dateShort(l.from) + ' – ' + ui.date(l.to) + ' · ' + l.days + ' days · ' + ui.esc(l.reason) + '</div></div><div class="li-meta" style="flex-direction:row;align-items:center;gap:8px">' +
          (l.status === 'Pending' && apr ? '<button class="btn btn-sm" data-apr="' + apr.id + '">Review</button>' : ui.status(l.status)) + '</div></div>';
      }).join('') + '</div>' }) +
      '<div class="col-4 flex-col gap-4" style="display:flex">' + ui.card({ title: 'Staff attendance', sub: 'Term 1 · biometric clock-in (simulated)', body: '<div class="fee-hero"><span class="big">' + (db.employees.reduce(function (a, e) { return a + e.attendance; }, 0) / db.employees.length).toFixed(1) + '%</span><span class="muted">average</span></div><div class="mt-3">' + charts.hbars([{ label: '≥ 97%', value: db.employees.filter(function (e) { return e.attendance >= 97; }).length, color: 'var(--seq-4)' }, { label: '93–97%', value: db.employees.filter(function (e) { return e.attendance >= 93 && e.attendance < 97; }).length, color: 'var(--seq-3)' }, { label: '< 93%', value: db.employees.filter(function (e) { return e.attendance < 93; }).length, color: 'var(--chart-4)' }], { valueLabel: 'Staff' }) + '</div>' }) +
      ui.card({ title: 'Leave days by type', sub: 'This academic year', body: charts.hbars(Object.keys(types).map(function (k) { return { label: k, value: types[k] }; }), { valueLabel: 'Days' }) }) + '</div></div>';
    body.querySelectorAll('[data-apr]').forEach(function (b) { b.onclick = function () { MICS.openApproval(b.getAttribute('data-apr')); }; });
  }

  function appraisals(body) {
    var db = MICS.state.db;
    var states = ['Completed', 'Manager review', 'Self-review submitted', 'Not started'];
    var counts = states.map(function (s) { return db.employees.filter(function (e) { return e.appraisal === s; }).length; });
    var colors = ['var(--success)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-muted)'];
    var training = []; db.employees.forEach(function (e) { e.training.forEach(function (t) { training.push({ e: e, t: t }); }); });
    var byCourse = {}; training.forEach(function (x) { byCourse[x.t.course] = byCourse[x.t.course] || { done: 0, sched: 0 }; byCourse[x.t.course][x.t.status === 'Completed' ? 'done' : 'sched']++; });
    body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-5', title: 'Appraisal cycle 2026/27', sub: 'Status across ' + db.employees.length + ' staff', body: '<div class="stacked-bar" style="height:14px">' + counts.map(function (c, i) { return c ? '<span style="flex:' + c + ';background:' + colors[i] + '" data-tt="' + charts.tt(states[i], [{ label: 'Staff', value: c }]) + '"></span>' : ''; }).join('') + '</div><div class="mt-4 flex-col gap-2" style="display:flex">' + states.map(function (s, i) { return '<div class="flex justify-between text-sm"><span class="flex items-center gap-2"><i style="width:10px;height:10px;border-radius:3px;background:' + colors[i] + '"></i>' + s + '</span><strong class="num">' + counts[i] + '</strong></div>'; }).join('') + '</div><div class="banner warning mt-4">' + ui.icon('flag') + '<div>Board action ACT-029 (complete manager reviews) passed its due date of 6 Nov.</div></div>' }) +
      ui.card({ cls: 'col-7', title: 'Training & professional development', sub: 'Completed and scheduled courses', bodyCls: 'flush', body: '<table class="table compact"><thead><tr><th>Course</th><th class="num">Completed</th><th class="num">Scheduled</th></tr></thead><tbody>' + Object.keys(byCourse).map(function (k) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(k) + '</td><td class="num">' + byCourse[k].done + '</td><td class="num">' + (byCourse[k].sched || '—') + '</td></tr>'; }).join('') + '</tbody></table>' }) +
      '<section class="card col-12"><div class="card-head"><div><div class="card-title">Appraisal status by employee</div></div><button class="btn btn-sm" data-demo="Send appraisal reminders" data-demo-text="Reminder emails to staff and line managers with outstanding appraisal steps are part of the full HRMS.">' + ui.icon('mail') + 'Send reminders</button></div><div id="ap-table" class="mt-3"></div></section></div>';
    ui.table(body.querySelector('#ap-table'), { rows: db.employees, pageSize: 10, noun: 'staff', sortKey: 'appraisal',
      cols: [
        { key: 'name', label: 'Employee', sort: function (e) { return e.last; }, render: function (e) { return ui.person(e.name, e.role); } },
        { key: 'department', label: 'Department' },
        { key: 'appraisal', label: 'Appraisal', sort: function (e) { return states.indexOf(e.appraisal); }, render: function (e) { return ui.status(e.appraisal, e.appraisal === 'Not started' ? 'danger' : null); } },
        { key: 'training', label: 'Training', sortable: false, render: function (e) { return e.training.filter(function (t) { return t.status === 'Completed'; }).length + ' completed'; } }
      ] });
  }

  function payroll(body) {
    var db = MICS.state.db;
    var gross = function (e) { return PAY[e.grade] || 3000; };
    var depts = {}; db.employees.forEach(function (e) { depts[e.department] = (depts[e.department] || 0) + gross(e); });
    var total = db.employees.reduce(function (a, e) { return a + gross(e); }, 0);
    var ssnit = total * 0.13, tier2 = total * 0.05;
    body.innerHTML = ui.banner('<strong>Illustrative payroll figures only.</strong> Values are fictional and do not represent MICS salaries. Payroll processing, PAYE and SSNIT filings remain in the school’s payroll system; MICSAPP shows a summary view.', 'warning', 'info') +
      '<div class="grid grid-4 mt-4 mb-4">' + MICS.statCard('Monthly gross (Nov)', ui.moneyShort(total), 'wallet') + MICS.statCard('Employer SSNIT (13%)', ui.moneyShort(ssnit), 'shield') + MICS.statCard('Tier 2 pension (5%)', ui.moneyShort(tier2), 'layers') + MICS.statCard('Payroll run status', 'Draft', 'clock', 'gold') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-7', title: 'Monthly payroll cost by department', sub: 'Gross, illustrative', body: charts.hbars(Object.keys(depts).sort(function (a, b) { return depts[b] - depts[a]; }).map(function (d) { return { label: d, value: depts[d] }; }), { format: ui.moneyShort, valueLabel: 'Gross' }) }) +
      ui.card({ cls: 'col-5', title: 'November payroll run', bodyCls: 'flush', body: '<table class="table"><tbody><tr><td>Employees in run</td><td class="num">' + db.employees.length + '</td></tr><tr><td>Gross pay</td><td class="num">' + ui.money(total) + '</td></tr><tr><td>Employer SSNIT</td><td class="num">' + ui.money(ssnit) + '</td></tr><tr><td>Tier 2 contribution</td><td class="num">' + ui.money(tier2) + '</td></tr><tr style="background:var(--surface-muted)"><td class="strong">Total employment cost</td><td class="num strong">' + ui.money(total + ssnit + tier2) + '</td></tr></tbody></table>',
        foot: '<span class="muted">Approval: Bursar → Head of School</span><button class="btn btn-sm" data-demo="Submit payroll for approval" data-demo-text="Payroll approval routing and bank file generation are part of the full HRMS / Finance integration.">Submit for approval</button>' }) + '</div>';
  }

  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
})();
