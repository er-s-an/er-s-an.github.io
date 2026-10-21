# Caesar / Jiachen Xie — Personal Studio

Personal website at **https://er-s-an.github.io/**.

A Y2K portfolio with liquid chrome, transparent materials, cobalt blue, pink and acid yellow. Plain HTML, CSS and JavaScript; no build step, runtime dependencies or third-party requests. An original chrome Caesar signature opens with a 1.9-second liquid-drain and docking animation. The hero rotates Tencent, MAKEBOOK, AdventureX and Red Star News using the original logo silhouettes with a live SVG chrome material. Syne and Space Grotesk are bundled under their SIL Open Font Licenses in `assets/fonts/`.

## Run locally

```sh
python3 -m http.server 53905 --bind 127.0.0.1
```

Open `http://127.0.0.1:53905`. GitHub Pages publishes the root of `main`.

## Check

```sh
node --test check.mjs
```

Content lives in `index.html`. Motion lives in `script.js`: a dismissible intro, manually selectable brand carousel, staggered section reveals and scroll-linked glass reflections. System reduced motion skips the intro and autoplay; the global pause control stops all decorative motion. Scrolling never gets intercepted. Content remains readable without JavaScript. All internships are completed; uncertain end months are not invented. The CV is the public version, without private contact details. Brand source attribution is in `assets/brands/SOURCES.md`.
