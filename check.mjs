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
  for (const text of ['CTO of', 'STUDENT ENTREPRENEUR', 'https://makebook.xyz', 'https://x.com/Aiyakale', 'AI agent-native engine for building web games', 'LLM Research Intern', 'Game Design Intern', 'AI &amp; New Media Intern', 'First place.', 'AdventureX 2026.', 'EVM testnet prototype']) assert.ok(html.includes(text), text);
  assert.equal((html.match(/COMPLETED/g) || []).length, 4);
  for (const obsolete of ['makebook.hk2048.online', 'pixelify', 'jacket', 'uniform-panel']) assert.ok(!(html + css + script).toLowerCase().includes(obsolete === 'jacket' ? 'jacket-body' : obsolete), obsolete);
  for (const match of css.matchAll(/url\('([^']+)'\)/g)) assert.ok(existsSync(new URL(match[1], import.meta.url)), match[1]);
  assert.ok(existsSync(new URL('assets/brands/SOURCES.md', import.meta.url)));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert.ok(!html.includes('maximum-scale'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});

function setup(reduced = false) {
  const element = () => ({ attributes: {}, listeners: {}, textContent: '', hidden: true,
    setAttribute(key, value) { this.attributes[key] = value; },
    getAttribute(key) { return this.attributes[key] ?? null; },
    addEventListener(key, fn) { this.listeners[key] = fn; }
  });
  const root = element();
  root.classList = { toggle(name, value) { root[name] = value; } };
  const button = element();
  const label = element();
  const symbol = element();
  button.querySelector = query => query === '.motion-label' ? label : symbol;
  const media = { matches: reduced, addEventListener(_, fn) { this.change = fn; } };
  runInNewContext(script, { document: { documentElement: root, querySelector: () => button, querySelectorAll: () => [] }, matchMedia: () => media, window: {} });
  return { root, button, label, media };
}

test('motion toggle has an explicit accessible state and can resume', () => {
  const state = setup();
  assert.equal(state.button.hidden, false);
  state.button.listeners.click();
  assert.equal(state.root['motion-paused'], true);
  assert.equal(state.button.getAttribute('aria-label'), 'Resume animations');
  assert.equal(state.button.getAttribute('aria-pressed'), 'true');
  assert.equal(state.label.textContent, 'MOTION OFF');
  state.button.listeners.click();
  assert.equal(state.root['motion-paused'], false);
});

test('system reduced motion stays authoritative and responds to live changes', () => {
  const state = setup(true);
  assert.equal(state.button.disabled, true);
  assert.equal(state.root['motion-paused'], true);
  state.media.matches = false;
  state.media.change();
  assert.equal(state.button.disabled, false);
  assert.equal(state.root['motion-paused'], false);
  state.button.listeners.click();
  state.media.matches = true;
  state.media.change();
  state.media.matches = false;
  state.media.change();
  assert.equal(state.root['motion-paused'], true, 'manual pause survives a system preference change');
});
