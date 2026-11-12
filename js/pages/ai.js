/* ==========================================================================
   AI Intelligence Centre — simulated, structured decision support
   Responses are pre-written templates populated from live demo data.
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui, sel = MICS.sel;
  var thread = [];   // session-only conversation
  var busy = false;

  var QUESTIONS = [
    { id: 'strategy', q: 'What is the current progress of the MICS Strategic Plan?', mod: 'Governance · Strategic Plan', keys: ['strateg', 'plan', 'pillar', 'objective'] },
    { id: 'departments', q: 'Which academic departments require attention?', mod: 'Academics · Examinations', keys: ['department', 'subject', 'academic dep', 'teaching'] },
    { id: 'fees', q: 'What is the current fee collection position?', mod: 'Finance · QuickBooks (simulated)', keys: ['fee', 'collect', 'financ', 'receiv', 'debt', 'payment', 'money'] },
    { id: 'students', q: 'Which students may need academic support?', mod: 'Student Information · Attendance', keys: ['student', 'support', 'risk', 'struggl', 'attendance', 'learner'] },
    { id: 'operations', q: 'What are the major operational concerns this month?', mod: 'Operations · Facilities · Kitchen', keys: ['operat', 'maintenance', 'kitchen', 'boarding', 'facilit', 'concern', 'security'] },
    { id: 'appraisals', q: 'Which staff appraisals are pending?', mod: 'HRMS · Appraisals', keys: ['apprais', 'staff', 'hr', 'employee', 'performance review'] }
  ];

  function answer(id) {
    var db = MICS.state.db, m = sel.metrics(), f = m.finance;
    if (id === 'strategy') {
      var sp = sel.strategicProgress(); var overall = sel.overallStrategic();
      var red = []; db.strategicPlan.forEach(function (p) { p.objectives.forEach(function (o) { if (o.rag === 'r') red.push(o.name + ' (' + o.progress + '%)'); }); });
      var lead = sp.slice().sort(function (a, b) { return b.progress - a.progress; })[0], lag = sp.slice().sort(function (a, b) { return a.progress - b.progress; })[0];
      return { title: 'Strategic Plan 2025–2029 — progress briefing',
        summary: 'In Year 2 of 5, the Strategic Plan is <strong>' + overall + '% complete overall</strong>, broadly in line with a 40% mid-Year-2 trajectory. ' + ui.esc(lead.p.pillar) + ' leads at ' + lead.progress + '%, while ' + ui.esc(lag.p.pillar) + ' trails at ' + lag.progress + '%. ' + red.length + ' objectives are rated off-track and need Board attention.',
        metrics: [{ k: 'Overall progress', v: overall + '%', s: 'Year 2 of 5' }, { k: 'Pillars on track', v: sp.filter(function (s) { return s.rag === 'g'; }).length + ' / ' + sp.length, s: 'RAG assessment' }, { k: 'Objectives off-track', v: red.length, s: 'Rated red', tone: 'danger' }, { k: 'Open board actions', v: db.actions.filter(function (a) { return a.status !== 'Completed'; }).length, s: 'Linked to resolutions' }],
        observations: ['Off-track objectives: ' + red.join('; ') + '.', 'Digital transformation (MICSAPP) is at 22% and is a dependency for several reporting objectives across other pillars.', 'Fee collection (Pillar 5) at ' + f.rate.toFixed(1) + '% is below the 92% target and constrains capital projects such as the Science Block refurbishment.'],
        sources: [['Governance · Strategic Plan', '#/strategy'], ['Board action items', '#/governance/actions'], ['Finance overview', '#/finance/overview']],
        actions: ['Request a recovery plan for the Science Block refurbishment ahead of the 3 December Board meeting.', 'Confirm alumni and partnership income targets with the Development lead before Term 2.', 'Table a short Year-2 progress dashboard at the Full Board, using this view as the source.'] };
    }
    if (id === 'departments') {
      var subj = subjectAverages();
      var weak = subj.slice().sort(function (a, b) { return a.avg - b.avg; }).slice(0, 3);
      var ps = sel.programmeStats().sort(function (a, b) { return a.avg - b.avg; });
      return { title: 'Academic departments — areas requiring attention',
        summary: 'Overall attainment is <strong>' + m.avgScore + '%</strong> against a 70% target. The lowest-performing subject areas this mid-term are <strong>' + weak.map(function (w) { return ui.esc(w.subject); }).join(', ') + '</strong>. By programme, ' + ps[0].p.short + ' (' + ps[0].avg + '%) has the most ground to make up, while IBDP remains strongest.',
        metrics: [{ k: 'School average', v: m.avgScore + '%', s: 'Target 70%', tone: m.avgScore < 70 ? 'warning' : '' }, { k: 'Lowest subject', v: weak[0].avg + '%', s: weak[0].subject }, { k: 'Students below 50%', v: db.students.filter(function (s) { return s.avg < 50; }).length, s: 'All programmes', tone: 'danger' }, { k: 'Lowest programme', v: ps[0].avg + '%', s: ps[0].p.short }],
        observations: [weak[0].subject + ' shows the widest spread of results, suggesting differentiated support is needed rather than a whole-class intervention.', 'GES Basic attainment has improved for five consecutive terms, consistent with the 7+1 peer-teaching model introduced in the JHS.', 'Two Sciences classes had practicals suspended this week (MR-0417), which may affect practical assessment scores in SHS 2 Science and IB DP1.'],
        sources: [['Examinations & results', '#/academics/exams'], ['Teaching & learning', '#/academics/classes'], ['Facilities — MR-0417', '#/operations/facilities?req=MR-0417']],
        actions: ['Ask Heads of Department for ' + weak.map(function (w) { return w.subject; }).slice(0, 2).join(' and ') + ' to present targeted support plans at the next academic committee.', 'Prioritise resolution of the Chemistry lab fault to protect practical assessment schedules.', 'Extend the 7+1 model to Cambridge Year 9–10 as per resolution RES-2026-17.'] };
    }
    if (id === 'fees') {
      return { title: 'Fee collection position — Term 1, 2026/27',
        summary: 'Term 1 collections stand at <strong>' + ui.money(f.collected) + ' (' + f.rate.toFixed(1) + '%)</strong> of ' + ui.money(f.invoiced) + ' invoiced, against a 92% target. Outstanding receivables total <strong>' + ui.money(f.outstanding) + '</strong> across ' + f.debtors + ' accounts. A further ' + ui.money(f.pendingAmount) + ' has been submitted by parents and is awaiting finance verification.',
        metrics: [{ k: 'Collection rate', v: f.rate.toFixed(1) + '%', s: 'Target 92%', tone: 'warning' }, { k: 'Outstanding', v: ui.moneyShort(f.outstanding), s: f.debtors + ' accounts', tone: 'danger' }, { k: 'Pending verification', v: ui.moneyShort(f.pendingAmount), s: f.pendingCount + ' submissions' }, { k: 'Fully unpaid (Term 1)', v: ui.moneyShort(f.ageing[2]), s: 'No payment received' }],
        observations: ['Unpaid Term 1 balances account for ' + Math.round(f.ageing[2] / f.outstanding * 100) + '% of receivables; prior-term arrears add ' + ui.money(f.ageing[3]) + '.', 'Verified local payments are separate from QuickBooks records: ' + f.qbPending + ' verified payments are still pending sync to the accounting system of record.', 'Collections are tracking roughly 14 points behind target with five weeks of the term remaining.'],
        sources: [['Finance overview', '#/finance/overview'], ['Payment verification queue', '#/finance/verification'], ['QuickBooks (simulated read-only)', '#/finance/overview']],
        actions: ['Clear the payment verification queue this week to reflect parent payments accurately.', 'Issue reminders to accounts with no Term 1 payment, applying the revised Fee Payment & Arrears Policy.', 'Ask the Bursar to present the receivables recovery plan (ACT-031) at the 19 November Finance & Audit Committee.'] };
    }
    if (id === 'students') {
      var risk = sel.atRisk();
      var att = risk.filter(function (r) { return sel.attPct(r.s) < 85; }).length;
      return { title: 'Students who may need academic support',
        summary: '<strong>' + risk.length + ' students</strong> (' + (risk.length / m.enrolled * 100).toFixed(1) + '% of enrolment) meet one or more early-warning criteria: attendance below 85% or an average below 50%. ' + risk.filter(function (r) { return r.severity === 'High'; }).length + ' are rated high priority. Patterns are indicators for professional follow-up, not judgements about individual learners.',
        metrics: [{ k: 'Flagged students', v: risk.length, s: 'Early-warning criteria', tone: 'warning' }, { k: 'Low attendance', v: att, s: 'Below 85%' }, { k: 'Low attainment', v: risk.filter(function (r) { return r.s.avg < 50; }).length, s: 'Average below 50%' }, { k: 'In 7+1 support', v: db.students.filter(function (s) { return s.support; }).length, s: 'Already enrolled' }],
        observations: ['Highest-priority cases: ' + risk.slice(0, 4).map(function (r) { return r.s.name + ' (' + sel.cls(r.s.classId).name + ')'; }).join(', ') + '.', 'Most attendance-related flags are in JHS and SHS classes; low-attainment flags are spread across programmes.', 'Several flagged students are boarders, so housemasters can support attendance and prep-time follow-up.'],
        sources: [['Student directory — needs attention', '#/students?filter=attention'], ['Attendance', '#/academics/attendance'], ['Examinations & results', '#/academics/exams']],
        actions: ['Form tutors to contact guardians of high-priority students within one week and agree support plans.', 'Enrol eligible students in 7+1 peer-teaching sessions ahead of the mid-term examinations (16–20 Nov).', 'Review progress after mid-term results and report to the Academic Committee.'], links: risk.slice(0, 6) };
    }
    if (id === 'operations') {
      var open = db.maintenance.filter(function (x) { return x.status !== 'Completed'; });
      var crit = open.filter(function (x) { return x.priority === 'Critical' || x.priority === 'High'; });
      var low = db.inventory.filter(function (i) { return i.stock <= i.reorder; });
      return { title: 'Operational concerns — November 2026',
        summary: 'There are <strong>' + open.length + ' open maintenance requests</strong>, ' + crit.length + ' of them high priority or critical. The most significant are the Chemistry lab extractor fault, which has suspended practicals, and the kitchen cold-room temperature alarm. ' + low.length + ' catering items are below reorder level, and boarding occupancy is ' + m.occupancy + '%.',
        metrics: [{ k: 'Open maintenance', v: open.length, s: crit.length + ' high / critical', tone: 'danger' }, { k: 'Unassigned requests', v: open.filter(function (x) { return !x.assignee; }).length, s: 'Need allocation', tone: 'warning' }, { k: 'Low-stock items', v: low.length, s: 'Kitchen inventory' }, { k: 'Boarding occupancy', v: m.occupancy + '%', s: 'Target 90%' }],
        observations: crit.slice(0, 3).map(function (x) { return x.id + ': ' + x.title + ' — ' + x.status + (x.assignee ? ' (' + sel.emp(x.assignee).shortName + ')' : ' (unassigned)') + '.'; }).concat(['Food waste per meal has fallen for four consecutive weeks since portion-control measures began.', 'The fire service safety certificate is due on 30 November; renewal should be scheduled now.']),
        sources: [['Facilities & maintenance', '#/operations/facilities'], ['Kitchen & catering', '#/operations/kitchen'], ['Compliance register', '#/compliance']],
        actions: ['Approve the emergency cold-room compressor repair (pending in the approvals inbox).', 'Assign the Densu House washroom leak (MR-0418) today: boarder safety risk.', 'Raise requisitions for low-stock items before mid-term week.'] };
    }
    if (id === 'appraisals') {
      var pend = db.employees.filter(function (e) { return e.appraisal !== 'Completed'; });
      var byState = {}; pend.forEach(function (e) { byState[e.appraisal] = (byState[e.appraisal] || 0) + 1; });
      var depts = {}; pend.forEach(function (e) { depts[e.department] = (depts[e.department] || 0) + 1; });
      var topDepts = Object.keys(depts).sort(function (a, b) { return depts[b] - depts[a]; }).slice(0, 3);
      return { title: 'Staff appraisals — 2026/27 cycle status',
        summary: '<strong>' + pend.length + ' of ' + db.employees.length + ' staff</strong> have appraisals still in progress (' + m.appraisalsPct + '% complete). The board action to complete manager reviews (ACT-029) is now overdue. Most outstanding reviews are in ' + topDepts.join(', ') + '.',
        metrics: [{ k: 'Completed', v: m.appraisalsPct + '%', s: 'Target 100%', tone: 'warning' }, { k: 'Awaiting manager review', v: byState['Manager review'] || 0, s: 'Line managers' }, { k: 'Self-review submitted', v: byState['Self-review submitted'] || 0, s: 'Awaiting manager' }, { k: 'Not started', v: byState['Not started'] || 0, s: 'Staff action', tone: 'danger' }],
        observations: ['Manager reviews are the bottleneck, so outstanding work sits mainly with Heads of Department rather than individual staff.', 'Training completion is high (safeguarding refreshers completed by most teaching staff), which supports the appraisal evidence base.', 'Appraisal outcomes feed into the Faculty Development pillar of the Strategic Plan.'],
        sources: [['HRMS · Appraisals', '#/hr/appraisals'], ['Board action ACT-029', '#/governance/actions'], ['Strategic Plan — Pillar 3', '#/strategy']],
        actions: ['Set a firm deadline of 27 November for all manager reviews and notify Heads of Department.', 'HR to follow up individually with staff who have not started self-review.', 'Report completion status at the 3 December Board meeting.'] };
    }
  }
  function subjectAverages() {
    var map = {};
    MICS.state.db.students.forEach(function (s, i) {
      if (i % 2) return; // sample for speed
      sel.results(s).forEach(function (r) { var k = r.subject.replace('Core ', '').replace(': AA', '').replace('English A: Lang & Lit', 'English').replace('English Language', 'English'); map[k] = map[k] || { t: 0, n: 0 }; map[k].t += r.latest; map[k].n++; });
    });
    return Object.keys(map).filter(function (k) { return map[k].n > 20; }).map(function (k) { return { subject: k, avg: Math.round(map[k].t / map[k].n * 10) / 10 }; });
  }

  function renderAnswer(a) {
    return '<div class="ai-card"><div class="ai-card-head"><span class="t">' + ui.esc(a.title) + '</span><span class="flex gap-2"><span class="badge gold outline">' + ui.icon('sparkle', 'icon-sm') + 'Simulated response</span></span></div>' +
      '<div class="ai-sec"><h5>Executive summary</h5><p>' + a.summary + '</p></div>' +
      '<div class="ai-sec"><h5>Key metrics</h5><div class="ai-metrics">' + a.metrics.map(function (x) { return '<div class="ai-metric"><div class="k">' + ui.esc(x.k) + '</div><div class="v ' + (x.tone === 'danger' ? 'c-danger' : x.tone === 'warning' ? 'c-warning' : '') + '">' + x.v + '</div><div class="s muted">' + ui.esc(x.s) + '</div></div>'; }).join('') + '</div></div>' +
      '<div class="ai-sec"><h5>Supporting observations</h5><ul class="ai-list">' + a.observations.map(function (o) { return '<li><span class="b"></span><span>' + ui.esc(o) + '</span></li>'; }).join('') + '</ul>' +
        (a.links ? '<div class="flex gap-2 wrap mt-3">' + a.links.map(function (r) { return '<a class="tag link" href="#/students/' + r.s.id + '">' + ui.icon('user', 'icon-sm') + ui.esc(r.s.name) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '<div class="ai-sec"><h5>Suggested management actions</h5><ol class="ai-list">' + a.actions.map(function (o, i) { return '<li><span class="n">' + (i + 1) + '</span><span>' + ui.esc(o) + '</span></li>'; }).join('') + '</ol></div>' +
      '<div class="ai-sec"><h5>Sources</h5><div class="flex gap-2 wrap">' + a.sources.map(function (s) { return '<a class="tag link" href="' + s[1] + '">' + ui.icon('database', 'icon-sm') + ui.esc(s[0]) + '</a>'; }).join('') + '<span class="text-xs muted" style="align-self:center">Data as at ' + ui.date(MICS.state.db.meta.today) + '</span></div></div>' +
      '<div class="ai-disclaimer">' + ui.icon('info') + '<span><strong>Advisory only. This is a simulated response for demonstration.</strong> No live AI model is connected. Insights are drawn from demo records, and decisions remain with school management. Predictive analytics and forecasting are not active in this prototype.</span></div></div>';
  }

  MICS.page('ai', {
    title: 'AI Intelligence Centre', roles: ['head', 'admin'],
    crumbs: function () { return [['AI Intelligence Centre']]; },
    render: function (el) {
      var db = MICS.state.db;
      el.innerHTML = ui.pageHead({ eyebrow: 'Decision support', title: 'AI Intelligence Centre', desc: 'Ask questions about the institution and receive structured, sourced briefings drawn from every MICSAPP module. Responses are advisory and identify their data sources.',
        actions: '<span class="badge gold">' + ui.icon('sparkle', 'icon-sm') + 'Simulated for prototype — no live AI</span>' + (thread.length ? '<button class="btn" id="ai-clear">' + ui.icon('refresh') + 'New conversation</button>' : '') }) +
        '<div class="ai-layout"><section class="card ai-main"><div class="ai-thread" id="ai-thread"></div>' +
        '<div class="ai-composer">' + (thread.length ? '<div class="ai-chips">' + QUESTIONS.map(function (q) { return '<button data-q="' + q.id + '">' + ui.esc(q.q.replace(/^(What is|What are|Which) (the )?/, '').replace('?', '')) + '</button>'; }).join('') + '</div>' : '') +
        '<form id="ai-form"><input class="input" id="ai-input" placeholder="Ask about strategy, academics, finance, operations or staff…" autocomplete="off" aria-label="Ask a question"><button class="btn btn-primary btn-lg" type="submit" aria-label="Send">' + ui.icon('send') + '</button></form>' +
        '<div class="text-xs muted mt-2">Demonstration covers six question areas. Responses are pre-written templates populated from the demo data.</div></div></section>' +
        '<aside class="ai-side flex-col gap-4" style="display:flex">' +
          ui.card({ title: 'Connected data sources', sub: 'Read-only, permission-aware', body: [['Student Information', db.students.length + ' records', 'users'], ['Academics & Examinations', db.allocations.length + ' allocations', 'clipboard'], ['Finance (QuickBooks simulated)', db.invoices.length + ' invoices', 'wallet'], ['School Operations', db.maintenance.length + ' requests', 'building'], ['HRMS', db.employees.length + ' staff', 'id-card'], ['Governance & Strategy', db.actions.length + ' actions', 'landmark']].map(function (s) { return '<div class="source-row"><span class="li-icon navy" style="width:28px;height:28px">' + ui.icon(s[2]) + '</span><span class="src-name">' + s[0] + '</span><span class="text-xs muted">' + s[1] + '</span></div>'; }).join('') }) +
          ui.card({ title: 'Responsible use', body: '<ul class="ai-list"><li><span class="b"></span><span>Advisory insights only. No automated decisions.</span></li><li><span class="b"></span><span>Respects role permissions; confidential medical data is excluded.</span></li><li><span class="b"></span><span>Every response cites its source modules.</span></li><li><span class="b"></span><span>Forecasting and predictive models are future capabilities, not active here.</span></li></ul>' }) +
        '</aside></div>';
      drawThread(el);
      el.querySelector('#ai-form').onsubmit = function (e) {
        e.preventDefault();
        var v = el.querySelector('#ai-input').value.trim(); if (!v || busy) return;
        var match = QUESTIONS.find(function (q) { return q.keys.some(function (k) { return v.toLowerCase().indexOf(k) > -1; }); });
        ask(match ? match.id : null, v);
      };
      el.querySelectorAll('[data-q]').forEach(function (b) { b.onclick = function () { if (!busy) ask(b.getAttribute('data-q')); }; });
      var c = el.querySelector('#ai-clear'); if (c) c.onclick = function () { thread = []; MICS.router.render(); };
    }
  });

  function drawThread(el) {
    var t = el.querySelector('#ai-thread');
    if (!thread.length) {
      t.innerHTML = '<div class="ai-welcome"><div class="ai-mark">' + ui.icon('sparkle') + '</div><h2>How can I help you lead today, ' + ui.esc(MICS.auth.user().short) + '?</h2><p>Choose a suggested question to see a structured management briefing built from live MICSAPP data.</p>' +
        '<div class="ai-suggest">' + QUESTIONS.map(function (q) { return '<button class="ai-q" data-q="' + q.id + '">' + ui.icon('sparkle') + '<span>' + ui.esc(q.q) + '<span class="q-mod">' + ui.esc(q.mod) + '</span></span></button>'; }).join('') + '</div></div>';
      return;
    }
    t.innerHTML = thread.map(function (m) {
      if (m.role === 'user') return '<div class="msg-user">' + ui.esc(m.text) + '</div>';
      if (m.role === 'thinking') return '<div class="msg-ai"><span class="ai-av">' + ui.icon('sparkle') + '</span><div class="ai-thinking">' + m.steps.map(function (s, i) { return '<div class="ai-step ' + (i < m.done ? 'done' : '') + '">' + (i < m.done ? ui.icon('check') : '<span class="spin"></span>') + s + '</div>'; }).slice(0, m.done + 1).join('') + '</div></div>';
      if (m.role === 'fallback') return '<div class="msg-ai"><span class="ai-av">' + ui.icon('sparkle') + '</span><div class="ai-card"><div class="ai-sec"><p>This demonstration answers six management question areas: strategic plan progress, academic departments, fee collection, students needing support, operational concerns and staff appraisals. Please choose one of the suggested questions below.</p></div><div class="ai-disclaimer">' + ui.icon('info') + '<span>In the full system, free-form questions would be answered from permitted data sources, with citations.</span></div></div></div>';
      return '<div class="msg-ai"><span class="ai-av">' + ui.icon('sparkle') + '</span>' + renderAnswer(answer(m.id)) + '</div>';
    }).join('');
    t.querySelectorAll('a[href^="#/"]').forEach(function (a) { a.addEventListener('click', function () { /* navigation keeps thread in memory */ }); });
  }

  function ask(id, text) {
    var q = QUESTIONS.find(function (x) { return x.id === id; });
    thread.push({ role: 'user', text: text || q.q });
    if (!id) { thread.push({ role: 'fallback' }); rerender(true); return; }
    busy = true;
    var steps = ['Interpreting question and checking your access permissions', 'Reading ' + q.mod + ' records', 'Cross-referencing related modules', 'Composing structured briefing'];
    var th = { role: 'thinking', steps: steps, done: 0 };
    thread.push(th);
    rerender(true);
    var i = 0;
    var timer = setInterval(function () {
      i++; th.done = i;
      if (i >= steps.length) {
        clearInterval(timer);
        thread[thread.indexOf(th)] = { role: 'ai', id: id };
        busy = false;
        MICS.state.update(function () {}, { module: 'AI Intelligence Centre', text: 'Briefing generated (simulated): ' + q.q, link: '#/ai' });
        return;
      }
      rerender(false);
    }, 420);
  }
  function rerender(scroll) {
    if (location.hash.indexOf('#/ai') !== 0) return;
    MICS.router.render({ keepScroll: true });
    if (scroll) setTimeout(function () { var t = document.querySelectorAll('.msg-user'); if (t.length) t[t.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  }
})();
