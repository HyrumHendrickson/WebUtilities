import { uuidV4, uuidV7 } from '../lib/uuid.js';
import { button, checkbox, field, h, input, outputField, select } from '../ui.js';

export function mount(root) {
  const version = select(
    [
      ['v4', 'Version 4 (random)'],
      ['v7', 'Version 7 (time-ordered)'],
    ],
    'v4',
  );
  const count = input({ type: 'number', min: 1, max: 500, value: 5, inputmode: 'numeric' });
  const uppercase = checkbox('Uppercase', {});
  const hyphens = checkbox('Include hyphens', { checked: true });
  const out = outputField('UUIDs', { rows: 8 });

  function generate() {
    const total = Math.min(500, Math.max(1, Math.floor(Number(count.value)) || 1));
    const make = version.value === 'v7' ? () => uuidV7() : () => uuidV4();
    const values = Array.from({ length: total }, () => {
      let value = make();
      if (!hyphens.input.checked) value = value.replace(/-/g, '');
      return uppercase.input.checked ? value.toUpperCase() : value;
    });
    out.set(values.join('\n'));
  }

  for (const control of [version, uppercase.input, hyphens.input]) control.addEventListener('change', generate);
  count.addEventListener('input', generate);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        h(
          'div',
          { class: 'row' },
          field('Version', version, { hint: 'Version 7 values sort by creation time, which suits database keys.' }),
          field('How many (1 to 500)', count),
        ),
        h('div', { class: 'checks checks--row' }, uppercase, hyphens),
        h(
          'div',
          { class: 'btn-row' },
          button('Generate new', { variant: 'primary', icon: 'refresh', onClick: generate }),
        ),
      ),
      h('section', { class: 'panel' }, out.el),
    ),
  );
  generate();
}
