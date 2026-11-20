import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import type { BrikkaTextareaResize } from './brikka-textarea.js';
import '../brikka-button/define.js';
import '../brikka-field/define.js';
import './define.js';

type Args = {
  label: string;
  description: string;
  error: string;
  value: string;
  placeholder: string;
  name: string;
  rows: number;
  resize: BrikkaTextareaResize;
  maxlength: number;
  disabled: boolean;
  required: boolean;
};

const parts = (label: string, description: string) => html`
  <brikka-field-label>${label}</brikka-field-label>
  ${description ? html`<brikka-field-description>${description}</brikka-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Textarea',
  component: 'brikka-textarea',
  args: {
    label: 'Comment',
    description: 'What you expected, and what happened instead.',
    error: '',
    value: '',
    placeholder: '',
    name: 'comment',
    rows: 4,
    resize: 'vertical',
    maxlength: 0,
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
    rows: { control: 'number' },
    resize: { control: 'select', options: ['none', 'vertical', 'auto'] },
    maxlength: { control: 'number' },
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
    rows,
    resize,
    maxlength,
    disabled,
    required,
  }) => html`
    <div style="width: 320px;">
      <brikka-field>
        <brikka-textarea
          error=${error}
          value=${value}
          placeholder=${placeholder}
          name=${name}
          rows=${rows}
          resize=${resize}
          maxlength=${maxlength}
          ?disabled=${disabled}
          ?required=${required}
        >
          ${parts(label, description)}
        </brikka-textarea>
      </brikka-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Basic: Story = {
  render: () => html`
    <div style="width: 320px;">
      <brikka-textarea name="comment" placeholder="Anything else we should know?"></brikka-textarea>
    </div>
  `,
};

export const Field: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: 'The ticket is closed.' },
};

export const Invalid: Story = {
  args: { error: 'Tell us what you expected to happen.', value: 'It does not work.' },
};

export const Button: Story = {
  render: () => html`
    <div style="display: grid; gap: var(--brikka-space-3); width: 320px;">
      <brikka-field>
        <brikka-textarea name="comment" rows="3" placeholder="Anything else we should know?">
          <brikka-field-label>Comment</brikka-field-label>
        </brikka-textarea>
      </brikka-field>
      <div>
        <brikka-button>Send</brikka-button>
      </div>
    </div>
  `,
};

export const Counter: Story = {
  args: {
    maxlength: 280,
    value:
      'The delivery arrived a day early and the box was intact, so there is nothing to report.',
  },
};

export const AutoResize: Story = {
  render: () => html`
    <div style="width: 320px;">
      <brikka-field>
        <brikka-textarea
          name="notes"
          rows="2"
          resize="auto"
          .value=${'A note that starts two rows tall.\n\nThe box grows with every line it holds, so nothing hides behind a scrollbar, and it gives the height back when the text shrinks.\n\nThat is the whole of resize="auto".'}
        >
          <brikka-field-label>Notes</brikka-field-label>
          <brikka-field-description
            >It starts at two rows and grows with the text.</brikka-field-description
          >
        </brikka-textarea>
      </brikka-field>
    </div>
  `,
};
