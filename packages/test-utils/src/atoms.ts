import { html } from '@open-wc/testing';

export const labelAtom = (text: string) =>
  html`<brikka-field-label slot="label">${text}</brikka-field-label>`;

export const descriptionAtom = (text: string) =>
  html`<brikka-field-description slot="description">${text}</brikka-field-description>`;
