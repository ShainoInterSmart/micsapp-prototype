/* ==========================================================================
   Unified approvals inbox + shared approval drawer
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel;
  var view = { status: 'Pending', cat: 'All', q: '' };

  /** Shared approval detail drawer (used by dashboard, inbox, notifications). */
  MICS.openApproval = function (id) {
    var dr = ui.drawer({ title: '', wide: false });
    function draw() {
      var a = sel.get('approvals', id); if (!a) { dr.close(); return; }
      var req = sel.emp(a.requesterId);
      var body = '';
      body += '<div class="drawer-section"><div class="dl-grid">' +
        kv('Requested by', req ? req.shortName : '—') + kv('Department', a.department) + kv('Submitted', ui.date(a.submitted)) +
        (a.amount ? kv('Amount', ui.money(a.amount)) : kv('Priority', a.priority)) +
        (a.costCentre ? kv('Cost centre', sel.get('budgets', a.costCentre).dept) : kv('Category', a.category)) +
        (a.costCentre ? kv('Budget headroom', ui.moneyShort(headroom(a.costCentre))) : kv('Reference', a.id)) + '</div></div>';

      if (a.ref && a.ref.kind === 'admission') {
        var adm = sel.get('admissions', a.ref.id);
        body += '<div class="drawer-section"><h4>Applicant</h4><div class="card" style="box-shadow:none"><div class="card-body tight">' +
          '<div class="flex items-center gap-3">' + ui.avatar(adm.name, 'lg') + '<div class="grow"><div class="strong" style="font-size:15px">' + ui.esc(adm.name) + '</div><div class="text-sm muted">' + ui.esc(adm.gender) + ' · born ' + ui.date(adm.dob) + ' · ' + ui.esc(adm.previousSchool) + '</div></div></div>' +
          '<div class="dl-grid mt-4">' + kv('Programme', sel.prog(adm.programmeId).name) + kv('Entry class', sel.cls(adm.targetClass).name) + kv('Entry', adm.entry) + kv('Boarding', adm.boarding ? 'Boarder' : 'Day student') + kv('Guardian', adm.guardian.name) + kv('Source', adm.source) + '</div>' +
          '<div class="mt-4 score-meter"><span class="sm-val">' + (adm.score != null ? adm.score + '%' : '—') + '</span><div class="grow"><div class="text-sm strong">Entrance assessment & interview</div>' + ui.progress(adm.score || 0, adm.score >= 70 ? 'success' : adm.score >= 55 ? 'gold' : 'danger') + '<div class="text-xs muted mt-1">Admission benchmark: 55% · class capacity ' + sel.classStudents(adm.targetClass).length + '/' + sel.cls(adm.targetClass).capacity + '</div></div></div>' +
          (adm.notes ? '<div class="tl-note mt-3">' + ui.esc(adm.notes) + '</div>' : '') +
          '<div class="mt-3"><a class="card-link" href="#/admissions/' + adm.id + '">Open full application ' + ui.icon('arrow-right') + '</a></div></div></div></div>';
        body += '<div class="drawer-section"><h4>Documents</h4><div class="doc-list">' + adm.docs.map(function (d) { return '<div class="doc-row ' + (d.ok ? 'ok' : 'missing') + '">' + ui.icon(d.ok ? 'check-circle' : 'alert') + '<span class="grow">' + ui.esc(d.name) + '</span><span class="text-xs muted">' + (d.ok ? 'Received' : 'Outstanding') + '</span></div>'; }).join('') + '</div></div>';
      } else if (a.ref && a.ref.kind === 'leave') {
        var lv = sel.get('leaves', a.ref.id); var e = sel.emp(lv.empId);
        body += '<div class="drawer-section"><h4>Leave request</h4><div class="card" style="box-shadow:none"><div class="card-body tight">' + ui.person(e.name, e.role + ' · ' + e.department, '') +
          '<div class="dl-grid mt-4">' + kv('Leave type', lv.type) + kv('Dates', ui.dateShort(lv.from) + ' – ' + ui.date(lv.to)) + kv('Working days', lv.days) + kv('Balance remaining', e.leaveBalance + ' days') + kv('Contract', e.contract) + kv('Status', lv.status) + '</div>' +
          '<div class="tl-note mt-3">' + ui.esc(lv.reason) + '</div>' +
          (e.type === 'Teaching' ? '<div class="banner warning mt-3">' + ui.icon('info') + '<div>Cover required: ' + ((e.subjects || []).join(', ') || 'lessons') + '. Deputy Head (Academics) will arrange substitute teaching on approval.</div></div>' : '') + '</div></div></div>';
      } else {
        body += '<div class="drawer-section"><h4>Request details</h4><p class="text-md" style="line-height:1.6;color:var(--text-2)">' + ui.esc(a.details || a.subtitle) + '</p>' +
          (a.ref && a.ref.kind === 'maintenance' ? '<div class="mt-3"><a class="card-link" href="#/operations/facilities?req=' + a.ref.id + '">Linked maintenance request ' + a.ref.id + ' ' + ui.icon('arrow-right') + '</a></div>' : '') +
          (a.costCentre ? '<div class="banner neutral mt-4">' + ui.icon('wallet') + '<div>Cost centre <strong>' + ui.esc(sel.get('budgets', a.costCentre).dept) + '</strong>: annual budget ' + ui.money(sel.get('budgets', a.costCentre).budget) + ', YTD actual ' + ui.money(sel.get('budgets', a.costCentre).actual) + ', committed ' + ui.money(sel.get('budgets', a.costCentre).committed) + '. Approval will add this request to commitments (simulated).</div></div>' : '') + '</div>';
      }

      body += '<div class="drawer-section"><h4>History</h4><div class="timeline">' + a.history.map(function (h, i) {
        var last = i === a.history.length - 1;
        return '<div class="tl-item ' + (h.title === 'Rejected' ? 'danger' : last && a.status === 'Pending' ? 'current' : 'done') + '"><span class="tl-dot"></span><div class="tl-title">' + ui.esc(h.title) + '</div><div class="tl-sub">' + ui.esc(h.by || '') + ' · ' + ui.date(h.date) + '</div>' + (h.note ? '<div class="tl-note">' + ui.esc(h.note) + '</div>' : '') + '</div>';
      }).join('') + (a.status === 'Pending' ? '<div class="tl-item"><span class="tl-dot"></span><div class="tl-title muted">Awaiting decision</div><div class="tl-sub">' + ui.esc(MICS.auth.user().name) + '</div></div>' : '') + '</div></div>';

      var foot = a.status === 'Pending'
        ? '<button class="btn btn-ghost left" data-review>' + ui.icon('check') + 'Mark as reviewed</button><button class="btn btn-danger" data-reject>' + ui.icon('x') + 'Reject</button><button class="btn btn-success" data-approve>' + ui.icon('check') + 'Approve</button>'
        : '<span class="left">' + ui.status(a.status) + ' <span class="text-sm muted">by ' + ui.esc(a.decidedBy || '—') + ' · ' + ui.date(a.decidedOn) + '</span></span><button class="btn btn-primary" data-close-dr>Close</button>';

      dr.render({ title: a.title, sub: '<span class="mono">' + a.id + '</span>' + ui.status(a.status) + ui.priority(a.priority) + '<span class="tag">' + ui.esc(a.category) + '</span>', body: body, foot: foot,
        lead: '<span class="li-icon navy" style="width:40px;height:40px">' + ui.icon(MICS.catIcon(a.category)) + '</span>',
        bind: function (root) {
          ui.bindLinks(root);
          root.querySelectorAll('a[href^="#/"]').forEach(function (l) { l.addEventListener('click', function () { dr.close(); }); });
          var c = root.querySelector('[data-close-dr]'); if (c) c.onclick = dr.close;
          var ap = root.querySelector('[data-approve]');
          if (ap) ap.onclick = function () {
            ui.confirm({ title: 'Approve this request?', sub: a.title, text: approveText(a), reason: true, reasonLabel: 'Decision note', confirmLabel: 'Approve', btnCls: 'btn-success', tone: 'success', icon: 'check-circle' }).then(function (r) {
              if (!r.ok) return; MICS.actions.decideApproval(id, 'Approved', r.reason); ui.toast('Request approved', a.title); draw();
            });
          };
          var rj = root.querySelector('[data-reject]');
          if (rj) rj.onclick = function () {
            ui.confirm({ title: 'Reject this request?', sub: a.title, text: 'The requester will be notified with your reason. This decision is recorded in the audit trail.', reason: true, reasonRequired: true, reasonLabel: 'Reason for rejection', confirmLabel: 'Reject request', tone: 'danger', icon: 'x-circle' }).then(function (r) {
              if (!r.ok) return; MICS.actions.decideApproval(id, 'Rejected', r.reason); ui.toast('Request rejected', a.title, 'info'); draw();
            });
          };
          var rv = root.querySelector('[data-review]');
          if (rv) rv.onclick = function () {
            ui.confirm({ title: 'Mark as reviewed?', sub: a.title, text: 'The request will be marked as reviewed and returned to the department for follow-up without a final decision.', reason: true, reasonLabel: 'Comment for the department', confirmLabel: 'Mark reviewed', icon: 'check', tone: '' }).then(function (r) {
              if (!r.ok) return; MICS.actions.decideApproval(id, 'Reviewed', r.reason); ui.toast('Marked as reviewed', a.title, 'info'); draw();
            });
          };
        } });
    }
    draw();
  };
  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
  function headroom(cc) { var b = sel.get('budgets', cc); return b.budget - b.actual - b.committed; }
  function approveText(a) {
    if (a.category === 'Admissions') return 'The applicant will move to <strong>Approved</strong> in the admissions pipeline and an offer letter will be prepared (simulated). The admissions office can then complete enrolment.';
    if (a.category === 'HR') return 'The leave/contract record will be updated in HRMS and the staff member notified (simulated).';
    return 'The request will be approved and recorded against the relevant cost centre (simulated — no purchase order is issued).';
  }

  MICS.page('approvals', {
    title: 'Approvals Inbox', roles: ['head', 'admin'],
    crumbs: function () { return [['Approvals Inbox']]; },
    render: function (el, params, query) {
      var db = MICS.state.db;
      if (query && query.get('cat')) { view.cat = query.get('cat'); view.status = 'Pending'; }
      var all = db.approvals;
      var cats = ['All', 'Admissions', 'Departmental', 'HR', 'Operational'];
      var counts = {}; cats.forEach(function (c) { counts[c] = all.filter(function (a) { return a.status === 'Pending' && (c === 'All' || a.category === c); }).length; });
      var decided = all.filter(function (a) { return a.status !== 'Pending'; });
      el.innerHTML = ui.pageHead({ title: 'Approvals Inbox', desc: 'One queue for every decision across admissions, departments, HR and operations. Decisions update the originating module and are written to the audit trail.' }) +
        '<div class="grid grid-4 mb-4">' +
          stat('Pending', counts.All, 'inbox') + stat('High priority', all.filter(function (a) { return a.status === 'Pending' && a.priority === 'High'; }).length, 'alert', 'danger') +
          stat('Decided this session', decided.filter(function (a) { return a.decidedOn === db.meta.today; }).length, 'check-circle', 'success') +
          stat('Value pending', ui.moneyShort(all.filter(function (a) { return a.status === 'Pending' && a.amount; }).reduce(function (s, a) { return s + a.amount; }, 0)), 'wallet', 'gold') +
        '</div>' +
        '<section class="card"><div class="toolbar">' +
          '<div class="segmented">' + ['Pending', 'Decided', 'All'].map(function (s) { return '<button class="' + (view.status === s ? 'active' : '') + '" data-st="' + s + '">' + s + '</button>'; }).join('') + '</div>' +
          '<div class="flex gap-2 wrap">' + cats.map(function (c) { return '<button class="filter-chip ' + (view.cat === c ? 'active' : '') + '" data-cat="' + c + '">' + c + ' <span class="count">' + counts[c] + '</span></button>'; }).join('') + '</div>' +
          '<div class="grow"></div><div class="search-input">' + ui.icon('search') + '<input type="search" id="apr-q" placeholder="Search requests…" value="' + ui.esc(view.q) + '"></div>' +
        '</div><div id="apr-table"></div></section>';

      var rows = all.filter(function (a) {
        if (view.status === 'Pending' && a.status !== 'Pending') return false;
        if (view.status === 'Decided' && a.status === 'Pending') return false;
        if (view.cat !== 'All' && a.category !== view.cat) return false;
        if (view.q && (a.title + a.subtitle + a.id).toLowerCase().indexOf(view.q.toLowerCase()) < 0) return false;
        return true;
      });
      ui.table(el.querySelector('#apr-table'), {
        rows: rows, noun: 'requests', pageSize: 12, onRow: function (r) { MICS.openApproval(r.id); },
        emptyTitle: view.status === 'Pending' ? 'Inbox zero' : 'No requests found', emptyText: view.status === 'Pending' ? 'There are no pending requests in this queue.' : 'Try a different filter.',
        cols: [
          { key: 'title', label: 'Request', render: function (a) { return '<div class="flex items-center gap-3"><span class="li-icon navy">' + ui.icon(MICS.catIcon(a.category)) + '</span><div style="min-width:0"><div class="strong" style="color:var(--text)">' + ui.esc(a.title) + '</div><div class="text-xs muted">' + ui.esc(a.id) + ' · ' + ui.esc(a.subtitle) + '</div></div></div>'; } },
          { key: 'category', label: 'Queue', render: function (a) { return '<span class="tag">' + ui.esc(a.category) + '</span>'; } },
          { key: 'requester', label: 'Requested by', sort: function (a) { return sel.emp(a.requesterId).shortName; }, render: function (a) { var e = sel.emp(a.requesterId); return '<div class="text-sm">' + ui.esc(e.shortName) + '</div><div class="text-xs muted">' + ui.esc(a.department) + '</div>'; } },
          { key: 'submitted', label: 'Submitted', render: function (a) { return '<span class="nowrap">' + ui.date(a.submitted) + '</span>'; } },
          { key: 'priority', label: 'Priority', sort: function (a) { return { High: 0, Medium: 1, Low: 2 }[a.priority]; }, render: function (a) { return ui.priority(a.priority); } },
          { key: 'status', label: 'Status', render: function (a) { return ui.status(a.status); } },
          { key: 'act', label: '', sortable: false, render: function (a) { return '<button class="btn btn-sm" data-open="' + a.id + '">' + (a.status === 'Pending' ? 'Review' : 'View') + '</button>'; } }
        ],
        bind: function (t) { t.querySelectorAll('[data-open]').forEach(function (b) { b.onclick = function () { MICS.openApproval(b.getAttribute('data-open')); }; }); }
      });
      el.querySelectorAll('[data-st]').forEach(function (b) { b.onclick = function () { view.status = b.getAttribute('data-st'); MICS.router.render({ keepScroll: true }); }; });
      el.querySelectorAll('[data-cat]').forEach(function (b) { b.onclick = function () { view.cat = b.getAttribute('data-cat'); MICS.router.render({ keepScroll: true }); }; });
      var q = el.querySelector('#apr-q'); var t;
      q.oninput = function () { clearTimeout(t); t = setTimeout(function () { view.q = q.value; MICS.router.render({ keepScroll: true }); var n = document.getElementById('apr-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    }
  });
  function stat(k, v, icon, tone) { return '<div class="card kpi"><div class="kpi-top"><span class="kpi-label"><span class="kpi-icon ' + (tone || '') + '">' + ui.icon(icon) + '</span>' + k + '</span></div><div class="kpi-value">' + v + '</div></div>'; }
  MICS.statCard = stat;
})();
