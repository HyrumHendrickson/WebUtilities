import { CASE_MODES, convertCase, slugify } from '../lib/text.js';
import { field, h, outputField, textarea } from '../ui.js';

const MODES = [...CASE_MODES, ['slug', 'url-slug']];

export function mount(root) {
  let mode = 'title';
  const input = textarea({ rows: 6, placeholder: 'Type or paste text to convert', 'aria-label': 'Text to convert' });
  const out = outputField('Result', { rows: 6, mono: false });
  const group = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Case style' });

  const buttons = MODES.map(([key, label]) => {
    const el = h(
      'button',
      {
        type: 'button',
        class: 'segmented__btn',
        'aria-pressed': String(key === mode),
        onClick: () => {
          mode = key;
          update();
        },
      },
      label,
    );
    el.dataset.mode = key;
    group.append(el);
    return el;
  });

  function update() {
    for (const el of buttons) el.setAttribute('aria-pressed', String(el.dataset.mode === mode));
    out.set(mode === 'slug' ? slugify(input.value) : convertCase(input.value, mode));
  }

  input.addEventListener('input', update);
  root.append(
    h(
      'div',
      { class: 'stack' },
      h('section', { class: 'panel' }, field('Text', input), group),
      h('section', { class: 'panel' }, out.el),
    ),
  );
  update();
}
