import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('style.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('script.js', import.meta.url), 'utf8');

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
});

function setup({ reduced = false, hash = '#work' } = {}) {
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
  const intro = element(), logo = element(), veil = element(), metal = element(), coating = element(), caption = element();
  logo.querySelector = () => ({ decode: () => Promise.resolve() });
  const monogram = element();
  monogram.getBoundingClientRect = () => ({ left: 48, top: 25, width: 145, height: 46 });
  const hero = element(), displacement = element();
  const names = ['makebook', 'tencent', 'advx', 'redstar'];
  const slides = names.map(brand => element({ brand }));
  slides[0].hidden = false;
  const buttons = names.map(brand => element({ brand }));
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === 0)));
  const scenes = [element(), element(), element()];
  const name = element(), role = element(), note = element();
  const one = { '.motion-button': button, '.brand-intro': intro, '.intro-logo': logo, '.intro-veil': veil, '.intro-metal': metal, '.intro-coating': coating, '.intro-caption': caption, '.hero-art': hero, '.monogram': monogram, '#intro-displacement': displacement, '#brand-name': name, '#brand-role': role, '#brand-note': note };
  const many = { '.metal-drip': Array.from({ length: 4 }, () => element()), '.brand-slide': slides, '.brand-controls button': buttons, '[data-scroll-scene]': scenes };
  const media = { matches: reduced, addEventListener(_, fn) { this.change = fn; } };
  const window = { listeners: {}, addEventListener(k, fn) { this.listeners[k] = fn; } };
  const document = { hidden: false, activeElement: null, listeners: {}, documentElement: root, querySelector: q => one[q], querySelectorAll: q => many[q] || [], addEventListener(k, fn) { this.listeners[k] = fn; } };
  runInNewContext(script, { document, window, matchMedia: () => media, location: { hash }, scrollY: 0, innerHeight: 900, performance: { now: () => now }, setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => jobs.delete(id), requestAnimationFrame: fn => schedule(fn, 16, true), cancelAnimationFrame: id => jobs.delete(id) });
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
  return { root, button, label, media, intro, logo, slides, buttons, name, scenes, window, document, advance };
}

test('pause during a brand transition cancels it cleanly; resume cycles again', async () => {
  const s = setup();
  await s.advance(4900);
  s.button.listeners.click();
  await s.advance(1000);
  assert.equal(s.slides.filter(x => !x.hidden).length, 1);
  assert.equal(s.slides[0].hidden, false);
  assert.equal(s.button.getAttribute('aria-label'), 'Resume animations');
  assert.equal(s.label.textContent, 'MOTION OFF');
  s.button.listeners.click();
  await s.advance(5050);
  assert.equal(s.name.textContent, 'Tencent');
  assert.equal(s.buttons.filter(x => x.getAttribute('aria-pressed') === 'true').length, 1);
});

test('reduced motion skips intro and autoplay, but manual brand selection works', async () => {
  const s = setup({ reduced: true, hash: '' });
  await s.advance(10000);
  assert.equal(s.intro.hidden, true);
  assert.equal(s.button.disabled, true);
  assert.equal(s.slides[0].hidden, false);
  s.buttons[3].listeners.click();
  assert.equal(s.name.textContent, 'Red Star News');
  assert.equal(s.slides[3].classList.contains('is-arriving'), false);
  s.media.matches = false; s.media.change();
  s.button.listeners.click();
  s.media.matches = true; s.media.change();
  s.media.matches = false; s.media.change();
  assert.equal(s.root.classList.contains('motion-paused'), true);
});

test('liquid intro drains, docks to the measured header, and clears within two seconds', async () => {
  const s = setup({ hash: '#top' });
  await s.advance(650);
  assert.equal(s.intro.hidden, false);
  assert.equal(s.root.classList.contains('intro-active'), true);
  await s.advance(800);
  assert.equal(s.logo.animation.options.duration, 500);
  assert.ok(s.logo.animation.frames[1].transform.includes('scale(0.20714285714285716)'));
  await s.advance(500);
  assert.equal(s.intro.hidden, true);
  assert.equal(s.root.classList.contains('intro-active'), false);
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
