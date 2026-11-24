/* AppWindow: a simulated application interface that Cerebro transforms.
   One progress value t (0..1) drives the whole sequence, so it can be
   scrubbed by scroll or played over time:
     0.00–0.22  scan line reads the interface, controls light up as found
     0.22–0.36  the goal's controls illuminate, everything else dims
     0.36–0.60  panels retract, the canvas takes the space
     0.60–0.86  chosen controls travel into the Cerebro workspace
     0.86–1.00  workspace ready (steps become usable)
   Usage: var w = CerebroWindow(hostEl, "blender", { interactive: true }); */
(function () {
  "use strict";

  var REGIONS = ["menu", "tools", "left", "right", "bottom"];
  var DIRS = { menu: [0, -1], tools: [0, -1], left: [-1, 0], right: [1, 0], bottom: [0, 1] };
  var SEARCH = ["tools", "left", "right", "bottom", "menu"];
  var TRUST = { verified: "Verified", live: "Live", guide: "Guide", planned: "Planned", concept: "Concept" };

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function eio(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eo(x) { return 1 - Math.pow(1 - x, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function chip(spec) {
    if (spec === "-") return '<span class="aw-sp"></span>';
    var k = spec.charAt(0), v = spec.slice(1);
    if (k === "/") return '<span class="aw-h">' + esc(v) + "</span>";
    if (k === "#") return '<span class="aw-c aw-i" data-l="' + esc(v) + '"><b></b></span>';
    if (k === "=") { var p = v.split("|"); return '<span class="aw-c aw-f" data-l="' + esc(p[0]) + '"><em>' + esc(p[0]) + "</em>" + (p[1] ? "<u>" + esc(p[1]) + "</u>" : "") + "</span>"; }
    if (k === ">") return '<span class="aw-c aw-tr" data-l="' + esc(v) + '">' + esc(v) + "</span>";
    if (k === "~") return '<span class="aw-c aw-sw" style="--sw:' + esc(v) + '"></span>';
    return '<span class="aw-c aw-t" data-l="' + esc(spec) + '">' + esc(spec) + "</span>";
  }

  function timeline(spec) {
    var tracks = spec.tracks || 2, html = '<div class="aw-tl-bar">' + spec.items.map(chip).join("") + "</div>";
    html += '<div class="aw-tl-ruler">' + Array.apply(null, Array(24)).map(function (_, i) { return "<i" + (i % 4 === 0 ? ' class="m"' : "") + "></i>"; }).join("") + "</div>";
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var r = 0; r < tracks; r++) {
      var x = 2 + rnd() * 6, clips = "";
      while (x < 92) { var w = 6 + rnd() * 16; clips += '<span class="aw-clip' + (r >= tracks / 2 && tracks > 2 ? " a" : "") + '" style="left:' + x.toFixed(1) + "%;width:" + Math.min(w, 96 - x).toFixed(1) + '%"></span>'; x += w + 1 + rnd() * 5; }
      html += '<div class="aw-tl-track"><span class="aw-tl-h">' + (r >= tracks / 2 && tracks > 2 ? "A" + (r - tracks / 2 + 1) : "V" + (r + 1)) + "</span>" + clips + "</div>";
    }
    html += '<i class="aw-playhead"></i>';
    return html;
  }

  function CerebroWindow(host, appId, opts) {
    opts = opts || {};
    var A = window.CerebroApps;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var root = document.createElement("div");
    root.className = "aw";
    root.innerHTML =
      '<div class="aw-bar" aria-hidden="true"><span class="aw-dots"><i></i><i></i><i></i></span><span class="aw-doc"></span>'
      + '<span class="aw-cb"><svg viewBox="0 0 100 100"><use href="#mark"/></svg><span>Cerebro</span></span></div>'
      + '<div class="aw-body">'
      + REGIONS.map(function (r) { return '<div class="aw-rg aw-' + r + '" data-r="' + r + '" aria-hidden="true"></div>'; }).join("")
      + '<div class="aw-rg aw-canvas" data-r="canvas" aria-hidden="true"><div class="aw-art"></div></div>'
      + '<div class="aw-scan" aria-hidden="true"></div><div class="aw-ghosts" aria-hidden="true"></div>'
      + '<div class="aw-ws"><div class="aw-ws-h"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#mark"/></svg><span class="aw-ws-name">Cerebro</span><em class="aw-ws-st">Building</em></div>'
      + '<p class="aw-ws-goal"></p><ol class="aw-ws-steps"></ol><p class="aw-ws-foot" aria-live="polite"></p></div>'
      + "</div>";
    if (!opts.interactive) root.setAttribute("aria-hidden", "true");
    host.appendChild(root);

    var body = root.querySelector(".aw-body"), doc = root.querySelector(".aw-doc");
    var rg = {}; REGIONS.concat(["canvas"]).forEach(function (r) { rg[r] = root.querySelector('[data-r="' + r + '"]'); });
    var art = root.querySelector(".aw-art"), scan = root.querySelector(".aw-scan"), ghostLayer = root.querySelector(".aw-ghosts");
    var ws = root.querySelector(".aw-ws"), wsGoal = root.querySelector(".aw-ws-goal"), wsSteps = root.querySelector(".aw-ws-steps");
    var wsSt = root.querySelector(".aw-ws-st"), wsFoot = root.querySelector(".aw-ws-foot");

    var self = { el: root, app: null, goal: null, goalIndex: 0, t: 0, artState: 0, onStep: opts.onStep || null };
    var chips = [], seen = 0, picks = [], ghosts = [], slots = [], artGroups = [], dims = { w: 1, h: 1 };
    var playRaf = 0;

    function fill(app) {
      self.app = app;
      root.setAttribute("data-app", app.id);
      root.style.setProperty("--tint", app.tint);
      doc.textContent = app.doc;
      REGIONS.forEach(function (r) {
        var spec = app.ui[r], el = rg[r], rect = app.layout[r];
        if (!rect || !spec) { el.style.display = "none"; el.innerHTML = ""; return; }
        el.style.display = "";
        place(el, rect);
        el.innerHTML = Array.isArray(spec) ? spec.map(chip).join("") : (spec.timeline ? timeline(spec) : '<div class="aw-row">' + spec.items.map(chip).join("") + "</div>");
        el.classList.toggle("is-tl", !!(spec && spec.timeline));
      });
      place(rg.canvas, app.layout.canvas);
      art.innerHTML = A.art(app.goals[0].art);
      artGroups = Array.prototype.slice.call(art.querySelectorAll("g[data-f]"));
    }

    function place(el, r) { el.style.left = r[0] + "%"; el.style.top = r[1] + "%"; el.style.width = r[2] + "%"; el.style.height = r[3] + "%"; }

    function setGoal(i) {
      var app = self.app; i = Math.max(0, Math.min(app.goals.length - 1, i || 0));
      self.goalIndex = i; self.goal = app.goals[i];
      root.querySelectorAll(".aw-c.pick").forEach(function (c) { c.classList.remove("pick"); c.style.visibility = ""; });
      if (art.getAttribute("data-art") !== self.goal.art) {
        art.innerHTML = A.art(self.goal.art); art.setAttribute("data-art", self.goal.art);
        artGroups = Array.prototype.slice.call(art.querySelectorAll("g[data-f]"));
      }
      picks = self.goal.steps.map(function (s) {
        var label = s.c.replace(/^#/, ""), found = null;
        for (var k = 0; k < SEARCH.length && !found; k++) {
          var el = rg[SEARCH[k]];
          if (el.style.display === "none") continue;
          var all = el.querySelectorAll(".aw-c[data-l]");
          for (var j = 0; j < all.length; j++) if (all[j].getAttribute("data-l") === label) { found = all[j]; break; }
        }
        if (!found) { rg.tools.insertAdjacentHTML("beforeend", chip(label)); found = rg.tools.lastElementChild; }
        found.classList.add("pick");
        return found;
      });
      wsGoal.textContent = self.goal.goal;
      wsSteps.innerHTML = self.goal.steps.map(function (s, n) {
        var inner = '<span class="aw-n">' + String(n + 1).padStart(2, "0") + '</span><span class="aw-l">' + esc(s.label) + '</span><span class="pill ' + s.trust + '">' + TRUST[s.trust] + "</span>";
        return "<li>" + (opts.interactive ? '<button type="button" tabindex="-1">' + inner + "</button>" : '<div class="aw-li">' + inner + "</div>") + "</li>";
      }).join("");
      slots = Array.prototype.slice.call(wsSteps.children);
      ghostLayer.innerHTML = self.goal.steps.map(function (s, n) {
        return '<div class="aw-ghost"><span class="aw-n">' + String(n + 1).padStart(2, "0") + '</span><span class="aw-l">' + esc(s.label) + '</span><span class="pill ' + s.trust + '">' + TRUST[s.trust] + "</span></div>";
      }).join("");
      ghosts = Array.prototype.slice.call(ghostLayer.children);
      if (opts.interactive) slots.forEach(function (li, n) { li.firstChild.addEventListener("click", function () { useStep(n); }); });
      measure();
      setArt(0);
      root.classList.remove("ready");
      apply(self.t);
    }

    function useStep(n) {
      if (self.t < .999) return;
      setArt(n + 1);
      var s = self.goal.steps[n];
      wsFoot.textContent = s.trust === "guide" ? "Guide · " + s.did : s.did;
      if (self.onStep) self.onStep(n, s);
    }

    function setArt(s) {
      self.artState = s;
      artGroups.forEach(function (g) { var f = +g.getAttribute("data-f"), t = +g.getAttribute("data-t"); g.style.display = f <= s && s <= t ? "" : "none"; });
      slots.forEach(function (li, i) { li.classList.toggle("done", i < s); });
      if (!s) wsFoot.textContent = "";
    }

    function rel(el) { // position of an element inside .aw-body, ignoring transforms
      var x = 0, y = 0, n = el;
      while (n && n !== body) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }

    function measure() {
      var compact = root.clientWidth > 0 && root.clientWidth < 600;
      if (compact !== root.classList.contains("aw-compact")) root.classList.toggle("aw-compact", compact);
      dims.w = body.clientWidth || 1; dims.h = body.clientHeight || 1;
      chips = Array.prototype.slice.call(body.querySelectorAll(".aw-rg:not(.aw-canvas) .aw-c")).map(function (c) { var r = rel(c); return { el: c, y: r.y + r.h / 2 }; });
      chips.sort(function (a, b) { return a.y - b.y; });
      chips.forEach(function (c) { c.el.classList.remove("seen"); });
      seen = 0;
      var keep = ws.style.display; ws.style.display = "flex";
      picks = picks.map(function (p) { return p.el ? p : { el: p }; });
      picks.forEach(function (p, i) {
        var vis = p.el.style.visibility; p.el.style.visibility = "";
        p.from = rel(p.el); p.el.style.visibility = vis;
        var li = slots[i]; p.to = li ? rel(li) : p.from;
        var g = ghosts[i]; if (g) { g.style.width = p.to.w + "px"; g.style.height = p.to.h + "px"; }
      });
      ws.style.display = keep;
    }

    function apply(t) {
      self.t = t;
      var a = seg(t, 0, .22), b = seg(t, .2, .36), c = eio(seg(t, .36, .6)), d = seg(t, .6, .86), w = eo(seg(t, .54, .72));
      // scan
      var y = a * dims.h;
      scan.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
      scan.style.opacity = a > 0 && a < 1 ? Math.min(1, Math.sin(Math.PI * a) * 2.2).toFixed(3) : "0";
      var target = 0; while (target < chips.length && chips[target].y <= y) target++;
      if (a >= 1) target = chips.length;
      if (target !== seen) {
        var lo = Math.min(seen, target), hi = Math.max(seen, target), on = target > seen;
        for (var i = lo; i < hi; i++) chips[i].el.classList.toggle("seen", on);
        seen = target;
      }
      body.style.setProperty("--b", b.toFixed(3));
      // retract
      REGIONS.forEach(function (r) {
        var el = rg[r]; if (el.style.display === "none") return;
        if (c <= 0) { el.style.transform = ""; el.style.opacity = ""; return; }
        el.style.transform = "translate3d(" + (DIRS[r][0] * c * 104).toFixed(2) + "%," + (DIRS[r][1] * c * 104).toFixed(2) + "%,0)";
        el.style.opacity = (1 - c).toFixed(3);
      });
      var L = self.app.layout.canvas, F = root.classList.contains("aw-compact") ? [0, 0, 100, 43] : self.app.focus;
      place(rg.canvas, [lerp(L[0], F[0], c), lerp(L[1], F[1], c), lerp(L[2], F[2], c), lerp(L[3], F[3], c)]);
      // workspace + travelling controls
      ws.style.opacity = w.toFixed(3);
      ws.style.transform = "translate3d(" + ((1 - w) * 18).toFixed(1) + "px,0,0)";
      var n = picks.length, stagger = n > 1 ? .32 / (n - 1) : 0;
      picks.forEach(function (p, i) {
        var g = ghosts[i], li = slots[i];
        var di = eio(clamp((d - i * stagger) / (1 - stagger * (n - 1))));
        var lifted = t >= .36;
        p.el.style.visibility = lifted ? "hidden" : "";
        if (!g) return;
        if (!lifted || di >= 1) { g.style.opacity = "0"; }
        else {
          var s0 = Math.max(.28, Math.min(1, p.from.w / Math.max(1, p.to.w)));
          var fx = p.from.x + p.from.w / 2 - (p.to.w * s0) / 2, fy = p.from.y + p.from.h / 2 - (p.to.h * s0) / 2;
          var x = lerp(fx, p.to.x, di), yy = lerp(fy, p.to.y, di), s = lerp(s0, 1, di);
          g.style.opacity = "1";
          g.style.transform = "translate3d(" + x.toFixed(1) + "px," + yy.toFixed(1) + "px,0) scale(" + s.toFixed(3) + ")";
        }
        if (li) li.style.opacity = seg(di, .82, 1).toFixed(3);
      });
      root.classList.toggle("on", t > .001);
      var ready = t >= .999;
      if (ready !== root.classList.contains("ready")) {
        root.classList.toggle("ready", ready);
        if (opts.interactive) slots.forEach(function (li) { li.firstChild.tabIndex = ready ? 0 : -1; });
      }
      var st = t >= .86 ? "Workspace ready" : "Building";
      if (wsSt.textContent !== st) wsSt.textContent = st;
      if (opts.onProgress) opts.onProgress(t);
    }

    function play(to, dur, done) {
      cancelAnimationFrame(playRaf);
      if (reduce) { apply(to); if (done) done(); return; }
      var from = self.t, t0 = performance.now();
      dur = dur || 3200;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur);
        apply(from + (to - from) * (k < 1 ? (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2) : 1));
        if (k < 1) playRaf = requestAnimationFrame(step); else if (done) done();
      })(t0);
    }

    function demo(delay, gap) { // run the workspace's steps once so the preview builds itself
      var k = 0, n = self.goal.steps.length, token = {};
      self._demo = token;
      function next() {
        if (self._demo !== token || self.t < .999 || k >= n) return;
        useStep(k++);
        setTimeout(next, gap || 750);
      }
      setTimeout(next, delay || 400);
    }

    function setApp(id, morph, done) {
      var app = A.find(id); if (!app) return;
      cancelAnimationFrame(playRaf); self._demo = null;
      if (!morph || !self.app || reduce) { fill(app); setGoal(0); apply(0); if (done) done(); return; }
      root.classList.add("aw-out");
      setTimeout(function () {
        root.classList.add("aw-morph");
        apply(0);
        fill(app);
        art.removeAttribute("data-art");
        setGoal(0);
        root.classList.remove("aw-out"); root.classList.add("aw-in");
        setTimeout(function () { root.classList.remove("aw-morph", "aw-in"); measure(); apply(0); if (done) done(); }, 760);
      }, 240);
    }

    if ("ResizeObserver" in window) new ResizeObserver(function () { if (self.app) { measure(); apply(self.t); } }).observe(body);

    self.setApp = setApp;
    self.setGoal = function (i) { self._demo = null; setGoal(i); };
    self.setProgress = function (t) { cancelAnimationFrame(playRaf); if (Math.abs(t - self.t) > 1e-4 || t === 0 || t === 1) apply(t); };
    self.play = play;
    self.stop = function () { cancelAnimationFrame(playRaf); self._demo = null; };
    self.setArt = setArt;
    self.useStep = useStep;
    self.demo = demo;
    self.measure = function () { measure(); apply(self.t); };

    fill(A.find(appId));
    setGoal(opts.goal || 0);
    return self;
  }

  window.CerebroWindow = CerebroWindow;
})();
