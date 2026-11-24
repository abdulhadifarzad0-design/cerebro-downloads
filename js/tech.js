/* Cerebro · "Software that understands software."
   The intelligence layer as one continuous scene:
     human intent → interface understanding → tool selection → adaptive workspace.
   Desktop: native scroll drives a sticky stage (nothing is hijacked).
   Small screens / reduced motion: four stacked stages, one frame each.
   The canvas is decorative (aria-hidden); every fact it shows is also in the text. */
(function () {
  "use strict";

  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var TAU = Math.PI * 2;
  var BODY = '"Geist", "SF Pro Text", -apple-system, "Segoe UI", system-ui, sans-serif';
  var MONO = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';
  var INK = "#ecebe7", MUTED = "#9b9a96", DIM = "#82817d", RED = "#e0243f", RED_HI = "#ff4d66";

  // The scene lives on a 1000 × 800 plane that is scaled to fit its box.
  var WW = 1000, WH = 800;
  var C = { x: 468, y: 400 }, CORE_R = 72, CORE_BOX = 178;
  var APP = { x: 770, y: 290, w: 206, h: 244 };
  var DIMS = [
    { x: 30, y: 74, w: 172, h: 112, name: "Photopea", meta: "Chrome extension · 83 controls", kind: "photo" },
    { x: 30, y: 594, w: 186, h: 124, name: "Blender", meta: "Blender plugin · 1,207 operations", kind: "3d" }
  ];
  var PANEL = { x: 612, y: 600, w: 312, h: 188 };
  var GOAL = "Create a monthly budget";
  var PICKS = ["Table", "Add Category", "SUM", "Currency", "Chart"];
  var ROWS = ["New table", "Group categories", "Total it", "Format as currency", "Insert a chart"];
  var SPOTS = [[-58, 212], [-27, 194], [3, 232], [33, 198], [60, 222]];
  var STAGE_AT = [0, 0.28, 0.52, 0.76, 1];
  var MINI_P = [0.152, 0.47, 0.705, 1];
  // each small frame zooms into the part of the scene its stage is about (5:4 crops)
  var MINI_CROP = [{ x: 0, y: 96, w: 760, h: 608 }, { x: 236, y: 170, w: 764, h: 611 }, { x: 236, y: 170, w: 764, h: 611 }, { x: 280, y: 214, w: 720, h: 576 }];

  var STEPS = [
    { t: "Human intent", b: "Tell Cerebro what you want, in your own words. There are no menus to learn first.",
      f: "Goal · “Create a monthly budget” in Numbers" },
    { t: "Interface understanding", b: "Cerebro reads the controls the app you’re using actually exposes, through macOS Accessibility, its Chrome extension or a native plugin. Nothing is memorized, so it works in apps it has never seen.",
      f: "Numbers · 465 controls found" },
    { t: "Tool selection", b: "The planner chooses only from controls Cerebro found, so it can’t invent actions. Delete, send, pay and quit always need your confirmation, and password fields are never touched.",
      f: "AI planning is optional. With your Anthropic key, only your goal, the app’s name and the names of its controls are sent. Without one, Cerebro plans on your Mac." },
    { t: "Adaptive workspace", b: "A focused workspace assembles from the chosen tools. Its buttons operate the real app, and Cerebro checks that each action actually happened.",
      f: "Typing and sliders stay yours: those tools are pointed out, not pressed." }
  ];

  /* ---------------- helpers ---------------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function line(ctx, x0, y0, x1, y1) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function rgba(hexOrRgb, a) { return hexOrRgb.replace("A", a.toFixed(3)); }
  var GREY = "rgba(236,235,231,A)", REDA = "rgba(224,36,63,A)", REDHA = "rgba(255,77,102,A)";

  /* ---------------- the graph (fixed, deterministic) ---------------- */
  var GRAPH = (function () {
    var rand = rng(11), nodes = [];
    SPOTS.forEach(function (s, i) {
      var a = s[0] * Math.PI / 180;
      nodes.push({ x: C.x + Math.cos(a) * s[1], y: C.y + Math.sin(a) * s[1], r: 3.2, pick: i, ph: rand() * TAU });
    });
    var guard = 0;
    while (nodes.length < 68 && guard++ < 6000) {
      var a = (-102 + rand() * 204) * Math.PI / 180, rad = 122 + Math.pow(rand(), .85) * 176;
      var x = C.x + Math.cos(a) * rad, y = C.y + Math.sin(a) * rad * .94;
      if (x > APP.x - 24 || y < 64 || y > 736) continue;
      if (x > PANEL.x - 18 && y > PANEL.y - 26) continue;
      var clear = true;
      for (var k = 0; k < nodes.length && clear; k++) {
        var dx = nodes[k].x - x, dy = nodes[k].y - y;
        if (dx * dx + dy * dy < 26 * 26) clear = false;
      }
      if (clear) nodes.push({ x: x, y: y, r: 1.5 + rand() * 1.4, pick: -1, ph: rand() * TAU });
    }
    // controls stream out of the app first, then fill in toward the core
    var ax = APP.x, ay = APP.y + APP.h / 2;
    var order = nodes.map(function (n, i) { return { i: i, d: Math.hypot(n.x - ax, n.y - ay) }; })
      .sort(function (a, b) { return a.d - b.d; });
    order.forEach(function (o, r) { nodes[o.i].t = .30 + .15 * r / (order.length - 1); });
    var edges = [], seen = {};
    nodes.forEach(function (n, i) {
      nodes.map(function (m, j) { return { j: j, d: (m.x - n.x) * (m.x - n.x) + (m.y - n.y) * (m.y - n.y) }; })
        .filter(function (o) { return o.j !== i && o.d < 84 * 84; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 2)
        .forEach(function (o) {
          var key = Math.min(i, o.j) + "-" + Math.max(i, o.j);
          if (!seen[key]) { seen[key] = 1; edges.push([i, o.j]); }
        });
    });
    var links = order.slice(0, 10).map(function (o) { return o.i; });
    nodes.forEach(function (n, i) { if (n.pick >= 0 && links.indexOf(i) < 0) links.push(i); });
    var picks = [];
    nodes.forEach(function (n) { if (n.pick >= 0) picks[n.pick] = n; });
    return { nodes: nodes, edges: edges, links: links, picks: picks };
  })();

  function corePower(p) {
    if (p < .05) return .6;
    if (p < .24) return .75;
    if (p < .34) return 1.3;
    if (p < .52) return .9;
    if (p < .76) return 1;
    if (p < .9) return 1.18;
    return .95;
  }

  /* ---------------- drawing ---------------- */
  function text(ctx, s, str, x, y, px, o) {
    o = o || {};
    ctx.font = (o.w || 400) + " " + (px / s).toFixed(2) + "px " + (o.mono ? MONO : BODY);
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "alphabetic";
    ctx.fillStyle = o.color || INK;
    var prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * (o.a == null ? 1 : o.a);
    ctx.fillText(str, x, y);
    ctx.globalAlpha = prev;
  }

  function windowFrame(ctx, r, alpha, kind, bright, px) {
    ctx.save();
    ctx.globalAlpha = alpha;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = "rgba(255,255,255,0.028)"; ctx.fill();
    ctx.lineWidth = px; ctx.strokeStyle = rgba(GREY, bright ? .42 : .2); ctx.stroke();
    ctx.strokeStyle = rgba(GREY, .12); line(ctx, r.x, r.y + 17, r.x + r.w, r.y + 17);
    ctx.fillStyle = rgba(GREY, .28);
    for (var i = 0; i < 3; i++) { circle(ctx, r.x + 11 + i * 9, r.y + 8.5, 2.3); ctx.fill(); }
    var gx = r.x + 10, gy, gw = r.w - 20, gh, k;
    if (kind === "sheet") {
      ctx.fillStyle = rgba(GREY, .13);
      for (k = 0; k < 10; k++) { rr(ctx, r.x + 10 + k * 18.5, r.y + 24, 11, 8, 2); ctx.fill(); }
      gy = r.y + 42; gh = r.h - 52;
      ctx.fillStyle = "rgba(76,199,106,0.12)"; ctx.fillRect(gx, gy, gw, 14);
      ctx.strokeStyle = rgba(GREY, .09);
      for (k = 1; k < 5; k++) line(ctx, gx + gw * k / 5, gy, gx + gw * k / 5, gy + gh);
      for (k = 0; k <= Math.floor(gh / 16); k++) line(ctx, gx, gy + k * 16, gx + gw, gy + k * 16);
    } else if (kind === "photo") {
      gy = r.y + 26; gh = r.h - 34;
      var iw = gw * .72;
      ctx.fillStyle = rgba(GREY, .06); ctx.fillRect(gx, gy, iw, gh);
      ctx.strokeStyle = rgba(GREY, .22); ctx.lineWidth = px;
      ctx.beginPath(); ctx.moveTo(gx, gy + gh * .78); ctx.lineTo(gx + iw * .3, gy + gh * .5); ctx.lineTo(gx + iw * .5, gy + gh * .66);
      ctx.lineTo(gx + iw * .78, gy + gh * .38); ctx.lineTo(gx + iw, gy + gh * .62); ctx.stroke();
      ctx.fillStyle = rgba(GREY, .1);
      for (k = 0; k < 5; k++) { ctx.fillRect(gx + iw + 8, gy + k * 15, gw - iw - 8, 9); }
    } else {
      gy = r.y + 24; gh = r.h - 30;
      ctx.strokeStyle = rgba(GREY, .1); ctx.lineWidth = px;
      for (k = 0; k < 6; k++) line(ctx, gx + gw * k / 5, gy + gh, r.x + r.w / 2 + (gx + gw * k / 5 - r.x - r.w / 2) * .35, gy + gh * .45);
      for (k = 0; k < 4; k++) line(ctx, gx + 8 * k, gy + gh * (.45 + k * .18), gx + gw - 8 * k, gy + gh * (.45 + k * .18));
      var cx = r.x + r.w / 2, cy = gy + gh * .42;
      ctx.strokeStyle = rgba(GREY, .34);
      ctx.beginPath(); ctx.moveTo(cx - 18, cy - 9); ctx.lineTo(cx, cy - 18); ctx.lineTo(cx + 18, cy - 9); ctx.lineTo(cx + 18, cy + 11);
      ctx.lineTo(cx, cy + 20); ctx.lineTo(cx - 18, cy + 11); ctx.closePath(); ctx.moveTo(cx - 18, cy - 9); ctx.lineTo(cx, cy); ctx.lineTo(cx + 18, cy - 9);
      ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 20); ctx.stroke();
    }
    ctx.restore();
  }

  function core2D(ctx, px, power) {
    var g = ctx.createRadialGradient(C.x, C.y, CORE_R * .2, C.x, C.y, CORE_R * 2.6);
    g.addColorStop(0, rgba(REDA, .32 * power)); g.addColorStop(1, rgba(REDA, 0));
    ctx.fillStyle = g; circle(ctx, C.x, C.y, CORE_R * 2.6); ctx.fill();
    ctx.fillStyle = "#0b0b0d"; circle(ctx, C.x, C.y, CORE_R * .9); ctx.fill();
    var pool = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, CORE_R * .9);
    pool.addColorStop(0, rgba(REDA, .5 * power)); pool.addColorStop(1, rgba(REDA, 0));
    ctx.fillStyle = pool; circle(ctx, C.x, C.y, CORE_R * .9); ctx.fill();
    var lg = ctx.createLinearGradient(C.x - CORE_R, C.y - CORE_R, C.x + CORE_R, C.y + CORE_R);
    lg.addColorStop(0, "#fbfbf9"); lg.addColorStop(.42, "#8e9095"); lg.addColorStop(.62, "#e9eaec"); lg.addColorStop(1, "#3c3d42");
    ctx.strokeStyle = lg; ctx.lineWidth = CORE_R * .18; circle(ctx, C.x, C.y, CORE_R * .91); ctx.stroke();
    var lens = ctx.createRadialGradient(C.x - CORE_R * .07, C.y - CORE_R * .07, 0, C.x, C.y, CORE_R * .3);
    lens.addColorStop(0, "#ffc2c2"); lens.addColorStop(.35, RED_HI); lens.addColorStop(.8, "#b0122c"); lens.addColorStop(1, "#5a0714");
    ctx.fillStyle = lens; circle(ctx, C.x, C.y, CORE_R * .3); ctx.fill();
    ctx.strokeStyle = "rgba(220,221,224,0.85)"; ctx.lineWidth = 1.4 * px; circle(ctx, C.x, C.y, CORE_R * .335); ctx.stroke();
  }

  function miniMark(ctx, x, y, px) {
    ctx.fillStyle = rgba(REDA, .25); circle(ctx, x, y, 6.5); ctx.fill();
    ctx.strokeStyle = "#d6d7da"; ctx.lineWidth = 1.6 * px; circle(ctx, x, y, 6); ctx.stroke();
    ctx.fillStyle = RED_HI; circle(ctx, x, y, 2.6); ctx.fill();
  }

  function rowDot(k) { return { x: PANEL.x + 24, y: PANEL.y + 50 + k * 27.5 + 11 }; }

  /* Draw the whole scene for progress p (0..1) at time T (ms). */
  function render(ctx, v, p, T, o) {
    var s = v.s, px = 1 / s, compact = o.compact, i, k, n;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(v.dpr * s, 0, 0, v.dpr * s, v.dpr * v.ox, v.dpr * v.oy);
    ctx.lineCap = "round";
    var power = corePower(p), tsz = compact ? .78 : 1;

    // ambient light and range rings
    var g = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, 390);
    g.addColorStop(0, rgba(REDA, .05 + .07 * power)); g.addColorStop(1, rgba(REDA, 0));
    ctx.fillStyle = g; circle(ctx, C.x, C.y, 390); ctx.fill();
    ctx.lineWidth = px; ctx.strokeStyle = rgba(GREY, .045);
    [150, 258, 366].forEach(function (r) { circle(ctx, C.x, C.y, r); ctx.stroke(); });
    if (!compact) {
      var sweep = (T * .00016) % TAU;
      ctx.strokeStyle = rgba(GREY, .09); ctx.beginPath(); ctx.arc(C.x, C.y, 258, sweep, sweep + .55); ctx.stroke();
    }

    // other apps: same engine, different adapters (dim; Cerebro reads the app you're using)
    DIMS.forEach(function (d) {
      windowFrame(ctx, d, .5, d.kind, false, px);
      text(ctx, s, d.name, d.x, d.y + d.h + 22, 12.5 * tsz, { w: 500, color: MUTED });
      if (!compact) text(ctx, s, d.meta, d.x, d.y + d.h + 40, 11, { mono: true, color: DIM });
      ctx.setLineDash([2 * px, 7 * px]); ctx.strokeStyle = rgba(GREY, .1); ctx.lineWidth = px;
      var sx = d.x + d.w + 6, sy = d.y + d.h / 2, dx = C.x - sx, dy = C.y - sy, dd = Math.hypot(dx, dy);
      line(ctx, sx, sy, C.x - dx / dd * (CORE_R + 10), C.y - dy / dd * (CORE_R + 10));
      ctx.setLineDash([]);
    });

    // the app you're using
    var act = seg(p, .27, .34);
    windowFrame(ctx, APP, .52 + .48 * act, "sheet", act > .5, px);
    text(ctx, s, "Numbers", APP.x, APP.y - 50, 15 * tsz, { w: 600, a: .62 + .38 * act });
    text(ctx, s, "macOS Accessibility", APP.x, APP.y - 31, 11 * tsz, { mono: true, color: act > .5 ? "#b4b3af" : DIM });
    var found = seg(p, .42, .46);
    if (found > 0) text(ctx, s, "465 controls found", APP.x, APP.y - 14, 11 * tsz, { mono: true, color: RED_HI, a: found });
    if (act > 0) text(ctx, s, "In use", APP.x + APP.w, APP.y - 50, 11 * tsz, { mono: true, align: "right", color: RED_HI, a: act });
    var sc = seg(p, .30, .41);
    if (sc > 0 && sc < 1) {
      var sx2 = APP.x + 6 + (APP.w - 12) * sc, sa = Math.sin(sc * Math.PI);
      ctx.strokeStyle = rgba(REDA, .16 * sa); ctx.lineWidth = 9 * px; line(ctx, sx2, APP.y + 20, sx2, APP.y + APP.h - 6);
      ctx.strokeStyle = rgba(REDHA, .9 * sa); ctx.lineWidth = 1.4 * px; line(ctx, sx2, APP.y + 20, sx2, APP.y + APP.h - 6);
    }

    // 1 · human intent travels into the core
    var ia = seg(p, .035, .09), iu = ease(seg(p, .11, .245));
    if (ia > 0 && iu < 1) {
      var fpx = (compact ? 11 : 15) / s;
      ctx.font = "500 " + fpx.toFixed(2) + "px " + BODY;
      var tw = ctx.measureText(GOAL).width, padX = (compact ? 10 : 17) / s, ph = (compact ? 24 : 36) / s, pw = tw + padX * 2 + 6 / s;
      var x0 = 36 + pw / 2, y0 = C.y, cx = lerp(x0, C.x, iu), cy = y0 - Math.sin(iu * Math.PI) * 34;
      var scale = 1 - .86 * seg(iu, .42, 1), al = ia * (1 - seg(iu, .72, 1));
      if (iu > .02) {
        var tg = ctx.createLinearGradient(x0 + pw / 2, y0, cx, cy);
        tg.addColorStop(0, rgba(REDA, 0)); tg.addColorStop(1, rgba(REDHA, .55 * al));
        ctx.strokeStyle = tg; ctx.lineWidth = 1.3 * px;
        ctx.beginPath(); ctx.moveTo(x0 + pw / 2, y0); ctx.quadraticCurveTo((x0 + pw / 2 + cx) / 2, y0 - 22, cx, cy); ctx.stroke();
      }
      ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.globalAlpha = al;
      rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
      ctx.fillStyle = "rgba(18,18,22,0.94)"; ctx.fill();
      ctx.strokeStyle = rgba(GREY, .26); ctx.lineWidth = px; ctx.stroke();
      ctx.fillStyle = INK; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(GOAL, -pw / 2 + padX, .5 / s);
      var blink = (compact || REDUCE) ? 1 : (Math.sin(T * .008) > -.25 ? 1 : .15);
      ctx.fillStyle = rgba(REDHA, blink); ctx.fillRect(-pw / 2 + padX + tw + 3 / s, -ph * .22, 1.6 / s, ph * .44);
      ctx.restore();
      if (!compact) text(ctx, s, "Your goal", x0 - pw / 2 + 4 / s, y0 - ph / 2 - 12 / s, 11, { mono: true, color: DIM, a: ia * (1 - seg(iu, 0, .25)) });
    }
    for (k = 0; k < 2; k++) {
      var ru = seg(p, .245 + k * .035, .345 + k * .035);
      if (ru > 0 && ru < 1) { ctx.strokeStyle = rgba(REDHA, .5 * (1 - ru)); ctx.lineWidth = 1.2 * px; circle(ctx, C.x, C.y, CORE_R + 8 + eo(ru) * 250); ctx.stroke(); }
    }

    // 2 · controls appear as interconnected nodes; 3 · relevant pathways light up
    var nodes = GRAPH.nodes, sel = seg(p, .56, .66), fadeAll = seg(p, .78, .87), jit = compact ? .6 : 1.5;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      n.cx = n.x + Math.sin(T * .0009 + n.ph) * jit;
      n.cy = n.y + Math.cos(T * .0011 + n.ph * 1.3) * jit;
      n.rv = seg(p, n.t, n.t + .035);
      n.fly = n.pick >= 0 ? ease(seg(p, .78 + n.pick * .018, .885 + n.pick * .018)) : 0;
    }
    ctx.lineWidth = px;
    GRAPH.edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      var al = Math.min(a.rv, b.rv) * .085 * (1 - .65 * sel) * (1 - fadeAll);
      if (a.pick >= 0 || b.pick >= 0) al *= (1 - Math.max(a.fly, b.fly));
      if (al < .004) return;
      ctx.strokeStyle = rgba(GREY, al); line(ctx, a.cx, a.cy, b.cx, b.cy);
    });
    GRAPH.links.forEach(function (idx) {
      var m = nodes[idx], isPick = m.pick >= 0;
      var al = m.rv * (isPick ? lerp(.13, .55, sel) * (1 - m.fly) : .13 * (1 - .75 * sel) * (1 - fadeAll));
      if (al < .004) return;
      ctx.strokeStyle = isPick && sel > 0 ? rgba(REDHA, al) : rgba(GREY, al);
      ctx.lineWidth = (isPick ? lerp(1, 1.3, sel) : 1) * px;
      line(ctx, APP.x - 2, clamp(m.cy, APP.y + 26, APP.y + APP.h - 12), m.cx, m.cy);
    });
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.rv <= 0) continue;
      var dxc = n.cx - C.x, dyc = n.cy - C.y, dc = Math.hypot(dxc, dyc);
      var ex = C.x + dxc / dc * (CORE_R + 6), ey = C.y + dyc / dc * (CORE_R + 6);
      if (n.pick >= 0) {
        var pa = n.rv * lerp(.17, .9, sel) * (1 - n.fly);
        if (pa < .004) continue;
        ctx.strokeStyle = sel > 0 ? rgba(REDHA, pa) : rgba(GREY, pa);
        ctx.lineWidth = lerp(1, 1.5, sel) * px;
      } else {
        var na = n.rv * .17 * (1 - .78 * sel) * (1 - fadeAll);
        if (na < .004) continue;
        ctx.strokeStyle = rgba(GREY, na); ctx.lineWidth = px;
      }
      line(ctx, n.cx, n.cy, ex, ey);
    }
    // signal pulses travelling from the chosen controls into the core
    if (sel > 0 && !o.still) {
      GRAPH.picks.forEach(function (m, k2) {
        if (m.fly >= 1) return;
        var f = ((T * .00042) + k2 * .23) % 1;
        var dx3 = C.x - m.cx, dy3 = C.y - m.cy, d3 = Math.hypot(dx3, dy3), reach = (d3 - CORE_R - 6) / d3;
        var qx = m.cx + dx3 * reach * f, qy = m.cy + dy3 * reach * f;
        ctx.fillStyle = rgba(REDHA, sel * (1 - m.fly) * (.35 + .65 * Math.sin(f * Math.PI)));
        circle(ctx, qx, qy, 2.1 * px * (compact ? 1.4 : 1)); ctx.fill();
      });
    }
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.pick >= 0 || n.rv <= 0) continue;
      var da = n.rv * .62 * (1 - .6 * sel) * (1 - fadeAll);
      if (da < .004) continue;
      ctx.fillStyle = "rgba(205,204,200," + da.toFixed(3) + ")"; circle(ctx, n.cx, n.cy, n.r); ctx.fill();
    }

    // safety gate around the core
    var ga = seg(p, .52, .6), gAlpha = ga * (1 - .5 * seg(p, .8, .9));
    if (ga > 0) {
      ctx.setLineDash([3 * px, 5 * px]); ctx.strokeStyle = rgba(GREY, .34 * gAlpha); ctx.lineWidth = px;
      ctx.beginPath(); ctx.arc(C.x, C.y, 112, -Math.PI / 2, -Math.PI / 2 + ga * TAU); ctx.stroke(); ctx.setLineDash([]);
      if (!compact) text(ctx, s, "Safety gate", C.x, C.y - 112 - 10 / s, 10.5, { mono: true, align: "center", color: MUTED, a: .9 * gAlpha });
    }

    if (o.core2D) core2D(ctx, px, power);

    // 4 · the workspace assembles
    var pnl = seg(p, .76, .82);
    if (pnl > 0) {
      ctx.save(); ctx.globalAlpha = pnl; ctx.translate(0, (1 - eo(pnl)) * 14);
      rr(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 14);
      ctx.fillStyle = "rgba(12,12,14,0.94)"; ctx.fill();
      ctx.strokeStyle = rgba(GREY, .17); ctx.lineWidth = px; ctx.stroke();
      miniMark(ctx, PANEL.x + 20, PANEL.y + 22, px);
      text(ctx, s, "Budget workspace", PANEL.x + 35, PANEL.y + 26.5, 13.5 * tsz, { w: 600 });
      var done = seg(p, .9, .93);
      text(ctx, s, done > .5 ? "Ready" : "Building", PANEL.x + PANEL.w - 16, PANEL.y + 26, 11 * tsz, { mono: true, align: "right", color: done > .5 ? RED_HI : DIM });
      ctx.strokeStyle = rgba(GREY, .09); line(ctx, PANEL.x + 12, PANEL.y + 40, PANEL.x + PANEL.w - 12, PANEL.y + 40);
      for (k = 0; k < 5; k++) {
        var ry = PANEL.y + 50 + k * 27.5, ra = seg(GRAPH.picks[k].fly, .9, 1);
        if (ra <= 0) continue;
        rr(ctx, PANEL.x + 12, ry, PANEL.w - 24, 22, 6);
        ctx.fillStyle = "rgba(255,255,255," + (.03 * ra).toFixed(3) + ")"; ctx.fill();
        ctx.strokeStyle = rgba(GREY, .08 * ra); ctx.stroke();
        text(ctx, s, ROWS[k], PANEL.x + 36, ry + 15, 12.5 * tsz, { a: ra });
        text(ctx, s, "Live", PANEL.x + PANEL.w - 22, ry + 15, 10.5 * tsz, { mono: true, align: "right", color: RED_HI, a: ra });
      }
      ctx.restore();
    }
    // the chosen controls: lit in place, then flown into the workspace rows
    var la = seg(p, .6, .66) * (1 - seg(p, .775, .8));
    GRAPH.picks.forEach(function (m, k3) {
      if (m.rv <= 0) return;
      var t = rowDot(k3), fx = lerp(m.cx, t.x, m.fly), fy = lerp(m.cy, t.y, m.fly);
      if (sel > 0) {
        ctx.fillStyle = rgba(REDA, .16 * sel); circle(ctx, fx, fy, m.r + 8); ctx.fill();
        ctx.fillStyle = RED_HI; circle(ctx, fx, fy, m.r + sel * 1.1); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(205,204,200," + (m.rv * .62).toFixed(3) + ")"; circle(ctx, fx, fy, m.r * .8); ctx.fill();
      }
      if (la > 0) text(ctx, s, PICKS[k3], m.cx, m.cy - 13 / s, (compact ? 10 : 12.5), { w: 500, align: "center", a: la });
    });

    // the workspace operates the real app, and checks the result
    var va = seg(p, .885, .95);
    if (va > 0) {
      var vx0 = PANEL.x + PANEL.w - 52, vy0 = PANEL.y - 6, vx1 = APP.x + APP.w * .62, vy1 = APP.y + APP.h + 9;
      var vxe = lerp(vx0, vx1, va), vye = lerp(vy0, vy1, va);
      ctx.setLineDash([4 * px, 4 * px]); ctx.lineDashOffset = o.still ? 0 : -(T * .02) * px;
      ctx.strokeStyle = rgba(REDHA, .8); ctx.lineWidth = 1.3 * px; line(ctx, vx0, vy0, vxe, vye);
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      if (va > .97) {
        var ang = Math.atan2(vy1 - vy0, vx1 - vx0), ah = 7 * px;
        ctx.fillStyle = RED_HI; ctx.beginPath(); ctx.moveTo(vx1, vy1);
        ctx.lineTo(vx1 - Math.cos(ang - .45) * ah, vy1 - Math.sin(ang - .45) * ah);
        ctx.lineTo(vx1 - Math.cos(ang + .45) * ah, vy1 - Math.sin(ang + .45) * ah); ctx.closePath(); ctx.fill();
      }
      if (!compact) text(ctx, s, "Operates the app · checks each step", vx0 - 14 / s, (vy0 + vy1) / 2 + 4 / s, 11, { mono: true, align: "right", color: MUTED, a: seg(va, .35, 1) });
    }
    var ca = seg(p, .94, .985);
    if (ca > 0) {
      var bx = APP.x + APP.w - 15, by = APP.y + 8.5;
      ctx.globalAlpha = ca; ctx.fillStyle = RED; circle(ctx, bx, by, 6.5); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5 * px; ctx.beginPath();
      ctx.moveTo(bx - 3, by); ctx.lineTo(bx - .8, by + 2.4); ctx.lineTo(bx + 3.2, by - 2.6); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }

  /* ---------------- DOM ---------------- */
  function build(section) {
    var steps = STEPS.map(function (st, i) {
      return '<li class="tech-step" data-i="' + i + '">'
        + '<span class="tech-dot" aria-hidden="true"></span>'
        + '<span class="tech-num">0' + (i + 1) + '</span>'
        + '<h3>' + st.t + '</h3>'
        + '<div class="tech-body"><p>' + st.b + '</p><p class="tech-fact">' + st.f + '</p></div>'
        + '<canvas class="tech-mini" aria-hidden="true"></canvas>'
        + '</li>';
    }).join("");
    section.innerHTML = '<div class="tech-stage">'
      + '<div class="tech-copy">'
      + '<p class="status tech-status"><i></i>The intelligence layer</p>'
      + '<h2 id="tech-title" class="tech-title">Software that <span class="chrome-text">understands software.</span></h2>'
      + '<p class="tech-lede">One engine sits between what you want and the app you’re using. Here is what it does in the moment after you ask.</p>'
      + '<div class="tech-track"><span class="tech-rail" aria-hidden="true"><i></i></span><ol class="tech-steps">' + steps + '</ol></div>'
      + '</div>'
      + '<div class="tech-viz" aria-hidden="true"><canvas class="tech-canvas"></canvas><canvas class="tech-core"></canvas></div>'
      + '</div>';
  }

  function fit(canvas, crop) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    crop = crop || { x: 0, y: 0, w: WW, h: WH };
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    var s = Math.min(w / crop.w, h / crop.h);
    return { w: w, h: h, dpr: dpr, s: s, ox: (w - crop.w * s) / 2 - crop.x * s, oy: (h - crop.h * s) / 2 - crop.y * s };
  }

  function wantPinned() {
    return !REDUCE && window.matchMedia("(min-width: 900px)").matches && window.innerHeight >= 560;
  }

  function init(section) {
    if (!section || section.__tech) return;
    section.__tech = true;
    build(section);

    var canvas = section.querySelector(".tech-canvas"), ctx = canvas.getContext("2d");
    var minis = Array.prototype.slice.call(section.querySelectorAll(".tech-mini"));
    var miniCtx = minis.map(function (m) { return m.getContext("2d"); });
    var items = Array.prototype.slice.call(section.querySelectorAll(".tech-step"));
    var rail = section.querySelector(".tech-rail i");
    var view = null, miniViews = [], pinned = null, visible = false, raf = 0, lastIdx = -1, lastPow = -1;
    var miniVisible = minis.map(function () { return false; });
    var core = null, coreEl = section.querySelector(".tech-core"), use2D = true, coreTried = false;

    function setupCore() {
      if (coreTried) return;
      coreTried = true;
      if (!window.CerebroCore || !coreEl) return;
      core = window.CerebroCore(coreEl, {
        state: { power: .6, env: 1, pulse: .35, dist: 4.4, yaw: .1, pitch: -.05, halo: 1, zoom: .62, sweep: -3 },
        mouse: false, fallback: "assets/core.png", maxPixels: 600000
      });
      coreEl = section.querySelector(".tech-core");
      if (core.ok) { use2D = false; return; }
      if (coreEl && coreEl.tagName === "IMG") {
        coreEl.addEventListener("load", function () { use2D = false; paint(); });
        coreEl.addEventListener("error", function () { coreEl.style.display = "none"; use2D = true; paint(); });
      }
    }

    function placeCore() {
      if (!coreEl || !view) return;
      var size = CORE_BOX * view.s;
      coreEl.style.width = size + "px"; coreEl.style.height = size + "px";
      coreEl.style.left = (view.ox + C.x * view.s) + "px"; coreEl.style.top = (view.oy + C.y * view.s) + "px";
    }

    function progress() {
      var r = section.getBoundingClientRect(), total = r.height - window.innerHeight;
      return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    }

    function update(p) {
      var idx = p < STAGE_AT[1] ? 0 : p < STAGE_AT[2] ? 1 : p < STAGE_AT[3] ? 2 : 3;
      if (idx !== lastIdx) {
        items.forEach(function (li, i) {
          li.classList.toggle("is-active", i === idx);
          li.classList.toggle("is-done", i < idx);
          if (i === idx) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
        });
        lastIdx = idx;
      }
      var within = idx < 3 ? seg(p, STAGE_AT[idx], STAGE_AT[idx + 1]) : 0;
      if (rail) rail.style.transform = "scaleY(" + Math.min(1, (idx + within) / 3).toFixed(4) + ")";
      var pw = corePower(p), pulse = (p > .24 && p < .36) ? 1 : .35;
      if (core && core.ok && pw !== lastPow) { core.set({ power: pw, pulse: pulse }); lastPow = pw; }
    }

    function paint(T, onlyVisible) {
      T = T || performance.now();
      if (pinned) {
        if (!view) return;
        var p = progress();
        render(ctx, view, p, T, { compact: false, core2D: use2D, still: REDUCE });
        update(p);
      } else {
        minis.forEach(function (m, i) {
          if (!miniViews[i]) return;
          if (onlyVisible && !miniVisible[i]) return;
          render(miniCtx[i], miniViews[i], MINI_P[i], REDUCE ? 2600 : T, { compact: true, core2D: true, still: REDUCE });
        });
      }
    }

    function loop(T) {
      raf = 0;
      if (!running()) return;
      paint(T, true);
      raf = requestAnimationFrame(loop);
    }
    function running() {
      if (document.hidden || REDUCE) return false;
      return pinned ? visible : miniVisible.some(Boolean);
    }
    function kick() { if (!raf && running()) raf = requestAnimationFrame(loop); }

    function measure() {
      if (pinned) { view = fit(canvas); placeCore(); }
      else miniViews = minis.map(function (m, i) { return fit(m, MINI_CROP[i]); });
      paint();
    }

    function setMode() {
      var want = wantPinned();
      if (want === pinned) return;
      pinned = want;
      section.classList.toggle("is-pinned", pinned);
      section.classList.toggle("is-stacked", !pinned);
      lastIdx = -1;
      if (pinned) { if (coreTried && core && core.ok) core.start(); } // the core itself is created lazily, see below
      else {
        if (core && core.ok) core.stop();
        items.forEach(function (li) { li.classList.remove("is-active", "is-done"); li.removeAttribute("aria-current"); });
      }
      measure();
      kick();
    }

    // visibility: the section (pinned) or each frame (stacked)
    if ("IntersectionObserver" in window) {
      // create the WebGL core only when the section is about to scroll into view
      var lazy = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting || !pinned) return;
        lazy.disconnect(); setupCore(); if (core && core.ok) core.start(); placeCore();
      }, { rootMargin: "700px 0px" });
      lazy.observe(section);
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; kick(); }, { rootMargin: "80px 0px" }).observe(section);
      var mio = new IntersectionObserver(function (en) {
        en.forEach(function (e) { var i = minis.indexOf(e.target); if (i >= 0) miniVisible[i] = e.isIntersecting; });
        kick();
      }, { rootMargin: "60px 0px" });
      minis.forEach(function (m) { mio.observe(m); });
    } else { visible = true; miniVisible = minis.map(function () { return true; }); }

    window.addEventListener("scroll", function () { if (pinned && visible && !raf) requestAnimationFrame(function () { paint(); }); }, { passive: true });
    document.addEventListener("visibilitychange", kick);
    var rt = 0;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { setMode(); measure(); }, 120); });
    if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); }).observe(section);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paint(); });

    setMode();
  }

  function auto() {
    var s = document.getElementById("technology");
    if (!s) return;
    // below the fold: build during idle time unless a link points into the page
    if (location.hash || !("requestIdleCallback" in window)) init(s);
    else requestIdleCallback(function () { init(s); }, { timeout: 1500 });
  }
  window.CerebroTech = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto);
  else auto();
})();
