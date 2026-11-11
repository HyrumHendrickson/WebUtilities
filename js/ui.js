/**
 * Small DOM and interaction helpers shared by every tool.
 * Content is always inserted with text nodes, never as HTML strings.
 */

import { icon } from './icons.js';
import { formatBytes } from './lib/format.js';

let uidCounter = 0;

/** Generate a unique element id. */
export const uid = (prefix = 'id') => `${prefix}-${++uidCounter}`;

function appendChildren(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

/**
 * Create an element.
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs] `class`, `dataset`, `on<Event>` handlers, properties like `value`/`checked`/`disabled`, or attributes.
 * @param {...unknown} children Nodes, strings, or arrays of either.
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  let value;
  for (const [key, val] of Object.entries(attrs ?? {})) {
    if (val == null || val === false) continue;
    if (key === 'class') node.className = val;
    else if (key === 'dataset') Object.assign(node.dataset, val);
    else if (key === 'value') value = val;
    else if (key === 'checked' || key === 'disabled' || key === 'hidden' || key === 'readOnly') node[key] = val;
    else if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2).toLowerCase(), val);
    else node.setAttribute(key, val === true ? '' : String(val));
  }
  appendChildren(node, children);
  if (value !== undefined) node.value = value;
  return node;
}

/** Remove all children of a node. */
export function clear(node) {
  node.replaceChildren();
  return node;
}

/** Debounce a function. */
export function debounce(fn, wait = 150) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

/* ------------------------------------------------------------------ */
/* Feedback                                                            */
/* ------------------------------------------------------------------ */

let toastRegion;

/**
 * Show a transient message.
 * @param {string} message
 * @param {{type?: 'info'|'error', timeout?: number}} [options]
 */
export function toast(message, { type = 'info', timeout = 3200 } = {}) {
  if (!toastRegion) {
    toastRegion = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastRegion);
  }
  const item = h(
    'div',
    { class: `toast toast--${type}` },
    icon(type === 'error' ? 'alert' : 'check', { size: 18 }),
    h('span', {}, message),
  );
  toastRegion.append(item);
  setTimeout(() => item.remove(), timeout);
}

/** Copy text to the clipboard and confirm. */
export async function copyText(text, message = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = h('textarea', { class: 'sr-only', 'aria-hidden': 'true', tabindex: '-1' });
    area.value = text;
    document.body.append(area);
    area.select();
    try {
      document.execCommand('copy');
    } finally {
      area.remove();
    }
  }
  toast(message);
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/* ------------------------------------------------------------------ */
/* Resource loading                                                    */
/* ------------------------------------------------------------------ */

const scriptCache = new Map();

/**
 * Load a classic script once and resolve when it has executed.
 * @param {string} src
 */
export function loadScript(src) {
  if (!scriptCache.has(src)) {
    scriptCache.set(
      src,
      new Promise((resolve, reject) => {
        const script = h('script', { src });
        script.onload = () => resolve();
        script.onerror = () => {
          scriptCache.delete(src);
          reject(new Error(`Could not load ${src}. Check your connection and try again.`));
        };
        document.head.append(script);
      }),
    );
  }
  return scriptCache.get(src);
}

/** Collects cleanup callbacks (object URLs, listeners) for a tool instance. */
export function createCleanup() {
  const tasks = [];
  return {
    add(fn) {
      tasks.push(fn);
      return fn;
    },
    objectUrl(blob) {
      const url = URL.createObjectURL(blob);
      tasks.push(() => URL.revokeObjectURL(url));
      return url;
    },
    run() {
      while (tasks.length) tasks.pop()();
    },
  };
}

/* ------------------------------------------------------------------ */
/* Form building blocks                                                */
/* ------------------------------------------------------------------ */

/**
 * Wrap a control with a label and optional hint.
 * @param {string} label
 * @param {HTMLElement} control Must already have an id, or one is assigned.
 * @param {{hint?: string, inline?: boolean}} [options]
 */
export function field(label, control, { hint, inline = false } = {}) {
  const target = control.input ?? control;
  if (!target.id) target.id = uid('field');
  const hintId = hint ? `${target.id}-hint` : null;
  if (hintId) target.setAttribute('aria-describedby', hintId);
  return h(
    'div',
    { class: `field${inline ? ' field--inline' : ''}` },
    h('label', { for: target.id, class: 'label' }, label),
    control,
    hint ? h('p', { class: 'hint', id: hintId }, hint) : null,
  );
}

/** Text-like input. */
export function input(attrs = {}) {
  return h('input', { class: 'input', type: 'text', autocomplete: 'off', spellcheck: 'false', ...attrs });
}

