import { css } from 'lit';

export const formControlStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .label[hidden] {
    display: none;
  }

  .label {
    display: block;
    margin-block-end: var(--brikka-space-2);
    font-family: var(--brikka-font-sans);
    font-size: var(--brikka-font-size-sm);
    font-weight: var(--brikka-font-weight-medium);
    color: var(--brikka-text-default);
  }

  .label[data-state='invalid'] {
    color: var(--brikka-text-danger);
  }

  .label[data-disabled] {
    opacity: var(--brikka-opacity-disabled);
  }

  slot[name='label']::slotted(*) {
    display: inline-block;
  }

  .required {
    margin-inline-start: var(--brikka-space-1);
    color: var(--brikka-text-danger);
  }

  .control {
    box-sizing: border-box;
    inline-size: 100%;
    min-inline-size: 0;
    min-block-size: var(--brikka-control-height);
    padding-block: 0;
    padding-inline: var(--brikka-space-3);
    font-family: var(--brikka-font-sans);
    font-size: var(--brikka-font-size-md);
    line-height: var(--brikka-line-height-md);
    color: var(--brikka-text-default);
    background: var(--brikka-bg-surface);
    border: var(--brikka-border-width) solid var(--brikka-border-default);
    transition:
      border-color var(--brikka-transition),
      background-color var(--brikka-transition);
  }

  .control::placeholder {
    color: var(--brikka-text-muted);
  }

  .control:hover:not(:disabled):not([aria-invalid='true']) {
    border-color: var(--brikka-border-strong);
  }

  .control:focus-visible {
    outline: var(--brikka-focus-ring-width) solid var(--brikka-focus-ring);
    outline-offset: var(--brikka-focus-ring-offset);
  }

  .control:disabled {
    cursor: not-allowed;
    color: var(--brikka-text-muted);
    opacity: var(--brikka-opacity-disabled);
  }

  .control[aria-invalid='true'] {
    border-color: var(--brikka-border-danger);
  }

  .message {
    margin-block-start: var(--brikka-space-1);
    font-family: var(--brikka-font-sans);
    font-size: var(--brikka-font-size-sm);
    line-height: var(--brikka-line-height-md);
    color: var(--brikka-text-muted);
  }

  .message[data-state='error'] {
    color: var(--brikka-text-danger);
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

  .message[data-empty] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`;
