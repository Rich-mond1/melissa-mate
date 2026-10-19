/* =====================================================================
   MATEMAGICS v4 — VISUALS
   Every drawing is SVG/HTML produced from numbers, and every drawing has
   a matching DECODER that reads the number back out of the *geometry*
   (hand angles, element counts, pixel positions) — never from the data
   the question was built from. Questions wire `decodeKey` to these, so the
   auditor can prove "what the child sees" == "what the answer says".
   ===================================================================== */
'use strict';

const V = {};
const INK = 'var(--vis-ink,#1B1B2F)', BLUE = 'var(--vis-a,#4F8FE8)', PURPLE = 'var(--vis-b,#9B51E0)',
      WARM = 'var(--vis-warm,#F2C94C)', SOFT = 'var(--vis-soft,#EEF1FB)', GREEN = 'var(--vis-good,#27AE60)', RED = 'var(--vis-bad,#EB5757)';
function f2(n){ return (Math.round(n * 100) / 100).toString(); }
function nums(s){ return (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); }
function attrOf(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
function tagsOf(html, cls){ // every element whose class attribute contains cls (as a whole word)
  const re = new RegExp('<[a-z]+[^>]*class="[^"]*\\b' + cls + '\\b[^"]*"[^>]*>', 'g');
  return html.match(re) || [];
}
function svgWrap(w, h, inner, extra){
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + (extra && extra.width || w) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + inner + '</svg>';
}

/* ------------------------------------------------------------------ CLOCK */
const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
V.clock = function(h, m, o){
  o = o || {};
  const cx = 100, cy = 100;
  let s = '<circle cx="100" cy="100" r="94" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
  for(let i = 0; i < 60; i++){
    const a = i * 6 * Math.PI / 180, major = i % 5 === 0;
    const r1 = major ? 80 : 86, r2 = 91;
    s += '<line x1="' + f2(cx + r1 * Math.sin(a)) + '" y1="' + f2(cy - r1 * Math.cos(a)) + '" x2="' + f2(cx + r2 * Math.sin(a)) + '" y2="' + f2(cy - r2 * Math.cos(a)) + '" stroke="' + INK + '" stroke-width="' + (major ? 2.4 : 1) + '"/>';
  }
  if(!o.hideNumbers){
    for(let n = 1; n <= 12; n++){
      const a = n * 30 * Math.PI / 180, r = o.roman ? 64 : 66;
      s += '<text x="' + f2(cx + r * Math.sin(a)) + '" y="' + f2(cy - r * Math.cos(a) + (o.roman ? 5 : 8)) + '" text-anchor="middle" font-size="' + (o.roman ? 15 : 22) + '" font-weight="800" fill="' + INK + '">' + (o.roman ? ROMAN[n] : n) + '</text>';
    }
  }
  const ha = ((h % 12) * 30 + m * 0.5) * Math.PI / 180, ma = m * 6 * Math.PI / 180;
  s += '<line class="hand-h" x1="100" y1="100" x2="' + f2(cx + 46 * Math.sin(ha)) + '" y2="' + f2(cy - 46 * Math.cos(ha)) + '" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>';
  s += '<line class="hand-m" x1="100" y1="100" x2="' + f2(cx + 70 * Math.sin(ma)) + '" y2="' + f2(cy - 70 * Math.cos(ma)) + '" stroke="' + BLUE + '" stroke-width="4" stroke-linecap="round"/>';
  s += '<circle cx="100" cy="100" r="5" fill="' + INK + '"/>';
  return svgWrap(200, 200, s, { width: o.width || 200 });
};
/* decode -> {h (1..12), m (0..59)} from the drawn hand tips */
V.decodeClock = function(html){
  const hh = tagsOf(html, 'hand-h')[0], mm = tagsOf(html, 'hand-m')[0];
  function ang(tag){ const x = parseFloat(attrOf(tag, 'x2')) - 100, y = 100 - parseFloat(attrOf(tag, 'y2')); let d = Math.atan2(x, y) * 180 / Math.PI; if(d < 0) d += 360; return d; }
  const am = ang(mm), ah = ang(hh);
  const minute = Math.round(am / 6) % 60;
  let hour = Math.round((ah - minute * 0.5) / 30) % 12; if(hour === 0) hour = 12;
  return { h: hour, m: minute };
};

/* digital time (text) */
V.digital = function(h, m, o){
  o = o || {};
  let txt;
  if(o.h24) txt = pad2(h) + ':' + pad2(m);
  else txt = h + ':' + pad2(m) + (o.ampm ? ' ' + o.ampm : '');
  return '<div class="digital" style="display:inline-block;background:#111;color:#7CFFB2;font:800 34px/1.1 ui-monospace,Menlo,monospace;padding:10px 16px;border-radius:12px;letter-spacing:2px">' + txt + '</div>';
};
V.decodeDigital = function(html){ const m = /(\d{1,2}):(\d{2})/.exec(html); return m ? { h: +m[1], m: +m[2] } : null; };

/* ------------------------------------------------------------ FRACTIONS */
V.fractionBar = function(num, den, o){
  o = o || {};
  const W = 280, H = 52, w = W / den;
  let s = '';
  for(let i = 0; i < den; i++){
    s += '<rect class="seg ' + (i < num ? 'on' : 'off') + '" x="' + f2(4 + i * (W - 8) / den) + '" y="6" width="' + f2((W - 8) / den) + '" height="' + (H - 12) + '" fill="' + (i < num ? (o.color || BLUE) : '#fff') + '" stroke="' + INK + '" stroke-width="2.5"/>';
  }
  return svgWrap(W, H, s, { width: W });
};
V.decodeFractionBar = function(html){
  const on = tagsOf(html, 'seg').filter(function(t){ return /class="seg on"/.test(t); }).length;
  const all = tagsOf(html, 'seg').length;
  return { num: on, den: all };
};
V.fractionCircle = function(num, den, o){
  o = o || {};
  const cx = 70, cy = 70, r = 60;
  let s = '';
  if(den === 1){
    s += '<circle class="wedge ' + (num >= 1 ? 'on' : 'off') + '" cx="70" cy="70" r="60" fill="' + (num >= 1 ? BLUE : '#fff') + '" stroke="' + INK + '" stroke-width="2.5"/>';
  } else for(let i = 0; i < den; i++){
    const a1 = i * 2 * Math.PI / den, a2 = (i + 1) * 2 * Math.PI / den;
    const x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1), x2 = cx + r * Math.sin(a2), y2 = cy - r * Math.cos(a2);
    s += '<path class="wedge ' + (i < num ? 'on' : 'off') + '" d="M' + cx + ' ' + cy + ' L' + f2(x1) + ' ' + f2(y1) + ' A' + r + ' ' + r + ' 0 ' + (a2 - a1 > Math.PI ? 1 : 0) + ' 1 ' + f2(x2) + ' ' + f2(y2) + ' Z" fill="' + (i < num ? (o.color || PURPLE) : '#fff') + '" stroke="' + INK + '" stroke-width="2.5"/>';
  }
  return svgWrap(140, 140, s, { width: 140 });
};
V.decodeFractionCircle = function(html){
  const w = tagsOf(html, 'wedge');
  return { num: w.filter(function(t){ return /class="wedge on"/.test(t); }).length, den: w.length };
};
/* a row of several fraction bars/circles shown as option images */
V.fractionStrip = function(num, den){ return V.fractionBar(num, den, { color: WARM }); };

