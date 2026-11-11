import { diffLines } from '../lib/text.js';
import { clear, debounce, field, h, statusLine, textarea } from '../ui.js';

const MARKERS = { add: '+', remove: '−', equal: ' ' };
const LABELS = { add: 'Added', remove: 'Removed', equal: 'Unchanged' };

export function mount(root) {
  const before = textarea({ rows: 10, placeholder: 'Original text', 'aria-label': 'Original text' });
  const after = textarea({ rows: 10, placeholder: 'Changed text', 'aria-label': 'Changed text' });
  const output = h('div', { class: 'diff', role: 'region', 'aria-label': 'Differences' });
  const summary = h('p', { class: 'hint' });
  const status = statusLine();
  const panel = h(
    'section',
    { class: 'panel', hidden: true },
    h('h2', { class: 'panel__title' }, 'Differences'),
    summary,
    output,
  );

  function update() {
    status.clear();
    if (before.value === '' && after.value === '') {
      panel.hidden = true;
      return;
    }
    try {
      const changes = diffLines(before.value, after.value);
      const added = changes.filter((c) => c.type === 'add').length;
      const removed = changes.filter((c) => c.type === 'remove').length;
      summary.textContent =
        added || removed
          ? `${added} line${added === 1 ? '' : 's'} added, ${removed} removed.`
          : 'The texts are identical.';
      clear(output).append(
        ...changes.map(({ type, value }) =>
          h(
            'div',
            { class: `diff__line diff__line--${type}` },
            h('span', { class: 'diff__marker', 'aria-label': LABELS[type] }, MARKERS[type]),
            h('span', { class: 'diff__text' }, value || '\u00a0'),
          ),
        ),
      );
      panel.hidden = false;
    } catch (error) {
      panel.hidden = true;
      status.error(error.message);
    }
  }

  const run = debounce(update, 150);
  before.addEventListener('input', run);
  after.addEventListener('input', run);
  root.append(
    h(
      'div',
      { class: 'stack' },
      h('div', { class: 'row row--2' }, field('Original', before), field('Changed', after)),
      status.el,
      panel,
    ),
  );
  return () => run.cancel();
}
