import { generateLorem } from '../lib/text.js';
import { button, checkbox, field, h, input, outputField, select } from '../ui.js';

export function mount(root) {
  const unit = select(
    [
      ['paragraphs', 'Paragraphs'],
      ['sentences', 'Sentences'],
      ['words', 'Words'],
    ],
    'paragraphs',
  );
  const count = input({ type: 'number', min: 1, max: 1000, value: 3, inputmode: 'numeric' });
  const classic = checkbox('Start with “Lorem ipsum dolor sit amet”', { checked: true });
  const out = outputField('Placeholder text', { rows: 12, mono: false });

  function generate() {
    const limit = unit.value === 'words' ? 1000 : unit.value === 'sentences' ? 200 : 50;
    const total = Math.min(limit, Math.max(1, Math.floor(Number(count.value)) || 1));
    out.set(generateLorem({ unit: unit.value, count: total, classicStart: classic.input.checked }));
  }

  unit.addEventListener('change', generate);
  count.addEventListener('input', generate);
  classic.input.addEventListener('change', generate);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        h('div', { class: 'row' }, field('Amount', count), field('Unit', unit)),
        h('div', { class: 'checks checks--row' }, classic),
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