/* ---------------------------------------------------------- NUMBER LINE */
/* o: {min,max,minor (tick step), major (label step), marks:[{value, kind:'dot'|'q', color}], width, fracDen} */
V.numberLine = function(o){
  const W = o.width || 320, x0 = 24, x1 = W - 24, y = 44;
  const span = o.max - o.min;
  function X(v){ return x0 + (v - o.min) / span * (x1 - x0); }
  let s = '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + INK + '" stroke-width="3"/>';
  const n = Math.round(span / o.minor);
  for(let i = 0; i <= n; i++){
    const v = o.min + i * o.minor, isMajor = Math.abs((v - o.min) / o.major - Math.round((v - o.min) / o.major)) < 1e-9;
    s += '<line class="tk" x1="' + f2(X(v)) + '" y1="' + (y - (isMajor ? 12 : 7)) + '" x2="' + f2(X(v)) + '" y2="' + (y + (isMajor ? 12 : 7)) + '" stroke="' + INK + '" stroke-width="' + (isMajor ? 2.6 : 1.6) + '"/>';
    if(isMajor && !o.noLabels){
      const lab = o.labels ? o.labels(v) : (Math.round(v * 1e6) / 1e6);
      s += '<text class="lbl" data-v="' + (Math.round(v * 1e6) / 1e6) + '" x="' + f2(X(v)) + '" y="' + (y + 32) + '" text-anchor="middle" font-size="14" font-weight="800" fill="' + INK + '">' + lab + '</text>';
    }
  }
  (o.marks || []).forEach(function(mk){
    if(mk.kind === 'q'){
      s += '<text class="mark" x="' + f2(X(mk.value)) + '" y="' + (y - 20) + '" text-anchor="middle" font-size="26" font-weight="900" fill="' + RED + '">?</text><circle class="mark" cx="' + f2(X(mk.value)) + '" cy="' + y + '" r="6" fill="' + RED + '"/>';
    } else {
      s += '<circle class="mark" cx="' + f2(X(mk.value)) + '" cy="' + y + '" r="7" fill="' + (mk.color || RED) + '" stroke="#fff" stroke-width="2"/>';
    }
  });
  return svgWrap(W, 82, s, { width: W });
};
/* decode: value of the FIRST mark, read from pixel positions of ticks (not the generator's numbers) */
V.decodeNumberLine = function(html){
  const ticks = tagsOf(html, 'tk').map(function(t){ return parseFloat(attrOf(t, 'x1')); });
  const lbls = tagsOf(html.replace(/<text/g, '<text'), 'lbl');
  // labels are <text class="lbl" data-v=".." x="..">; read data-v and x from the opening tag
  const L = lbls.map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), x: parseFloat(attrOf(t, 'x')) }; });
  if(L.length < 2) return null;
  const a = L[0], b = L[L.length - 1];
  const mk = tagsOf(html, 'mark').filter(function(t){ return /<circle/.test(t); })[0];
  if(!mk) return null;
  const mx = parseFloat(attrOf(mk, 'cx'));
  const v = a.v + (mx - a.x) / (b.x - a.x) * (b.v - a.v);
  return Math.round(v * 1e6) / 1e6;
};
/* how many equal intervals between two labelled ticks (for fraction number lines) */
V.countTicks = function(html){ return tagsOf(html, 'tk').length; };

/* ----------------------------------------------------------- PLACE VALUE */
V.baseTen = function(h, t, o, o2){
  o2 = o2 || {};
  let s = '', x = 6, y = 6;
  // hundreds (flats), tens (rods), ones (cubes)
  for(let i = 0; i < h; i++){
    const gx = 6 + i * 62;
    s += '<rect class="b100" x="' + gx + '" y="6" width="56" height="56" rx="4" fill="' + BLUE + '" stroke="' + INK + '" stroke-width="2"/>';
    for(let k = 1; k < 5; k++){
      s += '<line x1="' + (gx + k * 11.2) + '" y1="6" x2="' + (gx + k * 11.2) + '" y2="62" stroke="#fff" stroke-width="1" opacity=".6"/><line x1="' + gx + '" y1="' + (6 + k * 11.2) + '" x2="' + (gx + 56) + '" y2="' + (6 + k * 11.2) + '" stroke="#fff" stroke-width="1" opacity=".6"/>';
    }
  }
  const row2 = h > 0 ? 72 : 6;
  for(let i = 0; i < t; i++){
    const gx = 6 + i * 16;
    s += '<rect class="b10" x="' + gx + '" y="' + row2 + '" width="12" height="56" rx="3" fill="' + PURPLE + '" stroke="' + INK + '" stroke-width="2"/>';
  }
  const onesX = 6 + Math.max(t, 0) * 16 + (t > 0 ? 16 : 0);
  for(let i = 0; i < o; i++){
    const col = i % 3, rw = Math.floor(i / 3);
    s += '<rect class="b1" x="' + (onesX + col * 16) + '" y="' + (row2 + rw * 16) + '" width="12" height="12" rx="2" fill="' + WARM + '" stroke="' + INK + '" stroke-width="2"/>';
  }
  const w = Math.max(6 + h * 62, onesX + 3 * 16 + 6, 6 + t * 16 + 60);
  return svgWrap(Math.max(w, 120), (h > 0 ? 72 : 6) + 62, s, { width: Math.max(w, 120) });
};
V.decodeBaseTen = function(html){
  return tagsOf(html, 'b100').length * 100 + tagsOf(html, 'b10').length * 10 + tagsOf(html, 'b1').length;
};

