import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkButtonVariant } from './bk-button.js';
import './define.js';

type Args = {
  variant: BkButtonVariant;
  disabled: boolean;
  label: string;
};

const meta: Meta<Args> = {
  title: 'Components/Button',
  component: 'bk-button',
  args: { variant: 'primary', disabled: false, label: 'Save changes' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  render: ({ variant, disabled, label }) => html`
    <bk-button variant=${variant} ?disabled=${disabled}>${label}</bk-button>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: 12px; align-items: center;">
      <bk-button>Save changes</bk-button>
      <bk-button variant="secondary">Cancel</bk-button>
      <bk-button variant="ghost">Learn more</bk-button>
    </div>
  `,
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Themed: Story = {
  name: 'Theming: role, then hook',
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4); justify-items: start;">
      <section
        style="--bk-bg-accent: var(--bk-palette-green-600); display: grid; gap: var(--bk-space-2); justify-items: start;"
      >
        <p style="margin: 0; color: var(--bk-text-muted); font: var(--bk-font-size-sm) var(--bk-font-sans);">
          Role: every control that reads it follows
        </p>
        <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
          <bk-button>Reads the role</bk-button>
          <bk-button variant="ghost">Reads the same role</bk-button>
        </div>
      </section>

      <section style="display: grid; gap: var(--bk-space-2); justify-items: start;">
        <p style="margin: 0; color: var(--bk-text-muted); font: var(--bk-font-size-sm) var(--bk-font-sans);">
          Hook: one control beats its variant default, and a background carries its foreground
        </p>
        <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
          <bk-button
            style="--bk-button-bg: var(--bk-bg-surface-muted); --bk-button-fg: var(--bk-text-default);"
          >
            A hook on a primary
          </bk-button>
          <bk-button
            variant="ghost"
            style="--bk-button-bg: var(--bk-bg-accent); --bk-button-fg: var(--bk-text-on-accent);"
          >
            A hook on a ghost
          </bk-button>
        </div>
      </section>

      <section style="display: grid; gap: var(--bk-space-2); justify-items: start;">
        <p style="margin: 0; color: var(--bk-text-muted); font: var(--bk-font-size-sm) var(--bk-font-sans);">
          Radius is a hook too: inherited from an ancestor, not only set on the element
        </p>
        <div style="--bk-button-radius: var(--bk-radius-sm); display: flex; gap: var(--bk-space-3);">
          <bk-button>Inherits the radius</bk-button>
        </div>
      </section>
    </div>
  `,
};