/** Multi-line input. */
export function textarea(attrs = {}) {
  return h('textarea', { class: 'input textarea', autocomplete: 'off', spellcheck: 'false', rows: 6, ...attrs });
}

/**
 * Select control.
 * @param {(string | [string, string])[]} options Strings or [value, label] pairs.
 * @param {string} [value]
 */
export function select(options, value, attrs = {}) {
  const el = h(
    'select',
    { class: 'input select', ...attrs },
    options.map((option) => {
      const [val, label] = Array.isArray(option) ? option : [option, option];
      return h('option', { value: val }, label);
    }),
  );
  if (value !== undefined) el.value = value;
  return el;
}

/** Checkbox with a visible label. The underlying input is exposed as `.input`. */
export function checkbox(label, { checked = false, onChange, id = uid('check') } = {}) {
  const box = h('input', { type: 'checkbox', id, checked, class: 'check__box' });
  if (onChange) box.addEventListener('change', () => onChange(box.checked));
  const wrapper = h('label', { class: 'check', for: id }, box, h('span', {}, label));
  wrapper.input = box;
  return wrapper;
}

/** Range slider paired with a numeric readout. Exposed as `.input`. */
export function slider({
  min = 0,
  max = 100,
  step = 1,
  value = 50,
  format = (v) => String(v),
  onInput,
  id = uid('range'),
} = {}) {
  const range = h('input', { type: 'range', class: 'range', min, max, step, value, id });
  const readout = h('output', { class: 'range__value', for: id }, format(value));
  range.addEventListener('input', () => {
    readout.textContent = format(Number(range.value));
    onInput?.(Number(range.value));
  });
  const wrapper = h('div', { class: 'range-wrap' }, range, readout);
  wrapper.input = range;
  return wrapper;
}

/**
 * Button.
 * @param {string} label
 * @param {{variant?: 'primary'|'secondary'|'ghost', icon?: string, onClick?: (e: Event) => void, title?: string, disabled?: boolean, size?: 'sm'}} [options]
 */
