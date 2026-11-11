import { contrastRatio, parseColor, toHex, toHslString, toRgbString, wcagLevels } from '../lib/color.js';
import { clear, field, h, input, outputField, statusLine, tabs } from '../ui.js';

function convertTab(panel) {
  const text = input({ value: '#3f9ccb', 'aria-label': 'Color value' });
  const picker = h('input', {
    type: 'color',
    class: 'color-input color-input--large',
    value: '#3f9ccb',
    'aria-label': 'Pick a color',
  });
  const swatch = h('div', { class: 'swatch', role: 'img', 'aria-label': 'Color preview' });
  const hex = outputField('HEX', { single: true });
  const rgb = outputField('RGB', { single: true });
  const hsl = outputField('HSL', { single: true });
  const status = statusLine();

  function show(value, fromPicker = false) {
    try {
      const color = parseColor(value);
      status.clear();
      swatch.style.backgroundColor = toRgbString(color);
      hex.set(toHex(color));
      rgb.set(toRgbString(color));
      hsl.set(toHslString(color));
      if (fromPicker) text.value = value;
      else picker.value = toHex({ ...color, a: 1 });
    } catch (error) {
      status.error(error.message);
    }
  }

  text.addEventListener('input', () => show(text.value));
  picker.addEventListener('input', () => show(picker.value, true));
  panel.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'div',
        { class: 'color-row' },
        picker,
        field('Color', text, { hint: 'HEX, RGB, or HSL, with or without transparency.' }),
      ),
      swatch,
      status.el,
      h('div', { class: 'row row--3' }, hex.el, rgb.el, hsl.el),
    ),
  );
  show(text.value);
}

function contrastTab(panel) {
  const fg = input({ value: '#24324a', 'aria-label': 'Text color' });
  const bg = input({ value: '#ffffff', 'aria-label': 'Background color' });
  const fgPicker = h('input', {
    type: 'color',
    class: 'color-input',
    value: '#24324a',
    'aria-label': 'Pick text color',
  });
  const bgPicker = h('input', {
    type: 'color',
    class: 'color-input',
    value: '#ffffff',
    'aria-label': 'Pick background color',
  });
  const sample = h(
    'div',
    { class: 'contrast__sample' },
    h('p', { class: 'contrast__large' }, 'Large text sample'),
    h('p', {}, 'Regular text sample. The quick brown fox jumps over the lazy dog.'),
  );
  const ratioLabel = h('p', { class: 'contrast__ratio' });
  const table = h('div', { class: 'kv' });
  const status = statusLine();

  function update() {
    try {
      const a = parseColor(fg.value);
      const b = parseColor(bg.value);
      status.clear();
      sample.style.color = toRgbString({ ...a, a: 1 });
      sample.style.backgroundColor = toRgbString({ ...b, a: 1 });
      const ratio = contrastRatio(a, b);
      const levels = wcagLevels(ratio);
      ratioLabel.textContent = `${ratio.toFixed(2)} : 1`;
      const verdict = (pass) => (pass ? 'Pass' : 'Fail');
      clear(table).append(
        ...[
          ['AA, regular text (4.5)', levels.aaNormal],
          ['AA, large text (3)', levels.aaLarge],
          ['AAA, regular text (7)', levels.aaaNormal],
          ['AAA, large text (4.5)', levels.aaaLarge],
        ].map(([label, pass]) =>
          h(
            'div',
            { class: 'kv__row' },
            h('span', { class: 'kv__key' }, label),
            h('span', { class: `badge badge--${pass ? 'pass' : 'fail'}` }, verdict(pass)),
          ),
        ),
      );
    } catch (error) {
      status.error(error.message);
    }
  }

  const link = (textEl, picker) => {
    textEl.addEventListener('input', () => {
      try {
        picker.value = toHex({ ...parseColor(textEl.value), a: 1 });
      } catch {
        /* Keep the previous swatch while the value is incomplete. */
      }
      update();
    });
    picker.addEventListener('input', () => {
      textEl.value = picker.value;
      update();
    });
  };
  link(fg, fgPicker);
  link(bg, bgPicker);

  panel.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'div',
        { class: 'row' },
        h('div', { class: 'color-row' }, fgPicker, field('Text color', fg)),
        h('div', { class: 'color-row' }, bgPicker, field('Background color', bg)),
      ),
      status.el,
      sample,
      ratioLabel,
      table,
      h(
        'p',
        { class: 'hint' },
        'WCAG 2.x thresholds. Large text means 24 px, or 18.66 px and bold. Transparent colors are measured as if opaque.',
      ),
    ),
  );
  update();
}

export function mount(root) {
  root.append(
    tabs([
      { id: 'convert', label: 'Convert', render: convertTab },
      { id: 'contrast', label: 'Contrast checker', render: contrastTab },
    ]),
  );
}
