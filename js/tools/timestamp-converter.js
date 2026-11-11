import { describeDate, parseTimestamp, relativeTime } from '../lib/time.js';
import { button, clear, copyText, field, h, input, select, statusLine } from '../ui.js';

export function mount(root) {
  const source = input({ placeholder: '1700000000 or 2026-03-14T09:26:53Z', 'aria-label': 'Timestamp or date' });
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  const zone = select(
    [
      ['', `Browser (${Intl.DateTimeFormat().resolvedOptions().timeZone})`],
      ['UTC', 'UTC'],
      ...zones.filter((z) => z !== 'UTC').map((z) => [z, z.replace(/_/g, ' ')]),
    ],
    '',
  );
  const status = statusLine();
  const table = h('div', { class: 'kv' });

  function update() {
    clear(table);
    if (!source.value.trim()) return status.clear();
    try {
      const date = parseTimestamp(source.value);
      const info = describeDate(date, zone.value || undefined);
      status.clear();
      const rows = [
        ['Unix (seconds)', info.unixSeconds],
        ['Unix (milliseconds)', info.unixMilliseconds],
        ['ISO 8601 (UTC)', info.iso],
        ['UTC', info.utc],
        [zone.value || info.zone, info.local],
        ['Relative', relativeTime(date)],
      ];
      table.append(
        ...rows.map(([key, value]) =>
          h(
            'div',
            { class: 'kv__row kv__row--wide' },
            h('span', { class: 'kv__key' }, key),
            h('code', { class: 'kv__value kv__value--break' }, value),
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
    } catch (error) {
      status.error(error.message);
    }
  }

  source.addEventListener('input', update);
  zone.addEventListener('change', update);
  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('Unix timestamp or date', source, {
          hint: 'Numbers below 100 billion are read as seconds; larger numbers as milliseconds.',
        }),
        field('Show local time in', zone),
        h(
          'div',
          { class: 'btn-row' },
          button('Use current time', {
            icon: 'clock',
            onClick: () => {
              source.value = String(Math.floor(Date.now() / 1000));
              update();
            },
          }),
        ),
      ),
      status.el,
      table,
    ),
  );
}
