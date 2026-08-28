import './legal.css';

if ('serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js'); });

document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', () => {
  const main = document.querySelector<HTMLElement>('#main');
  if (!main) return;
  main.tabIndex = -1;
  window.setTimeout(() => main.focus({ preventScroll: true }));
});
