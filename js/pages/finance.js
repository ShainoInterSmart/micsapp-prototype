/* ==========================================================================
   Finance & Budgeting  (QuickBooks read-only integration — simulated)
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel, charts = MICS.charts;
  var TABS = [{ id: 'overview', label: 'Overview' }, { id: 'fees', label: 'Fees & invoices' }, { id: 'verification', label: 'Payment verification' }, { id: 'budgets', label: 'Budgets & cost centres' }];
  var ff = { q: '', status: '', prog: '' };
  var lastSync = '07:30';

  MICS.page('finance', {
    title: 'Finance & Budgeting', roles: ['head', 'admin'],
    navKey: function (p) { return 'finance/' + (p[0] || 'overview'); },
    crumbs: function (p) { var t = TABS.find(function (x) { return x.id === (p[0] || 'overview'); }) || TABS[0]; return [['Finance & Budgeting', '#/finance/overview'], [t.label]]; },
    render: function (el, params) {
      var tab = params[0] || 'overview';
      var f = sel.finance();
      el.innerHTML = ui.pageHead({ eyebrow: 'Finance & Budgeting · FY 2026/27', title: 'Finance', desc: 'Fee billing, parent payment verification and budget monitoring. QuickBooks remains the accounting system of record; MICSAPP reads from it and never replaces reconciliation.',
        actions: '<button class="btn" id="fin-export">' + ui.icon('download') + 'Export</button>' }) +
        '<div class="banner navy mb-4" style="align-items:center">' + ui.icon('link') + '<div class="grow"><strong>QuickBooks Read-Only Integration — Simulated for Prototype.</strong> Last sync today at ' + lastSync + '. ' + f.qbPending + ' verified payment' + (f.qbPending === 1 ? '' : 's') + ' (' + ui.money(f.qbPendingAmount) + ') not yet recorded in QuickBooks.</div><button class="btn btn-sm" id="qb-sync">' + ui.icon('refresh') + 'Refresh from QuickBooks</button></div>' +
        ui.tabs(TABS.map(function (t) { return { id: t.id, label: t.label, count: t.id === 'verification' ? f.pendingCount : null }; }), tab, 'data-ftab') + '<div class="mt-6" id="fin-body"></div>';
      var body = el.querySelector('#fin-body');
      ({ overview: overview, fees: fees, verification: verification, budgets: budgets }[tab] || overview)(body, f);
      el.querySelectorAll('[data-ftab]').forEach(function (b) { b.onclick = function () { location.hash = '#/finance/' + b.getAttribute('data-ftab'); }; });
      el.querySelector('#qb-sync').onclick = function (e) {
        var btn = e.currentTarget; btn.classList.add('loading');
        setTimeout(function () { var n = MICS.actions.simulateQbSync(); var d = new Date(); lastSync = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); ui.toast('QuickBooks sync complete (simulated)', n ? n + ' payment(s) now shown as recorded in QuickBooks' : 'No new records found'); }, 900);
      };
      el.querySelector('#fin-export').onclick = function () {
        var db = MICS.state.db;
        ui.downloadCSV('micsapp-invoices-term1.csv', ['Invoice', 'Student ID', 'Student', 'Programme', 'Amount', 'Paid', 'Balance', 'Status'], db.invoices.map(function (i) { var s = sel.student(i.studentId); return [i.id, s.id, s.name, sel.prog(s.programmeId).short, i.amount, i.paid, sel.balance(i), sel.invoiceStatus(i).label]; }));
      };
    }
  });

  function overview(body, f) {
    var db = MICS.state.db;
    var byProg = db.programmes.map(function (p) {
      var inv = db.invoices.filter(function (i) { return sel.student(i.studentId).programmeId === p.id; });
      return { p: p, invoiced: inv.reduce(function (a, i) { return a + i.amount; }, 0), collected: inv.reduce(function (a, i) { return a + i.paid; }, 0) };
    });
    var months = ['2026-08', '2026-09', '2026-10', '2026-11'];
    var monthly = months.map(function (m) { return db.payments.filter(function (p) { return p.verification === 'Verified' && p.date.slice(0, 7) === m; }).reduce(function (a, p) { return a + p.amount; }, 0); });
    var verified = db.payments.filter(function (p) { return p.verification === 'Verified'; });
    var qbRec = verified.filter(function (p) { return p.qb === 'Recorded'; });
    body.innerHTML = '<div class="kpi-grid four">' +
      ui.kpi({ label: 'Total invoiced', icon: 'receipt', value: ui.moneyShort(f.invoiced), foot: 'Term 1 · ' + db.invoices.length + ' invoices' }) +
      ui.kpi({ label: 'Payments recorded', icon: 'check-circle', tone: 'success', value: ui.moneyShort(f.collected), foot: verified.length + ' verified payments' }) +
      ui.kpi({ label: 'Outstanding balances', icon: 'wallet', tone: 'danger', value: ui.moneyShort(f.outstanding), foot: f.debtors + ' accounts · incl. arrears', href: '#/finance/fees' }) +
      ui.kpi({ label: 'Collection rate', icon: 'target', tone: 'gold', value: f.rate.toFixed(1) + '<span class="unit">%</span>', foot: 'Target 92% · ' + (92 - f.rate).toFixed(1) + ' pts gap' }) + '</div>' +
      '<div class="grid-12 mt-4">' + ui.card({ cls: 'col-8', title: 'Invoiced vs collected by programme', sub: 'Term 1 · GHS', body: '<div class="mb-3">' + charts.legend([{ label: 'Invoiced', color: 'var(--seq-2)' }, { label: 'Collected', color: 'var(--chart-1)' }]) + '</div><div id="fin-prog"></div>' }) +
      ui.card({ cls: 'col-4', title: 'Reconciliation status', sub: 'Local verification vs QuickBooks', body:
        '<div class="flex-col gap-3" style="display:flex">' + recRow('Verified in MICSAPP', verified.length, 'check-circle', 'success') + recRow('Recorded in QuickBooks', qbRec.length, 'database', 'navy') + recRow('Pending QuickBooks sync', verified.length - qbRec.length, 'clock', 'warning') + recRow('Awaiting finance verification', f.pendingCount, 'inbox', 'info') + '</div>' +
        '<div class="banner neutral mt-4">' + ui.icon('info') + '<div>Payment verification in MICSAPP confirms a parent’s reference. It is <strong>not</strong> accounting reconciliation, which remains in QuickBooks.</div></div>' }) +
      ui.card({ cls: 'col-6', title: 'Payments received by month', sub: 'Verified payments · GHS', body: '<div id="fin-month"></div>' }) +
      ui.card({ cls: 'col-6', title: 'Budget position', sub: 'YTD actual vs plan', body: charts.bullets(db.budgets.slice(0, 6).map(function (b) { return { label: b.dept, plan: b.plan, actual: b.actual, committed: b.committed }; })), foot: '<span class="muted">All values illustrative</span><a class="card-link" href="#/finance/budgets">All cost centres ' + ui.icon('arrow-right') + '</a>' }) + '</div>';
    charts.bars(body.querySelector('#fin-prog'), { labels: byProg.map(function (x) { return x.p.short; }), series: [{ name: 'Invoiced', color: 'var(--seq-2)', values: byProg.map(function (x) { return x.invoiced; }) }, { name: 'Collected', color: 'var(--chart-1)', values: byProg.map(function (x) { return x.collected; }) }], height: 230, format: ui.money, tickFormat: function (v) { return v >= 1e6 ? (v / 1e6) + 'm' : (v / 1e3) + 'k'; } });
    charts.bars(body.querySelector('#fin-month'), { labels: ['Aug', 'Sep', 'Oct', 'Nov (MTD)'], series: [{ name: 'Payments', color: 'var(--chart-1)', values: monthly }], height: 210, format: ui.money, tickFormat: function (v) { return v >= 1e6 ? (v / 1e6) + 'm' : (v / 1e3) + 'k'; } });
  }
  function recRow(k, v, icon, tone) { return '<div class="flex items-center gap-3"><span class="li-icon ' + tone + '">' + ui.icon(icon) + '</span><span class="grow text-sm">' + k + '</span><strong class="num">' + v + '</strong></div>'; }

  function fees(body) {
    var db = MICS.state.db;
    var rows = db.invoices.filter(function (i) {
      var s = sel.student(i.studentId);
      if (ff.q && (s.name + i.id + s.id).toLowerCase().indexOf(ff.q.toLowerCase()) < 0) return false;
      if (ff.status && sel.invoiceStatus(i).label !== ff.status) return false;
      if (ff.prog && s.programmeId !== ff.prog) return false;
      return true;
    });
    body.innerHTML = '<section class="card"><div class="toolbar"><div class="search-input">' + ui.icon('search') + '<input type="search" id="fe-q" placeholder="Student, ID or invoice…" value="' + ui.esc(ff.q) + '"></div>' +
      '<select class="select" id="fe-st"><option value="">All statuses</option>' + ['Paid', 'Part-paid', 'Overdue'].map(function (s) { return '<option' + (ff.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' +
      '<select class="select" id="fe-pg"><option value="">All programmes</option>' + db.programmes.map(function (p) { return '<option value="' + p.id + '"' + (ff.prog === p.id ? ' selected' : '') + '>' + p.short + '</option>'; }).join('') + '</select><div class="grow"></div><span class="text-sm muted">Balance total: <strong class="text-2">' + ui.money(rows.reduce(function (a, i) { return a + sel.balance(i); }, 0)) + '</strong></span></div><div id="fe-table"></div></section>';
    ui.table(body.querySelector('#fe-table'), { rows: rows, pageSize: 12, noun: 'invoices', sortKey: 'bal', dir: -1, onRow: function (i) { location.hash = '#/students/' + i.studentId + '?tab=fees'; },
      cols: [
        { key: 'id', label: 'Invoice', render: function (i) { return '<span class="mono">' + i.id + '</span>'; } },
        { key: 'student', label: 'Student', sort: function (i) { return sel.student(i.studentId).last; }, render: function (i) { var s = sel.student(i.studentId); return ui.person(s.name, sel.cls(s.classId).name); } },
        { key: 'amount', label: 'Billed', num: true, render: function (i) { return ui.money(i.amount + (i.arrears || 0)); } },
        { key: 'paid', label: 'Paid', num: true, render: function (i) { return ui.money(i.paid); } },
        { key: 'bal', label: 'Balance', num: true, sort: function (i) { return sel.balance(i); }, render: function (i) { var b = sel.balance(i); return '<span class="' + (b > 0 ? 'strong' : 'muted') + '" style="' + (b > 0 ? 'color:var(--text)' : '') + '">' + ui.money(b) + '</span>'; } },
        { key: 'pending', label: 'Pending proof', sortable: false, render: function (i) { var p = sel.pendingPaymentsFor(i.studentId); return p.length ? ui.badge(ui.moneyShort(p.reduce(function (a, x) { return a + x.amount; }, 0)), 'info') : ''; } },
        { key: 'status', label: 'Status', sort: function (i) { return sel.invoiceStatus(i).label; }, render: function (i) { var s = sel.invoiceStatus(i); return ui.status(s.label, s.tone); } }
      ] });
    var t; var q = body.querySelector('#fe-q');
    q.oninput = function () { clearTimeout(t); t = setTimeout(function () { ff.q = q.value; MICS.router.render({ keepScroll: true }); var n = document.getElementById('fe-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 220); };
    body.querySelector('#fe-st').onchange = function (e) { ff.status = e.target.value; MICS.router.render({ keepScroll: true }); };
    body.querySelector('#fe-pg').onchange = function (e) { ff.prog = e.target.value; MICS.router.render({ keepScroll: true }); };
  }

  function verification(body) {
    var db = MICS.state.db;
    var pending = db.payments.filter(function (p) { return p.verification === 'Pending'; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var recent = db.payments.filter(function (p) { return p.source === 'Parent portal' && p.verification !== 'Pending'; });
    body.innerHTML = '<div class="grid-12"><section class="card col-8"><div class="card-head"><div><div class="card-title">Verification queue</div><div class="card-sub">Payment references and proofs submitted by parents</div></div><span class="badge warning">' + pending.length + ' pending</span></div><div id="pv-table" class="mt-3"></div></section>' +
      ui.card({ cls: 'col-4', title: 'How verification works', body: '<div class="timeline">' + [['Parent submits reference / proof', 'Via the parent portal'], ['Finance reviews against bank statement', 'Bank or mobile money record checked'], ['Verified or rejected in MICSAPP', 'Parent notified; balance updated locally'], ['Recorded in QuickBooks', 'Shown separately — the accounting system of record']].map(function (s, i) { return '<div class="tl-item ' + (i < 3 ? 'done' : 'current') + '"><span class="tl-dot"></span><div class="tl-title">' + s[0] + '</div><div class="tl-sub">' + s[1] + '</div></div>'; }).join('') + '</div><div class="banner warning mt-4">' + ui.icon('info') + '<div>No online payment gateway is used. Parents pay by bank or mobile money and submit the reference.</div></div>' }) +
      ui.card({ cls: 'col-12', title: 'Recently processed portal submissions', bodyCls: 'flush', body: recent.length ? '<table class="table"><thead><tr><th>Reference</th><th>Student</th><th class="num">Amount</th><th>Verification</th><th>QuickBooks</th><th>Note</th></tr></thead><tbody>' + recent.map(function (p) { return '<tr><td class="mono">' + ui.esc(p.reference) + '</td><td>' + ui.esc(sel.student(p.studentId).name) + '</td><td class="num">' + ui.money(p.amount) + '</td><td>' + ui.status(p.verification) + '</td><td>' + ui.status(p.qb) + '</td><td class="text-sm muted">' + ui.esc(p.verifyNote || '') + '</td></tr>'; }).join('') + '</tbody></table>' : ui.empty('No processed submissions yet', 'Verified and rejected submissions will appear here with their QuickBooks status.', 'receipt') }) + '</div>';
    ui.table(body.querySelector('#pv-table'), { rows: pending, paginate: false, onRow: function (p) { openPayment(p.id); }, emptyTitle: 'Queue is clear', emptyText: 'All parent submissions have been processed.',
      cols: [
        { key: 'student', label: 'Student', sort: function (p) { return sel.student(p.studentId).name; }, render: function (p) { var s = sel.student(p.studentId); return ui.person(s.name, sel.cls(s.classId).name); } },
        { key: 'reference', label: 'Reference', render: function (p) { return '<span class="mono">' + ui.esc(p.reference) + '</span><div class="text-xs muted">' + ui.esc(p.method) + '</div>'; } },
        { key: 'date', label: 'Paid on', render: function (p) { return '<span class="nowrap">' + ui.date(p.date) + '</span>'; } },
        { key: 'amount', label: 'Amount', num: true, render: function (p) { return ui.money(p.amount); } },
        { key: 'a', label: '', sortable: false, render: function (p) { return '<button class="btn btn-sm" data-pv="' + p.id + '">Review</button>'; } }
      ], bind: function (t) { t.querySelectorAll('[data-pv]').forEach(function (b) { b.onclick = function () { openPayment(b.getAttribute('data-pv')); }; }); } });
  }

  function openPayment(id) {
    var dr = ui.drawer({ title: '' });
    function draw() {
      var p = sel.get('payments', id), s = sel.student(p.studentId), inv = sel.get('invoices', p.invoiceId), par = sel.parent(s.guardianId);
      var body = '<div class="drawer-section"><div class="dl-grid">' + kv('Amount', ui.money(p.amount)) + kv('Method', p.method) + kv('Paid on', ui.date(p.date)) + kv('Reference', p.reference) + kv('Submitted by', par ? par.name : '—') + kv('Source', p.source) + '</div></div>' +
        '<div class="drawer-section"><h4>Proof of payment</h4><div class="file-drop" style="cursor:default;display:flex;align-items:center;gap:12px;text-align:left"><span class="li-icon navy">' + ui.icon('file-text') + '</span><div class="grow"><div class="strong" style="color:var(--text)">' + ui.esc(p.proof || 'No file attached') + '</div><div class="text-xs muted">Uploaded via parent portal · preview not available in prototype</div></div></div></div>' +
        '<div class="drawer-section"><h4>Invoice ' + inv.id + '</h4><table class="table compact"><tbody><tr><td>Student</td><td class="num"><a href="#/students/' + s.id + '?tab=fees">' + ui.esc(s.name) + '</a></td></tr><tr><td>Billed (incl. arrears)</td><td class="num">' + ui.money(inv.amount + (inv.arrears || 0)) + '</td></tr><tr><td>Verified payments</td><td class="num">' + ui.money(inv.paid) + '</td></tr><tr><td class="strong">Balance before this payment</td><td class="num strong">' + ui.money(sel.balance(inv) + (p.verification === 'Verified' ? p.amount : 0)) + '</td></tr></tbody></table></div>' +
        '<div class="drawer-section"><h4>Status</h4><div class="grid grid-2"><div class="card" style="box-shadow:none"><div class="card-body tight"><div class="text-xs muted">MICSAPP verification</div><div class="mt-1">' + ui.status(p.verification) + '</div></div></div><div class="card" style="box-shadow:none"><div class="card-body tight"><div class="text-xs muted">QuickBooks (system of record)</div><div class="mt-1">' + ui.status(p.qb) + '</div></div></div></div>' +
        (p.verification === 'Verified' ? '<div class="banner warning mt-3">' + ui.icon('info') + '<div>Verified locally. Final accounting recognition happens once the receipt is recorded in QuickBooks (simulated read-only sync).</div></div>' : '') + (p.verifyNote ? '<div class="tl-note mt-3">' + ui.esc(p.verifyNote) + '</div>' : '') + '</div>';
      var foot = p.verification === 'Pending' ? '<button class="btn btn-danger" data-rej>' + ui.icon('x') + 'Reject</button><button class="btn btn-success" data-ver>' + ui.icon('check') + 'Verify payment</button>' : '<button class="btn btn-primary" data-close-dr>Close</button>';
      dr.render({ title: 'Payment ' + p.reference, sub: ui.esc(s.name) + ' · ' + ui.status(p.verification), lead: '<span class="li-icon navy" style="width:40px;height:40px">' + ui.icon('receipt') + '</span>', body: body, foot: foot,
        bind: function (root) {
          root.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { dr.close(); }); });
          var c = root.querySelector('[data-close-dr]'); if (c) c.onclick = dr.close;
          var v = root.querySelector('[data-ver]');
          if (v) v.onclick = function () { ui.confirm({ title: 'Verify this payment?', sub: ui.money(p.amount) + ' · ' + p.reference, text: 'Confirm the reference matches the bank / mobile money statement. The parent’s balance will update in MICSAPP; QuickBooks recording is shown separately as <strong>Pending sync</strong>.', reason: true, reasonLabel: 'Verification note', confirmLabel: 'Verify payment', btnCls: 'btn-success', tone: 'success' }).then(function (r) { if (!r.ok) return; MICS.actions.verifyPayment(id, 'Verified', r.reason); ui.toast('Payment verified', s.name + ' · QuickBooks: pending sync'); draw(); }); };
          var rj = root.querySelector('[data-rej]');
          if (rj) rj.onclick = function () { ui.confirm({ title: 'Reject this submission?', sub: p.reference, text: 'The parent will be asked to check the reference and resubmit (simulated notification).', reason: true, reasonRequired: true, reasonLabel: 'Reason', reasonPlaceholder: 'e.g. Reference not found on statement dated ' + ui.date(p.date), confirmLabel: 'Reject', tone: 'danger' }).then(function (r) { if (!r.ok) return; MICS.actions.verifyPayment(id, 'Rejected', r.reason); ui.toast('Submission rejected', s.name, 'info'); draw(); }); };
        } });
    }
    draw();
  }

  function budgets(body) {
    var db = MICS.state.db, f = sel.finance();
    body.innerHTML = '<div class="grid grid-4 mb-4">' + MICS.statCard('Annual budget', ui.moneyShort(f.budget), 'wallet') + MICS.statCard('YTD plan', ui.moneyShort(f.plan), 'target') + MICS.statCard('YTD actual', ui.moneyShort(f.actual), 'activity', f.actual > f.plan ? 'danger' : 'success') + MICS.statCard('Committed', ui.moneyShort(f.committed), 'clock', 'gold') + '</div>' +
      '<section class="card mb-4"><div class="card-head"><div><div class="card-title">Cost-centre summary</div><div class="card-sub">FY 2026/27 · YTD plan phased at ' + Math.round(db.meta.ytdPhase * 100) + '% · source: QuickBooks (simulated)</div></div></div><div id="bg-table" class="mt-3"></div></section>' +
      ui.card({ title: 'Budget vs actual by department', action: charts.legend([{ label: 'Actual', color: 'var(--chart-1)' }, { label: 'Committed', color: 'var(--seq-2)' }, { label: 'YTD plan', color: 'var(--text)' }]), body: '<div class="grid grid-2" style="column-gap:32px">' + charts.bullets(db.budgets.slice(0, 5).map(bl)) + charts.bullets(db.budgets.slice(5).map(bl)) + '</div>' });
    ui.table(body.querySelector('#bg-table'), { rows: db.budgets, paginate: false,
      cols: [
        { key: 'dept', label: 'Cost centre', render: function (b) { return '<div class="strong" style="color:var(--text)">' + ui.esc(b.dept) + '</div><div class="text-xs muted">' + b.id + ' · ' + ui.esc(sel.emp(b.owner).shortName) + '</div>'; } },
        { key: 'budget', label: 'Annual budget', num: true, render: function (b) { return ui.money(b.budget); } },
        { key: 'plan', label: 'YTD plan', num: true, render: function (b) { return ui.money(b.plan); } },
        { key: 'actual', label: 'YTD actual', num: true, render: function (b) { return ui.money(b.actual); } },
        { key: 'committed', label: 'Committed', num: true, render: function (b) { return ui.money(b.committed); } },
        { key: 'var', label: 'Variance', num: true, sort: function (b) { return (b.actual - b.plan) / b.plan; }, render: function (b) { var v = (b.actual - b.plan) / b.plan * 100; return '<span class="strong ' + (v > 5 ? 'c-danger' : v > 0 ? 'c-warning' : 'c-success') + '">' + (v > 0 ? '+' : '') + v.toFixed(1) + '%</span>'; } },
        { key: 'util', label: 'Annual utilisation', sort: function (b) { return (b.actual + b.committed) / b.budget; }, render: function (b) { var u = (b.actual + b.committed) / b.budget * 100; return '<div class="flex items-center gap-2"><div style="width:80px">' + ui.progress(u, u > 35 ? 'warning' : '') + '</div><span class="num text-sm">' + u.toFixed(0) + '%</span></div>'; } }
      ] });
  }
  function bl(b) { return { label: b.dept, plan: b.plan, actual: b.actual, committed: b.committed }; }
  function kv(k, v) { return '<div><div class="k">' + ui.esc(k) + '</div><div class="v">' + ui.esc(v) + '</div></div>'; }
})();
