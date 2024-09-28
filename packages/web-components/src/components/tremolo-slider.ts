import {
  Direction,
  gradientDirection,
  isHorizontal,
  ScaleOption,
  ScaleOrderList,
  ScaleType,
} from 'common/components/Slider/type'
import { normalizeValue } from 'common/math'
import { WheelOption } from 'common/types'
import { styleHelper } from 'common/util'
import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

export interface SliderProps {
  // required
  value: number
  min: number
  max: number

  // optional
  step?: number
  skew?: number // | SkewFunction
  length?: number | string
  thickness?: number | string
  direction?: Direction
  scale?: ['step', ScaleType] | [number, ScaleType] | ScaleOrderList[]
  scaleOption?: ScaleOption
  color?: string
  bg?: string
  bodyNoSelect?: boolean
  enableWheel?: WheelOption
  className?: string
  style?: string
  onChange?: (value: number) => void
  // children?: LitElement // SliderThumb
}

export const tagName = 'tremolo-slider'

/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement('tremolo-slider')
export class TremoloSlider extends LitElement {
  @property({ type: Number })
  value = 0

  @property({ type: Number })
  min!: number

  @property({ type: Number })
  max!: number

  @property({ type: Number })
  step?: number = 1

  @property({ type: Number })
  skew?: number = 1 // | SkewFunction

  @property()
  length: number | string = 140

  @property()
  thickness: number | string = 10

  @property({ type: String })
  direction: Direction = 'right'

  @property({ type: Array })
  scale?: ['step', ScaleType] | [number, ScaleType] | ScaleOrderList[]

  @property({ type: Object })
  scaleOption?: ScaleOption

  @property()
  color?: string = '#4e76e6'

  @property()
  bg?: string = '#eee'

  @property({ type: Boolean })
  bodyNoSelect?: boolean = true

  @property({ type: Array })
  enableWheel?: WheelOption

  @property({ attribute: 'class-name' })
  _className?: string = undefined

  // @property()
  // style?: string = undefined

  @property()
  onChange?: (value: number) => void

  @state()
  _thumbDragged = false

  @state()
  _hasChild = false

  constructor() {
    super()
    const slots = this.shadowRoot?.querySelectorAll('slot')
    console.log(slots)

    console.log('constructor')

    // if (slots) {
    //   slots[1].addEventListener("slotchange", (_e) => {
    //     const nodes = slots[1].assignedNodes();
    //     console.log(
    //       `Element in Slot "${slots[1].name}" changed to "${nodes[0].outerHTML}".`,
    //     );
    //   });
    // }
  }

  private _updateChildren(event: Event) {
    console.log('slot change')
    console.log(event)
    return
  }

  private _handleValue(event: Event) {
    console.log('handle value')
    console.log(event)
  }

  static styles = css`
    .tremolo-slider {
      display: inline-block;
      box-sizing: border-box;
      margin: 0.7rem;
      padding: 0;
      cursor: pointer;
    }

    .flex {
      display: flex;
    }

    .tremolo-slider-track {
      border-style: solid;
      border-color: #ccc;
      border-width: 2;
      position: relative;
      z-index: 1;
    }
  `

  render() {
    console.log('render')
    console.log({
      value: this.value,
      min: this.min,
      max: this.max,
      skew: this.skew,
      step: this.step,
    })

    const percent =
      normalizeValue(this.value, this.min, this.max, this.skew) * 100

    return html`
      <div
        class="${'tremolo-slider' + (ifDefined(this._className) ? ' ' + this.className : '')}"
        @mousedown="${(event: Event) => {
          this._thumbDragged = true
          this._handleValue(event)
        }}"
      >
        ${this.value}
        <div
          style="flex-direction: ${isHorizontal(this.direction ?? 'right') ? 'column' : 'row'};"
        >
          <div
            class="tremolo-slider-track"
            style="
              background: linear-gradient(to ${gradientDirection(this.direction)}, ${this.color} ${percent}%, ${this.bg} ${percent}%);
              border-radius:
                ${
                  typeof this.thickness == 'number'
                    ? `${this.thickness / 2}px`
                    : `calc(${this.thickness} / 2)`
                };
              width: ${styleHelper(isHorizontal(this.direction) ? this.length : this.thickness)};
              height: ${styleHelper(isHorizontal(this.direction) ? this.thickness : this.length)};"
          >
            <div
              class="tremolo-slider-thumb-wrapper"
            >
              <!-- <slot></slot> -->
              <div
                class"tremolo-slider-thumb"
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tremolo-slider': TremoloSlider
  }
}
