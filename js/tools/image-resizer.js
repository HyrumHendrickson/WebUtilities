import { formatBytes, stripExtension, uniqueName } from '../lib/format.js';
import { OUTPUT_FORMATS, decodeImage, detectEncoders, drawToCanvas, encodeCanvas } from '../media.js';
import { createResults } from '../results.js';
import { button, checkbox, dropzone, field, fileList, h, input, select, slider, statusLine } from '../ui.js';

const SAME_FORMAT = { 'image/jpeg': 'jpeg', 'image/webp': 'webp', 'image/png': 'png' };

export async function mount(root) {
  /** @type {File[]} */
  const files = [];
  let busy = false;

  const results = createResults({ zipName: 'resized-images.zip' });
  const status = statusLine();

  const mode = select(
    [
      ['fit', 'Fit within a maximum size'],
      ['percent', 'Scale by percentage'],
    ],
    'fit',
  );
  const maxWidth = input({ type: 'number', min: 1, max: 20000, value: 1600, inputmode: 'numeric' });
  const maxHeight = input({ type: 'number', min: 1, max: 20000, placeholder: 'No limit', inputmode: 'numeric' });
  const percent = slider({ min: 5, max: 200, step: 5, value: 50, format: (v) => `${v}%` });
  const noEnlarge = checkbox('Never enlarge images', { checked: true });
  const support = await detectEncoders();
  const format = select(
    [
      ['same', 'Same as original (PNG for other types)'],
      ['jpeg', 'JPEG'],
      ...(support.webp ? [['webp', 'WebP']] : []),
      ['png', 'PNG'],
    ],
    'same',
  );
  const quality = slider({ min: 10, max: 100, step: 1, value: 82, format: (v) => `${v}%` });

  const fitFields = h(
    'div',
    { class: 'row' },
    field('Maximum width (px)', maxWidth),
    field('Maximum height (px)', maxHeight),
  );
  const percentField = field('Scale', percent);
  const qualityField = field('Quality', quality, {
    hint: 'Applies to JPEG and WebP. Around 80% is usually indistinguishable from the original.',
  });

  const list = fileList({
    onRemove: (index) => {
      files.splice(index, 1);
      refresh();
    },
  });
  const runButton = button('Resize', { variant: 'primary', icon: 'resize', disabled: true, onClick: () => run() });

  function refresh() {
    const isFit = mode.value === 'fit';
    fitFields.hidden = !isFit;
    noEnlarge.hidden = !isFit;
    percentField.hidden = isFit;
    qualityField.hidden = format.value === 'png';
    list.render(files);
    list.el.hidden = files.length === 0;
    runButton.disabled = busy || files.length === 0;
    runButton.lastChild.textContent = files.length > 1 ? `Resize ${files.length} images` : 'Resize';
  }

  function targetSize(width, height) {
    if (mode.value === 'percent') {
      const scale = Number(percent.input.value) / 100;
      return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
    }
    const limitW = Number(maxWidth.value) || Infinity;
    const limitH = Number(maxHeight.value) || Infinity;
    let scale = Math.min(limitW / width, limitH / height);
    if (noEnlarge.input.checked) scale = Math.min(scale, 1);
    if (!Number.isFinite(scale)) scale = 1;
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
  }

  async function run() {
    if (busy || !files.length) return;
    if (mode.value === 'fit' && !Number(maxWidth.value) && !Number(maxHeight.value)) {
      status.error('Enter a maximum width, a maximum height, or both.');
      return;
    }
    busy = true;
    results.clear();
    refresh();
    const taken = new Set();
    const failures = [];

    for (const [index, file] of files.entries()) {
      status.ok(`Resizing ${file.name} (${index + 1} of ${files.length})…`);
      try {
        const image = await decodeImage(file);
        const [width, height] = targetSize(image.width, image.height);
        const canvas = drawToCanvas(image, width, height);
        image.close();
        const original = SAME_FORMAT[file.type] ?? 'png';
        const key = format.value === 'same' ? (original === 'webp' && !support.webp ? 'png' : original) : format.value;
        const blob = await encodeCanvas(canvas, key, { quality: Number(quality.input.value) / 100 });
        const change = Math.round((1 - blob.size / file.size) * 100);
        const delta = change >= 0 ? `${change}% smaller` : `${Math.abs(change)}% larger`;
        results.add({
          blob,
          name: uniqueName(`${stripExtension(file.name)}-${width}x${height}.${OUTPUT_FORMATS[key].ext}`, taken),
          meta: `${canvas.width} × ${canvas.height} · was ${formatBytes(file.size)} (${delta})`,
        });
        canvas.width = 0;
      } catch (error) {
        failures.push(error.message);
      }
    }
    if (failures.length) status.error([...new Set(failures)].join(' '));
    else status.ok('Done.');
    busy = false;
    refresh();
  }

  const zone = dropzone({
    accept: 'image/*,.svg',
    multiple: true,
    title: 'Drop images here, or browse',
    hint: 'PNG, JPEG, WebP, AVIF, GIF, BMP, and SVG',
    onFiles: (added) => {
      files.push(...added);
      results.clear();
      status.clear();
      refresh();
    },
  });

  for (const control of [mode, format]) control.addEventListener('change', refresh);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h('section', { class: 'panel' }, zone, list.el),
      h(
        'section',
        { class: 'panel' },
        h('h2', { class: 'panel__title' }, 'Size'),
        field('Resize method', mode),
        fitFields,
        h('div', { class: 'field field--check' }, noEnlarge),
        percentField,
        h('div', { class: 'row' }, field('Output format', format), qualityField),
        h('div', { class: 'btn-row' }, runButton),
      ),
      status.el,
      results.el,
    ),
  );
  refresh();
  return () => results.destroy();
}
