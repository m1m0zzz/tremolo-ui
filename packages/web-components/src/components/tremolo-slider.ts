import {
  Direction,
  gradientDirection,
  isHorizontal,
  isReversed,
  ScaleOption,
  ScaleOrderList,
  ScaleType,
} from 'functions/components/Slider/type'
import { clamp, normalizeValue, rawValue, stepValue } from 'functions/math'
import { WheelOption } from 'functions/types'
import { isEmpty, styleHelper } from 'functions/util'
import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ifDefined } from 'lit/directives/if-defined.js'

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

  // @property()
  // children?: string

  @state()
  _thumbDragged = false

  constructor() {
    super()
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

  private _handleValue(event: MouseEvent) {
    // console.log('mouse move', this._thumbDragged)
    if (!this._thumbDragged) return
    if (this.bodyNoSelect) document.body.classList.add('no-select')
    const trackElement = this.renderRoot.querySelector('.tremolo-slider-track')
    if (!trackElement) return
    const {
      left: x1,
      top: y1,
      right: x2,
      bottom: y2,
    } = trackElement.getBoundingClientRect()
    const mouseX = event.clientX
    const mouseY = event.clientY
    const n = isHorizontal(this.direction)
      ? normalizeValue(mouseX, x1, x2)
      : normalizeValue(mouseY, y1, y2)
    const v = rawValue(
      isReversed(this.direction) ? 1 - n : n,
      this.min,
      this.max,
      this.skew,
    )
    const v2 = clamp(stepValue(v, this.step ?? 1), this.min, this.max)
    this.value = v2
    if (this.onChange) this.onChange(v2)
  }

  private _handleWheel(event: WheelEvent) {
    console.log(this.enableWheel)
    if (!this.enableWheel) return
    event.preventDefault()
    let x = event.deltaY > 0 ? this.enableWheel[1] : -this.enableWheel[1]
    if (isReversed(this.direction) || isHorizontal(this.direction)) x *= -1
    let v
    if (this.enableWheel[0] == 'normalized') {
      const n = normalizeValue(this.value, this.min, this.max, this.skew)
      v = rawValue(n + x, this.min, this.max, this.skew)
    } else {
      v = this.value + x
    }
    const changedValue = clamp(stepValue(v, this.step ?? 1), this.min, this.max)
    this.value = changedValue
    if (this.onChange) this.onChange(changedValue)
  }

  private _handleMouseUp() {
    // console.log("mouse up")
    this._thumbDragged = false
  }

  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('mousemove', (e) => {
      this._handleValue(e)
    })
    window.addEventListener('mouseup', () => {
      this._handleMouseUp()
    })
  }

  disconnectedCallback() {
    window.removeEventListener('mousemove', (e) => {
      this._handleValue(e)
    })
    window.removeEventListener('mouseup', () => {
      this._handleMouseUp()
    })
    super.disconnectedCallback()
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

    .tremolo-slider-thumb-wrapper {
      width: fit-content;
      height: fit-content;
      position: absolute;
      translate: -50% -50%;
      z-index: 100;
    }

    .tremolo-slider-thumb {
      width: 1.4rem;
      height: 1.4rem;
      border-radius: 50%;
    }
  `

  render() {
    console.log('render')
    console.log(this.enableWheel)

    const percent =
      normalizeValue(this.value, this.min, this.max, this.skew) * 100
    const percentRev = isReversed(this.direction) ? 100 - percent : percent

    // const slot = this.shadowRoot?.querySelector('slot');
    // const slottedChildren = slot?.assignedElements({flatten: true});

    // const slots = this.shadowRoot?.querySelectorAll("slot");
    // const nodes = slots && slots[1].assignedNodes();

    return html`
      <div
        class="${'tremolo-slider' +
        (ifDefined(this._className) ? ' ' + this.className : '')}"
        @mousedown="${(event: MouseEvent) => {
          console.log('mouse down')
          this._thumbDragged = true
          this._handleValue(event)
        }}"
        @mousewheel="${(event: WheelEvent) => {
          console.log('scroll')
          this._handleWheel(event)
        }}"
      >
        ${this.value}
        <div
          style="flex-direction: ${isHorizontal(this.direction ?? 'right')
            ? 'column'
            : 'row'};"
        >
          <div
            class="tremolo-slider-track"
            style="
              background: linear-gradient(to ${gradientDirection(
              this.direction,
            )}, ${this.color} ${percent}%, ${this.bg} ${percent}%);
              border-radius:
                ${typeof this.thickness == 'number'
              ? `${this.thickness / 2}px`
              : `calc(${this.thickness} / 2)`};
              width: ${styleHelper(
              isHorizontal(this.direction) ? this.length : this.thickness,
            )};
              height: ${styleHelper(
              isHorizontal(this.direction) ? this.thickness : this.length,
            )};"
          >
            <div
              class="tremolo-slider-thumb-wrapper"
              style="
              top: ${isHorizontal(this.direction) ? '50%' : `${percentRev}%`};
              left: ${isHorizontal(this.direction) ? `${percentRev}%` : '50%'};"
            >
              <!-- TODO: Enable <slot> even for text only. -->
              ${this.children && !isEmpty(this.children)
                ? html`<slot></slot>`
                : html`<div
                    class="tremolo-slider-thumb"
                    style="background: ${this.color};"
                  ></div>`}
            </div>
          </div>
        </div>
      </div>
    `
  }
  // ${nodes && !isEmpty(nodes) ? nodes : thumb}
}

declare global {
  interface HTMLElementTagNameMap {
    'tremolo-slider': TremoloSlider
  }
}
