/* ==========================================================================
   Lightweight SVG chart library (no dependencies)
   Marks follow a consistent spec: 2px lines, rounded data-ends, recessive grid,
   2px surface gaps between fills, crosshair/hover tooltips.
   ========================================================================== */
(function () {
  'use strict';
  var ui = MICS.ui;
  var charts = {};
  MICS.charts = charts;
  var NS = 'http://www.w3.org/2000/svg';

  // ---------- Tooltip (delegated, any element with data-tt) ----------
  var tip = null;
  function showTip(html, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tooltip'; document.body.appendChild(tip); }
    tip.innerHTML = html; tip.style.display = 'block';
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = x + 14, top = y - h - 10;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideTip() { if (tip) tip.style.display = 'none'; }
  document.addEventListener('mousemove', function (e) {
    var t = e.target.closest && e.target.closest('[data-tt]');
    if (t) showTip(t.getAttribute('data-tt'), e.clientX, e.clientY); else hideTip();
  });
  document.addEventListener('scroll', hideTip, true);
  charts.hideTip = hideTip;

  function tt(title, rows) {
    return ui.esc('<div class="tt-title">' + title + '</div>' + rows.map(function (r) {
      return '<div class="tt-row">' + (r.color ? '<span class="sw" style="background:' + r.color + '"></span>' : '') + '<span>' + r.label + '</span><span class="v">' + r.value + '</span></div>';
    }).join(''));
  }
  charts.tt = tt;

  function niceScale(min, max, ticks) {
    var range = max - min || 1;
    var step = Math.pow(10, Math.floor(Math.log10(range / ticks)));
    var err = range / ticks / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    var out = []; for (var v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1000) / 1000);
    return { min: lo, max: hi, ticks: out };
  }
  function width(el) { return Math.max(240, el.clientWidth || el.getBoundingClientRect().width || 480); }

  // ---------- Line / area chart ----------
  charts.line = function (el, o) {
    var W = width(el), H = o.height || 220;
    var pad = { l: 40, r: o.directLabels ? 112 : 12, t: 12, b: 26 };
    var all = []; o.series.forEach(function (s) { all = all.concat(s.values); });
    if (o.target != null) all.push(o.target);
    var lo = o.yMin != null ? o.yMin : Math.min.apply(null, all), hi = o.yMax != null ? o.yMax : Math.max.apply(null, all);
    var sc = niceScale(lo - (o.yMin != null ? 0 : (hi - lo) * 0.12), hi + (o.yMax != null ? 0 : (hi - lo) * 0.12), 4);
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, n = o.labels.length;
    function x(i) { return pad.l + (n === 1 ? iw / 2 : i * iw / (n - 1)); }
    function y(v) { return pad.t + ih - (v - sc.min) / (sc.max - sc.min) * ih; }
    var fmt = o.format || function (v) { return v; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + ui.esc(o.label || 'Line chart') + '">';
    sc.ticks.forEach(function (t) {
      s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="var(--chart-grid)" />';
      s += '<text x="' + (pad.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + ui.esc(o.tickFormat ? o.tickFormat(t) : t) + '</text>';
    });
    o.labels.forEach(function (l, i) {
      if (n > 8 && i % Math.ceil(n / 8) !== 0 && i !== n - 1) return;
      var anchor = n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 && !o.directLabels ? 'end' : 'middle';
      s += '<text x="' + (anchor === 'start' ? x(i) - 4 : anchor === 'end' ? x(i) + 4 : x(i)) + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">' + ui.esc(l) + '</text>';
    });
    if (o.target != null) {
      s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(o.target) + '" y2="' + y(o.target) + '" stroke="var(--text-faint)" stroke-dasharray="4 4" />';
      s += '<text x="' + (W - pad.r) + '" y="' + (y(o.target) - 5) + '" text-anchor="end" style="fill:var(--text-muted);font-weight:600">Target ' + ui.esc(fmt(o.target)) + '</text>';
    }
    o.series.forEach(function (ser, si) {
      var pts = ser.values.map(function (v, i) { return [x(i), y(v)]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      if (o.area && o.series.length === 1) {
        s += '<path d="' + d + ' L' + pts[pts.length - 1][0] + ' ' + (pad.t + ih) + ' L' + pts[0][0] + ' ' + (pad.t + ih) + ' Z" fill="' + ser.color + '" opacity="0.08" />';
      }
      s += '<path d="' + d + '" fill="none" stroke="' + ser.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' + (ser.dashed ? ' stroke-dasharray="5 4"' : '') + ' />';
      var last = pts[pts.length - 1];
      s += '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="4" fill="' + ser.color + '" stroke="#fff" stroke-width="2" />';
      if (o.directLabels) s += '<text x="' + (last[0] + 8) + '" y="' + (last[1] + 4 + (o.labelNudge ? o.labelNudge[si] || 0 : 0)) + '" style="fill:var(--text-2);font-weight:600">' + ui.esc(ser.name) + ' ' + ui.esc(fmt(ser.values[ser.values.length - 1])) + '</text>';
    });
    // hover columns
    var colW = n > 1 ? iw / (n - 1) : iw;
    o.labels.forEach(function (l, i) {
      var rows = o.series.map(function (ser) { return { label: ser.name, value: fmt(ser.values[i]), color: ser.color }; });
      s += '<g class="hov"><line class="hline" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + pad.t + '" y2="' + (pad.t + ih) + '" stroke="var(--border-strong)" opacity="0" />' +
        '<rect x="' + (x(i) - colW / 2) + '" y="' + pad.t + '" width="' + colW + '" height="' + ih + '" fill="transparent" data-tt="' + tt(o.tooltipTitle ? o.tooltipTitle(l, i) : l, rows) + '" /></g>';
    });
    s += '</svg>';
    el.innerHTML = '<div class="chart">' + s + '</div>';
    el.querySelectorAll('.hov').forEach(function (g) {
      g.addEventListener('mouseenter', function () { g.querySelector('.hline').setAttribute('opacity', '1'); });
      g.addEventListener('mouseleave', function () { g.querySelector('.hline').setAttribute('opacity', '0'); });
    });
  };

  // ---------- Vertical bars (grouped or stacked) ----------
  charts.bars = function (el, o) {
    var W = width(el), H = o.height || 220;
    var pad = { l: 44, r: 8, t: 12, b: 26 };
    var n = o.labels.length;
    var totals = o.labels.map(function (_, i) { return o.stacked ? o.series.reduce(function (a, s) { return a + s.values[i]; }, 0) : Math.max.apply(null, o.series.map(function (s) { return s.values[i]; })); });
    var sc = o.max ? niceScale(0, o.max, 4) : niceScale(0, Math.max.apply(null, totals) * 1.05, 4);
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var band = iw / n, gw = Math.min(band * 0.62, o.stacked ? 36 : 22 * o.series.length + 4);
    function y(v) { return pad.t + ih - v / sc.max * ih; }
    var fmt = o.format || function (v) { return ui.num(v); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + ui.esc(o.label || 'Bar chart') + '">';
    sc.ticks.forEach(function (t) {
      s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="var(--chart-grid)" />';
      s += '<text x="' + (pad.l - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + ui.esc(o.tickFormat ? o.tickFormat(t) : ui.num(t)) + '</text>';
    });
    o.labels.forEach(function (l, i) {
      var cx = pad.l + band * i + band / 2;
      s += '<text x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle">' + ui.esc(l) + '</text>';
      var rows = o.series.map(function (ser) { return { label: ser.name, value: fmt(ser.values[i]), color: ser.color }; });
      if (o.stacked) {
        var acc = 0;
        o.series.forEach(function (ser, si) {
          var v = ser.values[i]; if (!v) return;
          var y1 = y(acc + v), y0 = y(acc);
          var h = Math.max(0, y0 - y1 - (si > 0 ? 2 : 0));
          var top = si === o.series.length - 1 || o.series.slice(si + 1).every(function (z) { return !z.values[i]; });
          s += barPath(cx - gw / 2, y1, gw, h, top ? 4 : 0, ser.color);
          acc += v;
        });
      } else {
        var bw = (gw - (o.series.length - 1) * 2) / o.series.length;
        o.series.forEach(function (ser, si) {
          var v = ser.values[i]; var y1 = y(v);
          s += barPath(cx - gw / 2 + si * (bw + 2), y1, bw, pad.t + ih - y1, 4, ser.color);
        });
      }
      s += '<rect x="' + (pad.l + band * i) + '" y="' + pad.t + '" width="' + band + '" height="' + ih + '" fill="transparent" data-tt="' + tt(l, rows.concat(o.stacked && o.showTotal !== false ? [{ label: '<strong>Total</strong>', value: fmt(totals[i]) }] : [])) + '" />';
    });
    s += '</svg>';
    el.innerHTML = '<div class="chart">' + s + '</div>';
  };
  function barPath(x, y, w, h, r, color) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return '<path d="M' + x + ' ' + (y + h) + ' V' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + ' V' + (y + h) + ' Z" fill="' + color + '" />';
  }

  // ---------- Donut ----------
  charts.donut = function (el, o) {
    var size = o.size || 168, sw = o.stroke || 22, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var total = o.items.reduce(function (a, i) { return a + i.value; }, 0);
    var gap = o.items.length > 1 ? 2 : 0, off = 0;
    var s = '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + ui.esc(o.label || 'Donut chart') + '" style="flex:none">';
    s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-sunken)" stroke-width="' + sw + '" />';
    o.items.forEach(function (it) {
      var len = it.value / total * c;
      var seg = Math.max(0, len - gap);
      s += '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + it.color + '" stroke-width="' + sw + '" stroke-dasharray="' + seg + ' ' + (c - seg) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" data-tt="' + tt(it.label, [{ label: 'Count', value: ui.num(it.value), color: it.color }, { label: 'Share', value: (it.value / total * 100).toFixed(1) + '%' }]) + '" style="cursor:default" />';
      off += len;
    });
    if (o.center) s += '<text x="50%" y="' + (size / 2 - 2) + '" text-anchor="middle" style="font-size:22px;font-weight:700;fill:var(--text)">' + ui.esc(o.center.value) + '</text><text x="50%" y="' + (size / 2 + 16) + '" text-anchor="middle" style="font-size:11px;fill:var(--text-muted)">' + ui.esc(o.center.label) + '</text>';
    s += '</svg>';
    el.innerHTML = s;
  };

  // ---------- Progress ring (string) ----------
  charts.ring = function (value, o) {
    o = o || {};
    var size = o.size || 64, sw = o.stroke || 6, r = (size - sw) / 2, c = 2 * Math.PI * r;
    var color = o.color || 'var(--chart-1)';
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + Math.round(value) + '% complete" style="flex:none">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-sunken)" stroke-width="' + sw + '" />' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (c * value / 100) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" />' +
      '<text x="50%" y="50%" dy="0.35em" text-anchor="middle" style="font-size:' + (o.fontSize || 14) + 'px;font-weight:700;fill:var(--text);font-family:var(--font-sans)">' + Math.round(value) + '%</text></svg>';
  };

  // ---------- Sparklines ----------
  charts.sparks = function (root) {
    root.querySelectorAll('[data-spark]').forEach(function (el) {
      var v = el.getAttribute('data-spark').split(',').map(Number);
      var tone = el.getAttribute('data-spark-tone');
      var color = tone === 'danger' ? 'var(--danger)' : tone === 'success' ? 'var(--success)' : tone === 'gold' ? 'var(--chart-2)' : 'var(--chart-1)';
      var W = 88, H = 32, lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), rng = hi - lo || 1;
      var pts = v.map(function (d, i) { return [i * (W - 4) / (v.length - 1) + 2, H - 4 - (d - lo) / rng * (H - 8)]; });
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      var last = pts[pts.length - 1];
      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true"><path d="' + d + ' L' + last[0] + ' ' + H + ' L2 ' + H + ' Z" fill="' + color + '" opacity="0.08"/><path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.5" fill="' + color + '"/></svg>';
    });
  };

  // ---------- Horizontal bars (HTML) ----------
  charts.hbars = function (items, o) {
    o = o || {};
    var max = o.max || Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    return '<div class="hbars">' + items.map(function (it) {
      return '<div class="hbar" data-tt="' + tt(it.label, [{ label: o.valueLabel || 'Value', value: (o.format || ui.num)(it.value), color: it.color || 'var(--chart-1)' }].concat(it.extra || [])) + '">' +
        '<div class="hbar-top"><span class="hbar-label">' + ui.esc(it.label) + '</span><span class="hbar-value">' + (it.display || (o.format || ui.num)(it.value)) + '</span></div>' +
        '<div class="hbar-track"><span style="width:' + Math.max(1.5, it.value / max * 100) + '%;background:' + (it.color || 'var(--chart-1)') + '"></span>' + (it.marker != null ? '<i style="left:' + Math.min(100, it.marker / max * 100) + '%"></i>' : '') + '</div></div>';
    }).join('') + '</div>';
  };

  // ---------- Budget bullet rows (HTML) ----------
  charts.bullets = function (rows, o) {
    o = o || {};
    return '<div class="bullets">' + rows.map(function (r) {
      var max = Math.max(r.plan, r.actual + (r.committed || 0)) * 1.15;
      var variance = r.actual - r.plan;
      var pct = variance / r.plan * 100;
      var tone = pct > 5 ? 'danger' : pct > 0 ? 'warning' : 'success';
      return '<div class="bullet" data-tt="' + tt(r.label, [
        { label: 'YTD plan', value: ui.moneyShort(r.plan) },
        { label: 'YTD actual', value: ui.moneyShort(r.actual), color: 'var(--chart-1)' },
        { label: 'Committed', value: ui.moneyShort(r.committed || 0), color: 'var(--seq-2)' },
        { label: 'Variance', value: (variance > 0 ? '+' : '') + ui.moneyShort(variance) + ' (' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '%)' }]) + '">' +
        '<div class="bullet-label"><span class="truncate">' + ui.esc(r.label) + '</span><span class="bullet-var ' + tone + '">' + (pct > 0 ? '+' : '') + pct.toFixed(1) + '%</span></div>' +
        '<div class="bullet-track"><span class="b-actual" style="width:' + (r.actual / max * 100) + '%"></span><span class="b-commit" style="left:calc(' + (r.actual / max * 100) + '% + 2px);width:' + ((r.committed || 0) / max * 100) + '%"></span><i class="b-plan" style="left:' + (r.plan / max * 100) + '%"></i></div></div>';
    }).join('') + '</div>';
  };

  // ---------- Legend ----------
  charts.legend = function (items, line) {
    return '<div class="legend">' + items.map(function (i) { return '<span><i class="' + (line ? 'line' : '') + '" style="background:' + i.color + '"></i>' + ui.esc(i.label) + '</span>'; }).join('') + '</div>';
  };
})();
