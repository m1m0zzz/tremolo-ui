/** @jsxImportSource @emotion/react */
import { css, Global } from "@emotion/react";
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

type SkewFunction = (x: number) => number;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  direction?: Direction;
  skew?: number; // | SkewFunction
  length?: number | string;
  thickness?: number | string;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  bodyNoSelect?: boolean;
  onChange?: (value: number) => void;
  children?: ReactNode; // SliderThumb
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  direction = 'right',
  skew = 1,
  length = 140,
  thickness = 10,
  color = "#4e76e6",
  bg = "#eee",
  style,
  bodyNoSelect = true,
  onChange,
  children
}: SliderProps){
  const [val, setVal] = useState(value);
  const baseElement = useRef<HTMLDivElement>(null);

  let defaultThumb = true;
  const percent = normalizeValue(val, min, max, skew) * 100
  const percentRev = isReversed(direction) ? 100 - percent : percent

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
        if (bodyNoSelect) document.body.classList.add("no-select")
        const n = isHorizontal(direction) ?
          normalizeValue(mouseX, x1, x2) : normalizeValue(mouseY, y1, y2)
        const v = rawValue(isReversed(direction) ? 1 - n : n, min, max, skew)
        const s = stepValue(v, step)
        setVal(s)
        onChange && onChange(s)
      }
    }
  })

  useWindowEvent('mouseup', () => {
    thumbDragged.current = false
    if (bodyNoSelect) document.body.classList.remove("no-select")
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
      <Global
        styles={{
          ".no-select": {
            userSelect: "none"
          }
        }}
      />
      <div
        ref={baseElement}
        className="tremolo-slider-base"
        css={css({
          // background: bg,
          background: `linear-gradient(to ${gradientDirection(direction)}, ${color} ${percent}%, ${bg} ${percent}%)`,
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
              width: "1.4rem",
              height: "1.4rem",
              borderRadius: "50%",
              position: "absolute",
              top: isHorizontal(direction) ? "50%" : `${percentRev}%`,
              left: isHorizontal(direction) ? `${percentRev}%` : "50%",
              translate: "-50% -50%",
              zIndex: 10,
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
