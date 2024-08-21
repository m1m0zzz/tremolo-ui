/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { Children, CSSProperties, isValidElement, ReactNode, useRef, useState } from "react";
import { normalizeValue, rawValue, stepValue } from "@/math";
import { useWindowEvent } from "@/hooks/windowEvent";

interface SliderThumbProps {

}

export function SliderThumb({}: SliderThumbProps) {
  return (
    <div></div>
  )
}

export type Horizontal = "right" | "left"
export type Vertical = "up" | "down"
export type Direction = Horizontal | Vertical

function isHorizontal(d: Direction) {
  return d == "right" || d == "left"
}

function isVertical(d: Direction) {
  return d == "up" || d == "down"
}

function isReversed(d: Direction) {
  return d == "left" || d == "up"
}

function gradientDirection(d: Direction) {
  if (d == "left" || d == "right") return d
  if (d == "up") return "top"
  if (d == "down") return "bottom"
}

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  direction?: Direction;
  skewFactor?: number;
  length?: number | string;
  thickness?: number | string;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  onChange?: (value: number) => void;
  children?: ReactNode; // SliderThumb
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  direction = 'right',
  skewFactor,
  length = 140,
  thickness = 10,
  color = "#4e76e6",
  bg = "#eee",
  style,
  onChange,
  children
}: SliderProps){
  const [val, setVal] = useState(value);
  const baseElement = useRef<HTMLDivElement>(null);

  let defaultThumb = true;
  const per = normalizeValue(val, min, max) * 100
  const percent = isReversed(direction) ? 100 - per : per

  if (children != undefined) {
    const childElements = Children.toArray(children);
    const lastElement = childElements[childElements.length - 1];
    if (isValidElement(lastElement)) {
      if (lastElement.type == SliderThumb) {
        defaultThumb = false;
      } else {
        throw new Error("children must be <SliderThumb />")
      }
    } else {
      throw new Error("children is an invalid element.")
    }
  }

  const thumbDragged = useRef(false);
  useWindowEvent('mousemove', (event) => {
    if (baseElement.current) {
      const rect = baseElement.current.getBoundingClientRect()
      const x1 = rect.left
      const y1 = rect.top
      const x2 = rect.right
      const y2 = rect.bottom
      const mouseX = event.clientX
      const mouseY = event.clientY
      // console.log(mouseX, mouseY);
      if (thumbDragged.current) {
        const n = isHorizontal(direction) ? normalizeValue(mouseX, x1, x2) : normalizeValue(mouseY, y1, y2)
        const v = rawValue(isReversed(direction) ? 1 - n : n, min, max)
        const s = stepValue(v, step)
        setVal(s)
        onChange && onChange(s)
      }
    }
  })

  useWindowEvent('mouseup', () => {
    thumbDragged.current = false
  });

  return (
    <div
      className="tremolo-slider-wrapper"
      css={css({
        display: "inline-block",
        boxSizing: "border-box",
        margin: isHorizontal(direction) ? "0.5rem 0" : "0 0.5rem",
        padding: 0,
      })}
    >
      <div
        ref={baseElement}
        className="tremolo-slider-base"
        css={css({
          // background: bg,
          background: `linear-gradient(to ${gradientDirection(direction)}, ${color} ${per}%, ${bg} ${per}%)`,
          borderRadius: typeof thickness == "number" ? thickness / 2 : `calc(${thickness} / 2)`,
          borderStyle: "solid",
          borderColor: "#ccc",
          borderWidth: 2,
          width: isHorizontal(direction) ? length : thickness,
          height: isHorizontal(direction) ? thickness : length,
          position: "relative",
          zIndex: 1,
          ...style
        })}
      >
        {defaultThumb ?
          <div
            className="tremolo-slider-thumb"
            css={css({
              background: color,
              width: "1.4em",
              height: "1.4em",
              borderRadius: "50%",
              position: "absolute",
              top: isHorizontal(direction) ? "calc(50% - 0.7em)" : `calc(-0.7em + ${percent}%)`,
              left: isHorizontal(direction) ? `calc(-0.7em + ${percent}%)` : "calc(50% - 0.7em)",
              zIndex: 100,
              cursor: "pointer"
            })}
            onMouseDown={() => {
              thumbDragged.current = true
            }}
          ></div> :
          children
        }
      </div>
    </div>
  )
}
