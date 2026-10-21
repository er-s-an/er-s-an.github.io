# Caesar / Jiachen Xie — Personal Studio

Personal website at **https://er-s-an.github.io/**.

A Y2K portfolio with liquid chrome, transparent materials, cobalt blue, pink and acid yellow. Plain HTML, CSS and JavaScript; no build step, runtime dependencies or third-party requests. An original chrome Caesar signature forms from liquid metal and docks in the header in about 1.9 seconds. The hero melts Tencent, MAKEBOOK, AdventureX and Red Star News into one flowing surface before reforming the next mark. The glass card leads with the role or achievement, followed by the employer or project in smaller text. Syne and Space Grotesk are bundled under their SIL Open Font Licenses in `assets/fonts/`.

## Run locally

```sh
python3 -m http.server 53905 --bind 127.0.0.1
```

Open `http://127.0.0.1:53905`. GitHub Pages publishes the root of `main`.

## Check

```sh
node --test check.mjs
```

Content lives in `index.html`. The continuous silhouette and reflective shading use native WebGL2 in `liquid-metal.js`, with the original SVG logos as a fallback. Motion lives in `script.js`: a dismissible intro, manually selectable brand carousel, staggered section reveals and scroll-linked glass reflections. System reduced motion skips the intro and autoplay; the global pause control stops all decorative motion. Scrolling never gets intercepted. Content remains readable without JavaScript. All internships are completed; uncertain end months are not invented. The CV is the public version, without private contact details. Brand source attribution is in `assets/brands/SOURCES.md`.

## Metal assets

`assets/metal/` contains precomputed distance fields, keeping distance calculations off the loading path. To regenerate after changing a source logo, run `node prepare-metal.mjs` in an environment with Sharp available. Sharp is an offline authoring tool; the website has no package or CDN dependencies. The renderer caps pixel density, stops outside the viewport or in background tabs, and falls back to the original marks if WebGL is unavailable.
