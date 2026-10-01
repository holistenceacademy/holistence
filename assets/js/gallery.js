/* Holistence Academy — Galeri
   Fotoğrafları repodaki "galeri/" klasöründen otomatik okur (GitHub API).
   Dosya adı kuralı:  YIL_kategori_aciklama.jpg
     örnek: 2024_kongre_Acilis-toreni.jpg   → 2024 · Kongreler · "Acilis toreni"
   Kategoriler: kongre | sergi | etkinlik | ofis
   API'ye ulaşılamazsa galeri/galeri.json dosyası (varsa) kullanılır. */
(function () {
  'use strict';
  var REPO = 'holistenceacademy/holistence', DIR = 'galeri';
  var root = document.getElementById('gallery');
  if (!root) return;
  var grid = root.querySelector('[data-grid]');
  var IMG = /\.(jpe?g|png|webp|gif|avif)$/i;
  var CATS = ['kongre', 'sergi', 'etkinlik', 'ofis'];
  var items = [], shown = [], cur = 0;

  function parse(name) {
    var base = name.replace(IMG, ''), parts = base.split('_');
    var year = /^\d{4}$/.test(parts[0]) ? parts.shift() : '';
    var cat = CATS.indexOf((parts[0] || '').toLowerCase()) > -1 ? parts.shift().toLowerCase() : 'etkinlik';
    var cap = parts.join(' ').replace(/[-]+/g, ' ').trim();
    return { src: DIR + '/' + encodeURIComponent(name), year: year, cat: cat, tr: cap, en: cap };
  }

  function load() {
    var cached; try { cached = JSON.parse(sessionStorage.getItem('hl_gal') || 'null'); } catch (e) {}
    if (cached) return Promise.resolve(cached);
    return fetch('https://api.github.com/repos/' + REPO + '/contents/' + DIR, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (list) {
        var out = list.filter(function (f) { return f.type === 'file' && IMG.test(f.name); }).map(function (f) { return parse(f.name); });
        try { sessionStorage.setItem('hl_gal', JSON.stringify(out)); } catch (e) {}
        return out;
      })
      .catch(function () {
        return fetch(DIR + '/galeri.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (j) { return (j.items || []).map(function (it) { var p = parse(it.file); return { src: p.src, year: String(it.year || p.year), cat: it.cat || p.cat, tr: it.tr || p.tr, en: it.en || it.tr || p.en }; }); })
          .catch(function () { return []; });
      });
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render(cat) {
    shown = items.filter(function (it) { return cat === 'all' || it.cat === cat; });
    if (!items.length) {
      grid.innerHTML = '<div class="g-empty"><b><span data-l="tr">Fotoğraflar yakında</span><span data-l="en">Photos coming soon</span></b>' +
        '<span data-l="tr">Etkinliklerimizden kareler bu sayfada yayınlanacak.</span><span data-l="en">Moments from our events will be published here.</span></div>';
      return;
    }
    var years = {}, order = [];
    shown.forEach(function (it, i) { it.i = i; var y = it.year || '—'; if (!years[y]) { years[y] = []; order.push(y); } years[y].push(it); });
    order.sort(function (a, b) { return b.localeCompare(a); });
    grid.innerHTML = order.map(function (y) {
      return '<div class="g-year"><b>' + esc(y) + '</b><span>' + years[y].length + ' <span data-l="tr">fotoğraf</span><span data-l="en">photos</span></span></div><div class="g-grid">' +
        years[y].map(function (it) {
          return '<button type="button" class="g-item" data-i="' + it.i + '"><img src="' + it.src + '" alt="' + esc(it.tr) + '" loading="lazy" decoding="async">' +
            (it.tr ? '<figcaption><span data-l="tr">' + esc(it.tr) + '</span><span data-l="en">' + esc(it.en) + '</span></figcaption>' : '') + '</button>';
        }).join('') + '</div>';
    }).join('');
  }

  /* Filtreler */
  root.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render(b.getAttribute('data-filter'));
    });
  });

  /* Büyük görünüm */
  var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = '<button class="x" aria-label="Kapat">×</button><button class="pv" aria-label="Önceki">‹</button><button class="nx" aria-label="Sonraki">›</button><figure><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption');
  function open(i) {
    cur = (i + shown.length) % shown.length; var it = shown[cur];
    lbImg.src = it.src; lbImg.alt = it.tr; lbCap.textContent = document.documentElement.lang === 'en' ? it.en : it.tr;
    lb.classList.add('open'); document.body.classList.add('no-scroll'); lb.querySelector('.x').focus();
  }
  function close() { lb.classList.remove('open'); document.body.classList.remove('no-scroll'); }
  grid.addEventListener('click', function (e) { var b = e.target.closest('.g-item'); if (b) open(+b.getAttribute('data-i')); });
  lb.addEventListener('click', function (e) {
    if (e.target.closest('.x') || e.target === lb) close();
    else if (e.target.closest('.pv')) open(cur - 1);
    else if (e.target.closest('.nx')) open(cur + 1);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') open(cur - 1); if (e.key === 'ArrowRight') open(cur + 1);
  });

  load().then(function (list) { items = list; render('all'); });
})();
