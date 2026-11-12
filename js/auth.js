/* ==========================================================================
   Simulated authentication — demo accounts only, no real credentials
   ========================================================================== */
(function () {
  'use strict';
  var SESSION_KEY = 'micsapp.session';
  var REMEMBER_KEY = 'micsapp.remember';
  var PASSWORD = 'demo123';

  var users = [
    { role: 'head', roleLabel: 'Head of School', name: 'Dr. Abena Owusu-Mensah', short: 'Dr. Owusu-Mensah', email: 'head@mics.edu.gh', empId: 'EMP-0001', landing: '#/dashboard', desc: 'Management Command Centre, approvals, governance & AI insights' },
    { role: 'admin', roleLabel: 'School Administrator', name: 'Kwame Asante', short: 'Kwame Asante', email: 'admin@mics.edu.gh', empId: 'EMP-0002', landing: '#/dashboard', desc: 'Admissions, student records, operations, finance & HR' },
    { role: 'teacher', roleLabel: 'Teacher · Mathematics', name: 'Mrs. Efua Boateng', short: 'Mrs. Boateng', email: 'teacher@mics.edu.gh', empId: 'EMP-0014', landing: '#/teacher', desc: 'Classes, attendance registers, assignments & results' },
    { role: 'parent', roleLabel: 'Parent · 2 children', name: 'Mr. Kofi Adjei', short: 'Mr. Adjei', email: 'parent@mics.edu.gh', parentRef: 'STU-0012', landing: '#/parent', desc: 'Children’s progress, fees, payments & appointments' }
  ];

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  function remove(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  function resolve(u) {
    if (!u) return null;
    var out = {}; for (var k in u) out[k] = u[k];
    if (u.parentRef) { var s = MICS.sel.student(u.parentRef); out.parentId = s ? s.guardianId : null; }
    return out;
  }

  var current = null;
  var auth = {
    users: users,
    password: PASSWORD,
    init: function () {
      var role = read(SESSION_KEY);
      current = resolve(users.find(function (u) { return u.role === role; }));
    },
    user: function () { return current; },
    role: function () { return current ? current.role : null; },
    login: function (email, password, remember) {
      var u = users.find(function (x) { return x.email.toLowerCase() === String(email).toLowerCase().trim(); });
      if (!u) return { ok: false, field: 'email', error: 'No demo account matches this email address.' };
      if (password !== PASSWORD) return { ok: false, field: 'password', error: 'Incorrect password. Demo password is “' + PASSWORD + '”.' };
      current = resolve(u);
      write(SESSION_KEY, u.role);
      if (remember) write(REMEMBER_KEY, u.email); else remove(REMEMBER_KEY);
      MICS.state.update(function () {}, { module: 'Security', text: u.name + ' signed in (' + u.roleLabel + ')', actor: u.name });
      return { ok: true, user: current };
    },
    switchRole: function (role) {
      var u = users.find(function (x) { return x.role === role; });
      if (!u) return;
      current = resolve(u);
      write(SESSION_KEY, role);
      return current;
    },
    logout: function () { current = null; remove(SESSION_KEY); },
    remembered: function () { return read(REMEMBER_KEY); }
  };
  MICS.auth = auth;
})();
