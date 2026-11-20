import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BrikkaButtonVariant } from './brikka-button.js';
import './define.js';

type Args = {
  variant: BrikkaButtonVariant;
  disabled: boolean;
  label: string;
};

const meta: Meta<Args> = {
  title: 'Form/Button',
  component: 'brikka-button',
  args: { variant: 'primary', disabled: false, label: 'Save changes' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  render: ({ variant, disabled, label }) => html`
    <brikka-button variant=${variant} ?disabled=${disabled}>${label}</brikka-button>
  `,
};

export default meta;

type Story = StoryObj<Args>;

const VARIANTS: BrikkaButtonVariant[] = ['primary', 'secondary', 'ghost'];

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--brikka-space-3); align-items: center;">
      ${VARIANTS.map((variant) => html`<brikka-button variant=${variant}>Save changes</brikka-button>`)}
    </div>
  `,
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Custom: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: var(--brikka-space-4); align-items: center;">
      <brikka-button
        style="--brikka-button-bg: var(--brikka-bg-surface-muted); --brikka-button-fg: var(--brikka-text-default);"
      >
        Custom background
      </brikka-button>
      <brikka-button
        variant="ghost"
        style="--brikka-button-bg: var(--brikka-bg-accent); --brikka-button-fg: var(--brikka-text-on-accent);"
      >
        Custom on a ghost
      </brikka-button>
      <div style="--brikka-button-radius: var(--brikka-radius-sm);">
        <brikka-button>Inherited radius</brikka-button>
      </div>
    </div>
  `,
};
