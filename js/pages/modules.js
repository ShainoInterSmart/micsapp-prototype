/* ==========================================================================
   Institutional module overviews
   Communication · Extra-curricular · Library · Audit & Risk · Compliance ·
   Policies · Community Relations · Alumni · User Access
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var STAFF = ['head', 'admin'];
  var ALL_STAFF = ['head', 'admin', 'teacher'];

  function head(o) {
    return ui.pageHead({ eyebrow: o.eyebrow, title: o.title, desc: o.desc, actions: o.actions }) + (o.scope ? '<div class="banner neutral mb-4">' + ui.icon('layers') + '<div><strong>Module overview.</strong> ' + o.scope + '</div></div>' : '');
  }
  function stats(list) { return '<div class="grid grid-4 mb-4">' + list.map(function (s) { return MICS.statCard(s[0], s[1], s[2], s[3]); }).join('') + '</div>'; }
  function planned(label, text) { return '<button class="btn" data-demo="' + ui.esc(label) + '" data-demo-text="' + ui.esc(text) + '">' + ui.icon('sparkle') + ui.esc(label) + '</button>'; }

  // ---------- Parent & community communication ----------
  MICS.page('communication', {
    title: 'Parent Communication', roles: STAFF,
    crumbs: function () { return [['People & Community'], ['Parent Communication']]; },
    render: function (el) {
      var db = MICS.state.db;
      var appts = db.appointments;
      el.innerHTML = head({ eyebrow: 'Parent & Community Communication', title: 'Parent Communication', desc: 'Announcements, parent appointment requests and communication history across email, SMS and the parent portal.',
        actions: '<button class="btn btn-primary" id="cm-new">' + ui.icon('plus') + 'New announcement</button>' }) +
        stats([['Parents with portal access', '361', 'users'], ['Announcements this term', db.announcements.length, 'message', 'gold'], ['Appointment requests', appts.filter(function (a) { return a.status === 'Requested'; }).length + ' pending', 'calendar', 'danger'], ['SMS sent this term', '1,284', 'send', 'success']]) +
        '<div class="grid-12">' + ui.card({ cls: 'col-6', title: 'Announcements', bodyCls: 'flush', body: '<div class="list">' + db.announcements.map(function (a) { return '<div class="list-item" style="align-items:flex-start"><span class="li-icon gold">' + ui.icon('message') + '</span><div class="li-main"><div class="li-title">' + ui.esc(a.title) + '</div><div class="li-sub">' + ui.esc(a.body) + '</div><div class="text-xs faint mt-1">' + ui.date(a.date) + ' · ' + ui.esc(a.audience) + ' · ' + ui.esc(sel.emp(a.authorId).shortName) + '</div></div></div>'; }).join('') + '</div>' }) +
        ui.card({ cls: 'col-6', title: 'Parent appointment requests', sub: 'Requests submitted through the parent portal', bodyCls: 'flush', body: '<div class="list">' + appts.map(function (a) { var s = sel.student(a.studentId); var p = sel.parent(s.guardianId); return '<div class="list-item">' + ui.dateBlock(a.date) + '<div class="li-main"><div class="li-title">' + ui.esc(p.name) + ' → ' + ui.esc(sel.emp(a.staffId).shortName) + '</div><div class="li-sub">Re: ' + ui.esc(s.name) + ' · ' + a.slot + ' · ' + ui.esc(a.mode) + ' · ' + ui.esc(a.reason) + '</div></div>' + (a.status === 'Requested' ? '<button class="btn btn-sm btn-success" data-confirm-appt="' + a.id + '">Confirm</button>' : ui.status(a.status)) + '</div>'; }).join('') + '</div>' }) + '</div>';
      el.querySelectorAll('[data-confirm-appt]').forEach(function (b) { b.onclick = function () {
        var a = appts.find(function (x) { return x.id === b.getAttribute('data-confirm-appt'); });
        MICS.state.update(function () { a.status = 'Confirmed'; MICS.state.notify({ title: 'Appointment confirmed', text: sel.emp(a.staffId).shortName + ' · ' + ui.date(a.date) + ' ' + a.slot, link: '#/parent/appointments', icon: 'calendar', roles: ['parent'] }); }, { module: 'Parent Communication', text: 'Appointment ' + a.id + ' confirmed with ' + sel.emp(a.staffId).shortName, link: '#/communication' });
        ui.toast('Appointment confirmed', 'The parent has been notified (simulated).');
      }; });
      el.querySelector('#cm-new').onclick = function () {
        ui.modal({ title: 'New announcement', icon: 'message', sub: 'Published to the parent portal; email/SMS delivery simulated',
          body: '<div class="form-grid">' + ui.field({ id: 'an-title', label: 'Title', required: true, full: true }) + ui.field({ id: 'an-aud', label: 'Audience', type: 'select', options: ['All', 'Parents', 'Parents & students', 'Staff'], value: 'Parents' }) + ui.field({ id: 'an-ch', label: 'Channels', type: 'select', options: ['Portal + email', 'Portal + email + SMS', 'Portal only'], value: 'Portal + email' }) + ui.field({ id: 'an-body', label: 'Message', type: 'textarea', required: true, full: true }) + '</div>',
          actions: [{ label: 'Cancel' }, { label: 'Publish', cls: 'btn-primary', onClick: function (api) {
            if (!ui.validate(api.el, { 'an-title': ui.required('Title'), 'an-body': ui.required('Message') })) return false;
            var t = ui.val(api.el, 'an-title');
            MICS.state.update(function (db) { db.announcements.unshift({ id: 'AN-' + (32 + db.announcements.length), date: db.meta.today, title: t, body: ui.val(api.el, 'an-body'), audience: ui.val(api.el, 'an-aud'), authorId: MICS.auth.user().empId }); MICS.state.notify({ title: 'New announcement', text: t, link: '#/parent', icon: 'message', roles: ['parent'] }); }, { module: 'Parent Communication', text: 'Announcement published: ' + t, link: '#/communication' });
            ui.toast('Announcement published', t);
          } }] });
      };
    }
  });

  // ---------- Extra-curricular ----------
  MICS.page('activities', {
    title: 'Extra-Curricular Activities', roles: ALL_STAFF,
    crumbs: function () { return [['Academics'], ['Extra-Curricular']]; },
    render: function (el) {
      var db = MICS.state.db;
      var members = function (c) { return db.students.filter(function (s) { return s.clubs.indexOf(c.id) > -1; }).length; };
      var part = db.students.filter(function (s) { return s.clubs.length; }).length;
      el.innerHTML = head({ eyebrow: 'Extra-Curricular Activities', title: 'Clubs, Sports & Activities', desc: 'Co-curricular programmes supporting the Student Wellbeing & Holistic Development pillar.', actions: planned('Record session attendance', 'Club session registers, house points and CAS hours tracking are part of the full Extra-Curricular module.'),
        scope: 'Membership, participation and upcoming fixtures. Session registers and house points are planned for the full build.' }) +
        stats([['Clubs & teams', db.clubs.length, 'trophy'], ['Students participating', part, 'users', 'success'], ['Participation rate', Math.round(part / db.students.length * 100) + '%', 'target', 'gold'], ['Next fixture', 'Sports Festival · 28 Nov', 'calendar']]) +
        '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Clubs & societies', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Club</th><th>Category</th><th>Patron</th><th>Meets</th><th class="num">Members</th></tr></thead><tbody>' + db.clubs.map(function (c) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(c.name) + '</td><td><span class="tag">' + c.category + '</span></td><td>' + ui.esc(sel.emp(c.patronId).shortName) + '</td><td>' + c.day + '</td><td class="num">' + members(c) + '</td></tr>'; }).join('') + '</tbody></table>' }) +
        ui.card({ cls: 'col-4', title: 'Participation by category', body: (function () { var cat = {}; db.clubs.forEach(function (c) { cat[c.category] = (cat[c.category] || 0) + members(c); }); return charts.hbars(Object.keys(cat).map(function (k) { return { label: k, value: cat[k] }; }), { valueLabel: 'Members' }); })() + '<div class="banner navy mt-4">' + ui.icon('target') + '<div>Strategic target: 85% of students in at least one activity.</div></div>' }) + '</div>';
    }
  });

  // ---------- Library ----------
  MICS.page('library', {
    title: 'Library Management', roles: ALL_STAFF,
    crumbs: function () { return [['Academics'], ['Library']]; },
    render: function (el) {
      var L = MICS.state.db.library;
      var overdue = L.loans.filter(function (l) { return l.status === 'Overdue'; }).length;
      el.innerHTML = head({ eyebrow: 'Library Management', title: 'Library', desc: 'Catalogue, loans and e-resources for students and staff.', actions: planned('Search catalogue', 'A full OPAC catalogue search with reservations and barcode circulation is part of the Library module build.'),
        scope: 'Loans and catalogue statistics. Barcode circulation and the e-library integration are planned capabilities.' }) +
        stats([['Catalogue titles', ui.num(L.titles), 'library'], ['E-books & resources', ui.num(L.ebooks), 'layers', 'gold'], ['Items on loan', L.onLoan, 'book', 'success'], ['Overdue (sample)', overdue, 'clock', 'danger']]) +
        ui.card({ title: 'Recent loans', sub: 'Sample of current circulation', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Title</th><th>Borrower</th><th>Due</th><th class="num">Renewals</th><th>Status</th><th></th></tr></thead><tbody>' + L.loans.map(function (l) { var s = sel.student(l.studentId); return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(l.title) + '<div class="text-xs muted mono">' + l.id + '</div></td><td>' + ui.esc(s.name) + '<div class="text-xs muted">' + ui.esc(sel.cls(s.classId).name) + '</div></td><td class="nowrap">' + ui.date(l.due) + '</td><td class="num">' + l.renewals + '</td><td>' + ui.status(l.status) + '</td><td class="right">' + (l.renewals < 3 ? '<button class="btn btn-sm" data-renew="' + l.id + '">Renew 14 days</button>' : '<span class="text-xs muted">Renewal limit</span>') + '</td></tr>'; }).join('') + '</tbody></table>' });
      el.querySelectorAll('[data-renew]').forEach(function (b) { b.onclick = function () { MICS.actions.renewLoan(b.getAttribute('data-renew')); ui.toast('Loan renewed', 'New due date in 14 days'); }; });
    }
  });

  // ---------- Internal Audit & Risk ----------
  MICS.page('audit', {
    title: 'Internal Audit & Risk', roles: STAFF,
    crumbs: function () { return [['Governance & Compliance'], ['Audit & Risk']]; },
    render: function (el) {
      var db = MICS.state.db;
      var score = function (r) { var m = { Low: 1, Medium: 2, High: 3 }; return m[r.likelihood] * m[r.impact]; };
      el.innerHTML = head({ eyebrow: 'Internal Audit & Risk Management', title: 'Audit & Risk', desc: 'Institutional risk register and internal audit programme, reported to the Finance & Audit Committee.', actions: planned('Add risk', 'Risk capture with scoring, owners, controls and review reminders is part of the full Audit & Risk module.'),
        scope: 'Risk register and audit tracking. Control testing workflows are planned for the full build.' }) +
        stats([['Risks on register', db.risks.length, 'shield'], ['High-rated risks', db.risks.filter(function (r) { return score(r) >= 6; }).length, 'alert', 'danger'], ['Open audit findings', db.audits.filter(function (a) { return a.status !== 'Closed'; }).reduce(function (s, a) { return s + a.findings; }, 0), 'clipboard', 'gold'], ['Next committee', ui.date('2026-11-19'), 'calendar']]) +
        '<div class="grid-12">' + ui.card({ cls: 'col-8', title: 'Risk register', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Risk</th><th>Category</th><th>Likelihood</th><th>Impact</th><th class="num">Score</th><th>Owner</th><th>Status</th></tr></thead><tbody>' + db.risks.slice().sort(function (a, b) { return score(b) - score(a); }).map(function (r) { var s = score(r); return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.risk) + '<div class="text-xs muted">' + r.id + ' · review ' + ui.dateShort(r.review) + '</div></td><td>' + r.category + '</td><td>' + r.likelihood + '</td><td>' + r.impact + '</td><td class="num"><span class="badge ' + (s >= 6 ? 'danger' : s >= 4 ? 'warning' : 'neutral') + '">' + s + '</span></td><td>' + ui.esc(sel.emp(r.ownerId).shortName) + '</td><td>' + ui.status(r.status) + '</td></tr>'; }).join('') + '</tbody></table>' }) +
        ui.card({ cls: 'col-4', title: 'Internal audits', bodyCls: 'flush', body: '<div class="list">' + db.audits.map(function (a) { return '<div class="list-item"><span class="li-icon navy">' + ui.icon('clipboard') + '</span><div class="li-main"><div class="li-title">' + ui.esc(a.area) + '</div><div class="li-sub">' + a.id + ' · ' + a.findings + ' findings' + (a.high ? ' (' + a.high + ' high)' : '') + ' · due ' + ui.dateShort(a.due) + '</div></div>' + ui.status(a.status) + '</div>'; }).join('') + '</div>', foot: '<span class="muted">Internal Auditor: ' + ui.esc(sel.emp('EMP-0023').shortName) + '</span>' }) + '</div>';
    }
  });

  // ---------- Regulatory compliance ----------
  MICS.page('compliance', {
    title: 'Compliance & Accreditation', roles: STAFF,
    crumbs: function () { return [['Governance & Compliance'], ['Compliance & Accreditation']]; },
    render: function (el) {
      var db = MICS.state.db;
      el.innerHTML = head({ eyebrow: 'Regulatory Compliance & Accreditation', title: 'Compliance & Accreditation', desc: 'Statutory, regulatory and accreditation obligations across GES/NaSIA, Cambridge, IB and national agencies. Items shown are illustrative.', actions: planned('Upload evidence', 'Evidence repositories, renewal reminders and accreditation self-study workspaces are part of the full Compliance module.'),
        scope: 'Obligations register with due dates. Evidence management and automated reminders are planned capabilities.' }) +
        stats([['Obligations tracked', db.compliance.length, 'badge-check'], ['On track', db.compliance.filter(function (c) { return c.status === 'On track'; }).length, 'check-circle', 'success'], ['Due within 30 days', db.compliance.filter(function (c) { return ui.daysBetween(db.meta.today, c.due) <= 30 && ui.daysBetween(db.meta.today, c.due) >= 0; }).length, 'clock', 'gold'], ['Action required', db.compliance.filter(function (c) { return c.status === 'Action required'; }).length, 'alert', 'danger']]) +
        ui.card({ title: 'Compliance register', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Obligation</th><th>Authority</th><th>Owner</th><th>Due</th><th class="num">Days</th><th>Status</th></tr></thead><tbody>' + db.compliance.slice().sort(function (a, b) { return a.due.localeCompare(b.due); }).map(function (c) { var d = ui.daysBetween(db.meta.today, c.due); return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(c.item) + '</td><td>' + ui.esc(c.authority) + '</td><td>' + ui.esc(sel.emp(c.ownerId).shortName) + '</td><td class="nowrap">' + ui.date(c.due) + '</td><td class="num ' + (d <= 30 ? 'c-warning strong' : '') + '">' + d + '</td><td>' + ui.status(c.status) + '</td></tr>'; }).join('') + '</tbody></table>' });
    }
  });

  // ---------- Policies ----------
  MICS.page('policies', {
    title: 'Policies & Procedures', roles: ALL_STAFF,
    crumbs: function () { return [['Governance & Compliance'], ['Policies & Procedures']]; },
    render: function (el) {
      var db = MICS.state.db;
      el.innerHTML = head({ eyebrow: 'School Policies & Procedures', title: 'Policies & Procedures', desc: 'Central policy library with version control, review cycles and staff acknowledgement tracking.', actions: planned('Upload new version', 'Version-controlled policy documents with approval routing are part of the full Policies module.') }) +
        stats([['Policies', db.policies.length, 'file-text'], ['Current', db.policies.filter(function (p) { return p.status === 'Current'; }).length, 'check-circle', 'success'], ['Review due / overdue', db.policies.filter(function (p) { return p.status !== 'Current'; }).length, 'clock', 'danger'], ['Staff acknowledgement', Math.round(db.policies.reduce(function (a, p) { return a + p.acks; }, 0) / (db.policies.length * 80) * 100) + '%', 'users', 'gold']]) +
        ui.card({ title: 'Policy library', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Policy</th><th>Owner</th><th>Version</th><th>Next review</th><th style="width:180px">Staff acknowledgement</th><th>Status</th><th></th></tr></thead><tbody>' + db.policies.map(function (p) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(p.name) + '<div class="text-xs muted">' + p.id + ' · reviewed ' + ui.date(p.reviewed) + '</div></td><td>' + ui.esc(sel.emp(p.owner).shortName) + '</td><td class="mono">' + p.version + '</td><td class="nowrap">' + ui.date(p.nextReview) + '</td><td><div class="flex items-center gap-2"><div style="width:90px">' + ui.progress(p.acks / 80 * 100) + '</div><span class="text-sm num">' + p.acks + '/80</span></div></td><td>' + ui.status(p.status) + '</td><td class="right">' + (p.ackedByMe ? ui.badge('Acknowledged', 'success') : '<button class="btn btn-sm" data-ack="' + p.id + '">Acknowledge</button>') + '</td></tr>'; }).join('') + '</tbody></table>' });
      el.querySelectorAll('[data-ack]').forEach(function (b) { b.onclick = function () { var p = sel.get('policies', b.getAttribute('data-ack')); ui.confirm({ title: 'Acknowledge policy?', sub: p.name + ' · ' + p.version, text: 'I confirm I have read and understood this policy.', confirmLabel: 'Acknowledge', icon: 'check-circle', tone: 'success', btnCls: 'btn-primary' }).then(function (r) { if (r.ok) { MICS.actions.acknowledgePolicy(p.id); ui.toast('Policy acknowledged', p.name); } }); }; });
    }
  });

  // ---------- Community relations ----------
  MICS.page('community', {
    title: 'Community Relations', roles: STAFF,
    crumbs: function () { return [['People & Community'], ['Community Relations']]; },
    render: function (el) {
      var db = MICS.state.db, c = db.community;
      el.innerHTML = head({ eyebrow: 'Community Relations & Social Impact', title: 'Community Relations', desc: 'Outreach projects, partnerships and volunteering, including IB CAS service, with the communities of Gomoa Manso and the Central Region.', actions: planned('Log volunteer hours', 'Volunteer hour logging, impact reporting and partner management are part of the full Community Relations module.'),
        scope: 'Project portfolio and impact summary. Volunteer logging and impact reporting are planned capabilities.' }) +
        stats([['Active projects', c.filter(function (p) { return p.status === 'Active'; }).length, 'heart'], ['Student volunteers', c.reduce(function (a, p) { return a + p.volunteers; }, 0), 'users', 'success'], ['Volunteer hours', c.reduce(function (a, p) { return a + p.hours; }, 0), 'clock', 'gold'], ['Beneficiaries reached', ui.num(c.reduce(function (a, p) { return a + p.beneficiaries; }, 0)), 'target']]) +
        ui.card({ title: 'Projects & partnerships', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Project</th><th>Partner</th><th>Type</th><th class="num">Volunteers</th><th class="num">Hours</th><th class="num">Beneficiaries</th><th>Status</th></tr></thead><tbody>' + c.map(function (p) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(p.name) + '</td><td>' + ui.esc(p.partner) + '</td><td><span class="tag">' + p.type + '</span></td><td class="num">' + p.volunteers + '</td><td class="num">' + p.hours + '</td><td class="num">' + (p.beneficiaries || '—') + '</td><td>' + ui.status(p.status) + '</td></tr>'; }).join('') + '</tbody></table>' });
    }
  });

  // ---------- Alumni ----------
  MICS.page('alumni', {
    title: 'Alumni Management', roles: STAFF,
    crumbs: function () { return [['People & Community'], ['Alumni']]; },
    render: function (el) {
      var a = MICS.state.db.alumni;
      el.innerHTML = head({ eyebrow: 'Alumni Management', title: 'Alumni', desc: 'Alumni records, university destinations and engagement as mentors, speakers and donors. Records are fictional.', actions: planned('Send alumni newsletter', 'Alumni newsletters, event invitations and giving campaigns are part of the full Alumni module.'),
        scope: 'Alumni directory sample and engagement summary. Self-service alumni portal and giving campaigns are planned capabilities.' }) +
        stats([['Alumni on record', '1,146', 'graduation'], ['Engaged this year', '87', 'users', 'success'], ['Active mentors', a.filter(function (x) { return x.engaged === 'Mentor'; }).length + 21, 'heart', 'gold'], ['University placement (2026)', '94%', 'target']]) +
        ui.card({ title: 'Alumni directory (sample)', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Name</th><th class="num">Class of</th><th>Programme</th><th>Destination</th><th>Location</th><th>Engagement</th></tr></thead><tbody>' + a.map(function (x) { return '<tr><td>' + ui.person(x.name, x.id) + '</td><td class="num">' + x.cls + '</td><td>' + x.programme + '</td><td>' + ui.esc(x.destination) + '</td><td>' + x.location + '</td><td>' + (x.engaged !== '—' ? ui.badge(x.engaged, 'navy') : '<span class="muted">—</span>') + '</td></tr>'; }).join('') + '</tbody></table>' });
    }
  });

  // ---------- User access ----------
  MICS.page('access', {
    title: 'User Access & Authorisation', roles: STAFF,
    crumbs: function () { return [['System'], ['User Access & Authorisation']]; },
    render: function (el) {
      var db = MICS.state.db, pm = db.permissionMatrix;
      el.innerHTML = head({ eyebrow: 'User Access & Authorisation', title: 'User Access & Authorisation', desc: 'Role-based access control across all modules. Permissions determine what each role can view, edit and approve, including confidential records.', actions: planned('Invite user', 'User provisioning with single sign-on (Google Workspace / Microsoft 365) and MFA enforcement is part of the full build.') }) +
        stats([['User accounts', ui.num(db.roles.reduce(function (a, r) { return a + r.users; }, 0)), 'users'], ['Roles', db.roles.length, 'key', 'gold'], ['MFA enforced', 'Staff roles', 'shield', 'success'], ['Blocked sign-ins (7d)', 1, 'lock', 'danger']]) +
        '<section class="card mb-4"><div class="card-head"><div><div class="card-title">Permission matrix</div><div class="card-sub">Click a cell to cycle the permission level. Simulated: changes are saved locally only.</div></div><div class="flex gap-2 wrap">' + ['full', 'approve', 'view', 'own', 'none'].map(function (p) { return '<span class="perm ' + p + '" style="cursor:default">' + permLabel(p) + '</span>'; }).join('') + '</div></div>' +
        '<div class="table-wrap mt-3"><table class="table compact"><thead><tr><th>Role</th>' + pm.modules.map(function (m) { return '<th class="center">' + ui.esc(m) + '</th>'; }).join('') + '</tr></thead><tbody>' + db.roles.map(function (r) { return '<tr><td><div class="strong" style="color:var(--text)">' + ui.esc(r.name) + '</div><div class="text-xs muted">' + r.users + ' users</div></td>' + pm.grants[r.id].map(function (g, i) { return '<td class="center"><button class="perm ' + g + '" data-perm="' + r.id + '" data-i="' + i + '" title="' + ui.esc(r.name + ' · ' + pm.modules[i]) + '">' + permLabel(g) + '</button></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></section>' +
        '<div class="grid-12">' + ui.card({ cls: 'col-7', title: 'Roles', bodyCls: 'flush', body: '<table class="table"><thead><tr><th>Role</th><th class="num">Users</th><th>Scope</th></tr></thead><tbody>' + db.roles.map(function (r) { return '<tr><td class="strong" style="color:var(--text)">' + ui.esc(r.name) + '</td><td class="num">' + r.users + '</td><td class="text-sm">' + ui.esc(r.scope) + '</td></tr>'; }).join('') + '</tbody></table>' }) +
        ui.card({ cls: 'col-5', title: 'Access log', sub: 'Recent security events', bodyCls: 'flush', body: '<div class="list">' + db.accessLog.map(function (l) { return '<div class="list-item"><span class="li-icon ' + (l.result === 'Success' ? 'success' : 'danger') + '">' + ui.icon(l.result === 'Success' ? 'check' : 'lock') + '</span><div class="li-main"><div class="li-title">' + ui.esc(l.user) + '</div><div class="li-sub">' + ui.esc(l.action) + ' · ' + l.ip + '</div></div><div class="li-meta">' + ui.rel(l.time) + '<span>' + ui.esc(l.result) + '</span></div></div>'; }).join('') + '</div>' }) + '</div>';
      el.querySelectorAll('[data-perm]').forEach(function (b) { b.onclick = function () { MICS.actions.togglePermission(b.getAttribute('data-perm'), +b.getAttribute('data-i')); ui.toast('Permission updated (simulated)', 'Saved locally for this demonstration'); }; });
    }
  });
  function permLabel(p) { return { full: 'Full', approve: 'Approve', view: 'View', own: 'Own only', none: 'None' }[p]; }
})();
