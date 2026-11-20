import '@brick/styles/theme.css';
import '@brick/web-components/register.js';

const output = document.querySelector('#output');
const slider = document.querySelector('bk-slider');

/* The continuous channel, not the settled one: the readout under the track moves with the
 * thumb instead of jumping when it is released. */
slider?.addEventListener('bk-input', (event) => {
  const detail = (event as CustomEvent<{ value: number }>).detail;
  if (output) output.textContent = `Volume: ${detail.value}`;
});
