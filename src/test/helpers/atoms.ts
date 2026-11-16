import { html } from '@open-wc/testing';

export const labelAtom = (text: string) =>
  html`<bk-field-label slot="label">${text}</bk-field-label>`;

export const descriptionAtom = (text: string) =>
  html`<bk-field-description slot="description">${text}</bk-field-description>`;
