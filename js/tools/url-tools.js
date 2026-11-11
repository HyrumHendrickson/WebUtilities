import { escapeHtml, parseUrl, percentDecode, percentEncode, unescapeHtml } from '../lib/encoding.js';
import {
  button,
  checkbox,
  clear,
  copyText,
  field,
  h,
  input,
  outputField,
  select,
  statusLine,
  tabs,
  textarea,
} from '../ui.js';

function encodeTab(panel) {
  const source = textarea({ rows: 5, placeholder: 'Text or a percent-encoded string', 'aria-label': 'Input' });
  const mode = select(
    [
      ['component', 'Everything (query values, path segments)'],
      ['full', 'Whole URL (keep : / ? & =)'],
    ],
    'component',
  );
  const plus = checkbox('Treat + as a space when decoding', {});
  const out = outputField('Result', { rows: 5 });
  const status = statusLine();
  const run = (fn) => () => {
    try {
      out.set(fn());
      status.clear();
    } catch (error) {
      out.set('');
      status.error(error.message);
    }
  };
  panel.append(
    h(
      'div',
      { class: 'stack' },
      field('Input', source),
      field('Encode', mode),
      h('div', { class: 'checks checks--row' }, plus),
      h(
        'div',
        { class: 'btn-row' },
        button('Encode', { variant: 'primary', onClick: run(() => percentEncode(source.value, mode.value)) }),
        button('Decode', { onClick: run(() => percentDecode(source.value, { plusAsSpace: plus.input.checked })) }),
      ),
      status.el,
      out.el,
    ),
  );
}

function parseTab(panel) {
  const source = input({ placeholder: 'https://example.com/path?name=value#section', 'aria-label': 'URL to parse' });
  const table = h('div', { class: 'kv' });
  const params = h('div', { class: 'kv' });
  const paramsPanel = h(
    'section',
    { class: 'panel panel--flat', hidden: true },
    h('h3', { class: 'panel__subtitle' }, 'Query parameters'),
    params,
  );
  const status = statusLine();

  const rows = (container, entries) => {
    clear(container).append(
      ...entries.map(([key, value]) =>
        h(
          'div',
          { class: 'kv__row' },
          h('span', { class: 'kv__key' }, key),
          h('code', { class: 'kv__value' }, value === '' ? '(empty)' : value),
          h(
            'button',
            {
              type: 'button',
              class: 'btn btn--ghost btn--sm',
              'aria-label': `Copy ${key}`,
              onClick: () => copyText(value),
            },
            'Copy',
          ),
        ),
      ),
    );
  };

  function update() {
    if (!source.value.trim()) {
      clear(table);
      paramsPanel.hidden = true;
      status.clear();
      return;
    }
    try {
      const url = parseUrl(source.value);
      status.clear();
      rows(
        table,
        [
          ['Protocol', url.protocol],
          ['Host', url.host],
          ['Hostname', url.hostname],
          ['Port', url.port || '(default)'],
          ['Path', url.pathname],
          ['Query', url.search],
          ['Fragment', url.hash],
          ['Origin', url.origin],
          ['Username', url.username],
          ['Password', url.password],
        ].filter(([, value]) => value !== ''),
      );
      paramsPanel.hidden = url.params.length === 0;
      rows(params, url.params);
    } catch (error) {
      clear(table);
      paramsPanel.hidden = true;
      status.error(error.message);
    }
  }
  source.addEventListener('input', update);
  panel.append(h('div', { class: 'stack' }, field('URL', source), status.el, table, paramsPanel));
}

function entitiesTab(panel) {
  const source = textarea({ rows: 5, placeholder: 'Text or HTML', 'aria-label': 'Input' });
  const out = outputField('Result', { rows: 5 });
  panel.append(
    h(
      'div',
      { class: 'stack' },
      field('Input', source),
      h(
        'div',
        { class: 'btn-row' },
        button('Escape', { variant: 'primary', onClick: () => out.set(escapeHtml(source.value)) }),
        button('Unescape', { onClick: () => out.set(unescapeHtml(source.value)) }),
      ),
      out.el,
    ),
  );
}

export function mount(root) {
  root.append(
    tabs([
      { id: 'encode', label: 'Percent-encoding', render: encodeTab },
      { id: 'parse', label: 'Parse a URL', render: parseTab },
      { id: 'html', label: 'HTML entities', render: entitiesTab },
    ]),
  );
}
