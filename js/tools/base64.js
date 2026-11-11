import { base64ToBytes, base64ToText, bytesToBase64, textToBase64 } from '../lib/encoding.js';
import {
  button,
  checkbox,
  downloadBlob,
  dropzone,
  field,
  h,
  input,
  outputField,
  statusLine,
  tabs,
  textarea,
} from '../ui.js';

function textTab(panel) {
  const source = textarea({ rows: 6, placeholder: 'Text or Base64', 'aria-label': 'Input' });
  const urlSafe = checkbox('URL-safe alphabet (- and _)', {});
  const padding = checkbox('Include = padding', { checked: true });
  const out = outputField('Result', { rows: 6 });
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
      h('div', { class: 'checks checks--row' }, urlSafe, padding),
      h(
        'div',
        { class: 'btn-row' },
        button('Encode', {
          variant: 'primary',
          onClick: run(() =>
            textToBase64(source.value, { urlSafe: urlSafe.input.checked, padding: padding.input.checked }),
          ),
        }),
        button('Decode', { onClick: run(() => base64ToText(source.value)) }),
      ),
      status.el,
      out.el,
    ),
  );
}

function fileTab(panel) {
  const out = outputField('Base64', { rows: 8 });
  const dataUri = checkbox('Add a data: URI prefix', {});
  const status = statusLine();
  let encoded = null;

  function show() {
    if (!encoded) return;
    out.set(
      dataUri.input.checked
        ? `data:${encoded.type || 'application/octet-stream'};base64,${encoded.base64}`
        : encoded.base64,
    );
  }

  const decodeSource = textarea({
    rows: 4,
    placeholder: 'Paste Base64 or a data: URI',
    'aria-label': 'Base64 to save as a file',
  });
  const filename = input({ value: 'decoded-file', 'aria-label': 'File name' });
  const decodeStatus = statusLine();

  function saveDecoded() {
    try {
      const raw = decodeSource.value.trim();
      const match = raw.match(/^data:([^;,]*)(?:;[^,]*)?,/i);
      const bytes = base64ToBytes(match ? raw.slice(match[0].length) : raw);
      downloadBlob(
        new Blob([bytes], { type: match?.[1] || 'application/octet-stream' }),
        filename.value.trim() || 'decoded-file',
      );
      decodeStatus.ok(`Saved ${bytes.length.toLocaleString()} bytes.`);
    } catch (error) {
      decodeStatus.error(error.message);
    }
  }

  panel.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel panel--flat' },
        h('h3', { class: 'panel__subtitle' }, 'Encode a file'),
        dropzone({
          title: 'Drop a file here, or browse',
          hint: 'Large files produce very long output.',
          onFiles: async ([file]) => {
            try {
              encoded = { base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())), type: file.type };
              status.ok(`${file.name}: ${file.size.toLocaleString()} bytes.`);
              show();
            } catch (error) {
              status.error(error.message);
            }
          },
        }),
        h('div', { class: 'checks checks--row' }, dataUri),
        status.el,
        out.el,
      ),
      h(
        'section',
        { class: 'panel panel--flat' },
        h('h3', { class: 'panel__subtitle' }, 'Decode to a file'),
        field('Base64', decodeSource),
        field('Save as', filename),
        h(
          'div',
          { class: 'btn-row' },
          button('Decode and save', { variant: 'primary', icon: 'download', onClick: saveDecoded }),
        ),
        decodeStatus.el,
      ),
    ),
  );
  dataUri.input.addEventListener('change', show);
}

export function mount(root) {
  root.append(
    tabs([
      { id: 'text', label: 'Text', render: textTab },
      { id: 'file', label: 'Files', render: fileTab },
    ]),
  );
}
