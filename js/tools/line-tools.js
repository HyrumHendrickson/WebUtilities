import { LINE_OPERATIONS, applyLineOperation } from '../lib/text.js';
import { button, checkbox, field, h, outputField, select, textarea } from '../ui.js';

export function mount(root) {
  const input = textarea({ rows: 10, placeholder: 'One item per line', 'aria-label': 'Lines to process' });
  const operation = select(LINE_OPERATIONS, 'sort-asc');
  const ignoreCase = checkbox('Ignore letter case', {});
  const out = outputField('Result', { rows: 10, mono: false });
  const summary = h('p', { class: 'hint' });

  const lineCount = (text) => (text === '' ? 0 : text.split(/\r?\n/).length);

  function update() {
    const result =
      input.value === ''
        ? ''
        : applyLineOperation(input.value, operation.value, { ignoreCase: ignoreCase.input.checked });
    out.set(result);
    summary.textContent = `${lineCount(input.value)} lines in, ${lineCount(result)} lines out.`;
  }

  for (const control of [input, operation, ignoreCase.input])
    control.addEventListener(control === input ? 'input' : 'change', update);
  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('Lines', input),
        h(
          'div',
          { class: 'row' },
          field('Operation', operation),
          h('div', { class: 'field field--check' }, ignoreCase),
        ),
      ),
      h(
        'section',
        { class: 'panel' },
        out.el,
        summary,
        h(
          'div',
          { class: 'btn-row' },
          button('Use result as input', {
            icon: 'refresh',
            onClick: () => {
              input.value = out.get();
              update();
            },
          }),
        ),
      ),
    ),
  );
  update();
}
