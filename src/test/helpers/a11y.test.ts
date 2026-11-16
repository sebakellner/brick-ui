import { expect, fixture, html } from '@open-wc/testing';
import { expectNoViolations } from './a11y.js';
import { clearStyleCache } from './style.js';
import { setTheme } from './theme.js';

class BkProbeBox extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    this.attachShadow({ mode: 'open' }).innerHTML =
      '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />';
  }
}
customElements.define('bk-probe-box', BkProbeBox);

describe('the axe gate', () => {
  afterEach(() => setTheme('light'));

  it('should fail, and name the rule, on a violation inside a shadow root', async () => {
    const el = await fixture<HTMLElement>(html`<bk-probe-box></bk-probe-box>`);
    let message = '';
    try {
      await expectNoViolations(el);
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message, 'the gate reported the unlabeled image').to.contain('image-alt');
  });

  it('should pass an element that renders nothing, so a suite must prove it rendered', async () => {
    const el = await fixture<HTMLElement>(html`<div></div>`);

    await expectNoViolations(el);
  });

  for (const theme of ['light', 'dark'] as const) {
    it(`should grade against the canvas the test page paints (${theme})`, async () => {
      setTheme(theme);
      clearStyleCache();
      const el = await fixture<HTMLElement>(html`
        <p style="color:var(--bk-text-default);font-size:16px;line-height:24px">
          A paragraph long enough for axe to grade against the page canvas behind it.
        </p>
      `);

      await expectNoViolations(el);
    });
  }

  it('should not run the WCAG AAA contrast rule', async () => {
    const el = await fixture<HTMLElement>(html`
      <p style="color:#6f6f6f;background:#ffffff;font-size:16px;line-height:24px">
        A paragraph at five to one, which AA wants and AAA does not.
      </p>
    `);

    await expectNoViolations(el);
  });
});
