import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BkInputMode, BkInputType } from './bk-input.js';
import '../bk-button/bk-button.js';
import './bk-input.js';

type Args = {
  label: string;
  helper: string;
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

const meta: Meta<Args> = {
  title: 'Components/Input',
  component: 'bk-input',
  args: {
    label: 'Email',
    helper: 'We never share it.',
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
    helper: { control: 'text' },
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
    helper,
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
      <bk-input
        label=${label}
        helper=${helper}
        error=${error}
        value=${value}
        placeholder=${placeholder}
        name=${name}
        type=${type}
        autocomplete=${autocomplete}
        .inputMode=${inputMode}
        ?disabled=${disabled}
        ?required=${required}
      ></bk-input>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const States: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 20px; width: 320px;">
      <bk-input label="Email" helper="We never share it." placeholder="you@brick.dev"></bk-input>
      <bk-input
        label="Email"
        helper="We never share it."
        error="That address looks wrong."
        value="you@brick"
      ></bk-input>
      <bk-input label="Email" value="you@brick.dev" disabled></bk-input>
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

export const InAForm: Story = {
  name: 'In a form: name, inputMode, required, reset',
  render: () => html`
    <form
      style="display: grid; gap: var(--bk-space-4); width: 320px;"
      @submit=${(event: SubmitEvent) => {
        event.preventDefault();
        readout(event.currentTarget as HTMLFormElement, 'FormData');
      }}
      @reset=${(event: Event) => {
        const form = event.currentTarget as HTMLFormElement;
        requestAnimationFrame(() => readout(form, 'FormData after reset'));
      }}
      @bk-change=${(event: CustomEvent<{ value: string }>) => {
        readout(event.currentTarget as HTMLFormElement, `bk-change ${event.detail.value}`);
      }}
    >
      <bk-input
        label="Email"
        name="email"
        type="email"
        autocomplete="email"
        required
        value="you@brick.dev"
        helper="Required, and named for the form."
      ></bk-input>
      <bk-input
        label="Phone"
        name="phone"
        type="tel"
        autocomplete="tel"
        inputMode="tel"
        helper="A numeric keypad on a phone."
      ></bk-input>
      <div style="display: flex; gap: var(--bk-space-3); align-items: center;">
        <button type="submit">Submit</button>
        <bk-button type="reset" variant="secondary">Reset</bk-button>
      </div>
      <output style="font: var(--bk-font-size-sm) var(--bk-font-sans); color: var(--bk-text-muted);">
        Submit to read FormData.
      </output>
    </form>
  `,
};
