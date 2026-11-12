/* ==========================================================================
   Application shell: sidebar navigation, header, search, notifications
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui;
  var SIDEBAR_KEY = 'micsapp.sidebar';

  function metrics() { return MICS.sel.metrics(); }

  var NAV = {
    staff: [
      { group: 'Overview', items: [
        { key: 'dashboard', label: 'Command Centre', icon: 'grid', href: '#/dashboard' },
        { key: 'approvals', label: 'Approvals Inbox', icon: 'inbox', href: '#/approvals', badge: function () { return metrics().pendingApprovals; } },
        { key: 'ai', label: 'AI Intelligence Centre', icon: 'sparkle', href: '#/ai' },
        { key: 'reports', label: 'Reports & Analytics', icon: 'bar-chart', href: '#/reports' }
      ] },
      { group: 'Academics', items: [
        { key: 'sis', label: 'Student Information', icon: 'users', children: [
          { key: 'students', label: 'Student Directory', href: '#/students' },
          { key: 'admissions', label: 'Admissions', href: '#/admissions', badge: function () { return metrics().pendingAdmissions; } }
        ] },
        { key: 'academics', label: 'Teaching & Learning', icon: 'book', children: [
          { key: 'academics/classes', label: 'Classes & Subjects', href: '#/academics/classes' },
          { key: 'academics/timetable', label: 'Timetable', href: '#/academics/timetable' },
          { key: 'academics/attendance', label: 'Attendance', href: '#/academics/attendance' },
          { key: 'academics/assignments', label: 'Assignments', href: '#/academics/assignments' }
        ] },
        { key: 'academics/exams', label: 'Examinations & Results', icon: 'clipboard', href: '#/academics/exams' },
        { key: 'activities', label: 'Extra-Curricular', icon: 'trophy', href: '#/activities' },
        { key: 'library', label: 'Library', icon: 'library', href: '#/library' }
      ] },
      { group: 'Operations & Finance', items: [
        { key: 'operations', label: 'School Operations', icon: 'building', children: [
          { key: 'operations/overview', label: 'Operations Overview', href: '#/operations/overview' },
          { key: 'operations/boarding', label: 'Boarding', href: '#/operations/boarding' },
          { key: 'operations/kitchen', label: 'Kitchen & Catering', href: '#/operations/kitchen' },
          { key: 'operations/facilities', label: 'Facilities & Maintenance', href: '#/operations/facilities', badge: function () { return metrics().openMaintenance; }, subtle: true },
          { key: 'operations/security', label: 'Security & Reception', href: '#/operations/security' },
          { key: 'operations/infirmary', label: 'Infirmary', href: '#/operations/infirmary' }
        ] },
        { key: 'finance', label: 'Finance & Budgeting', icon: 'wallet', children: [
          { key: 'finance/overview', label: 'Financial Overview', href: '#/finance/overview' },
          { key: 'finance/fees', label: 'Fees & Invoices', href: '#/finance/fees' },
          { key: 'finance/verification', label: 'Payment Verification', href: '#/finance/verification', badge: function () { return metrics().finance.pendingCount; } },
          { key: 'finance/budgets', label: 'Budgets & Cost Centres', href: '#/finance/budgets' }
        ] }
      ] },
      { group: 'People & Community', items: [
        { key: 'hr', label: 'HRMS', icon: 'id-card', children: [
          { key: 'hr/directory', label: 'Employee Directory', href: '#/hr/directory' },
          { key: 'hr/leave', label: 'Leave & Attendance', href: '#/hr/leave' },
          { key: 'hr/appraisals', label: 'Appraisals & Training', href: '#/hr/appraisals' },
          { key: 'hr/payroll', label: 'Payroll Overview', href: '#/hr/payroll' }
        ] },
        { key: 'communication', label: 'Parent Communication', icon: 'message', href: '#/communication' },
        { key: 'community', label: 'Community Relations', icon: 'heart', href: '#/community' },
        { key: 'alumni', label: 'Alumni', icon: 'graduation', href: '#/alumni' }
      ] },
      { group: 'Governance & Compliance', items: [
        { key: 'governance', label: 'Governance & Board', icon: 'landmark', children: [
          { key: 'governance/overview', label: 'Board Overview', href: '#/governance/overview' },
          { key: 'governance/meetings', label: 'Meetings & Resolutions', href: '#/governance/meetings' },
          { key: 'governance/actions', label: 'Action Items', href: '#/governance/actions' }
        ] },
        { key: 'strategy', label: 'Strategic Plan & KPIs', icon: 'target', href: '#/strategy' },
        { key: 'audit', label: 'Audit & Risk', icon: 'shield', href: '#/audit' },
        { key: 'compliance', label: 'Compliance & Accreditation', icon: 'badge-check', href: '#/compliance' },
        { key: 'policies', label: 'Policies & Procedures', icon: 'file-text', href: '#/policies' }
      ] },
      { group: 'System', items: [
        { key: 'access', label: 'User Access & Authorisation', icon: 'key', href: '#/access' }
      ] }
    ],
    teacher: [
      { group: 'My Workspace', items: [
        { key: 'teacher', label: 'Teacher Workspace', icon: 'grid', href: '#/teacher' },
        { key: 'teacher/attendance', label: 'Mark Attendance', icon: 'check-square', href: '#/teacher/attendance', badge: function () { return MICS.pages.teacher.pendingCount(); } },
        { key: 'academics/timetable', label: 'My Timetable', icon: 'calendar', href: '#/academics/timetable' },
        { key: 'academics/assignments', label: 'Assignments', icon: 'file-text', href: '#/academics/assignments' },
        { key: 'academics/exams', label: 'Examinations & Results', icon: 'clipboard', href: '#/academics/exams' },
        { key: 'students', label: 'My Students', icon: 'users', href: '#/students' }
      ] },
      { group: 'School', items: [
        { key: 'activities', label: 'Extra-Curricular', icon: 'trophy', href: '#/activities' },
        { key: 'library', label: 'Library', icon: 'library', href: '#/library' },
        { key: 'policies', label: 'Policies & Procedures', icon: 'file-text', href: '#/policies' }
      ] }
    ],
    parent: [
      { group: 'Parent Portal', items: [
        { key: 'parent', label: 'Family Overview', icon: 'home', href: '#/parent' },
        { key: 'parent/academics', label: 'Academic Progress', icon: 'book', href: '#/parent/academics' },
        { key: 'parent/fees', label: 'Fees & Payments', icon: 'wallet', href: '#/parent/fees' },
        { key: 'parent/appointments', label: 'Appointments', icon: 'calendar', href: '#/parent/appointments' }
      ] }
    ]
  };

  var activeKey = null;
  var openGroups = {};

  function navFor(role) { return role === 'teacher' ? NAV.teacher : role === 'parent' ? NAV.parent : NAV.staff; }

  function renderSidebar() {
    var user = MICS.auth.user(); if (!user) return;
    var nav = navFor(user.role);
    var html = '';
    nav.forEach(function (g) {
      html += '<div class="nav-group"><div class="nav-group-label">' + ui.esc(g.group) + '</div>';
      g.items.forEach(function (it) {
        if (it.children) {
          var hasActive = it.children.some(function (c) { return c.key === activeKey; });
          var open = openGroups[it.key] != null ? openGroups[it.key] : hasActive;
          html += '<button class="nav-parent ' + (hasActive ? 'has-active' : '') + '" aria-expanded="' + open + '" data-group="' + it.key + '" title="' + ui.esc(it.label) + '">' + ui.icon(it.icon) + '<span class="nav-label">' + ui.esc(it.label) + '</span>' + ui.icon('chevron-right', 'chev') + '</button>';
          html += '<div class="nav-children">' + it.children.map(function (c) { return navItem(c); }).join('') + '</div>';
        } else html += navItem(it);
      });
      html += '</div>';
    });
    var el = document.getElementById('sidebar-nav');
    el.innerHTML = html;
    el.querySelectorAll('[data-group]').forEach(function (b) {
      b.onclick = function () {
        var app = document.getElementById('app');
        var collapsed = app.classList.contains('collapsed') || (window.innerWidth <= 1280 && window.innerWidth > 768 && !app.classList.contains('expanded-force'));
        if (collapsed) {
          var g = navFor(user.role).reduce(function (a, gr) { return a.concat(gr.items); }, []).find(function (x) { return x.key === b.getAttribute('data-group'); });
          location.hash = g.children[0].href; return;
        }
        var k = b.getAttribute('data-group');
        openGroups[k] = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', openGroups[k]);
      };
    });
    el.querySelectorAll('.nav-item').forEach(function (a) {
      a.addEventListener('click', function () { document.getElementById('app').classList.remove('mobile-open', 'expanded-force'); });
    });
  }
  function navItem(it) {
    var b = it.badge ? it.badge() : 0;
    return '<a class="nav-item ' + (it.key === activeKey ? 'active' : '') + '" href="' + it.href + '" title="' + ui.esc(it.label) + '"' + (it.key === activeKey ? ' aria-current="page"' : '') + '>' + (it.icon ? ui.icon(it.icon) : '') + '<span class="nav-label">' + ui.esc(it.label) + '</span>' + (b ? '<span class="nav-badge ' + (it.subtle ? 'subtle' : '') + '">' + b + '</span>' : '') + '</a>';
  }

  // ---------- Header ----------
  function renderHeaderUser() {
    var u = MICS.auth.user(); if (!u) return;
    document.getElementById('profile-btn').innerHTML = ui.avatar(u.name) + '<span class="header-profile-text"><span class="p-name" style="display:block">' + ui.esc(u.name) + '</span><span class="p-role" style="display:block">' + ui.esc(u.roleLabel) + '</span></span>' + ui.icon('chevron-down', 'icon-sm');
    var unread = notificationsFor(u.role).filter(function (n) { return !n.read; }).length;
    document.getElementById('notif-btn').innerHTML = ui.icon('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '');
    document.getElementById('notif-btn').setAttribute('aria-label', 'Notifications (' + unread + ' unread)');
    document.getElementById('year-select').style.display = u.role === 'parent' ? 'none' : '';
  }
  function notificationsFor(role) { return MICS.state.db.notifications.filter(function (n) { return n.roles.indexOf(role) > -1; }); }

  function setHeader(title, crumbs, navKey) {
    activeKey = navKey;
    var u = MICS.auth.user();
    var bc = '<a href="' + (u ? u.landing : '#/') + '" aria-label="Home">' + ui.icon('home', 'icon-sm') + '</a>';
    (crumbs || []).forEach(function (c, i) {
      bc += '<span class="sep">/</span>' + (c[1] && i < crumbs.length - 1 ? '<a href="' + c[1] + '">' + ui.esc(c[0]) + '</a>' : '<span class="' + (i === crumbs.length - 1 ? 'current' : '') + '">' + ui.esc(c[0]) + '</span>');
    });
    document.getElementById('breadcrumb').innerHTML = bc;
    renderSidebar();
    renderHeaderUser();
  }

  // ---------- Notifications panel ----------
  function openNotifications(btn) {
    var u = MICS.auth.user();
    var list = notificationsFor(u.role);
    var unread = list.filter(function (n) { return !n.read; }).length;
    ui.popover(btn, '<div class="notif-head"><div><div class="strong">Notifications</div><div class="text-sm muted">' + unread + ' unread</div></div><button class="btn btn-ghost btn-sm" data-allread ' + (unread ? '' : 'disabled') + '>Mark all as read</button></div>' +
      '<div class="notif-list">' + (list.length ? list.map(function (n) {
        return '<div class="notif ' + (n.read ? '' : 'unread') + '" data-n="' + n.id + '" role="button" tabindex="0"><span class="li-icon ' + (n.read ? '' : 'navy') + '">' + ui.icon(n.icon || 'bell') + '</span><div style="min-width:0"><div class="notif-title">' + ui.esc(n.title) + '</div><div class="notif-text">' + ui.esc(n.text) + '</div><div class="notif-time">' + ui.rel(n.time) + '</div></div></div>';
      }).join('') : ui.empty('You’re all caught up', 'New alerts and approvals will appear here.', 'bell')) + '</div>', {
      cls: 'notif-panel',
      bind: function (p) {
        var all = p.querySelector('[data-allread]');
        if (all) all.onclick = function () { MICS.actions.markAllRead(u.role); ui.closePopover(); ui.toast('All notifications marked as read'); };
        p.querySelectorAll('[data-n]').forEach(function (el) {
          function go() {
            var n = MICS.state.db.notifications.find(function (x) { return x.id === el.getAttribute('data-n'); });
            ui.closePopover();
            if (n && !n.read) MICS.actions.markNotification(n.id);
            if (n && n.link) MICS.router.go(n.link);
          }
          el.onclick = go; el.onkeydown = function (e) { if (e.key === 'Enter') go(); };
        });
      }
    });
  }

  // ---------- Profile menu ----------
  function openProfile(btn) {
    var u = MICS.auth.user();
    ui.popover(btn, '<div style="padding:10px 10px 8px"><div class="person">' + ui.avatar(u.name) + '<div><div class="person-name">' + ui.esc(u.name) + '</div><div class="person-sub">' + ui.esc(u.email) + '</div></div></div></div><div class="menu-sep"></div>' +
      '<div class="menu-label">Switch demo role</div>' + MICS.auth.users.map(function (x) {
        return '<button class="menu-item ' + (x.role === u.role ? 'active' : '') + '" data-role="' + x.role + '">' + ui.icon(x.role === 'parent' ? 'home' : x.role === 'teacher' ? 'book' : x.role === 'admin' ? 'briefcase' : 'landmark') + '<span>' + ui.esc(x.roleLabel) + '<span class="muted" style="display:block;font-size:11.5px">' + ui.esc(x.name) + '</span></span>' + (x.role === u.role ? '<span class="menu-check">' + ui.icon('check', 'icon-sm') + '</span>' : '') + '</button>';
      }).join('') + '<div class="menu-sep"></div>' +
      '<button class="menu-item" data-walk>' + ui.icon('play') + 'Demo walkthrough (7 min)</button>' +
      '<button class="menu-item" data-reset>' + ui.icon('refresh') + 'Reset demo data</button>' +
      '<div class="menu-sep"></div><button class="menu-item danger" data-logout>' + ui.icon('log-out') + 'Sign out</button>', {
      cls: '', bind: function (p) {
        p.style.minWidth = '280px';
        p.querySelectorAll('[data-role]').forEach(function (b) {
          b.onclick = function () {
            var role = b.getAttribute('data-role'); ui.closePopover();
            if (role === u.role) return;
            var nu = MICS.auth.switchRole(role);
            ui.toast('Switched to ' + nu.roleLabel, 'Now viewing as ' + nu.name);
            openGroups = {};
            location.hash = nu.landing;
            MICS.router.render();
          };
        });
        p.querySelector('[data-reset]').onclick = function () {
          ui.closePopover();
          ui.confirm({ title: 'Reset demo data?', text: 'All changes made during this demonstration (approvals, enrolments, attendance, payments, maintenance updates) will be discarded and the original sample data restored.', confirmLabel: 'Reset data', tone: 'danger', icon: 'refresh' }).then(function (r) {
            if (!r.ok) return;
            MICS.state.reset();
            ui.toast('Demo data reset', 'Sample data restored to its original state.');
            MICS.router.render();
          });
        };
        p.querySelector('[data-walk]').onclick = function () { ui.closePopover(); walkthrough(); };
        p.querySelector('[data-logout]').onclick = function () { ui.closePopover(); MICS.auth.logout(); location.hash = '#/login'; MICS.router.render(); };
      }
    });
  }

  function walkthrough() {
    var steps = [
      ['Sign in as Head of School', 'Use the demo account card on the login page.', '#/dashboard'],
      ['Management Command Centre', 'Executive KPIs, academic and financial position, strategic plan and pending actions in one view.', '#/dashboard'],
      ['Academic performance & student records', 'Open a student flagged for attention and review the integrated profile.', '#/students'],
      ['Approve an admission', 'Open an application in Assessment, approve it and watch the dashboard counters update.', '#/admissions'],
      ['School operations & maintenance', 'Assign and complete a maintenance request; see alerts update.', '#/operations/facilities'],
      ['AI Intelligence Centre', 'Ask a suggested question for a structured, sourced management briefing (simulated).', '#/ai'],
      ['Switch to the Parent Portal', 'Profile menu → Switch demo role → Parent. Toggle between the two children.', '#/parent'],
      ['Governance & reporting', 'Strategic Plan 2025–2029 progress, board actions and institutional reports.', '#/governance/overview']
    ];
    ui.modal({
      title: 'Recommended 7-minute demonstration', icon: 'play', tone: 'gold', size: 'lg',
      sub: 'A guided journey showing how departments work within one integrated system.',
      body: '<div class="timeline">' + steps.map(function (s, i) { return '<div class="tl-item"><span class="tl-dot"></span><div class="tl-title">' + (i + 1) + '. ' + ui.esc(s[0]) + '</div><div class="tl-sub">' + ui.esc(s[1]) + ' <a href="' + s[2] + '" data-walk-go>Open</a></div></div>'; }).join('') + '</div>',
      actions: [{ label: 'Close', cls: 'btn-primary' }],
      onOpen: function (el, api) { el.querySelectorAll('[data-walk-go]').forEach(function (a) { a.addEventListener('click', function () { api.close(); }); }); }
    });
  }
  MICS.walkthrough = walkthrough;

  // ---------- Global search ----------
  var focusIdx = -1;
  function searchIndex(q) {
    var u = MICS.auth.user();
    var db = MICS.state.db, sel = MICS.sel;
    q = q.toLowerCase();
    var groups = [];
    function m(s) { return s && String(s).toLowerCase().indexOf(q) > -1; }
    var studentsPool = db.students;
    if (u.role === 'parent') studentsPool = sel.childrenOf(u.parentId);
    if (u.role === 'teacher') { var cls = sel.teacherClasses(u.empId).map(function (c) { return c.cls.id; }); studentsPool = db.students.filter(function (s) { return cls.indexOf(s.classId) > -1; }); }
    var st = studentsPool.filter(function (s) { return m(s.name) || m(s.id); }).slice(0, 6).map(function (s) {
      return { icon: 'user', title: s.name, sub: s.id + ' · ' + sel.cls(s.classId).name + ' · ' + sel.prog(s.programmeId).short, href: u.role === 'parent' ? '#/parent/academics?child=' + s.id : '#/students/' + s.id };
    });
    if (st.length) groups.push({ label: 'Students', items: st });
    if (u.role === 'parent') {
      var pages = [['Family Overview', '#/parent'], ['Fees & Payments', '#/parent/fees'], ['Appointments', '#/parent/appointments'], ['Academic Progress', '#/parent/academics']].filter(function (p) { return m(p[0]); });
      if (pages.length) groups.push({ label: 'Pages', items: pages.map(function (p) { return { icon: 'arrow-right', title: p[0], sub: 'Parent portal', href: p[1] }; }) });
      return groups;
    }
    var staff = db.employees.filter(function (e) { return m(e.name) || m(e.id) || m(e.role); }).slice(0, 5).map(function (e) { return { icon: 'id-card', title: e.name, sub: e.id + ' · ' + e.role + ' · ' + e.department, href: u.role === 'teacher' ? null : '#/hr/directory?emp=' + e.id }; });
    if (staff.length) groups.push({ label: 'Staff', items: staff });
    if (u.role !== 'teacher') {
      var adm = db.admissions.filter(function (a) { return m(a.name) || m(a.id); }).slice(0, 4).map(function (a) { return { icon: 'user-plus', title: a.name, sub: a.id + ' · ' + MICS.stageName(a.stage) + ' · ' + sel.cls(a.targetClass).name, href: '#/admissions/' + a.id }; });
      if (adm.length) groups.push({ label: 'Admissions', items: adm });
      var inv = db.invoices.filter(function (i) { return m(i.id); }).slice(0, 3).map(function (i) { var s = sel.student(i.studentId); return { icon: 'receipt', title: i.id, sub: s.name + ' · Balance ' + ui.money(sel.balance(i)), href: '#/students/' + s.id + '?tab=fees' }; });
      if (inv.length) groups.push({ label: 'Invoices', items: inv });
      var mr = db.maintenance.filter(function (x) { return m(x.title) || m(x.id) || m(x.location); }).slice(0, 3).map(function (x) { return { icon: 'wrench', title: x.title, sub: x.id + ' · ' + x.status, href: '#/operations/facilities?req=' + x.id }; });
      if (mr.length) groups.push({ label: 'Maintenance requests', items: mr });
    }
    var modules = [];
    navFor(u.role).forEach(function (g) { g.items.forEach(function (it) { (it.children || [it]).forEach(function (c) { if (m(c.label) || m(it.label)) modules.push({ icon: 'arrow-right', title: c.label, sub: g.group + (it.children ? ' · ' + it.label : ''), href: c.href }); }); }); });
    if (modules.length) groups.push({ label: 'Modules', items: modules.slice(0, 5) });
    return groups;
  }
  function highlight(text, q) {
    var t = ui.esc(text); if (!q) return t;
    var i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return t;
    return ui.esc(text.slice(0, i)) + '<mark>' + ui.esc(text.slice(i, i + q.length)) + '</mark>' + ui.esc(text.slice(i + q.length));
  }
  function openSearch(input) {
    var q = input.value.trim();
    if (q.length < 2) { ui.closePopover(); return; }
    var groups = searchIndex(q);
    focusIdx = -1;
    var html = groups.length ? groups.map(function (g) {
      return '<div class="search-group-label">' + ui.esc(g.label) + '</div>' + g.items.map(function (it) {
        return '<div class="search-result" ' + (it.href ? 'data-go="' + it.href + '"' : 'data-nolink') + '><span class="li-icon">' + ui.icon(it.icon) + '</span><div style="min-width:0"><div class="li-title">' + highlight(it.title, q) + '</div><div class="li-sub">' + highlight(it.sub, q) + '</div></div></div>';
      }).join('');
    }).join('') + '<div class="search-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> navigate</span><span><span class="kbd">Enter</span> open</span><span><span class="kbd">Esc</span> close</span></div>'
      : ui.empty('No matches for “' + q + '”', 'Search covers students, staff, admissions, invoices, maintenance requests and modules.', 'search');
    ui.popover(input, html, { cls: 'search-panel', alignLeft: true, bind: function (p) {
      p.querySelectorAll('[data-go]').forEach(function (r) { r.onmousedown = function (e) { e.preventDefault(); go(r.getAttribute('data-go')); }; });
      p.querySelectorAll('[data-nolink]').forEach(function (r) { r.onmousedown = function (e) { e.preventDefault(); ui.toast('Staff profile', 'Staff details are available to HR and management roles.', 'info'); }; });
    } });
    function go(h) { ui.closePopover(); input.value = ''; input.blur(); MICS.router.go(h); }
    input._go = go;
  }

  function initHeader() {
    var input = document.getElementById('global-search');
    input.addEventListener('input', function () { openSearch(input); });
    input.addEventListener('focus', function () { if (input.value.trim().length >= 2) openSearch(input); });
    input.addEventListener('keydown', function (e) {
      var items = document.querySelectorAll('.search-panel [data-go]');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        focusIdx = (focusIdx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (x, i) { x.classList.toggle('focused', i === focusIdx); });
        items[focusIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        var target = items[focusIdx >= 0 ? focusIdx : 0];
        if (target && input._go) input._go(target.getAttribute('data-go'));
      } else if (e.key === 'Escape') { input.blur(); ui.closePopover(); }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && MICS.auth.user()) { e.preventDefault(); input.focus(); input.select(); }
    });
    var kbd = document.querySelector('.header-search kbd');
    if (kbd && !/Mac|iPhone|iPad/.test(navigator.platform)) kbd.textContent = 'Ctrl K';

    document.getElementById('notif-btn').onclick = function (e) { openNotifications(e.currentTarget); };
    document.getElementById('profile-btn').onclick = function (e) { openProfile(e.currentTarget); };
    document.getElementById('year-select').onchange = function (e) {
      if (e.target.value !== '2026/27') {
        ui.toast('Historical view — ' + e.target.value, 'Prior academic years are read-only in the full system. The prototype shows 2026/27 data.', 'info');
        setTimeout(function () { e.target.value = '2026/27'; }, 600);
      }
    };
    document.getElementById('sidebar-collapse').onclick = function () {
      var app = document.getElementById('app');
      if (window.innerWidth <= 1280) { app.classList.toggle('expanded-force'); return; }
      app.classList.toggle('collapsed');
      try { localStorage.setItem(SIDEBAR_KEY, app.classList.contains('collapsed') ? '1' : '0'); } catch (err) { /* ignore */ }
    };
    document.getElementById('header-menu').onclick = function () { document.getElementById('app').classList.toggle('mobile-open'); document.getElementById('app').classList.toggle('expanded-force'); };
    document.getElementById('sidebar-scrim').onclick = function () { document.getElementById('app').classList.remove('mobile-open', 'expanded-force'); };
    try { if (localStorage.getItem(SIDEBAR_KEY) === '1') document.getElementById('app').classList.add('collapsed'); } catch (err) { /* ignore */ }
  }

  MICS.shell = {
    init: initHeader,
    show: function () { document.getElementById('app').hidden = false; document.getElementById('login-root').hidden = true; document.body.classList.remove('is-login'); },
    hide: function () { document.getElementById('app').hidden = true; document.getElementById('login-root').hidden = false; document.body.classList.add('is-login'); },
    setHeader: setHeader,
    refresh: function () { renderSidebar(); renderHeaderUser(); }
  };
})();
