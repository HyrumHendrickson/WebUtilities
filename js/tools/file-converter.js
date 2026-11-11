import { stripExtension, uniqueName } from '../lib/format.js';
import {
  OUTPUT_FORMATS,
  ICO_SIZE_OPTIONS,
  PAGE_SIZES,
  availableOutputFormats,
  createPdfBuilder,
  decodeImage,
  drawToCanvas,
  encodeCanvas,
  isPdf,
  renderPdfPages,
} from '../media.js';
import { createResults } from '../results.js';
import { button, checkbox, dropzone, field, fileList, h, select, slider, statusLine } from '../ui.js';

const ACCEPT = 'image/*,.pdf,application/pdf,.avif,.bmp,.ico,.svg';

/** Yield one canvas per image, or one per PDF page. */
async function* sources(file, dpi) {
  if (isPdf(file)) {
    yield* renderPdfPages(file, { dpi });
    return;
  }
  const image = await decodeImage(file);
  try {
    yield { canvas: drawToCanvas(image), pageNumber: 1, total: 1 };
  } finally {
    image.close();
  }
}

export async function mount(root) {
  /** @type {File[]} */
  let files = [];
  let busy = false;

  const results = createResults({ zipName: 'converted-files.zip' });
  const status = statusLine();

  const format = select(await availableOutputFormats(), 'png');
  const quality = slider({ min: 10, max: 100, step: 1, value: 90, format: (v) => `${v}%` });
  const background = h('input', {
    type: 'color',
    class: 'color-input',
    value: '#ffffff',
    'aria-label': 'Background color',
  });
  const dpi = select(
    [
      ['96', '96 DPI (screen)'],
      ['150', '150 DPI (balanced)'],
      ['200', '200 DPI'],
      ['300', '300 DPI (print)'],
    ],
    '150',
  );
  const icoSizes = select(ICO_SIZE_OPTIONS, 'standard');
  const pageSize = select(
    Object.entries(PAGE_SIZES).map(([key, spec]) => [key, spec.label]),
    'fit',
  );
  const combine = checkbox('Combine everything into one PDF', { checked: true });
  const lossless = checkbox('Keep images lossless (larger file)', {});

  const qualityField = field('Quality', quality);
  const backgroundField = field('Background for transparent areas', background, {
    hint: 'Used where the format cannot store transparency.',
  });
  const dpiField = field('PDF page resolution', dpi, { hint: 'Higher values give sharper pages and larger files.' });
  const icoField = field('Icon sizes', icoSizes);
  const pageField = field('PDF page size', pageSize);
  const pdfOptions = h(
    'div',
    { class: 'stack stack--tight' },
    pageField,
    h('div', { class: 'field field--check' }, combine),
    h('div', { class: 'field field--check' }, lossless),
  );
  const note = h('p', { class: 'hint' });

  const list = fileList({
    onRemove: (index) => {
      files.splice(index, 1);
      refresh();
    },
  });

  const convertButton = button('Convert', {
    variant: 'primary',
    icon: 'convert',
    disabled: true,
    onClick: () => convert(),
  });
  const clearButton = button('Clear', {
    variant: 'ghost',
    icon: 'trash',
    onClick: () => {
      files = [];
      results.clear();
      status.clear();
      refresh();
    },
  });

  function refresh() {
    const key = format.value;
    const spec = OUTPUT_FORMATS[key];
    const hasPdfInput = files.some(isPdf);
    qualityField.hidden = !(spec.lossy || key === 'pdf');
    backgroundField.hidden = !spec.opaque;
    dpiField.hidden = !hasPdfInput;
    icoField.hidden = key !== 'ico';
    pdfOptions.hidden = key !== 'pdf';
    lossless.input.parentElement.hidden = key !== 'pdf';
    note.textContent =
      key === 'pdf' && hasPdfInput
        ? 'PDF pages are rendered as images, so text in the output will not be selectable.'
        : key === 'ico'
          ? 'Icons are centered on a transparent square. Source images up to 256 px keep the most detail.'
          : '';
    note.hidden = !note.textContent;
    list.render(files, (file) => (isPdf(file) ? 'PDF' : file.type.replace('image/', '').toUpperCase() || ''));
    convertButton.disabled = busy || files.length === 0;
    convertButton.lastChild.textContent = files.length > 1 ? `Convert ${files.length} files` : 'Convert';
    clearButton.hidden = files.length === 0 && results.el.hidden;
    list.el.hidden = files.length === 0;
  }

  async function convert() {
    if (busy || files.length === 0) return;
    busy = true;
    results.clear();
    refresh();

    const key = format.value;
    const spec = OUTPUT_FORMATS[key];
    const q = Number(quality.input.value) / 100;
    const bg = background.value;
    const pdfSettings = { lossless: lossless.input.checked, quality: q, background: bg };
    const taken = new Set();
    const failures = [];
    const combined =
      key === 'pdf' && combine.input.checked ? await createPdfBuilder({ pageSize: pageSize.value }) : null;
    let produced = 0;

    for (const [index, file] of files.entries()) {
      status.ok(`Converting ${file.name} (${index + 1} of ${files.length})…`);
      const base = stripExtension(file.name);
      try {
        const own = key === 'pdf' && !combined ? await createPdfBuilder({ pageSize: pageSize.value }) : null;
        for await (const { canvas, pageNumber, total } of sources(file, Number(dpi.value))) {
          if (key === 'pdf') {
            await (combined ?? own).addCanvas(canvas, pdfSettings);
          } else {
            const blob = await encodeCanvas(canvas, key, { quality: q, background: bg, icoSizes: icoSizes.value });
            const suffix = total > 1 ? `-page-${String(pageNumber).padStart(String(total).length, '0')}` : '';
            results.add({
              blob,
              name: uniqueName(`${base}${suffix}.${spec.ext}`, taken),
              meta: `${canvas.width} × ${canvas.height}`,
            });
            produced++;
          }
          canvas.width = 0;
        }
        if (own) {
          results.add({
            blob: await own.toBlob(),
            name: uniqueName(`${base}.pdf`, taken),
            meta: `${own.pageCount} page${own.pageCount === 1 ? '' : 's'}`,
          });
          produced++;
        }
      } catch (error) {
        failures.push(error.message);
      }
    }

    if (combined && combined.pageCount > 0) {
      results.add({
        blob: await combined.toBlob(),
        name: uniqueName('combined.pdf', taken),
        meta: `${combined.pageCount} page${combined.pageCount === 1 ? '' : 's'}`,
      });
      produced++;
    }

    if (failures.length)
      status.error(`${[...new Set(failures)].join(' ')}${produced ? ' The other files were converted.' : ''}`);
    else status.ok(`Done. Created ${produced} file${produced === 1 ? '' : 's'}.`);
    busy = false;
    refresh();
  }

  const zone = dropzone({
    accept: ACCEPT,
    multiple: true,
    title: 'Drop images or PDFs here, or browse',
    hint: 'PNG, JPEG, WebP, AVIF, GIF, BMP, ICO, SVG, and PDF',
    onFiles: (added) => {
      files.push(...added);
      results.clear();
      status.clear();
      refresh();
    },
  });

  format.addEventListener('change', refresh);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h('section', { class: 'panel' }, zone, list.el),
      h(
        'section',
        { class: 'panel' },
        h('h2', { class: 'panel__title' }, 'Output'),
        h('div', { class: 'row' }, field('Convert to', format), qualityField),
        backgroundField,
        dpiField,
        icoField,
        pdfOptions,
        note,
        h('div', { class: 'btn-row' }, convertButton, clearButton),
      ),
      status.el,
      results.el,
    ),
  );
  refresh();
  return () => results.destroy();
}
