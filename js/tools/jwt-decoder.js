import { decodeJwt } from '../lib/jwt.js';
import { clear, field, h, outputField, statusLine, textarea } from '../ui.js';

const TIME_CLAIMS = { exp: 'Expires', iat: 'Issued', nbf: 'Not valid before' };

export function mount(root) {
  const token = textarea({ rows: 5, placeholder: 'eyJhbGciOi…', 'aria-label': 'JSON Web Token' });
  const status = statusLine();
  const header = outputField('Header', { rows: 5 });
  const payload = outputField('Payload', { rows: 8 });
  const signature = outputField('Signature (not verified)', { rows: 2 });
  const claims = h('div', { class: 'kv' });
  const results = h(
    'div',
    { class: 'stack', hidden: true },
    h('div', { class: 'panel panel--flat' }, h('h3', { class: 'panel__subtitle' }, 'Time claims'), claims),
    header.el,
    payload.el,
    signature.el,
  );
  const notice = h(
    'p',
    { class: 'hint' },
    'The token is decoded in your browser. The signature is shown but not verified, so do not treat decoded claims as trustworthy on their own.',
  );

  function update() {
    if (!token.value.trim()) {
      status.clear();
      results.hidden = true;
      return;
    }
    try {
      const decoded = decodeJwt(token.value);
      header.set(JSON.stringify(decoded.header, null, 2));
      payload.set(JSON.stringify(decoded.payload, null, 2));
      signature.set(decoded.signature);

      const now = Date.now();
      const rows = Object.entries(TIME_CLAIMS)
        .filter(([key]) => typeof decoded.payload[key] === 'number')
        .map(([key, label]) => {
          const date = new Date(decoded.payload[key] * 1000);
          let state = '';
          if (key === 'exp') state = date.getTime() < now ? ' (expired)' : ' (still valid)';
          if (key === 'nbf' && date.getTime() > now) state = ' (not yet valid)';
          return [label, `${date.toISOString()}${state}`];
        });
      clear(claims).append(
        ...(rows.length
          ? rows.map(([label, value]) =>
              h(
                'div',
                { class: 'kv__row' },
                h('span', { class: 'kv__key' }, label),
                h('code', { class: 'kv__value' }, value),
              ),
            )
          : [h('p', { class: 'hint' }, 'This token has no exp, iat, or nbf claims.')]),
      );
      results.hidden = false;
      status.clear();
    } catch (error) {
      results.hidden = true;
      status.error(error.message);
    }
  }

  token.addEventListener('input', update);
  root.append(
    h('div', { class: 'stack' }, h('section', { class: 'panel' }, field('Token', token), notice), status.el, results),
  );
}
