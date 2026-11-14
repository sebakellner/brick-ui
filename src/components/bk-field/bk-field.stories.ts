import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import '../bk-button/define.js';
import '../bk-input/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  invalid: boolean;
  required: boolean;
};

const meta: Meta<Args> = {
  title: 'Components/Field',
  component: 'bk-field',
  args: {
    label: 'Email',
    description: 'We only use it for the receipt.',
    error: '',
    invalid: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    invalid: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({ label, description, error, invalid, required }) => html`
    <div style="width: 360px;">
      <bk-field ?invalid=${invalid}>
        <bk-input name="email" type="email" ?required=${required} error=${error}>
          <bk-field-label>${label}</bk-field-label>
          ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
        </bk-input>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const LabelOnly: Story = {
  name: 'Label only',
  args: { description: '' },
};

export const LongDescription: Story = {
  name: 'A description that wraps',
  args: {
    label: 'Tax identifier',
    description:
      'The number on the invoice. For a company it is the VAT id and it usually starts with the country code. We ask once and never again.',
  },
};

export const Invalid: Story = {
  name: 'Invalid, with the error atom',
  args: {
    invalid: true,
    error: 'Enter a valid address.',
  },
  render: ({ label, description, error, invalid }) => html`
    <div style="width: 360px;">
      <bk-field ?invalid=${invalid}>
        <bk-input name="email" type="email" .value=${'you@brick'} error=${error}>
          <bk-field-label>${label}</bk-field-label>
          ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
          <bk-field-error>${error}</bk-field-error>
        </bk-input>
      </bk-field>
    </div>
  `,
};

export const PropsSideBySide: Story = {
  name: 'Atoms, and the properties they replace',
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4); width: 360px;">
      <bk-field>
        <bk-input name="composed" type="email">
          <bk-field-label>Composed</bk-field-label>
          <bk-field-description>Label and description are slotted content.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input
          name="properties"
          type="email"
          label="Properties"
          helper="Still works: the label and helper attributes are the fallback."
        ></bk-input>
      </bk-field>
    </div>
  `,
};

const readout = (form: HTMLFormElement) => {
  const output = form.parentElement?.querySelector('output');
  if (!output) return;
  const entries = [...new FormData(form).entries()].map(
    ([key, value]) => `${key}=${String(value) || '(empty)'}`,
  );
  output.textContent = entries.join(' · ') || 'no entries';
};

export const InAForm: Story = {
  name: 'In a form',
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4); width: 360px;">
      <form
        style="display: grid; gap: var(--bk-space-4);"
        @submit=${(event: Event) => {
          event.preventDefault();
          readout(event.target as HTMLFormElement);
        }}
        @reset=${(event: Event) => {
          requestAnimationFrame(() => readout(event.target as HTMLFormElement));
        }}
      >
        <bk-field>
          <bk-input name="email" type="email" autocomplete="email" required>
            <bk-field-label>Email</bk-field-label>
            <bk-field-description>Where the receipt goes.</bk-field-description>
          </bk-input>
        </bk-field>
        <bk-field>
          <bk-input name="company" autocomplete="organization">
            <bk-field-label>Company</bk-field-label>
            <bk-field-description>Optional. It goes on the invoice.</bk-field-description>
          </bk-input>
        </bk-field>
        <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
          <bk-button type="submit">Submit</bk-button>
          <bk-button type="reset" variant="secondary">Reset</bk-button>
        </div>
      </form>
      <output
        style="font: var(--bk-font-size-sm) var(--bk-font-sans); color: var(--bk-text-muted);"
      >
        Submit to read FormData.
      </output>
    </div>
  `,
};
