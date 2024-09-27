import {
  Direction,
  ScaleOption,
  ScaleOrderList,
  ScaleType,
} from 'common/components/Slider/type'
import { WheelOption } from 'common/types'
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ReactNode } from 'react'

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
  style?: React.CSSProperties
  onChange?: (value: number) => void
  children?: ReactNode // SliderThumb
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
  /**
   * The number of times the button has been clicked.
   */
  @property({ type: Number })
  value = 0

  render() {
    return html`
      <slot></slot>
      <button @click=${this._onClick} part="button">
        count is ${this.value}
      </button>
    `
  }

  private _onClick() {
    this.value++
  }

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'tremolo-slider': TremoloSlider
  }
}
