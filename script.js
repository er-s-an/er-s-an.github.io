const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-button');
const intro = document.querySelector('.brand-intro');
const introLogo = document.querySelector('.intro-logo');
const introVeil = document.querySelector('.intro-veil');
const introMetal = document.querySelector('.intro-metal');
const introCoating = document.querySelector('.intro-coating');
const introCaption = document.querySelector('.intro-caption');
const drips = [...document.querySelectorAll('.metal-drip')];
const heroArt = document.querySelector('.hero-art');
const slides = [...document.querySelectorAll('.brand-slide')];
const brandButtons = [...document.querySelectorAll('.brand-controls button')];
const scenes = [...document.querySelectorAll('[data-scroll-scene]')];
const brands = {
  makebook: ['MAKEBOOK', 'THE MAIN VENTURE / CTO', 'PUTTING THE “MAKE” IN MAKEBOOK.'],
  tencent: ['Tencent', 'TENCENT GAMES / FORMER INTERN', 'AI AGENTS, LLM RESEARCH & GAME DESIGN.'],
  advx: ['AdventureX', '2026 WEB3 TRACK / FIRST PLACE', 'A SIDE QUEST THAT BECAME THE MAIN QUEST.'],
  redstar: ['Red Star News', 'AI & NEW MEDIA / FORMER INTERN', 'BEFORE AGENTS, THERE WERE DEADLINES.']
};
let paused = false;
let currentBrand = 0;
let rotationTimer;
let transitionTimer;
let scrollFrame;
let introFrame;
let introTimeout;
let dockAnimation;
let introDone = false;
let heroVisible = true;
let interacting = false;
const stopped = () => paused || reducedMotion.matches;
const clamp = value => Math.max(0, Math.min(1, value));

function finishIntro(reason) {
  intro.dataset.endReason = reason?.type || (typeof reason === 'string' ? reason : 'complete');
  introDone = true;
  cancelAnimationFrame(introFrame);
  clearTimeout(introTimeout);
  dockAnimation?.cancel();
  intro.hidden = true;
  root.classList.remove('intro-active');
}

function scheduleRotation() {
  clearTimeout(rotationTimer);
  if (stopped() || document.hidden || !heroVisible || interacting) return;
  rotationTimer = setTimeout(() => showBrand((currentBrand + 1) % slides.length), 4800);
}

function showBrand(index) {
  clearTimeout(rotationTimer);
  clearTimeout(transitionTimer);
  slides.forEach(slide => slide.classList.remove('is-arriving', 'is-departing'));
  if (index === currentBrand) { scheduleRotation(); return; }
  const swap = () => {
    currentBrand = index;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    brandButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const [name, role, note] = brands[slides[index].dataset.brand];
    document.querySelector('#brand-name').textContent = name;
    document.querySelector('#brand-role').textContent = role;
    document.querySelector('#brand-note').textContent = note;
    if (!stopped()) slides[index].classList.add('is-arriving');
    scheduleRotation();
  };
  if (stopped()) swap();
  else {
    slides[currentBrand].classList.add('is-departing');
    transitionTimer = setTimeout(swap, 250);
  }
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
  motionButton.setAttribute('aria-label', off ? 'Resume animations' : 'Pause animations');
  motionButton.title = reducedMotion.matches ? 'Reduced motion follows your system setting' : motionButton.getAttribute('aria-label');
  motionButton.disabled = reducedMotion.matches;
  motionButton.querySelector('.motion-label').textContent = off ? 'MOTION OFF' : 'MOTION ON';
  motionButton.querySelector('.motion-symbol').textContent = off ? '▷' : 'Ⅱ';
  if (off) {
    finishIntro();
    clearTimeout(transitionTimer);
    cancelAnimationFrame(scrollFrame);
    scrollFrame = undefined;
    scenes.forEach(scene => scene.style.removeProperty('--scroll-progress'));
    slides.forEach(slide => slide.classList.remove('is-arriving', 'is-departing'));
    document.querySelectorAll('.revealing').forEach(element => element.classList.remove('revealing'));
  } else queueScroll();
  scheduleRotation();
}

