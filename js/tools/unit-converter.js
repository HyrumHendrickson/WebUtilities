import { formatNumber } from '../lib/format.js';
import { CATEGORIES, convertUnit } from '../lib/units.js';
import { button, clear, field, h, input, select } from '../ui.js';

export function mount(root) {
  const category = select(
    Object.entries(CATEGORIES).map(([key, spec]) => [key, spec.label]),
    'length',
  );
  const value = input({
    type: 'number',
    value: '1',
    step: 'any',
    inputmode: 'decimal',
    'aria-label': 'Value to convert',
  });
  const from = select([], undefined);
  const to = select([], undefined);
  const result = h('p', { class: 'result', role: 'status', 'aria-live': 'polite' });
  const table = h('div', { class: 'kv' });

  function fillUnits() {
    const units = Object.entries(CATEGORIES[category.value].units);
    for (const [control, index] of [
      [from, 0],
      [to, Math.min(1, units.length - 1)],
    ]) {
      clear(control).append(...units.map(([key, [label]]) => h('option', { value: key }, label)));
      control.value = units[index][0];
    }
    if (category.value === 'length') {
      from.value = 'mi';
      to.value = 'km';
    } else if (category.value === 'temperature') {
      from.value = 'C';
      to.value = 'F';
    }
  }

  function update() {
    const number = Number(value.value);
    clear(table);
    if (value.value.trim() === '' || !Number.isFinite(number)) {
      result.textContent = 'Enter a number to convert.';
      return;
    }
    const spec = CATEGORIES[category.value];
    const converted = convertUnit(category.value, from.value, to.value, number);
    result.textContent = `${formatNumber(number)} ${spec.units[from.value][0].toLowerCase()} = ${formatNumber(converted)} ${spec.units[to.value][0].toLowerCase()}`;
    table.append(
      ...Object.entries(spec.units).map(([key, [label]]) =>
        h(
          'div',
          { class: 'kv__row' },
          h('span', { class: 'kv__key' }, label),
          h('code', { class: 'kv__value' }, formatNumber(convertUnit(category.value, from.value, key, number))),
        ),
      ),
    );
  }

  category.addEventListener('change', () => {
    fillUnits();
    update();
  });
  for (const control of [from, to]) control.addEventListener('change', update);
  value.addEventListener('input', update);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('Measurement', category),
        h('div', { class: 'row row--3' }, field('Value', value), field('From', from), field('To', to)),
        h(
          'div',
          { class: 'btn-row' },
          button('Swap units', {
            icon: 'convert',
            onClick: () => {
              [from.value, to.value] = [to.value, from.value];
              update();
            },
          }),
        ),
      ),
      h('section', { class: 'panel' }, result, table),
    ),
  );
  fillUnits();
  update();
}
