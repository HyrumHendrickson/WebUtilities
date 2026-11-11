import { HASH_ALGORITHMS, digestHex } from '../lib/hash.js';
import { clear, copyText, debounce, dropzone, field, h, input, statusLine, tabs, textarea } from '../ui.js';

function hashView() {
  const list = h('div', { class: 'kv' });
  const expected = input({ placeholder: 'Paste a hash to compare', 'aria-label': 'Expected hash' });
  const verdict = statusLine();
  let hashes = [];

  function compare() {
    const wanted = expected.value.trim().toLowerCase().replace(/\s+/g, '');
    if (!wanted || hashes.length === 0) return verdict.clear();
    const match = hashes.find(([, value]) => value === wanted);
    if (match) verdict.ok(`Matches the ${match[0]} hash.`);
    else verdict.error('Does not match any of the hashes above.');
  }

  expected.addEventListener('input', compare);

  return {
    el: h('div', { class: 'stack' }, list, field('Compare with an expected hash', expected), verdict.el),
    async update(bytes) {
      hashes = await Promise.all(HASH_ALGORITHMS.map(async (name) => [name, await digestHex(name, bytes)]));
      clear(list).append(
        ...hashes.map(([name, value]) =>
          h(
            'div',
            { class: 'kv__row kv__row--wide' },
            h('span', { class: 'kv__key' }, name),
            h('code', { class: 'kv__value kv__value--break' }, value),
            h(
              'button',
              {
                type: 'button',
                class: 'btn btn--ghost btn--sm',
                'aria-label': `Copy ${name}`,
                onClick: () => copyText(value),
              },
              'Copy',
            ),
          ),
        ),
      );
      compare();
    },
  };
}

function textTab(panel) {
  const view = hashView();
  const source = textarea({ rows: 5, placeholder: 'Type or paste text', 'aria-label': 'Text to hash' });
  const run = debounce(() => view.update(new TextEncoder().encode(source.value)), 100);
  source.addEventListener('input', run);
  panel.append(
    h(
      'div',
      { class: 'stack' },
      field('Text', source, { hint: 'Hashes are of the UTF-8 bytes of the text.' }),
      view.el,
    ),
  );
  view.update(new Uint8Array());
}

function fileTab(panel) {
  const view = hashView();
  const status = statusLine();
  panel.append(
    h(
      'div',
      { class: 'stack' },
      dropzone({
        title: 'Drop a file here, or browse',
        hint: 'Verify a download by comparing its hash with the publisher’s.',
        onFiles: async ([file]) => {
          try {
            status.ok(`Hashing ${file.name}…`);
            await view.update(new Uint8Array(await file.arrayBuffer()));
            status.ok(`${file.name} · ${file.size.toLocaleString()} bytes`);
          } catch (error) {
            status.error(error.message);
          }
        },
      }),
      status.el,
      view.el,
    ),
  );
}

export function mount(root) {
  root.append(
    tabs([
      { id: 'text', label: 'Text', render: textTab },
      { id: 'file', label: 'File', render: fileTab },
    ]),
    h(
      'p',
      { class: 'hint hint--spaced' },
      'MD5 is not offered because browsers do not include it and it is no longer considered secure for integrity checks.',
    ),
  );
}
