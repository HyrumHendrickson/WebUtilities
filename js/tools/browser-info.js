import { button, clear, copyText, h } from '../ui.js';

function collect() {
  const nav = navigator;
  const media = (query) => globalThis.matchMedia?.(query).matches;
  const connection = nav.connection;
  const entries = [
    ['User agent', nav.userAgent],
    ['Platform', nav.userAgentData?.platform || nav.platform || 'Not reported'],
    ['Preferred language', nav.language],
    ['All languages', (nav.languages ?? [nav.language]).join(', ')],
    ['Time zone', Intl.DateTimeFormat().resolvedOptions().timeZone],
    ['Local time', new Date().toLocaleString()],
    ['Screen size', `${screen.width} × ${screen.height} px`],
    ['Window size', `${innerWidth} × ${innerHeight} px`],
    ['Pixel ratio', String(devicePixelRatio)],
    ['Color depth', `${screen.colorDepth}-bit`],
    ['Color scheme', media('(prefers-color-scheme: dark)') ? 'Dark' : 'Light'],
    ['Reduced motion', media('(prefers-reduced-motion: reduce)') ? 'Requested' : 'No preference'],
    ['Touch points', String(nav.maxTouchPoints ?? 0)],
    ['CPU threads', String(nav.hardwareConcurrency ?? 'Not reported')],
    ['Device memory', nav.deviceMemory ? `${nav.deviceMemory} GB or more` : 'Not reported'],
    ['Online', nav.onLine ? 'Yes' : 'No'],
    [
      'Connection',
      connection
        ? `${connection.effectiveType ?? 'unknown'}${connection.downlink ? `, about ${connection.downlink} Mbps` : ''}`
        : 'Not reported',
    ],
    ['Cookies enabled', nav.cookieEnabled ? 'Yes' : 'No'],
    ['Do Not Track', nav.doNotTrack === '1' ? 'Enabled' : 'Not enabled'],
    ['Secure context', globalThis.isSecureContext ? 'Yes' : 'No'],
  ];
  return entries;
}

export function mount(root) {
  const table = h('div', { class: 'kv' });

  function render() {
    clear(table).append(
      ...collect().map(([key, value]) =>
        h(
          'div',
          { class: 'kv__row kv__row--wide' },
          h('span', { class: 'kv__key' }, key),
          h('code', { class: 'kv__value kv__value--break' }, value),
        ),
      ),
    );
  }

  const copyAll = () =>
    copyText(
      collect()
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n'),
      'Details copied',
    );
  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'p',
        { class: 'hint' },
        'Websites can read these values. This page only displays them and sends nothing. Your IP address is not visible to the page.',
      ),
      table,
      h(
        'div',
        { class: 'btn-row' },
        button('Copy as text', { icon: 'copy', onClick: copyAll }),
        button('Refresh', { icon: 'refresh', onClick: render }),
      ),
    ),
  );
  render();
  window.addEventListener('resize', render);
  return () => window.removeEventListener('resize', render);
}
