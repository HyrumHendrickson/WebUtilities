import { countText, keywordFrequency } from '../lib/text.js';
import { clear, field, h, textarea } from '../ui.js';

const readingTime = (minutes) => {
  if (minutes === 0) return '0 sec';
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
  return `${Math.round(minutes)} min`;
};

export function mount(root) {
  const text = textarea({ rows: 12, placeholder: 'Type or paste your text here', 'aria-label': 'Text to analyze' });
  const stats = h('dl', { class: 'stats' });
  const keywords = h('ol', { class: 'keywords' });
  const keywordPanel = h(
    'section',
    { class: 'panel', hidden: true },
    h('h2', { class: 'panel__title' }, 'Most used words'),
    keywords,
  );

  function update() {
    const value = text.value;
    const result = countText(value);
    const rows = [
      ['Words', result.words.toLocaleString()],
      ['Characters', result.characters.toLocaleString()],
      ['Without spaces', result.charactersNoSpaces.toLocaleString()],
      ['Sentences', result.sentences.toLocaleString()],
      ['Paragraphs', result.paragraphs.toLocaleString()],
      ['Lines', result.lines.toLocaleString()],
      ['Reading time', readingTime(result.readingMinutes)],
      ['Speaking time', readingTime(result.speakingMinutes)],
    ];
    clear(stats).append(
      ...rows.map(([label, number]) =>
        h(
          'div',
          { class: 'stat' },
          h('dt', { class: 'stat__label' }, label),
          h('dd', { class: 'stat__value' }, number),
        ),
      ),
    );
    const top = keywordFrequency(value);
    keywordPanel.hidden = top.length === 0;
    clear(keywords).append(
      ...top.map(({ word, count }) =>
        h('li', {}, h('span', { class: 'keywords__word' }, word), h('span', { class: 'keywords__count' }, `×${count}`)),
      ),
    );
  }

  text.addEventListener('input', update);
  root.append(
    h(
      'div',
      { class: 'stack' },
      h(
        'section',
        { class: 'panel' },
        field('Text', text, { hint: 'Reading time assumes 238 words per minute; speaking time assumes 150.' }),
      ),
      h('section', { class: 'panel' }, stats),
      keywordPanel,
    ),
  );
  update();
}