/* --------------------------------------------------- ARRAYS & GROUPS */
V.array = function(rows, cols, o){
  o = o || {};
  const r = 12, gap = 30; let s = '';
  for(let i = 0; i < rows; i++) for(let j = 0; j < cols; j++)
    s += '<circle class="dot" cx="' + (22 + j * gap) + '" cy="' + (22 + i * gap) + '" r="' + r + '" fill="' + (o.color || BLUE) + '" stroke="' + INK + '" stroke-width="1.5"/>';
  return svgWrap(cols * gap + 14, rows * gap + 14, s, { width: Math.min(cols * gap + 14, 340) });
};
V.decodeArray = function(html){
  const d = tagsOf(html, 'dot');
  const xs = {}, ys = {};
  d.forEach(function(t){ xs[attrOf(t, 'cx')] = 1; ys[attrOf(t, 'cy')] = 1; });
  return { rows: Object.keys(ys).length, cols: Object.keys(xs).length, total: d.length };
};
/* equal groups: n rings each holding `per` dots */
V.groups = function(n, per, o){
  o = o || {};
  const gw = 20 + Math.min(per, 5) * 20, gh = 20 + Math.ceil(per / 5) * 20;
  const perRow = Math.max(1, Math.floor(320 / (gw + 14)));
  let s = '';
  for(let g = 0; g < n; g++){
    const gx = 6 + (g % perRow) * (gw + 14), gy = 6 + Math.floor(g / perRow) * (gh + 14);
    s += '<rect class="grp" x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" rx="14" fill="' + SOFT + '" stroke="' + PURPLE + '" stroke-width="2.5" stroke-dasharray="5 4"/>';
    for(let k = 0; k < per; k++)
      s += '<circle class="dot" cx="' + (gx + 20 + (k % 5) * 20) + '" cy="' + (gy + 20 + Math.floor(k / 5) * 20) + '" r="7" fill="' + (o.color || BLUE) + '" stroke="' + INK + '" stroke-width="1.2"/>';
  }
  const rowsUsed = Math.ceil(n / perRow);
  return svgWrap(Math.min(perRow, n) * (gw + 14) + 6, rowsUsed * (gh + 14) + 6, s, { width: Math.min(Math.min(perRow, n) * (gw + 14) + 6, 340) });
};
V.decodeGroups = function(html){
  const g = tagsOf(html, 'grp').length, d = tagsOf(html, 'dot').length;
  return { groups: g, per: g ? d / g : 0, total: d };
};
/* sharing: total dots (to be shared) drawn in a tray */
V.dots = function(n, o){
  o = o || {};
  const cols = Math.min(n, o.cols || 10), rows = Math.ceil(n / cols); let s = '';
  for(let i = 0; i < n; i++) s += '<circle class="dot" cx="' + (16 + (i % cols) * 26) + '" cy="' + (16 + Math.floor(i / cols) * 26) + '" r="10" fill="' + (o.color || WARM) + '" stroke="' + INK + '" stroke-width="1.5"/>';
  return svgWrap(cols * 26 + 6, rows * 26 + 6, s, { width: Math.min(cols * 26 + 6, 340) });
};
V.decodeDots = function(html){ return tagsOf(html, 'dot').length; };

/* ------------------------------------------------------------- MEASURES */
/* Ruler with an object of a given length. unit 'cm' (mm ticks) */
V.ruler = function(lengthCm, o){
  o = o || {};
  const maxCm = o.maxCm || Math.ceil(lengthCm + 1), x0 = 20, pxCm = Math.min(30, Math.floor(300 / maxCm));
  let s = '<rect x="10" y="44" width="' + (maxCm * pxCm + 20) + '" height="42" rx="4" fill="#FFE9A8" stroke="' + INK + '" stroke-width="2"/>';
  for(let mm = 0; mm <= maxCm * 10; mm++){
    const x = x0 + mm * pxCm / 10, isCm = mm % 10 === 0, isHalf = mm % 5 === 0;
    s += '<line class="tk" x1="' + f2(x) + '" y1="44" x2="' + f2(x) + '" y2="' + (44 + (isCm ? 20 : (isHalf ? 14 : 8))) + '" stroke="' + INK + '" stroke-width="' + (isCm ? 2 : 1) + '"/>';
    if(isCm) s += '<text class="lbl" data-v="' + (mm / 10) + '" x="' + f2(x) + '" y="80" text-anchor="middle" font-size="12" font-weight="800" fill="' + INK + '">' + (mm / 10) + '</text>';
  }
  const w = lengthCm * pxCm;
  s += '<rect class="obj" x="' + x0 + '" y="8" width="' + f2(w) + '" height="26" rx="6" fill="' + (o.color || BLUE) + '" stroke="' + INK + '" stroke-width="2"/>';
  s += '<text x="' + (x0 + w / 2) + '" y="27" text-anchor="middle" font-size="15" fill="#fff" font-weight="800">' + (o.emoji || '') + '</text>';
  return svgWrap(maxCm * pxCm + 40, 92, s, { width: Math.min(maxCm * pxCm + 40, 340) });
};
V.decodeRuler = function(html){ // length in cm from object width vs label spacing
  const L = tagsOf(html, 'lbl').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), x: parseFloat(attrOf(t, 'x')) }; });
  const obj = tagsOf(html, 'obj')[0];
  const a = L[0], b = L[L.length - 1];
  const ox = parseFloat(attrOf(obj, 'x')), ow = parseFloat(attrOf(obj, 'width'));
  const end = a.v + ((ox + ow) - a.x) / (b.x - a.x) * (b.v - a.v);
  const start = a.v + (ox - a.x) / (b.x - a.x) * (b.v - a.v);
  return Math.round((end - start) * 100) / 100;
};

/* Measuring jug: water level; unit labels */
V.jug = function(value, max, o){
  o = o || {};
  const minor = o.minor || max / 10, major = o.major || max / 2;
  const top = 14, bot = 170, H = bot - top, x0 = 46, w = 80;
  function Y(v){ return bot - v / max * H; }
  let s = '<rect x="' + x0 + '" y="' + top + '" width="' + w + '" height="' + H + '" fill="#fff" stroke="' + INK + '" stroke-width="3" rx="6"/>';
  s += '<rect class="water" x="' + (x0 + 2) + '" y="' + f2(Y(value)) + '" width="' + (w - 4) + '" height="' + f2(bot - Y(value) - 1.5) + '" fill="' + (o.color || '#6EC6FF') + '" opacity=".85"/>';
  const n = Math.round(max / minor);
  for(let i = 0; i <= n; i++){
    const v = i * minor, isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
    s += '<line class="jt" x1="' + (x0 + w - (isMajor ? 26 : 14)) + '" y1="' + f2(Y(v)) + '" x2="' + (x0 + w) + '" y2="' + f2(Y(v)) + '" stroke="' + INK + '" stroke-width="' + (isMajor ? 2.2 : 1.4) + '"/>';
    if(isMajor) s += '<text class="jl" data-v="' + v + '" x="' + (x0 + w + 8) + '" y="' + f2(Y(v) + 5) + '" font-size="18" font-weight="800" fill="' + INK + '">' + v + (o.unit ? ' ' + (o.unit === 'l' ? 'L' : o.unit) : '') + '</text>';
  }
  return svgWrap(250, 184, s, { width: 210 });
};
V.decodeJug = function(html){
  const L = tagsOf(html, 'jl').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), y: parseFloat(attrOf(t, 'y')) }; });
  const a = L[0], b = L[L.length - 1];
  const w = tagsOf(html, 'water')[0], wy = parseFloat(attrOf(w, 'y'));
  // label y is tick y + 5; level y is the water top
  const v = a.v + ((a.y - 5) - wy) / ((a.y - 5) - (b.y - 5)) * (b.v - a.v);
  return Math.round(v * 100) / 100;
};

