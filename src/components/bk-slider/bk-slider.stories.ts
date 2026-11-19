import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import '../bk-field/define.js';
import './define.js';
import type { BkSlider, BkSliderOrientation } from './bk-slider.js';

type Args = {
  label: string;
  description: string;
  error: string;
  name: string;
  value: number;
  valueEnd: number | null;
  min: number;
  max: number;
  step: number;
  orientation: BkSliderOrientation;
  valueText: string;
  valueTextEnd: string;
  disabled: boolean;
};

const parts = (label: string, description: string) => html`
  <bk-field-label>${label}</bk-field-label>
  ${description ? html`<bk-field-description>${description}</bk-field-description>` : ''}
`;

const meta: Meta<Args> = {
  title: 'Form/Slider',
  component: 'bk-slider',
  args: {
    label: 'Volume',
    description: '',
    error: '',
    name: 'volume',
    value: 40,
    valueEnd: null,
    min: 0,
    max: 100,
    step: 1,
    orientation: 'horizontal',
    valueText: '',
    valueTextEnd: '',
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    name: { control: 'text' },
    value: { control: 'number' },
    valueEnd: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    valueText: { control: 'text' },
    valueTextEnd: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: ({
    label,
    description,
    error,
    name,
    value,
    valueEnd,
    min,
    max,
    step,
    orientation,
    valueText,
    valueTextEnd,
    disabled,
  }) => html`
    <div style="width: 320px;">
      <bk-field>
        <bk-slider
          error=${error}
          name=${name}
          .value=${value}
          .valueEnd=${valueEnd}
          min=${min}
          max=${max}
          step=${step}
          orientation=${orientation}
          value-text=${valueText}
          value-text-end=${valueTextEnd}
          ?disabled=${disabled}
        >
          ${parts(label, description)}
        </bk-slider>
      </bk-field>
    </div>
  `,
};

export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {};

export const Range: Story = {
  args: { label: 'Price', value: 20, valueEnd: 80 },
};

export const Vertical: Story = {
  args: { label: 'Volume', orientation: 'vertical' },
};

/* The readout follows `bk-change`, and the value text follows the value: a thumb that has
 * moved to 24 is announced as "24 °C", never as a stale "21 °C" and never as a bare 24. */
export const Controlled: Story = {
  args: {
    label: 'Temperature',
    name: 'temperature',
    value: 21,
    min: 16,
    max: 30,
    valueText: '21 °C',
  },
  render: ({ label, value, min, max }) => {
    let readout: HTMLElement | null = null;

    const say = (next: number) => {
      if (readout) readout.textContent = `${next} °C`;
    };

    return html`
      <div style="width: 320px;">
        <bk-field>
          <bk-slider
            name="temperature"
            .value=${value}
            min=${min}
            max=${max}
            value-text="${value} °C"
            @bk-change=${(event: Event) => {
              const slider = event.currentTarget as BkSlider;
              const detail = (event as CustomEvent<{ value: number }>).detail;
              slider.valueText = `${detail.value} °C`;
              say(detail.value);
            }}
          >
            ${parts(label, 'The readout under the track follows bk-change.')}
          </bk-slider>
          <p ${ref((element) => (readout = element instanceof HTMLElement ? element : null))}>
            ${value} °C
          </p>
        </bk-field>
      </div>
    `;
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
