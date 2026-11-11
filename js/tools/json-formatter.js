import { formatJson } from '../lib/json.js';
import { button, checkbox, debounce, field, h, outputField, select, statusLine, textarea } from '../ui.js';

export function mount(root) {
  const source = textarea({
    rows: 12,
    placeholder: '{"paste": "your JSON here"}',
    'aria-label': 'JSON input',
    class: 'input textarea mono',
  });
  const indent = select(
    [
      ['2', '2 spaces'],
      ['4', '4 spaces'],
      ['tab', 'Tabs'],
      ['0', 'Minified'],
    ],
    '2',
  );
  const sortKeys = checkbox('Sort keys alphabetically', {});
  const out = outputField('Result', { rows: 12 });
  const status = statusLine();

  function update() {
    if (!source.value.trim()) {
      out.set('');
      status.clear();
      return;
    }
    const result = formatJson(source.value, {
      indent: indent.value === 'tab' ? 'tab' : Number(indent.value),
      sortKeys: sortKeys.input.checked,
    });
    if (result.ok) {
      out.set(result.output);
      status.ok('Valid JSON.');
    } else {
      out.set('');
      const where = result.error.line ? ` (line ${result.error.line}, column ${result.error.column})` : '';
      status.error(`Invalid JSON${where}: ${result.error.message}`);
    }
  }

  const run = debounce(update, 150);
  source.addEventListener('input', run);
  indent.addEventListener('change', update);
  sortKeys.input.addEventListener('change', update);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('JSON', source),
        h('div', { class: 'row' }, field('Indentation', indent), h('div', { class: 'field field--check' }, sortKeys)),
      ),
      status.el,
      h(
        'section',
        { class: 'panel' },
        out.el,
        h(
          'div',
          { class: 'btn-row' },
          button('Use result as input', {
            icon: 'refresh',
            onClick: () => {
              if (out.get()) {
                source.value = out.get();
                update();
              }
            },
          }),
        ),
      ),
    ),
  );
  return () => run.cancel();
}
