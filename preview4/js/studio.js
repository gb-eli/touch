/* TV TOUCH / Studio — UI state only. No analytics, no third-party services. */
(() => {
  'use strict';
  const root = document.body;
  const storageKey = 'tvtouch-theme-mode';
  const themes = ['dark', 'light', 'colorful'];
  const buttons = [...document.querySelectorAll('[data-theme-mode]')];
  const toggle = document.querySelector('[data-color-pause]');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { theme: 'dark', timer: null, paused: false };
  function read() { try { return localStorage.getItem(storageKey); } catch { return null; } }
  function save(value) { try { localStorage.setItem(storageKey, value); } catch {} }
  function paint() {
    if(state.paused || media.matches || document.hidden || state.theme !== 'colorful') return;
    const hue = () => Math.floor(Math.random() * 360);
    root.style.setProperty('--tvt-h1', hue());
    root.style.setProperty('--tvt-h2', hue());
    root.style.setProperty('--tvt-a', (0.19 + Math.random() * .28).toFixed(2));
  }
  function cycle() {
    clearInterval(state.timer);
    state.timer = null;
    if(state.theme === 'colorful' && !state.paused && !media.matches && !document.hidden) {
      state.timer = setInterval(paint, 9600);
    }
  }
  function setTheme(value) {
    state.theme = themes.includes(value) ? value : 'dark';
    root.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme === 'light' ? 'light' : 'dark';
    buttons.forEach(b => {
      const active = b.dataset.themeMode === state.theme;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    if(toggle) toggle.hidden = state.theme !== 'colorful';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', state.theme === 'light' ? '#f4f5fc' : '#060811');
    save(state.theme);
    if(state.theme === 'colorful') paint();
    cycle();
  }
  buttons.forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeMode)));
  toggle?.addEventListener('click', () => {
    state.paused = !state.paused;
    toggle.setAttribute('aria-pressed', String(state.paused));
    toggle.textContent = state.paused ? 'Continuar' : 'Pausar';
    cycle();
  });
  document.addEventListener('visibilitychange', cycle);
  media.addEventListener?.('change', cycle);
  document.querySelectorAll('.studio-tile').forEach(button => button.addEventListener('pointerdown', () => {
    button.classList.add('pressed');
  }));
  document.addEventListener('pointerup', () => document.querySelectorAll('.studio-tile.pressed').forEach(e => e.classList.remove('pressed')));
  document.addEventListener('pointercancel', () => document.querySelectorAll('.studio-tile.pressed').forEach(e => e.classList.remove('pressed')));
  window.addEventListener('load', () => {
    const page = document.querySelector('.page.active')?.id.replace('page-', '') || 'inicio';
    window.dispatchEvent(new CustomEvent('tvt:page-change', {detail:{page}}));
  });
  setTheme(read() || 'dark');
  window.TVTouchStudio = Object.freeze({ version: '2.1.0', theme: () => state.theme });
})();