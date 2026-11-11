// Runs before first paint to avoid a flash of the wrong theme.
try {
  const saved = localStorage.getItem('wu-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch {
  /* Storage can be unavailable (private mode, blocked cookies). The system theme applies. */
}
