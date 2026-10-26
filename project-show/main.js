(() => {
  'use strict';

  const home = document.body.dataset.page === 'home';
  function updateNavigation() {
    const current = home ? (location.hash === '#about' ? 'about' : 'home') : 'projects';
    document.querySelectorAll('[data-nav]').forEach(link => {
      const active = link.dataset.nav === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', current === 'about' ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
  }
  updateNavigation();
  window.addEventListener('hashchange', updateNavigation);

  const panel = document.querySelector('.filter-panel');
  if (!panel) return;

  const input = document.getElementById('project-search');
  const clearButton = panel.querySelector('[data-clear-search]');
  const buttons = [...panel.querySelectorAll('button[data-category]')];
  const allowed = new Set(buttons.map(button => button.dataset.category));
  const storageKey = 'breztop:project-category';
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase();
  const cards = [...document.querySelectorAll('.archive-group .project-card')].map(node => ({
    node, category: node.dataset.category, search: normalize(node.dataset.search),
  }));
  const groups = [...document.querySelectorAll('.archive-group')];
  const status = panel.querySelector('[role="status"]');
  const empty = document.querySelector('.empty-state');
  let category = 'all';
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (allowed.has(saved)) category = saved;
  } catch { /* Browsing and filtering also work when storage is unavailable. */ }

  function applyFilters() {
    const query = normalize(input.value.trim());
    const counts = Object.fromEntries([...allowed].map(key => [key, 0]));
    let visibleCount = 0;
    cards.forEach(card => {
      const matches = card.search.includes(query);
      if (matches) { counts.all++; counts[card.category]++; }
      card.node.hidden = !matches || (category !== 'all' && card.category !== category);
      if (!card.node.hidden) visibleCount++;
    });
    buttons.forEach(button => {
      const id = button.dataset.category;
      button.setAttribute('aria-pressed', String(category === id));
      button.querySelector('span').textContent = String(counts[id]);
    });
    groups.forEach(group => {
      const count = [...group.querySelectorAll('.project-card')].filter(card => !card.hidden).length;
      group.hidden = count === 0;
      group.querySelector('h2 span').textContent = String(count).padStart(2, '0');
    });
    status.textContent = `找到 ${visibleCount} 个作品`;
    clearButton.hidden = input.value.length === 0;
    empty.hidden = visibleCount !== 0;
  }
  function selectCategory(value) {
    category = allowed.has(value) ? value : 'all';
    try { sessionStorage.setItem(storageKey, category); } catch { /* Optional, tab-local preference. */ }
    applyFilters();
  }
  buttons.forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.category)));
  input.addEventListener('input', applyFilters);
  input.addEventListener('search', applyFilters);
  clearButton.addEventListener('click', () => { input.value = ''; applyFilters(); input.focus(); });
  document.querySelector('[data-reset-filters]').addEventListener('click', () => {
    input.value = ''; selectCategory('all'); input.focus();
  });
  // Full HTML navigation keeps links and browser history native. Restore any cached input state.
  window.addEventListener('pageshow', applyFilters);
  applyFilters();
  panel.hidden = false;
})();