export function button(label, { variant = 'secondary', icon: iconName, onClick, title, disabled = false, size } = {}) {
  const el = h(
    'button',
    { type: 'button', class: `btn btn--${variant}${size ? ` btn--${size}` : ''}`, title, disabled },
    iconName ? icon(iconName, { size: 18 }) : null,
    label ? h('span', {}, label) : null,
  );
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

/** Icon-only button. */
export function iconButton(iconName, label, onClick) {
  return h(
    'button',
    { type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onClick },
    icon(iconName, { size: 20 }),
  );
}

/**
 * A read-only output with a copy button.
 * @param {string} label
 * @param {{rows?: number, mono?: boolean, single?: boolean}} [options]
 * @returns {{el: HTMLElement, set: (value: string) => void, get: () => string}}
 */
export function outputField(label, { rows = 5, mono = true, single = false } = {}) {
  const id = uid('out');
  const control = single
    ? h('input', { class: `input${mono ? ' mono' : ''}`, id, readOnly: true, type: 'text' })
    : h('textarea', { class: `input textarea${mono ? ' mono' : ''}`, id, rows, readOnly: true, spellcheck: 'false' });
  const copy = button('Copy', {
    variant: 'ghost',
    size: 'sm',
    icon: 'copy',
    onClick: () => control.value && copyText(control.value),
  });
  const el = h(
    'div',
    { class: 'field' },
    h('div', { class: 'field__head' }, h('label', { class: 'label', for: id }, label), copy),
    control,
  );
  return {
    el,
    set(value) {
      control.value = value;
    },
    get: () => control.value,
  };
}

/** Show an inline status message ("error" or "ok") that screen readers announce. */
export function statusLine() {
  const el = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  return {
    el,
    error(message) {
      el.className = 'status status--error';
      el.textContent = message;
    },
    ok(message) {
      el.className = 'status status--ok';
      el.textContent = message;
    },
    clear() {
      el.className = 'status';
      el.textContent = '';
    },
  };
}

/**
 * Accessible tab set. Panels render lazily the first time they are shown.
 * @param {{id: string, label: string, render: (panel: HTMLElement) => void}[]} items
 * @param {{initial?: string, onChange?: (id: string) => void}} [options]
 */
export function tabs(items, { initial = items[0].id, onChange } = {}) {
  const listId = uid('tabs');
  const list = h('div', { class: 'tabs', role: 'tablist' });
  const panels = h('div', { class: 'tabpanels' });
  const buttons = new Map();
  const panelMap = new Map();
  const rendered = new Set();

  function activate(id, focus = false) {
    for (const [key, btn] of buttons) {
      const active = key === id;
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
      panelMap.get(key).hidden = !active;
    }
    if (!rendered.has(id)) {
      rendered.add(id);
      items.find((item) => item.id === id).render(panelMap.get(id));
    }
    if (focus) buttons.get(id).focus();
    onChange?.(id);
  }

  items.forEach((item, index) => {
    const btn = h(
      'button',
      {
        type: 'button',
        role: 'tab',
        class: 'tab',
        id: `${listId}-${item.id}-tab`,
        'aria-controls': `${listId}-${item.id}`,
        onClick: () => activate(item.id),
      },
      item.label,
    );
    btn.addEventListener('keydown', (event) => {
      const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (offset) {
        event.preventDefault();
        activate(items[(index + offset + items.length) % items.length].id, true);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        activate(items[event.key === 'Home' ? 0 : items.length - 1].id, true);
      }
    });
    buttons.set(item.id, btn);
    list.append(btn);
    const panel = h('div', {
      class: 'tabpanel',
      role: 'tabpanel',
      id: `${listId}-${item.id}`,
      'aria-labelledby': `${listId}-${item.id}-tab`,
      hidden: true,
    });
    panelMap.set(item.id, panel);
    panels.append(panel);
  });

  const root = h('div', { class: 'tabset' }, list, panels);
  activate(initial);
  return root;
}

/**
 * File picker with drag and drop.
 * @param {{accept?: string, multiple?: boolean, title?: string, hint?: string, onFiles: (files: File[]) => void}} options
 */
export function dropzone({ accept = '', multiple = false, title = 'Drop files here or browse', hint = '', onFiles }) {
  const id = uid('drop');
  const fileInput = h('input', { type: 'file', id, class: 'dropzone__input', accept, multiple });
  const zone = h(
    'label',
    { class: 'dropzone', for: id },
    icon('upload', { size: 28 }),
    h('span', { class: 'dropzone__title' }, title),
    hint ? h('span', { class: 'dropzone__hint' }, hint) : null,
    h('span', { class: 'dropzone__note' }, 'Files stay on your device.'),
    fileInput,
  );
  const accepts = (file) => {
    if (!accept) return true;
    return accept.split(',').some((rule) => {
      const token = rule.trim().toLowerCase();
      if (token.startsWith('.')) return file.name.toLowerCase().endsWith(token);
      if (token.endsWith('/*')) return file.type.startsWith(token.slice(0, -1));
      return file.type === token;
    });
  };
  const deliver = (list) => {
    const files = [...list].filter(accepts);
    if (files.length < list.length)
      toast('Some files were skipped because their type is not supported.', { type: 'error' });
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  fileInput.addEventListener('change', () => {
    deliver(fileInput.files);
    fileInput.value = '';
  });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-over');
    if (event.dataTransfer?.files.length) deliver(event.dataTransfer.files);
  });
  return zone;
}

/**
 * A list of files with size and a remove button.
 * @param {{onRemove: (index: number) => void, onMove?: (index: number, delta: number) => void}} options
 */
export function fileList({ onRemove, onMove }) {
  const list = h('ul', { class: 'files' });
  return {
    el: list,
    render(files, details = () => '') {
      clear(list);
      files.forEach((file, index) => {
        list.append(
          h(
            'li',
            { class: 'files__item' },
            icon('file', { size: 18 }),
            h('span', { class: 'files__name' }, file.name),
            h(
              'span',
              { class: 'files__meta' },
              [formatBytes(file.size), details(file, index)].filter(Boolean).join(' · '),
            ),
            onMove
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'icon-btn icon-btn--sm',
                    'aria-label': `Move ${file.name} up`,
                    disabled: index === 0,
                    onClick: () => onMove(index, -1),
                  },
                  icon('arrowUp', { size: 16 }),
                )
              : null,
            onMove
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'icon-btn icon-btn--sm',
                    'aria-label': `Move ${file.name} down`,
                    disabled: index === files.length - 1,
                    onClick: () => onMove(index, 1),
                  },
                  icon('arrowDown', { size: 16 }),
                )
              : null,
            h(
              'button',
              {
                type: 'button',
                class: 'icon-btn icon-btn--sm',
                'aria-label': `Remove ${file.name}`,
                onClick: () => onRemove(index),
              },
              icon('x', { size: 16 }),
            ),
          ),
        );
      });
    },
  };
}

/** Lay out controls in a responsive grid. */
export const row = (...children) => h('div', { class: 'row' }, ...children);

/** Vertical stack. */
export const stack = (...children) => h('div', { class: 'stack' }, ...children);

/** A bordered section. */
export const panel = (title, ...children) =>
  h('section', { class: 'panel' }, title ? h('h2', { class: 'panel__title' }, title) : null, ...children);
