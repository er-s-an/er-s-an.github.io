const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-button');
const intro = document.querySelector('.brand-intro');
const introLogo = document.querySelector('.intro-logo');
const introVeil = document.querySelector('.intro-veil');
const introCanvas = document.querySelector('.intro-liquid');
const heroArt = document.querySelector('.hero-art');
const brandStage = document.querySelector('.brand-stage');
const brandCanvas = document.querySelector('.brand-liquid');
const slides = [...document.querySelectorAll('.brand-slide')];
const brandButtons = [...document.querySelectorAll('.brand-controls button')];
const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
const brands = {
  makebook: ['MAKEBOOK / MAIN VENTURE', 'CTO & builder', 'FULL-STACK PRODUCT & SMART CONTRACTS.'],
  tencent: ['TENCENT GAMES / LIGHTSPEED · COMPLETED', 'AI Agent Engineering Intern', 'AI AGENTS · LLM RESEARCH · GAME DESIGN.'],
  advx: ['ADVENTUREX 2026 / MAKEBOOK', 'Web3 Track · 1st place', 'FIRST PLACE, THEN BACK TO BUILDING.'],
  redstar: ['RED STAR NEWS / COMPLETED', 'AI & New Media Intern', 'DIGITAL HUMANS, AI MEDIA & REAL DEADLINES.']
};
let paused = false;
let currentBrand = 0;
let rotationTimer;
let metal;
let introMetal;
let initializingMetal = false;
let metalFrame;
let metalTime = 0;
let previousFrame;
let morph;
let pendingBrand;
let scrollFrame;
let introFrame;
let introTimeout;
let dockAnimation;
let introDone = false;
let heroVisible = true;
let interacting = false;
const stopped = () => paused || reducedMotion.matches;
const clamp = value => Math.max(0, Math.min(1, value));
const morphDuration = 1.15;

function finishIntro(reason) {
  intro.dataset.endReason = reason?.type || (typeof reason === 'string' ? reason : 'complete');
  introDone = true;
  cancelAnimationFrame(introFrame);
  clearTimeout(introTimeout);
  dockAnimation?.cancel();
  introMetal?.destroy();
  intro.hidden = true;
  root.classList.remove('intro-active');
}

function scheduleRotation() {
  clearTimeout(rotationTimer);
  if (stopped() || document.hidden || !heroVisible || interacting || morph) return;
  rotationTimer = setTimeout(() => showBrand((currentBrand + 1) % slides.length), 4800);
}

function selectBrand(index) {
  currentBrand = index;
  slides.forEach((slide, i) => { slide.hidden = i !== index; });
  brandButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  const brand = slides[index].dataset.brand;
  const [name, role, note] = brands[brand].map((text, i) => translate(`brand.${brand}.${['name', 'role', 'note'][i]}`, text));
  document.querySelector('#brand-name').textContent = name;
  document.querySelector('#brand-role').textContent = role;
  document.querySelector('#brand-note').textContent = note;
}

function settleMorph() {
  if (pendingBrand !== undefined || morph) selectBrand(pendingBrand ?? morph.to);
  morph = undefined;
  pendingBrand = undefined;
  metal?.draw(currentBrand, currentBrand, 0, metalTime);
}

function drawMetal(now) {
  metalFrame = undefined;
  if (!metal || stopped() || document.hidden || !heroVisible) { previousFrame = undefined; return; }
  if (!intro.hidden) { previousFrame = undefined; queueMetal(); return; }
  const delta = previousFrame === undefined ? 0 : Math.min((now - previousFrame) / 1000, .05);
  previousFrame = now;
  metalTime += delta;
  if (morph) {
    morph.elapsed += delta;
    const p = clamp(morph.elapsed / morphDuration);
    metal.draw(morph.from, morph.to, p, metalTime);
    if (p >= .5 && currentBrand !== morph.to) selectBrand(morph.to);
    if (p === 1) {
      morph = undefined;
      const next = pendingBrand;
      pendingBrand = undefined;
      if (next !== undefined) showBrand(next);
      else scheduleRotation();
    }
  } else metal.draw(currentBrand, currentBrand, 0, metalTime);
  queueMetal();
}

