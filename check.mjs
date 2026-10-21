import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('style.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('script.js', import.meta.url), 'utf8');
import { liquidDistanceField } from './prepare-metal.mjs';

test('public content, anchors, local assets and brand credits are complete', () => {
  for (const match of html.matchAll(/(?:href|src)="([^"?#]+)"/g)) {
    if (!/^(https?:|data:)/.test(match[1])) assert.ok(existsSync(new URL(match[1], import.meta.url)), match[1]);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  for (const text of ['Caesar', 'adventurex.svg', 'redstar-wordmark.png', 'brand-intro', 'CTO of', 'STUDENT ENTREPRENEUR', 'https://makebook.xyz', 'https://x.com/Aiyakale', 'AI agent-native engine for building web games', 'LLM Research Intern', 'Game Design Intern', 'AI &amp; New Media Intern', 'First place.', 'AdventureX 2026.', 'EVM testnet prototype']) assert.ok(html.includes(text), text);
  assert.equal((html.match(/COMPLETED/g) || []).length, 4);
  for (const obsolete of ['makebook.hk2048.online', 'pixelify', 'jacket', 'uniform-panel']) assert.ok(!(html + css + script).toLowerCase().includes(obsolete === 'jacket' ? 'jacket-body' : obsolete), obsolete);
  for (const match of css.matchAll(/url\('([^']+)'\)/g)) assert.ok(existsSync(new URL(match[1], import.meta.url)), match[1]);
  assert.ok(existsSync(new URL('assets/brands/SOURCES.md', import.meta.url)));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(!html.includes('maximum-scale'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="id-top" id="brand-name">MAKEBOOK \/ MAIN VENTURE/);
  assert.match(html, /class="id-name" id="brand-role">CTO &amp; builder/);
  assert.ok(!css.includes('brand-depart'));
  for (const name of ['makebook', 'tencent', 'advx', 'redstar', 'caesar']) {
    const png = readFileSync(new URL(`assets/metal/${name}.png`, import.meta.url));
    assert.equal(png.toString('ascii', 1, 4), 'PNG');
    assert.equal(png.readUInt32BE(20) % 2, 0);
  }
});

test('distance fields preserve logo edges and reject empty masks', () => {
  const distanceField = liquidDistanceField;
  const mask = new Uint8Array(81);
  for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) mask[y * 9 + x] = 255;
  const field = distanceField(mask, 9, 9);
  assert.ok(field[40] < field[22] && field[22] < 0);
  assert.ok(field[0] > field[10] && field[10] > 0);
  assert.equal(field[0], field[8]);
  assert.ok([...field].every(Number.isFinite));
  assert.throws(() => distanceField(new Uint8Array(81), 9, 9), /Empty/);
});

function setup({ reduced = false, hash = '#work', gpu = true } = {}) {
  let now = 0, nextId = 1;
  const jobs = new Map();
  const schedule = (fn, delay, frame = false) => { const id = nextId++; jobs.set(id, { at: now + delay, fn, frame }); return id; };
  const element = (dataset = {}) => {
    const classes = new Set();
    return { dataset, attributes: {}, listeners: {}, textContent: '', hidden: true,
      classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) },
      style: { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; } },
      setAttribute(k, v) { this.attributes[k] = v; }, getAttribute(k) { return this.attributes[k] ?? null; },
      addEventListener(k, fn) { this.listeners[k] = fn; }, contains() { return false; },
      getBoundingClientRect() { return { left: 200, top: 300, width: 700, height: 222 }; },
      animate(frames, options) { this.animation = { frames, options }; return { finished: new Promise(resolve => schedule(resolve, options.duration)), cancel() {} }; }
    };
  };
  const root = element(), button = element(), label = element(), symbol = element();
  button.querySelector = q => q === '.motion-label' ? label : symbol;
  const intro = element(), logo = element(), veil = element(), introCanvas = element(), brandCanvas = element(), stage = element(), caption = element();
  const signature = element();
  signature.setAttribute('src', 'signature.webp');
  logo.querySelector = () => signature;
  const monogram = element();
  monogram.getBoundingClientRect = () => ({ left: 48, top: 25, width: 145, height: 46 });
  const hero = element();
  const names = ['makebook', 'tencent', 'advx', 'redstar'];
  const slides = names.map(brand => element({ brand }));
  slides[0].hidden = false;
  const buttons = names.map(brand => element({ brand }));
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0)));
  const scenes = [element(), element(), element()];
  const name = element(), role = element(), note = element();
  const one = { '.motion-button': button, '.brand-intro': intro, '.intro-logo': logo, '.intro-veil': veil, '.intro-liquid': introCanvas, '.brand-stage': stage, '.brand-liquid': brandCanvas, '.intro-caption': caption, '.hero-art': hero, '.monogram': monogram, '#brand-name': name, '#brand-role': role, '#brand-note': note };
  names.forEach(brand => { one[`#brand-${brand} image`] = element(); });
  const many = { '.brand-slide': slides, '.brand-controls button': buttons, '[data-scroll-scene]': scenes };
  const media = { matches: reduced, addEventListener(_, fn) { this.change = fn; } };
  const window = { listeners: {}, addEventListener(k, fn) { this.listeners[k] = fn; } };
  const document = { hidden: false, activeElement: null, listeners: {}, documentElement: root, querySelector: q => one[q], querySelectorAll: q => many[q] || [], addEventListener(k, fn) { this.listeners[k] = fn; } };
  const renderers = [];
  const createLiquidMetal = async (canvas, sources, width, height, onLoss) => {
    if (!gpu) throw new Error('WebGL unavailable');
    const renderer = { canvas, calls: [], onLoss, draw(...args) { this.calls.push(args); }, destroy() { this.destroyed = true; } };
    renderers.push(renderer);
    return renderer;
  };
  runInNewContext(script, { document, window, createLiquidMetal, matchMedia: () => media, location: { hash }, scrollY: 0, innerHeight: 900, performance: { now: () => now }, setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => jobs.delete(id), requestAnimationFrame: fn => schedule(fn, 16, true), cancelAnimationFrame: id => jobs.delete(id) });
  async function advance(ms) {
    await new Promise(resolve => setImmediate(resolve));
    const end = now + ms;
    for (;;) {
      const due = [...jobs].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, job] = due;
      jobs.delete(id); now = job.at; job.fn(job.frame ? now : undefined);
      await Promise.resolve();
    }
    now = end;
    await Promise.resolve();
  }
  return { root, button, label, media, intro, logo, slides, buttons, name, role, stage, scenes, window, document, renderers, advance };
}