/* Dial scales (kitchen scales): needle over 0..max, 270-degree sweep from -135deg to +135deg */
V.dial = function(value, max, o){
  o = o || {};
  const cx = 100, cy = 100, minor = o.minor || max / 20, major = o.major || max / 4;
  function A(v){ return (-135 + v / max * 270) * Math.PI / 180; }
  let s = '<circle cx="100" cy="100" r="92" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
  const n = Math.round(max / minor);
  for(let i = 0; i <= n; i++){
    const v = i * minor, a = A(v), isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-9;
    s += '<line x1="' + f2(cx + (isMajor ? 66 : 76) * Math.sin(a)) + '" y1="' + f2(cy - (isMajor ? 66 : 76) * Math.cos(a)) + '" x2="' + f2(cx + 84 * Math.sin(a)) + '" y2="' + f2(cy - 84 * Math.cos(a)) + '" stroke="' + INK + '" stroke-width="' + (isMajor ? 2.6 : 1.3) + '"/>';
    if(isMajor && v < max) s += '<text class="dl" data-v="' + v + '" x="' + f2(cx + 52 * Math.sin(a)) + '" y="' + f2(cy - 52 * Math.cos(a) + 5) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + INK + '">' + v + '</text>';
  }
  s += '<text x="100" y="152" text-anchor="middle" font-size="14" font-weight="800" fill="' + PURPLE + '">' + (o.unit || '') + '</text>';
  const a = A(value);
  s += '<line class="needle" x1="100" y1="100" x2="' + f2(cx + 74 * Math.sin(a)) + '" y2="' + f2(cy - 74 * Math.cos(a)) + '" stroke="' + RED + '" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="100" r="6" fill="' + RED + '"/>';
  return svgWrap(200, 200, s, { width: 200 });
};
V.decodeDial = function(html){
  function ang(x, y){ let d = Math.atan2(x - 100, 100 - y) * 180 / Math.PI; return d; }
  const L = tagsOf(html, 'dl').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), a: ang(parseFloat(attrOf(t, 'x')), parseFloat(attrOf(t, 'y')) - 5) }; });
  const nd = tagsOf(html, 'needle')[0];
  const na = ang(parseFloat(attrOf(nd, 'x2')), parseFloat(attrOf(nd, 'y2')));
  const a = L[0], b = L[L.length - 1];
  const v = a.v + (na - a.a) / (b.a - a.a) * (b.v - a.v);
  return Math.round(v * 100) / 100;
};

/* ----------------------------------------------------------- STATISTICS */
/* Bar chart. items [{label,value}], scale = gridline step, axisMax. */
V.barChart = function(items, o){
  o = o || {};
  const scale = o.scale || 1, axisMax = o.axisMax || (Math.ceil(Math.max.apply(null, items.map(function(i){ return i.value; })) / scale) * scale);
  const W = 320, H = 200, left = 38, bot = 160, top = 30, pxU = (bot - top) / axisMax;
  const bw = Math.min(48, (W - left - 10) / items.length - 12);
  let s = '';
  const lblEvery = o.labelEvery || scale;
  for(let v = 0; v <= axisMax + 1e-9; v += scale){
    const y = bot - v * pxU;
    s += '<line x1="' + left + '" y1="' + f2(y) + '" x2="' + (W - 6) + '" y2="' + f2(y) + '" stroke="#C9CEE0" stroke-width="1"/>';
    if(Math.abs(v / lblEvery - Math.round(v / lblEvery)) < 1e-9) s += '<text class="yl" data-v="' + v + '" x="' + (left - 6) + '" y="' + f2(y + 4) + '" text-anchor="end" font-size="12" font-weight="700" fill="' + INK + '">' + v + '</text>';
  }
  s += '<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + bot + '" stroke="' + INK + '" stroke-width="2.5"/><line x1="' + left + '" y1="' + bot + '" x2="' + (W - 6) + '" y2="' + bot + '" stroke="' + INK + '" stroke-width="2.5"/>';
  const slot = (W - left - 10) / items.length;
  items.forEach(function(it, i){
    const bx = left + 6 + i * slot + (slot - 6 - bw) / 2, h = it.value * pxU;
    s += '<rect class="bar" data-label="' + it.label + '" x="' + f2(bx) + '" y="' + f2(bot - h) + '" width="' + f2(bw) + '" height="' + f2(h) + '" rx="3" fill="' + (it.color || (i % 2 ? PURPLE : BLUE)) + '" stroke="' + INK + '" stroke-width="1.5"/>';
    s += '<text class="cat" x="' + f2(bx + bw / 2) + '" y="' + (bot + 16) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + INK + '">' + it.label + '</text>';
  });
  if(o.yTitle) s += '<text x="8" y="12" font-size="11" font-weight="800" fill="' + PURPLE + '">' + o.yTitle + '</text>';
  return svgWrap(W, H, s, { width: W });
};
/* decode -> {label:value,...} from bar HEIGHTS measured against the y-axis labels */
V.decodeBarChart = function(html){
  const L = tagsOf(html, 'yl').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), y: parseFloat(attrOf(t, 'y')) - 4 }; });
  const a = L[0], b = L[L.length - 1];
  const out = {};
  tagsOf(html, 'bar').forEach(function(t){
    const top = parseFloat(attrOf(t, 'y'));
    out[attrOf(t, 'data-label')] = Math.round((a.v + (top - a.y) / (b.y - a.y) * (b.v - a.v)) * 100) / 100;
  });
  return out;
};

/* Pictogram: rows [{label, count (may end in .5), emoji}], key = value of one symbol */
V.pictogram = function(rows, key){
  let s = '<div class="pict" style="display:inline-block;text-align:left;background:#fff;border:3px solid ' + INK + ';border-radius:14px;padding:10px 14px;color:' + INK + '">';
  rows.forEach(function(r){
    const whole = Math.floor(r.count + 1e-9), half = (r.count - whole) > 0.25;
    let syms = '';
    for(let i = 0; i < whole; i++) syms += '<span class="sym" style="font-size:24px">' + r.emoji + '</span>';
    if(half) syms += '<span class="sym half" style="font-size:24px;display:inline-block;width:.55em;overflow:hidden;vertical-align:bottom">' + r.emoji + '</span>';
    s += '<div class="pgrow" data-label="' + r.label + '" style="display:flex;align-items:center;gap:8px;margin:4px 0;color:'+INK+';background:none;padding:0"><span style="width:84px;flex:none;font-weight:800;color:'+INK+'">' + r.label + '</span><span style="display:flex;flex-wrap:wrap;align-items:center">' + syms + '</span></div>';
  });
  s += '<div style="margin-top:6px;font-weight:800;border-top:2px dashed #C9CEE0;padding-top:6px">Key: <span style="font-size:20px">' + rows[0].emoji + '</span> = ' + key + '</div></div>';
  return s;
};
V.decodePictogram = function(html){
  const key = parseFloat(/=\s*([\d.]+)\s*</.exec(html)[1]);
  const out = {};
  html.split('<div class="pgrow"').slice(1).forEach(function(chunk){
    const label = /data-label="([^"]*)"/.exec(chunk)[1];
    const whole = (chunk.match(/<span class="sym" /g) || []).length, half = (chunk.match(/<span class="sym half"/g) || []).length;
    out[label] = (whole + half * 0.5) * key;
  });
  return out;
};

