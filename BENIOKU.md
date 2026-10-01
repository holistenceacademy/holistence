# holistence.com — web sitesi

Statik site (GitHub Pages). Tüm sayfalar ortak tasarım sistemini kullanır.

## Yapı
| Yol | Görev |
|---|---|
| `*.html` (kök) | Yayındaki sayfalar — **elle düzenlemeyin**, `_build` ile üretilir |
| `_build/pages/` | Sayfa içerikleri (buradan düzenleyin) |
| `_build/partials/` | Ortak üst menü ve alt bilgi |
| `_build/build.py` | Sayfaları üretir: `python3 _build/build.py` |
| `assets/css/main.css` | Tasarım sistemi |
| `assets/js/` | Dil, animasyon, form, 3B küre, galeri |
| `galeri/` | Galeri fotoğrafları (kurallar `galeri/BENIOKU.md`) |
| `_kaynak/` | Orijinal logo/video dosyaları (yayınlanmaz) |

## Metin düzenleme
İki dilli metin kısaltması: `[[Türkçe metin||English text]]`.
Düzenledikten sonra `python3 _build/build.py` çalıştırıp kök dizindeki html dosyalarını da yükleyin.

## Form
İletişim formları FormSubmit üzerinden **contact@holistence.com** adresine gider.
İlk gönderimde bu adrese gelen onay e-postasındaki linke tıklanmalıdır.

## İş ortağı logoları
`assets/partners/` klasörüne şu adlarla konmalı:
`kepez.png, canakkale-belediyesi.png, bandirma.png, balkan.png, sakarya.png, toros.png, spiru-haret.png, prishtina.png`
