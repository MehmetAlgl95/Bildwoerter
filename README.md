# Bildwörter

Bildwörter is an offline app for Turkish speakers learning German. Match pictures to German words, review vocabulary with flashcards, or build sentences from shuffled words.

## Getting started

Download and extract the project, then open `index.html` in your browser. Keep `app.js` and the `assets/` folder in the same directory as `index.html`. On macOS, you can also double-click `Bildwoerter.app`. The bundled app is ready to use without installation.

## Study modes

- **Match (Eşleştir)** — Select a picture or Turkish clue, then choose the matching German word.
- **Quiz (Test)** — Choose whether to start with a German word or its meaning. Click an answer or press **1–4**.
- **Flashcards (Kartlar)** — Try to recall the German word, flip the card, and mark whether you remembered it.
- **Build a sentence (Cümle kur)** — Choose a topic and arrange the German words to translate the Turkish sentence.
- **Word list (Liste)** — Search in German or Turkish. To hear a word pronounced, select it with audio enabled. Your device needs a German text-to-speech voice.

A correct answer adds one point to a word’s score. An incorrect answer takes one point away, down to a minimum of zero. A word counts as learned when it reaches three points. Your browser saves your progress locally.

## Vocabulary

The app includes 2,112 words and expressions, plus 134 sentences. The default **Goethe A1** selection contains 820 cards based on the Start Deutsch 1 vocabulary list. Numbers, time expressions, and some word forms have their own cards. Select **Tüm kelimeler** (All words) to study the full collection. [Goethe-Institut’s Start Deutsch 1 vocabulary list (PDF)](https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf)

## Building from source

You’ll need Python 3, Node.js, and npm. To add a word, find its topic in `kaynak/a1.txt`, `kaynak/words.txt`, or `kaynak/extra.txt` and add a line in the format `emoji|German|Turkish`. You can leave the emoji field empty. To include a card in the Goethe A1 selection, add its German entry to `kaynak/goethe-a1.txt`. Sentence exercises are stored in `kaynak/sent.txt`.

Run these commands from the project root.

```sh
cd kaynak
python3 merge.py
npm install --no-save --package-lock=false react@19.2.8 react-dom@19.2.8 esbuild@0.25.12
npx esbuild src/app.jsx --bundle --minify --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --outfile=../app.js
cd ..
cp -R index.html app.js assets Bildwoerter.app/Contents/Resources/
```

The React interface is in `kaynak/src/app.jsx`, the card illustrations are rendered by `kaynak/src/visuals.jsx`, and the page styles are in `index.html`. The app ships with credits and license details for its artwork. [Artwork credits and licenses](assets/GORSEL-KAYNAKLARI.txt)
