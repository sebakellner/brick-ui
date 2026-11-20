import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-field/define.js';
import './define.js';
import type { BkRadioGroupOrientation } from './bk-radio-group.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  orientation: BkRadioGroupOrientation;
  required: boolean;
  disabled: boolean;
};

const options = (hint: boolean) => html`
  <bk-radio-group-item value="default">
    <bk-field-label slot="label">Default</bk-field-label>
    ${
      hint
        ? html`<bk-field-description>Balanced spacing for most screens.</bk-field-description>`
        : ''
    }
  </bk-radio-group-item>
  <bk-radio-group-item value="comfortable">
    <bk-field-label slot="label">Comfortable</bk-field-label>
    ${
      hint
        ? html`<bk-field-description>More room between rows, easier to scan.</bk-field-description>`
        : ''
    }
  </bk-radio-group-item>
  <bk-radio-group-item value="compact">
    <bk-field-label slot="label">Compact</bk-field-label>
    ${hint ? html`<bk-field-description>The most rows per screen.</bk-field-description>` : ''}
  </bk-radio-group-item>
`;

const meta: Meta<Args> = {
  title: 'Form/Radio Group',
  component: 'bk-radio-group',
  args: {
    label: 'Density',
    description: '',
    error: '',
    value: '',
    orientation: 'vertical',
    required: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: ({ label, description, error, value, orientation, required, disabled }) => html`
    <div style="width: 320px;">
      <bk-radio-group
        name="density"
        .value=${value}
        orientation=${orientation}
        ?required=${required}
        ?disabled=${disabled}
      >
        <bk-field-label>${label}</bk-field-label>
        ${options(false)}
        ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
        ${error ? html`<bk-field-error>${error}</bk-field-error>` : ''}
      </bk-radio-group>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Description: Story = {
  render: () => html`
    <div style="width: 320px;">
      <bk-radio-group name="density">${options(true)}</bk-radio-group>
    </div>
  `,
};

export const Field: Story = {
  args: { description: 'How much room each row takes.' },
};

export const Disabled: Story = {
  args: { disabled: true, description: 'The set is disabled as a whole.' },
};

export const Invalid: Story = {
  args: { error: 'Pick a density.' },
};

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
};
