/* ==========================================================================
   Login
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui;

  MICS.page('login', {
    title: 'Sign in',
    render: function (root) {
      var remembered = MICS.auth.remembered() || '';
      var users = MICS.auth.users;
      root.innerHTML =
        '<div class="login">' +
        '<section class="login-brand" aria-label="MICSAPP">' +
          '<div class="login-brand-top"><span class="brand-logo lg" data-logo></span><div><div class="lb-name">MICSAPP</div><div class="lb-sub">Morgan International Community School</div></div></div>' +
          '<div class="login-brand-body">' +
            '<div class="lb-eyebrow">One-Stop-Shop Integrated School Management</div>' +
            '<h1>Every part of school life, connected in one place.</h1>' +
            '<p>Academics, admissions, operations, finance, people and governance — with a single source of truth for leadership decisions.</p>' +
          '</div>' +
          '<div class="login-brand-foot"><span>Gomoa Manso, Swedru · Central Region, Ghana</span><span class="lb-dot"></span><span>Every learner matters</span></div>' +
        '</section>' +
        '<section class="login-main">' +
          '<div class="login-card">' +
            '<span class="demo-chip"><span class="pulse"></span>Prototype · Demonstration data only</span>' +
            '<h2>Welcome back</h2>' +
            '<p class="muted">Sign in to MICSAPP to continue.</p>' +
            '<form id="login-form" novalidate>' +
              '<div class="field" data-field="email"><label for="email">Email address</label><div class="input-group has-left">' + ui.icon('mail', 'input-icon-left') + '<input class="input" id="email" type="email" autocomplete="username" placeholder="name@mics.edu.gh" value="' + ui.esc(remembered) + '"></div><div class="field-error">' + ui.icon('alert', 'icon-sm') + '<span></span></div></div>' +
              '<div class="field mt-4" data-field="password"><div class="flex justify-between items-center"><label for="password">Password</label><button type="button" class="btn-link text-sm" id="forgot">Forgot password?</button></div><div class="input-group has-left">' + ui.icon('lock', 'input-icon-left') + '<input class="input" id="password" type="password" autocomplete="current-password" placeholder="Enter your password"><button type="button" class="input-action" id="pw-toggle" aria-label="Show password" aria-pressed="false">' + ui.icon('eye') + '</button></div><div class="field-error">' + ui.icon('alert', 'icon-sm') + '<span></span></div></div>' +
              '<div class="flex justify-between items-center mt-4"><label class="checkbox"><input type="checkbox" id="remember" ' + (remembered ? 'checked' : '') + '> Remember me on this device</label></div>' +
              '<button class="btn btn-primary btn-lg btn-block mt-6" type="submit" id="signin">Sign in</button>' +
            '</form>' +
            '<div class="login-divider"><span>Or sign in with a demo account</span></div>' +
            '<div class="demo-accounts">' + users.map(function (u) {
              return '<button type="button" class="demo-account" data-email="' + u.email + '"><span class="da-avatar">' + ui.avatar(u.name) + '</span><span class="da-text"><span class="da-role">' + ui.esc(u.roleLabel.split(' · ')[0]) + '</span><span class="da-name">' + ui.esc(u.name) + '</span><span class="da-email">' + ui.esc(u.email) + '</span><span class="da-desc">' + ui.esc(u.desc) + '</span></span>' + ui.icon('arrow-right', 'da-arrow') + '</button>';
            }).join('') + '</div>' +
            '<p class="login-note">' + ui.icon('info', 'icon-sm') + '<span>Simulated sign-in for demonstration. Click a card above, or type its email address with the password <strong>' + MICS.auth.password + '</strong>. No real credentials or personal data are used.</span></p>' +
          '</div>' +
          '<div class="login-foot">MICSAPP prototype · Designed by Inter Smart for Morgan International Community School</div>' +
        '</section></div>';

      MICS.renderLogos(root);
      var form = root.querySelector('#login-form');
      var pw = root.querySelector('#password');
      root.querySelector('#pw-toggle').onclick = function (e) {
        var show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        e.currentTarget.innerHTML = ui.icon(show ? 'eye-off' : 'eye');
        e.currentTarget.setAttribute('aria-pressed', show);
        e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      };
      root.querySelector('#forgot').onclick = function () { ui.demoOnly('Password reset', 'In the full system, password reset is handled through the school’s identity provider with email verification and multi-factor authentication. In this prototype, use a demo account below.'); };
      root.querySelectorAll('input').forEach(function (i) { i.addEventListener('input', function () { var f = i.closest('.field'); if (f) f.classList.remove('invalid'); }); });

      function setErr(field, msg) { var f = root.querySelector('[data-field="' + field + '"]'); f.classList.add('invalid'); f.querySelector('.field-error span').textContent = msg; }
      function submit(email, password, btn) {
        root.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
        var ok = true;
        if (!email) { setErr('email', 'Please enter your email address.'); ok = false; }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email address, e.g. name@mics.edu.gh'); ok = false; }
        if (!password) { setErr('password', 'Please enter your password.'); ok = false; }
        if (!ok) { (root.querySelector('.field.invalid input')).focus(); return; }
        btn.classList.add('loading');
        setTimeout(function () {
          var res = MICS.auth.login(email, password, root.querySelector('#remember').checked);
          btn.classList.remove('loading');
          if (!res.ok) { setErr(res.field, res.error); root.querySelector('#' + res.field).focus(); return; }
          location.hash = res.user.landing;
          MICS.router.render();
          ui.toast('Signed in as ' + res.user.roleLabel, 'Welcome, ' + res.user.name + '.');
        }, 550);
      }
      form.onsubmit = function (e) { e.preventDefault(); submit(root.querySelector('#email').value.trim(), pw.value, root.querySelector('#signin')); };
      root.querySelectorAll('.demo-account').forEach(function (b) {
        b.onclick = function () {
          root.querySelector('#email').value = b.getAttribute('data-email');
          pw.value = MICS.auth.password;
          submit(b.getAttribute('data-email'), MICS.auth.password, root.querySelector('#signin'));
        };
      });
    }
  });

})();
