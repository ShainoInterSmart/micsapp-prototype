/* ==========================================================================
   Teaching, Learning & Examinations
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var TABS = [{ id: 'classes', label: 'Classes & subjects' }, { id: 'timetable', label: 'Timetable' }, { id: 'attendance', label: 'Attendance' }, { id: 'assignments', label: 'Assignments' }, { id: 'exams', label: 'Examinations & results' }];
  var ttClass = 'CLS-JHS2A';
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  MICS.page('academics', {
    title: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'classes'); }); return t.id === 'exams' ? 'Examinations & Results' : 'Teaching & Learning'; },
    roles: ['head', 'admin', 'teacher'],
    navKey: function (p) { return 'academics/' + (p[0] || 'classes'); },
    crumbs: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'classes'); }) || TABS[0]; return [['Teaching & Learning', '#/academics/classes'], [t.label]]; },
    render: function (el, params) {
      var tab = params[0] || 'classes';
      var isTeacher = MICS.auth.role() === 'teacher';
      if (isTeacher && (tab === 'classes' || tab === 'attendance')) tab = tab === 'attendance' ? 'attendance' : 'timetable';
      var tabs = isTeacher ? TABS.filter(function (t) { return t.id !== 'classes'; }) : TABS;
      el.innerHTML = ui.pageHead({ eyebrow: tab === 'exams' ? 'Examinations & Assessment' : 'Teaching & Learning', title: tab === 'exams' ? 'Examinations & Results' : 'Academic Operations',
        desc: tab === 'exams' ? 'Examination series, schedules and results across BECE, WASSCE, Cambridge and IB pathways.' : 'Classes, subject allocations, timetables, attendance and coursework in one place.' }) +
        ui.tabs(tabs, tab, 'data-atab') + '<div class="mt-6" id="ac-body"></div>';
      var body = el.querySelector('#ac-body');
      ({ classes: classes, timetable: timetable, attendance: attendance, assignments: assignments, exams: exams }[tab])(body, isTeacher);
      el.querySelectorAll('[data-atab]').forEach(function (b) { b.onclick = function () { location.hash = '#/academics/' + b.getAttribute('data-atab'); }; });
    }
  });

  function classStats(c) {
    var st = sel.classStudents(c.id);
    return { n: st.length, att: st.reduce(function (a, s) { return a + sel.attPct(s); }, 0) / (st.length || 1), avg: st.reduce(function (a, s) { return a + s.avg; }, 0) / (st.length || 1), risk: st.filter(sel.isAtRisk).length };
  }

  function classes(body) {
    var db = MICS.state.db;
    var load = {};
    db.allocations.forEach(function (a) { load[a.teacherId] = (load[a.teacherId] || 0) + a.periods; });
    var teachers = Object.keys(load).map(function (k) { return { e: sel.emp(k), p: load[k] }; }).sort(function (a, b) { return b.p - a.p; });
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Classes', db.classes.length, 'layers') + MICS.statCard('Subject allocations', db.allocations.length, 'book') + MICS.statCard('Teaching staff', teachers.length, 'id-card') + MICS.statCard('Average class size', Math.round(db.students.length / db.classes.length), 'users', 'gold') + '</div>' +
      '<div class="grid-12"><section class="card col-8"><div class="card-head"><div><div class="card-title">Classes</div><div class="card-sub">Select a class to view subject and teacher allocations</div></div></div><div id="cls-table" class="mt-3"></div></section>' +
      ui.card({ cls: 'col-4', title: 'Teacher allocations', sub: 'Teaching periods per week', bodyCls: 'flush', body: '<div class="list">' + teachers.slice(0, 10).map(function (t) { return '<div class="list-item">' + ui.avatar(t.e.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(t.e.shortName) + '</div><div class="li-sub">' + ui.esc(t.e.department) + ' · ' + ui.esc((t.e.subjects || []).join(', ')) + '</div></div><div style="width:90px">' + ui.progress(Math.min(100, t.p / 40 * 100), t.p > 34 ? 'warning' : '') + '<div class="text-xs muted right mt-1">' + t.p + ' periods</div></div></div>'; }).join('') + '</div>', foot: '<span class="muted">Recommended maximum: 34 periods / week</span>' }) + '</div>';
    ui.table(body.querySelector('#cls-table'), { rows: db.classes, pageSize: 18, paginate: false, onRow: function (c) { classDrawer(c.id); },
      cols: [
        { key: 'name', label: 'Class', render: function (c) { return '<div class="strong" style="color:var(--text)">' + ui.esc(c.name) + '</div><div class="text-xs muted">' + ui.esc(c.room) + '</div>'; } },
        { key: 'programmeId', label: 'Programme', render: function (c) { return ui.esc(sel.prog(c.programmeId).short); } },
        { key: 'tutor', label: 'Form tutor', sort: function (c) { return sel.emp(c.tutorId).shortName; }, render: function (c) { return ui.esc(sel.emp(c.tutorId).shortName); } },
        { key: 'n', label: 'Students', num: true, sort: function (c) { return classStats(c).n; }, render: function (c) { var s = classStats(c); return s.n + '<span class="muted">/' + c.capacity + '</span>'; } },
        { key: 'att', label: 'Attendance', num: true, sort: function (c) { return classStats(c).att; }, render: function (c) { var a = classStats(c).att; return '<span class="' + (a < 92 ? 'c-warning strong' : '') + '">' + a.toFixed(1) + '%</span>'; } },
        { key: 'avg', label: 'Average', num: true, sort: function (c) { return classStats(c).avg; }, render: function (c) { return classStats(c).avg.toFixed(1) + '%'; } },
        { key: 'risk', label: 'Attention', num: true, sort: function (c) { return classStats(c).risk; }, render: function (c) { var r = classStats(c).risk; return r ? '<span class="badge warning">' + r + '</span>' : '<span class="muted">—</span>'; } }
      ] });
  }

  function classDrawer(id) {
    var c = sel.cls(id), st = classStats(c);
    var allocs = MICS.state.db.allocations.filter(function (a) { return a.classId === id; });
    ui.drawer({ title: c.name, sub: ui.esc(sel.prog(c.programmeId).name) + ' · ' + ui.esc(c.room),
      body: '<div class="drawer-section"><div class="dl-grid">' + kv('Form tutor', sel.emp(c.tutorId).shortName) + kv('Students', st.n + ' / ' + c.capacity) + kv('Attendance', st.att.toFixed(1) + '%') + kv('Class average', st.avg.toFixed(1) + '%') + kv('Need attention', st.risk) + kv('Boarders', sel.classStudents(id).filter(function (s) { return s.boarding; }).length) + '</div></div>' +
        '<div class="drawer-section"><h4>Subject allocations</h4><table class="table compact"><thead><tr><th>Subject</th><th>Teacher</th><th class="num">Periods / wk</th></tr></thead><tbody>' + allocs.map(function (a) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(a.subject) + '</td><td>' + ui.esc(sel.emp(a.teacherId).shortName) + '</td><td class="num">' + a.periods + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<div class="drawer-section"><h4>Students</h4><div class="flex wrap gap-2">' + sel.classStudents(id).map(function (s) { return '<a class="tag link" href="#/students/' + s.id + '">' + ui.esc(s.name) + '</a>'; }).join('') + '</div></div>',
      foot: '<a class="btn" href="#/academics/timetable" data-tt-class="' + id + '">' + ui.icon('calendar') + 'View timetable</a>',
      bind: function (root, api) { root.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('data-tt-class')) ttClass = id; api.close(); }); }); } });
  }

  function classTimetable(cid) {
    var allocs = MICS.state.db.allocations.filter(function (a) { return a.classId === cid; });
    var pool = []; allocs.forEach(function (a) { for (var i = 0; i < Math.min(a.periods, 5); i++) pool.push(a); });
    var grid = {}; var k = 0;
    DAYS.forEach(function (d, di) { grid[d] = {}; [1, 2, 3, 4, 5, 6].forEach(function (p, pi) { grid[d][p] = pool[(k++ * 7 + di * 3) % pool.length]; }); });
    return grid;
  }

  function timetable(body, isTeacher) {
    var db = MICS.state.db;
    var today = ui.dayName(db.meta.today);
    var head = '<div class="tth">Period</div>' + DAYS.map(function (d) { return '<div class="tth">' + d + (d === today ? ' · today' : '') + '</div>'; }).join('');
    var rows = db.periods.map(function (p) {
      if (p.label) return '<div class="ttp brk"><strong>' + p.label + '</strong></div>' + DAYS.map(function () { return '<div class="brk">' + p.label + '</div>'; }).join('');
      return '<div class="ttp"><strong>Period ' + p.id + '</strong>' + p.time + '</div>' + DAYS.map(function (d) {
        if (isTeacher) {
          var cid = db.teacherTimetable[d][p.id];
          if (!cid) return '<div></div>';
          var subj = sel.teacherClasses('EMP-0014').find(function (x) { return x.cls.id === cid; }).subject;
          return '<div><div class="tt-slot ' + (d === today ? 'today' : '') + '"><div class="s">' + ui.esc(sel.cls(cid).name) + '</div><div class="c">' + ui.esc(subj) + ' · ' + ui.esc(sel.cls(cid).room.split(' · ')[1]) + '</div></div></div>';
        }
        var a = classTimetable(ttClass)[d][p.id];
        return '<div><div class="tt-slot ' + (d === today ? 'today' : '') + '"><div class="s">' + ui.esc(a.subject) + '</div><div class="c">' + ui.esc(sel.emp(a.teacherId).shortName) + '</div></div></div>';
      }).join('');
    }).join('');
    body.innerHTML = '<section class="card"><div class="card-head bordered"><div><div class="card-title">' + (isTeacher ? 'My teaching timetable' : 'Class timetable') + '</div><div class="card-sub">' + (isTeacher ? 'Mrs. Efua Boateng · Mathematics · ' : '') + 'Term 1 · ' + db.meta.academicYear + '</div></div>' +
      (isTeacher ? '' : '<select class="select" id="tt-cls">' + db.classes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === ttClass ? ' selected' : '') + '>' + ui.esc(c.name) + '</option>'; }).join('') + '</select>') +
      '</div><div class="table-wrap"><div class="tt-grid">' + head + rows + '</div></div></section>';
    var s = body.querySelector('#tt-cls'); if (s) s.onchange = function () { ttClass = s.value; MICS.router.render({ keepScroll: true }); };
  }

  function attendance(body, isTeacher) {
    var db = MICS.state.db, m = sel.metrics();
    var today = db.meta.today;
    var classes = isTeacher ? sel.teacherClasses('EMP-0014').map(function (c) { return c.cls; }) : db.classes;
    var taken = classes.filter(function (c) { return sel.registerFor(c.id, today); });
    var low = classes.map(function (c) { return { c: c, s: classStats(c) }; }).sort(function (a, b) { return a.s.att - b.s.att; });
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('School attendance (term)', m.attendance.toFixed(1) + '%', 'check-square', 'success') + MICS.statCard('Today', db.attendanceDaily[db.attendanceDaily.length - 1].rate + '%', 'calendar') + MICS.statCard('Registers submitted today', taken.length + ' / ' + classes.length, 'clipboard', 'gold') + MICS.statCard('Below 85%', db.students.filter(function (s) { return sel.attPct(s) < 85; }).length + ' students', 'alert', 'danger') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Daily attendance rate', sub: 'Whole school · last 10 school days', body: '<div id="att-trend"></div>' }) +
      ui.card({ cls: 'col-4', title: 'Lowest attendance by class', bodyCls: 'flush', body: '<div class="list">' + low.slice(0, 6).map(function (x) { return '<div class="list-item"><div class="li-main"><div class="li-title">' + ui.esc(x.c.name) + '</div><div class="li-sub">' + x.s.n + ' students · tutor ' + ui.esc(sel.emp(x.c.tutorId).shortName) + '</div></div><span class="strong num ' + (x.s.att < 92 ? 'c-warning' : '') + '">' + x.s.att.toFixed(1) + '%</span></div>'; }).join('') + '</div>' }) +
      '<section class="card col-12"><div class="card-head"><div><div class="card-title">Today’s registers</div><div class="card-sub">' + ui.longDate(today) + '</div></div>' + (isTeacher ? '<a class="btn btn-primary" href="#/teacher/attendance">' + ui.icon('check-square') + 'Mark attendance</a>' : '') + '</div><div id="reg-table" class="mt-3"></div></section></div>';
    charts.line(body.querySelector('#att-trend'), { labels: db.attendanceDaily.map(function (d) { return ui.dateShort(d.date); }), series: [{ name: 'Attendance', color: 'var(--chart-1)', values: db.attendanceDaily.map(function (d) { return d.rate; }) }], height: 220, area: true, target: 95, yMin: 88, yMax: 97, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
    ui.table(body.querySelector('#reg-table'), { rows: classes, paginate: false, compact: true,
      cols: [
        { key: 'name', label: 'Class', render: function (c) { return '<span class="strong" style="color:var(--text)">' + ui.esc(c.name) + '</span>'; } },
        { key: 'tutor', label: 'Form tutor', sort: function (c) { return sel.emp(c.tutorId).shortName; }, render: function (c) { return ui.esc(sel.emp(c.tutorId).shortName); } },
        { key: 'st', label: 'Register', sort: function (c) { return sel.registerFor(c.id, today) ? 1 : 0; }, render: function (c) { var r = sel.registerFor(c.id, today); return r ? ui.badge('Submitted', 'success', true) : ui.badge('Pending', 'warning', true); } },
        { key: 'p', label: 'Present', num: true, sortable: false, render: function (c) { var r = sel.registerFor(c.id, today); return r ? r.present + r.late : '—'; } },
        { key: 'a', label: 'Absent', num: true, sortable: false, render: function (c) { var r = sel.registerFor(c.id, today); return r ? '<span class="' + (r.absent ? 'c-danger strong' : '') + '">' + r.absent + '</span>' : '—'; } },
        { key: 'by', label: 'Taken by', sortable: false, render: function (c) { var r = sel.registerFor(c.id, today); return r && r.takenBy ? ui.esc(sel.emp(r.takenBy).shortName) : '<span class="muted">—</span>'; } }
      ] });
  }

  function assignments(body, isTeacher) {
    var db = MICS.state.db;
    var rows = db.assignments;
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Active assignments', rows.filter(function (a) { return a.status !== 'Graded'; }).length, 'file-text') + MICS.statCard('Awaiting marking', rows.filter(function (a) { return a.status === 'Marking'; }).reduce(function (s, a) { return s + a.submitted; }, 0), 'edit', 'gold') + MICS.statCard('Average submission rate', Math.round(rows.reduce(function (s, a) { return s + a.submitted / sel.classStudents(a.classId).length; }, 0) / rows.length * 100) + '%', 'check-circle', 'success') + MICS.statCard('Due this week', rows.filter(function (a) { return a.due >= db.meta.today && ui.daysBetween(db.meta.today, a.due) <= 7; }).length, 'calendar') + '</div>' +
      '<section class="card"><div class="card-head"><div><div class="card-title">Assignments & coursework</div><div class="card-sub">' + (isTeacher ? 'Your classes' : 'Mathematics department sample') + '</div></div><button class="btn btn-primary" data-demo="Set new assignment" data-demo-text="Teachers will set assignments with attachments and rubrics, and students submit online. This prototype shows the tracking view.">' + ui.icon('plus') + 'New assignment</button></div><div id="asg-table" class="mt-3"></div></section>';
    ui.table(body.querySelector('#asg-table'), { rows: rows, paginate: false,
      cols: [
        { key: 'title', label: 'Assignment', render: function (a) { return '<div class="strong" style="color:var(--text)">' + ui.esc(a.title) + '</div><div class="text-xs muted">' + a.id + ' · ' + ui.esc(a.subject) + '</div>'; } },
        { key: 'classId', label: 'Class', render: function (a) { return ui.esc(sel.cls(a.classId).name); } },
        { key: 'due', label: 'Due', render: function (a) { return '<span class="nowrap">' + ui.date(a.due) + '</span>'; } },
        { key: 'submitted', label: 'Submissions', sort: function (a) { return a.submitted / sel.classStudents(a.classId).length; }, render: function (a) { var n = sel.classStudents(a.classId).length; return '<div class="flex items-center gap-2"><div style="width:80px">' + ui.progress(a.submitted / n * 100) + '</div><span class="num text-sm">' + a.submitted + '/' + n + '</span></div>'; } },
        { key: 'status', label: 'Status', render: function (a) { return ui.status(a.status); } }
      ] });
  }

  function exams(body, isTeacher) {
    var db = MICS.state.db;
    var ps = sel.programmeStats();
    var bands = sel.gradeBands();
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('School average (mid-term)', sel.metrics().avgScore + '%', 'bar-chart') + MICS.statCard('Pass rate (≥ 50%)', (db.students.filter(function (s) { return s.avg >= 50; }).length / db.students.length * 100).toFixed(1) + '%', 'check-circle', 'success') + MICS.statCard('Distinctions (≥ 75%)', db.students.filter(function (s) { return s.avg >= 75; }).length, 'trophy', 'gold') + MICS.statCard('Next series', 'Mid-Term · 16 Nov', 'calendar') + '</div>' +
      '<div class="grid-12">' + ui.card({ cls: 'col-7', title: 'Examination series', sub: 'Academic year ' + db.meta.academicYear, bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Series</th><th>Programme</th><th>Dates</th><th>Coordinator</th><th>Status</th></tr></thead><tbody>' + db.exams.map(function (e) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(e.title) + '</td><td>' + ui.esc(e.programme) + '</td><td class="nowrap">' + ui.dateShort(e.from) + ' – ' + ui.date(e.to) + '</td><td>' + ui.esc(sel.emp(e.coordinatorId).shortName) + '</td><td>' + ui.status(e.status) + '</td></tr>'; }).join('') + '</tbody></table>' }) +
      ui.card({ cls: 'col-5', title: 'Results summary by programme', sub: 'Mid-Term 1 average and pass rate', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Programme</th><th class="num">Students</th><th class="num">Average</th><th class="num">Pass rate</th></tr></thead><tbody>' + ps.map(function (p, i) { var b = bands[i]; return '<tr><td><span class="flex items-center gap-2"><i style="width:10px;height:10px;border-radius:3px;background:' + p.p.color + '"></i>' + ui.esc(p.p.short) + '</span></td><td class="num">' + p.count + '</td><td class="num strong">' + p.avg + '%</td><td class="num">' + ((b.total - b.values[3]) / b.total * 100).toFixed(0) + '%</td></tr>'; }).join('') + '</tbody></table>' }) +
      ui.card({ cls: 'col-7', title: 'Mid-term examination timetable', sub: '16–20 November 2026' + (isTeacher ? ' · your invigilation duties highlighted' : ''), bodyCls: 'flush', body: '<table class="table compact"><thead><tr><th>Date</th><th>Time</th><th>Class</th><th>Paper</th><th>Venue</th><th>Invigilator</th></tr></thead><tbody>' + db.examSlots.map(function (x) { var mine = x.invigilatorId === 'EMP-0014' && isTeacher; return '<tr' + (mine ? ' style="background:var(--brand-gold-50)"' : '') + '><td class="nowrap">' + ui.dateShort(x.date) + '</td><td class="num nowrap">' + x.time + '</td><td>' + ui.esc(sel.cls(x.classId).name) + '</td><td class="strong" style="color:var(--text)">' + ui.esc(x.subject) + '</td><td>' + x.venue + '</td><td>' + ui.esc(sel.emp(x.invigilatorId).shortName) + (mine ? ' ' + ui.badge('You', 'gold') : '') + '</td></tr>'; }).join('') + '</tbody></table>' }) +
      ui.card({ cls: 'col-5', title: 'Attainment bands', sub: 'Share of students per band', body: '<div id="ex-bands-legend" class="mb-3"></div><div id="ex-bands"></div>', foot: '<span class="muted">Full analysis in Reports</span><a class="card-link" href="#/reports">Performance reports ' + ui.icon('arrow-right') + '</a>' }) + '</div>';
    var series = [{ name: 'Distinction', color: 'var(--seq-5)' }, { name: 'Credit', color: 'var(--seq-4)' }, { name: 'Pass', color: 'var(--seq-2)' }, { name: 'Below 50%', color: 'var(--chart-4)' }].map(function (s, i) { return { name: s.name, color: s.color, values: bands.map(function (b) { return Math.round(b.values[i] / b.total * 1000) / 10; }) }; });
    body.querySelector('#ex-bands-legend').innerHTML = charts.legend(series.map(function (s) { return { label: s.name, color: s.color }; }));
    charts.bars(body.querySelector('#ex-bands'), { labels: bands.map(function (b) { return b.label; }), series: series, stacked: true, max: 100, height: 210, showTotal: false, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
    if (MICS.auth.role() === 'teacher') body.querySelectorAll('a[href="#/reports"]').forEach(function (a) { a.remove(); });
  }

  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
})();
