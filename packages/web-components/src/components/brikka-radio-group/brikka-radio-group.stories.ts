import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../brikka-field/define.js';
import './define.js';
import type { BrikkaRadioGroupOrientation } from './brikka-radio-group.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  orientation: BrikkaRadioGroupOrientation;
  required: boolean;
  disabled: boolean;
};

const options = (hint: boolean) => html`
  <brikka-radio-group-item value="default">
    <brikka-field-label slot="label">Default</brikka-field-label>
    ${
      hint
        ? html`<brikka-field-description
            >Balanced spacing for most screens.</brikka-field-description
          >`
        : ''
    }
  </brikka-radio-group-item>
  <brikka-radio-group-item value="comfortable">
    <brikka-field-label slot="label">Comfortable</brikka-field-label>
    ${
      hint
        ? html`<brikka-field-description
            >More room between rows, easier to scan.</brikka-field-description
          >`
        : ''
    }
  </brikka-radio-group-item>
  <brikka-radio-group-item value="compact">
    <brikka-field-label slot="label">Compact</brikka-field-label>
    ${hint ? html`<brikka-field-description>The most rows per screen.</brikka-field-description>` : ''}
  </brikka-radio-group-item>
`;

const meta: Meta<Args> = {
  title: 'Form/Radio Group',
  component: 'brikka-radio-group',
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
      <brikka-radio-group
        name="density"
        .value=${value}
        orientation=${orientation}
        ?required=${required}
        ?disabled=${disabled}
      >
        <brikka-field-label>${label}</brikka-field-label>
        ${options(false)}
        ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
        ${error ? html`<brikka-field-error>${error}</brikka-field-error>` : ''}
      </brikka-radio-group>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Description: Story = {
  render: () => html`
    <div style="width: 320px;">
      <brikka-radio-group name="density">${options(true)}</brikka-radio-group>
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
