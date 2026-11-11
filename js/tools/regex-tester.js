import { checkbox, clear, debounce, field, h, input, statusLine, textarea } from '../ui.js';

const FLAGS = [
  ['g', 'Global (g)'],
  ['i', 'Ignore case (i)'],
  ['m', 'Multiline (m)'],
  ['s', 'Dot matches newline (s)'],
  ['u', 'Unicode (u)'],
];

export function mount(root) {
  const pattern = input({
    placeholder: '(\\w+)@(\\w+)\\.com',
    'aria-label': 'Regular expression',
    class: 'input mono',
  });
  const subject = textarea({ rows: 8, placeholder: 'Text to search', 'aria-label': 'Test text' });
  const flagBoxes = FLAGS.map(([flag, label]) => [flag, checkbox(label, { checked: flag === 'g' })]);
  const status = statusLine();
  const highlighted = h('pre', { class: 'highlight', 'aria-label': 'Text with matches highlighted' });
  const list = h('ol', { class: 'matches' });
  const results = h(
    'section',
    { class: 'panel', hidden: true },
    h('h2', { class: 'panel__title' }, 'Matches'),
    highlighted,
    list,
  );

  const TIMEOUT_MS = 1500;
  let worker = null;
  let requestId = 0;
  let pending = null;
  const SUPERSEDED = Symbol('superseded');

  /** Evaluate in a worker; terminate it if it exceeds the time limit. */
  function evaluate(pattern, flags, text) {
    worker ??= new Worker(new URL('../workers/regex-worker.js', import.meta.url), { type: 'module' });
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(SUPERSEDED);
    }
    const id = ++requestId;
    const active = worker;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending = null;
        active.terminate();
        if (worker === active) worker = null;
        reject(
          new Error(
            'This pattern took too long and was stopped. It may backtrack catastrophically, for example nested quantifiers such as (a+)+.',
          ),
        );
      }, TIMEOUT_MS);
      pending = { timer, reject };
      active.onmessage = ({ data }) => {
        if (data.id !== id) return;
        clearTimeout(timer);
        pending = null;
        if (data.ok) resolve(data.result);
        else reject(new SyntaxError(data.message));
      };
      active.onerror = () => {
        clearTimeout(timer);
        pending = null;
        reject(new Error('The regex engine failed to start.'));
      };
      active.postMessage({ id, pattern, flags, text });
    });
  }

  async function update() {
    const flags = flagBoxes
      .filter(([, box]) => box.input.checked)
      .map(([flag]) => flag)
      .join('');
    if (!pattern.value) {
      results.hidden = true;
      status.clear();
      return;
    }
    try {
      const { matches, truncated } = await evaluate(pattern.value, flags, subject.value);
      status.ok(`${matches.length}${truncated ? '+' : ''} match${matches.length === 1 ? '' : 'es'}.`);

      const parts = [];
      let cursor = 0;
      for (const match of matches) {
        if (match.text === '') continue;
        parts.push(subject.value.slice(cursor, match.index), h('mark', {}, match.text));
        cursor = match.index + match.text.length;
      }
      parts.push(subject.value.slice(cursor));
      clear(highlighted).append(...parts);

      clear(list).append(
        ...matches.slice(0, 200).map((match) =>
          h(
            'li',
            { class: 'matches__item' },
            h('code', {}, match.text === '' ? '(empty match)' : match.text),
            h('span', { class: 'matches__meta' }, `at ${match.index}`),
            match.groups.length
              ? h(
                  'ul',
                  { class: 'matches__groups' },
                  match.groups.map((group, i) =>
                    h(
                      'li',
                      {},
                      h('span', { class: 'matches__label' }, `Group ${i + 1}`),
                      h('code', {}, group === undefined ? '(unmatched)' : group),
                    ),
                  ),
                )
              : null,
            match.named
              ? h(
                  'ul',
                  { class: 'matches__groups' },
                  Object.entries(match.named).map(([name, value]) =>
                    h('li', {}, h('span', { class: 'matches__label' }, name), h('code', {}, value ?? '(unmatched)')),
                  ),
                )
              : null,
          ),
        ),
      );
      results.hidden = false;
    } catch (error) {
      if (error === SUPERSEDED) return;
      results.hidden = true;
      status.error(error.message);
    }
  }

  const run = debounce(update, 150);
  pattern.addEventListener('input', run);
  subject.addEventListener('input', run);
  for (const [, box] of flagBoxes) box.input.addEventListener('change', update);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('Pattern', pattern, {
          hint: 'Uses JavaScript regular expression syntax. Evaluation stops after 1.5 seconds.',
        }),
        h(
          'div',
          { class: 'checks checks--row' },
          flagBoxes.map(([, box]) => box),
        ),
        field('Test text', subject),
      ),
      status.el,
      results,
    ),
  );
  return () => {
    run.cancel();
    clearTimeout(pending?.timer);
    worker?.terminate();
  };
}
