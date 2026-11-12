/* ==========================================================================
   Teacher workspace & attendance register
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel;
  var reg = { classId: null, period: null, marks: {} };

  function me() { return MICS.auth.user(); }
  function todaysClasses() {
    var db = MICS.state.db;
    var day = ui.dayName(db.meta.today);
    var tt = db.teacherTimetable[day] || {};
    return db.periods.filter(function (p) { return !p.label; }).map(function (p) { return { p: p, cid: tt[p.id] || null }; });
  }
  function pending() {
    var db = MICS.state.db, seen = {};
    return todaysClasses().filter(function (x) { if (!x.cid || seen[x.cid]) return false; seen[x.cid] = true; return !sel.registerFor(x.cid, db.meta.today); });
  }

  var page = {
    title: function (p) { return p[0] === 'attendance' ? 'Mark Attendance' : 'Teacher Workspace'; },
    roles: ['teacher'],
    navKey: function (p) { return p[0] === 'attendance' ? 'teacher/attendance' : 'teacher'; },
    crumbs: function (p) { return p[0] === 'attendance' ? [['Teacher Workspace', '#/teacher'], ['Mark Attendance']] : [['Teacher Workspace']]; },
    pendingCount: function () { return MICS.auth.user() ? pending().length : 0; },
    render: function (el, params, query) { if (params[0] === 'attendance') return register(el, query); workspace(el); }
  };
  MICS.page('teacher', page);

  function workspace(el) {
    var db = MICS.state.db, u = me();
    var mine = sel.teacherClasses(u.empId);
    var today = todaysClasses();
    var pend = pending();
    var subs = db.assignments.filter(function (a) { return mine.some(function (c) { return c.cls.id === a.classId; }); });
    var toMark = subs.filter(function (a) { return a.status === 'Marking'; }).reduce(function (s, a) { return s + a.submitted; }, 0);
    var myExams = db.examSlots.filter(function (x) { return x.invigilatorId === u.empId || mine.some(function (c) { return c.cls.id === x.classId && x.subject.indexOf('Math') > -1; }); });
    var students = []; mine.forEach(function (c) { students = students.concat(sel.classStudents(c.cls.id)); });
    var top = students.slice().map(function (s) { var r = sel.results(s).find(function (x) { return x.subject.indexOf('Math') > -1; }); return { s: s, r: r }; }).filter(function (x) { return x.r; });
    var improvers = top.slice().sort(function (a, b) { return b.r.change - a.r.change; }).slice(0, 4);
    var concern = top.slice().sort(function (a, b) { return a.r.latest - b.r.latest; }).slice(0, 4);

    el.innerHTML = '<div class="dash-hero"><div><div class="page-eyebrow">Teacher workspace</div><h1>Good day, ' + ui.esc(u.short) + '</h1><div class="dash-meta"><span>' + ui.longDate(db.meta.today) + '</span><span class="sep"></span><span>Head of Mathematics · Form tutor, JHS 2A</span></div></div>' +
      '<div class="page-actions"><a class="btn btn-primary" href="#/teacher/attendance">' + ui.icon('check-square') + 'Take register</a></div></div>' +
      (pend.length ? '<div class="attention-banner"><span class="ab-title">Registers pending</span><div class="ab-items">' + pend.map(function (x) { return '<button class="ab-chip" data-href="#/teacher/attendance?class=' + x.cid + '&period=' + x.p.id + '"><span class="rag a"></span><strong>' + ui.esc(sel.cls(x.cid).name) + '</strong> Period ' + x.p.id + ' · ' + x.p.time.split(' – ')[0] + '</button>'; }).join('') + '</div></div>' : '') +
      '<div class="grid grid-4 mb-4">' + MICS.statCard('Classes today', today.filter(function (x) { return x.cid; }).length, 'calendar') + MICS.statCard('Pending registers', pend.length, 'check-square', pend.length ? 'danger' : 'success') + MICS.statCard('Submissions to mark', toMark, 'edit', 'gold') + MICS.statCard('Students taught', students.length, 'users') + '</div>' +
      '<div class="grid-12">' +
        ui.card({ cls: 'col-7', title: 'Today’s classes', sub: ui.dayName(db.meta.today) + ' timetable', bodyCls: 'flush', body: '<div class="class-timeline">' + today.map(function (x) {
          if (!x.cid) return '<div class="ct-row free"><span class="ct-time">' + x.p.time + '</span><div><div class="ct-title">Free period</div><div class="ct-sub">Planning & marking</div></div><span></span></div>';
          var c = sel.cls(x.cid), done = sel.registerFor(x.cid, db.meta.today);
          var subj = mine.find(function (m) { return m.cls.id === x.cid; }).subject;
          return '<div class="ct-row ' + (!done ? 'now' : '') + '"><span class="ct-time">' + x.p.time + '</span><div><div class="ct-title">' + ui.esc(c.name) + ' · ' + ui.esc(subj) + '</div><div class="ct-sub">' + ui.esc(c.room) + ' · ' + sel.classStudents(c.id).length + ' students</div></div>' +
            (done ? ui.badge('Register taken', 'success', true) : '<a class="btn btn-sm btn-primary" href="#/teacher/attendance?class=' + x.cid + '&period=' + x.p.id + '">Take register</a>') + '</div>';
        }).join('') + '</div>' }) +
        ui.card({ cls: 'col-5', title: 'Assigned classes & subjects', bodyCls: 'flush', body: '<div class="list">' + mine.map(function (m) {
          var st = sel.classStudents(m.cls.id);
          var avg = st.reduce(function (a, s) { return a + s.avg; }, 0) / st.length;
          return '<div class="list-item"><span class="li-icon navy">' + ui.icon('book') + '</span><div class="li-main"><div class="li-title">' + ui.esc(m.cls.name) + '</div><div class="li-sub">' + ui.esc(m.subject) + ' · ' + st.length + ' students' + (m.cls.tutorId === u.empId ? ' · Form class' : '') + '</div></div><div class="li-meta"><span class="strong num">' + avg.toFixed(1) + '%</span><span class="text-xs">class avg</span></div></div>';
        }).join('') + '</div>' }) +
        ui.card({ cls: 'col-6', title: 'Assignment submissions', bodyCls: 'flush', body: '<div class="list">' + subs.map(function (a) { var n = sel.classStudents(a.classId).length; return '<div class="list-item"><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(sel.cls(a.classId).name) + ' · due ' + ui.dateShort(a.due) + '</div><div class="mt-2" style="max-width:240px">' + ui.progress(a.submitted / n * 100) + '</div></div><div class="li-meta">' + ui.status(a.status) + '<span class="num">' + a.submitted + '/' + n + '</span></div></div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-6', title: 'Upcoming examinations', sub: 'Mid-term · your papers and invigilation', bodyCls: 'flush', body: '<div class="list">' + myExams.map(function (x) { return '<div class="list-item">' + ui.dateBlock(x.date) + '<div class="li-main"><div class="li-title">' + ui.esc(x.subject) + ' · ' + ui.esc(sel.cls(x.classId).name) + '</div><div class="li-sub">' + x.time + ' · Room ' + x.venue + '</div></div>' + (x.invigilatorId === u.empId ? ui.badge('Invigilating', 'gold') : ui.badge('Your class', 'navy')) + '</div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-6', title: 'Most improved in Mathematics', sub: 'Change since Term 3', bodyCls: 'flush', body: '<div class="list">' + improvers.map(function (x) { return '<div class="list-item clickable" data-href="#/students/' + x.s.id + '">' + ui.avatar(x.s.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(x.s.name) + '</div><div class="li-sub">' + ui.esc(sel.cls(x.s.classId).name) + ' · ' + x.r.latest + '%</div></div>' + ui.delta(x.r.change, ' pts', false, 0) + '</div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-6', title: 'Students to support', sub: 'Lowest Mathematics scores this mid-term', bodyCls: 'flush', body: '<div class="list">' + concern.map(function (x) { return '<div class="list-item clickable" data-href="#/students/' + x.s.id + '">' + ui.avatar(x.s.name, 'sm') + '<div class="li-main"><div class="li-title">' + ui.esc(x.s.name) + '</div><div class="li-sub">' + ui.esc(sel.cls(x.s.classId).name) + ' · attendance ' + sel.attPct(x.s) + '%</div></div><span class="strong num c-danger">' + x.r.latest + '%</span></div>'; }).join('') + '</div>' }) +
      '</div>';
  }

  function register(el, query) {
    var db = MICS.state.db, u = me();
    var mine = sel.teacherClasses(u.empId);
    var qc = query && query.get('class');
    if (qc && qc !== reg.classId) { reg.classId = qc; reg.marks = {}; reg.period = query.get('period') || null; }
    if (!reg.classId) { var p0 = pending()[0]; reg.classId = p0 ? p0.cid : mine[0].cls.id; reg.period = p0 ? String(p0.p.id) : null; }
    var cls = sel.cls(reg.classId);
    var roster = sel.classStudents(cls.id);
    var existing = sel.registerFor(cls.id, db.meta.today);
    if (!Object.keys(reg.marks).length) roster.forEach(function (s) { reg.marks[s.id] = (s.marks && s.marks[db.meta.today]) || 'Present'; });
    var c = { Present: 0, Absent: 0, Late: 0, Excused: 0 }; roster.forEach(function (s) { c[reg.marks[s.id]]++; });
    var periodOpts = todaysClasses().filter(function (x) { return x.cid === cls.id; }).map(function (x) { return String(x.p.id); });
    if (!reg.period || periodOpts.indexOf(reg.period) < 0) reg.period = periodOpts[0] || 'AM';

    el.innerHTML = ui.pageHead({ eyebrow: 'Attendance register', title: 'Mark attendance', desc: 'Record attendance for your class. Saving updates each student’s attendance record, the school attendance dashboard and the parent portal.' }) +
      '<section class="card"><div class="toolbar"><div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="rg-class" class="text-sm">Class</label><select class="select" id="rg-class">' + mine.map(function (m) { return '<option value="' + m.cls.id + '"' + (m.cls.id === cls.id ? ' selected' : '') + '>' + ui.esc(m.cls.name) + ' — ' + ui.esc(m.subject) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field" style="flex-direction:row;align-items:center;gap:8px"><label for="rg-period" class="text-sm">Period</label><select class="select" id="rg-period">' + (periodOpts.length ? periodOpts : ['AM']).map(function (p) { return '<option value="' + p + '"' + (String(reg.period) === p ? ' selected' : '') + '>' + (p === 'AM' ? 'Morning register' : 'Period ' + p) + '</option>'; }).join('') + '</select></div>' +
      '<span class="text-sm muted">' + ui.longDate(db.meta.today) + '</span><div class="grow"></div><button class="btn btn-sm" id="rg-all">' + ui.icon('check') + 'Mark all present</button></div>' +
      (existing ? '<div style="padding:12px 20px 0">' + ui.banner('<strong>Register already submitted</strong> ' + (existing.savedAt ? 'at ' + ui.time(existing.savedAt) : 'earlier today') + '. You can amend and re-save; changes are logged.', 'success', 'check-circle') + '</div>' : '') +
      '<div class="list">' + roster.map(function (s) {
        var mk = reg.marks[s.id];
        return '<div class="register-row">' + ui.avatar(s.name, 'sm') + '<div style="min-width:0"><div class="strong" style="color:var(--text)">' + ui.esc(s.name) + '</div><div class="text-xs muted">' + s.id + ' · term attendance ' + sel.attPct(s) + '%' + (sel.attPct(s) < 85 ? ' · <span class="c-danger strong">below 85%</span>' : '') + '</div></div>' +
          '<div class="att-toggle" role="radiogroup" aria-label="Attendance for ' + ui.esc(s.name) + '">' + [['P', 'Present'], ['L', 'Late'], ['A', 'Absent'], ['E', 'Excused']].map(function (o) { return '<button type="button" role="radio" aria-checked="' + (mk === o[1]) + '" class="' + o[0] + (mk === o[1] ? ' on' : '') + '" data-s="' + s.id + '" data-m="' + o[1] + '" title="' + o[1] + '">' + o[0] + '</button>'; }).join('') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="sticky-bar"><div class="att-summary"><span><span class="rag g"></span>Present <b>' + c.Present + '</b></span><span><span class="rag a"></span>Late <b>' + c.Late + '</b></span><span><span class="rag r"></span>Absent <b>' + c.Absent + '</b></span><span><span class="rag n"></span>Excused <b>' + c.Excused + '</b></span><span class="muted">of ' + roster.length + '</span></div>' +
      '<div class="flex gap-2"><a class="btn" href="#/teacher">Cancel</a><button class="btn btn-primary" id="rg-save">' + ui.icon('check') + (existing ? 'Update register' : 'Save register') + '</button></div></div></section>';

    el.querySelector('#rg-class').onchange = function (e) { reg.classId = e.target.value; reg.marks = {}; reg.period = null; history.replaceState(null, '', '#/teacher/attendance'); MICS.router.render(); };
    el.querySelector('#rg-period').onchange = function (e) { reg.period = e.target.value; };
    el.querySelector('#rg-all').onclick = function () { roster.forEach(function (s) { reg.marks[s.id] = 'Present'; }); MICS.router.render({ keepScroll: true }); };
    el.querySelectorAll('[data-s]').forEach(function (b) { b.onclick = function () { reg.marks[b.getAttribute('data-s')] = b.getAttribute('data-m'); MICS.router.render({ keepScroll: true }); }; });
    el.querySelector('#rg-save').onclick = function () {
      var absentees = roster.filter(function (s) { return reg.marks[s.id] === 'Absent'; });
      ui.confirm({ title: (existing ? 'Update' : 'Save') + ' register for ' + cls.name + '?', sub: (reg.period === 'AM' ? 'Morning register' : 'Period ' + reg.period) + ' · ' + ui.date(db.meta.today),
        text: '<div class="att-summary"><span>Present <b>' + c.Present + '</b></span><span>Late <b>' + c.Late + '</b></span><span>Absent <b>' + c.Absent + '</b></span><span>Excused <b>' + c.Excused + '</b></span></div>' + (absentees.length ? '<div class="banner warning mt-3">' + ui.icon('info') + '<div>Guardians of ' + absentees.map(function (s) { return ui.esc(s.name); }).join(', ') + ' will receive an absence SMS (simulated).</div></div>' : ''),
        confirmLabel: existing ? 'Update register' : 'Save register', icon: 'check-square', tone: 'success', btnCls: 'btn-primary' }).then(function (r) {
        if (!r.ok) return;
        var counts = MICS.actions.saveRegister(cls.id, reg.period, reg.marks);
        reg.marks = {};
        ui.toast('Register saved — ' + cls.name, counts.Present + counts.Late + ' present, ' + counts.Absent + ' absent. Saved locally.');
      });
    };
  }
})();
