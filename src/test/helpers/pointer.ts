import { nextFrame } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';

const centerOf = (element: Element): [number, number] => {
  const { x, y, width, height } = element.getBoundingClientRect();

  return [Math.round(x + width / 2), Math.round(y + height / 2)];
};

/* Must stay above --bk-transition (120ms), or the sample lands on an interpolated colour. */
export const pastTransition = async (): Promise<void> => {
  await nextFrame();
  await new Promise((resolve) => setTimeout(resolve, 250));
};

/* Headless Linux reports no hover-capable pointer, so a hover test there would assert
 * against rules whose media query never matches: it proves nothing, so it skips. */
export const hoverCapable = (): boolean => matchMedia('(hover: hover)').matches;

export const hover = async (element: Element): Promise<void> => {
  await sendMouse({ type: 'move', position: centerOf(element) });
  await pastTransition();
};

export const clickAt = async (element: Element): Promise<void> => {
  await sendMouse({ type: 'click', position: centerOf(element) });
};
