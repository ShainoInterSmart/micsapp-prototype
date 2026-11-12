/* ==========================================================================
   MICSAPP brand configuration
   Official MICS crest lives in assets/images/. If the file is missing,
   the typographic "MICS" wordmark is shown as a fallback.
   ========================================================================== */
window.MICS = window.MICS || {};
MICS.config = {
  logo: 'assets/images/cropped-logo_main.png',
  logoAlt: 'Morgan International Community School',
  wordmark: 'MICS',
  productName: 'MICSAPP'
};

/** Render the brand mark into every [data-logo] slot within root. */
MICS.renderLogos = function (root) {
  (root || document).querySelectorAll('[data-logo]').forEach(function (slot) {
    var lg = slot.classList.contains('lg');
    var mark = '<span class="wordmark' + (lg ? ' lg' : '') + '" aria-hidden="true">' + MICS.config.wordmark + '</span>';
    if (!MICS.config.logo) { slot.innerHTML = mark; return; }
    var img = new Image();
    img.className = 'logo-img';
    img.alt = MICS.config.logoAlt;
    img.onerror = function () { slot.innerHTML = mark; };
    img.src = MICS.config.logo;
    slot.innerHTML = '';
    slot.appendChild(img);
  });
};
