/* Holistence Academy — Anasayfa 3B Hero (Three.js r128)
   Çanakkale merkezli nokta-küre, iş ortaklarına ışık yayları, yörünge halkaları ve yıldız alanı.
   - prefers-reduced-motion: tek kare statik çizim
   - WebGL yoksa: CSS arka plan (.hero-fallback) görünür kalır
   - Hero ekran dışındayken / sekme gizliyken çizim durur (pil & CPU dostu) */
(function () {
  'use strict';
  var host = document.getElementById('hero-canvas');
  if (!host || typeof THREE === 'undefined') return;

  try {
    var test = document.createElement('canvas');
    if (!(test.getContext('webgl') || test.getContext('experimental-webgl'))) return;
  } catch (e) { return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- Veri ---------- */
  var HUB = { name: 'Çanakkale', lat: 40.155, lon: 26.414 };
  // İş ortakları (sitedeki logolarla aynı kurumlar)
  var PARTNERS = [
    { name: 'Bandırma Onyedi Eylül', lat: 40.352, lon: 27.977 },
    { name: 'Sakarya', lat: 40.742, lon: 30.333 },
    { name: 'Toros (Mersin)', lat: 36.812, lon: 34.641 },
    { name: 'Spiru Haret (Bükreş)', lat: 44.426, lon: 26.102 },
    { name: 'Prishtina', lat: 42.663, lon: 21.166 },
    { name: 'Balkan (Üsküp)', lat: 41.998, lon: 21.425 }
  ];
  // Dekoratif "uluslararası erişim" yayları (kurum iddiası içermez)
  var REACH = [
    { lat: 51.507, lon: -0.128 }, { lat: 40.713, lon: -74.006 }, { lat: 35.676, lon: 139.650 },
    { lat: 52.520, lon: 13.405 }, { lat: 48.857, lon: 2.352 }, { lat: 25.205, lon: 55.271 },
    { lat: -33.869, lon: 151.209 }, { lat: 1.352, lon: 103.820 }, { lat: 55.756, lon: 37.617 },
    { lat: 30.044, lon: 31.236 }, { lat: -23.551, lon: -46.633 }, { lat: 28.614, lon: 77.209 },
    { lat: 43.651, lon: -79.347 }, { lat: 41.903, lon: 12.496 }, { lat: 59.329, lon: 18.069 }
  ];

  var C_CYAN = new THREE.Color('#3FE0D0');
  var C_TEAL = new THREE.Color('#14A3B3');
  var C_GOLD = new THREE.Color('#E3BF6A');

  function ll2v(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }

  /* ---------- Sahne ---------- */
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  var stage = new THREE.Group();   // yerleşim (sağa kaydırma / mobilde aşağı)
  var tilt = new THREE.Group();    // fare paralaksı + enlem eğimi
  var spin = new THREE.Group();    // dönüş
  scene.add(stage); stage.add(tilt); tilt.add(spin);

  var hubV = ll2v(HUB.lat, HUB.lon, 1);
  var baseRotY = -Math.atan2(hubV.x, hubV.z);
  var baseTiltX = HUB.lat * Math.PI / 180 * 0.72;
  spin.rotation.y = baseRotY;
  tilt.rotation.x = baseTiltX;

  /* ---------- Küre gövdesi + atmosfer ---------- */
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(0.985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x070C16 })));

  var atmo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 64), new THREE.ShaderMaterial({
    uniforms: { c: { value: C_TEAL } },
    vertexShader: 'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 c;varying vec3 vN;varying vec3 vP;void main(){float f=pow(abs(dot(vN,normalize(-vP))),1.6);gl_FragColor=vec4(c*f*.8,1.);}',
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
  }));
  tilt.add(atmo);

  /* ---------- Kara noktaları ---------- */
  var L = window.HL_LAND || [];
  var n = L.length / 2;
  var pos = new Float32Array(n * 3), rnd = new Float32Array(n);
  for (var i = 0; i < n; i++) {
    var v = ll2v(L[i * 2] / 10, L[i * 2 + 1] / 10, 1.0);
    pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; rnd[i] = Math.random();
  }
  var landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  landGeo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
  var landMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: 2.6 * renderer.getPixelRatio() }, uHub: { value: hubV }, uA: { value: C_TEAL }, uB: { value: C_CYAN }, uG: { value: C_GOLD } },
    vertexShader: [
      'attribute float rnd;uniform float uTime;uniform float uSize;uniform vec3 uHub;varying float vR;varying float vFace;varying float vHub;',
      'void main(){vR=rnd;vec4 mv=modelViewMatrix*vec4(position,1.);',
      'vec3 n=normalize(normalMatrix*position);vFace=dot(n,normalize(-mv.xyz));',
      'float d=distance(position,uHub);vHub=smoothstep(.35,0.,d)*(.6+.4*sin(uTime*2.-d*30.));',
      'gl_PointSize=uSize*(1.+vHub*.9)*(3.2/-mv.z);gl_Position=projectionMatrix*mv;}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uA;uniform vec3 uB;uniform vec3 uG;uniform float uTime;varying float vR;varying float vFace;varying float vHub;',
      'void main(){vec2 p=gl_PointCoord-.5;float r=length(p);if(r>.5)discard;',
      'float tw=.65+.35*sin(uTime*1.3+vR*40.);vec3 col=mix(uA,uB,vR*.8);col=mix(col,uG,vHub);',
      'float a=smoothstep(.5,.15,r)*smoothstep(-.05,.35,vFace)*tw;gl_FragColor=vec4(col,a);}'
    ].join('\n'),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  spin.add(new THREE.Points(landGeo, landMat));

  /* ---------- Yaylar ---------- */
  var arcMats = [];
  function arc(fromV, toV, color, alphaBase, speed, radius) {
    var a = fromV.clone().normalize(), b = toV.clone().normalize();
    var ang = a.angleTo(b), h = 0.04 + ang * 0.42, pts = [], seg = 64;
    var axis = new THREE.Vector3().crossVectors(a, b).normalize();
    for (var k = 0; k <= seg; k++) {
      var t = k / seg, q = new THREE.Quaternion().setFromAxisAngle(axis, ang * t);
      pts.push(a.clone().applyQuaternion(q).multiplyScalar(1.004 + h * Math.sin(Math.PI * t)));
    }
    var geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, radius, 6, false);
    var m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uC: { value: color }, uBase: { value: alphaBase }, uSpd: { value: speed }, uOff: { value: Math.random() } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: [
        'uniform float uTime;uniform vec3 uC;uniform float uBase;uniform float uSpd;uniform float uOff;varying vec2 vUv;',
        'void main(){float head=fract(uTime*uSpd+uOff)*1.4-.2;float d=head-vUv.x;',
        'float trail=d>0.&&d<.28?pow(1.-d/.28,2.):0.;float edge=smoothstep(0.,.06,vUv.x)*smoothstep(1.,.94,vUv.x);',
        'gl_FragColor=vec4(uC,(uBase+trail)*edge);}'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    arcMats.push(m);
    spin.add(new THREE.Mesh(geo, m));
  }
  PARTNERS.forEach(function (p) { arc(hubV, ll2v(p.lat, p.lon, 1), C_GOLD, 0.22, 0.22 + Math.random() * 0.12, 0.0045); });
  REACH.forEach(function (p) { arc(hubV, ll2v(p.lat, p.lon, 1), C_CYAN, 0.06, 0.08 + Math.random() * 0.08, 0.0028); });

  /* ---------- İşaretçiler (merkez + ortaklar) ---------- */
  var rings = [];
  function marker(v, color, size, ringScale) {
    var dot = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), new THREE.MeshBasicMaterial({ color: color }));
    dot.position.copy(v.clone().multiplyScalar(1.006)); spin.add(dot);
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 48), new THREE.MeshBasicMaterial({ color: color, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    ring.position.copy(v.clone().multiplyScalar(1.008));
    ring.lookAt(v.clone().multiplyScalar(2));
    ring.userData = { s: ringScale, o: Math.random() };
    spin.add(ring); rings.push(ring);
  }
  marker(hubV, C_GOLD, 0.018, 0.11);
  PARTNERS.forEach(function (p) { marker(ll2v(p.lat, p.lon, 1), C_GOLD, 0.008, 0.045); });
  REACH.forEach(function (p) { marker(ll2v(p.lat, p.lon, 1), C_CYAN, 0.006, 0.035); });

  /* ---------- Yörünge halkaları + uydular ---------- */
  var orbits = [];
  [[1.42, 0.35, 0.2, 0.18], [1.62, -0.55, -0.3, -0.12], [1.85, 1.15, 0.5, 0.08]].forEach(function (o, idx) {
    var g = new THREE.Group(); g.rotation.set(o[1], o[2], 0); tilt.add(g);
    var curve = new THREE.EllipseCurve(0, 0, o[0], o[0], 0, Math.PI * 2);
    var lg = new THREE.BufferGeometry().setFromPoints(curve.getPoints(180).map(function (p) { return new THREE.Vector3(p.x, 0, p.y); }));
    g.add(new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: idx === 1 ? C_GOLD : C_TEAL, transparent: true, opacity: idx === 1 ? 0.18 : 0.14 })));
    var sat = new THREE.Mesh(new THREE.SphereGeometry(idx === 1 ? 0.022 : 0.016, 12, 12), new THREE.MeshBasicMaterial({ color: idx === 1 ? C_GOLD : C_CYAN }));
    g.add(sat);
    orbits.push({ g: g, r: o[0], sat: sat, spd: o[3], a: Math.random() * 6.28 });
  });

  /* ---------- Yıldız alanı ---------- */
  var sN = coarse ? 700 : 1400, sp = new Float32Array(sN * 3), sr = new Float32Array(sN);
  for (var s = 0; s < sN; s++) {
    var u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = 7 + Math.random() * 14, q = Math.sqrt(1 - u * u);
    sp[s * 3] = rr * q * Math.cos(th); sp[s * 3 + 1] = rr * u; sp[s * 3 + 2] = rr * q * Math.sin(th) - 6; sr[s] = Math.random();
  }
  var starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute('rnd', new THREE.BufferAttribute(sr, 1));
  var starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float rnd;uniform float uTime;uniform float uPR;varying float a;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);a=.25+.75*(.5+.5*sin(uTime*(.6+rnd*1.6)+rnd*90.));gl_PointSize=(1.+rnd*1.8)*uPR;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying float a;void main(){vec2 p=gl_PointCoord-.5;if(length(p)>.5)discard;gl_FragColor=vec4(.85,.95,1.,a*.7);}',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- Yerleşim ---------- */
  var mobile = false;
  function layout() {
    var w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    mobile = w < 960;
    if (mobile) { stage.position.set(0, -1.05, -0.6); stage.scale.setScalar(1.0); }
    else {
      var vw = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z * camera.aspect;
      stage.position.set(Math.min(vw * 0.24, 1.55), -0.05, 0); stage.scale.setScalar(1.08);
    }
    if (reduce) render(0);
  }

  /* ---------- Etkileşim ---------- */
  var mx = 0, my = 0, tx = 0, ty = 0, drag = 0, dragV = 0, down = false, lastX = 0;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth - 0.5); ty = (e.clientY / window.innerHeight - 0.5);
    if (down) { var dx = e.clientX - lastX; lastX = e.clientX; dragV = dx * 0.005; drag += dragV; }
  }, { passive: true });
  host.addEventListener('pointerdown', function (e) { if (coarse) return; down = true; lastX = e.clientX; host.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', function () { down = false; host.style.cursor = ''; });

  var scrollP = 0;
  window.addEventListener('scroll', function () { scrollP = Math.min(1, window.scrollY / (host.clientHeight || 800)); }, { passive: true });

  /* ---------- Döngü ---------- */
  var clock = new THREE.Clock(), running = false, visible = true, raf = 0, intro = 0;
  function render(t) {
    landMat.uniforms.uTime.value = t; starMat.uniforms.uTime.value = t;
    arcMats.forEach(function (m) { m.uniforms.uTime.value = t; });
    rings.forEach(function (r) {
      var k = (t * 0.55 + r.userData.o) % 1;
      r.scale.setScalar(r.userData.s * (0.2 + k)); r.material.opacity = (1 - k) * 0.85;
    });
    orbits.forEach(function (o) {
      var a = o.a + t * o.spd; o.sat.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r);
      o.g.rotation.y += reduce ? 0 : o.spd * 0.002;
    });
    renderer.render(scene, camera);
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    var t = clock.getElapsedTime();
    intro = Math.min(1, intro + 0.012);
    var ease = 1 - Math.pow(1 - intro, 3);
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    if (!down) { dragV *= 0.94; drag += dragV; drag *= 0.995; }
    spin.rotation.y = baseRotY + Math.sin(t * 0.12) * 0.9 + drag + (1 - ease) * -2.2;
    tilt.rotation.x = baseTiltX + my * 0.25;
    tilt.rotation.z = -mx * 0.12;
    tilt.rotation.y = mx * 0.3;
    var sc = (mobile ? 1.0 : 1.08) * (0.6 + 0.4 * ease) * (1 - scrollP * 0.15);
    stage.scale.setScalar(sc);
    stage.rotation.x = scrollP * 0.5;
    stars.rotation.y = t * 0.006 + mx * 0.05; stars.rotation.x = my * 0.04;
    renderer.domElement.style.opacity = String(Math.min(1, ease * 1.4) * (1 - scrollP * 0.6));
    render(t);
  }
  function start() { if (running || reduce) return; running = true; loop(); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  layout();
  window.addEventListener('resize', layout);
  if (reduce) { spin.rotation.y = baseRotY + 0.25; render(1.2); }
  else {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible && !document.hidden) start(); else stop(); }, { threshold: 0 }).observe(host);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    start();
  }
  document.documentElement.classList.add('has-3d');
})();
