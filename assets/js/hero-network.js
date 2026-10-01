/* Holistence Academy — Anasayfa 3B Hero: "Bilgi Ağı" (Three.js r128)
   Uzayda süzülen bağlantılı düğümler. Büyük altın düğümler Holistence'ın platform ve
   hizmet alanlarıdır; aralarında sinyaller dolaşır. Fare ağı döndürür ve yakındaki
   düğümleri aydınlatır.
   - prefers-reduced-motion: tek kare statik çizim
   - WebGL yoksa: CSS arka plan (.hero-fallback) görünür kalır
   - Hero ekran dışındayken / sekme gizliyken çizim durur */
(function () {
  'use strict';
  var host = document.getElementById('hero-canvas');
  if (!host || typeof THREE === 'undefined') return;
  try { var t = document.createElement('canvas'); if (!(t.getContext('webgl') || t.getContext('experimental-webgl'))) return; } catch (e) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Ana düğümler (etiketli) ---------- */
  var HUBS = [
    { tr: 'Holistence Publications', en: 'Holistence Publications', big: 1, url: 'https://publications.holistence.com/' },
    { tr: 'journals.gen.tr', en: 'journals.gen.tr', big: 1, url: 'https://journals.gen.tr/' },
    { tr: 'Holivent', en: 'Holivent', big: 1, url: 'https://holivent.com/' },
    { tr: 'IDA Campus', en: 'IDA Campus', url: 'https://idacampus.com/' },
    { tr: 'Holistence Events', en: 'Holistence Events', url: 'https://events.holistence.com/' },
    { tr: 'Ar-Ge', en: 'R&D' },
    { tr: 'Yazılım', en: 'Software' },
    { tr: 'Akademik Kitap', en: 'Academic Books' },
    { tr: 'Hakemli Dergiler', en: 'Peer-reviewed Journals' },
    { tr: 'Kongreler', en: 'Congresses' },
    { tr: 'Danışmanlık', en: 'Consulting' },
    { tr: 'Uzaktan Eğitim', en: 'Distance Learning' }
  ];

  var C_CYAN = new THREE.Color('#3FE0D0'), C_TEAL = new THREE.Color('#14A3B3'), C_GOLD = new THREE.Color('#E3BF6A');

  /* ---------- Sahne ---------- */
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  var PR = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  renderer.setPixelRatio(PR); renderer.setClearColor(0, 0);
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  var labelLayer = document.createElement('div');
  labelLayer.className = 'net-labels'; labelLayer.setAttribute('aria-hidden', 'true');
  host.appendChild(labelLayer);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);
  var stage = new THREE.Group(), net = new THREE.Group();
  scene.add(stage); stage.add(net);

  /* ---------- Düğüm konumları ---------- */
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(20160);
  function onSphere(r) { var u = rnd() * 2 - 1, th = rnd() * 6.2832, q = Math.sqrt(1 - u * u); return new THREE.Vector3(r * q * Math.cos(th), r * u * 0.82, r * q * Math.sin(th)); }
  var nodes = [];
  HUBS.forEach(function (h, i) {
    // ana düğümleri altın oran spiraline yerleştir: dengeli dağılım
    var k = i + 0.5, n = HUBS.length, phi = Math.acos(1 - 2 * k / n), th = Math.PI * (1 + Math.sqrt(5)) * k;
    var r = h.big ? 1.25 : 1.75;
    nodes.push({ p: new THREE.Vector3(r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi) * 0.85, r * Math.sin(phi) * Math.sin(th)), hub: i, size: h.big ? 1 : 0.75 });
  });
  var N = coarse ? 150 : 240;
  for (var i = 0; i < N; i++) {
    var anchor = nodes[Math.floor(rnd() * HUBS.length)].p, v;
    if (rnd() < 0.55) v = anchor.clone().add(onSphere(0.25 + rnd() * 0.55)); // ana düğüm çevresinde küme
    else v = onSphere(0.6 + rnd() * 1.75);
    nodes.push({ p: v, hub: -1, size: 0 });
  }

  /* ---------- Kenarlar: en yakın komşular + ana düğüm omurgası ---------- */
  var edges = [], adj = nodes.map(function () { return []; }), seen = {};
  function link(a, b) { var k = a < b ? a + '_' + b : b + '_' + a; if (seen[k] || a === b) return; seen[k] = 1; edges.push([a, b]); adj[a].push(b); adj[b].push(a); }
  nodes.forEach(function (n, a) {
    var d = nodes.map(function (m, b) { return [n.p.distanceToSquared(m.p), b]; }).sort(function (x, y) { return x[0] - y[0]; });
    var k = n.hub > -1 ? 6 : 2 + (rnd() < 0.4 ? 1 : 0);
    for (var j = 1; j <= k; j++) link(a, d[j][1]);
  });
  for (var h = 0; h < HUBS.length; h++) { link(h, (h + 1) % HUBS.length); if (h % 3 === 0) link(h, (h + 5) % HUBS.length); }

  /* ---------- Düğüm noktaları ---------- */
  var pos = new Float32Array(nodes.length * 3), sz = new Float32Array(nodes.length), sd = new Float32Array(nodes.length);
  nodes.forEach(function (n, k) { pos[k * 3] = n.p.x; pos[k * 3 + 1] = n.p.y; pos[k * 3 + 2] = n.p.z; sz[k] = n.hub > -1 ? 7 + n.size * 5 : 2 + rnd() * 2.6; sd[k] = rnd(); });
  var pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('size', new THREE.BufferAttribute(sz, 1));
  pg.setAttribute('seed', new THREE.BufferAttribute(sd, 1));
  var U = { uTime: { value: 0 }, uPR: { value: PR }, uMouse: { value: new THREE.Vector3(99, 99, 99) }, uA: { value: C_TEAL }, uB: { value: C_CYAN }, uG: { value: C_GOLD } };
  var pm = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: [
      'attribute float size;attribute float seed;uniform float uTime;uniform float uPR;uniform vec3 uMouse;varying float vSeed;varying float vHub;varying float vNear;varying float vDepth;',
      'void main(){vSeed=seed;vHub=step(6.5,size);vec4 w=modelMatrix*vec4(position,1.);vNear=smoothstep(1.1,0.,distance(w.xyz,uMouse));',
      'vec4 mv=viewMatrix*w;vDepth=smoothstep(9.,4.,-mv.z);float pulse=1.+.18*sin(uTime*2.+seed*30.);',
      'gl_PointSize=size*uPR*pulse*(1.+vNear*.9)*(5.5/-mv.z);gl_Position=projectionMatrix*mv;}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uA;uniform vec3 uB;uniform vec3 uG;varying float vSeed;varying float vHub;varying float vNear;varying float vDepth;',
      'void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;',
      'float core=smoothstep(.5,.0,r);float ring=vHub*smoothstep(.06,.0,abs(r-.42));',
      'vec3 c=mix(mix(uA,uB,vSeed),uG,max(vHub,vNear*.6));',
      'float a=(pow(core,1.6)+ring*.8)*(.35+.65*vDepth);gl_FragColor=vec4(c*(1.+vNear*.6),a);}'
    ].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  net.add(new THREE.Points(pg, pm));

  /* ---------- Bağlantı çizgileri ---------- */
  var lp = new Float32Array(edges.length * 6), lh = new Float32Array(edges.length * 2);
  edges.forEach(function (e, k) {
    var a = nodes[e[0]].p, b = nodes[e[1]].p;
    lp.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6);
    var hubEdge = (nodes[e[0]].hub > -1 && nodes[e[1]].hub > -1) ? 1 : 0;
    lh[k * 2] = lh[k * 2 + 1] = hubEdge;
  });
  var lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lg.setAttribute('hubEdge', new THREE.BufferAttribute(lh, 1));
  var lm = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'attribute float hubEdge;uniform vec3 uMouse;varying float vH;varying float vN;varying float vD;void main(){vH=hubEdge;vec4 w=modelMatrix*vec4(position,1.);vN=smoothstep(1.3,0.,distance(w.xyz,uMouse));vec4 mv=viewMatrix*w;vD=smoothstep(9.,4.,-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 uB;uniform vec3 uG;varying float vH;varying float vN;varying float vD;void main(){vec3 c=mix(uB,uG,max(vH,vN*.7));gl_FragColor=vec4(c,(.07+vH*.16+vN*.35)*(.3+.7*vD));}',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  net.add(new THREE.LineSegments(lg, lm));

  /* ---------- Dolaşan sinyaller (graf üzerinde yürüyüş) ---------- */
  var S = coarse ? 26 : 46, sp = new Float32Array(S * 3), sigs = [];
  for (var s = 0; s < S; s++) { var from = Math.floor(rnd() * nodes.length); sigs.push({ a: from, b: adj[from][0] || 0, t: rnd(), v: 0.35 + rnd() * 0.6 }); }
  var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  var sm = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'uniform float uPR;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=6.*uPR*(5.5/-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 uG;void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;gl_FragColor=vec4(mix(vec3(1.),uG,.35),pow(smoothstep(.5,0.,r),2.));}',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  net.add(new THREE.Points(sg, sm));
  function stepSignals(dt) {
    var tmp = new THREE.Vector3();
    sigs.forEach(function (g, k) {
      var A = nodes[g.a].p, B = nodes[g.b].p, len = A.distanceTo(B) || 1;
      g.t += dt * g.v / len;
      if (g.t >= 1) { var nb = adj[g.b]; var next = nb[Math.floor(rnd() * nb.length)]; if (next === g.a && nb.length > 1) next = nb[(nb.indexOf(next) + 1) % nb.length]; g.a = g.b; g.b = next; g.t = 0; A = nodes[g.a].p; B = nodes[g.b].p; }
      tmp.lerpVectors(A, B, g.t); sp[k * 3] = tmp.x; sp[k * 3 + 1] = tmp.y; sp[k * 3 + 2] = tmp.z;
    });
    sg.attributes.position.needsUpdate = true;
  }
  stepSignals(0);

  /* ---------- Toz / derinlik parçacıkları ---------- */
  var DN = coarse ? 400 : 900, dp = new Float32Array(DN * 3);
  for (var d = 0; d < DN; d++) { var v2 = onSphere(4 + rnd() * 10); dp[d * 3] = v2.x; dp[d * 3 + 1] = v2.y * 1.2; dp[d * 3 + 2] = v2.z - 5; }
  var dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  var dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x9fdcd6, size: 0.02, transparent: true, opacity: 0.45, depthWrite: false }));
  scene.add(dust);

  /* ---------- Etiketler ---------- */
  var labels = HUBS.map(function (hb, k) {
    var el = document.createElement(hb.url ? 'a' : 'span');
    el.className = 'net-label' + (hb.big ? ' big' : '') + (hb.url ? ' has-url' : '');
    if (hb.url) { el.href = hb.url; el.target = '_blank'; el.rel = 'noopener'; el.tabIndex = -1; }
    el.innerHTML = '<i></i><b data-l="tr">' + hb.tr + '</b><b data-l="en">' + hb.en + '</b>';
    labelLayer.appendChild(el); return el;
  });
  var proj = new THREE.Vector3();
  function placeLabels() {
    var w = host.clientWidth, h = host.clientHeight;
    labels.forEach(function (el, k) {
      proj.copy(nodes[k].p).applyMatrix4(net.matrixWorld);
      var depth = proj.clone().applyMatrix4(camera.matrixWorldInverse).z;
      proj.project(camera);
      var x = (proj.x * 0.5 + 0.5) * w, y = (-proj.y * 0.5 + 0.5) * h;
      var vis = Math.max(0, Math.min(1, (depth + 7.2) / 1.6)); // önde olanlar daha görünür
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      el.style.opacity = (0.15 + vis * 0.85).toFixed(2);
      el.style.zIndex = String(Math.round(100 + depth * 10));
    });
  }

  /* ---------- Yerleşim ---------- */
  var mobile = false;
  function layout() {
    var w = host.clientWidth || innerWidth, h = host.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    mobile = w < 960;
    labelLayer.style.display = w < 640 ? 'none' : '';
    if (mobile) stage.position.set(0, -1.6, -1.2);
    else { var vw = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect; stage.position.set(Math.min(vw * 0.25, 2.3), 0, 0); }
    if (reduce) frame(0, 0);
  }

  /* ---------- Etkileşim ---------- */
  var tx = 0, ty = 0, mx = 0, my = 0, ndc = new THREE.Vector2(9, 9), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3();
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
    var r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }, { passive: true });
  host.addEventListener('pointerleave', function () { ndc.set(9, 9); });
  var scrollP = 0;
  window.addEventListener('scroll', function () { scrollP = Math.min(1, scrollY / (host.clientHeight || 800)); }, { passive: true });

  /* ---------- Döngü ---------- */
  var clock = new THREE.Clock(), last = 0, intro = 0, run = false, raf = 0, visible = true;
  function frame(time, dt) {
    U.uTime.value = time;
    if (dt) stepSignals(dt);
    // fare konumunu ağın derinlik düzlemine yansıt
    if (Math.abs(ndc.x) < 2) { plane.constant = -stage.position.z; ray.setFromCamera(ndc, camera); if (ray.ray.intersectPlane(plane, hit)) U.uMouse.value.copy(hit); }
    else U.uMouse.value.set(99, 99, 99);
    renderer.render(scene, camera);
    placeLabels();
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    var time = clock.getElapsedTime(), dt = Math.min(0.05, time - last); last = time;
    intro = Math.min(1, intro + 0.01); var e = 1 - Math.pow(1 - intro, 3);
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    net.rotation.y = time * 0.06 + mx * 0.9 + (1 - e) * -1.2;
    net.rotation.x = 0.18 + my * 0.5;
    net.rotation.z = Math.sin(time * 0.1) * 0.05;
    stage.scale.setScalar((mobile ? 0.95 : 1) * (0.7 + 0.3 * e) * (1 - scrollP * 0.12));
    dust.rotation.y = time * 0.01 + mx * 0.1; dust.rotation.x = my * 0.05;
    var op = Math.min(1, e * 1.3) * (1 - scrollP * 0.7);
    renderer.domElement.style.opacity = labelLayer.style.opacity = String(op);
    frame(time, dt);
  }
  function start() { if (run || reduce) return; run = true; last = clock.getElapsedTime(); loop(); }
  function stop() { run = false; cancelAnimationFrame(raf); }

  layout(); addEventListener('resize', layout);
  if (reduce) { net.rotation.set(0.18, 0.6, 0); frame(0, 0); }
  else {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !document.hidden) start(); else stop(); }).observe(host);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    start();
  }
  document.documentElement.classList.add('has-3d');
})();