function queueMetal() {
  if (metal && !metalFrame && !stopped() && !document.hidden && heroVisible) metalFrame = requestAnimationFrame(drawMetal);
}

function showBrand(index) {
  clearTimeout(rotationTimer);
  if (morph && !stopped()) {
    // Until the pool reforms, a new destination can share the same flowing surface.
    if (morph.elapsed < morphDuration / 2) morph.to = index;
    else pendingBrand = index;
    return;
  }
  if (!metal || stopped() || index === currentBrand) {
    selectBrand(index);
    metal?.draw(index, index, 0, metalTime);
    scheduleRotation();
    return;
  }
  morph = { from: currentBrand, to: index, elapsed: 0 };
  queueMetal();
}

async function ensureMetal() {
  if (metal || initializingMetal || stopped()) return;
  initializingMetal = true;
  try {
    const sources = slides.map(slide => `/assets/metal/${slide.dataset.brand}.png`);
    metal = await createLiquidMetal(brandCanvas, sources, 600, 400, () => {
      metal = undefined;
      cancelAnimationFrame(metalFrame);
      metalFrame = undefined;
      settleMorph();
      brandStage.classList.remove('has-liquid-metal');
      scheduleRotation();
    });
    metal.draw(currentBrand, currentBrand, 0, metalTime);
    brandStage.classList.add('has-liquid-metal');
    queueMetal();
  } catch { brandStage.classList.remove('has-liquid-metal'); }
  finally { initializingMetal = false; }
}

