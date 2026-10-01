#!/usr/bin/env python3
"""Holistence Academy — statik sayfa üretici.

Ortak üst menü (partials/header.html) ve alt bilgi (partials/footer.html)
her sayfaya tek yerden eklenir. Sayfa gövdeleri pages/ klasöründedir.

Kullanım (repo kök dizininde):  python3 _build/build.py
Çıktı: kök dizindeki *.html dosyaları (GitHub Pages bunları yayınlar).

İki dilli metin kısaltması:  [[Türkçe metin||English text]]

Her sayfa dosyası başında şu bilgi bloğunu taşır:
<!--
title_tr: Sayfa başlığı
title_en: Page title
desc: Arama motoru açıklaması
extra: network      (isteğe bağlı: network | gallery)
-->
"""
import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, '_build')

HEAD = '''<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<script>document.documentElement.className+=' js';try{{var l=localStorage.getItem('hl_lang');if(l==='en'||l==='tr')document.documentElement.lang=l;}}catch(e){{}}</script>
<title>{title_tr}</title>
<meta name="hl-title-tr" content="{title_tr}">
<meta name="hl-title-en" content="{title_en}">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#04060B">
<meta property="og:type" content="website">
<meta property="og:title" content="{title_tr}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/logo-ha.png">
<link rel="icon" type="image/png" href="assets/img/logo-ha.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
'''

SCRIPTS = {
    None: '',
    'network': '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>\n'
             '<script src="assets/js/hero-network.js" defer></script>\n',
    'gallery': '<script src="assets/js/gallery.js" defer></script>\n',
}

# Alt sayfalar menüde hangi üst başlığın altında?
PARENT = {'kongreler.html': 'etkinlikler.html', 'sergiler.html': 'etkinlikler.html'}


def meta(src):
    m = re.match(r'\s*<!--(.*?)-->', src, re.S)
    data = {}
    if m:
        for line in m.group(1).strip().splitlines():
            k, _, v = line.partition(':')
            data[k.strip()] = v.strip()
        src = src[m.end():]
    return data, src


def header_for(page, hdr):
    hdr = hdr.replace(' aria-current="page"', '')
    def mark(h):
        nonlocal hdr
        hdr = re.sub(r'(<a href="%s")' % re.escape(h), r'\1 aria-current="page"', hdr)
    mark(page)
    if page in PARENT:
        # üst menüde "Etkinlikler" düğmesini de vurgula
        hdr = hdr.replace('<li class="has-sub">', '<li class="has-sub is-active">', 1)
    return hdr


def main():
    hdr = open(os.path.join(B, 'partials', 'header.html'), encoding='utf-8').read()
    ftr = open(os.path.join(B, 'partials', 'footer.html'), encoding='utf-8').read()
    for name in sorted(os.listdir(os.path.join(B, 'pages'))):
        if not name.endswith('.html'):
            continue
        d, body = meta(open(os.path.join(B, 'pages', name), encoding='utf-8').read())
        # Kısa yazım: [[Türkçe||English]] → iki dilli span çifti
        body = re.sub(r'\[\[(.*?)\|\|(.*?)\]\]', r'<span data-l="tr">\1</span><span data-l="en">\2</span>', body, flags=re.S)
        esc = {k: html.escape(v, quote=True) for k, v in d.items()}
        out = HEAD.format(title_tr=esc.get('title_tr', 'Holistence Academy'),
                          title_en=esc.get('title_en', 'Holistence Academy'),
                          desc=esc.get('desc', ''))
        out += header_for(name, hdr)
        out += '<main id="main">' + body.rstrip() + '\n</main>\n\n'
        out += ftr
        out += '<script src="assets/js/main.js" defer></script>\n'
        out += SCRIPTS[d.get('extra') or None]
        out += '</body>\n</html>\n'
        open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(out)
        print('yazıldı:', name, f'{len(out)/1024:.1f} KB')


if __name__ == '__main__':
    main()
