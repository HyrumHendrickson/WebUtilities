import { icon } from './icons.js';
import { CATEGORIES, TOOLS, getTool, searchTools } from './registry.js';
import { clear, h, toast } from './ui.js';

const main = document.getElementById('main');
const sidebar = document.getElementById('sidebar');
const search = document.getElementById('search');
const menuToggle = document.getElementById('menu-toggle');
const themeToggle = document.getElementById('theme-toggle');
const scrim = document.getElementById('scrim');

const APP_NAME = 'Web Utilities';
let cleanup = null;
let renderToken = 0;

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

const THEMES = ['system', 'light', 'dark'];

function currentTheme() {
  const value = document.documentElement.dataset.theme;
  return THEMES.includes(value) ? value : 'system';
}

function applyTheme(theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    if (theme === 'system') localStorage.removeItem('wu-theme');
    else localStorage.setItem('wu-theme', theme);
  } catch {
    /* Preference simply will not persist. */
  }
  renderThemeToggle();
}

function renderThemeToggle() {
  const theme = currentTheme();
  const iconName = { system: 'system', light: 'sun', dark: 'moon' }[theme];
  const label = `Theme: ${theme}. Select to change.`;
  themeToggle.replaceChildren(icon(iconName, { size: 20 }));
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
}

themeToggle.addEventListener('click', () => {
  applyTheme(THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length]);
});

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function renderSidebar(activeId) {
  const matches = new Set(searchTools(search.value).map((tool) => tool.id));
  clear(sidebar);
  sidebar.append(
    h(
      'a',
      { class: `nav__home${activeId ? '' : ' is-active'}`, href: '#/', 'aria-current': activeId ? null : 'page' },
      icon('grid', { size: 18 }),
      'All tools',
    ),
  );
  let shown = 0;
  for (const category of CATEGORIES) {
    const tools = TOOLS.filter((tool) => tool.category === category.id && matches.has(tool.id));
    if (!tools.length) continue;
    shown += tools.length;
    sidebar.append(
      h(
        'section',
        { class: 'nav__group', 'aria-labelledby': `nav-${category.id}` },
        h('h2', { class: 'nav__heading', id: `nav-${category.id}` }, category.title),
        h(
          'ul',
          { class: 'nav__list' },
          tools.map((tool) =>
            h(
              'li',
              {},
              h(
                'a',
                {
                  class: `nav__link${tool.id === activeId ? ' is-active' : ''}`,
                  href: `#/${tool.id}`,
                  'aria-current': tool.id === activeId ? 'page' : null,
                },
                icon(tool.icon, { size: 18 }),
                tool.title,
              ),
            ),
          ),
        ),
      ),
    );
  }
  if (!shown) sidebar.append(h('p', { class: 'nav__empty' }, 'No tools match your search.'));
}

function toolTile(tool) {
  return h(
    'a',
    { class: 'tile', href: `#/${tool.id}`, dataset: { category: tool.category } },
    h('span', { class: 'tile__icon' }, icon(tool.icon, { size: 24 })),
    h('span', { class: 'tile__title' }, tool.title),
    h('span', { class: 'tile__text' }, tool.description),
  );
}

function renderHome() {
  document.title = APP_NAME;
  const matches = searchTools(search.value);
  const matchIds = new Set(matches.map((tool) => tool.id));
  const query = search.value.trim();

  const hero = h(
    'section',
    { class: 'hero' },
    h(
      'div',
      { class: 'hero__copy' },
      h('h1', { id: 'page-title', tabindex: '-1' }, 'Small tools for everyday web tasks'),
      h(
        'p',
        { class: 'hero__lede' },
        `${TOOLS.length} utilities that run entirely in your browser. Your files and text are never uploaded.`,
      ),
    ),
    h('img', { class: 'hero__logo', src: 'assets/icons/icon-512.png', width: 220, height: 220, alt: '' }),
  );

  const sections = CATEGORIES.map((category) => {
    const tools = TOOLS.filter((tool) => tool.category === category.id && matchIds.has(tool.id));
    if (!tools.length) return null;
    return h(
      'section',
      { class: 'catalog', 'aria-labelledby': `cat-${category.id}` },
      h('h2', { id: `cat-${category.id}` }, category.title),
      h('p', { class: 'catalog__blurb' }, category.blurb),
      h('div', { class: 'tiles' }, tools.map(toolTile)),
    );
  });

  clear(main).append(hero, ...sections.filter(Boolean));
  if (query && matches.length === 0)
    main.append(
      h('p', { class: 'empty' }, `No tools match “${query}”. Try a file type, a format, or a task such as “resize”.`),
    );
}

async function renderTool(tool) {
  const token = ++renderToken;
  document.title = `${tool.title} · ${APP_NAME}`;

  const body = h('div', { class: 'tool__body' }, h('p', { class: 'loading' }, 'Loading…'));
  clear(main).append(
    h(
      'article',
      { class: 'tool' },
      h(
        'header',
        { class: 'tool__head', dataset: { category: tool.category } },
        h('span', { class: 'tool__icon' }, icon(tool.icon, { size: 26 })),
        h(
          'div',
          {},
          h('h1', { id: 'page-title', tabindex: '-1' }, tool.title),
          h('p', { class: 'tool__desc' }, tool.description),
        ),
      ),
      body,
    ),
  );

  try {
    const module = await tool.load();
    if (token !== renderToken) return;
    clear(body);
    const result = await module.mount(body);
    if (token !== renderToken) {
      if (typeof result === 'function') result();
      return;
    }
    cleanup = typeof result === 'function' ? result : null;
  } catch (error) {
    if (token !== renderToken) return;
    console.error(error);
    clear(body).append(h('div', { class: 'status status--error' }, `This tool could not be loaded. ${error.message}`));
  }
}

function route() {
  renderToken++;
  cleanup?.();
  cleanup = null;
  closeMenu();

  const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')[0];
  const tool = getTool(id);
  renderSidebar(tool?.id);
  if (tool) renderTool(tool);
  else renderHome();

  window.scrollTo(0, 0);
  document.getElementById('page-title')?.focus({ preventScroll: true });
}

window.addEventListener('hashchange', route);

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

search.addEventListener('input', () => {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')[0];
  renderSidebar(getTool(id)?.id);
  if (!getTool(id)) {
    const focused = document.activeElement === search;
    renderHome();
    if (focused) search.focus();
  }
});

search.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const first = searchTools(search.value)[0];
    if (first) {
      location.hash = `#/${first.id}`;
      search.blur();
    }
  } else if (event.key === 'Escape') {
    search.value = '';
    search.dispatchEvent(new Event('input'));
    search.blur();
  }
});

document.addEventListener('keydown', (event) => {
  const typing =
    event.target instanceof HTMLElement &&
    (event.target.matches('input, textarea, select') || event.target.isContentEditable);
  if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    search.focus();
    search.select();
  }
});

/* ------------------------------------------------------------------ */
/* Mobile menu                                                         */
/* ------------------------------------------------------------------ */

function openMenu() {
  document.body.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
scrim.addEventListener('click', closeMenu);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
    closeMenu();
    menuToggle.focus();
  }
});

/* ------------------------------------------------------------------ */
/* Start                                                               */
/* ------------------------------------------------------------------ */

renderThemeToggle();
route();

window.addEventListener('unhandledrejection', (event) => {
  console.error(event.reason);
  toast('Something went wrong. Please try again.', { type: 'error' });
});

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {
    /* Offline support is optional. */
  });
}