/* Tally marks */
V.tally = function(n){
  const groups = Math.floor(n / 5), rem = n % 5; let s = '', x = 10;
  for(let g = 0; g < groups; g++){
    for(let i = 0; i < 4; i++) s += '<line class="tal" x1="' + (x + i * 9) + '" y1="8" x2="' + (x + i * 9) + '" y2="44" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/>';
    s += '<line class="talx" x1="' + (x - 6) + '" y1="38" x2="' + (x + 33) + '" y2="14" stroke="' + RED + '" stroke-width="3.5" stroke-linecap="round"/>';
    x += 52;
  }
  for(let i = 0; i < rem; i++) s += '<line class="tal" x1="' + (x + i * 9) + '" y1="8" x2="' + (x + i * 9) + '" y2="44" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/>';
  return svgWrap(x + rem * 9 + 10, 52, s, { width: Math.min(x + rem * 9 + 10, 340) });
};
V.decodeTally = function(html){ return tagsOf(html, 'tal').length + tagsOf(html, 'talx').length; };

/* ---------------------------------------------------------------- MONEY */
V.coins = function(list){
  let s = '<div class="coins" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:320px">';
  list.forEach(function(p){
    const isNote = p >= 500, isPound = p >= 100 && p < 500, silver = [1, 2].indexOf(p) === -1;
    const label = p >= 100 ? '£' + (p / 100) : p + 'p';
    if(isNote) s += '<div class="coin note" data-p="' + p + '" style="min-width:74px;height:44px;border-radius:6px;background:#A8E6A3;border:3px solid #3C8D40;color:#1B4D1E;display:flex;align-items:center;justify-content:center;font:800 17px system-ui">' + label + '</div>';
    else s += '<div class="coin" data-p="' + p + '" style="width:' + (p >= 50 ? 52 : p >= 20 ? 46 : 44) + 'px;height:' + (p >= 50 ? 52 : p >= 20 ? 46 : 44) + 'px;border-radius:50%;background:' + (isPound ? 'linear-gradient(135deg,#F2C94C,#C0C0C0)' : (silver ? '#D9DCE4' : '#D98E5F')) + ';border:3px solid ' + INK + ';color:' + INK + ';display:flex;align-items:center;justify-content:center;font:800 15px system-ui">' + label + '</div>';
  });
  return s + '</div>';
};
V.decodeCoins = function(html){
  return tagsOf(html, 'coin').reduce(function(t, c){ return t + parseInt(attrOf(c, 'data-p'), 10); }, 0);
};

/* ------------------------------------------------------------- GEOMETRY */
/* Polygons are drawn from explicit points so the decoder can measure sides & angles */
V.SHAPES = {
  triangle_equilateral: [[100,20],[170,140],[30,140]],
  triangle_right:       [[40,30],[40,140],[170,140]],
  triangle_isosceles:   [[100,20],[160,140],[40,140]],
  triangle_scalene:     [[30,140],[170,140],[120,24]],
  square:               [[50,30],[150,30],[150,130],[50,130]],
  rectangle:            [[30,45],[170,45],[170,125],[30,125]],
  rhombus:              [[100,40],[170,90],[100,140],[30,90]],
  parallelogram:        [[60,40],[170,40],[140,130],[30,130]],
  trapezium:            [[70,40],[130,40],[170,130],[30,130]],
  kite:                 [[100,16],[150,60],[100,150],[50,60]],
  pentagon:             null, hexagon: null, octagon: null   // regular, generated
};
V.regularPoints = function(n, cx, cy, r, rot){
  const pts = []; rot = rot === undefined ? -Math.PI / 2 : rot;
  for(let i = 0; i < n; i++){ const a = rot + i * 2 * Math.PI / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
};
V.shapePoints = function(name){
  if(name === 'pentagon') return V.regularPoints(5, 100, 85, 68);
  if(name === 'hexagon') return V.regularPoints(6, 100, 85, 68, 0);
  if(name === 'octagon') return V.regularPoints(8, 100, 85, 68, Math.PI / 8);
  return V.SHAPES[name];
};
V.polygon = function(pts, o){
  o = o || {};
  const pstr = pts.map(function(p){ return f2(p[0]) + ',' + f2(p[1]); }).join(' ');
  let s = '<polygon class="poly" points="' + pstr + '" fill="' + (o.fill || '#CFE1FF') + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
  if(o.marks){ // tiny square marks at right angles
    const n = pts.length;
    for(let i = 0; i < n; i++){
      const p0 = pts[(i + n - 1) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
      if(Math.abs(v1[0] * v2[0] + v1[1] * v2[1]) / (l1 * l2) < 0.01){
        const u1 = [v1[0] / l1 * 12, v1[1] / l1 * 12], u2 = [v2[0] / l2 * 12, v2[1] / l2 * 12];
        s += '<polyline class="rtmark" points="' + f2(p1[0] + u1[0]) + ',' + f2(p1[1] + u1[1]) + ' ' + f2(p1[0] + u1[0] + u2[0]) + ',' + f2(p1[1] + u1[1] + u2[1]) + ' ' + f2(p1[0] + u2[0]) + ',' + f2(p1[1] + u2[1]) + '" fill="none" stroke="' + RED + '" stroke-width="2.5"/>';
      }
    }
  }
  return svgWrap(200, 170, s, { width: o.width || 190 });
};
V.shape2D = function(name, o){ return V.polygon(V.shapePoints(name), o); };
V.circle = function(o){
  return svgWrap(200, 170, '<circle class="circ" cx="100" cy="85" r="66" fill="#CFE1FF" stroke="' + INK + '" stroke-width="4"/>', { width: (o && o.width) || 190 });
};
/* geometric decoder: reads the polygon's points, returns facts */
V.decodePolygon = function(html){
  const tag = tagsOf(html, 'poly')[0]; if(!tag) return null;
  const pts = []; const m = attrOf(tag, 'points').trim().split(/\s+/);
  m.forEach(function(p){ const xy = p.split(',').map(Number); pts.push(xy); });
  const n = pts.length; const sides = [], angles = [];
  for(let i = 0; i < n; i++){
    const a = pts[i], b = pts[(i + 1) % n], c = pts[(i + n - 1) % n];
    sides.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
    const v1 = [c[0] - a[0], c[1] - a[1]], v2 = [b[0] - a[0], b[1] - a[1]];
    angles.push(Math.acos((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))) * 180 / Math.PI);
  }
  const tol = 0.8;
  let rightAngles = angles.filter(function(a){ return Math.abs(a - 90) < tol; }).length;
  let equalSides = 0; // number of sides equal to the longest-frequency length
  const groups = {}; sides.forEach(function(s){ const k = Math.round(s / 1.5); groups[k] = (groups[k] || 0) + 1; });
  equalSides = Math.max.apply(null, Object.keys(groups).map(function(k){ return groups[k]; }));
  // parallel pairs among the sides
  let parallel = 0;
  for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++){
    const a1 = pts[i], a2 = pts[(i + 1) % n], b1 = pts[j], b2 = pts[(j + 1) % n];
    const d1 = [a2[0] - a1[0], a2[1] - a1[1]], d2 = [b2[0] - b1[0], b2[1] - b1[1]];
    if(Math.abs(d1[0] * d2[1] - d1[1] * d2[0]) / (Math.hypot(d1[0], d1[1]) * Math.hypot(d2[0], d2[1])) < 0.004) parallel++;
  }
  return { vertices: n, sides: n, rightAngles: rightAngles, equalSides: equalSides, parallelPairs: parallel, allEqual: new Set(Object.keys(groups)).size === 1 };
};
V.decodeCircle = function(html){ return tagsOf(html, 'circ').length === 1 ? { vertices: 0, sides: 0, curved: true } : null; };

