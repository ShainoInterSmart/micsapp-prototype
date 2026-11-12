/* ==========================================================================
   State store (localStorage), selectors and domain actions
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'micsapp.db.v1';
  var listeners = [];
  var db = null;
  var idx = {};

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function safeRemove(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  function buildIndex() {
    idx = {};
    ['students', 'parents', 'employees', 'classes', 'programmes', 'invoices', 'admissions', 'approvals', 'maintenance', 'leaves', 'actions', 'exeats', 'payments', 'clubs', 'budgets', 'policies'].forEach(function (k) {
      var m = {}; (db[k] || []).forEach(function (r) { m[r.id] = r; }); idx[k] = m;
    });
    idx.invoiceByStudent = {};
    db.invoices.forEach(function (i) { idx.invoiceByStudent[i.studentId] = i; });
  }

  function load() {
    var raw = safeGet(KEY);
    if (raw) {
      try { db = JSON.parse(raw); } catch (e) { db = null; }
      if (db && (!db.meta || db.meta.version !== MICS.seed.meta.version)) db = null;
    }
    if (!db) { db = clone(MICS.seed); persist(); }
    buildIndex();
  }
  function persist() { safeSet(KEY, JSON.stringify(db)); }
  function emit(info) { listeners.slice().forEach(function (fn) { try { fn(info || {}); } catch (e) { console.error(e); } }); }

  function nowStamp() {
    // Demo clock: fixed demo date, real time-of-day for natural ordering
    var d = new Date();
    return db.meta.today + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  }

  var state = {
    get db() { return db; },
    load: load,
    on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    /** Mutate state, persist, log activity and notify listeners. */
    update: function (fn, activity) {
      fn(db);
      if (activity) state.log(activity);
      buildIndex();
      persist();
      emit({ activity: activity });
    },
    log: function (a) {
      var user = MICS.auth && MICS.auth.user();
      db.activity.unshift({ id: 'A-' + Date.now() + Math.floor(Math.random() * 1000), time: nowStamp(), actor: a.actor || (user ? user.name : 'System'), module: a.module, text: a.text, link: a.link || null });
      if (db.activity.length > 80) db.activity.length = 80;
    },
    notify: function (n) {
      db.notifications.unshift({ id: 'N-' + Date.now() + Math.floor(Math.random() * 1000), title: n.title, text: n.text, time: nowStamp(), read: false, link: n.link || null, icon: n.icon || 'bell', roles: n.roles || ['head', 'admin'] });
    },
    reset: function () { safeRemove(KEY); db = clone(MICS.seed); persist(); buildIndex(); emit({ reset: true }); },
    now: nowStamp
  };
  MICS.state = state;

  // ======================================================================
  // Selectors
  // ======================================================================
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function r1(v) { return Math.round(v * 10) / 10; }

  var termLabels = ['T1 25/26', 'T2 25/26', 'T3 25/26', 'Mid T1 26/27'];
  var termLong = ['Term 1 · 2025/26', 'Term 2 · 2025/26', 'Term 3 · 2025/26', 'Mid-Term 1 · 2026/27'];

  var sel = {
    student: function (id) { return idx.students[id]; },
    parent: function (id) { return idx.parents[id]; },
    emp: function (id) { return idx.employees[id]; },
    cls: function (id) { return idx.classes[id]; },
    prog: function (id) { return idx.programmes[id]; },
    club: function (id) { return idx.clubs[id]; },
    invoiceFor: function (sid) { return idx.invoiceByStudent[sid]; },
    get: function (coll, id) { return idx[coll] && idx[coll][id]; },
    termLabels: termLabels, termLong: termLong,

    activeStudents: function () { return db.students.filter(function (s) { return s.status !== 'Withdrawn'; }); },
    attPct: function (s) { return s.attTotal ? r1(s.attPresent / s.attTotal * 100) : 100; },
    classStudents: function (cid) { return db.students.filter(function (s) { return s.classId === cid; }).sort(function (a, b) { return a.last.localeCompare(b.last) || a.first.localeCompare(b.first); }); },
    childrenOf: function (pid) { var p = idx.parents[pid]; return p ? p.studentIds.map(function (id) { return idx.students[id]; }).filter(Boolean) : []; },
    teacherOf: function (cid, subject) { var a = db.allocations.find(function (x) { return x.classId === cid && x.subject === subject; }); return a ? idx.employees[a.teacherId] : null; },

    grade: function (score, pid) {
      if (pid === 'IBDP') return score >= 80 ? '7' : score >= 70 ? '6' : score >= 60 ? '5' : score >= 50 ? '4' : score >= 40 ? '3' : score >= 25 ? '2' : '1';
      if (pid === 'CAM') return score >= 90 ? 'A*' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : score >= 40 ? 'E' : 'U';
      if (pid === 'GES-S') return score >= 80 ? 'A1' : score >= 70 ? 'B2' : score >= 65 ? 'B3' : score >= 60 ? 'C4' : score >= 55 ? 'C5' : score >= 50 ? 'C6' : score >= 45 ? 'D7' : score >= 40 ? 'E8' : 'F9';
      return score >= 80 ? '1' : score >= 70 ? '2' : score >= 65 ? '3' : score >= 60 ? '4' : score >= 55 ? '5' : score >= 50 ? '6' : score >= 45 ? '7' : score >= 40 ? '8' : '9';
    },
    gradeScale: function (pid) { return pid === 'IBDP' ? 'IB 1–7' : pid === 'CAM' ? 'Cambridge A*–U' : pid === 'GES-S' ? 'WASSCE A1–F9' : 'BECE 1–9'; },

    /** Deterministic per-subject results; latest term averages to student.avg. */
    results: function (s) {
      var subjects = db.subjectsByProgramme[s.programmeId];
      var drift = [-4.5, -2.8, -1.2, 0];
      var out = subjects.map(function (subj) {
        var off = (hash(s.id + subj) - 0.5) * 22;
        return { subject: subj, scores: drift.map(function (d, t) { return s.avg + off + d * (0.6 + hash(s.id + 'd') * 0.8) + (hash(s.id + subj + t) - 0.5) * 7; }) };
      });
      // recentre latest term on student avg
      var mean = out.reduce(function (a, r) { return a + r.scores[3]; }, 0) / out.length;
      out.forEach(function (r) {
        r.scores = r.scores.map(function (v) { return Math.round(clamp(v + (s.avg - mean), 28, 99)); });
        r.latest = r.scores[3];
        r.grade = sel.grade(r.latest, s.programmeId);
        r.change = r.scores[3] - r.scores[2];
        var t = sel.teacherOf(s.classId, r.subject); r.teacher = t ? t.shortName : '—';
      });
      return out;
    },
    termAverages: function (s) {
      var res = sel.results(s);
      return [0, 1, 2, 3].map(function (t) { return r1(res.reduce(function (a, r) { return a + r.scores[t]; }, 0) / res.length); });
    },

    /** Deterministic school-day calendar with exact absence count. */
    attendanceDays: function (s) {
      var days = [];
      var d = new Date(db.meta.termStart + 'T00:00:00');
      var end = new Date(db.meta.today + 'T00:00:00');
      while (d <= end) {
        var wd = d.getDay();
        if (wd > 0 && wd < 6) days.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
      }
      days = days.slice(0, Math.max(s.attTotal, 1));
      var absences = s.attTotal - s.attPresent;
      var ranked = days.map(function (dd, i) { return { i: i, h: hash(s.id + dd) }; }).sort(function (a, b) { return a.h - b.h; });
      var absentIdx = {}; ranked.slice(0, absences).forEach(function (r) { absentIdx[r.i] = true; });
      var lateIdx = {}; ranked.slice(absences, absences + Math.round(hash(s.id + 'late') * 3)).forEach(function (r) { lateIdx[r.i] = true; });
      var marks = (s.marks || {});
      return days.map(function (dd, i) { return { date: dd, status: marks[dd] || (absentIdx[i] ? 'Absent' : lateIdx[i] ? 'Late' : 'Present') }; });
    },
    monthlyAttendance: function (s) {
      var days = sel.attendanceDays(s);
      var months = {};
      days.forEach(function (d) { var m = d.date.slice(0, 7); months[m] = months[m] || { p: 0, t: 0 }; months[m].t++; if (d.status !== 'Absent') months[m].p++; });
      return Object.keys(months).map(function (m) { return { month: m, rate: r1(months[m].p / months[m].t * 100) }; });
    },

    balance: function (inv) { return inv ? Math.max(0, inv.amount + (inv.arrears || 0) - inv.paid) : 0; },
    invoiceStatus: function (inv) {
      var bal = sel.balance(inv);
      if (bal <= 0) return { label: 'Paid', tone: 'success' };
      if (inv.paid > 0) return { label: 'Part-paid', tone: 'warning' };
      return { label: db.meta.today > inv.due ? 'Overdue' : 'Unpaid', tone: 'danger' };
    },
    pendingPaymentsFor: function (sid) { return db.payments.filter(function (p) { return p.studentId === sid && p.verification === 'Pending'; }); },

    isAtRisk: function (s) { return sel.attPct(s) < 85 || s.avg < 50; },
    atRisk: function () {
      return db.students.filter(sel.isAtRisk).map(function (s) {
        var reasons = [];
        if (sel.attPct(s) < 85) reasons.push('Attendance ' + sel.attPct(s) + '%');
        if (s.avg < 50) reasons.push('Average ' + s.avg + '%');
        return { s: s, reasons: reasons, severity: (sel.attPct(s) < 80 || s.avg < 46) ? 'High' : 'Medium' };
      }).sort(function (a, b) { return (a.severity === 'High' ? 0 : 1) - (b.severity === 'High' ? 0 : 1) || a.s.avg - b.s.avg; });
    },

    programmeStats: function () {
      return db.programmes.map(function (p) {
        var st = db.students.filter(function (s) { return s.programmeId === p.id; });
        var avg = st.reduce(function (a, s) { return a + s.avg; }, 0) / (st.length || 1);
        var att = st.reduce(function (a, s) { return a + s.attPresent / s.attTotal; }, 0) / (st.length || 1) * 100;
        return { p: p, count: st.length, avg: r1(avg), att: r1(att) };
      });
    },
    programmeTrend: function () {
      var drift = { 'GES-B': [-5.1, -3.6, -2.2, -1.4, -0.6, 0], 'GES-S': [-3.2, -2.9, -1.1, -1.8, -0.4, 0], 'CAM': [-2.4, -1.5, -1.9, -0.7, -0.9, 0], 'IBDP': [-1.8, -0.6, -1.2, 0.3, -0.5, 0] };
      var attDrift = { 'GES-B': [-1.2, -0.4, -0.9, 0.2, -0.3, 0], 'GES-S': [-2.1, -1.4, -1.1, -0.6, 0.3, 0], 'CAM': [-0.8, -0.2, -0.6, 0.1, 0.4, 0], 'IBDP': [0.6, 0.2, -0.4, 0.5, 0.1, 0] };
      return {
        labels: ['T2 24/25', 'T3 24/25', 'T1 25/26', 'T2 25/26', 'T3 25/26', 'T1 26/27'], series: sel.programmeStats().map(function (ps) {
          return { name: ps.p.short, color: ps.p.color, scores: drift[ps.p.id].map(function (d) { return r1(ps.avg + d); }), att: attDrift[ps.p.id].map(function (d) { return r1(ps.att + d); }) };
        })
      };
    },
    gradeBands: function () {
      // Distribution of latest-term student averages into performance bands per programme
      return db.programmes.map(function (p) {
        var st = db.students.filter(function (s) { return s.programmeId === p.id; });
        var b = [0, 0, 0, 0];
        st.forEach(function (s) { if (s.avg >= 75) b[0]++; else if (s.avg >= 60) b[1]++; else if (s.avg >= 50) b[2]++; else b[3]++; });
        return { label: p.short, values: b, total: st.length };
      });
    },

    finance: function () {
      var invoiced = 0, collected = 0, arrears = 0, outstanding = 0, ageing = [0, 0, 0, 0];
      db.invoices.forEach(function (i) {
        var s = idx.students[i.studentId]; if (!s || s.status === 'Withdrawn') return;
        invoiced += i.amount; collected += i.paid; arrears += i.arrears || 0;
        var bal = sel.balance(i); outstanding += bal;
        if (bal > 0) {
          if (i.arrears) ageing[3] += i.arrears;
          var cur = Math.max(0, i.amount - i.paid);
          if (i.paid === 0) ageing[2] += cur; else if (i.paid / i.amount < 0.6) ageing[1] += cur; else ageing[0] += cur;
        }
      });
      var pending = db.payments.filter(function (p) { return p.verification === 'Pending'; });
      var verifiedNotQb = db.payments.filter(function (p) { return p.verification === 'Verified' && p.qb !== 'Recorded'; });
      var budget = db.budgets.reduce(function (a, b) { return a + b.budget; }, 0);
      var plan = db.budgets.reduce(function (a, b) { return a + b.plan; }, 0);
      var actual = db.budgets.reduce(function (a, b) { return a + b.actual; }, 0);
      var committed = db.budgets.reduce(function (a, b) { return a + b.committed; }, 0);
      return {
        invoiced: invoiced, collected: collected, outstanding: outstanding, arrears: arrears,
        rate: r1(collected / invoiced * 100), ageing: ageing,
        pendingCount: pending.length, pendingAmount: pending.reduce(function (a, p) { return a + p.amount; }, 0),
        qbPending: verifiedNotQb.length, qbPendingAmount: verifiedNotQb.reduce(function (a, p) { return a + p.amount; }, 0),
        budget: budget, plan: plan, actual: actual, committed: committed,
        debtors: db.invoices.filter(function (i) { return sel.balance(i) > 0; }).length
      };
    },
    occupancy: function () {
      return db.boardingHouses.map(function (h) {
        var n = db.students.filter(function (s) { return s.boarding && s.house === h.id && s.status !== 'Withdrawn'; }).length;
        return { h: h, occupied: n, rate: r1(n / h.capacity * 100) };
      });
    },

    metrics: function () {
      var st = sel.activeStudents();
      var att = st.reduce(function (a, s) { return a + s.attPresent / s.attTotal; }, 0) / st.length * 100;
      var avg = st.reduce(function (a, s) { return a + s.avg; }, 0) / st.length;
      var teaching = db.employees.filter(function (e) { return e.status === 'Active' && e.type === 'Teaching'; }).length;
      var nonTeaching = db.employees.filter(function (e) { return e.status === 'Active' && e.type !== 'Teaching'; }).length;
      var onLeave = db.leaves.filter(function (l) { return l.status === 'Approved' && l.from <= db.meta.today && l.to >= db.meta.today; }).length;
      var pendingAdm = db.admissions.filter(function (a) { return ['New', 'Review', 'Assessment'].indexOf(a.stage) > -1; });
      var awaitingDecision = db.admissions.filter(function (a) { return a.stage === 'Assessment'; }).length;
      var pendingApprovals = db.approvals.filter(function (a) { return a.status === 'Pending'; });
      var occ = sel.occupancy();
      var occRate = r1(occ.reduce(function (a, o) { return a + o.occupied; }, 0) / occ.reduce(function (a, o) { return a + o.h.capacity; }, 0) * 100);
      var openMaint = db.maintenance.filter(function (m) { return m.status !== 'Completed'; });
      var appraisalsDone = db.employees.filter(function (e) { return e.appraisal === 'Completed'; }).length;
      return {
        enrolled: st.length, boarders: st.filter(function (s) { return s.boarding; }).length,
        attendance: r1(att), avgScore: r1(avg),
        teaching: teaching, nonTeaching: nonTeaching, staff: teaching + nonTeaching, onLeave: onLeave,
        pendingAdmissions: pendingAdm.length, awaitingDecision: awaitingDecision,
        pendingApprovals: pendingApprovals.length, highPriorityApprovals: pendingApprovals.filter(function (a) { return a.priority === 'High'; }).length,
        finance: sel.finance(), occupancy: occRate,
        openMaintenance: openMaint.length, criticalMaintenance: openMaint.filter(function (m) { return m.priority === 'Critical' || m.priority === 'High'; }).length,
        atRisk: sel.atRisk().length,
        appraisalsPct: r1(appraisalsDone / db.employees.length * 100),
        lowStock: db.inventory.filter(function (i) { return i.stock <= i.reorder; }).length
      };
    },
    kpiValue: function (k, m) {
      m = m || sel.metrics();
      if (k.key === 'avgScore') return m.avgScore;
      if (k.key === 'attendance') return m.attendance;
      if (k.key === 'collection') return m.finance.rate;
      if (k.key === 'appraisals') return m.appraisalsPct;
      if (k.key === 'occupancy') return m.occupancy;
      return k.value;
    },
    kpiRag: function (k, v) {
      var ratio = k.lowerIsBetter ? k.target / v : v / k.target;
      return ratio >= 0.98 ? 'g' : ratio >= 0.9 ? 'a' : 'r';
    },
    strategicProgress: function () {
      return db.strategicPlan.map(function (p) {
        var avg = p.objectives.reduce(function (a, o) { return a + o.progress; }, 0) / p.objectives.length;
        var rag = p.objectives.some(function (o) { return o.rag === 'r'; }) ? 'a' : p.objectives.filter(function (o) { return o.rag === 'a'; }).length > 1 ? 'a' : 'g';
        return { p: p, progress: Math.round(avg), rag: rag };
      });
    },
    overallStrategic: function () { var s = sel.strategicProgress(); return Math.round(s.reduce(function (a, x) { return a + x.progress; }, 0) / s.length); },
    actionStatus: function (a) {
      if (a.status === 'Completed') return { label: 'Completed', tone: 'success' };
      if (a.due < db.meta.today) return { label: 'Overdue', tone: 'danger' };
      if (a.status === 'Not started') return { label: 'Not started', tone: 'neutral' };
      return { label: 'In progress', tone: 'info' };
    },
    teacherClasses: function (empId) {
      var ids = {};
      db.allocations.forEach(function (a) { if (a.teacherId === empId) ids[a.classId] = a.subject; });
      return Object.keys(ids).map(function (cid) { return { cls: idx.classes[cid], subject: ids[cid] }; });
    },
    registerFor: function (cid, date) { return db.registers.find(function (r) { return r.classId === cid && r.date === date; }); }
  };
  MICS.sel = sel;

  // ======================================================================
  // Domain actions (all simulated, persisted locally)
  // ======================================================================
  function userName() { var u = MICS.auth && MICS.auth.user(); return u ? u.name : 'System'; }
  function shortDate() { return db.meta.today; }

  var actions = {
    decideApproval: function (id, decision, note) {
      var a = idx.approvals[id]; if (!a || a.status !== 'Pending') return;
      state.update(function () {
        a.status = decision; // Approved | Rejected | Reviewed
        a.decidedBy = userName(); a.decidedOn = shortDate(); a.note = note || '';
        a.history.push({ date: shortDate(), title: decision === 'Reviewed' ? 'Marked as reviewed' : decision, by: userName(), note: note });
        if (a.ref && a.ref.kind === 'admission' && decision !== 'Reviewed') {
          var adm = idx.admissions[a.ref.id];
          if (adm) applyAdmissionStage(adm, decision === 'Approved' ? 'Approved' : 'Rejected', note);
        }
        if (a.ref && a.ref.kind === 'leave' && decision !== 'Reviewed') {
          var lv = idx.leaves[a.ref.id]; if (lv) { lv.status = decision; lv.note = note; }
        }
        if (a.ref && a.ref.kind === 'maintenance' && decision === 'Approved') {
          var m = idx.maintenance[a.ref.id]; if (m) m.timeline.push({ date: shortDate(), title: 'Expenditure approved (' + a.id + ')', by: userName() });
        }
      }, { module: 'Approvals', text: decision + ': ' + a.title + (note ? ' — "' + note + '"' : ''), link: '#/approvals' });
    },

    setAdmissionStage: function (id, stage, note) {
      var adm = idx.admissions[id]; if (!adm || adm.stage === stage) return;
      var prev = adm.stage;
      state.update(function () {
        applyAdmissionStage(adm, stage, note);
        var apr = db.approvals.find(function (x) { return x.ref && x.ref.kind === 'admission' && x.ref.id === id && x.status === 'Pending'; });
        if (apr && (stage === 'Approved' || stage === 'Rejected')) {
          apr.status = stage; apr.decidedBy = userName(); apr.decidedOn = shortDate();
          apr.history.push({ date: shortDate(), title: stage + ' via Admissions', by: userName(), note: note });
        }
        if (stage === 'Assessment' && !db.approvals.some(function (x) { return x.ref && x.ref.id === id; })) {
          // nothing — approval created when assessment score recorded
        }
      }, { module: 'Admissions', text: adm.name + ' moved from ' + stageName(prev) + ' to ' + stageName(stage), link: '#/admissions/' + id });
    },

    recordAssessment: function (id, score) {
      var adm = idx.admissions[id]; if (!adm) return;
      state.update(function () {
        adm.score = score;
        adm.stage = 'Assessment';
        adm.timeline.push({ date: shortDate(), title: 'Entrance assessment & interview completed', by: userName(), note: 'Assessment score: ' + score + '%' });
        if (!db.approvals.some(function (x) { return x.ref && x.ref.id === id && x.status === 'Pending'; })) {
          db.approvals.unshift({ id: 'APR-' + (1100 + db.approvals.length), category: 'Admissions', title: 'Admission decision — ' + adm.name, subtitle: idx.classes[adm.targetClass].name + ' · ' + adm.entry, requesterId: 'EMP-0006', department: 'Admissions', submitted: shortDate(), priority: 'Medium', status: 'Pending', ref: { kind: 'admission', id: id }, history: [{ date: shortDate(), title: 'Submitted for approval', by: userName() }] });
        }
      }, { module: 'Admissions', text: 'Assessment recorded for ' + adm.name + ' (' + score + '%) — sent for Head of School decision', link: '#/admissions/' + id });
    },

    enrolAdmission: function (id) {
      var adm = idx.admissions[id]; if (!adm || adm.stage !== 'Approved') return null;
      var newId;
      state.update(function () {
        var n = db.students.length + 1; newId = 'STU-' + String(n).padStart(4, '0');
        while (idx.students[newId]) { n++; newId = 'STU-' + String(n).padStart(4, '0'); }
        var parts = adm.name.split(' ');
        var pid = 'PAR-' + String(db.parents.length + 1).padStart(4, '0');
        var gp = adm.guardian.name.split(' ');
        db.parents.push({ id: pid, title: adm.guardian.relation === 'Mother' ? 'Mrs.' : 'Mr.', first: gp[0], last: gp.slice(1).join(' '), name: adm.guardian.name, relation: adm.guardian.relation, phone: adm.guardian.phone, email: adm.guardian.email, occupation: '—', address: '—', studentIds: [newId] });
        var st = {
          id: newId, first: parts[0], last: parts.slice(1).join(' '), name: adm.name, gender: adm.gender, dob: adm.dob, classId: adm.targetClass, programmeId: adm.programmeId,
          house: adm.gender === 'Female' ? 'Ankobra' : 'Pra', boarding: adm.boarding, attTotal: 1, attPresent: 1, avg: adm.score || 65, status: 'Active', admitted: shortDate(), nationality: 'Ghanaian', clubs: [], guardianId: pid, support: null, newlyEnrolled: true
        };
        db.students.push(st);
        var amount = db.termFee[st.programmeId] + (st.boarding ? db.boardingFee : 0);
        db.invoices.push({
          id: 'INV-27T2-' + newId.slice(4), studentId: newId, term: 'Term 2 · 2026/27', issued: shortDate(), due: '2027-01-08', amount: amount, paid: 0,
          lines: [{ label: 'Tuition — ' + idx.programmes[st.programmeId].short, amount: db.termFee[st.programmeId] }].concat(st.boarding ? [{ label: 'Boarding & meals', amount: db.boardingFee }] : []).concat([{ label: 'Admission & registration (one-off)', amount: 0 }])
        });
        adm.stage = 'Enrolled'; adm.studentId = newId;
        adm.timeline.push({ date: shortDate(), title: 'Enrolled — student record ' + newId + ' created', by: userName(), note: 'Guardian portal account and Term 2 invoice generated.' });
        state.notify({ title: 'New student enrolled', text: adm.name + ' (' + newId + ') joins ' + idx.classes[adm.targetClass].name + '.', link: '#/students/' + newId, icon: 'user-plus' });
      }, { module: 'Admissions', text: adm.name + ' enrolled as ' + newId + ' — student record, guardian account and invoice created', link: '#/students/' + newId });
      return newId;
    },

    createAdmission: function (f) {
      var id = 'ADM-26' + String(31 + db.admissions.length).padStart(3, '0');
      state.update(function () {
        db.admissions.unshift({
          id: id, name: f.name, gender: f.gender, programmeId: idx.classes[f.targetClass].programmeId, targetClass: f.targetClass, stage: 'New', score: null, boarding: f.boarding, previousSchool: f.previousSchool, submitted: shortDate(), entry: f.entry, source: 'Admissions office', dob: f.dob,
          guardian: { name: f.guardianName, relation: f.relation, phone: f.phone, email: f.email },
          docs: [{ name: 'Birth certificate', ok: !!f.docBirth }, { name: 'Previous school report (2 terms)', ok: !!f.docReport }, { name: 'Transfer / recommendation letter', ok: false }, { name: 'Passport photographs', ok: !!f.docPhoto }, { name: 'Medical clearance form', ok: false }],
          interview: null, notes: f.notes || '', timeline: [{ date: shortDate(), title: 'Application created', by: userName(), note: 'Captured by admissions office' }], studentId: null
        });
      }, { module: 'Admissions', text: 'New application captured: ' + f.name + ' (' + idx.classes[f.targetClass].name + ')', link: '#/admissions/' + id });
      return id;
    },

    updateMaintenance: function (id, patch, note) {
      var m = idx.maintenance[id]; if (!m) return;
      var text = [];
      state.update(function () {
        if (patch.assignee && patch.assignee !== m.assignee) {
          m.assignee = patch.assignee;
          var e = idx.employees[patch.assignee];
          m.timeline.push({ date: shortDate(), title: 'Assigned to ' + e.shortName, by: userName() });
          text.push('assigned to ' + e.shortName);
          if (m.status === 'Open') m.status = 'Assigned';
        }
        if (patch.priority && patch.priority !== m.priority) { m.timeline.push({ date: shortDate(), title: 'Priority changed: ' + m.priority + ' → ' + patch.priority, by: userName() }); text.push('priority ' + patch.priority); m.priority = patch.priority; }
        if (patch.status && patch.status !== m.status) {
          m.timeline.push({ date: shortDate(), title: patch.status === 'Completed' ? 'Marked completed' : 'Status changed to ' + patch.status, by: userName(), note: patch.status === 'Completed' ? patch.resolution : note });
          text.push(patch.status === 'Completed' ? 'completed' : 'status ' + patch.status);
          m.status = patch.status;
          if (patch.status === 'Completed') { m.completed = shortDate(); m.resolution = patch.resolution; }
        } else if (note) { m.timeline.push({ date: shortDate(), title: 'Note added', by: userName(), note: note }); }
      }, { module: 'Facilities', text: m.id + ' ' + m.title + ' — ' + (text.join(', ') || 'updated'), link: '#/operations/facilities' });
    },

    createMaintenance: function (f) {
      var id = 'MR-0' + (419 + db.maintenance.filter(function (m) { return m.id >= 'MR-0419'; }).length);
      var user = MICS.auth.user();
      state.update(function () {
        db.maintenance.unshift({ id: id, title: f.title, location: f.location, category: f.category, priority: f.priority, status: 'Open', reportedBy: user.empId || 'EMP-0002', reported: shortDate(), assignee: null, description: f.description, timeline: [{ date: shortDate(), title: 'Request logged', by: userName() }] });
      }, { module: 'Facilities', text: 'New maintenance request ' + id + ': ' + f.title + ' (' + f.priority + ')', link: '#/operations/facilities' });
      return id;
    },

    saveRegister: function (classId, period, marks) {
      var cls = idx.classes[classId];
      var counts = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
      var date = shortDate();
      state.update(function () {
        Object.keys(marks).forEach(function (sid) {
          var s = idx.students[sid]; var st = marks[sid];
          counts[st]++;
          s.marks = s.marks || {};
          var previous = s.marks[date];
          if (!previous) { s.attTotal += 1; if (st !== 'Absent') s.attPresent += 1; }
          else if ((previous === 'Absent') !== (st === 'Absent')) { s.attPresent += st === 'Absent' ? -1 : 1; }
          s.marks[date] = st;
        });
        db.registers = db.registers.filter(function (r) { return !(r.classId === classId && r.date === date); });
        db.registers.push({ id: 'REG-' + date.replace(/-/g, '') + '-' + classId.slice(4), classId: classId, date: date, period: period, takenBy: (MICS.auth.user() || {}).empId, present: counts.Present, absent: counts.Absent, late: counts.Late, excused: counts.Excused, savedAt: state.now() });
        db.notifications.forEach(function (n) { if (n.id === 'N-301' && classId === 'CLS-JHS2A') n.read = true; });
        if (counts.Absent > 0) state.notify({ title: 'Absences recorded — ' + cls.name, text: counts.Absent + ' student(s) marked absent. Guardians notified by SMS (simulated).', link: '#/academics/attendance', icon: 'check-square' });
      }, { module: 'Attendance', text: 'Register saved for ' + cls.name + ': ' + counts.Present + ' present, ' + counts.Late + ' late, ' + counts.Absent + ' absent, ' + counts.Excused + ' excused', link: '#/academics/attendance' });
      return counts;
    },

    submitPayment: function (f) {
      var id = 'PAY-' + String(90000 + db.payments.length).padStart(5, '0');
      var inv = idx.invoiceByStudent[f.studentId];
      state.update(function () {
        db.payments.push({ id: id, invoiceId: inv.id, studentId: f.studentId, amount: f.amount, date: f.date, method: f.method, reference: f.reference, source: 'Parent portal', proof: f.proof || null, verification: 'Pending', qb: 'Not recorded', submittedBy: (MICS.auth.user() || {}).parentId, note: f.note || '' });
        state.notify({ title: 'Payment proof submitted', text: idx.students[f.studentId].name + ' · GHS ' + f.amount.toLocaleString() + ' · ' + f.reference, link: '#/finance/verification', icon: 'receipt' });
      }, { module: 'Finance', text: 'Payment reference submitted via parent portal for ' + idx.students[f.studentId].name + ' (GHS ' + f.amount.toLocaleString() + ')', link: '#/finance/verification' });
      return id;
    },

    verifyPayment: function (id, decision, note) {
      var p = idx.payments[id]; if (!p || p.verification !== 'Pending') return;
      var inv = idx.invoices[p.invoiceId];
      state.update(function () {
        p.verification = decision; p.verifiedBy = (MICS.auth.user() || {}).empId; p.verifiedOn = shortDate(); p.verifyNote = note || '';
        if (decision === 'Verified') { inv.paid += p.amount; p.qb = 'Pending sync'; }
        else p.qb = 'Not recorded';
        state.notify({ title: 'Payment ' + decision.toLowerCase(), text: idx.students[p.studentId].name + ' · GHS ' + p.amount.toLocaleString() + (decision === 'Verified' ? ' — awaiting QuickBooks recording' : ''), link: '#/parent/fees', icon: 'receipt', roles: ['parent'] });
      }, { module: 'Finance', text: 'Payment ' + p.reference + ' ' + decision.toLowerCase() + ' for ' + idx.students[p.studentId].name + ' (GHS ' + p.amount.toLocaleString() + ')' + (decision === 'Verified' ? ' — QuickBooks: pending sync' : ''), link: '#/finance/verification' });
    },

    simulateQbSync: function () {
      var n = 0;
      state.update(function () {
        db.payments.forEach(function (p) { if (p.verification === 'Verified' && p.qb === 'Pending sync') { p.qb = 'Recorded'; n++; } });
      }, { module: 'Finance', text: 'QuickBooks read-only sync (simulated): ' + 'payment records refreshed', link: '#/finance' });
      return n;
    },

    requestAppointment: function (f) {
      var id = 'APT-' + (119 + db.appointments.length);
      state.update(function () {
        db.appointments.unshift({ id: id, parentId: (MICS.auth.user() || {}).parentId, studentId: f.studentId, staffId: f.staffId, date: f.date, slot: f.slot, reason: f.reason, status: 'Requested', mode: f.mode });
        state.notify({ title: 'Appointment requested', text: idx.employees[f.staffId].shortName + ' · ' + f.date + ' ' + f.slot + ' (' + idx.students[f.studentId].name + ')', link: '#/approvals', icon: 'calendar' });
      }, { module: 'Parent Portal', text: 'Appointment requested with ' + idx.employees[f.staffId].shortName + ' on ' + f.date + ' at ' + f.slot, link: '#/parent' });
      return id;
    },

    updateAction: function (id, patch, comment) {
      var a = idx.actions[id]; if (!a) return;
      state.update(function () {
        if (patch.status) a.status = patch.status;
        if (patch.progress != null) a.progress = patch.progress;
        if (a.status === 'Completed') a.progress = 100;
        if (patch.due) a.due = patch.due;
        a.updates.unshift({ date: shortDate(), by: userName(), text: (comment ? comment + ' ' : '') + '(' + a.status + ', ' + a.progress + '%)' });
      }, { module: 'Governance', text: 'Action ' + a.id + ' updated — ' + a.status + ' (' + a.progress + '%)', link: '#/governance/actions' });
    },

    decideExeat: function (id, decision) {
      var x = idx.exeats[id]; if (!x) return;
      state.update(function () { x.status = decision; x.decidedBy = userName(); },
        { module: 'Boarding', text: 'Exeat ' + x.id + ' ' + decision.toLowerCase() + ' for ' + idx.students[x.studentId].name, link: '#/operations/boarding' });
    },
    checkoutVisitor: function (id) {
      var v = db.visitors.find(function (x) { return x.id === id; }); if (!v) return;
      var d = new Date();
      state.update(function () { v.timeOut = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); },
        { module: 'Security & Reception', text: 'Visitor checked out: ' + v.name + ' (badge ' + v.badge + ' returned)', link: '#/operations/security' });
    },
    reorderItem: function (id) {
      var it = db.inventory.find(function (x) { return x.id === id; }); if (!it) return;
      state.update(function () { it.onOrder = true; },
        { module: 'Kitchen & Catering', text: 'Purchase requisition raised for ' + it.item + ' (' + it.supplier + ')', link: '#/operations/kitchen' });
    },
    markNotification: function (id) { state.update(function () { var n = db.notifications.find(function (x) { return x.id === id; }); if (n) n.read = true; }); },
    markAllRead: function (role) { state.update(function () { db.notifications.forEach(function (n) { if (n.roles.indexOf(role) > -1) n.read = true; }); }); },
    renewLoan: function (id) {
      var l = db.library.loans.find(function (x) { return x.id === id; }); if (!l) return;
      state.update(function () { var d = new Date(db.meta.today + 'T00:00:00'); d.setDate(d.getDate() + 14); l.due = d.toISOString().slice(0, 10); l.status = 'On loan'; l.renewals++; },
        { module: 'Library', text: 'Loan ' + l.id + ' renewed: ' + l.title, link: '#/library' });
    },
    togglePermission: function (role, i) {
      var order = ['none', 'view', 'own', 'full', 'approve'];
      state.update(function () { var g = db.permissionMatrix.grants[role]; g[i] = order[(order.indexOf(g[i]) + 1) % order.length]; },
        { module: 'User Access', text: 'Permission changed for role "' + role + '" — ' + db.permissionMatrix.modules[i], link: '#/access' });
    },
    acknowledgePolicy: function (id) {
      var p = idx.policies[id]; if (!p) return;
      state.update(function () { p.acks = Math.min(p.acks + 1, 80); p.ackedByMe = true; },
        { module: 'Policies', text: 'Policy acknowledged: ' + p.name, link: '#/policies' });
    }
  };
  MICS.actions = actions;

  function stageName(s) { return { New: 'New', Review: 'Under review', Assessment: 'Assessment / interview', Approved: 'Approved', Enrolled: 'Enrolled', Rejected: 'Rejected / deferred' }[s] || s; }
  MICS.stageName = stageName;
  function applyAdmissionStage(adm, stage, note) {
    adm.stage = stage;
    var titles = { New: 'Returned to New', Review: 'Moved to Under review', Assessment: 'Moved to Assessment / interview', Approved: 'Admission approved', Rejected: 'Application rejected / deferred', Enrolled: 'Enrolled' };
    adm.timeline.push({ date: shortDate(), title: titles[stage], by: userName(), note: note });
    if (stage === 'Approved') state.notify({ title: 'Admission approved', text: adm.name + ' — offer letter ready to issue (simulated).', link: '#/admissions/' + adm.id, icon: 'user-plus' });
  }
})();
