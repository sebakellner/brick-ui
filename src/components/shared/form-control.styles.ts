import { css } from 'lit';

export const formControlStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .label {
    display: block;
    margin-block-end: var(--bk-space-1);
    font-family: var(--bk-font-sans);
    font-size: var(--bk-font-size-sm);
    font-weight: var(--bk-font-weight-medium);
    color: var(--bk-text-default);
  }

  .control {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: var(--bk-control-height);
    padding-block: 0;
    padding-inline: var(--bk-space-3);
    font-family: var(--bk-font-sans);
    font-size: var(--bk-font-size-md);
    line-height: var(--bk-line-height-md);
    color: var(--bk-text-default);
    background: var(--bk-bg-surface);
    border: var(--bk-border-width) solid var(--bk-border-default);
    transition:
      border-color var(--bk-transition),
      background-color var(--bk-transition);
  }

  .control::placeholder {
    color: var(--bk-text-muted);
  }

  .control:hover:not(:disabled):not([aria-disabled='true']):not([aria-invalid='true']) {
    border-color: var(--bk-border-strong);
  }

  .control:focus-visible {
    outline: var(--bk-focus-ring-width) solid var(--bk-focus-ring);
    outline-offset: var(--bk-focus-ring-offset);
  }

  .control:is(:disabled, [aria-disabled='true']) {
    cursor: not-allowed;
    color: var(--bk-text-muted);
    background: var(--bk-bg-surface-muted);
  }

  .control[aria-invalid='true'] {
    border-color: var(--bk-border-danger);
  }

  .message {
    margin-block-start: var(--bk-space-1);
    font-family: var(--bk-font-sans);
    font-size: var(--bk-font-size-sm);
    line-height: var(--bk-line-height-md);
    color: var(--bk-text-muted);
  }

  .message[data-state='error'] {
    color: var(--bk-text-danger);
  }

  .message:empty {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;