/* 3D shapes: simple clear SVG pictures (facts come from V.FACTS3D, a hand-checked table) */
V.FACTS3D = {
  cube:      { faces: 6, edges: 12, vertices: 8, flat: 6, curved: 0 },
  cuboid:    { faces: 6, edges: 12, vertices: 8, flat: 6, curved: 0 },
  'square-based pyramid': { faces: 5, edges: 8, vertices: 5, flat: 5, curved: 0 },
  'triangular prism':     { faces: 5, edges: 9, vertices: 6, flat: 5, curved: 0 },
  cylinder:  { faces: 3, edges: 2, vertices: 0, flat: 2, curved: 1 },
  cone:      { faces: 2, edges: 1, vertices: 1, flat: 1, curved: 1 },
  sphere:    { faces: 1, edges: 0, vertices: 0, flat: 0, curved: 1 }
};
V.shape3D = function(name){
  const st = 'stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"';
  let s = '';
  if(name === 'cube') s = '<polygon points="40,60 110,60 110,130 40,130" fill="#CFE1FF" ' + st + '/><polygon points="40,60 70,32 140,32 110,60" fill="#EAF2FF" ' + st + '/><polygon points="110,60 140,32 140,102 110,130" fill="#9FC2F7" ' + st + '/>';
  else if(name === 'cuboid') s = '<polygon points="25,66 130,66 130,126 25,126" fill="#CFE1FF" ' + st + '/><polygon points="25,66 55,38 160,38 130,66" fill="#EAF2FF" ' + st + '/><polygon points="130,66 160,38 160,98 130,126" fill="#9FC2F7" ' + st + '/>';
  else if(name === 'square-based pyramid') s = '<polygon points="30,120 120,120 170,95 80,95" fill="#CFE1FF" ' + st + '/><polygon points="30,120 120,120 95,25" fill="#9FC2F7" ' + st + '/><polygon points="120,120 170,95 95,25" fill="#EAF2FF" ' + st + '/>';
  else if(name === 'triangular prism') s = '<polygon points="30,120 100,120 65,60" fill="#CFE1FF" ' + st + '/><polygon points="65,60 100,120 160,95 125,35" fill="#EAF2FF" ' + st + '/><polygon points="100,120 160,95 125,35 65,60" fill="none" ' + st + '/><polygon points="30,120 100,120 160,95 90,95" fill="#9FC2F7" ' + st + '/>';
  else if(name === 'cylinder') s = '<path d="M45 40 L45 125 A45 16 0 0 0 135 125 L135 40" fill="#CFE1FF" ' + st + '/><ellipse cx="90" cy="40" rx="45" ry="16" fill="#EAF2FF" ' + st + '/>';
  else if(name === 'cone') s = '<path d="M90 18 L48 120 A42 15 0 0 0 132 120 Z" fill="#CFE1FF" ' + st + '/><ellipse cx="90" cy="120" rx="42" ry="15" fill="none" ' + st + '/>';
  else if(name === 'sphere') s = '<circle cx="90" cy="75" r="56" fill="#CFE1FF" ' + st + '/><ellipse cx="90" cy="75" rx="56" ry="16" fill="none" ' + st + ' stroke-dasharray="6 5" opacity=".5"/>';
  return svgWrap(180, 150, s, { width: 170 });
};

