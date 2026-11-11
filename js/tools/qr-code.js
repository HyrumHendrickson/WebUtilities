import { contrastRatio, parseColor, relativeLuminance } from '../lib/color.js';
import { looksLikeBareDomain, matrixToSvg, wifiPayload } from '../lib/qr.js';
import {
  button,
  checkbox,
  createCleanup,
  debounce,
  downloadBlob,
  field,
  h,
  input,
  loadScript,
  select,
  slider,
  statusLine,
  tabs,
  textarea,
  toast,
} from '../ui.js';

const QR_SCRIPT = new URL('../../vendor/qrcode-generator/qrcode.js', import.meta.url).href;

const ECC_OPTIONS = [
  ['L', 'Low (7% recovery)'],
  ['M', 'Medium (15% recovery)'],
  ['Q', 'Quartile (25% recovery)'],
  ['H', 'High (30% recovery)'],
];

let encoder;

async function loadEncoder() {
  if (!encoder) {
    await loadScript(QR_SCRIPT);
    encoder = globalThis.qrcode;
    encoder.stringToBytes = (text) => [...new TextEncoder().encode(text)];
  }
  return encoder;
}

function buildMatrix(qrcode, text, level) {
  const qr = qrcode(0, level);
  qr.addData(text, 'Byte');
  qr.make();
  const count = qr.getModuleCount();
  return Array.from({ length: count }, (_, row) => Array.from({ length: count }, (_, col) => qr.isDark(row, col)));
}

