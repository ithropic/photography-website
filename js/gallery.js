// Masonry-style gallery plus a keyboard- and swipe-friendly lightbox.
(function () {
  "use strict";

  var photos = window.PHOTOS || [];
  var root = document.getElementById("gallery");
  if (!root) return;

  // Breakpoints must match the `sizes` hints below.
  var LAYOUTS = [
    { query: "(min-width: 1100px)", columns: 3 },
    { query: "(min-width: 640px)", columns: 2 },
  ];
  var SIZES_HINT = "(min-width: 1100px) 33vw, (min-width: 640px) 50vw, 100vw";
  var SWIPE_THRESHOLD_PX = 50;
  var HEIGHT_TOLERANCE = 0.12; // in units of column width

  // Staggered ("artistic") layout: every photo gets a little extra space above
  // it, so frames never line up in neat rows. Values are fractions of the
  // column width. Set STAGGER_MAX to 0 for a strict grid.
  var STAGGER_MAX = 0.34;
  var STAGGER_SEED = 15; // 0-99; change for a different (but stable) arrangement

  // ---------- helpers ----------

  function srcsetOf(photo) {
    return photo.srcset
      .map(function (s) { return s.url + " " + s.width + "w"; })
      .join(", ");
  }

  function smallestUrl(photo) {
    return photo.srcset[0].url;
  }

  function columnCount() {
    for (var i = 0; i < LAYOUTS.length; i++) {
      if (window.matchMedia(LAYOUTS[i].query).matches) return LAYOUTS[i].columns;
    }
    return 1;
  }

  // Golden-ratio sequence: looks random, but consecutive values are always far
  // apart (unlike Math.random, which can cluster), and it is identical on every
  // visit and device. Each value is mapped to 0..STAGGER_MAX.
  var GOLDEN_RATIO_CONJUGATE = 0.6180339887;
  var staggers = photos.map(function (_, index) {
    var fraction = (STAGGER_SEED / 100 + index * GOLDEN_RATIO_CONJUGATE) % 1;
    return fraction * STAGGER_MAX;
  });

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  // ---------- gallery ----------

  var lightbox = null; // created lazily, see openLightbox

  function createTile(photo, index, eager, stagger) {
    var button = el("button", "tile", {
      type: "button",
      "aria-label": "View photo " + (index + 1) + " of " + photos.length + ": " + photo.alt,
    });
    button.style.setProperty("--stagger", stagger.toFixed(3));
    var img = el("img", "", {
      src: smallestUrl(photo),
      srcset: srcsetOf(photo),
      sizes: SIZES_HINT,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      decoding: "async",
    });
    if (eager) {
      img.setAttribute("fetchpriority", "high");
    } else {
      img.setAttribute("loading", "lazy");
    }

    function markLoaded() { img.classList.add("is-loaded"); }
    img.addEventListener("load", markLoaded);
    img.addEventListener("error", markLoaded); // don't leave a broken image invisible
    if (img.complete) markLoaded();

    button.appendChild(img);
    button.addEventListener("click", function () { openLightbox(index, button); });
    return button;
  }

  // Places each photo in the currently shortest column, which keeps the
  // left-to-right reading order while avoiding ragged rows.
  function renderGallery() {
    var count = columnCount();
    var columns = [];
    var heights = [];
    root.textContent = "";

    for (var c = 0; c < count; c++) {
      var column = el("div", "gallery__column");
      root.appendChild(column);
      columns.push(column);
      heights.push(0);
    }

    photos.forEach(function (photo, index) {
      // Take the leftmost column that is (nearly) the shortest, so photos of
      // slightly different heights don't jump out of reading order.
      var limit = Math.min.apply(null, heights) + HEIGHT_TOLERANCE;
      var target = heights.findIndex(function (h) { return h <= limit; });
      // A single column (phones) stays evenly spaced; the stagger needs neighbours.
      var stagger = count > 1 ? staggers[index] : 0;
      columns[target].appendChild(createTile(photo, index, index < count, stagger));
      heights[target] += stagger + photo.height / photo.width;
    });

    root.dataset.columns = String(count);
  }

  function watchBreakpoints() {
    var current = columnCount();
    function onChange() {
      var next = columnCount();
      if (next !== current) {
        current = next;
        renderGallery();
      }
    }
    LAYOUTS.forEach(function (layout) {
      var mql = window.matchMedia(layout.query);
      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else mql.addListener(onChange); // older Safari
    });
  }

  // ---------- lightbox ----------

  function buildLightbox() {
    var dialog = el("dialog", "lightbox", { "aria-label": "Photo viewer" });
    var img = el("img", "lightbox__image", { alt: "" });
    var counter = el("p", "lightbox__counter", { "aria-live": "polite" });
    var close = el("button", "lightbox__button lightbox__close", { type: "button", "aria-label": "Close" });
    var prev = el("button", "lightbox__button lightbox__prev", { type: "button", "aria-label": "Previous photo" });
    var next = el("button", "lightbox__button lightbox__next", { type: "button", "aria-label": "Next photo" });
    close.textContent = "×";
    prev.textContent = "‹";
    next.textContent = "›";

    [img, counter, close, prev, next].forEach(function (node) { dialog.appendChild(node); });
    document.body.appendChild(dialog);

    var state = { dialog: dialog, img: img, counter: counter, index: 0, opener: null };

    function go(delta) {
      show((state.index + delta + photos.length) % photos.length);
    }

    function show(index) {
      var photo = photos[index];
      state.index = index;
      img.srcset = srcsetOf(photo);
      img.sizes = "100vw";
      img.src = photo.srcset[photo.srcset.length - 1].url;
      img.alt = photo.alt;
      counter.textContent = index + 1 + " / " + photos.length;
      preloadNeighbours(index);
    }

    function preloadNeighbours(index) {
      [1, -1].forEach(function (delta) {
        var neighbour = photos[(index + delta + photos.length) % photos.length];
        new Image().src = neighbour.srcset[neighbour.srcset.length - 1].url;
      });
    }

    close.addEventListener("click", function () { dialog.close(); });
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });

    // Clicking the dark area (not the image or buttons) closes the viewer.
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("lightbox-open");
      if (state.opener) state.opener.focus();
    });

    var touchStartX = null;
    dialog.addEventListener("touchstart", function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    dialog.addEventListener("touchend", function (event) {
      if (touchStartX === null) return;
      var delta = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1);
    }, { passive: true });

    state.show = show;
    return state;
  }

  function openLightbox(index, opener) {
    if (!lightbox) lightbox = buildLightbox();
    lightbox.opener = opener;
    lightbox.show(index);
    document.body.classList.add("lightbox-open");
    lightbox.dialog.showModal();
  }

  // ---------- init ----------

  if (photos.length === 0) {
    root.textContent = "No photos yet. Run tools/build_images.py to generate them.";
    return;
  }
  renderGallery();
  watchBreakpoints();
})();