/* Angles. arms from vertex (60,120): one along +x, other at `deg` counter-clockwise */
V.angle = function(deg, o){
  o = o || {};
  const W = 220, H = 170, L = 92, a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a);
  // centre the whole angle (both arms) in the picture so obtuse / reflex angles never leave it
  const xmin = Math.min(0, L * c), xmax = Math.max(L, L * c), ymax = Math.max(0, L * sn), ymin = Math.min(0, L * sn);
  const vx = (W - (xmax - xmin)) / 2 - xmin, vy = H / 2 + (ymax + ymin) / 2;
  const ex = vx + L, ey = vy, tx = vx + L * c, ty = vy - L * sn;
  let s = '<line class="arm" x1="' + f2(vx) + '" y1="' + f2(vy) + '" x2="' + f2(ex) + '" y2="' + f2(ey) + '" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
  s += '<line class="arm" x1="' + f2(vx) + '" y1="' + f2(vy) + '" x2="' + f2(tx) + '" y2="' + f2(ty) + '" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
  if(Math.abs(deg - 90) < 0.01) s += '<polyline points="' + f2(vx + 18) + ',' + f2(vy) + ' ' + f2(vx + 18) + ',' + f2(vy - 18) + ' ' + f2(vx) + ',' + f2(vy - 18) + '" fill="none" stroke="' + RED + '" stroke-width="3"/>';
  else {
    const r = 28, x2 = vx + r * c, y2 = vy - r * sn;
    s += '<path d="M' + f2(vx + r) + ' ' + f2(vy) + ' A' + r + ' ' + r + ' 0 ' + (deg > 180 ? 1 : 0) + ' 0 ' + f2(x2) + ' ' + f2(y2) + '" fill="none" stroke="' + RED + '" stroke-width="3"/>';
  }
  s += '<circle cx="' + f2(vx) + '" cy="' + f2(vy) + '" r="4" fill="' + INK + '"/>';
  return svgWrap(W, H, s, { width: 200 });
};
V.decodeAngle = function(html){
  const arms = tagsOf(html, 'arm').map(function(t){ return [parseFloat(attrOf(t, 'x2')) - parseFloat(attrOf(t, 'x1')), -(parseFloat(attrOf(t, 'y2')) - parseFloat(attrOf(t, 'y1')))]; });
  const a1 = Math.atan2(arms[0][1], arms[0][0]), a2 = Math.atan2(arms[1][1], arms[1][0]);
  let d = (a2 - a1) * 180 / Math.PI; if(d < 0) d += 360;
  return Math.round(d);
};
/* Pair of lines: kind 'parallel' | 'perpendicular' | 'neither' (drawn with direction vectors) */
V.linePair = function(kind, seed){
  const t = (seed || 0) % 3;
  let l1, l2;
  if(kind === 'parallel'){ const dy = [[0,0],[0,0],[0,0]]; const ang = [0, 25, -30][t] * Math.PI / 180, dx = Math.cos(ang) * 120, dyy = Math.sin(ang) * 120; l1 = [[40, 50, 40 + dx, 50 + dyy]]; l2 = [[40, 110, 40 + dx, 110 + dyy]]; }
  else if(kind === 'perpendicular'){ const ang = [0, 20, -25][t] * Math.PI / 180; const cx = 100, cy = 80; const dx = Math.cos(ang) * 60, dy = Math.sin(ang) * 60; l1 = [[cx - dx, cy - dy, cx + dx, cy + dy]]; l2 = [[cx + dy, cy - dx, cx - dy, cy + dx]]; }
  else { const cx = 100, cy = 80; const a1 = [10, 25, -15][t] * Math.PI / 180, a2 = [70, 55, 40][t] * Math.PI / 180; l1 = [[cx - Math.cos(a1) * 60, cy - Math.sin(a1) * 60, cx + Math.cos(a1) * 60, cy + Math.sin(a1) * 60]]; l2 = [[cx - Math.cos(a2) * 60, cy - Math.sin(a2) * 60, cx + Math.cos(a2) * 60, cy + Math.sin(a2) * 60]]; }
  let s = '';
  [l1[0], l2[0]].forEach(function(l, i){ s += '<line class="ln" x1="' + f2(l[0]) + '" y1="' + f2(l[1]) + '" x2="' + f2(l[2]) + '" y2="' + f2(l[3]) + '" stroke="' + (i ? PURPLE : BLUE) + '" stroke-width="6" stroke-linecap="round"/>'; });
  return svgWrap(200, 160, s, { width: 200 });
};
V.decodeLinePair = function(html){
  const L = tagsOf(html, 'ln').map(function(t){ return [parseFloat(attrOf(t, 'x2')) - parseFloat(attrOf(t, 'x1')), parseFloat(attrOf(t, 'y2')) - parseFloat(attrOf(t, 'y1'))]; });
  const a = L[0], b = L[1];
  const cross = Math.abs(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]));
  const dot = Math.abs(a[0] * b[0] + a[1] * b[1]) / (Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]));
  if(cross < 0.01) return 'parallel';
  if(dot < 0.01) return 'perpendicular';
  return 'neither';
};

/* Coordinate grid (first quadrant) with one plotted point: used for the Year 4 bridge */
V.grid = function(maxV, pt){
  const S = 28, ox = 34, oy = 34 + maxV * S; let s = '';
  for(let i = 0; i <= maxV; i++){
    s += '<line x1="' + (ox + i * S) + '" y1="' + (oy - maxV * S) + '" x2="' + (ox + i * S) + '" y2="' + oy + '" stroke="#C9CEE0" stroke-width="1"/><line x1="' + ox + '" y1="' + (oy - i * S) + '" x2="' + (ox + maxV * S) + '" y2="' + (oy - i * S) + '" stroke="#C9CEE0" stroke-width="1"/>';
    s += '<text class="gx" data-v="' + i + '" x="' + (ox + i * S) + '" y="' + (oy + 21) + '" text-anchor="middle" font-size="15" font-weight="800" fill="' + INK + '">' + i + '</text><text class="gy" data-v="' + i + '" x="' + (ox - 13) + '" y="' + (oy - i * S + 4) + '" text-anchor="end" font-size="15" font-weight="800" fill="' + INK + '">' + i + '</text>';
  }
  s += '<line x1="' + ox + '" y1="' + (oy - maxV * S) + '" x2="' + ox + '" y2="' + oy + '" stroke="' + INK + '" stroke-width="3"/><line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + maxV * S) + '" y2="' + oy + '" stroke="' + INK + '" stroke-width="3"/>';
  if(pt) s += '<circle class="pt" cx="' + (ox + pt[0] * S) + '" cy="' + (oy - pt[1] * S) + '" r="8" fill="' + RED + '" stroke="#fff" stroke-width="2"/>';
  return svgWrap(ox + maxV * S + 16, oy + 32, s, { width: Math.min(ox + maxV * S + 16, 320) });
};
V.decodeGrid = function(html){
  const gx = tagsOf(html, 'gx').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), p: parseFloat(attrOf(t, 'x')) }; });
  const gy = tagsOf(html, 'gy').map(function(t){ return { v: parseFloat(attrOf(t, 'data-v')), p: parseFloat(attrOf(t, 'y')) - 4 }; });
  const pt = tagsOf(html, 'pt')[0];
  const px = parseFloat(attrOf(pt, 'cx')), py = parseFloat(attrOf(pt, 'cy'));
  const x = gx[0].v + (px - gx[0].p) / (gx[gx.length - 1].p - gx[0].p) * (gx[gx.length - 1].v - gx[0].v);
  const y = gy[0].v + (py - gy[0].p) / (gy[gy.length - 1].p - gy[0].p) * (gy[gy.length - 1].v - gy[0].v);
  return { x: Math.round(x), y: Math.round(y) };
};

/* Bar model (part-whole / comparison) — text-labelled, used for word problems.
   parts: [{label, value|'?'}], total label optional */
V.barModel = function(parts, total){
  let s = '<div class="barmodel" style="display:inline-block;min-width:240px;max-width:320px;color:' + INK + '">';
  if(total !== undefined) s += '<div style="text-align:center;font-weight:900;border:3px solid ' + INK + ';border-bottom:none;border-radius:10px 10px 0 0;padding:4px;background:#FFF3C4">' + total + '</div>';
  s += '<div style="display:flex;border:3px solid ' + INK + ';border-radius:' + (total !== undefined ? '0 0 10px 10px' : '10px') + ';overflow:hidden">';
  parts.forEach(function(p, i){
    s += '<div class="bpart" data-v="' + p.value + '" style="flex:' + (p.flex || 1) + ';text-align:center;padding:12px 4px;font-weight:900;font-size:20px;background:' + (i % 2 ? '#E6D4FF' : '#CFE1FF') + ';' + (i ? 'border-left:3px solid ' + INK + ';' : '') + '">' + p.value + '</div>';
  });
  return s + '</div></div>';
};

