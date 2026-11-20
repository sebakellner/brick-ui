import '@brikka-ui/styles/theme.css';
import '@brikka-ui/web-components/register.js';

const output = document.querySelector('#output');
const slider = document.querySelector('brikka-slider');

/* The continuous channel, not the settled one: the readout under the track moves with the
 * thumb instead of jumping when it is released. */
slider?.addEventListener('brikka-input', (event) => {
  const detail = (event as CustomEvent<{ value: number }>).detail;
  if (output) output.textContent = `Volume: ${detail.value}`;
});
