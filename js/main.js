/* Cerebro site conductor: awakening sequence, the continuous hero scene,
   the application showcase, navigation, reveals and small details.
   Native scrolling only; every scroll-linked effect is computed in one rAF. */
(function () {
  "use strict";
  var d = document, root = d.documentElement;
  var mm = function (q) { return window.matchMedia && matchMedia(q).matches; };
  var reduce = mm("(prefers-reduced-motion: reduce)");
  var fine = mm("(hover: hover) and (pointer: fine)");
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eo(x) { return 1 - Math.pow(1 - x, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------------------------------------------------------- one frame loop for scroll */
  var subs = [], queued = false;
  function onFrame(fn) { subs.push(fn); }
  function tick() { queued = false; var y = window.scrollY, vh = window.innerHeight; for (var i = 0; i < subs.length; i++) subs[i](y, vh); }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", function () { resized(); schedule(); });
  var resizeSubs = [];
  function resized() { resizeSubs.forEach(function (f) { f(); }); }

  var SETTLED = { power: .6, env: 1.2, pulse: .25, dist: 4.3, yaw: -.18, pitch: -.2, halo: 1, zoom: .62, sweep: -3 };
  var scrolly = root.classList.contains("scrolly");

  /* ---------------------------------------------------------- hero core */
  var coreEl = $("#xp-core"), coreOpts = { mouse: true, fallback: "assets/core-512.png", state: SETTLED };
  var core = window.CerebroCore ? window.CerebroCore($("#core-hero"), coreOpts) : { ok: false, set: function () {}, start: function () {}, stop: function () {}, resize: function () {}, state: {}, target: {} };

  var nextSweep = 0, sweepAt = 0;
  function idleFrame(now) { // an occasional light sweep across the chrome
    if (!nextSweep) nextSweep = now + 2600;
    if (!sweepAt && now > nextSweep) { sweepAt = now; nextSweep = now + 9000 + Math.random() * 3500; }
    if (sweepAt) {
      var k = (now - sweepAt) / 1900;
      var s = k <= 1 ? lerp(-1.3, 1.7, eio(k)) : -3;
      core.state.sweep = core.target.sweep = s;
      if (k > 1) sweepAt = 0;
    }
  }

  function introState(ms, s) {
    function u(a, b) { return clamp((ms - a) / (b - a)); }
    var ign = eio(u(650, 1450)), surge = eio(u(1450, 2350)), settle = eio(u(2350, 3050));
    var flick = ms > 650 && ms < 1500 ? .8 + .2 * Math.sin(ms * .045) * Math.sin(ms * .017) : 1;
    s.power = Math.max(0, (.5 * ign + .78 * surge) * flick - .68 * settle);
    s.env = .1 + .12 * eio(u(0, 1300)) + .98 * eio(u(1500, 2600));
    s.pulse = .95 * eio(u(700, 1500)) - .7 * settle;
    s.sweep = ms < 1500 ? -3 : (ms < 2700 ? lerp(-1.3, 1.75, eio(u(1500, 2700))) : -3);
    var app = eio(u(800, 3100));
    s.dist = lerp(6.4, SETTLED.dist, app);
    s.yaw = lerp(-.68, SETTLED.yaw, app);
    s.pitch = lerp(.36, SETTLED.pitch, app);
    s.halo = 1; s.zoom = SETTLED.zoom;
  }

  var awakeHooks = [];
  function whenAwake(fn) { if (root.classList.contains("awake") && !root.classList.contains("booting")) fn(false); else awakeHooks.push(fn); }

  (function boot() {
    if (!root.classList.contains("booting")) { core.onFrame = idleFrame; core.start(); return; }
    var online = $("#xp-online"), handed = false;
    var r = coreEl.getBoundingClientRect(), size = r.width || 140;
    var big = Math.min(540, Math.min(innerWidth, innerHeight) * .56), k = big / size;
    var dx = innerWidth / 2 - (r.left + r.width / 2), dy = innerHeight / 2 - (r.top + r.height / 2);
    coreEl.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + k.toFixed(3) + ")";
    coreOpts.resolution = Math.min(k, 3); core.resize();
    var t0 = performance.now();
    if (core.ok) {
      core.driven = true;
      introState(0, core.state);
      coreEl.style.setProperty("--glow", "0");
      core.onFrame = function (now) {
        var ms = now - t0;
        introState(ms, core.state);
        coreEl.style.setProperty("--glow", Math.min(1, core.state.power * 1.15).toFixed(3));
        if (ms > 2650 && !handed) online.classList.add("show");
        if (ms > 3250) handoff(false);
      };
      core.start();
    } else {
      setTimeout(function () { online.classList.add("show"); }, 900);
      setTimeout(function () { handoff(false); }, 1800);
    }
    var evs = ["keydown", "wheel", "touchstart", "pointerdown"];
    function skip(e) { if (e && e.type === "keydown" && /^(Shift|Control|Alt|Meta)$/.test(e.key)) return; handoff(true); }
    evs.forEach(function (t) { window.addEventListener(t, skip, { capture: true, passive: true }); });
    $("#xp-skip").addEventListener("click", function () { handoff(true); });

    function handoff(fast) {
      if (handed) return; handed = true;
      evs.forEach(function (t) { window.removeEventListener(t, skip, true); });
      var dur = fast ? 650 : 1050;
      online.classList.remove("show"); online.classList.add("hide");
      core.driven = false; core.onFrame = idleFrame; core.set(SETTLED);
      coreEl.style.removeProperty("--glow");
      coreEl.style.transition = "transform " + dur + "ms cubic-bezier(.7,0,.2,1)";
      requestAnimationFrame(function () { coreEl.style.transform = ""; });
      root.classList.remove("booting"); root.classList.add("awake");
      try { sessionStorage.setItem("cerebro-awake", "1"); } catch (e) {}
      setTimeout(function () {
        coreEl.style.transition = ""; coreOpts.resolution = 1; core.resize();
        var hooks = awakeHooks; awakeHooks = []; hooks.forEach(function (f) { f(true); });
        schedule();
      }, dur + 40);
    }
  })();

  /* ---------------------------------------------------------- the experience scene */
  (function experience() {
    if (!window.CerebroWindow) return;
    var xp = $("#experience"), stage = $("#xp-stage"), group = $("#xp-windows"), hero = $("#xp-hero");
    var chapter = $("#xp-chapter"), steps = $("#xp-steps"), note = $("#xp-note"), cue = $("#xp-cue"), atmo = $(".xp-atmo", xp);
    var stepItems = $$("li", steps), goalsBox = $("#xp-goals");
    var hosts = {}; $$(".xp-win", group).forEach(function (h) { hosts[h.getAttribute("data-app")] = h; });
    var STEP_AT = [0, .1, .22, .36, .6, .86];
    function railFromT(t) {
      var active = -1; for (var i = 0; i < STEP_AT.length; i++) if (t > STEP_AT[i] + (i === 0 ? .001 : 0)) active = i;
      stepItems.forEach(function (li, i) { li.classList.toggle("done", i < active); li.classList.toggle("active", i === active); });
    }
    var wins = {
      blender: window.CerebroWindow(hosts.blender, "blender", { onProgress: railFromT }),
      numbers: window.CerebroWindow(hosts.numbers, "numbers"),
      photopea: window.CerebroWindow(hosts.photopea, "photopea")
    };
    var blender = wins.blender;

    // goal picker for the Blender demonstration
    blender.app.goals.forEach(function (g, i) {
      var b = d.createElement("button"); b.type = "button"; b.textContent = g.goal; b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", function () {
        $$("button", goalsBox).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var t = blender.t; blender.setGoal(i); lastArt = -1;
        if (scrolly) { blender.setProgress(0); blender.setProgress(t); schedule(); }
        else { blender.setProgress(0); blender.play(1, reduce ? 0 : 3200, function () { blender.demo(400, 800); }); }
      });
      goalsBox.appendChild(b);
    });

    function teaser() { // the hero's first promise: one interface, simplified
      setTimeout(function () { wins.photopea.play(1, 2600, function () { wins.photopea.demo(400, 900); }); }, scrolly ? 900 : 300);
    }

    if (!scrolly) {
      $("#xp-flatwin").appendChild(hosts.blender);
      hosts.blender.style.display = "block";
      if (reduce) { wins.photopea.setProgress(1); blender.setProgress(1); return; }
      once(hosts.photopea, .35, teaser);
      once(hosts.blender, .45, function () { blender.play(1, 3600, function () { blender.demo(400, 800); }); });
      return;
    }

    // ---- scroll-driven scene (desktop)
    var W = 1000, H = 625, Y0 = 0, Yc = 0, base = null, lastArt = -1, coreRunning = true;
    var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    var POSE = {
      front: { x: 0, y: 0, z: 0, ry: 0, o: 1, dim: 0 },
      left: { x: -.62, y: -.05, z: -440, ry: 25, o: 1, dim: .58 },
      right: { x: .62, y: -.05, z: -440, ry: -25, o: 1, dim: .58 },
      backR: { x: .58, y: -.04, z: -520, ry: -26, o: 0, dim: .7 },
      goneR: { x: 1.05, y: 0, z: -820, ry: -32, o: 0, dim: .8 }
    };
    function pose(a, b, t) { var o = {}; for (var k in a) o[k] = lerp(a[k], b[k], t); return o; }
    function applyPose(host, p) {
      host.style.transform = "translate3d(" + (p.x * W).toFixed(1) + "px," + (p.y * H).toFixed(1) + "px," + p.z.toFixed(1) + "px) rotateY(" + p.ry.toFixed(2) + "deg)";
      host.style.opacity = p.o.toFixed(3);
      host.style.setProperty("--win-dim", p.dim.toFixed(3));
      host.style.visibility = p.o < .01 ? "hidden" : "";
    }
    function measure() {
      var vh = innerHeight, vw = innerWidth;
      var chapterBottom = chapter.offsetTop + chapter.offsetHeight;
      // the step rail sits beside the window when there's room, else compact below it
      var railRoom = vw - 2 * 270, compact = railRoom < 700;
      stage.classList.toggle("rail-compact", compact);
      var avail = vh - chapterBottom - (compact ? 86 : 40);
      W = Math.min(avail * 1.6, vw * (compact ? .84 : .8), compact ? 1400 : railRoom, 1180);
      W = Math.max(480, W); H = W / 1.6;
      stage.style.setProperty("--ww", W.toFixed(0) + "px");
      Yc = chapterBottom + 14 + H / 2 - vh / 2;
      Y0 = .31 * vh + .36 * H;
      // where the core rests in the hero, from layout (never clobber the intro's transform)
      var sr = stage.getBoundingClientRect();
      base = { x: sr.left + coreEl.offsetLeft, y: sr.top + coreEl.offsetTop + coreEl.offsetHeight / 2, s: coreEl.offsetWidth };
      // each window re-measures itself through its ResizeObserver when --ww changes
    }
    resizeSubs.push(measure);
    measure();

    if (fine) window.addEventListener("pointermove", function (e) { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; schedule(); }, { passive: true });

    onFrame(function (y, vh) {
      if (root.classList.contains("booting")) return;
      var r = xp.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) { if (coreRunning) { core.stop(); coreRunning = false; } return; }
      var p = clamp(-r.top / (r.height - vh));
      mouse.sx += (mouse.x - mouse.sx) * .12; mouse.sy += (mouse.y - mouse.sy) * .12;
      if (Math.abs(mouse.x - mouse.sx) > .002 || Math.abs(mouse.y - mouse.sy) > .002) schedule();

      var e1 = eio(seg(p, 0, .1)), s = eio(seg(p, .095, .19)), par = 1 - e1;
      group.style.transform = "translate3d(0," + lerp(Y0, Yc, e1).toFixed(1) + "px,0) rotateX(" + (lerp(33, 0, e1) - mouse.sy * 3 * par).toFixed(2) + "deg) rotateY(" + (mouse.sx * 5 * par).toFixed(2) + "deg) scale(" + lerp(.94, 1, e1).toFixed(4) + ")";
      applyPose(hosts.blender, pose(POSE.left, POSE.front, s));
      applyPose(hosts.photopea, pose(POSE.front, POSE.backR, s));
      applyPose(hosts.numbers, pose(POSE.right, POSE.goneR, s));

      var h = seg(p, 0, .08);
      hero.style.opacity = (1 - eo(h)).toFixed(3);
      hero.style.transform = "translate3d(0," + (-70 * seg(p, 0, .1)).toFixed(1) + "px,0) scale(" + (1 - .03 * h).toFixed(4) + ")";
      hero.style.visibility = h >= 1 ? "hidden" : "";
      cue.style.opacity = (1 - seg(p, 0, .025)).toFixed(3);
      atmo.style.opacity = (1 - .55 * seg(p, .05, .2)).toFixed(3);

      // the core travels into the window's Cerebro control and disappears into it
      var k = eio(seg(p, .05, .19));
      if (base) {
        var pill = $(".aw-cb", hosts.blender).getBoundingClientRect();
        var tx = (pill.left + pill.width / 2 - base.x) * k, ty = (pill.top + pill.height / 2 - base.y) * k;
        var sc = lerp(1, Math.max(.06, (pill.height * 1.4) / base.s), k);
        coreEl.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
        coreEl.style.opacity = (1 - seg(k, .72, 1)).toFixed(3);
      }
      var wantCore = k < 1;
      if (wantCore !== coreRunning) { coreRunning = wantCore; wantCore ? core.start() : core.stop(); }
      if (core.ok && coreRunning) core.set({ power: lerp(SETTLED.power, 1.05, seg(p, .1, .19)) });

      var c = seg(p, .12, .19);
      chapter.style.opacity = c.toFixed(3);
      chapter.style.transform = "translate3d(0," + ((1 - c) * 18).toFixed(1) + "px,0)";
      chapter.classList.toggle("live", c > .6);
      var st = seg(p, .17, .23);
      steps.style.opacity = st.toFixed(3); note.style.opacity = st.toFixed(3);

      blender.setProgress(seg(p, .2, .84));
      if (p < .2) railFromT(0);
      var n = blender.goal.steps.length, art = p >= .84 ? Math.min(n, Math.floor(seg(p, .84, .97) * (n + 1))) : 0;
      if (art !== lastArt) { lastArt = art; blender.setArt(art); }
    });

    whenAwake(function () { teaser(); schedule(); });
  })();

  /* ---------------------------------------------------------- application showcase */
  (function showcase() {
    var rail = $("#apps-rail"), host = $("#apps-win"); if (!rail || !window.CerebroWindow) return;
    var A = window.CerebroApps, apps = A.list;
    var goalEl = $("#apps-goal"), interpEl = $("#apps-interp"), statusEl = $("#apps-status"), toggle = $("#apps-toggle"), tryBtn = $("#apps-try");
    var LABEL = { available: "Available", planned: "Planned", concept: "Concept" };
    var current = "blender", busy = false, pending = null, userTouched = false, cycleTimer = 0, visible = false;

    apps.forEach(function (app, i) {
      var b = d.createElement("button");
      b.type = "button"; b.className = "apps-tab"; b.id = "apps-tab-" + app.id;
      b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "apps-info");
      b.setAttribute("aria-selected", i === 0 ? "true" : "false"); b.tabIndex = i === 0 ? 0 : -1;
      b.style.setProperty("--tint", app.tint);
      b.innerHTML = "<i></i><b>" + app.name + "</b><small>" + app.kind + ' · <em class="' + app.status + '">' + LABEL[app.status] + "</em></small>";
      b.addEventListener("click", function () { userTouched = true; select(app.id); });
      rail.appendChild(b);
    });
    rail.addEventListener("keydown", function (e) {
      var tabs = $$(".apps-tab", rail), i = tabs.indexOf(d.activeElement);
      if (i < 0) return;
      var n = e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
      if (n === null) return;
      e.preventDefault(); n = (n + tabs.length) % tabs.length; tabs[n].focus(); userTouched = true; select(apps[n].id);
    });

    var win = null; // built shortly before the section scrolls into view
    function W() { if (!win) { win = window.CerebroWindow(host, current, { interactive: true }); bindTilt(); } return win; }

    function info(app) {
      var g = app.goals[0];
      goalEl.textContent = g.goal; interpEl.textContent = g.interp;
      statusEl.className = "pill " + (app.status === "available" ? "available" : app.status);
      statusEl.textContent = app.statusText;
      toggle.textContent = "Show original"; toggle.setAttribute("aria-pressed", "false");
      $("#apps-info").setAttribute("aria-labelledby", "apps-tab-" + app.id);
    }
    function run() { var w = W(); w.play(1, 2900, function () { w.demo(450, 760); }); }
    function select(id) {
      $$(".apps-tab", rail).forEach(function (t) { var on = t.id === "apps-tab-" + id; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; });
      if (busy) { pending = id; return; }
      if (id === current) return;
      current = id; busy = true;
      info(A.find(id));
      W().setApp(id, true, function () {
        busy = false;
        if (pending && pending !== current) { var next = pending; pending = null; select(next); return; }
        pending = null; run();
      });
      schedule_cycle();
    }
    function schedule_cycle() {
      clearTimeout(cycleTimer);
      if (userTouched || reduce) return;
      cycleTimer = setTimeout(function () {
        if (!visible || userTouched) return schedule_cycle();
        var i = apps.findIndex(function (a) { return a.id === current; });
        select(apps[(i + 1) % apps.length].id);
      }, 9800);
    }
    toggle.addEventListener("click", function () {
      userTouched = true; clearTimeout(cycleTimer);
      var w = W(), showOriginal = w.t > .5;
      w.stop(); w.play(showOriginal ? 0 : 1, 1500, showOriginal ? null : function () { w.demo(300, 700); });
      toggle.textContent = showOriginal ? "Show Cerebro" : "Show original";
      toggle.setAttribute("aria-pressed", showOriginal ? "true" : "false");
    });
    tryBtn.addEventListener("click", function () {
      userTouched = true; clearTimeout(cycleTimer);
      var app = A.find(current);
      window.dispatchEvent(new CustomEvent("cerebro:try", { detail: { app: app.id, goal: app.goals[0].goal } }));
      var pg = $("#playground"); if (pg) pg.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });

    info(A.find(current));
    if ("IntersectionObserver" in window) {
      near(host, "900px", W);
      var started = false;
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !started) { started = true; run(); schedule_cycle(); }
      }, { threshold: .35 }).observe(host);
    } else { W().setProgress(1); }

    function bindTilt() {
      if (!fine || reduce) return;
      var aw = win.el, stageEl = $(".apps-stage");
      stageEl.addEventListener("pointermove", function (e) {
        var r = stageEl.getBoundingClientRect();
        aw.style.setProperty("--ry", (((e.clientX - r.left) / r.width - .5) * 4).toFixed(2) + "deg");
        aw.style.setProperty("--rx", ((.5 - (e.clientY - r.top) / r.height) * 3).toFixed(2) + "deg");
      });
      stageEl.addEventListener("pointerleave", function () { aw.style.setProperty("--rx", "0deg"); aw.style.setProperty("--ry", "0deg"); });
    }
  })();

  /* ---------------------------------------------------------- download core */
  (function downloadCore() {
    var c = $("#core-dl"); if (!c || !window.CerebroCore) return;
    near(c, "700px", function () { makeDownloadCore(c); });
  })();
  function makeDownloadCore(c) {
    var base = { power: .55, env: 1.3, pulse: .2, dist: 4.9, yaw: -.34, pitch: -.26, halo: 1, zoom: .6, sweep: -3 };
    var k = window.CerebroCore(c, { mouse: true, fallback: "assets/core-512.png", state: base });
    var t0 = performance.now(), sweepAt = 0, next = 4000;
    k.onFrame = function (now) {
      var t = (now - t0) / 1000;
      k.target.yaw = base.yaw + Math.sin(t * .35) * .22;
      k.target.pitch = base.pitch + Math.sin(t * .27 + 1) * .08;
      if (!sweepAt && now - t0 > next) { sweepAt = now; next = now - t0 + 8000; }
      if (sweepAt) { var q = (now - sweepAt) / 2000; k.state.sweep = k.target.sweep = q <= 1 ? lerp(-1.3, 1.7, eio(q)) : -3; if (q > 1) sweepAt = 0; }
    };
    k.start();
    var item = $(".dl-item.primary .btn");
    if (item) {
      item.addEventListener("pointerenter", function () { k.set({ power: 1.05, pulse: .6 }); });
      item.addEventListener("pointerleave", function () { k.set({ power: base.power, pulse: base.pulse }); });
    }
  }

  /* ---------------------------------------------------------- navigation */
  (function nav() {
    var navEl = $("#nav"), links = $$(".nav-links a"), ind = $(".nav-ind"), menu = $("#nav-menu"), sheet = $("#nav-sheet");
    var targets = links.map(function (a) { return $(a.getAttribute("href")); });
    var current = null;
    onFrame(function (y, vh) {
      navEl.classList.toggle("scrolled", y > 12);
      var hit = null, mid = vh * .4;
      targets.forEach(function (s, i) { if (!s) return; var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) hit = links[i]; });
      if (hit !== current) {
        current = hit;
        links.forEach(function (l) { l.classList.toggle("active", l === hit); if (l === hit) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); });
        if (hit) { ind.style.opacity = "1"; ind.style.transform = "translateX(" + (hit.offsetLeft + hit.offsetWidth / 2).toFixed(1) + "px)"; }
        else ind.style.opacity = "0";
      }
    });
    function setMenu(open) {
      menu.setAttribute("aria-expanded", open ? "true" : "false");
      sheet.hidden = !open;
      if (open) { var a = $("a", sheet); if (a) a.focus(); }
    }
    menu.addEventListener("click", function () { setMenu(menu.getAttribute("aria-expanded") !== "true"); });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) { setMenu(false); menu.focus(); } });
  })();

  /* ---------------------------------------------------------- reveals */
  function near(el, margin, fn) { // run fn once, shortly before el scrolls into view
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin + " 0px" });
    io.observe(el);
  }
  function once(el, threshold, fn) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: threshold });
    io.observe(el);
  }

  (function reveals() {
    var items = $$(".reveal");
    var groups = new Map();
    items.forEach(function (el) { var p = el.parentNode, n = groups.get(p) || 0; groups.set(p, n + 1); el.style.setProperty("--rd", Math.min(n * .07, .42).toFixed(2) + "s"); });
    if (reduce || !("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .12 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------- philosophy: words light up with scroll */
  (function philosophy() {
    var lines = $$("[data-words]");
    var data = lines.map(function (p) {
      var text = p.textContent.trim(), words = text.split(/\s+/);
      p.innerHTML = '<span class="sr-only">' + text + "</span>" + words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
      return { el: p, w: $$(".w", p), lit: 0 };
    });
    if (reduce) { data.forEach(function (o) { o.w.forEach(function (w) { w.classList.add("lit"); }); }); return; }
    onFrame(function (y, vh) {
      data.forEach(function (o) {
        var r = o.el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        var p = clamp((vh * .86 - r.top) / (vh * .5));
        var n = Math.round(p * o.w.length);
        if (n !== o.lit) { o.w.forEach(function (w, i) { w.classList.toggle("lit", i < n); }); o.lit = n; }
      });
    });
  })();

  /* ---------------------------------------------------------- real capture slider */
  (function compare() {
    var box = $("#compare"), range = $("#compare-range"); if (!box) return;
    function setPos(v) { box.style.setProperty("--pos", v + "%"); range.value = v; }
    range.addEventListener("input", function () { box.classList.remove("intro"); setPos(range.value); });
    if (reduce) return;
    box.classList.add("intro");
    once(box, .45, function () {
      setTimeout(function () { setPos(16); }, 300);
      setTimeout(function () { setPos(66); }, 1700);
      setTimeout(function () { setPos(50); }, 3000);
      setTimeout(function () { box.classList.remove("intro"); }, 4300);
    });
  })();

  schedule();
})();