async function startIntro() {
  if (stopped() || scrollY > 100 || (location.hash && location.hash !== '#top')) { finishIntro(); return; }
  try {
    await Promise.race([introLogo.querySelector('img').decode(), new Promise(resolve => setTimeout(resolve, 600))]);
    if (introDone || stopped()) return;
    intro.hidden = false;
    root.classList.add('intro-active');
    introTimeout = setTimeout(finishIntro, 2300);
    const started = performance.now();
    const flow = now => {
      const elapsed = now - started;
      const p = clamp((elapsed - 100) / 1250);
      const edge = p * 120 - 20;
      const points = Array.from({ length: 9 }, (_, i) => `${i * 12.5}% ${edge + Math.sin(i * 1.8 + p * 8) * 9 * Math.sin(p * Math.PI)}%`);
      introCoating.style.clipPath = `polygon(${points.join(',')},100% 100%,0% 100%)`;
      introCoating.style.backgroundPosition = `50% ${p * 100}%`;
      document.querySelector('#intro-displacement').setAttribute('scale', String(20 * (1 - p)));
      drips.forEach((drip, i) => {
        const phase = clamp((p - i * .055) / .8);
        drip.style.transform = `translateY(${phase * 120}%) scale(${1 - phase * .6},${.05 + Math.sin(phase * Math.PI) * 1.3})`;
        drip.style.opacity = String(Math.sin(phase * Math.PI) * (1 - p));
      });
      introCaption.style.opacity = String(1 - clamp((elapsed - 950) / 350));
      introVeil.style.opacity = String(1 - clamp((elapsed - 1100) / 800));
      if (elapsed < 1400) introFrame = requestAnimationFrame(flow);
      else {
        const target = document.querySelector('.monogram').getBoundingClientRect();
        const origin = introLogo.getBoundingClientRect();
        const dx = target.left + target.width / 2 - origin.left - origin.width / 2;
        const dy = target.top + target.height / 2 - origin.top - origin.height / 2;
        const scale = target.width / origin.width;
        introMetal.style.opacity = '0';
        introVeil.animate([{ opacity: introVeil.style.opacity }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
        dockAnimation = introLogo.animate([
          { transform: 'translate3d(0,0,0) scale(1)' },
          { transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})` }
        ], { duration: 500, easing: 'cubic-bezier(.65,0,.22,1)', fill: 'forwards' });
        dockAnimation.finished.then(finishIntro, finishIntro);
      }
    };
    introFrame = requestAnimationFrame(flow);
  } catch { finishIntro(); }
}

motionButton.hidden = false;
syncMotion();
startIntro();
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);
brandButtons.forEach((button, index) => button.addEventListener('click', () => showBrand(index)));
heroArt.addEventListener('pointerenter', () => { interacting = true; scheduleRotation(); });
heroArt.addEventListener('pointerleave', () => { interacting = heroArt.contains(document.activeElement); scheduleRotation(); });
heroArt.addEventListener('focusin', () => { interacting = true; scheduleRotation(); });
heroArt.addEventListener('focusout', event => { interacting = heroArt.contains(event.relatedTarget); scheduleRotation(); });
window.addEventListener('scroll', queueScroll, { passive: true });
window.addEventListener('resize', () => { if (dockAnimation) finishIntro('resize'); queueScroll(); }, { passive: true });
// An intro is decoration: any attempt to use the page dismisses it immediately.
['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(type => window.addEventListener(type, finishIntro, { once: true, passive: true }));
document.addEventListener('visibilitychange', () => { if (document.hidden) finishIntro(); scheduleRotation(); });

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
    scheduleRotation();
  });
  heroObserver.observe(heroArt);
}
