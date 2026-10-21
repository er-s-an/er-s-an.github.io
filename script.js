const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-button');
let paused = false;

function syncMotion() {
  const stopped = paused || reducedMotion.matches;
  root.classList.toggle('motion-paused', stopped);
  motionButton.setAttribute('aria-pressed', String(stopped));
  motionButton.setAttribute('aria-label', stopped ? 'Resume animations' : 'Pause animations');
  motionButton.title = reducedMotion.matches ? 'Reduced motion follows your system setting' : motionButton.getAttribute('aria-label');
  motionButton.disabled = reducedMotion.matches;
  motionButton.querySelector('.motion-label').textContent = stopped ? 'MOTION OFF' : 'MOTION ON';
  motionButton.querySelector('.motion-symbol').textContent = stopped ? '▷' : 'Ⅱ';
  if (stopped) document.querySelectorAll('.revealing').forEach(element => element.classList.remove('revealing'));
}
motionButton.hidden = false;
syncMotion();
motionButton.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);

// Content stays visible without JavaScript; only animate when a section enters view.
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
