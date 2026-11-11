import { createZip } from './lib/zip.js';
import { formatBytes } from './lib/format.js';
import { icon } from './icons.js';
import { button, clear, createCleanup, downloadBlob, h } from './ui.js';

/**
 * A list of generated files with previews, individual downloads, and a ZIP download.
 * @param {{zipName?: string}} [options]
 */
export function createResults({ zipName = 'web-utilities.zip' } = {}) {
  const cleanup = createCleanup();
  const heading = h('h2', { class: 'results__title' }, 'Results');
  const list = h('ul', { class: 'results__list' });
  const zipButton = button('Download all (ZIP)', { icon: 'download', onClick: downloadAll });
  const head = h('div', { class: 'results__head' }, heading, zipButton);
  const el = h('section', { class: 'results', hidden: true, 'aria-live': 'polite' }, head, list);
  /** @type {{blob: Blob, name: string}[]} */
  let items = [];

  async function downloadAll() {
    const files = await Promise.all(
      items.map(async ({ blob, name }) => ({ name, data: new Uint8Array(await blob.arrayBuffer()) })),
    );
    downloadBlob(new Blob([createZip(files)], { type: 'application/zip' }), zipName);
  }

  function refresh() {
    el.hidden = items.length === 0;
    heading.textContent = `Results (${items.length})`;
    zipButton.hidden = items.length < 2;
  }

  return {
    el,
    /** Remove all results and release their previews. */
    clear() {
      cleanup.run();
      items = [];
      clear(list);
      refresh();
    },
    /**
     * @param {{blob: Blob, name: string, meta?: string}} result
     */
    add({ blob, name, meta = '' }) {
      items.push({ blob, name });
      const preview =
        blob.type.startsWith('image/') && blob.type !== 'image/x-icon'
          ? h('img', { class: 'results__thumb', src: cleanup.objectUrl(blob), alt: '', loading: 'lazy' })
          : h(
              'span',
              { class: 'results__thumb results__thumb--icon' },
              icon(blob.type === 'application/pdf' ? 'pdf' : 'file', { size: 24 }),
            );
      list.append(
        h(
          'li',
          { class: 'results__item' },
          preview,
          h(
            'div',
            { class: 'results__info' },
            h('span', { class: 'results__name' }, name),
            h('span', { class: 'results__meta' }, [formatBytes(blob.size), meta].filter(Boolean).join(' · ')),
          ),
          button('Download', {
            variant: 'ghost',
            size: 'sm',
            icon: 'download',
            onClick: () => downloadBlob(blob, name),
          }),
        ),
      );
      refresh();
    },
    destroy() {
      cleanup.run();
    },
  };
}
