# Caesar / 谢佳辰 / Jiachen Xie — Personal Studio

Personal website at **https://er-s-an.github.io/**.

Caesar, also known as **谢佳辰 / Jiachen Xie**: student entrepreneur, **CTO of [MAKEBOOK](https://makebook.xyz)**, working on AI agents, creative tools and games, and building on Injective.

A Y2K portfolio with liquid chrome, transparent materials, cobalt blue, pink and acid yellow. Plain HTML, CSS and JavaScript, with a Python standard-library script to generate the language pages; no runtime dependencies or third-party requests. A full-screen flowing chrome surface drains down once the first-screen assets are ready, leaving the Caesar signature to dock in the header in about two seconds. The hero melts Tencent, MAKEBOOK, AdventureX and Red Star News into one flowing surface before reforming the next mark in 1.15 seconds. At rest, the marks tilt and float in perspective with moving studio reflections and a beveled edge. The glass card leads with the role or achievement, followed by the employer or project in smaller text. Syne and Space Grotesk are bundled under their SIL Open Font Licenses in `assets/fonts/`.

## Run locally

```sh
python3 build-locales.py
python3 -m http.server 53905 --bind 127.0.0.1
```

Open `http://127.0.0.1:53905`. GitHub Pages publishes the root of `main`.

## Check

```sh
node --test check.mjs
```

Content lives in `index.html`. The continuous silhouette and reflective shading use native WebGL2 in `liquid-metal.js`, with the original SVG logos as a fallback. Motion lives in `script.js`: a dismissible intro, manually selectable brand carousel, staggered section reveals and scroll-linked glass reflections. System reduced motion skips the intro and autoplay; the global pause control stops all decorative motion. Scrolling never gets intercepted. Content remains readable without JavaScript. All internships are completed; uncertain end months are not invented. The CV is the public version, without private contact details. Brand source attribution is in `assets/brands/SOURCES.md`.

## Languages

English is available at **[/en/](https://er-s-an.github.io/en/)** and Simplified Chinese at **[/zh/](https://er-s-an.github.io/zh/)**. Both pages contain their complete content and metadata in the initial HTML. The header links work without JavaScript; with JavaScript, switching is immediate and preserves the visible section, selected brand and motion setting.

The root URL follows the saved or browser language. Explicit language paths take priority over those preferences. Legacy `?lang=en` and `?lang=zh` links still work and normalize to the language path while preserving section anchors and other query parameters. English copy lives in `index.html`; Chinese copy and the small language controller live in `i18n.js`. The public CV is an English PDF.

After editing either source, run `python3 build-locales.py` and commit the generated `en/index.html`, `zh/index.html`, `robots.txt` and `sitemap.xml` with the source. The generator checks translation coverage, balanced markup and local links. It embeds the original English strings in the Chinese page so instant switching restores the English markup correctly. There are no build dependencies to install.

## Search metadata

Each language has its own canonical URL, reciprocal `hreflang` links, localized titles and social metadata, and `ProfilePage` / `Person` structured data. The person has the names Jiachen Xie, 谢佳辰 and Caesar, with links to GitHub and X. The sitemap lists the two canonical language URLs; the root is the `x-default` entry and canonicals to English. Actual indexing and search performance must be checked in an owner-verified Search Console property.

## Metal assets

`assets/metal/` contains precomputed distance fields, keeping distance calculations off the loading path. To regenerate after changing a source logo, run `node prepare-metal.mjs` in an environment with Sharp available. Sharp is an offline authoring tool; the website has no package or CDN dependencies. The renderer caps pixel density and total pixels, stops outside the viewport or in background tabs, and falls back to the original marks if WebGL is unavailable.