/* Option renderers: small versions used as picture ANSWER choices */
V.smallClock = function(h, m, o){ return V.clock(h, m, Object.assign({ width: 120, hideNumbers: false }, o || {})); };
V.smallBar = function(num, den){ return V.fractionBar(num, den); };


/* =====================================================================
   VIS REGISTRY — lessons describe pictures as data: {kind, args}.
   V.render(vis) draws it; V.verify(vis) decodes the DRAWING and compares it
   with the numbers the lesson claims. Returns '' when OK, else an error text.
   ===================================================================== */
V.extra = {};   // strand files may register extra picture kinds: V.extra.myKind = { render:function(...args){return html}, verify:function(args){return '' | 'error'} }
V.render = function(vis){
  if(typeof vis === 'string') return vis;
  const a = vis.args || [];
  if(V.extra[vis.kind]) return V.extra[vis.kind].render.apply(null, a);
  switch(vis.kind){
    case 'clock': return V.clock.apply(null, a);
    case 'digital': return V.digital.apply(null, a);
    case 'fractionBar': return V.fractionBar.apply(null, a);
    case 'fractionCircle': return V.fractionCircle.apply(null, a);
    case 'numberLine': return V.numberLine.apply(null, a);
    case 'baseTen': return V.baseTen.apply(null, a);
    case 'array': return V.array.apply(null, a);
    case 'groups': return V.groups.apply(null, a);
    case 'dots': return V.dots.apply(null, a);
    case 'ruler': return V.ruler.apply(null, a);
    case 'jug': return V.jug.apply(null, a);
    case 'dial': return V.dial.apply(null, a);
    case 'barChart': return V.barChart.apply(null, a);
    case 'pictogram': return V.pictogram.apply(null, a);
    case 'tally': return V.tally.apply(null, a);
    case 'coins': return V.coins.apply(null, a);
    case 'angle': return V.angle.apply(null, a);
    case 'shape2D': return V.shape2D.apply(null, a);
    case 'circle': return V.circle.apply(null, a);
    case 'shape3D': return V.shape3D.apply(null, a);
    case 'linePair': return V.linePair.apply(null, a);
    case 'grid': return V.grid.apply(null, a);
    case 'barModel': return V.barModel.apply(null, a);
    case 'html': return a[0];
    default: throw new Error('unknown vis kind ' + vis.kind);
  }
};
V.verify = function(vis){
  if(typeof vis === 'string') return 'lesson visuals must be {kind,args} objects, not raw strings';
  const a = vis.args || [], html = V.render(vis);
  if(V.extra[vis.kind]) return V.extra[vis.kind].verify(a, html) || '';
  function eq(x, y){ return JSON.stringify(x) === JSON.stringify(y); }
  switch(vis.kind){
    case 'clock': { const d = V.decodeClock(html); return (d.h === (a[0] % 12 || 12) && d.m === a[1]) ? '' : 'clock draws ' + d.h + ':' + d.m + ' not ' + a[0] + ':' + a[1]; }
    case 'digital': { const d = V.decodeDigital(html); return (d && d.h === a[0] && d.m === a[1]) ? '' : 'digital mismatch'; }
    case 'fractionBar': { const d = V.decodeFractionBar(html); return (d.num === a[0] && d.den === a[1]) ? '' : 'fractionBar draws ' + d.num + '/' + d.den; }
    case 'fractionCircle': { const d = V.decodeFractionCircle(html); return (d.num === a[0] && d.den === a[1]) ? '' : 'fractionCircle draws ' + d.num + '/' + d.den; }
    case 'numberLine': { const mk = (a[0].marks || [])[0]; if(!mk) return ''; const d = V.decodeNumberLine(html); return Math.abs(d - mk.value) < 1e-6 ? '' : 'numberLine marker at ' + d + ' not ' + mk.value; }
    case 'baseTen': { const d = V.decodeBaseTen(html); return d === a[0] * 100 + a[1] * 10 + a[2] ? '' : 'baseTen draws ' + d; }
    case 'array': { const d = V.decodeArray(html); return (d.rows === a[0] && d.cols === a[1]) ? '' : 'array draws ' + d.rows + 'x' + d.cols; }
    case 'groups': { const d = V.decodeGroups(html); return (d.groups === a[0] && d.per === a[1]) ? '' : 'groups draws ' + d.groups + ' of ' + d.per; }
    case 'dots': return V.decodeDots(html) === a[0] ? '' : 'dots count mismatch';
    case 'ruler': return Math.abs(V.decodeRuler(html) - a[0]) < 0.011 ? '' : 'ruler object is ' + V.decodeRuler(html) + ' not ' + a[0];
    case 'jug': return Math.abs(V.decodeJug(html) - a[0]) < Math.max(1, a[1] / 400) ? '' : 'jug shows ' + V.decodeJug(html) + ' not ' + a[0];
    case 'dial': return Math.abs(V.decodeDial(html) - a[0]) < Math.max(1, a[1] / 300) ? '' : 'dial shows ' + V.decodeDial(html) + ' not ' + a[0];
    case 'barChart': { const d = V.decodeBarChart(html); for(let i = 0; i < a[0].length; i++) if(Math.abs(d[a[0][i].label] - a[0][i].value) > 0.011) return 'bar ' + a[0][i].label + ' drawn as ' + d[a[0][i].label]; return ''; }
    case 'pictogram': { const d = V.decodePictogram(html); for(let i = 0; i < a[0].length; i++) if(Math.abs(d[a[0][i].label] - a[0][i].count * a[1]) > 1e-6) return 'pictogram row ' + a[0][i].label + ' reads ' + d[a[0][i].label]; return ''; }
    case 'tally': return V.decodeTally(html) === a[0] ? '' : 'tally draws ' + V.decodeTally(html);
    case 'coins': return V.decodeCoins(html) === a[0].reduce(function(x, y){ return x + y; }, 0) ? '' : 'coins total mismatch';
    case 'angle': return V.decodeAngle(html) === Math.round(a[0]) ? '' : 'angle draws ' + V.decodeAngle(html);
    case 'linePair': return V.decodeLinePair(html) === a[0] ? '' : 'linePair draws ' + V.decodeLinePair(html);
    case 'grid': { if(!a[1]) return ''; const d = V.decodeGrid(html); return (d.x === a[1][0] && d.y === a[1][1]) ? '' : 'grid point at ' + d.x + ',' + d.y; }
    case 'shape2D': case 'circle': case 'shape3D': case 'barModel': case 'html': return '';   // verified by the question's own facts table / decoders
    default: return 'unknown vis kind';
  }
};

if(typeof module !== 'undefined') module.exports = V;
