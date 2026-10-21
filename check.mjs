import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('style.css', import.meta.url), 'utf8');
const script = readFileSync(new URL('script.js', import.meta.url), 'utf8');

test('public content, anchors, and local assets are complete', () => {
  for (const match of html.matchAll(/(?:href|src)="([^"?#]+)"/g)) {
    if (!/^(https?:|data:)/.test(match[1])) assert.ok(existsSync(new URL(match[1], import.meta.url)), match[1]);
  }
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${match[1]}"`), match[1]);
  for (const text of ['CTO of', 'STUDENT ENTREPRENEUR', 'https://makebook.xyz', 'https://x.com/Aiyakale', 'AI agent-native engine for building web games']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('makebook.hk2048.online'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(!html.includes('maximum-scale'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

function setup(reduced = false) {
  const element = (dataset = {}) => ({ dataset, attributes: {}, listeners: {}, textContent: '', hidden: true,
    style: { removeProperty() {}, setProperty() {} },
    setAttribute(key, value) { this.attributes[key] = value; },
    getAttribute(key) { return this.attributes[key] ?? null; },
    addEventListener(key, fn) { this.listeners[key] = fn; },
    animate() { this.animations = (this.animations || 0) + 1; return { cancel() {} }; }
  });
  const root = element();
  root.classList = { toggle(name, value) { root[name] = value; } };
  const button = element();
  const label = element();
  const symbol = element();
  button.querySelector = query => query === '.motion-label' ? label : symbol;
  const panel = element({ look: 'acid' });
  const garment = element();
  const color = element();
  const swatches = ['acid', 'ink', 'clay'].map(look => element({ look }));
  swatches.forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch.dataset.look === 'acid')));
  const media = { matches: reduced, addEventListener(_, fn) { this.change = fn; } };
  const elements = { '.motion-button': button, '.uniform-panel': panel, '.jacket-body': garment, '#colorway-name': color };
  runInNewContext(script, { document: { documentElement: root, querySelector: query => elements[query], querySelectorAll: query => query === '.swatch' ? swatches : [] }, matchMedia: () => media, window: {} });
  return { root, button, panel, garment, color, swatches, media };
}

test('colorways are exclusive, keyboard-compatible clicks are idempotent, and motion can stop', () => {
  const state = setup();
  state.swatches[1].listeners.click();
  assert.equal(state.panel.dataset.look, 'ink');
  assert.equal(state.color.textContent, '02 / INK');
  assert.equal(state.swatches.filter(x => x.getAttribute('aria-pressed') === 'true').length, 1);
  state.swatches[1].listeners.click();
  assert.equal(state.garment.animations, 1);
  state.button.listeners.click();
  assert.equal(state.root['motion-paused'], true);
  state.swatches[2].listeners.click();
  assert.equal(state.panel.dataset.look, 'clay');
  assert.equal(state.garment.animations, 1);
  state.button.listeners.click();
  assert.equal(state.root['motion-paused'], false);
});

test('system reduced motion remains authoritative and responds to live changes', () => {
  const state = setup(true);
  assert.equal(state.button.disabled, true);
  assert.equal(state.root['motion-paused'], true);
  state.swatches[1].listeners.click();
  assert.equal(state.garment.animations, undefined);
  state.media.matches = false;
  state.media.change();
  assert.equal(state.button.disabled, false);
  assert.equal(state.root['motion-paused'], false);
});
