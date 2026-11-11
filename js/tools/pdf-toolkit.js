import { stripExtension } from '../lib/format.js';
import { parsePageRanges } from '../lib/pages.js';
import { createZip } from '../lib/zip.js';
import { loadPdfLib } from '../media.js';
import { createResults } from '../results.js';
import { button, checkbox, dropzone, field, fileList, h, input, select, statusLine, tabs } from '../ui.js';

async function openPdf(file) {
  const { PDFDocument } = await loadPdfLib();
  try {
    return await PDFDocument.load(await file.arrayBuffer());
  } catch (error) {
    throw new Error(
      /encrypt/i.test(String(error.message))
        ? `${file.name} is password protected.`
        : `${file.name} could not be read as a PDF.`,
      { cause: error },
    );
  }
}

const pdfBlob = async (doc) => new Blob([await doc.save()], { type: 'application/pdf' });
const pagesLabel = (n) => `${n} page${n === 1 ? '' : 's'}`;

/** Shared scaffolding: a status line and result list. */
function workspace(zipName) {
  return { status: statusLine(), results: createResults({ zipName }) };
}

/* ------------------------------------------------------------------ */

function mergeTab(panel, track) {
  const { status, results } = workspace('merged-pdfs.zip');
  track(results);
  /** @type {File[]} */
  const files = [];

  const list = fileList({
    onRemove: (i) => {
      files.splice(i, 1);
      refresh();
    },
    onMove: (i, delta) => {
      [files[i], files[i + delta]] = [files[i + delta], files[i]];
      refresh();
    },
  });
  const run = button('Merge PDFs', { variant: 'primary', icon: 'pdf', disabled: true, onClick: merge });

  function refresh() {
    list.render(files);
    list.el.hidden = files.length === 0;
    run.disabled = files.length < 2;
  }

  async function merge() {
    run.disabled = true;
    results.clear();
    try {
      status.ok('Merging…');
      const { PDFDocument } = await loadPdfLib();
      const out = await PDFDocument.create();
      for (const file of files) {
        const source = await openPdf(file);
        const copied = await out.copyPages(source, source.getPageIndices());
        copied.forEach((page) => out.addPage(page));
      }
      results.add({ blob: await pdfBlob(out), name: 'merged.pdf', meta: pagesLabel(out.getPageCount()) });
      status.ok('Done.');
    } catch (error) {
      status.error(error.message);
    }
    refresh();
  }

  panel.append(
    h(
      'div',
      { class: 'stack' },
      dropzone({
        accept: '.pdf,application/pdf',
        multiple: true,
        title: 'Drop PDFs here, or browse',
        hint: 'Files are merged in the order listed. Use the arrows to reorder.',
        onFiles: (added) => {
          files.push(...added);
          results.clear();
          status.clear();
          refresh();
        },
      }),
      list.el,
      h('div', { class: 'btn-row' }, run),
      status.el,
      results.el,
    ),
  );
  refresh();
}

/* ------------------------------------------------------------------ */

