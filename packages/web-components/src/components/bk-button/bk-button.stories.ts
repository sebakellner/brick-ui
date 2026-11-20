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
  title: 'Form/Button',
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

const VARIANTS: BkButtonVariant[] = ['primary', 'secondary', 'ghost'];

export const Default: Story = {};

export const Variants: Story = {
  render: () => html`
    <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
      ${VARIANTS.map((variant) => html`<bk-button variant=${variant}>Save changes</bk-button>`)}
    </div>
  `,
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Custom: Story = {
  render: () => html`
    <div style="display: flex; flex-wrap: wrap; gap: var(--bk-space-4); align-items: center;">
      <bk-button
        style="--bk-button-bg: var(--bk-bg-surface-muted); --bk-button-fg: var(--bk-text-default);"
      >
        Custom background
      </bk-button>
      <bk-button
        variant="ghost"
        style="--bk-button-bg: var(--bk-bg-accent); --bk-button-fg: var(--bk-text-on-accent);"
      >
        Custom on a ghost
      </bk-button>
      <div style="--bk-button-radius: var(--bk-radius-sm);">
        <bk-button>Inherited radius</bk-button>
      </div>
    </div>
  `,
};
