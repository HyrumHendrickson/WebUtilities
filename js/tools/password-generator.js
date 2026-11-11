import { estimateEntropy, generatePassword, strengthLabel } from '../lib/password.js';
import { button, checkbox, clear, copyText, field, h, slider, statusLine } from '../ui.js';
import { icon } from '../icons.js';

export function mount(root) {
  const length = slider({ min: 8, max: 128, step: 1, value: 20, format: (v) => `${v} characters` });
  const count = slider({ min: 1, max: 10, step: 1, value: 3, format: (v) => `${v}` });
  const lower = checkbox('Lowercase (a–z)', { checked: true });
  const upper = checkbox('Uppercase (A–Z)', { checked: true });
  const digits = checkbox('Numbers (0–9)', { checked: true });
  const symbols = checkbox('Symbols (!@#$…)', { checked: true });
  const ambiguous = checkbox('Avoid look-alike characters (O, 0, l, 1, I)', {});

  const status = statusLine();
  const list = h('ul', { class: 'secrets' });
  const meterFill = h('div', { class: 'meter__fill' });
  const meterLabel = h('span', { class: 'meter__label' });
  const meter = h('div', { class: 'meter', role: 'img' }, h('div', { class: 'meter__track' }, meterFill), meterLabel);

  function generate() {
    clear(list);
    try {
      const options = {
        length: Number(length.input.value),
        lower: lower.input.checked,
        upper: upper.input.checked,
        digits: digits.input.checked,
        symbols: symbols.input.checked,
        excludeAmbiguous: ambiguous.input.checked,
      };
      const passwords = Array.from({ length: Number(count.input.value) }, () => generatePassword(options));
      for (const password of passwords) {
        list.append(
          h(
            'li',
            { class: 'secrets__item' },
            h('code', { class: 'secrets__value' }, password),
            h(
              'button',
              {
                type: 'button',
                class: 'icon-btn icon-btn--sm',
                'aria-label': 'Copy password',
                title: 'Copy password',
                onClick: () => copyText(password, 'Password copied'),
              },
              icon('copy', { size: 16 }),
            ),
          ),
        );
      }
      const bits = estimateEntropy(passwords[0]);
      const label = strengthLabel(bits);
      meterFill.style.width = `${Math.min(100, (bits / 128) * 100)}%`;
      meterFill.dataset.level = label.toLowerCase().replace(' ', '-');
      meterLabel.textContent = `${label} · about ${Math.round(bits)} bits of entropy`;
      meter.setAttribute('aria-label', meterLabel.textContent);
      meter.hidden = false;
      status.clear();
    } catch (error) {
      meter.hidden = true;
      status.error(error.message);
    }
  }

  for (const control of [lower, upper, digits, symbols, ambiguous]) control.input.addEventListener('change', generate);
  for (const control of [length, count]) control.input.addEventListener('input', generate);

  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        h('h2', { class: 'panel__title' }, 'Your passwords'),
        list,
        meter,
        status.el,
        h(
          'div',
          { class: 'btn-row' },
          button('Generate new', { variant: 'primary', icon: 'refresh', onClick: generate }),
        ),
        h(
          'p',
          { class: 'hint' },
          'Passwords are created in your browser with the Web Crypto random number generator and are never sent anywhere.',
        ),
      ),
      h(
        'section',
        { class: 'panel' },
        h('h2', { class: 'panel__title' }, 'Rules'),
        h('div', { class: 'row' }, field('Length', length), field('How many', count)),
        h('div', { class: 'checks' }, lower, upper, digits, symbols, ambiguous),
      ),
    ),
  );
  generate();
}