/** Tab layout shared by tools that operate on one PDF and a page selection. */
function singleFileTab(panel, track, { zipName, controls, actionLabel, action, pagesHint, pagesRequired }) {
  const { status, results } = workspace(zipName);
  track(results);
  /** @type {{file: File, doc: any} | null} */
  let current = null;

  const pages = input({ placeholder: pagesRequired ? 'For example 1-3, 5, 8-' : 'Leave blank for all pages' });
  const summary = h('p', { class: 'hint' });
  const run = button(actionLabel, { variant: 'primary', icon: 'pdf', disabled: true, onClick: perform });
  const body = h(
    'div',
    { class: 'stack', hidden: true },
    summary,
    field('Pages', pages, { hint: pagesHint }),
    ...controls.elements,
    h('div', { class: 'btn-row' }, run),
  );

  async function perform() {
    run.disabled = true;
    results.clear();
    try {
      const count = current.doc.getPageCount();
      const indexes =
        pages.value.trim() || pagesRequired ? parsePageRanges(pages.value, count) : current.doc.getPageIndices();
      status.ok('Working…');
      const outputs = await action({ file: current.file, doc: current.doc, indexes });
      for (const output of outputs) results.add(output);
      status.ok('Done.');
    } catch (error) {
      status.error(error.message);
    }
    run.disabled = false;
  }

  panel.append(
    h(
      'div',
      { class: 'stack' },
      dropzone({
        accept: '.pdf,application/pdf',
        title: 'Drop a PDF here, or browse',
        onFiles: async ([file]) => {
          results.clear();
          status.clear();
          try {
            current = { file, doc: await openPdf(file) };
            summary.textContent = `${file.name} has ${pagesLabel(current.doc.getPageCount())}.`;
            body.hidden = false;
            run.disabled = false;
          } catch (error) {
            current = null;
            body.hidden = true;
            status.error(error.message);
          }
        },
      }),
      body,
      status.el,
      results.el,
    ),
  );
}

function extractTab(panel, track) {
  const separate = checkbox('Save each selected page as its own PDF (ZIP)', {});
  singleFileTab(panel, track, {
    zipName: 'extracted-pages.zip',
    actionLabel: 'Extract pages',
    pagesRequired: true,
    pagesHint: 'Use commas and ranges. An open range such as 8- continues to the last page.',
    controls: { elements: [h('div', { class: 'field field--check' }, separate)] },
    action: async ({ file, doc, indexes }) => {
      const { PDFDocument } = await loadPdfLib();
      const base = stripExtension(file.name);
      if (separate.input.checked) {
        const files = [];
        for (const index of indexes) {
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(doc, [index]);
          out.addPage(page);
          files.push({ name: `${base}-page-${index + 1}.pdf`, data: await out.save() });
        }
        const blob = new Blob([createZip(files)], { type: 'application/zip' });
        return [{ blob, name: `${base}-pages.zip`, meta: pagesLabel(files.length) }];
      }
      const out = await PDFDocument.create();
      (await out.copyPages(doc, indexes)).forEach((page) => out.addPage(page));
      return [{ blob: await pdfBlob(out), name: `${base}-extract.pdf`, meta: pagesLabel(indexes.length) }];
    },
  });
}

function rotateTab(panel, track) {
  const angle = select(
    [
      ['90', '90° clockwise'],
      ['180', '180°'],
      ['270', '90° counterclockwise'],
    ],
    '90',
  );
  singleFileTab(panel, track, {
    zipName: 'rotated-pdfs.zip',
    actionLabel: 'Rotate pages',
    pagesRequired: false,
    pagesHint: 'Optional. Choose specific pages, or leave blank to rotate the whole document.',
    controls: { elements: [field('Rotation', angle)] },
    action: async ({ file, doc, indexes }) => {
      const { PDFDocument, degrees } = await loadPdfLib();
      const out = await PDFDocument.load(await doc.save());
      const turn = Number(angle.value);
      for (const index of indexes) {
        const page = out.getPage(index);
        page.setRotation(degrees((page.getRotation().angle + turn) % 360));
      }
      return [
        {
          blob: await pdfBlob(out),
          name: `${stripExtension(file.name)}-rotated.pdf`,
          meta: `${pagesLabel(indexes.length)} rotated`,
        },
      ];
    },
  });
}

export function mount(root) {
  const tracked = [];
  const track = (results) => tracked.push(results);
  root.append(
    tabs([
      { id: 'merge', label: 'Merge', render: (panel) => mergeTab(panel, track) },
      { id: 'extract', label: 'Extract pages', render: (panel) => extractTab(panel, track) },
      { id: 'rotate', label: 'Rotate', render: (panel) => rotateTab(panel, track) },
    ]),
  );
  return () => tracked.forEach((results) => results.destroy());
}
