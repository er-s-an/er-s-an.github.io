# Jiachen Xie — Personal Studio

Personal website at **https://er-s-an.github.io/**.

A pixel-art portfolio with streetwear lookbook details. Plain HTML, CSS, and JavaScript; no build step or third-party runtime requests. Original jacket artwork is inline SVG. Fonts are bundled under their SIL Open Font Licenses in `assets/fonts/`.

## Run locally

```sh
python3 -m http.server 53905 --bind 127.0.0.1
```

Open `http://127.0.0.1:53905`. GitHub Pages publishes the root of `main`.

## Check

```sh
node --test check.mjs
```

Content lives in `index.html`. Motion and colorway interactions live in `script.js`, with reduced-motion support and an explicit pause control. The CV is the public version, without private contact details.
