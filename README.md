# Bildwörter

Bildwörter, Türkçe konuşanlar için çevrimdışı bir Almanca kelime ve cümle çalışma uygulamasıdır. Görselleri Almanca sözcüklerle eşleştirebilir, kartlarla tekrar yapabilir veya karışık kelimelerden cümle kurabilirsin.

## Başlarken

Projeyi indirip klasöre çıkardıktan sonra `index.html` dosyasını tarayıcında aç. `app.js` dosyası ve `assets/` klasörü aynı dizinde bulunmalı. macOS’ta `Bildwoerter.app` dosyasını çift tıklayarak da başlayabilirsin. Hazır sürüm kurulum gerektirmez.

## Nasıl çalışılır?

- **Eşleştir** bölümünde bir görseli veya Türkçe ipucunu seçip Almanca karşılığına dokun.
- **Test** bölümünde soru yönünü seç. Yanıtlamak için seçeneklere tıklayabilir veya 1–4 tuşlarını kullanabilirsin.
- **Kartlar** bölümünde Almancasını hatırlamaya çalış, kartı çevir ve cevabını değerlendir.
- **Cümle kur** bölümünde konu seçip Türkçe cümleyi Almanca kelimelerle kur.
- **Liste** bölümünde Almanca veya Türkçe arama yap. Sesli okuma için cihazda Almanca bir konuşma sesi bulunmalı.

Doğru cevap kelimeye bir puan kazandırır, yanlış cevap bir puan düşürür. Puanı üçe ulaşan kelime öğrenilmiş sayılır. İlerleme kullandığın tarayıcıda saklanır.

## Kelime arşivi

Uygulamada 2.112 kelime ve kalıp ile 134 cümle var. Açılıştaki **Goethe A1** seçkisi 820 kart içerir. Sayılar, zaman ifadeleri ve bazı sözcük biçimlerinin ayrı kartları vardır. **Tüm kelimeler** ile genişletilmiş arşive geçebilirsin. [Goethe-Institut’un Start Deutsch 1 kelime listesi](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf)

## Kaynak koddan derleme

Python 3, Node.js ve npm gerekir. Kelime eklemek için `kaynak/a1.txt`, `kaynak/words.txt` veya `kaynak/extra.txt` dosyalarındaki ilgili konu başlığına `görsel|Almanca|Türkçe` biçiminde bir satır ekle. Görsel alanı boş bırakılabilir. Sınav seçkisine dahil edilecek kartların Almanca adları `kaynak/goethe-a1.txt` dosyasında, cümleler ise `kaynak/sent.txt` dosyasında yer alır.

Projenin ana klasöründen çalıştır:

```sh
cd kaynak
python3 merge.py
npm install --no-save --package-lock=false react@19.2.8 react-dom@19.2.8 esbuild@0.25.12
npx esbuild src/app.jsx --bundle --minify --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --outfile=../app.js
cd ..
cp -R index.html app.js assets Bildwoerter.app/Contents/Resources/
```

React arayüzü `kaynak/src/app.jsx`, görsel kart bileşenleri `kaynak/src/visuals.jsx`, sayfa stilleri `index.html` içindedir. Görsellerin kaynak ve lisans bilgileri paketle birlikte dağıtılır. [Görsel kaynakları](assets/GORSEL-KAYNAKLARI.txt)
