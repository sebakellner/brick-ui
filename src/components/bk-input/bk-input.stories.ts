import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkInput, BkInputMode, BkInputType } from './bk-input.js';
import '../bk-button/define.js';
import '../bk-field/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  placeholder: string;
  name: string;
  type: BkInputType;
  autocomplete: string;
  inputMode: BkInputMode | '';
  disabled: boolean;
  required: boolean;
};

const parts = (label: string, description: string) => html`
  <bk-field-label>${label}</bk-field-label>
  ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Input',
  component: 'bk-input',
  args: {
    label: 'Email',
    description: 'We never share it.',
    error: '',
    value: '',
    placeholder: 'you@brick.dev',
    name: 'email',
    type: 'email',
    autocomplete: 'email',
    inputMode: '',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    value: { control: 'text' },
    placeholder: { control: 'text' },
    name: { control: 'text' },
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url'] },
    autocomplete: { control: 'text' },
    inputMode: {
      control: 'select',
      options: ['', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search', 'none'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  render: ({
    label,
    description,
    error,
    value,
    placeholder,
    name,
    type,
    autocomplete,
    inputMode,
    disabled,
    required,
  }) => html`
    <div style="width: 320px;">
      <bk-field>
        <bk-input
          error=${error}
          value=${value}
          placeholder=${placeholder}
          name=${name}
          type=${type}
          autocomplete=${autocomplete}
          .inputMode=${inputMode}
          ?disabled=${disabled}
          ?required=${required}
        >
          ${parts(label, description)}
        </bk-input>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px; width: 320px;">
      <bk-field>
        <bk-input name="email" placeholder="you@brick.dev">
          <bk-field-label>Email</bk-field-label>
          <bk-field-description>We never share it.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="email" error="That address looks wrong." value="you@brick">
          <bk-field-label>Email</bk-field-label>
          <bk-field-description>We never share it.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="email" value="you@brick.dev" disabled>
          <bk-field-label>Email</bk-field-label>
        </bk-input>
      </bk-field>
    </div>
  `,
};

const readout = (form: HTMLFormElement, prefix: string) => {
  const output = form.querySelector('output');
  if (!output) return;
  const entries = [...new FormData(form).entries()].map(
    ([key, value]) => `${key}=${String(value) || '(empty)'}`,
  );
  output.textContent = `${prefix}: ${entries.join(' · ') || 'no entries'}`;
};

export const NativeValidation: Story = {
  name: 'Native message and error',
  render: () => html`
    <div style="display: grid; gap: var(--bk-space-4);">
      <form style="display: grid; gap: var(--bk-space-3);">
        <bk-field>
          <bk-input name="native" type="email" required>
            <bk-field-label>Native channel</bk-field-label>
            <bk-field-description
              >Leave it empty and blur or submit: the browser's own message
              shows.</bk-field-description
            >
          </bk-input>
        </bk-field>
        <bk-button type="submit">Submit</bk-button>
      </form>
      <form
        novalidate
        style="display: grid; gap: var(--bk-space-3);"
        @submit=${(event: Event) => {
          event.preventDefault();
          const form = event.currentTarget as HTMLFormElement;
          const field = form.querySelector('bk-input') as BkInput;
          const valid = /^[^@]+@[^@]+$/.test(field.value);
          field.error = valid ? '' : 'That address needs an @.';
        }}
      >
        <bk-field>
          <bk-input name="schema" type="email" required>
            <bk-field-label>novalidate, only error</bk-field-label>
            <bk-field-description>No native message ever shows here.</bk-field-description>
          </bk-input>
        </bk-field>
        <bk-button type="submit">Submit</bk-button>
      </form>
    </div>
  `,
};

export const InAForm: Story = {
  name: 'In a form: name, inputMode, reset',
  render: () => html`
    <form
      style="display: grid; gap: var(--bk-space-4); width: 320px;"
      @reset=${(event: Event) => {
        const form = event.currentTarget as HTMLFormElement;
        requestAnimationFrame(() => readout(form, 'FormData after reset'));
      }}
      @bk-change=${(event: CustomEvent<{ value: string }>) => {
        readout(event.currentTarget as HTMLFormElement, `bk-change ${event.detail.value}`);
      }}
    >
      <bk-field>
        <bk-input name="email" type="email" autocomplete="email" required value="you@brick.dev">
          <bk-field-label>Email</bk-field-label>
          <bk-field-description>Named for the form.</bk-field-description>
        </bk-input>
      </bk-field>
      <bk-field>
        <bk-input name="phone" type="tel" autocomplete="tel" inputMode="tel">
          <bk-field-label>Phone</bk-field-label>
          <bk-field-description>A numeric keypad on a phone.</bk-field-description>
        </bk-input>
      </bk-field>
      <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
        <bk-button type="reset" variant="secondary">Reset</bk-button>
      </div>
      <output
        style="font: var(--bk-font-size-sm) var(--bk-font-sans); color: var(--bk-text-muted);"
      >
        Change a field or reset to read FormData.
      </output>
    </form>
  `,
};