function updateScroll() {
  scrollFrame = undefined;
  if (stopped()) return;
  const progress = scenes.map(scene => {
    const bounds = scene.getBoundingClientRect();
    return clamp((innerHeight - bounds.top) / (innerHeight + bounds.height));
  });
  scenes.forEach((scene, i) => scene.style.setProperty('--scroll-progress', progress[i].toFixed(4)));
}
function queueScroll() {
  if (!stopped() && !scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}

function syncMotion() {
  const off = stopped();
  root.classList.toggle('motion-paused', off);
  motionButton.setAttribute('aria-pressed', String(off));
  motionButton.setAttribute('aria-label', off ? translate('motion.resume', 'Resume animations') : translate('motion.pause', 'Pause animations'));
  motionButton.title = reducedMotion.matches ? translate('motion.reduced', 'Reduced motion follows your system setting') : motionButton.getAttribute('aria-label');
  motionButton.disabled = reducedMotion.matches;
  motionButton.querySelector('.motion-label').textContent = off ? translate('motion.off', 'MOTION OFF') : translate('motion.on', 'MOTION ON');
  motionButton.querySelector('.motion-symbol').textContent = off ? '▷' : 'Ⅱ';
  if (off) {
    finishIntro();
    settleMorph();
    cancelAnimationFrame(metalFrame);
    metalFrame = undefined;
    previousFrame = undefined;
    cancelAnimationFrame(scrollFrame);
    scrollFrame = undefined;
    scenes.forEach(scene => scene.style.removeProperty('--scroll-progress'));
    document.querySelectorAll('.revealing').forEach(element => element.classList.remove('revealing'));
  } else { queueScroll(); ensureMetal(); queueMetal(); }
  scheduleRotation();
}

async function startIntro() {
  if (stopped() || scrollY > 100 || (location.hash && location.hash !== '#top')) { finishIntro(); return; }
  intro.hidden = false;
  intro.dataset.phase = 'loading';
  root.classList.add('intro-active');
  const signature = introLogo.querySelector('img');
  signature.style.opacity = '0';
  introTimeout = setTimeout(() => finishIntro('timeout'), 2800);
  try {
    let pageReady = false;
    Promise.all([document.fonts.ready, signature.decode()]).then(() => { pageReady = true; }, () => { pageReady = true; });
    const ready = createLiquidMetal(introCanvas, ['/assets/metal/caesar.png'], 1400, 445, finishIntro).then(renderer => {
      if (introDone) renderer.destroy();
      else introMetal = renderer;
    });
    await Promise.race([ready, new Promise(resolve => setTimeout(resolve, 700))]);
    if (introDone || stopped() || !introMetal) { finishIntro(); return; }
    const signatureWidth = introLogo.getBoundingClientRect().width;
    const started = performance.now();
    let drainingAt;
    const flow = now => {
      const elapsed = now - started;
      if (drainingAt === undefined && ((pageReady && !initializingMetal && elapsed >= 220) || elapsed >= 700)) {
        drainingAt = now;
        intro.dataset.phase = 'draining';
      }
      const draining = drainingAt === undefined ? 0 : now - drainingAt;
      introMetal.draw(0, 0, clamp(draining / 900), elapsed / 1000, signatureWidth);
      introVeil.style.opacity = '0';
      const finish = clamp((draining - 900) / 120);
      signature.style.opacity = String(finish);
      introCanvas.style.opacity = String(1 - finish);
      if (draining >= 900) intro.dataset.phase = 'signature';
      if (draining < 1080) introFrame = requestAnimationFrame(flow);
      else {
        intro.dataset.phase = 'docking';
        const target = document.querySelector('.monogram').getBoundingClientRect();
        const origin = introLogo.getBoundingClientRect();
        const dx = target.left + target.width / 2 - origin.left - origin.width / 2;
        const dy = target.top + target.height / 2 - origin.top - origin.height / 2;
        const scale = target.width / origin.width;
        introMetal.destroy();
        dockAnimation = introLogo.animate([
          { transform: 'translate3d(0,0,0) scale(1)' },
          { transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})` }
        ], { duration: 400, easing: 'cubic-bezier(.65,0,.22,1)', fill: 'forwards' });
        dockAnimation.finished.then(finishIntro, finishIntro);
      }
    };
    introFrame = requestAnimationFrame(flow);
  } catch { finishIntro(); }
}

motionButton.hidden = false;
selectBrand(currentBrand);
syncMotion();
startIntro();
document.addEventListener('languagechange', () => { selectBrand(currentBrand); syncMotion(); });
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);
brandButtons.forEach((button, index) => button.addEventListener('click', () => showBrand(index)));
heroArt.addEventListener('pointerenter', () => { interacting = true; scheduleRotation(); });
heroArt.addEventListener('pointerleave', () => { interacting = heroArt.contains(document.activeElement); scheduleRotation(); });
heroArt.addEventListener('focusin', () => { interacting = true; scheduleRotation(); });
heroArt.addEventListener('focusout', event => { interacting = heroArt.contains(event.relatedTarget); scheduleRotation(); });
window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', () => { if (!intro.hidden) finishIntro('resize'); queueScroll(); }, { passive: true });
// An intro is decoration: any attempt to use the page dismisses it immediately.
['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, finishIntro, { once: true, passive: true }));
document.addEventListener('visibilitychange', () => {
  root.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) { finishIntro(); settleMorph(); previousFrame = undefined; }
  scheduleRotation(); queueMetal();
});

// Content stays visible without JavaScript; animate only when a section enters view.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!stopped()) {
        entry.target.classList.add('revealing');
        entry.target.addEventListener('animationend', () => entry.target.classList.remove('revealing'), { once: true });
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  const heroObserver = new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    heroArt.classList.toggle('art-offscreen', !heroVisible);
    if (!heroVisible) { settleMorph(); previousFrame = undefined; }
    scheduleRotation();
    queueMetal();
  });
  heroObserver.observe(heroArt);
}
