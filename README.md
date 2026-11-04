# wset-study

A personal revision app for the WSET Level 2 Award in Wines. It's a web app that installs on an Android phone from Chrome and works offline.

All questions, flashcards and workbook notes are original wording. Facts are checked against *Wines: Looking behind the label* (WSET, 2019) and each item cites the book page. No text from WSET publications is reproduced here.

## Layout

- `index.html`, `styles.css`, `app.js`: the app (plain JavaScript, no build step)
- `sw.js`: offline caching. Bump `CACHE` when changing app files so phones pick up the new version
- `data/*.json`: generated content. Don't edit by hand
- `content/`: the source content and `build.py`, which validates it and writes `data/`

## Adding content

Edit or add files in `content/`, then run:

```
python3 content/build.py
```

Progress is stored only in the browser's localStorage. Use Settings → Export / Import to move it between devices.
