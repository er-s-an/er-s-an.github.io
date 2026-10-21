const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-button');
const panel = document.querySelector('.uniform-panel');
const garment = document.querySelector('.jacket-body');
const colorName = document.querySelector('#colorway-name');
const names = { acid: '01 / ACID', ink: '02 / INK', clay: '03 / CLAY' };
let paused = false;
let colorAnimation;

function syncMotion() {
  const stopped = paused || reducedMotion.matches;
  root.classList.toggle('motion-paused', stopped);
  motionButton.setAttribute('aria-pressed', String(stopped));
  motionButton.setAttribute('aria-label', stopped ? 'Resume animations' : 'Pause animations');
  motionButton.title = reducedMotion.matches ? 'Reduced motion follows your system setting' : motionButton.getAttribute('aria-label');
  motionButton.disabled = reducedMotion.matches;
  motionButton.querySelector('.motion-label').textContent = stopped ? 'MOTION OFF' : 'MOTION ON';
  motionButton.querySelector('.motion-symbol').textContent = stopped ? '▷' : 'Ⅱ';
  panel.style.removeProperty('--tilt');
  if (stopped) {
    colorAnimation?.cancel();
    document.querySelectorAll('.revealing').forEach(element => element.classList.remove('revealing'));
  }
}
motionButton.hidden = false;
syncMotion();
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);

document.querySelectorAll('.swatch').forEach(button => {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const look = button.dataset.look;
    if (!Object.hasOwn(names, look)) return;
    panel.dataset.look = look;
    colorName.textContent = names[look];
    document.querySelectorAll('.swatch').forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch === button)));
    colorAnimation?.cancel();
    if (!paused && !reducedMotion.matches) {
      colorAnimation = garment.animate([
        { transform: 'translateY(0)', opacity: 1 },
        { transform: 'translateY(-2px)', opacity: .6, offset: .3 },
        { transform: 'translateY(0)', opacity: 1 }
      ], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  });
});

// Content is visible without JS; reveal only as a section enters the viewport.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!paused && !reducedMotion.matches) {
        entry.target.classList.add('revealing');
        entry.target.addEventListener('animationend', () => entry.target.classList.remove('revealing'), { once: true });
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}

panel.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || paused || reducedMotion.matches) return;
  const bounds = panel.getBoundingClientRect();
  const tilt = Math.max(-3, Math.min(3, (event.clientX - bounds.left - bounds.width / 2) / bounds.width * 6));
  panel.style.setProperty('--tilt', `${tilt}deg`);
});
panel.addEventListener('pointerleave', () => panel.style.removeProperty('--tilt'));
