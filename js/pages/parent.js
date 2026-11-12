/* ==========================================================================
   Parent portal
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var childId = null;
  var TITLES = { overview: 'Family Overview', academics: 'Academic Progress', fees: 'Fees & Payments', appointments: 'Appointments' };

  MICS.page('parent', {
    title: function (p) { return TITLES[p[0] || 'overview'] || 'Parent Portal'; },
    roles: ['parent'],
    navKey: function (p) { return p[0] ? 'parent/' + p[0] : 'parent'; },
    crumbs: function (p) { return [['Parent Portal', '#/parent'], [TITLES[p[0] || 'overview']]]; },
    render: function (el, params, query) {
      var u = MICS.auth.user();
      var kids = sel.childrenOf(u.parentId);
      if (query && query.get('child')) childId = query.get('child');
      if (!childId || !kids.some(function (k) { return k.id === childId; })) childId = kids[0].id;
      var s = sel.student(childId);
      var tab = params[0] || 'overview';
      var par = sel.parent(u.parentId);
      el.innerHTML = '<div class="dash-hero"><div><div class="page-eyebrow">Parent portal</div><h1>' + (tab === 'overview' ? 'Welcome, ' + ui.esc(u.name) : TITLES[tab]) + '</h1><div class="dash-meta"><span>' + ui.longDate(MICS.state.db.meta.today) + '</span><span class="sep"></span><span>' + kids.length + ' children at MICS</span><span class="sep"></span><span>Parent ID ' + par.id + '</span></div></div>' +
        '<div class="page-actions">' + (tab !== 'appointments' ? '<button class="btn" data-appt>' + ui.icon('calendar') + 'Request appointment</button>' : '') + (tab !== 'fees' ? '<button class="btn btn-primary" data-pay>' + ui.icon('upload') + 'Submit payment proof</button>' : '') + '</div></div>' +
        '<div class="child-switch mb-6" role="tablist" aria-label="Select child">' + kids.map(function (k) {
          var c = sel.cls(k.classId);
          return '<button class="child-tab ' + (k.id === childId ? 'active' : '') + '" data-child="' + k.id + '" role="tab" aria-selected="' + (k.id === childId) + '">' + ui.avatar(k.name) + '<span><span class="ct-name" style="display:block">' + ui.esc(k.name) + '</span><span class="ct-meta">' + ui.esc(c.name) + ' · ' + ui.esc(sel.prog(k.programmeId).short) + (k.boarding ? ' · Boarder' : '') + '</span></span></button>';
        }).join('') + '</div><div id="pp-body"></div>';
      var body = el.querySelector('#pp-body');
      ({ overview: overview, academics: academics, fees: fees, appointments: appointments }[tab] || overview)(body, s);
      el.querySelectorAll('[data-child]').forEach(function (b) { b.onclick = function () { childId = b.getAttribute('data-child'); history.replaceState(null, '', location.hash.split('?')[0]); MICS.router.render({ keepScroll: true }); ui.toast('Now viewing ' + sel.student(childId).name, '', 'info'); }; });
      bindActions(el, s);
    }
  });

  function bindActions(root, s) {
    root.querySelectorAll('[data-appt]').forEach(function (b) { b.onclick = function () { appointmentForm(s); }; });
    root.querySelectorAll('[data-pay]').forEach(function (b) { b.onclick = function () { paymentForm(s); }; });
  }

  function overview(body, s) {
    var db = MICS.state.db;
    var inv = sel.invoiceFor(s.id), bal = sel.balance(inv), ist = sel.invoiceStatus(inv);
    var res = sel.results(s), att = sel.attPct(s), cls = sel.cls(s.classId), tutor = sel.emp(cls.tutorId);
    var pend = sel.pendingPaymentsFor(s.id);
    var exam = db.examSlots.find(function (x) { return x.classId === s.classId; });
    body.innerHTML = '<div class="kpi-grid four">' +
      ui.kpi({ label: 'Attendance this term', icon: 'check-square', tone: att < 85 ? 'danger' : 'success', value: att.toFixed(1) + '<span class="unit">%</span>', foot: (s.attTotal - s.attPresent) + ' days absent · school avg 93%', href: '#/parent/academics' }) +
      ui.kpi({ label: 'Current average', icon: 'bar-chart', value: s.avg.toFixed(1) + '<span class="unit">%</span>', foot: 'Grade ' + sel.grade(s.avg, s.programmeId) + ' · ' + sel.gradeScale(s.programmeId), href: '#/parent/academics' }) +
      ui.kpi({ label: 'Fee balance', icon: 'wallet', tone: bal > 0 ? 'danger' : 'success', value: ui.money(bal).replace('GHS ', '<span class="unit" style="margin:0 4px 0 0">GHS</span>'), foot: ist.label + (pend.length ? ' · ' + pend.length + ' payment awaiting verification' : ' · due ' + ui.date(inv.due)), href: '#/parent/fees' }) +
      ui.kpi({ label: 'Next examination', icon: 'calendar', tone: 'gold', value: exam ? ui.dateShort(exam.date) : '16 Nov', foot: exam ? exam.subject + ' · ' + exam.time : 'Mid-term examinations' }) + '</div>' +
      '<div class="grid-12 mt-4">' +
        ui.card({ cls: 'col-7', title: 'Academic performance', sub: 'Mid-Term 1 · ' + sel.gradeScale(s.programmeId), action: '<a class="card-link" href="#/parent/academics">Full report ' + ui.icon('arrow-right') + '</a>', bodyCls: 'flush', body: '<table class="table compact"><thead><tr><th>Subject</th><th>Teacher</th><th class="num">Score</th><th class="num">Grade</th><th class="num">Change</th></tr></thead><tbody>' + res.map(function (r) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.subject) + '</td><td class="text-sm">' + ui.esc(r.teacher) + '</td><td class="num">' + r.latest + '%</td><td class="num"><span class="badge navy">' + r.grade + '</span></td><td class="num">' + ui.delta(r.change, '', false, 0) + '</td></tr>'; }).join('') + '</tbody></table>' }) +
        '<div class="col-5 flex-col gap-4" style="display:flex">' +
          ui.card({ title: 'Attendance summary', sub: 'Monthly · Term 1', body: '<div id="pp-att"></div>' }) +
          ui.card({ title: 'Class contacts', body: ui.person(tutor.name, 'Form tutor · ' + cls.name, '') + '<div class="mt-3">' + ui.person('Dr. Abena Owusu-Mensah', 'Head of School', '') + '</div>' }) +
        '</div>' +
        ui.card({ cls: 'col-4', title: 'Upcoming school events', bodyCls: 'flush', body: '<div class="list">' + db.events.filter(function (e) { return e.audience !== 'Board' && e.date >= db.meta.today; }).slice(0, 5).map(function (e) { return '<div class="list-item">' + ui.dateBlock(e.date) + '<div class="li-main"><div class="li-title">' + ui.esc(e.title) + '</div><div class="li-sub">' + ui.esc(e.location) + '</div></div></div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-4', title: 'School announcements', bodyCls: 'flush', body: '<div class="list">' + db.announcements.map(function (a) { return '<div class="list-item" style="align-items:flex-start"><span class="li-icon gold">' + ui.icon('message') + '</span><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(a.body) + '</div><div class="text-xs faint mt-1">' + ui.date(a.date) + ' · ' + ui.esc(sel.emp(a.authorId).shortName) + '</div></div></div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-4', title: 'Appointments', bodyCls: 'flush', body: apptList(s, 3), foot: '<button class="btn btn-sm btn-block" data-appt>' + ui.icon('plus') + 'Request appointment</button>' }) +
      '</div>';
    var monthly = sel.monthlyAttendance(s);
    charts.bars(body.querySelector('#pp-att'), { labels: monthly.map(function (m) { return ui.month(m.month + '-01'); }), series: [{ name: 'Attendance', color: 'var(--chart-1)', values: monthly.map(function (m) { return m.rate; }) }], height: 150, max: 100, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
  }

  function apptList(s, limit) {
    var mine = MICS.state.db.appointments.filter(function (a) { return a.studentId === s.id; }).slice(0, limit || 20);
    if (!mine.length) return ui.empty('No appointments', 'Request a meeting with a teacher or the school leadership.', 'calendar');
    return '<div class="list">' + mine.map(function (a) { return '<div class="list-item">' + ui.dateBlock(a.date) + '<div class="li-main"><div class="li-title">' + ui.esc(sel.emp(a.staffId).shortName) + '</div><div class="li-sub">' + a.slot + ' · ' + ui.esc(a.mode) + ' · ' + ui.esc(a.reason) + '</div></div>' + ui.status(a.status) + '</div>'; }).join('') + '</div>';
  }

  function academics(body, s) {
    var res = sel.results(s), avg = sel.termAverages(s);
    var days = sel.attendanceDays(s);
    body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-12', title: 'Examination results — ' + s.name, sub: sel.prog(s.programmeId).name + ' · ' + sel.gradeScale(s.programmeId), bodyCls: 'flush',
        body: '<div class="table-wrap"><table class="table"><thead><tr><th>Subject</th>' + sel.termLong.map(function (t) { return '<th class="num">' + t + '</th>'; }).join('') + '<th class="num">Grade</th></tr></thead><tbody>' + res.map(function (r) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.subject) + '<div class="text-xs muted" style="font-weight:400">' + ui.esc(r.teacher) + '</div></td>' + r.scores.map(function (v) { return '<td class="num">' + v + '%</td>'; }).join('') + '<td class="num"><span class="badge navy">' + r.grade + '</span></td></tr>'; }).join('') + '<tr style="background:var(--surface-muted)"><td class="strong">Average</td>' + avg.map(function (v) { return '<td class="num strong">' + v.toFixed(1) + '%</td>'; }).join('') + '<td></td></tr></tbody></table></div>' }) +
      ui.card({ cls: 'col-6', title: 'Progress over time', body: '<div id="pp-trend"></div>' }) +
      ui.card({ cls: 'col-6', title: 'Attendance — Term 1', sub: sel.attPct(s) + '% · ' + (s.attTotal - s.attPresent) + ' absences', body: '<div class="cal-heat">' + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(function (d) { return '<div class="cal-week-label">' + d + '</div>'; }).join('') + days.map(function (d) { return '<div class="cd ' + d.status + '" data-tt="' + charts.tt(ui.date(d.date), [{ label: 'Status', value: d.status }]) + '">' + ui.parseDate(d.date).getDate() + '</div>'; }).join('') + '</div>' }) + '</div>';
    charts.line(body.querySelector('#pp-trend'), { labels: sel.termLabels, series: [{ name: s.first, color: 'var(--chart-1)', values: avg }], height: 210, area: true, format: function (v) { return v.toFixed(1) + '%'; }, tickFormat: function (v) { return v + '%'; } });
  }

  function fees(body, s) {
    var u = MICS.auth.user();
    var kids = sel.childrenOf(u.parentId);
    var inv = sel.invoiceFor(s.id), bal = sel.balance(inv), ist = sel.invoiceStatus(inv);
    var pays = MICS.state.db.payments.filter(function (p) { return p.studentId === s.id; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var family = kids.reduce(function (a, k) { return a + sel.balance(sel.invoiceFor(k.id)); }, 0);
    body.innerHTML = '<div class="grid-12">' +
      ui.card({ cls: 'col-5', title: 'Invoice ' + inv.id, sub: inv.term + ' · issued ' + ui.date(inv.issued) + ' · due ' + ui.date(inv.due), action: ui.status(ist.label, ist.tone), bodyCls: 'flush',
        body: '<table class="table"><tbody>' + inv.lines.map(function (l) { return '<tr><td>' + ui.esc(l.label) + '</td><td class="num">' + ui.money(l.amount) + '</td></tr>'; }).join('') + (inv.arrears ? '<tr><td>Arrears brought forward</td><td class="num">' + ui.money(inv.arrears) + '</td></tr>' : '') +
          '<tr><td class="strong">Total</td><td class="num strong">' + ui.money(inv.amount + (inv.arrears || 0)) + '</td></tr><tr><td>Verified payments</td><td class="num c-success">− ' + ui.money(inv.paid) + '</td></tr><tr style="background:var(--surface-muted)"><td class="strong">Balance due</td><td class="num strong ' + (bal > 0 ? 'c-danger' : 'c-success') + '" style="font-size:15px">' + ui.money(bal) + '</td></tr></tbody></table>',
        foot: '<span class="muted">Family balance (' + kids.length + ' children): <strong class="text-2">' + ui.money(family) + '</strong></span>' + (bal > 0 ? '<button class="btn btn-primary btn-sm" data-pay>' + ui.icon('upload') + 'Submit payment proof</button>' : '') }) +
      '<div class="col-7 flex-col gap-4" style="display:flex">' +
        ui.card({ title: 'How to pay', body: '<div class="grid grid-2"><div><div class="text-sm strong">Bank transfer / deposit</div><div class="text-sm muted mt-1">Account: MICS Fees Account (demo)<br>Reference: ' + s.id + '</div></div><div><div class="text-sm strong">Mobile Money</div><div class="text-sm muted mt-1">Merchant: MICS Fees (demo)<br>Reference: ' + s.id + '</div></div></div><div class="banner neutral mt-4">' + ui.icon('info') + '<div>After paying, submit your payment reference here. The Finance office verifies it, usually within 2 working days. No card payments are taken in the portal.</div></div>' }) +
        ui.card({ title: 'Payment history', sub: 'Verification by MICS Finance; accounting record held in QuickBooks', bodyCls: 'flush', body: pays.length ? '<table class="table compact"><thead><tr><th>Date</th><th>Reference</th><th class="num">Amount</th><th>Status</th></tr></thead><tbody>' + pays.map(function (p) { return '<tr><td class="nowrap">' + ui.date(p.date) + '</td><td class="mono">' + ui.esc(p.reference) + '<div class="text-xs muted" style="font-family:var(--font-sans)">' + ui.esc(p.method) + '</div></td><td class="num">' + ui.money(p.amount) + '</td><td>' + (p.verification === 'Pending' ? ui.badge('Awaiting verification', 'warning', true) : p.verification === 'Rejected' ? ui.badge('Not verified', 'danger', true) + (p.verifyNote ? '<div class="text-xs muted mt-1">' + ui.esc(p.verifyNote) + '</div>' : '') : ui.badge('Verified', 'success', true)) + '</td></tr>'; }).join('') + '</tbody></table>' : ui.empty('No payments yet', '', 'receipt') }) +
      '</div></div>';
  }

  function appointments(body, s) {
    body.innerHTML = '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Appointments for ' + s.name, action: '<button class="btn btn-primary btn-sm" data-appt>' + ui.icon('plus') + 'Request appointment</button>', bodyCls: 'flush', body: apptList(s) }) +
      ui.card({ cls: 'col-4', title: 'Meeting guidance', body: '<ul class="ai-list"><li><span class="b"></span><span>Teachers confirm requests within 2 working days.</span></li><li><span class="b"></span><span>In-person meetings take place at the Admin Block reception.</span></li><li><span class="b"></span><span>Virtual meetings use a Google Meet link sent by email.</span></li></ul>' }) + '</div>';
  }

  function appointmentForm(s) {
    var cls = sel.cls(s.classId);
    var staff = [cls.tutorId].concat(MICS.state.db.allocations.filter(function (a) { return a.classId === s.classId; }).map(function (a) { return a.teacherId; })).concat(['EMP-0001', 'EMP-0003']);
    var uniq = staff.filter(function (x, i) { return staff.indexOf(x) === i; });
    var today = MICS.state.db.meta.today;
    ui.modal({ title: 'Request an appointment', sub: 'Regarding ' + s.name + ' · ' + cls.name, icon: 'calendar',
      body: '<div class="form-grid">' + ui.field({ id: 'ap-staff', label: 'Meet with', type: 'select', required: true, placeholder: 'Select staff member…', full: true, options: uniq.map(function (id) { var e = sel.emp(id); var subj = MICS.state.db.allocations.find(function (a) { return a.classId === s.classId && a.teacherId === id; }); return { value: id, label: e.name + ' — ' + (id === cls.tutorId ? 'Form tutor' : subj ? subj.subject : e.role) }; }) }) +
        ui.field({ id: 'ap-date', label: 'Preferred date', type: 'date', required: true, min: today }) +
        ui.field({ id: 'ap-slot', label: 'Time', type: 'select', required: true, options: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'], value: '14:00' }) +
        ui.field({ id: 'ap-mode', label: 'Meeting type', type: 'select', options: ['In person', 'Virtual (Google Meet)', 'Phone call'], value: 'In person', full: true }) +
        ui.field({ id: 'ap-reason', label: 'Purpose of meeting', type: 'textarea', required: true, full: true, placeholder: 'e.g. Discuss mid-term preparation and progress in Mathematics' }) + '</div>',
      actions: [{ label: 'Cancel' }, { label: 'Send request', cls: 'btn-primary', onClick: function (api) {
        var ok = ui.validate(api.el, { 'ap-staff': ui.required('Staff member'), 'ap-date': function (v) { if (!v) return 'Choose a date.'; if (v < today) return 'Date cannot be in the past.'; var d = ui.parseDate(v).getDay(); return d === 0 || d === 6 ? 'Please choose a school day (Mon–Fri).' : null; }, 'ap-reason': function (v) { return !v ? 'Please describe the purpose of the meeting.' : v.length < 8 ? 'Please add a little more detail.' : null; } });
        if (!ok) return false;
        MICS.actions.requestAppointment({ studentId: s.id, staffId: ui.val(api.el, 'ap-staff'), date: ui.val(api.el, 'ap-date'), slot: ui.val(api.el, 'ap-slot'), mode: ui.val(api.el, 'ap-mode'), reason: ui.val(api.el, 'ap-reason') });
        ui.toast('Appointment requested', 'You will be notified when ' + sel.emp(ui.val(api.el, 'ap-staff')).shortName + ' confirms.');
      } }] });
  }

  function paymentForm(s) {
    var u = MICS.auth.user();
    var kids = sel.childrenOf(u.parentId);
    var today = MICS.state.db.meta.today;
    ui.modal({ title: 'Submit payment proof', sub: 'For payments already made by bank or mobile money', icon: 'upload', size: 'lg',
      body: '<div class="form-grid">' + ui.field({ id: 'py-child', label: 'Child', type: 'select', required: true, value: s.id, options: kids.map(function (k) { var b = sel.balance(sel.invoiceFor(k.id)); return { value: k.id, label: k.name + ' — balance ' + ui.money(b) }; }) }) +
        ui.field({ id: 'py-amount', label: 'Amount paid (GHS)', type: 'number', required: true, min: 1, step: '0.01', placeholder: 'e.g. 3000' }) +
        ui.field({ id: 'py-method', label: 'Payment method', type: 'select', options: ['Bank transfer', 'Bank deposit', 'Mobile Money'], value: 'Mobile Money' }) +
        ui.field({ id: 'py-date', label: 'Date paid', type: 'date', required: true, value: today, max: today }) +
        ui.field({ id: 'py-ref', label: 'Transaction reference', required: true, full: true, placeholder: 'e.g. MTN-MM 7731928456 or bank slip number', hint: 'As shown on your bank slip or mobile money confirmation' }) +
        '<div class="field full" data-field="py-file"><span class="label">Proof of payment</span><label class="file-drop" for="py-file">' + ui.icon('upload') + '<div class="mt-2" id="py-file-name">Click to attach a receipt (PDF, JPG or PNG)</div><input type="file" id="py-file" accept=".pdf,.jpg,.jpeg,.png"></label><div class="field-hint">Prototype: only the file name is stored locally; no file is uploaded.</div></div>' +
        ui.field({ id: 'py-note', label: 'Note to Finance (optional)', type: 'textarea', full: true }) + '</div>' +
        '<div class="banner warning mt-4">' + ui.icon('info') + '<div>Your balance updates once Finance verifies the payment. The school’s accounting record (QuickBooks) is updated separately.</div></div>',
      onOpen: function (el) { el.querySelector('#py-file').onchange = function (e) { var f = e.target.files[0]; el.querySelector('#py-file-name').innerHTML = f ? '<strong>' + ui.esc(f.name) + '</strong> attached' : 'Click to attach a receipt'; }; },
      actions: [{ label: 'Cancel' }, { label: 'Submit for verification', cls: 'btn-primary', onClick: function (api) {
        var r = api.el;
        var kid = ui.val(r, 'py-child');
        var bal = sel.balance(sel.invoiceFor(kid));
        var ok = ui.validate(r, {
          'py-amount': function (v) { var n = +v; if (!v) return 'Enter the amount paid.'; if (isNaN(n) || n <= 0) return 'Enter a valid amount.'; if (n > bal + 0.001 && bal > 0) return 'Amount exceeds the outstanding balance of ' + ui.money(bal) + '.'; return null; },
          'py-date': function (v) { return !v ? 'Enter the payment date.' : v > today ? 'Payment date cannot be in the future.' : null; },
          'py-ref': function (v) { return !v ? 'Enter the transaction reference.' : v.length < 6 ? 'Reference looks too short — please check it.' : MICS.state.db.payments.some(function (p) { return p.reference.toLowerCase() === v.toLowerCase(); }) ? 'This reference has already been submitted.' : null; }
        });
        if (!ok) return false;
        var file = r.querySelector('#py-file').files[0];
        MICS.actions.submitPayment({ studentId: kid, amount: Math.round(+ui.val(r, 'py-amount') * 100) / 100, method: ui.val(r, 'py-method'), date: ui.val(r, 'py-date'), reference: ui.val(r, 'py-ref'), proof: file ? file.name : null, note: ui.val(r, 'py-note') });
        ui.toast('Payment reference submitted', 'Finance will verify it shortly. Status: awaiting verification.');
      } }] });
  }
})();
