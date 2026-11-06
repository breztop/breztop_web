import { translations } from '../locales/translations.js';

const languageKey = 'brez.resume.language';
const sections = [...document.querySelectorAll('main > section')];
const menu = document.querySelector('.mobile-menu');
const menuButton = document.querySelector('.menu-toggle');
const sectionLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const lookup = (dictionary, key) => key.split('.').reduce((value, part) => value?.[part], dictionary);
let highlightPending = false;

function queueHighlight() {
  if (highlightPending) return;
  highlightPending = true;
  requestAnimationFrame(() => {
    highlightPending = false;
    const boundary = document.querySelector('.header-inner').getBoundingClientRect().height + 40;
    let current = sections[0].id;
    for (const section of sections) if (section.getBoundingClientRect().top <= boundary) current = section.id;
    if (document.documentElement.scrollHeight <= innerHeight + 1) {
      const target = location.hash === '#future' ? '#about' : location.hash;
      if (sectionLinks.some(link => link.hash === target)) current = target.slice(1);
    } else if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) current = 'contact';
    for (const link of sectionLinks) {
      if (link.hash === `#${current}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  });
}

function setLanguage(language, { remember = false } = {}) {
  const dictionary = translations[language] || translations.zh;
  document.documentElement.lang = { zh: 'zh-CN', en: 'en', ja: 'ja' }[language] || 'zh-CN';
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = lookup(dictionary, node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-label]')) node.setAttribute('aria-label', lookup(dictionary, node.dataset.i18nLabel));
  for (const node of document.querySelectorAll('[data-i18n-content]')) node.content = lookup(dictionary, node.dataset.i18nContent);
  for (const button of document.querySelectorAll('.lang-btn')) button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  if (remember) {
    try { localStorage.setItem(languageKey, language); } catch { /* Language switching also works without storage. */ }
  }
  queueHighlight();
}

function initialLanguage() {
  try {
    const saved = localStorage.getItem(languageKey);
    if (Object.hasOwn(translations, saved)) return saved;
  } catch { /* Use the browser language if storage is unavailable. */ }
  const language = navigator.language.split('-')[0];
  return Object.hasOwn(translations, language) ? language : 'zh';
}

function closeMenu({ restoreFocus = false } = {}) {
  menu.hidden = true;
  menu.inert = true;
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuButton.focus();
}

function checkLegacyHash() {
  if (location.hash === '#projects') location.replace(new URL('../project-show/', location.href));
  closeMenu();
  queueHighlight();
}

menuButton.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  menu.inert = !open;
  menuButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  // Let native anchors handle scrolling, focus and browser history.
  if (event.target.closest('a') || !event.target.closest('.mobile-menu, .menu-toggle')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) closeMenu({ restoreFocus: true });
});
for (const button of document.querySelectorAll('.lang-btn')) button.addEventListener('click', () => setLanguage(button.dataset.lang, { remember: true }));
document.querySelector('.print-button').addEventListener('click', () => window.print());
addEventListener('beforeprint', () => closeMenu());
addEventListener('hashchange', checkLegacyHash);
addEventListener('scroll', queueHighlight, { passive: true });
addEventListener('resize', () => {
  if (matchMedia('(min-width: 1101px)').matches) closeMenu();
  queueHighlight();
});
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--header-height', `${document.querySelector('.header-inner').getBoundingClientRect().height}px`);
  queueHighlight();
}).observe(document.querySelector('.site-header'));

setLanguage(initialLanguage());
document.querySelector('.language-controls').hidden = false;
menuButton.hidden = false;
document.querySelector('.print-button').hidden = false;
document.documentElement.classList.add('resume-ready');
checkLegacyHash();
