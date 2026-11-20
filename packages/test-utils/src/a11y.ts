/* axe arrives as a UMD bundle: importing it for its side effect is how the browser
 * gets `window.axe`, and there is no ESM build to import a value from. The global's type
 * is axe's own, so `run` and `RunOptions` are checked rather than restated. */
import 'axe-core/axe.js';
import { expect } from '@open-wc/testing';

declare global {
  interface Window {
    axe: typeof import('axe-core');
  }
}

/* WCAG 2 A and AA plus best-practice, decided for brikka: the normative rules are
 * the floor, and the best-practice ones catch the wiring a component library tends to
 * get wrong (a control outside any landmark, a name that resolves to nothing). */
const RULES = ['wcag2a', 'wcag2aa', 'best-practice'];

/* axe grades text against the page canvas and reads an unpainted one as white, while the
 * runner's Chrome follows the host's colour preference: a dark host resolved
 * `--brikka-text-default` to #f5f5f4 and axe graded it against white, 1.09:1, for every label
 * on the page. The test page now paints `body` with `--brikka-bg-surface`, so the canvas is
 * the theme's surface and a suite runs this in both themes. */
export const violationsIn = async (element: Element) => {
  const results = await window.axe.run(element, { runOnly: { type: 'tag', values: RULES } });

  return results.violations;
};

/* One failure reads as the list axe built, rule by rule, because "1 violation" names
 * nothing a reviewer can act on.
 * `failureSummary` carries the measured pair for color-contrast, which is the only
 * finding a reader can decide from without re-running the suite. */
export const expectNoViolations = async (element: Element) => {
  const violations = await violationsIn(element);
  const report = violations
    .map(
      (rule) =>
        `${rule.id} (${rule.impact}): ${rule.help} → ${rule.nodes
          .map((node) =>
            node.failureSummary
              ? `${node.target.join(' ')}: ${node.failureSummary}`
              : node.target.join(' '),
          )
          .join(', ')}`,
    )
    .join('\n');

  expect(violations.length, `axe reported:\n${report}`).to.equal(0);
};

/* The audit's precondition. axe passes an element that renders nothing, so every suite that
 * audits has to say what it expected to exist first — otherwise a broken render is
 * indistinguishable from a clean one (T16). */
export const expectRendered = (el: Element, selector: string): void => {
  expect(Boolean(el.shadowRoot), 'the element upgraded').to.equal(true);
  expect(
    Boolean(el.shadowRoot!.querySelector(selector)),
    `the element rendered ${selector}`,
  ).to.equal(true);
};
