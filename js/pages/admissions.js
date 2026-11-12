/* ==========================================================================
   Admissions pipeline
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel;
  var STAGES = [
    { id: 'New', label: 'New applications', color: 'var(--text-faint)' },
    { id: 'Review', label: 'Under review', color: 'var(--chart-3)' },
    { id: 'Assessment', label: 'Assessment / interview', color: 'var(--chart-2)' },
    { id: 'Approved', label: 'Approved', color: 'var(--chart-1)' },
    { id: 'Enrolled', label: 'Enrolled', color: 'var(--success)' },
    { id: 'Rejected', label: 'Rejected / deferred', color: 'var(--chart-4)' }
  ];
  var view = { mode: 'board', q: '', prog: '', stage: '' };
  var flashId = null;

  MICS.page('admissions', {
    title: 'Admissions', roles: ['head', 'admin'],
    crumbs: function (p) { var c = [['Student Information'], ['Admissions', '#/admissions']]; if (p[0]) { var a = sel.get('admissions', p[0]); if (a) c.push([a.name]); } return c; },
    render: function (el, params) {
      var db = MICS.state.db;
      var all = db.admissions;
      var rows = all.filter(function (a) {
        if (view.q && (a.name + a.id + a.previousSchool + a.guardian.name).toLowerCase().indexOf(view.q.toLowerCase()) < 0) return false;
        if (view.prog && a.programmeId !== view.prog) return false;
        return true;
      });
      var decided = all.filter(function (a) { return a.stage === 'Enrolled' || a.stage === 'Approved' || a.stage === 'Rejected'; });
      var conv = Math.round(all.filter(function (a) { return a.stage === 'Enrolled' || a.stage === 'Approved'; }).length / (decided.length || 1) * 100);
      var scored = all.filter(function (a) { return a.score != null; });
      var avgScore = Math.round(scored.reduce(function (s, a) { return s + a.score; }, 0) / scored.length);

      el.innerHTML = ui.pageHead({
        eyebrow: 'Admissions cycle 2026/27 – 2027/28',
        title: 'Admissions',
        desc: 'Track every applicant from enquiry to enrolment. Decisions flow to the Head of School’s approvals and enrolled applicants automatically become student records with a guardian portal account and invoice.',
        actions: '<div class="segmented" role="tablist" aria-label="View"><button class="' + (view.mode === 'board' ? 'active' : '') + '" data-mode="board">' + ui.icon('columns') + 'Pipeline</button><button class="' + (view.mode === 'list' ? 'active' : '') + '" data-mode="list">' + ui.icon('list') + 'List</button></div>' +
          '<button class="btn btn-primary" id="adm-new">' + ui.icon('plus') + 'New application</button>'
      }) +
        '<section class="card mb-4"><div class="pipeline-summary">' + STAGES.map(function (s) {
          var n = all.filter(function (a) { return a.stage === s.id; }).length;
          return '<button class="' + (view.stage === s.id ? 'active' : '') + '" data-stage="' + s.id + '"><div class="ps-k"><span class="ps-dot" style="background:' + s.color + '"></span>' + s.label + '</div><div class="ps-v">' + n + '</div></button>';
        }).join('') + '</div>' +
        '<div class="stat-strip"><div><div class="stat-k">Applications this cycle</div><div class="stat-v">' + all.length + '</div></div><div><div class="stat-k">Offer rate (decided)</div><div class="stat-v">' + conv + '%</div></div><div><div class="stat-k">Average assessment score</div><div class="stat-v">' + avgScore + '%</div></div><div><div class="stat-k">Boarding applicants</div><div class="stat-v">' + all.filter(function (a) { return a.boarding; }).length + '</div></div><div><div class="stat-k">Awaiting Head of School decision</div><div class="stat-v c-warning">' + all.filter(function (a) { return a.stage === 'Assessment'; }).length + '</div></div></div></section>' +
        '<div class="flex gap-2 items-center wrap mb-3"><div class="search-input">' + ui.icon('search') + '<input type="search" id="adm-q" placeholder="Search applicant, school or guardian…" value="' + ui.esc(view.q) + '"></div>' +
        '<select class="select" id="adm-prog"><option value="">All programmes</option>' + db.programmes.map(function (p) { return '<option value="' + p.id + '"' + (view.prog === p.id ? ' selected' : '') + '>' + ui.esc(p.short) + '</option>'; }).join('') + '</select>' +
        (view.stage ? '<button class="filter-chip active" id="adm-clear-stage">' + ui.esc(MICS.stageName(view.stage)) + ' ' + ui.icon('x', 'icon-sm') + '</button>' : '') +
        '<div class="grow"></div><span class="text-sm muted">Click an applicant to review, change status or approve.</span></div>' +
        '<div id="adm-view"></div>';

      var v = el.querySelector('#adm-view');
      if (view.mode === 'board') {
        v.innerHTML = '<div class="kanban">' + STAGES.filter(function (s) { return !view.stage || s.id === view.stage; }).map(function (s) {
          var items = rows.filter(function (a) { return a.stage === s.id; }).sort(function (a, b) { return b.submitted.localeCompare(a.submitted); });
          return '<div class="kanban-col"><div class="kanban-head"><span class="k-dot" style="background:' + s.color + '"></span>' + s.label + '<span class="k-count">' + items.length + '</span></div><div class="kanban-list">' +
            (items.length ? items.map(card).join('') : '<div class="text-sm muted center" style="padding:24px 8px">No applicants</div>') + '</div></div>';
        }).join('') + '</div>';
        if (view.stage) v.querySelector('.kanban').style.gridTemplateColumns = 'minmax(260px, 420px)';
      } else {
        ui.table(v, { rows: rows.filter(function (a) { return !view.stage || a.stage === view.stage; }), noun: 'applications', pageSize: 15, sortKey: 'submitted', dir: -1, onRow: function (a) { MICS.openAdmission(a.id); },
          cols: [
            { key: 'name', label: 'Applicant', render: function (a) { return ui.person(a.name, a.id + ' · ' + a.previousSchool); } },
            { key: 'targetClass', label: 'Entry class', sort: function (a) { return sel.cls(a.targetClass).name; }, render: function (a) { return '<div class="text-sm" style="color:var(--text)">' + ui.esc(sel.cls(a.targetClass).name) + '</div><div class="text-xs muted">' + ui.esc(a.entry) + '</div>'; } },
            { key: 'programmeId', label: 'Programme', render: function (a) { return ui.esc(sel.prog(a.programmeId).short); } },
            { key: 'submitted', label: 'Submitted', render: function (a) { return '<span class="nowrap">' + ui.date(a.submitted) + '</span>'; } },
            { key: 'score', label: 'Assessment', num: true, sort: function (a) { return a.score || 0; }, render: function (a) { return a.score != null ? a.score + '%' : '<span class="muted">—</span>'; } },
            { key: 'docs', label: 'Documents', sort: function (a) { return docsOk(a); }, render: function (a) { return docsOk(a) + '/5'; } },
            { key: 'stage', label: 'Stage', sort: function (a) { return STAGES.findIndex(function (s) { return s.id === a.stage; }); }, render: function (a) { return stageBadge(a.stage); } }
          ] });
      }

      v.querySelectorAll('[data-adm]').forEach(function (c) { c.onclick = function () { MICS.openAdmission(c.getAttribute('data-adm')); }; c.onkeydown = function (e) { if (e.key === 'Enter') MICS.openAdmission(c.getAttribute('data-adm')); }; });
      el.querySelectorAll('[data-mode]').forEach(function (b) { b.onclick = function () { view.mode = b.getAttribute('data-mode'); MICS.router.render({ keepScroll: true }); }; });
      el.querySelectorAll('[data-stage]').forEach(function (b) { b.onclick = function () { var s = b.getAttribute('data-stage'); view.stage = view.stage === s ? '' : s; MICS.router.render({ keepScroll: true }); }; });
      var cs = el.querySelector('#adm-clear-stage'); if (cs) cs.onclick = function () { view.stage = ''; MICS.router.render({ keepScroll: true }); };
      el.querySelector('#adm-prog').onchange = function (e) { view.prog = e.target.value; MICS.router.render({ keepScroll: true }); };
      var q = el.querySelector('#adm-q'), t;
      q.oninput = function () { clearTimeout(t); t = setTimeout(function () { view.q = q.value; MICS.router.render({ keepScroll: true }); var n = document.getElementById('adm-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
      el.querySelector('#adm-new').onclick = newApplication;
      if (params[0] && !document.querySelector('.drawer')) MICS.openAdmission(params[0], true);
      flashId = null;
    }
  });

  function docsOk(a) { return a.docs.filter(function (d) { return d.ok; }).length; }
  function stageBadge(s) {
    var tone = { New: 'neutral', Review: 'info', Assessment: 'warning', Approved: 'navy', Enrolled: 'success', Rejected: 'danger' }[s];
    return ui.badge(MICS.stageName(s), tone, true);
  }
  function card(a) {
    var d = docsOk(a);
    return '<div class="k-card ' + (a.id === flashId ? 'flash' : '') + '" data-adm="' + a.id + '" tabindex="0" role="button" aria-label="' + ui.esc(a.name) + '">' +
      '<div class="flex items-start justify-between gap-2"><div style="min-width:0"><div class="k-name">' + ui.esc(a.name) + '</div><div class="k-meta">' + ui.esc(sel.cls(a.targetClass).name) + ' · ' + ui.esc(sel.prog(a.programmeId).short) + '</div></div>' + ui.avatar(a.name, 'sm') + '</div>' +
      '<div class="k-foot"><span class="text-xs muted">' + ui.icon('clock', 'icon-sm').replace('class="icon icon-sm"', 'class="icon icon-sm" style="display:inline;vertical-align:-2px;margin-right:3px"') + (ui.daysBetween(a.submitted, MICS.state.db.meta.today) < 7 ? ui.rel(a.submitted) : ui.dateShort(a.submitted)) + '</span><span class="flex gap-1">' +
      (a.score != null ? '<span class="badge sm ' + (a.score >= 70 ? 'success' : a.score >= 55 ? 'gold' : 'danger') + '">' + a.score + '%</span>' : '') +
      '<span class="badge sm ' + (d === 5 ? 'success' : 'outline') + '" title="Documents received">' + d + '/5 docs</span>' + (a.boarding ? '<span class="badge sm navy" title="Boarding">B</span>' : '') + '</span></div></div>';
  }

  // ---------- Application drawer ----------
  MICS.openAdmission = function (id, fromRoute) {
    var dr = ui.drawer({ wide: true, title: '', onClose: function () { if (location.hash.indexOf('#/admissions/') === 0) history.replaceState(null, '', '#/admissions'); } });
    if (!fromRoute) history.replaceState(null, '', '#/admissions/' + id);
    function draw() {
      var a = sel.get('admissions', id); if (!a) { dr.close(); return; }
      var stepOrder = ['New', 'Review', 'Assessment', 'Approved', 'Enrolled'];
      var si = stepOrder.indexOf(a.stage);
      var stepper = '<div class="stepper">' + stepOrder.map(function (s, i) {
        var cls = a.stage === 'Rejected' ? (i < 2 ? 'done' : '') : i < si ? 'done' : i === si ? (s === 'Enrolled' ? 'done' : 'current') : '';
        return '<div class="step ' + cls + '"><div class="s-dot">' + (cls === 'done' ? ui.icon('check') : i + 1) + '</div>' + ui.esc(MICS.stageName(s)) + '</div>';
      }).join('') + '</div>';
      var cls = sel.cls(a.targetClass);
      var body = '<div class="drawer-section">' + stepper + (a.stage === 'Rejected' ? '<div class="banner danger mt-4">' + ui.icon('x-circle') + '<div>This application was not progressed. It can be reopened if circumstances change (e.g. deferral to a later intake).</div></div>' : '') + '</div>' +
        '<div class="drawer-section"><h4>Applicant</h4><div class="dl-grid">' + kv('Full name', a.name) + kv('Gender', a.gender) + kv('Date of birth', ui.date(a.dob)) + kv('Programme', sel.prog(a.programmeId).name) + kv('Entry class', cls.name) + kv('Entry point', a.entry) + kv('Previous school', a.previousSchool) + kv('Boarding', a.boarding ? 'Boarder' : 'Day student') + kv('Application source', a.source) + '</div></div>' +
        '<div class="drawer-section"><h4>Parent / guardian</h4><div class="dl-grid">' + kv('Name', a.guardian.name) + kv('Relationship', a.guardian.relation) + kv('Phone', a.guardian.phone) + kv('Email', a.guardian.email) + '</div></div>' +
        '<div class="grid grid-2 drawer-section"><div><h4 style="font-size:11.5px;font-weight:650;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Documents (' + docsOk(a) + '/5)</h4><div class="doc-list">' + a.docs.map(function (d) { return '<div class="doc-row ' + (d.ok ? 'ok' : 'missing') + '">' + ui.icon(d.ok ? 'check-circle' : 'alert') + '<span class="grow">' + ui.esc(d.name) + '</span></div>'; }).join('') + '</div></div>' +
        '<div><h4 style="font-size:11.5px;font-weight:650;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">Assessment & interview</h4>' +
          (a.score != null ? '<div class="score-meter"><span class="sm-val">' + a.score + '%</span><div class="grow">' + ui.progress(a.score, a.score >= 70 ? 'success' : a.score >= 55 ? 'gold' : 'danger', true) + '<div class="text-xs muted mt-1">Benchmark 55% · completed ' + (a.interview ? ui.date(a.interview) : '') + '</div></div></div>' : '<div class="banner neutral">' + ui.icon('calendar') + '<div>' + (a.interview ? 'Interview scheduled for <strong>' + ui.date(a.interview) + '</strong>.' : 'Not yet scheduled.') + ' Record the result once the entrance assessment is complete.</div></div>') +
          '<div class="mt-3 text-sm muted">Class capacity: <strong class="text-2">' + sel.classStudents(cls.id).length + ' / ' + cls.capacity + '</strong> (' + Math.max(0, cls.capacity - sel.classStudents(cls.id).length) + ' places)</div>' +
          (a.notes ? '<div class="tl-note">' + ui.esc(a.notes) + '</div>' : '') + '</div></div>' +
        '<div class="drawer-section"><h4>Change status</h4><div class="flex gap-2 items-center wrap"><select class="select" id="adm-stage-sel" style="min-width:220px">' + ['New', 'Review', 'Assessment', 'Approved', 'Rejected'].map(function (s) { return '<option value="' + s + '"' + (a.stage === s ? ' selected' : '') + '>' + MICS.stageName(s) + '</option>'; }).join('') + '</select><button class="btn" id="adm-stage-go"' + (a.stage === 'Enrolled' ? ' disabled' : '') + '>Update status</button><span class="text-xs muted">Every change is recorded in the timeline below.</span></div></div>' +
        '<div class="drawer-section"><h4>Application timeline</h4><div class="timeline">' + a.timeline.slice().reverse().map(function (t, i) {
          return '<div class="tl-item ' + (i === 0 ? (a.stage === 'Rejected' ? 'danger' : a.stage === 'Enrolled' ? 'done' : 'current') : 'done') + '"><span class="tl-dot"></span><div class="tl-title">' + ui.esc(t.title) + '</div><div class="tl-sub">' + ui.esc(t.by) + ' · ' + ui.date(t.date) + '</div>' + (t.note ? '<div class="tl-note">' + ui.esc(t.note) + '</div>' : '') + '</div>';
        }).join('') + '</div></div>';

      var foot = '';
      if (a.stage === 'New') foot = btn('reject', 'btn-danger', 'x', 'Reject / defer') + btn('to-review', 'btn-primary', 'arrow-right', 'Move to review');
      if (a.stage === 'Review') foot = btn('reject', 'btn-danger', 'x', 'Reject / defer') + btn('assess', 'btn-primary', 'clipboard', 'Record assessment result');
      if (a.stage === 'Assessment') foot = btn('reject', 'btn-danger', 'x', 'Reject') + btn('approve', 'btn-success', 'check', 'Approve admission');
      if (a.stage === 'Approved') foot = btn('reject', 'btn-danger', 'x', 'Withdraw offer') + btn('demo-offer', '', 'mail', 'Send offer letter') + btn('enrol', 'btn-primary', 'user-plus', 'Enrol student');
      if (a.stage === 'Enrolled') foot = '<span class="left text-sm muted">Student record <strong class="mono">' + (a.studentId || '') + '</strong></span>' + (a.studentId ? '<a class="btn btn-primary" href="#/students/' + a.studentId + '">' + ui.icon('user') + 'Open student record</a>' : '');
      if (a.stage === 'Rejected') foot = btn('reopen', 'btn-primary', 'refresh', 'Reopen application');

      dr.render({ title: a.name, sub: '<span class="mono">' + a.id + '</span>' + stageBadge(a.stage) + '<span>' + ui.esc(cls.name) + ' · ' + ui.esc(a.entry) + '</span>', lead: ui.avatar(a.name, 'lg'), body: body, foot: foot,
        bind: function (root) {
          root.querySelectorAll('a[href^="#/"]').forEach(function (l) { l.addEventListener('click', function () { dr.close(); }); });
          on(root, 'to-review', function () { MICS.actions.setAdmissionStage(id, 'Review'); ui.toast('Moved to Under review', a.name); after(); });
          on(root, 'assess', function () { assessModal(a, after); });
          on(root, 'approve', function () {
            ui.confirm({ title: 'Approve admission?', sub: a.name + ' · ' + cls.name, text: 'The applicant will move to <strong>Approved</strong>, the Head of School approval request will be closed, and the dashboard will update.', reason: true, reasonLabel: 'Decision note', confirmLabel: 'Approve admission', btnCls: 'btn-success', icon: 'check-circle', tone: 'success' }).then(function (r) {
              if (!r.ok) return; MICS.actions.setAdmissionStage(id, 'Approved', r.reason); ui.toast('Admission approved', a.name + ' — offer letter ready (simulated)'); after();
            });
          });
          on(root, 'reject', function () {
            ui.confirm({ title: a.stage === 'Approved' ? 'Withdraw offer?' : 'Reject or defer application?', sub: a.name, text: 'The guardian will be informed (simulated). The application stays on file and can be reopened.', reason: true, reasonRequired: true, reasonLabel: 'Reason', confirmLabel: 'Confirm', tone: 'danger' }).then(function (r) {
              if (!r.ok) return; MICS.actions.setAdmissionStage(id, 'Rejected', r.reason); ui.toast('Application updated', a.name + ' — rejected / deferred', 'info'); after();
            });
          });
          on(root, 'reopen', function () { MICS.actions.setAdmissionStage(id, 'Review', 'Application reopened'); ui.toast('Application reopened', a.name); after(); });
          on(root, 'demo-offer', function () { ui.demoOnly('Send offer letter', 'In the full system a personalised offer letter (PDF) with fee schedule and acceptance link is emailed to the guardian. No email is sent from this prototype.'); });
          on(root, 'enrol', function () {
            ui.confirm({ title: 'Enrol ' + a.name + '?', sub: cls.name + ' · ' + a.entry, text: 'This will create the student record, link a guardian portal account and raise the first term invoice — demonstrating one connected record from admission through to finance.', confirmLabel: 'Enrol student', icon: 'user-plus', tone: 'success', btnCls: 'btn-primary' }).then(function (r) {
              if (!r.ok) return; var sid = MICS.actions.enrolAdmission(id); ui.toast('Student enrolled', a.name + ' is now ' + sid); after();
            });
          });
          var go = root.querySelector('#adm-stage-go');
          if (go) go.onclick = function () {
            var target = root.querySelector('#adm-stage-sel').value;
            if (target === a.stage) { ui.toast('No change', 'The application is already in this stage.', 'info'); return; }
            if (target === 'Approved' || target === 'Rejected') { root.querySelector('[data-b="' + (target === 'Approved' && a.stage === 'Assessment' ? 'approve' : 'reject') + '"]') ? root.querySelector('[data-b="' + (target === 'Approved' && a.stage === 'Assessment' ? 'approve' : 'reject') + '"]').click() : confirmMove(target); return; }
            confirmMove(target);
          };
          function confirmMove(target) {
            ui.confirm({ title: 'Change status to ' + MICS.stageName(target) + '?', sub: a.name, reason: true, reasonLabel: 'Note', confirmLabel: 'Update status', icon: 'refresh', tone: '' }).then(function (r) { if (!r.ok) return; MICS.actions.setAdmissionStage(id, target, r.reason); ui.toast('Status updated', a.name + ' → ' + MICS.stageName(target)); after(); });
          }
        } });
    }
    function after() { flashId = id; draw(); }
    draw();
  };
  function on(root, b, fn) { var x = root.querySelector('[data-b="' + b + '"]'); if (x) x.onclick = fn; }
  function btn(b, cls, icon, label) { return '<button class="btn ' + cls + '" data-b="' + b + '">' + ui.icon(icon) + label + '</button>'; }
  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }

  function assessModal(a, done) {
    ui.modal({
      title: 'Record assessment result', sub: a.name + ' · ' + sel.cls(a.targetClass).name, icon: 'clipboard',
      body: '<div class="form-grid">' + ui.field({ id: 'as-score', label: 'Assessment score (%)', type: 'number', min: 0, max: 100, required: true, placeholder: 'e.g. 72' }) +
        ui.field({ id: 'as-date', label: 'Assessment date', type: 'date', value: MICS.state.db.meta.today, required: true }) +
        ui.field({ id: 'as-notes', label: 'Panel notes', type: 'textarea', full: true, placeholder: 'Summary of interview and recommendation…' }) + '</div>' +
        '<div class="banner neutral mt-4">' + ui.icon('info') + '<div>Saving moves the applicant to <strong>Assessment / interview</strong> and sends an admission decision request to the Head of School’s approvals inbox.</div></div>',
      actions: [{ label: 'Cancel' }, { label: 'Save & send for decision', cls: 'btn-primary', onClick: function (api) {
        var ok = ui.validate(api.el, { 'as-score': function (v) { if (!v) return 'Enter the assessment score.'; var n = +v; return n < 0 || n > 100 || isNaN(n) ? 'Score must be between 0 and 100.' : null; }, 'as-date': ui.required('Assessment date') });
        if (!ok) return false;
        var notes = ui.val(api.el, 'as-notes');
        MICS.actions.recordAssessment(a.id, Math.round(+ui.val(api.el, 'as-score')));
        if (notes) MICS.state.update(function () { a.notes = notes; });
        ui.toast('Assessment recorded', 'Sent to Head of School for decision');
        done();
      } }]
    });
  }

  function newApplication() {
    var db = MICS.state.db;
    ui.modal({
      title: 'New application', sub: 'Capture an application received by the admissions office', icon: 'user-plus', size: 'lg',
      body: '<form id="na-form" novalidate><div class="form-grid">' +
        ui.field({ id: 'na-name', label: 'Applicant full name', required: true, placeholder: 'e.g. Abena Serwaa Mensah' }) +
        ui.field({ id: 'na-gender', label: 'Gender', type: 'select', required: true, placeholder: 'Select…', options: ['Female', 'Male'] }) +
        ui.field({ id: 'na-dob', label: 'Date of birth', type: 'date', required: true }) +
        ui.field({ id: 'na-class', label: 'Entry class', type: 'select', required: true, placeholder: 'Select class…', options: db.classes.map(function (c) { return { value: c.id, label: c.name + ' — ' + sel.prog(c.programmeId).short }; }) }) +
        ui.field({ id: 'na-entry', label: 'Entry point', type: 'select', required: true, options: ['Term 2 · Jan 2027', 'Term 3 · Apr 2027', 'Sept 2027'], value: 'Term 2 · Jan 2027' }) +
        ui.field({ id: 'na-board', label: 'Boarding', type: 'select', options: ['Day student', 'Boarder'], value: 'Day student' }) +
        ui.field({ id: 'na-prev', label: 'Previous school', required: true, full: true, placeholder: 'School name and town' }) +
        ui.field({ id: 'na-gname', label: 'Parent / guardian name', required: true }) +
        ui.field({ id: 'na-rel', label: 'Relationship', type: 'select', options: ['Father', 'Mother', 'Guardian'], value: 'Father' }) +
        ui.field({ id: 'na-phone', label: 'Phone', required: true, placeholder: '+233 24 000 0000', hint: 'Ghana mobile number' }) +
        ui.field({ id: 'na-email', label: 'Email', type: 'email', required: true, placeholder: 'name@example.com' }) +
        '<div class="field full"><span class="label">Documents received</span><div class="flex gap-4 wrap"><label class="checkbox"><input type="checkbox" id="na-d1">Birth certificate</label><label class="checkbox"><input type="checkbox" id="na-d2">School reports</label><label class="checkbox"><input type="checkbox" id="na-d3">Passport photographs</label></div></div>' +
        ui.field({ id: 'na-notes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Optional' }) +
        '</div></form>',
      actions: [{ label: 'Cancel' }, { label: 'Create application', cls: 'btn-primary', onClick: function (api) {
        var r = api.el;
        var ok = ui.validate(r, {
          'na-name': function (v) { return !v ? 'Applicant name is required.' : v.split(/\s+/).length < 2 ? 'Enter first and last name.' : null; },
          'na-gender': ui.required('Gender'), 'na-dob': ui.required('Date of birth'), 'na-class': ui.required('Entry class'),
          'na-prev': ui.required('Previous school'), 'na-gname': ui.required('Guardian name'),
          'na-phone': function (v) { return !v ? 'Phone number is required.' : /^(\+233|0)\s?\d{2}\s?\d{3}\s?\d{4}$/.test(v.replace(/\s+/g, ' ').trim()) || /^(\+233|0)\d{9}$/.test(v.replace(/\s/g, '')) ? null : 'Enter a valid Ghana number, e.g. +233 24 123 4567'; },
          'na-email': function (v) { return !v ? 'Email is required.' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address.'; }
        });
        if (!ok) return false;
        var id = MICS.actions.createAdmission({ name: ui.val(r, 'na-name'), gender: ui.val(r, 'na-gender'), dob: ui.val(r, 'na-dob'), targetClass: ui.val(r, 'na-class'), entry: ui.val(r, 'na-entry'), boarding: ui.val(r, 'na-board') === 'Boarder', previousSchool: ui.val(r, 'na-prev'), guardianName: ui.val(r, 'na-gname'), relation: ui.val(r, 'na-rel'), phone: ui.val(r, 'na-phone'), email: ui.val(r, 'na-email'), docBirth: r.querySelector('#na-d1').checked, docReport: r.querySelector('#na-d2').checked, docPhoto: r.querySelector('#na-d3').checked, notes: ui.val(r, 'na-notes') });
        flashId = id;
        ui.toast('Application created', ui.val(r, 'na-name') + ' added to New applications');
      } }]
    });
  }
})();