test('pause during a brand transition cancels it cleanly; resume cycles again', async () => {
  const s = setup();
  await s.advance(4900);
  s.button.listeners.click();
  await s.advance(1000);
  assert.equal(s.slides.filter(x => !x.hidden).length, 1);
  assert.equal(s.slides[1].hidden, false);
  assert.equal(s.button.getAttribute('aria-label'), 'Resume animations');
  assert.equal(s.label.textContent, 'MOTION OFF');
  s.button.listeners.click();
  await s.advance(6500);
  assert.equal(s.role.textContent, 'Web3 Track · 1st place');
  assert.equal(s.buttons.filter(x => x.getAttribute('aria-pressed') === 'true').length, 1);
});

test('reduced motion skips intro and autoplay, but manual brand selection works', async () => {
  const s = setup({ reduced: true, hash: '' });
  await s.advance(10000);
  assert.equal(s.intro.hidden, true);
  assert.equal(s.button.disabled, true);
  assert.equal(s.slides[0].hidden, false);
  s.buttons[3].listeners.click();
  assert.equal(s.role.textContent, 'AI & New Media Intern');
  assert.equal(s.renderers.length, 0);
  s.media.matches = false; s.media.change();
  s.button.listeners.click();
  s.media.matches = true; s.media.change();
  s.media.matches = false; s.media.change();
  assert.equal(s.root.classList.contains('motion-paused'), true);
});

test('liquid intro forms a signature, docks to the measured header, and clears within two seconds', async () => {
  const s = setup({ hash: '#top' });
  await s.advance(650);
  assert.equal(s.intro.hidden, false);
  assert.equal(s.root.classList.contains('intro-active'), true);
  assert.ok(s.renderers[1].calls.some(([, , p]) => p > .5 && p < 1));
  await s.advance(800);
  assert.equal(s.logo.animation.options.duration, 500);
  assert.ok(s.logo.animation.frames[1].transform.includes('scale(0.20714285714285716)'));
  await s.advance(500);
  assert.equal(s.intro.hidden, true);
  assert.equal(s.root.classList.contains('intro-active'), false);
});

test('rapid choices keep a continuous surface and end on the latest destination', async () => {
  const s = setup();
  await s.advance(30);
  s.buttons[1].listeners.click();
  await s.advance(400);
  s.buttons[3].listeners.click();
  await s.advance(600);
  s.buttons[2].listeners.click();
  s.buttons[0].listeners.click();
  await s.advance(2500);
  assert.equal(s.role.textContent, 'CTO & builder');
  assert.ok(s.renderers[0].calls.some(([, , p]) => p > .45 && p < .55));
  assert.equal(s.slides.filter(x => !x.hidden).length, 1);
  assert.equal(s.buttons[0].getAttribute('aria-pressed'), 'true');
});

test('GPU failure or context loss keeps the selected logo and controls usable', async () => {
  const fallback = setup({ gpu: false, hash: '' });
  await fallback.advance(1000);
  assert.equal(fallback.intro.hidden, true);
  fallback.buttons[3].listeners.click();
  assert.equal(fallback.role.textContent, 'AI & New Media Intern');
  assert.equal(fallback.stage.classList.contains('has-liquid-metal'), false);
  const s = setup();
  await s.advance(30);
  s.buttons[2].listeners.click();
  await s.advance(300);
  s.renderers[0].onLoss();
  assert.equal(s.stage.classList.contains('has-liquid-metal'), false);
  assert.equal(s.slides[2].hidden, false);
});

test('backgrounding stops rendering and returns without a delayed transition', async () => {
  const s = setup();
  await s.advance(300);
  s.buttons[1].listeners.click();
  await s.advance(300);
  s.document.hidden = true; s.document.listeners.visibilitychange();
  const count = s.renderers[0].calls.length;
  await s.advance(5000);
  assert.equal(s.renderers[0].calls.length, count);
  s.document.hidden = false; s.document.listeners.visibilitychange();
  await s.advance(100);
  assert.ok(s.renderers[0].calls.length > count);
  assert.equal(s.role.textContent, 'AI Agent Engineering Intern');
});

test('user input dismisses the intro without blocking content or resurrecting it', async () => {
  const s = setup({ hash: '' });
  await s.advance(300);
  s.window.listeners.wheel({ type: 'wheel' });
  assert.equal(s.intro.hidden, true);
  await s.advance(2000);
  assert.equal(s.root.classList.contains('intro-active'), false);
  assert.equal(s.intro.dataset.endReason, 'wheel');
});

test('scroll transforms update together and are cleared when motion stops', async () => {
  const s = setup();
  await s.advance(30);
  assert.ok(Number(s.scenes[0].style['--scroll-progress']) > 0);
  s.button.listeners.click();
  assert.equal(s.scenes[0].style['--scroll-progress'], undefined);
  s.window.listeners.scroll();
  await s.advance(30);
  assert.equal(s.scenes[0].style['--scroll-progress'], undefined);
});
