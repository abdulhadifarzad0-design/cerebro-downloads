/* Cerebro playground: a browser simulation of Cerebro turning a goal into a
   focused workspace. Illustrative only: nothing on the visitor's computer is
   read or controlled. Renders into #pg-root and depends on window.CerebroApps.
   API: CerebroPlayground.init(rootEl), CerebroPlayground.run(goalText, appId)
   Event: window.dispatchEvent(new CustomEvent("cerebro:try", { detail: { goal, app } })) */
(function () {
  "use strict";

  // Real discovery counts from Cerebro's own tests. Planned/concept apps get none.
  var COUNTS = { blender: "1,207 operations", numbers: "465 controls", textedit: "168 controls", excalidraw: "152 controls", photopea: "83 controls" };
  var STAGES = ["Reading interface", "Identifying available controls", "Understanding objective", "Selecting relevant tools", "Building workspace", "Workspace ready"];
  var DUR = [480, 540, 840, 500, 520, 420];      // ~3.3s in total
  var PHASES = ["Start", "Build", "Style", "Review", "Finish"];
  var TRUST = { verified: "Verified", live: "Live", guide: "Guide", planned: "Planned", concept: "Concept" };
  var AVAIL = { available: "Available", planned: "Planned", concept: "Concept" };
  var OTHERS = ["numbers", "photopea", "resolve", "excalidraw", "textedit", "blender", "photoshop", "fusion"];
  var MSG_NONE = "This simulation only includes a few set examples. In the real Cerebro, the planner builds a workspace for any goal from the controls it finds in your app.";
  var BANNER = {
    planned: "Planned integration — not available yet. This shows the intended experience.",
    concept: "Concept — not on the roadmap yet. This shows what Cerebro could do."
  };
  var CHEV = '<svg class="pg-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.4l3 3 6-6.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var uid = 0;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(root, sel) { return root.querySelector(sel); }
  function $$(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function mark(cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><use href="#mark"></use></svg>'; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // Each injected SVG gets its own gradient/pattern ids, so previews never
  // depend on another (possibly hidden) copy of the same art on the page.
  function uniqueArt(key) {
    var svg = window.CerebroApps.art(key), pre = "pg" + (++uid) + "-", ids = [];
    svg.replace(/\sid="([^"]+)"/g, function (m, id) { ids.push(id); return m; });
    ids.forEach(function (id) {
      svg = svg.split('id="' + id + '"').join('id="' + pre + id + '"').split("url(#" + id + ")").join("url(#" + pre + id + ")");
    });
    return svg;
  }

  function words(s) { return (s || "").toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3; }); }
  // Best goal in an app sharing at least one meaningful word with the text.
  function closestGoal(app, text) {
    var qw = words(text), best = null, bestHits = 0;
    app.goals.forEach(function (g) {
      var hits = words(g.goal).filter(function (gw) {
        return qw.some(function (w) { return gw.indexOf(w) === 0 || w.indexOf(gw) === 0; });
      }).length;
      if (hits > bestHits) { bestHits = hits; best = g; }
    });
    return best;
  }

  function Playground(root) {
    this.root = root;
    this.apps = window.CerebroApps;
    this.app = this.apps.find("blender") || this.apps.list[0];
    this.goal = null;
    this.mode = "idle";         // idle | running | ready
    this.next = 0;              // index of the next step to run
    this.timers = [];
    this.busy = false;
    this.render();
    this.bind();
    this.selectApp(this.app);
    this.toIdle();
  }
  var P = Playground.prototype;

  /* ---------------- markup ---------------- */
  P.render = function () {
    var opts = this.apps.list.map(function (a) {
      return '<li class="pg-opt" role="option" id="pg-opt-' + a.id + '" data-id="' + a.id + '" aria-selected="false">'
        + '<span class="pg-tint" style="--tint:' + a.tint + '"></span>'
        + '<span class="pg-opt-name">' + esc(a.name) + "</span>"
        + '<span class="pg-opt-kind">' + esc(a.kind) + "</span>"
        + '<span class="pill ' + a.status + '">' + AVAIL[a.status] + "</span></li>";
    }).join("");
    var stages = STAGES.map(function (s, i) {
      return '<li class="pg-stage" data-i="' + i + '"><span class="pg-node" aria-hidden="true"></span><span class="pg-stage-name">' + s + "</span></li>";
    }).join("");
    var phases = PHASES.map(function (p) { return '<span class="pg-phase" data-phase="' + p + '">' + p + "</span>"; }).join("");

    this.root.innerHTML =
      '<div class="pg-console">'
      + '<div class="pg-top"><span class="pg-sim">Browser simulation · illustrative</span><span class="pg-mode" aria-hidden="true"><i></i><span class="pg-mode-text">Idle</span></span></div>'
      + '<form class="pg-command" novalidate>'
      + '<div class="pg-picker">'
      + '<button type="button" class="pg-picker-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="pg-app-list">'
      + '<span class="pg-tint"></span><span class="pg-picker-text"><span class="pg-picker-name"></span> <span class="pg-picker-kind"></span></span><span class="sr-only pg-picker-sr"></span>' + CHEV + "</button>"
      + '<ul class="pg-list" id="pg-app-list" role="listbox" tabindex="-1" aria-label="Choose an app" hidden>' + opts + "</ul>"
      + "</div>"
      + '<label class="sr-only" for="pg-input">What do you want to accomplish?</label>'
      + '<input class="pg-input" id="pg-input" type="text" placeholder="What do you want to accomplish?" autocomplete="off" spellcheck="false" maxlength="120" enterkeyhint="go">'
      + '<button type="submit" class="btn btn-primary pg-activate">' + mark("btn-mark") + "<span>Activate</span></button>"
      + "</form>"
      + '<div class="pg-suggest"><span class="pg-suggest-label" id="pg-try-label">Try</span><div class="pg-chips" role="group" aria-labelledby="pg-try-label"></div></div>'
      + '<div class="pg-pipe">'
      + '<div class="pg-rail" aria-hidden="true"><span class="pg-rail-fill"></span><span class="pg-pulse"></span></div>'
      + '<ol class="pg-stages" aria-label="What Cerebro is doing">' + stages + "</ol>"
      + '<p class="pg-statusline"><span class="pg-sl-stage">Waiting for a goal</span><span class="pg-sl-detail"></span></p>'
      + "</div>"
      + '<div class="pg-understand"><span class="pg-understand-label">Understanding</span>'
      + '<div class="pg-understand-body"><p class="pg-closest" hidden></p><p class="pg-understand-text is-placeholder">Cerebro’s reading of your goal appears here.</p><div class="pg-examples"></div></div></div>'
      + '<div class="pg-result">'
      + '<aside class="pg-panel is-idle" aria-label="Cerebro workspace (simulated)">'
      + '<div class="pg-panel-head"><span class="pg-brand">' + mark() + 'Cerebro</span><span class="pg-appchip"><span class="pg-tint"></span><span class="pg-appchip-name"></span></span></div>'
      + '<p class="pg-banner" hidden></p>'
      + '<div class="pg-panel-intro"><h3 class="pg-title">Your workspace</h3><p class="pg-goal">Appears here once Cerebro understands your goal.</p></div>'
      + '<div class="pg-phases" aria-label="Workspace phases">' + phases + "</div>"
      + '<ol class="pg-tools"></ol>'
      + '<div class="pg-actions"><button type="button" class="btn pg-next" disabled>Next step</button><button type="button" class="pg-reset" disabled>Reset</button></div>'
      + '<p class="pg-live" role="status" aria-live="polite"></p>'
      + "</aside>"
      + '<figure class="pg-preview is-idle">'
      + '<div class="pg-preview-bar"><span class="pg-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="pg-doc"></span><span class="pg-tag" hidden></span><span class="pg-plabel">Simulated preview</span><span class="pg-count" aria-hidden="true"></span></div>'
      + '<div class="pg-canvas"><div class="pg-art"></div><span class="pg-scan" aria-hidden="true"></span><p class="pg-hint" aria-hidden="true" hidden><i></i><span></span></p>'
      + '<div class="pg-overlay"><p>' + mark("pg-ovl-mark") + "Choose a goal and press <b>Activate</b>.<span>Cerebro builds the workspace. The preview shows what each tool does.</span></p></div></div>"
      + '<figcaption class="sr-only">Illustrative preview of the result. Not a real application.</figcaption>'
      + "</figure>"
      + "</div>"
      + '<p class="sr-only pg-announce" aria-live="polite"></p>'
      + "</div>";

    var r = this.root;
    this.$console = $(r, ".pg-console");
    this.$mode = $(r, ".pg-mode-text");
    this.$form = $(r, ".pg-command");
    this.$pickBtn = $(r, ".pg-picker-btn");
    this.$pickTint = $(r, ".pg-picker-btn .pg-tint");
    this.$pickName = $(r, ".pg-picker-name");
    this.$pickKind = $(r, ".pg-picker-kind");
    this.$list = $(r, ".pg-list");
    this.$opts = $$(r, ".pg-opt");
    this.$input = $(r, ".pg-input");
    this.$chips = $(r, ".pg-chips");
    this.$pipe = $(r, ".pg-pipe");
    this.$stages = $$(r, ".pg-stage");
    this.$slStage = $(r, ".pg-sl-stage");
    this.$slDetail = $(r, ".pg-sl-detail");
    this.$closest = $(r, ".pg-closest");
    this.$uText = $(r, ".pg-understand-text");
    this.$examples = $(r, ".pg-examples");
    this.$panel = $(r, ".pg-panel");
    this.$appTint = $(r, ".pg-appchip .pg-tint");
    this.$appName = $(r, ".pg-appchip-name");
    this.$banner = $(r, ".pg-banner");
    this.$title = $(r, ".pg-title");
    this.$goal = $(r, ".pg-goal");
    this.$phases = $$(r, ".pg-phase");
    this.$tools = $(r, ".pg-tools");
    this.$next = $(r, ".pg-next");
    this.$reset = $(r, ".pg-reset");
    this.$live = $(r, ".pg-live");
    this.$preview = $(r, ".pg-preview");
    this.$doc = $(r, ".pg-doc");
    this.$tag = $(r, ".pg-tag");
    this.$count = $(r, ".pg-count");
    this.$art = $(r, ".pg-art");
    this.$canvas = $(r, ".pg-canvas");
    this.$hint = $(r, ".pg-hint");
    this.$hintText = $(r, ".pg-hint span");
    this.$announce = $(r, ".pg-announce");
  };

  /* ---------------- events ---------------- */
  P.bind = function () {
    var self = this;
    this.$form.addEventListener("submit", function (e) { e.preventDefault(); self.closeList(); self.activate(self.$input.value); });
    this.$pickBtn.addEventListener("click", function () { self.$list.hidden ? self.openList() : self.closeList(true); });
    this.$pickBtn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); self.openList(); }
    });
    this.$list.addEventListener("keydown", function (e) { self.listKey(e); });
    this.$list.addEventListener("click", function (e) {
      var li = e.target.closest(".pg-opt"); if (!li) return;
      self.chooseApp(li.getAttribute("data-id"));
    });
    this.$list.addEventListener("mousemove", function (e) {
      var li = e.target.closest(".pg-opt"); if (li) self.setActiveOpt(self.$opts.indexOf(li));
    });
    document.addEventListener("pointerdown", function (e) {
      if (!self.$list.hidden && !e.target.closest(".pg-picker")) self.closeList();
    });
    function launch(btn) {
      var app = self.apps.find(btn.getAttribute("data-app")), goal = null;
      if (!app) return;
      app.goals.forEach(function (g) { if (g.goal === btn.getAttribute("data-goal")) goal = g; });
      if (!goal) return;
      self.$input.value = goal.goal;
      self.runGoal(app, goal, null);
    }
    this.$chips.addEventListener("click", function (e) { var b = e.target.closest(".pg-chip"); if (b) launch(b); });
    this.$examples.addEventListener("click", function (e) { var b = e.target.closest(".pg-example"); if (b) launch(b); });
    this.$tools.addEventListener("click", function (e) {
      var b = e.target.closest(".pg-tool"); if (b) self.use(+b.getAttribute("data-i"));
    });
    this.$next.addEventListener("click", function () { if (self.goal) self.use(self.next); });
    this.$reset.addEventListener("click", function () { self.resetSteps(true); });
  };

  /* ---------------- app picker (listbox) ---------------- */
  P.openList = function () {
    this.$list.hidden = false;
    this.$pickBtn.setAttribute("aria-expanded", "true");
    this.setActiveOpt(this.apps.list.indexOf(this.app));
    this.$list.focus({ preventScroll: true });
  };
  P.closeList = function (refocus) {
    if (this.$list.hidden) return;
    this.$list.hidden = true;
    this.$pickBtn.setAttribute("aria-expanded", "false");
    this.$list.removeAttribute("aria-activedescendant");
    if (refocus) this.$pickBtn.focus({ preventScroll: true });
  };
  P.setActiveOpt = function (i) {
    if (i < 0) i = 0;
    if (i >= this.$opts.length) i = this.$opts.length - 1;
    this.activeOpt = i;
    this.$opts.forEach(function (o, k) { o.classList.toggle("is-active", k === i); });
    var li = this.$opts[i];
    this.$list.setAttribute("aria-activedescendant", li.id);
    if (li.scrollIntoView && !this.$list.hidden) li.scrollIntoView({ block: "nearest" });
  };
  P.listKey = function (e) {
    var i = this.activeOpt || 0, n = this.$opts.length;
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); this.setActiveOpt((i + 1) % n); break;
      case "ArrowUp": e.preventDefault(); this.setActiveOpt((i - 1 + n) % n); break;
      case "Home": e.preventDefault(); this.setActiveOpt(0); break;
      case "End": e.preventDefault(); this.setActiveOpt(n - 1); break;
      case "Enter": case " ": e.preventDefault(); this.chooseApp(this.$opts[i].getAttribute("data-id")); break;
      case "Escape": e.preventDefault(); this.closeList(true); break;
      case "Tab": this.closeList(); break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          var ch = e.key.toLowerCase();
          for (var k = 1; k <= n; k++) {
            var idx = (i + k) % n;
            if (this.apps.list[idx].name.toLowerCase().charAt(0) === ch) { this.setActiveOpt(idx); break; }
          }
        }
    }
  };
  P.chooseApp = function (id) {
    var app = this.apps.find(id);
    this.closeList(true);
    if (!app) return;
    if (app !== this.app) { this.cancel(); this.selectApp(app); this.toIdle(); }
  };

  P.selectApp = function (app) {
    this.app = app;
    this.$pickTint.style.setProperty("--tint", app.tint);
    this.$pickName.textContent = app.name;
    this.$pickKind.textContent = app.kind;
    // the button's name is its visible text plus this hidden hint, so the two always match
    this.$pickBtn.querySelector(".pg-picker-sr").textContent = ", " + AVAIL[app.status] + ". Change app";
    this.$opts.forEach(function (o) { o.setAttribute("aria-selected", o.getAttribute("data-id") === app.id ? "true" : "false"); });
    this.$appTint.style.setProperty("--tint", app.tint);
    this.$appName.textContent = app.name;
    this.renderChips();
    if (this.mode === "idle") this.idlePreview();
  };

  P.renderChips = function () {
    var app = this.app, self = this;
    var html = app.goals.map(function (g) {
      return '<button type="button" class="pg-chip" data-app="' + app.id + '" data-goal="' + esc(g.goal) + '">' + esc(g.goal) + "</button>";
    });
    var room = Math.max(1, Math.min(3, 5 - app.goals.length));
    OTHERS.filter(function (id) { return id !== app.id; }).slice(0, room).forEach(function (id) {
      var o = self.apps.find(id); if (!o) return;
      var g = o.goals[0];
      html.push('<button type="button" class="pg-chip" data-app="' + o.id + '" data-goal="' + esc(g.goal) + '"><span class="pg-tint" style="--tint:' + o.tint + '"></span>'
        + esc(g.goal) + " <small>" + esc(o.name) + "</small></button>");
    });
    this.$chips.innerHTML = html.join("");
  };

  /* ---------------- states ---------------- */
  P.later = function (fn, ms) { this.timers.push(setTimeout(fn, ms)); };
  P.cancel = function () {
    this.timers.forEach(clearTimeout); this.timers = [];
    this.busy = false;
    this.$console.classList.remove("is-running");
    this.$preview.classList.remove("is-scanning");
  };
  P.setMode = function (t) { this.$mode.textContent = t; };
  P.announce = function (t) { var a = this.$announce; a.textContent = ""; setTimeout(function () { a.textContent = t; }, 30); };
  P.status = function (stage, detailHTML) { this.$slStage.textContent = stage; this.$slDetail.innerHTML = detailHTML || ""; };
  P.setRail = function (p, dur) { this.$pipe.style.setProperty("--dur", (reduce ? 0 : dur) + "ms"); this.$pipe.style.setProperty("--p", p); };
  P.resetPipeline = function () {
    this.$stages.forEach(function (li) { li.classList.remove("is-active", "is-done"); li.removeAttribute("aria-current"); });
    this.setRail(0, 0);
  };

  P.loadArt = function (key) {
    var svg = uniqueArt(key), base = /<rect width="400" height="250" fill="(#[0-9a-fA-F]{3,6})"/.exec(svg);
    this.$art.innerHTML = svg;
    var el = this.$art.querySelector("svg");
    if (el) el.setAttribute("preserveAspectRatio", "xMidYMid meet");
    this.$canvas.style.background = base ? base[1] : "";
    this.layers = $$(this.$art, "g[data-f]");
    this.setArt(0);
  };
  P.idlePreview = function () {
    var g = this.app.goals[0];
    this.loadArt(g.art);
    this.$hint.hidden = true;
    this.$doc.textContent = this.app.doc;
    this.setTag(this.app.status);
    this.$count.textContent = "";
    this.$preview.classList.add("is-idle");
  };
  P.setTag = function (status) {
    if (status === "available") { this.$tag.hidden = true; return; }
    this.$tag.hidden = false;
    this.$tag.className = "pg-tag " + status;
    this.$tag.textContent = AVAIL[status];
  };

  // Back to the resting state for the current app (no motion).
  P.toIdle = function () {
    this.mode = "idle"; this.goal = null; this.next = 0;
    this.$console.classList.remove("is-running", "is-ready");
    this.setMode("Idle");
    this.resetPipeline();
    this.status("Waiting for a goal", "");
    this.$closest.hidden = true;
    this.$uText.className = "pg-understand-text is-placeholder";
    this.$uText.textContent = "Cerebro’s reading of your goal appears here.";
    this.$examples.innerHTML = "";
    this.panelIdle();
    this.idlePreview();
  };
  P.panelIdle = function () {
    this.$panel.classList.add("is-idle");
    this.$banner.hidden = true;
    this.$title.textContent = "Your workspace";
    this.$goal.textContent = "Appears here once Cerebro understands your goal.";
    this.$phases.forEach(function (p) { p.className = "pg-phase"; });
    this.$tools.innerHTML = [62, 48, 70, 54].map(function (w) { return '<li class="pg-skel" aria-hidden="true"><span style="--w:' + w + '%"></span></li>'; }).join("");
    this.$next.disabled = true; this.$next.textContent = "Next step";
    this.$reset.disabled = true;
    this.$live.innerHTML = "";
  };

  /* ---------------- activation ---------------- */
  P.activate = function (text) {
    text = (text || "").trim();
    var A = this.apps;
    if (!text) {
      var g0 = this.app.goals[0];
      this.$input.value = g0.goal;
      return this.runGoal(this.app, g0, null);
    }
    var here = A.matchGoal(text, this.app.id);
    if (here && here.goal) return this.runGoal(here.app, here.goal, null);
    var any = A.matchGoal(text);
    if (any && any.goal) return this.runGoal(any.app, any.goal, null);
    var app = (here && here.app) || (any && any.app);
    if (app) {
      var near = closestGoal(app, text);
      if (near) return this.runGoal(app, near, text);
      return this.offer(app, "In this simulation " + app.name + " has a few set examples. In the real Cerebro, the planner builds a workspace for any goal from the controls it finds in your app.");
    }
    return this.offer(this.app, MSG_NONE);
  };

  P.offer = function (app, message) {
    this.cancel();
    if (app !== this.app) this.selectApp(app);
    this.toIdle();
    this.$uText.className = "pg-understand-text";
    this.$uText.textContent = message;
    this.$examples.innerHTML = app.goals.map(function (g) {
      return '<button type="button" class="pg-example" data-app="' + app.id + '" data-goal="' + esc(g.goal) + '">'
        + '<span class="pg-tint" style="--tint:' + app.tint + '"></span>' + esc(g.goal) + ' <span class="arrow" aria-hidden="true">→</span></button>';
    }).join("");
    this.status("No matching example", esc(app.name));
    this.announce(message + " Try: " + app.goals.map(function (g) { return g.goal; }).join(", ") + ".");
  };

  P.runGoal = function (app, goal, typed) {
    var self = this;
    this.cancel();
    if (app !== this.app) this.selectApp(app);
    this.mode = "running"; this.goal = goal; this.next = 0;
    this.$console.classList.add("is-running");
    this.$console.classList.remove("is-ready");
    this.setMode("Working");
    this.resetPipeline();

    // understanding area: wait for stage three
    this.$examples.innerHTML = "";
    this.$uText.className = "pg-understand-text is-placeholder";
    this.$uText.textContent = "Reading the interface…";
    if (typed) {
      this.$closest.hidden = false;
      this.$closest.innerHTML = "Closest example to “" + esc(typed) + "”: <b>" + esc(goal.goal) + "</b>";
    } else this.$closest.hidden = true;

    // panel: header and banner now, tools while building
    this.$panel.classList.add("is-idle");
    this.$banner.hidden = app.status === "available";
    this.$banner.className = "pg-banner" + (app.status === "concept" ? " is-concept" : "");
    this.$banner.textContent = BANNER[app.status] || "";
    this.$title.textContent = "Reading " + app.name + "…";
    this.$goal.textContent = goal.goal;
    this.$phases.forEach(function (p) { p.className = "pg-phase"; });
    this.$tools.innerHTML = [62, 48, 70, 54].map(function (w) { return '<li class="pg-skel" aria-hidden="true"><span style="--w:' + w + '%"></span></li>'; }).join("");
    this.$next.disabled = true; this.$next.textContent = "Next step";
    this.$reset.disabled = true;
    this.$live.innerHTML = "";

    // preview: this goal's art at state 0, dimmed, scanning
    this.loadArt(goal.art);
    this.$hint.hidden = true;
    this.$doc.textContent = app.doc;
    this.setTag(app.status);
    this.$count.textContent = "";
    this.$preview.classList.add("is-idle");

    this.announce("Cerebro is reading " + app.name + " for: " + goal.goal + ".");
    var t = 0, k = reduce ? 0.06 : 1;
    STAGES.forEach(function (name, i) {
      self.later(function () { self.stage(i); }, t);
      t += DUR[i] * k;
    });
    this.later(function () { self.ready(); }, t);
  };

  P.stage = function (i) {
    var self = this, app = this.app, g = this.goal, n = g.steps.length, count = COUNTS[app.id];
    var travel = i === 0 || reduce ? 0 : Math.round(Math.min(380, DUR[i - 1] * .75));
    this.$stages.forEach(function (li, k) {
      li.classList.toggle("is-done", k < i);
      li.classList.remove("is-active"); li.removeAttribute("aria-current");
    });
    this.setRail(i / (STAGES.length - 1), travel);
    this.later(function () {
      var li = self.$stages[i];
      li.classList.add("is-active"); li.setAttribute("aria-current", "step");
    }, travel);
    var detail = "";
    if (i === 0) {
      detail = esc(app.name) + (app.status === "available" ? "" : " · simulated");
      this.$preview.classList.add("is-scanning");
    } else if (i === 1) {
      detail = count ? "<b>" + count + "</b> found" : (app.status === "planned" ? "Representative controls · planned integration" : "Representative controls · concept");
    } else if (i === 2) {
      detail = "“" + esc(g.goal) + "”";
      this.$preview.classList.remove("is-scanning");
      this.showInterp(g.interp);
    } else if (i === 3) {
      detail = "Keeping <b>" + n + "</b> tools" + (count ? " · hiding the rest" : "");
      this.markPhasesUsed();
    } else if (i === 4) {
      detail = n + "-step workspace";
      this.showTools();
      this.$preview.classList.remove("is-idle");
      this.$count.textContent = "0 / " + n;
    } else {
      detail = "<b>" + n + "</b> tools";
    }
    this.status(STAGES[i], detail);
  };

  P.showInterp = function (text) {
    var el = this.$uText;
    el.className = "pg-understand-text";
    if (reduce) { el.textContent = text; return; }
    el.innerHTML = text.split(/(\s+)/).map(function (w, i) {
      return /^\s+$/.test(w) ? w : '<span class="pg-word" style="--w:' + i / 2 + '">' + esc(w) + "</span>";
    }).join("");
  };

  P.markPhasesUsed = function () {
    var used = {};
    this.goal.steps.forEach(function (s) { used[s.phase] = true; });
    this.$phases.forEach(function (p) { p.classList.toggle("is-used", !!used[p.getAttribute("data-phase")]); });
  };

  P.showTools = function () {
    var g = this.goal;
    this.$panel.classList.remove("is-idle");
    this.$title.textContent = g.title;
    this.$tools.innerHTML = g.steps.map(function (s, i) {
      return '<li class="is-in" style="--i:' + i + '"><button type="button" class="pg-tool" data-i="' + i + '">'
        + '<span class="pg-tool-n" aria-hidden="true">' + pad(i + 1) + "</span>"
        + '<span class="pg-tool-label">' + esc(s.label) + '<span class="sr-only pg-tool-sr"></span></span>'
        + '<span class="pill ' + s.trust + '" title="' + esc(s.phase) + '">' + TRUST[s.trust] + "</span></button></li>";
    }).join("");
    this.$toolBtns = $$(this.$tools, ".pg-tool");
    this.updateTools();
  };

  P.ready = function () {
    var g = this.goal;
    this.mode = "ready";
    this.$console.classList.remove("is-running");
    this.$console.classList.add("is-ready");
    var last = STAGES.length - 1;
    this.$stages.forEach(function (li, k) {
      li.classList.toggle("is-done", k < last);
      li.classList.toggle("is-active", k === last);
      if (k === last) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    this.setRail(1, 0);
    this.setMode("Ready");
    this.$reset.disabled = false;
    this.updateTools();
    var first = g.steps[0];
    this.$live.innerHTML = "Workspace ready. Press <b>" + esc(first.label) + "</b> or <b>Next step</b>.";
    this.announce("Workspace ready: " + g.title + ", " + g.steps.length + " tools.");
  };

  /* ---------------- using the workspace ---------------- */
  P.use = function (i) {
    if (this.mode !== "ready" || this.busy || !this.goal) return;
    var steps = this.goal.steps, self = this;
    if (i >= steps.length) return;
    if (i < this.next) { this.$live.innerHTML = "Already done: <b>" + esc(steps[i].label) + "</b>."; return; }
    var seq = [];
    for (var k = this.next; k <= i; k++) seq.push(k);
    this.busy = true;
    seq.forEach(function (k, j) {
      self.later(function () {
        self.apply(k, seq.length > 1 && j === seq.length - 1 ? seq[0] + 1 : 0);
        if (j === seq.length - 1) self.busy = false;
      }, j * (reduce ? 0 : 300));
    });
  };

  P.apply = function (k, from) {
    var g = this.goal, s = g.steps[k], n = g.steps.length;
    this.next = k + 1;
    this.setArt(k + 1);
    this.updateTools();
    var btn = this.$toolBtns && this.$toolBtns[k];
    if (btn && !reduce) { btn.classList.remove("is-ping"); void btn.offsetWidth; btn.classList.add("is-ping"); }
    this.flash();
    var msg = "";
    if (from) msg += "Ran steps " + from + "–" + (k + 1) + " in order. ";
    if (s.trust === "guide") msg += '<span class="pg-guide">Guide.</span> Cerebro points to this control; you use it in the app. ';
    if (this.app.status !== "available") msg += "Intended: ";
    msg += "<b>" + esc(s.did) + "</b>";
    if (this.next >= n) msg += " Workspace complete.";
    this.$live.innerHTML = msg;
  };

  P.resetSteps = function (say) {
    if (!this.goal || this.mode !== "ready") return;
    this.timers.forEach(clearTimeout); this.timers = []; this.busy = false;
    this.next = 0;
    this.setArt(0);
    this.updateTools();
    if (say) this.$live.innerHTML = "Reset. Start again with <b>" + esc(this.goal.steps[0].label) + "</b>.";
  };

  P.updateTools = function () {
    var g = this.goal, next = this.next, n = g.steps.length, ready = this.mode === "ready";
    (this.$toolBtns || []).forEach(function (b, i) {
      var done = i < next, isNext = ready && i === next;
      b.classList.toggle("is-done", done);
      b.classList.toggle("is-next", isNext);
      $(b, ".pg-tool-n").innerHTML = done ? CHECK : pad(i + 1);
      $(b, ".pg-tool-sr").textContent = done ? ", done" : (isNext ? ", next step" : "");
    });
    // phases: current = phase of the next step (or the last one when finished)
    var cur = next < n ? g.steps[next].phase : g.steps[n - 1].phase, complete = {};
    PHASES.forEach(function (p) {
      var inPhase = g.steps.filter(function (s) { return s.phase === p; });
      complete[p] = inPhase.length > 0 && g.steps.every(function (s, i) { return s.phase !== p || i < next; });
    });
    this.$phases.forEach(function (el) {
      var p = el.getAttribute("data-phase");
      el.classList.toggle("is-current", ready && p === cur && next < n);
      el.classList.toggle("is-complete", !!complete[p]);
    });
    this.$next.disabled = !ready || next >= n;
    this.$next.textContent = next >= n ? "Workspace complete" : (next === 0 ? "Start: " + g.steps[0].label : "Next: " + g.steps[next].label);
    this.$reset.disabled = !ready || next === 0;
    if (ready || this.mode === "running") this.$count.textContent = next + " / " + n;
    this.$hint.hidden = !(ready && next === 0);
    if (ready && next === 0) this.$hintText.textContent = "Step 1 · " + g.steps[0].label;
  };

  P.setArt = function (state) {
    (this.layers || []).forEach(function (layer) {
      var f = +layer.getAttribute("data-f"), t = +layer.getAttribute("data-t");
      layer.classList.toggle("pg-on", f <= state && state <= t);
    });
  };

  P.flash = function () {
    var p = this.$preview;
    p.classList.add("is-flash");
    clearTimeout(this.flashT);
    this.flashT = setTimeout(function () { p.classList.remove("is-flash"); }, 650);
  };

  /* ---------------- public ---------------- */
  var instance = null, queued = null;

  function init(root) {
    root = root || document.getElementById("pg-root");
    if (!root || !window.CerebroApps) return null;
    if (root.__cerebroPlayground) return root.__cerebroPlayground;
    var pg = new Playground(root);
    root.__cerebroPlayground = pg;
    if (!instance) instance = pg;
    if (queued) { var q = queued; queued = null; run(q.goal, q.app); }
    return pg;
  }

  function run(goalText, appId) {
    if (!instance) { queued = { goal: goalText, app: appId }; return; }
    var pg = instance;
    if (appId) {
      var app = pg.apps.find(appId);
      if (app && app !== pg.app) { pg.cancel(); pg.selectApp(app); if (pg.mode !== "running") pg.toIdle(); }
    }
    pg.$input.value = goalText || "";
    pg.activate(goalText || "");
  }

  window.addEventListener("cerebro:try", function (e) {
    var d = (e && e.detail) || {};
    run(d.goal, d.app);
  });

  window.CerebroPlayground = { init: init, run: run };

  function auto() {
    if (!document.getElementById("pg-root")) return;
    if (location.hash || !("requestIdleCallback" in window)) init();
    else requestIdleCallback(function () { init(); }, { timeout: 1500 });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto);
  else auto();
})();
