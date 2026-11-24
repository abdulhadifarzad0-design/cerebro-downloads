/* Cerebro core: the logo as a physical object.
   A single fragment shader ray-marches the mark (chrome ring, dark glass
   plate, red lens) under a fixed studio light rig. No 3D library needed.
   Usage: var core = CerebroCore(canvas, { fallback: "assets/core.png" });
          core.set({ power: 1 }); core.start(); */
(function () {
  "use strict";

  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime,uPower,uEnv,uSweep,uDist,uHalo,uPulse,uYaw,uPitch,uZoom;",
    "const vec3 RED=vec3(.745,.018,.049);",
    "const vec3 HOT=vec3(1.,.36,.30);",
    "mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}",
    "mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}",
    // machined outer ring: a rounded rectangle revolved around the view axis
    "float sdRing(vec3 p){vec2 q=vec2(length(p.xy)-1.,p.z);vec2 d=abs(q)-vec2(.105,.15)+.068;return length(max(d,0.))+min(max(d.x,d.y),0.)-.068;}",
    // recessed graphite plate
    "float sdPlate(vec3 p){vec2 d=vec2(length(p.xy)-.93,abs(p.z+.10)-.03);return min(max(d.x,d.y),0.)+length(max(d,0.))-.008;}",
    // domed lens: sphere cut by a cylinder
    "float sdCore(vec3 p){float s=length(p-vec3(0.,0.,-.50))-.64;float c=length(p.xy)-.30;return max(max(s,c),-(p.z+.075));}",
    // fine chrome bezel around the lens
    "float sdBezel(vec3 p){vec2 q=vec2(length(p.xy)-.332,p.z+.035);return length(q)-.032;}",
    "vec2 map(vec3 p){vec2 r=vec2(sdRing(p),1.);float b=sdBezel(p);if(b<r.x)r=vec2(b,1.);",
    "float c=sdCore(p);if(c<r.x)r=vec2(c,3.);float l=sdPlate(p);if(l<r.x)r=vec2(l,2.);return r;}",
    "vec3 nrm(vec3 p){vec2 e=vec2(1.,-1.)*.0007;return normalize(e.xyy*map(p+e.xyy).x+e.yyx*map(p+e.yyx).x+e.yxy*map(p+e.yxy).x+e.xxx*map(p+e.xxx).x);}",
    // studio: long overhead strip, key softbox, cool rim, and a moving sweep
    "vec3 env(vec3 d){",
    "  vec3 c=vec3(.004,.004,.005)+vec3(.022)*smoothstep(-.3,1.,d.y);",
    "  c+=vec3(1.,.99,.97)*1.5*smoothstep(.10,.0,abs(d.y-.62))*smoothstep(.95,.25,abs(d.x));",
    "  vec2 k=vec2(d.x+.58,d.y-.30);c+=vec3(.94,.96,1.)*2.4*smoothstep(.30,.16,max(abs(k.x)*.9,abs(k.y)*1.7));",
    "  c+=vec3(.74,.80,.92)*1.1*smoothstep(.07,.0,abs(d.x-.80))*smoothstep(.75,.15,abs(d.y));",
    "  c+=vec3(.06,.008,.012)*smoothstep(.0,-.9,d.y);",
    "  float s=dot(d,normalize(vec3(1.,.42,.25)));c+=vec3(1.)*3.2*smoothstep(.10,.0,abs(s-uSweep));",
    "  return c;}",
    "vec3 tone(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}",
    "void main(){",
    "  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;",
    "  vec3 ro=vec3(0.,0.,uDist);vec3 rd=normalize(vec3(uv*uZoom,-1.));",
    "  mat3 R=ry(uYaw)*rx(uPitch);mat3 Ri=rx(-uPitch)*ry(-uYaw);",
    // halo: light scattered around the lens, strongest near the axis
    "  vec3 cp=ro-dot(ro,rd)*rd;float ax=length(cp);",
    "  vec3 halo=RED*uPower*uHalo*(.95*exp(-ax*ax*5.)+.22*exp(-ax*2.6))*smoothstep(.5,.2,length(uv));",
    "  float b=dot(ro,rd),cc=dot(ro,ro)-1.69,h=b*b-cc;",
    "  vec3 col=halo;float alpha=0.;",
    "  if(h>0.){",
    "    float t=-b-sqrt(h),t1=-b+sqrt(h);vec3 o=Ri*ro,dd=Ri*rd;vec2 m=vec2(1.,0.);bool hit=false;",
    "    for(int i=0;i<96;i++){vec3 p=o+dd*t;m=map(p);if(m.x<.0004*t){hit=true;break;}t+=m.x*.92;if(t>t1)break;}",
    "    if(hit){",
    "      vec3 p=o+dd*t;vec3 n=nrm(p);vec3 nw=R*n;vec3 r=reflect(rd,nw);",
    "      float fr=pow(1.-max(dot(nw,-rd),0.),5.);float rr=length(p.xy);",
    "      float ao=0.,sc=1.;for(int j=0;j<4;j++){float hh=.02+.045*float(j);ao+=(hh-map(p+n*hh).x)*sc;sc*=.6;}ao=clamp(1.-2.6*ao,0.,1.);",
    "      vec3 cIn=normalize(vec3(-p.xy,.28));",
    "      if(m.y<1.5){",
    "        vec3 F=mix(vec3(.80,.81,.83),vec3(1.),fr);",
    "        col=env(r)*F*uEnv*ao;",
    "        col+=RED*uPower*max(dot(n,cIn),0.)*exp(-2.4*max(rr-.3,0.))*.78;",
    "      }else if(m.y<2.5){",
    "        col=vec3(.004,.004,.005)+env(r)*(.03+.30*fr)*uEnv;",
    "        col+=RED*uPower*.32*exp(-6.4*max(rr-.30,0.));",
    "        float ring=0.;for(int k=0;k<3;k++){float ph=fract(uTime*.26+float(k)/3.);ring+=smoothstep(.022,.0,abs(rr-(.34+ph*.56)))*(1.-ph)*(1.-ph);}",
    "        col+=RED*ring*uPulse*.75;",
    "        col+=vec3(.018)*(.5+.5*sin(rr*240.))*uEnv*.35*smoothstep(.3,.5,rr);",
    "        col*=ao;",
    "      }else{",
    "        float q=rr/.30;float ang=atan(p.y,p.x);",
    "        float iris=.92+.08*sin(ang*14.+uTime*.55)*smoothstep(.3,.9,q);",
    "        vec3 em=mix(HOT,RED,smoothstep(.0,.42,q));em=mix(em,RED*.42,smoothstep(.55,1.,q));",
    "        float fl=.95+.05*sin(uTime*11.)*sin(uTime*6.7);",
    "        col=vec3(.028,.0,.004)+em*uPower*iris*fl*1.7;",
    "        col+=env(r)*(.04+.96*fr)*(.35+.65*uEnv);",
    "      }",
    "      alpha=1.;",
    "    }",
    "  }",
    "  col=pow(tone(col),vec3(.4545));",
    "  if(alpha<1.){alpha=clamp(max(col.r,max(col.g,col.b)),0.,1.);}",
    "  gl_FragColor=vec4(col,alpha);",
    "}"
  ].join("\n");

  function CerebroCore(canvas, opts) {
    opts = opts || {};
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.preserve });
    } catch (e) { gl = null; }

    var state = { power: .6, env: 1.2, sweep: -3, dist: 4.3, halo: 1, pulse: .25, yaw: -.18, pitch: -.2, zoom: .62 };
    var target = {};
    Object.keys(state).forEach(function (k) { target[k] = state[k]; });
    if (opts.state) { Object.keys(opts.state).forEach(function (k) { state[k] = target[k] = opts.state[k]; }); }

    var api = {
      ok: !!gl, state: state, target: target, driven: false, onFrame: null,
      set: function (o, instant) { Object.keys(o).forEach(function (k) { target[k] = o[k]; if (instant) state[k] = o[k]; }); if (!running) draw(); return api; },
      start: function () { wanted = true; sync(); return api; },
      stop: function () { wanted = false; sync(); return api; },
      resize: function () { resize(); draw(); },
      draw: function () { draw(); }
    };

    function fallback() {
      api.ok = false;
      if (!opts.fallback || !canvas.parentNode) return;
      var img = new Image(); img.src = opts.fallback; img.alt = ""; img.className = canvas.className + " core-fallback";
      img.setAttribute("aria-hidden", "true");
      canvas.parentNode.replaceChild(img, canvas);
    }
    if (!gl) { fallback(); return api; }

    // Compile without blocking the page where the browser can do it in parallel.
    var par = gl.getExtension("KHR_parallel_shader_compile");
    var prog = gl.createProgram(), ready = false, U = {};
    [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(prog, sh);
    });
    gl.linkProgram(prog);
    function linked() {
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("[cerebro core]", gl.getProgramInfoLog(prog)); fallback(); return; }
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ["uRes", "uTime", "uPower", "uEnv", "uSweep", "uDist", "uHalo", "uPulse", "uYaw", "uPitch", "uZoom"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
      ready = true;
      resize(); draw();
    }
    function poll() { if (gl.getProgramParameter(prog, par.COMPLETION_STATUS_KHR)) linked(); else requestAnimationFrame(poll); }

    var running = false, wanted = false, visible = true, raf = 0, t0 = performance.now(), last = 0;
    var mouse = { x: 0, y: 0, sx: 0, sy: 0 };

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = canvas.clientWidth || r.width, h = canvas.clientHeight || r.height;
      if (!w || !h) return;
      var scale = Math.min(2, Math.max(1.25, window.devicePixelRatio || 1)) * (opts.resolution || 1);
      var px = w * h * scale * scale, max = opts.maxPixels || 2.2e6;
      if (px > max) scale *= Math.sqrt(max / px);
      var W = Math.round(w * scale), H = Math.round(h * scale);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
    }

    function draw(now) {
      if (!ready) return;
      now = now || performance.now();
      var time = (now - t0) / 1000;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, reduce ? 4.2 : time);
      gl.uniform1f(U.uPower, state.power);
      gl.uniform1f(U.uEnv, state.env);
      gl.uniform1f(U.uSweep, state.sweep);
      gl.uniform1f(U.uDist, state.dist);
      gl.uniform1f(U.uHalo, state.halo);
      gl.uniform1f(U.uPulse, reduce ? 0 : state.pulse);
      gl.uniform1f(U.uYaw, state.yaw + mouse.sx);
      gl.uniform1f(U.uPitch, state.pitch + mouse.sy);
      gl.uniform1f(U.uZoom, state.zoom);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
      if (api.onFrame) api.onFrame(now, dt);
      if (!api.driven) {
        var k = 1 - Math.pow(.0025, dt);
        Object.keys(target).forEach(function (key) { state[key] += (target[key] - state[key]) * k; });
      }
      if (opts.mouse) {
        var m = 1 - Math.pow(.01, dt);
        mouse.sx += (mouse.x - mouse.sx) * m; mouse.sy += (mouse.y - mouse.sy) * m;
      }
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function sync() {
      var should = wanted && visible && !document.hidden && !reduce;
      if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
      else if (!should && running) { running = false; cancelAnimationFrame(raf); }
      if (!should) draw();
    }

    if (opts.mouse && !reduce && window.matchMedia && matchMedia("(hover: hover)").matches) {
      window.addEventListener("pointermove", function (e) {
        mouse.x = (e.clientX / innerWidth - .5) * .5;
        mouse.y = (e.clientY / innerHeight - .5) * .32;
      }, { passive: true });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; sync(); }, { rootMargin: "120px" }).observe(canvas);
    }
    document.addEventListener("visibilitychange", sync);
    if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); if (!running) draw(); }).observe(canvas);
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); running = false; });

    if (par) { resize(); poll(); } else linked();
    return api;
  }

  window.CerebroCore = CerebroCore;
})();
