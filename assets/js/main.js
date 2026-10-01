/* Holistence Academy — ortak site betiği (tüm sayfalar) */
(function () {
  'use strict';
  var KEY = 'hl_lang';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Dil ---------- */
  function setLang(l) {
    if (l !== 'tr' && l !== 'en') l = 'tr';
    root.lang = l;
    store(KEY, l);
    document.querySelectorAll('[data-set-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === l ? 'true' : 'false');
    });
    // placeholder / aria-label / title çevirileri (eski sürümdeki bozuk placeholder hatasının çözümü)
    document.querySelectorAll('[data-tr-ph]').forEach(function (el) {
      el.setAttribute('placeholder', el.getAttribute('data-' + l + '-ph'));
    });
    document.querySelectorAll('[data-tr-aria]').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-' + l + '-aria'));
    });
    document.querySelectorAll('option[data-tr]').forEach(function (o) { o.textContent = o.getAttribute('data-' + l); });
    var t = document.querySelector('meta[name="hl-title-' + l + '"]');
    if (t) document.title = t.content;
    document.dispatchEvent(new CustomEvent('hl:lang', { detail: l }));
  }
  window.setLang = setLang;

  function init() {
    setLang(store(KEY) || root.lang || 'tr');
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set-lang]');
      if (b) setLang(b.getAttribute('data-set-lang'));
    });

    /* ---------- Navigasyon ---------- */
    var nav = document.querySelector('.nav');
    var drawer = document.querySelector('.drawer');
    var burger = document.querySelector('.burger');
    function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 30); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    function closeDrawer() {
      if (!drawer) return;
      drawer.classList.remove('open'); nav.classList.remove('menu-open');
      document.body.classList.remove('no-scroll'); burger.setAttribute('aria-expanded', 'false');
    }
    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = !drawer.classList.contains('open');
        drawer.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
        document.body.classList.toggle('no-scroll', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      drawer.addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });
    }
    document.querySelectorAll('.has-sub > button').forEach(function (b) {
      b.addEventListener('click', function () {
        var li = b.parentElement, open = !li.classList.contains('open');
        li.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeDrawer();
        document.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); });
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-sub')) document.querySelectorAll('.has-sub.open').forEach(function (li) { li.classList.remove('open'); });
    });

    /* ---------- Görünür olunca belir ---------- */
    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { io.observe(el); });
    } else { els.forEach(function (el) { el.classList.add('in'); }); }

    /* ---------- Sayaçlar ---------- */
    var counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (ents) {
        ents.forEach(function (x) {
          if (!x.isIntersecting) return; cio.unobserve(x.target);
          var el = x.target, to = +el.getAttribute('data-count'), from = +(el.getAttribute('data-from') || 0), suf = el.getAttribute('data-suffix') || '';
          if (reduce) { el.textContent = to + suf; return; }
          var t0 = performance.now(), dur = 1600;
          (function step(t) {
            var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(from + (to - from) * e) + suf;
            if (p < 1) requestAnimationFrame(step);
          })(t0);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }

    /* ---------- Kart ışığı + hafif 3B eğim ---------- */
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (fine && !reduce) {
      document.querySelectorAll('.card').forEach(function (c) {
        c.addEventListener('pointermove', function (e) {
          var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
          c.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6) + 'deg) rotateY(' + ((x - 0.5) * 8) + 'deg) translateY(-4px)';
        });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
      document.querySelectorAll('[data-magnetic]').forEach(function (b) {
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.25) + 'px)';
        });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }

    /* ---------- Ofis fotoğrafı paralaks ---------- */
    var ph = document.querySelector('.office-photo');
    if (ph && !reduce) {
      var img = ph.querySelector('img');
      window.addEventListener('scroll', function () {
        var r = ph.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        img.style.setProperty('--py', (-8 + p * 8) + '%');
      }, { passive: true });
    }

    /* ---------- Alıntı: kelime kelime aydınlanma ---------- */
    function prepQuote() {
      document.querySelectorAll('[data-words]').forEach(function (q) {
        if (q.dataset.done) return; q.dataset.done = '1';
        q.innerHTML = q.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      });
    }
    prepQuote();
    var qwrap = document.querySelector('.quote');
    if (qwrap) {
      var lit = function () {
        var r = qwrap.getBoundingClientRect(), vh = window.innerHeight;
        var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height * 0.7)));
        qwrap.querySelectorAll('[data-words]').forEach(function (q) {
          var all = q.querySelectorAll('.w');
          all.forEach(function (w, i) { w.classList.toggle('on', reduce || i / all.length < p * 1.15); });
        });
      };
      window.addEventListener('scroll', lit, { passive: true }); lit();
    }

    /* ---------- Alt sayfa başlığı: hareketli bağlantı ağı ---------- */
    document.querySelectorAll('.page-hero').forEach(function (hero) {
      var cv = document.createElement('canvas'); cv.className = 'fx'; cv.setAttribute('aria-hidden', 'true');
      hero.prepend(cv);
      var ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, pts = [], mx = -1e4, my = -1e4, run = false, raf;
      function size() {
        W = hero.clientWidth; H = hero.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = Math.round(Math.min(90, W * H / 14000)); pts = [];
        for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, g: Math.random() < .12 });
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i];
          if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
          var dxm = p.x - mx, dym = p.y - my, dm = Math.sqrt(dxm * dxm + dym * dym);
          for (var j = i + 1; j < pts.length; j++) {
            var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
            if (d < 18000) { ctx.strokeStyle = 'rgba(63,224,208,' + (0.16 * (1 - d / 18000)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
          if (dm < 160) { ctx.strokeStyle = 'rgba(227,191,106,' + (0.35 * (1 - dm / 160)) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke(); }
          ctx.fillStyle = p.g ? 'rgba(227,191,106,.9)' : 'rgba(63,224,208,.7)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.g ? 2 : 1.4, 0, 6.283); ctx.fill();
        }
        if (run) raf = requestAnimationFrame(draw);
      }
      size(); draw();
      window.addEventListener('resize', size);
      hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      hero.addEventListener('pointerleave', function () { mx = my = -1e4; });
      if (!reduce && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { if (e[0].isIntersecting) { if (!run) { run = true; draw(); } } else { run = false; cancelAnimationFrame(raf); } }).observe(hero);
      }
    });

    /* ---------- Görünür olunca oynayan sessiz video ---------- */
    document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
      if (reduce) { v.setAttribute('controls', ''); v.preload = 'metadata'; return; }
      if (!('IntersectionObserver' in window)) { v.play(); return; }
      new IntersectionObserver(function (e) { if (e[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }, { threshold: 0.3 }).observe(v);
    });

    /* ---------- Yıl ---------- */
    document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });

    /* ---------- Ortak logolarında yedek ---------- */
    document.querySelectorAll('img[data-fallback]').forEach(function (im) {
      im.addEventListener('error', function onErr() {
        var fb = im.getAttribute('data-fallback');
        if (fb && im.src !== fb) { im.removeAttribute('data-fallback'); im.src = fb; return; }
        im.removeEventListener('error', onErr);
        var s = document.createElement('span'); s.className = 'p-name'; s.textContent = im.alt;
        im.replaceWith(s);
      });
    });

    /* ---------- İletişim formu (eski sürüm hiçbir şey göndermiyordu) ---------- */
    document.querySelectorAll('form[data-ajax]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var l = root.lang, msg = f.querySelector('.form-msg'), btn = f.querySelector('button[type="submit"]');
        var T = {
          tr: { send: 'Gönderiliyor…', ok: 'Mesajınız alındı. En kısa sürede dönüş yapacağız.', err: 'Gönderilemedi. Lütfen contact@holistence.com adresine e-posta gönderin.' },
          en: { send: 'Sending…', ok: 'Message received. We will get back to you shortly.', err: 'Could not send. Please email contact@holistence.com.' }
        }[l];
        if (f.querySelector('.hp input') && f.querySelector('.hp input').value) return; // spam botu
        btn.disabled = true; msg.className = 'form-msg'; msg.textContent = T.send;
        fetch(f.action, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(f) })
          .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
          .then(function () { msg.className = 'form-msg ok'; msg.textContent = T.ok; f.reset(); })
          .catch(function () { msg.className = 'form-msg err'; msg.textContent = T.err; })
          .finally(function () { btn.disabled = false; });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