export function mount(root) {
  const cleanup = createCleanup();
  let activeSource = 'text';
  let lastMatrix = null;

  /* Source inputs */
  const textInput = textarea({ rows: 4, placeholder: 'https://example.com', 'aria-label': 'Link or text' });
  const addressHint = h(
    'p',
    { class: 'hint hint--warn', hidden: true },
    'This looks like a web address without https://. Many phones will treat it as plain text. Add https:// so it opens as a link.',
  );
  const ssid = input({ placeholder: 'Network name' });
  const wifiPassword = input({ placeholder: 'Password', type: 'text' });
  const security = select(
    [
      ['WPA', 'WPA/WPA2/WPA3'],
      ['WEP', 'WEP'],
      ['nopass', 'No password'],
    ],
    'WPA',
  );
  const hidden = checkbox('Hidden network', {});

  /* Appearance */
  const level = select(ECC_OPTIONS, 'M');
  const size = slider({ min: 128, max: 1024, step: 16, value: 320, format: (v) => `${v} px` });
  const margin = slider({ min: 0, max: 10, step: 1, value: 4, format: (v) => `${v} modules` });
  const foreground = h('input', { type: 'color', class: 'color-input', value: '#000000', 'aria-label': 'Code color' });
  const background = h('input', {
    type: 'color',
    class: 'color-input',
    value: '#ffffff',
    'aria-label': 'Background color',
  });
  const transparent = checkbox('Transparent background', {});

  const status = statusLine();
  const advice = h('p', { class: 'hint hint--warn', hidden: true });
  const canvas = h('canvas', { class: 'qr__canvas', hidden: true, role: 'img', 'aria-label': 'Generated QR code' });
  const placeholder = h('p', { class: 'qr__empty' }, 'Your QR code appears here.');
  const stage = h('div', { class: 'qr__stage' }, placeholder, canvas);
  const dimensions = h('p', { class: 'hint qr__dims' });
  const pngButton = button('PNG', {
    variant: 'primary',
    icon: 'download',
    disabled: true,
    onClick: () => downloadPng(),
  });
  const svgButton = button('SVG', { icon: 'download', disabled: true, onClick: () => downloadSvg() });
  const copyButton = button('Copy image', { icon: 'copy', disabled: true, onClick: () => copyImage() });
  if (!(navigator.clipboard?.write && globalThis.ClipboardItem)) copyButton.hidden = true;

  function payload() {
    if (activeSource === 'wifi') {
      if (!ssid.value.trim()) return '';
      return wifiPayload({
        ssid: ssid.value,
        password: wifiPassword.value,
        security: security.value,
        hidden: hidden.input.checked,
      });
    }
    return textInput.value;
  }

  const options = () => ({
    margin: Number(margin.input.value),
    size: Number(size.input.value),
    foreground: foreground.value,
    background: transparent.input.checked ? null : background.value,
  });

  function setOutput(enabled) {
    canvas.hidden = !enabled;
    placeholder.hidden = enabled;
    dimensions.hidden = !enabled;
    for (const control of [pngButton, svgButton, copyButton]) control.disabled = !enabled;
  }

  async function render() {
    addressHint.hidden = !(activeSource === 'text' && looksLikeBareDomain(textInput.value));
    let text;
    try {
      text = payload();
    } catch (error) {
      status.error(error.message);
      lastMatrix = null;
      setOutput(false);
      return;
    }
    if (!text) {
      status.clear();
      advice.hidden = true;
      lastMatrix = null;
      setOutput(false);
      return;
    }

    try {
      const qrcode = await loadEncoder();
      lastMatrix = buildMatrix(qrcode, text, level.value);
    } catch (error) {
      lastMatrix = null;
      setOutput(false);
      status.error(
        /overflow|too long/i.test(String(error.message))
          ? 'There is too much data for one QR code. Shorten the text or choose a lower error-correction level.'
          : error.message,
      );
      return;
    }
    status.clear();

    const { margin: quiet, size: target, foreground: fg, background: bg } = options();
    const total = lastMatrix.length + quiet * 2;
    const cell = Math.max(1, Math.floor(target / total));
    canvas.width = cell * total;
    canvas.height = cell * total;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (bg) {
      context.fillStyle = bg;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.fillStyle = fg;
    lastMatrix.forEach((cells, y) =>
      cells.forEach((dark, x) => dark && context.fillRect((x + quiet) * cell, (y + quiet) * cell, cell, cell)),
    );
    stage.classList.toggle('qr__stage--transparent', !bg);
    dimensions.textContent = `${canvas.width} × ${canvas.height} px · ${lastMatrix.length} × ${lastMatrix.length} modules`;
    setOutput(true);

    const messages = [];
    const fgColor = parseColor(fg);
    const bgColor = bg ? parseColor(bg) : null;
    if (bgColor) {
      if (contrastRatio(fgColor, bgColor) < 3)
        messages.push('Low contrast between the code and background may stop scanners from reading it.');
      else if (relativeLuminance(fgColor) > relativeLuminance(bgColor))
        messages.push('Light-on-dark codes are not readable by every scanner. Test before printing.');
    } else {
      messages.push('A transparent background only scans reliably on a light surface.');
    }
    if (quiet < 4) messages.push('A quiet zone under 4 modules can make scanning less reliable.');
    advice.hidden = messages.length === 0;
    advice.textContent = messages.join(' ');
  }

  const update = debounce(render, 120);
  cleanup.add(() => update.cancel());

  async function toPngBlob() {
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not create the image.'))), 'image/png'),
    );
  }

  async function downloadPng() {
    downloadBlob(await toPngBlob(), 'qr-code.png');
  }

  function downloadSvg() {
    if (!lastMatrix) return;
    downloadBlob(new Blob([matrixToSvg(lastMatrix, options())], { type: 'image/svg+xml' }), 'qr-code.svg');
  }

  async function copyImage() {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': toPngBlob() })]);
      toast('Image copied to clipboard');
    } catch {
      toast('Your browser did not allow copying the image. Download it instead.', { type: 'error' });
    }
  }

  const source = tabs(
    [
      {
        id: 'text',
        label: 'Link or text',
        render: (panel) =>
          panel.append(
            field('Content', textInput, { hint: 'Anything up to a few hundred characters works best.' }),
            addressHint,
          ),
      },
      {
        id: 'wifi',
        label: 'Wi-Fi network',
        render: (panel) =>
          panel.append(
            h('div', { class: 'row' }, field('Network name', ssid), field('Password', wifiPassword)),
            h('div', { class: 'row' }, field('Security', security), h('div', { class: 'field field--check' }, hidden)),
          ),
      },
    ],
    {
      onChange: (id) => {
        activeSource = id;
        update();
      },
    },
  );

  const colors = h(
    'div',
    { class: 'row' },
    field('Code color', foreground),
    field('Background', background),
    h('div', { class: 'field field--check' }, transparent),
  );

  for (const control of [textInput, ssid, wifiPassword, security, level, foreground, background])
    control.addEventListener('input', update);
  for (const control of [hidden, transparent, size, margin])
    (control.input ?? control).addEventListener('input', update);
  for (const control of [hidden, transparent]) control.input.addEventListener('change', update);

  root.append(
    h(
      'div',
      { class: 'split' },
      h(
        'div',
        { class: 'split__main stack' },
        h('section', { class: 'panel' }, h('h2', { class: 'panel__title' }, 'Content'), source),
        h(
          'section',
          { class: 'panel' },
          h('h2', { class: 'panel__title' }, 'Appearance'),
          h(
            'div',
            { class: 'row' },
            field('Error correction', level, { hint: 'Higher levels survive more damage but need a denser code.' }),
            field('Size', size),
          ),
          field('Quiet zone', margin),
          colors,
        ),
        status.el,
      ),
      h(
        'aside',
        { class: 'split__aside' },
        h(
          'div',
          { class: 'qr' },
          stage,
          dimensions,
          advice,
          h('div', { class: 'btn-row' }, pngButton, svgButton, copyButton),
        ),
      ),
    ),
  );
  setOutput(false);
  return () => cleanup.run();
}
