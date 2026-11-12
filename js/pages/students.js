/* ==========================================================================
   Student directory & student profile
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var f = { q: '', prog: '', cls: '', mode: '', att: '', attention: false };
  var tableState = { sortKey: 'name', dir: 1, page: 1 };

  function visibleStudents() {
    var u = MICS.auth.user(), db = MICS.state.db;
    if (u.role === 'teacher') {
      var ids = sel.teacherClasses(u.empId).map(function (c) { return c.cls.id; });
      return db.students.filter(function (s) { return ids.indexOf(s.classId) > -1; });
    }
    return db.students;
  }
  MICS.canSeeStudent = function (s) {
    var u = MICS.auth.user();
    if (u.role === 'head' || u.role === 'admin') return true;
    if (u.role === 'teacher') return sel.teacherClasses(u.empId).some(function (c) { return c.cls.id === s.classId; });
    if (u.role === 'parent') return sel.childrenOf(u.parentId).indexOf(s) > -1;
    return false;
  };

  MICS.page('students', {
    title: function (p) { if (p[0]) { var s = sel.student(p[0]); return s ? s.name : 'Student'; } return MICS.auth.role() === 'teacher' ? 'My Students' : 'Student Directory'; },
    roles: ['head', 'admin', 'teacher'],
    navKey: function (p) { return 'students'; },
    crumbs: function (p) {
      var base = MICS.auth.role() === 'teacher' ? [['My Students', '#/students']] : [['Student Information'], ['Student Directory', '#/students']];
      if (p[0]) { var s = sel.student(p[0]); return base.concat([[s ? s.name : 'Student']]); }
      return base;
    },
    render: function (el, params, query) {
      if (params[0]) return renderProfile(el, params[0], query);
      if (query && query.get('filter') === 'attention') { f.attention = true; }
      renderDirectory(el);
    }
  });

  // ======================================================================
  function renderDirectory(el) {
    var db = MICS.state.db, u = MICS.auth.user();
    var isTeacher = u.role === 'teacher';
    var pool = visibleStudents();
    var rows = pool.filter(function (s) {
      if (f.q && (s.name + ' ' + s.id + ' ' + (sel.parent(s.guardianId) || {}).name).toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      if (f.prog && s.programmeId !== f.prog) return false;
      if (f.cls && s.classId !== f.cls) return false;
      if (f.mode === 'boarding' && !s.boarding) return false;
      if (f.mode === 'day' && s.boarding) return false;
      var a = sel.attPct(s);
      if (f.att === 'lt85' && a >= 85) return false;
      if (f.att === '85-95' && (a < 85 || a >= 95)) return false;
      if (f.att === 'gte95' && a < 95) return false;
      if (f.attention && !sel.isAtRisk(s)) return false;
      return true;
    });
    var flagged = pool.filter(sel.isAtRisk).length;
    var avgAtt = pool.reduce(function (a, s) { return a + sel.attPct(s); }, 0) / pool.length;
    var classes = isTeacher ? sel.teacherClasses(u.empId).map(function (c) { return c.cls; }) : db.classes;

    el.innerHTML = ui.pageHead({
      title: isTeacher ? 'My Students' : 'Student Directory',
      desc: isTeacher ? 'Students in the classes you teach this term. Profiles show academic and attendance information only.' : 'Search and manage every enrolled learner across GES, Cambridge and IB programmes. Each profile draws on academics, attendance, finance and activities in one record.',
      actions: '<button class="btn" id="st-export">' + ui.icon('download') + 'Export CSV</button>' + (isTeacher ? '' : '<a class="btn btn-primary" href="#/admissions">' + ui.icon('user-plus') + 'New admission</a>')
    }) +
      '<div class="grid grid-4 mb-4">' +
        MICS.statCard('Students', ui.num(pool.length), 'users') +
        MICS.statCard('Boarders', ui.num(pool.filter(function (s) { return s.boarding; }).length), 'bed') +
        MICS.statCard('Average attendance', avgAtt.toFixed(1) + '%', 'check-square', 'success') +
        MICS.statCard('Need attention', flagged, 'alert', 'gold') +
      '</div>' +
      '<section class="card"><div class="toolbar">' +
        '<div class="search-input">' + ui.icon('search') + '<input type="search" id="st-q" placeholder="Name, ID or guardian…" value="' + ui.esc(f.q) + '" aria-label="Search students"></div>' +
        (isTeacher ? '' : '<select class="select" id="st-prog" aria-label="Programme"><option value="">All programmes</option>' + db.programmes.map(function (p) { return '<option value="' + p.id + '"' + (f.prog === p.id ? ' selected' : '') + '>' + ui.esc(p.short) + '</option>'; }).join('') + '</select>') +
        '<select class="select" id="st-cls" aria-label="Class"><option value="">All classes</option>' + classes.filter(function (c) { return !f.prog || c.programmeId === f.prog; }).map(function (c) { return '<option value="' + c.id + '"' + (f.cls === c.id ? ' selected' : '') + '>' + ui.esc(c.name) + '</option>'; }).join('') + '</select>' +
        '<select class="select" id="st-mode" aria-label="Boarding status"><option value="">Day & boarding</option><option value="boarding"' + (f.mode === 'boarding' ? ' selected' : '') + '>Boarders</option><option value="day"' + (f.mode === 'day' ? ' selected' : '') + '>Day students</option></select>' +
        '<select class="select" id="st-att" aria-label="Attendance"><option value="">Any attendance</option><option value="lt85"' + (f.att === 'lt85' ? ' selected' : '') + '>Below 85%</option><option value="85-95"' + (f.att === '85-95' ? ' selected' : '') + '>85–95%</option><option value="gte95"' + (f.att === 'gte95' ? ' selected' : '') + '>95% and above</option></select>' +
        '<button class="filter-chip ' + (f.attention ? 'active' : '') + '" id="st-attn">' + ui.icon('alert', 'icon-sm') + 'Needs attention</button>' +
        (f.q || f.prog || f.cls || f.mode || f.att || f.attention ? '<button class="btn btn-ghost btn-sm" id="st-clear">Clear filters</button>' : '') +
      '</div><div id="st-table"></div></section>';

    var cols = [
      { key: 'name', label: 'Student', sort: function (s) { return s.last + s.first; }, render: function (s) { return '<div class="person">' + ui.avatar(s.name, 'sm') + '<div style="min-width:0"><div class="person-name">' + ui.esc(s.name) + (s.newlyEnrolled ? ' <span class="badge sm gold">New</span>' : '') + '</div><div class="person-sub mono">' + s.id + '</div></div></div>'; } },
      { key: 'classId', label: 'Class', sort: function (s) { return sel.cls(s.classId).name; }, render: function (s) { return '<div class="text-sm" style="color:var(--text)">' + ui.esc(sel.cls(s.classId).name) + '</div><div class="text-xs muted">' + ui.esc(sel.prog(s.programmeId).short) + '</div>'; } },
      { key: 'house', label: 'House', render: function (s) { return '<div class="text-sm">' + s.house + '</div><div class="text-xs muted">' + (s.boarding ? 'Boarder' : 'Day') + '</div>'; } },
      { key: 'att', label: 'Attendance', sort: function (s) { return sel.attPct(s); }, render: function (s) { var a = sel.attPct(s); return '<div class="flex items-center gap-2" style="min-width:110px"><div style="width:56px">' + ui.progress(a, a < 85 ? 'danger' : a < 92 ? 'warning' : 'success') + '</div><span class="num text-sm ' + (a < 85 ? 'c-danger strong' : '') + '">' + a.toFixed(1) + '%</span></div>'; } },
      { key: 'avg', label: 'Average', num: true, render: function (s) { return '<span class="' + (s.avg < 50 ? 'c-danger strong' : '') + '">' + s.avg.toFixed(1) + '%</span>'; } },
      { key: 'guardian', label: 'Parent / guardian', sort: function (s) { return (sel.parent(s.guardianId) || {}).name || ''; }, render: function (s) { var p = sel.parent(s.guardianId); return p ? '<div class="text-sm">' + ui.esc(p.name) + '</div><div class="text-xs muted nowrap">' + ui.esc(p.phone) + '</div>' : '—'; } }
    ];
    if (!isTeacher) cols.push({ key: 'fees', label: 'Fees', sort: function (s) { return sel.balance(sel.invoiceFor(s.id)); }, render: function (s) { var st = sel.invoiceStatus(sel.invoiceFor(s.id)); return ui.status(st.label, st.tone); } });
    cols.push({ key: 'status', label: 'Status', sort: function (s) { return sel.isAtRisk(s) ? 0 : 1; }, render: function (s) { return sel.isAtRisk(s) ? ui.badge('Needs attention', 'warning', true) : ui.status('Active'); } });

    ui.table(el.querySelector('#st-table'), { rows: rows, cols: cols, state: tableState, pageSize: 12, noun: 'students', onRow: function (s) { location.hash = '#/students/' + s.id; } });

    function rer() { tableState.page = 1; MICS.router.render({ keepScroll: true }); }
    var qT; var q = el.querySelector('#st-q');
    q.oninput = function () { clearTimeout(qT); qT = setTimeout(function () { f.q = q.value; rer(); var n = document.getElementById('st-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
    var p = el.querySelector('#st-prog'); if (p) p.onchange = function () { f.prog = p.value; f.cls = ''; rer(); };
    el.querySelector('#st-cls').onchange = function (e) { f.cls = e.target.value; rer(); };
    el.querySelector('#st-mode').onchange = function (e) { f.mode = e.target.value; rer(); };
    el.querySelector('#st-att').onchange = function (e) { f.att = e.target.value; rer(); };
    el.querySelector('#st-attn').onclick = function () { f.attention = !f.attention; if (!f.attention && location.hash.indexOf('filter=') > -1) { history.replaceState(null, '', '#/students'); } rer(); };
    var c = el.querySelector('#st-clear'); if (c) c.onclick = function () { f = { q: '', prog: '', cls: '', mode: '', att: '', attention: false }; history.replaceState(null, '', '#/students'); rer(); };
    el.querySelector('#st-export').onclick = function () {
      ui.downloadCSV('micsapp-students.csv', ['Student ID', 'Name', 'Class', 'Programme', 'House', 'Boarding', 'Attendance %', 'Average %', 'Guardian', 'Guardian phone'],
        rows.map(function (s) { var g = sel.parent(s.guardianId) || {}; return [s.id, s.name, sel.cls(s.classId).name, sel.prog(s.programmeId).short, s.house, s.boarding ? 'Yes' : 'No', sel.attPct(s), s.avg, g.name, g.phone]; }));
    };
  }

  // ======================================================================
  var profileTab = {};
  function renderProfile(el, id, query) {
    var s = sel.student(id);
    var u = MICS.auth.user();
    if (!s) { el.innerHTML = ui.empty('Student not found', 'No student record matches ' + id + '.', 'search', '<a class="btn btn-primary" href="#/students">Back to directory</a>'); return; }
    if (!MICS.canSeeStudent(s)) { el.innerHTML = '<div class="card" style="max-width:640px;margin:48px auto">' + ui.empty('Restricted record', 'You can only view students in classes you teach.', 'lock', '<a class="btn btn-primary" href="#/students">My students</a>') + '</div>'; return; }
    var isTeacher = u.role === 'teacher';
    var tab = (query && query.get('tab')) || profileTab[id] || 'overview';
    var cls = sel.cls(s.classId), prog = sel.prog(s.programmeId), tutor = sel.emp(cls.tutorId), guardian = sel.parent(s.guardianId);
    var inv = sel.invoiceFor(s.id), ist = sel.invoiceStatus(inv), att = sel.attPct(s);
    var tabs = [{ id: 'overview', label: 'Overview' }, { id: 'academic', label: 'Academic' }, { id: 'attendance', label: 'Attendance' }, { id: 'results', label: 'Examination results' }, { id: 'guardians', label: 'Parent / guardian' }];
    if (!isTeacher) tabs.push({ id: 'fees', label: 'Fees' });
    tabs.push({ id: 'activities', label: 'Activities' });
    if (isTeacher && tab === 'fees') tab = 'overview';

    var html = '<a class="btn btn-ghost btn-sm mb-3" href="#/students">' + ui.icon('arrow-left') + (isTeacher ? 'My students' : 'Student directory') + '</a>' +
      '<section class="card mb-4"><div class="profile-head">' + ui.avatar(s.name, 'xl') +
      '<div class="grow"><div class="flex items-center gap-2 wrap"><h1>' + ui.esc(s.name) + '</h1><span class="mono muted">' + s.id + '</span></div>' +
      '<div class="text-md muted mt-1">' + ui.esc(cls.name) + ' · ' + ui.esc(prog.name) + ' · ' + ui.esc(s.house) + ' House</div>' +
      '<div class="profile-badges">' + ui.status(s.status) + ui.badge(s.boarding ? 'Boarder' : 'Day student', 'navy') + ui.badge(prog.exam, 'outline') + (sel.isAtRisk(s) ? ui.badge('Needs academic attention', 'warning', true) : '') + (s.support ? ui.badge('7+1 learning support', 'info') : '') + '</div></div>' +
      '<div class="page-actions no-print"><button class="btn" data-demo="Message guardian" data-demo-text="Messages are sent through the parent communication module via email and SMS. In this prototype no message is sent.">' + ui.icon('message') + 'Message guardian</button><button class="btn" id="pf-print">' + ui.icon('printer') + 'Print profile</button></div></div>' +
      '<div class="profile-facts">' +
        fact('Form tutor', tutor ? tutor.shortName : '—') + fact('Attendance (term)', att.toFixed(1) + '%', att < 85 ? 'c-danger' : '') + fact('Current average', s.avg.toFixed(1) + '%', s.avg < 50 ? 'c-danger' : '') +
        fact('Admitted', ui.date(s.admitted)) + (isTeacher ? fact('Clubs', s.clubs.length) : fact('Fee balance', ui.money(sel.balance(inv)), sel.balance(inv) > 0 ? 'c-danger' : 'c-success')) +
      '</div>' + ui.tabs(tabs, tab, 'data-ptab').replace('class="tabs"', 'class="tabs" style="padding:0 24px;border-top:1px solid var(--divider)"') + '</section>' +
      '<div id="pf-body"></div>';
    el.innerHTML = html;
    var body = el.querySelector('#pf-body');
    var res = sel.results(s);
    var termAvg = sel.termAverages(s);

    if (tab === 'overview') {
      body.innerHTML = '<div class="grid-12">' +
        ui.card({ cls: 'col-4', title: 'Personal details', body: '<dl class="dl">' + dl('Full name', s.name) + dl('Student ID', s.id) + dl('Gender', s.gender) + dl('Date of birth', ui.date(s.dob)) + dl('Nationality', s.nationality) + dl('Class', cls.name + ' · ' + cls.room) + dl('Programme', prog.name) + dl('House', s.house + (s.boarding ? ' (boarder)' : ' (day)')) + '</dl>' }) +
        ui.card({ cls: 'col-5', title: 'Academic snapshot', sub: 'Average across all subjects by term', body: '<div id="pf-trend"></div><div class="stat-strip mt-3" style="border:1px solid var(--divider);border-radius:var(--r-md)"><div><div class="stat-k">Strongest subject</div><div class="stat-v" style="font-size:14px">' + best(res).subject + ' <small>' + best(res).latest + '%</small></div></div><div><div class="stat-k">Focus area</div><div class="stat-v" style="font-size:14px">' + worst(res).subject + ' <small>' + worst(res).latest + '%</small></div></div></div>' }) +
        ui.card({ cls: 'col-3', title: 'Parent / guardian', body: guardian ? ui.person(guardian.name, guardian.relation, '') + '<dl class="dl mt-4" style="grid-template-columns:70px 1fr">' + dl('Phone', guardian.phone) + dl('Email', guardian.email) + '</dl>' + (guardian.studentIds.length > 1 ? '<div class="banner navy mt-4">' + ui.icon('users') + '<div>Sibling at MICS: ' + guardian.studentIds.filter(function (x) { return x !== s.id; }).map(function (x) { var sb = sel.student(x); return MICS.canSeeStudent(sb) ? '<a href="#/students/' + x + '">' + ui.esc(sb.name) + '</a>' : ui.esc(sb.name); }).join(', ') + '</div></div>' : '') : '—' }) +
        ui.card({ cls: 'col-8', title: 'Subject performance', sub: 'Mid-Term 1 · ' + sel.gradeScale(s.programmeId), bodyCls: 'flush', body: subjectTable(res, s, true) }) +
        ui.card({ cls: 'col-4', title: 'Notes & support', body: (sel.isAtRisk(s) ? '<div class="banner warning mb-3">' + ui.icon('alert') + '<div><strong>Flagged for academic attention.</strong> ' + (att < 85 ? 'Attendance is below the 85% threshold. ' : '') + (s.avg < 50 ? 'Average attainment is below 50%. ' : '') + 'Form tutor to agree a support plan with the guardian.</div></div>' : '<div class="banner success mb-3">' + ui.icon('check-circle') + '<div>On track — attendance and attainment within expected ranges.</div></div>') +
          (s.support ? '<div class="banner info mb-3">' + ui.icon('book') + '<div>' + ui.esc(s.support) + '</div></div>' : '') +
          '<div class="text-sm muted">Medical and pastoral records are held separately and are restricted to authorised staff.</div>' }) +
        '</div>';
      charts.line(body.querySelector('#pf-trend'), { labels: sel.termLabels, series: [{ name: 'Average', color: 'var(--chart-1)', values: termAvg }], height: 170, area: true, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
    }

    if (tab === 'academic') {
      body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Subjects & teachers', sub: cls.name + ' · ' + prog.name, bodyCls: 'flush', body: subjectTable(res, s, false) }) +
        ui.card({ cls: 'col-4', title: 'Programme information', body: '<dl class="dl">' + dl('Curriculum', prog.curriculum) + dl('Examination', prog.exam) + dl('Grading scale', sel.gradeScale(s.programmeId)) + dl('Form tutor', tutor.shortName) + dl('Classroom', cls.room) + dl('Class size', sel.classStudents(cls.id).length + ' students') + '</dl>' }) + '</div>';
    }

    if (tab === 'attendance') {
      var days = sel.attendanceDays(s);
      var counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
      days.forEach(function (d) { counts[d.status]++; });
      var monthly = sel.monthlyAttendance(s);
      body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Attendance rate', att.toFixed(1) + '%', 'check-square', att < 85 ? 'danger' : 'success') + MICS.statCard('Days present', counts.Present + counts.Late, 'check-circle', 'success') + MICS.statCard('Days absent', counts.Absent, 'x-circle', 'danger') + MICS.statCard('Late arrivals', counts.Late, 'clock', 'gold') + '</div>' +
        '<div class="grid-12">' + ui.card({ cls: 'col-5', title: 'Monthly attendance', sub: 'Term 1 · ' + MICS.state.db.meta.academicYear, body: '<div id="pf-month"></div>' }) +
        ui.card({ cls: 'col-7', title: 'Daily register', sub: 'School days since ' + ui.date(MICS.state.db.meta.termStart), action: '<div class="legend"><span><i style="background:var(--success-bg);border:1px solid var(--success-border)"></i>Present</span><span><i style="background:var(--warning-bg);border:1px solid var(--warning-border)"></i>Late</span><span><i style="background:var(--danger-bg);border:1px solid var(--danger-border)"></i>Absent</span></div>',
          body: '<div class="cal-heat">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(function (d) { return '<div class="cal-week-label">' + d + '</div>'; }).join('') + days.map(function (d) { return '<div class="cd ' + d.status + '" data-tt="' + charts.tt(ui.dayName(d.date) + ' ' + ui.date(d.date), [{ label: 'Status', value: d.status }]) + '">' + ui.parseDate(d.date).getDate() + '</div>'; }).join('') + '</div>' }) + '</div>';
      charts.bars(body.querySelector('#pf-month'), { labels: monthly.map(function (m) { return ui.month(m.month + '-01'); }), series: [{ name: 'Attendance', color: 'var(--chart-1)', values: monthly.map(function (m) { return m.rate; }) }], height: 200, max: 100, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
    }

    if (tab === 'results') {
      body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-12', title: 'Examination results', sub: 'Scores (%) and grades by term · ' + sel.gradeScale(s.programmeId), action: '<button class="btn btn-sm" data-demo="Download report card" data-demo-text="Official report cards are generated as signed PDFs at the end of each term. This prototype shows the data that would populate the report card.">' + ui.icon('download') + 'Report card</button>', bodyCls: 'flush',
        body: '<div class="table-wrap"><table class="table"><thead><tr><th>Subject</th>' + sel.termLong.map(function (t) { return '<th class="num">' + t + '</th>'; }).join('') + '<th class="num">Grade</th><th class="num">Change</th></tr></thead><tbody>' +
          res.map(function (r) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.subject) + '</td>' + r.scores.map(function (v) { return '<td class="num">' + v + '</td>'; }).join('') + '<td class="num"><span class="badge navy">' + r.grade + '</span></td><td class="num">' + ui.delta(r.change, '', false, 0) + '</td></tr>'; }).join('') +
          '<tr style="background:var(--surface-muted)"><td class="strong">Average</td>' + termAvg.map(function (v) { return '<td class="num strong">' + v.toFixed(1) + '</td>'; }).join('') + '<td class="num"><span class="badge gold">' + sel.grade(s.avg, s.programmeId) + '</span></td><td class="num">' + ui.delta(termAvg[3] - termAvg[2]) + '</td></tr></tbody></table></div>' }) +
        ui.card({ cls: 'col-12', title: 'Term-on-term trend', body: '<div id="pf-res"></div>' }) + '</div>';
      charts.line(body.querySelector('#pf-res'), { labels: sel.termLabels, series: [{ name: s.first, color: 'var(--chart-1)', values: termAvg }, { name: cls.name + ' average', color: 'var(--chart-muted)', dashed: true, values: classTrend(cls.id) }], height: 220, directLabels: true, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
    }

    if (tab === 'guardians') {
      var g2 = guardian && guardian.secondary;
      body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-6', title: 'Primary contact', action: ui.badge('Parent portal active', 'success', true), body: guardian ? ui.person(guardian.title + ' ' + guardian.name, guardian.relation + ' · ' + guardian.occupation, 'lg') + '<dl class="dl mt-4">' + dl('Phone', guardian.phone) + dl('Email', guardian.email) + dl('Address', guardian.address) + dl('Parent ID', guardian.id) + dl('Linked children', guardian.studentIds.map(function (x) { return sel.student(x).name; }).join(', ')) + '</dl>' : '—' }) +
        ui.card({ cls: 'col-6', title: 'Secondary contact', body: g2 ? ui.person(g2.name, g2.relation, 'lg') + '<dl class="dl mt-4">' + dl('Phone', g2.phone) + dl('Email', g2.email) + '</dl>' : ui.empty('No secondary contact', 'Add a second guardian or emergency contact during the next records update.', 'user') }) + '</div>';
    }

    if (tab === 'fees' && !isTeacher) {
      var pays = MICS.state.db.payments.filter(function (p) { return p.studentId === s.id; });
      body.innerHTML = '<div class="banner navy mb-4">' + ui.icon('link') + '<div><strong>QuickBooks Read-Only Integration — Simulated for Prototype.</strong> Local payment verification is separate from accounting records in QuickBooks, the system of record.</div></div>' +
        '<div class="grid-12">' + ui.card({ cls: 'col-5', title: 'Invoice ' + inv.id, sub: inv.term + ' · due ' + ui.date(inv.due), action: ui.status(ist.label, ist.tone), bodyCls: 'flush',
          body: '<table class="table"><tbody>' + inv.lines.map(function (l) { return '<tr><td>' + ui.esc(l.label) + '</td><td class="num">' + ui.money(l.amount) + '</td></tr>'; }).join('') + (inv.arrears ? '<tr><td>Arrears brought forward</td><td class="num">' + ui.money(inv.arrears) + '</td></tr>' : '') +
            '<tr><td class="strong">Total due</td><td class="num strong">' + ui.money(inv.amount + (inv.arrears || 0)) + '</td></tr><tr><td>Payments verified</td><td class="num c-success">− ' + ui.money(inv.paid) + '</td></tr><tr style="background:var(--surface-muted)"><td class="strong">Balance</td><td class="num strong ' + (sel.balance(inv) > 0 ? 'c-danger' : '') + '">' + ui.money(sel.balance(inv)) + '</td></tr></tbody></table>' }) +
        ui.card({ cls: 'col-7', title: 'Payments', sub: 'Verification status and QuickBooks recording shown separately', bodyCls: 'flush', body: pays.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Reference</th><th>Method</th><th class="num">Amount</th><th>Verification</th><th>QuickBooks</th></tr></thead><tbody>' + pays.map(function (p) { return '<tr><td class="nowrap">' + ui.date(p.date) + '</td><td class="mono">' + ui.esc(p.reference) + '<div class="text-xs muted" style="font-family:var(--font-sans)">' + ui.esc(p.source) + '</div></td><td>' + ui.esc(p.method) + '</td><td class="num">' + ui.money(p.amount) + '</td><td>' + ui.status(p.verification) + '</td><td>' + ui.status(p.qb) + '</td></tr>'; }).join('') + '</tbody></table></div>' : ui.empty('No payments yet', 'Payments recorded or submitted via the parent portal will appear here.', 'receipt') }) + '</div>';
    }

    if (tab === 'activities') {
      var loans = MICS.state.db.library.loans.filter(function (l) { return l.studentId === s.id; });
      body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-6', title: 'Clubs & co-curricular', bodyCls: 'flush', body: s.clubs.length ? '<div class="list">' + s.clubs.map(function (c) { var cl = sel.club(c); return '<div class="list-item"><span class="li-icon gold">' + ui.icon('trophy') + '</span><div class="li-main"><div class="li-title">' + ui.esc(cl.name) + '</div><div class="li-sub">' + ui.esc(cl.category) + ' · ' + ui.esc(cl.day) + ' · Patron: ' + ui.esc(sel.emp(cl.patronId).shortName) + '</div></div>' + ui.status('Active') + '</div>'; }).join('') + '</div>' : ui.empty('No club memberships', 'Encourage participation — target is 85% of students in at least one activity.', 'trophy') }) +
        ui.card({ cls: 'col-6', title: 'Library loans', bodyCls: 'flush', body: loans.length ? '<div class="list">' + loans.map(function (l) { return '<div class="list-item"><span class="li-icon navy">' + ui.icon('book') + '</span><div class="li-main"><div class="li-title">' + ui.esc(l.title) + '</div><div class="li-sub">Due ' + ui.date(l.due) + '</div></div>' + ui.status(l.status) + '</div>'; }).join('') + '</div>' : ui.empty('No active loans', '', 'library') }) + '</div>';
    }

    el.querySelectorAll('[data-ptab]').forEach(function (b) { b.onclick = function () { profileTab[id] = b.getAttribute('data-ptab'); history.replaceState(null, '', '#/students/' + id); MICS.router.render({ keepScroll: true }); }; });
    el.querySelector('#pf-print').onclick = function () { window.print(); };
  }

  function fact(k, v, cls) { return '<div><div class="stat-k">' + k + '</div><div class="stat-v ' + (cls || '') + '" style="font-size:15px">' + ui.esc(v) + '</div></div>'; }
  function dl(k, v) { return '<dt>' + k + '</dt><dd>' + ui.esc(v) + '</dd>'; }
  function best(res) { return res.slice().sort(function (a, b) { return b.latest - a.latest; })[0]; }
  function worst(res) { return res.slice().sort(function (a, b) { return a.latest - b.latest; })[0]; }
  function subjectTable(res, s, compact) {
    return '<div class="table-wrap"><table class="table ' + (compact ? 'compact' : '') + '"><thead><tr><th>Subject</th><th>Teacher</th><th class="num">Score</th><th class="num">Grade</th><th style="width:140px">Progress</th><th class="num">vs last term</th></tr></thead><tbody>' +
      res.map(function (r) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.subject) + '</td><td class="text-sm">' + ui.esc(r.teacher) + '</td><td class="num">' + r.latest + '%</td><td class="num"><span class="badge navy">' + r.grade + '</span></td><td>' + ui.progress(r.latest, r.latest < 50 ? 'danger' : r.latest < 60 ? 'warning' : '') + '</td><td class="num">' + ui.delta(r.change, '', false, 0) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function classTrend(cid) {
    var st = sel.classStudents(cid).slice(0, 30);
    var sums = [0, 0, 0, 0];
    st.forEach(function (x) { sel.termAverages(x).forEach(function (v, i) { sums[i] += v; }); });
    return sums.map(function (v) { return Math.round(v / st.length * 10) / 10; });
  }
})();
