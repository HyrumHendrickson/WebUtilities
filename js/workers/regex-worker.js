import { runRegex } from '../lib/regex.js';

// Runs off the main thread so a pathological pattern cannot freeze the page.
self.onmessage = ({ data: { id, pattern, flags, text } }) => {
  try {
    self.postMessage({ id, ok: true, result: runRegex(pattern, flags, text) });
  } catch (error) {
    self.postMessage({ id, ok: false, message: error.message });
  }
};
