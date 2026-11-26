# Photography site

A black, minimal, static photography site: no build step, no dependencies, free to host.

## 1. Make it yours

1. Open `js/config.js` and set your name, Instagram URL and email.
2. Search the project for `Your Name` and replace it in the `<title>` and `<meta name="description">` of `index.html`, `about.html` and `contact.html`.
3. Write your text in `about.html` and, if you like, `contact.html`.

Open `index.html` in a browser to preview. It works straight from disk, no server needed.

## 2. Add or change photos

1. Put full-size JPEG/PNG files in `source/`. They appear in alphabetical order, so number them: `01-name.jpg`, `02-name.jpg`, ...
2. Optional: describe each photo for screen readers in `captions.json` (`"01-name.jpg": "A man walking past ..."`).
3. Run:

   ```bash
   pip install pillow
   python tools/build_images.py
   ```

This writes optimized WebP files to `images/` (800px and up to 1600px wide) and regenerates `photos.js`. Do not edit `photos.js` by hand. `source/` is git-ignored, so your large originals are never uploaded.

## 3. Deploy for free

**GitHub Pages**
1. Create a repository and push this folder (the `source/` folder stays local thanks to `.gitignore`).
2. Repository **Settings → Pages → Deploy from a branch → `main` / root**.
3. Your site appears at `https://<username>.github.io/<repo>/`. Name the repo `<username>.github.io` to get `https://<username>.github.io/`.

**Cloudflare Pages / Netlify**: connect the repository, leave the build command empty, and set the output directory to `/` (the project root). Netlify also accepts a drag-and-drop of the folder.

A custom domain is optional and is the only thing that costs money. All three hosts let you add one later.

## Layout

```
index.html  about.html  contact.html   pages
css/style.css                           all styling
js/config.js                            your name, Instagram, email
js/layout.js                            shared header/footer
js/gallery.js                           masonry grid + lightbox
photos.js                               generated photo list
images/                                 generated WebP files
source/                                 your originals (not deployed)
tools/build_images.py                   image pipeline
```

## Tweaks

- Number of columns: `LAYOUTS` at the top of `js/gallery.js` (and the matching `SIZES_HINT`).
- Staggered layout: `STAGGER_MAX` and `STAGGER_SEED` near the top of `js/gallery.js`. A larger `STAGGER_MAX` scatters the photos more, `0` gives a strict grid, and a different seed (0-99) gives a different but permanent arrangement.
- Spacing and colours: the variables at the top of `css/style.css`.
- Lightbox: click a photo; use ← → or swipe to browse, Esc to close.
