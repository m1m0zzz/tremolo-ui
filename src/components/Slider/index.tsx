/** @jsxImportSource @emotion/react */
import { css, Global } from "@emotion/react";
import React, { Children, CSSProperties, isValidElement, ReactNode, useRef, useState } from "react";
import { clamp, normalizeValue, rawValue, stepValue } from "@/math";
import { useEventListener } from "@/hooks/useEventListener";

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

type SkewFunction = (x: number) => number
type WheelOption = ["normalized" | "raw", number]

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
  cursor?: string;
  style?: CSSProperties;
  bodyNoSelect?: boolean;
  enableWheel?: WheelOption;
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
  cursor = "pointer",
  style,
  bodyNoSelect = true,
  enableWheel,
  onChange,
  children
}: SliderProps){
  const wrapperElement = useRef<HTMLDivElement>(null);
  const baseWrapperElement = useRef<HTMLDivElement>(null);
  let defaultThumb = true;
  const percent = normalizeValue(value, min, max, skew) * 100
  const percentRev = isReversed(direction) ? 100 - percent : percent

  if (children != undefined) {
    const childElements = Children.toArray(children);
    const lastElement = childElements[childElements.length - 1];
    if (isValidElement(lastElement)) {
      defaultThumb = false;
      if (lastElement.type == SliderThumb) {
      } else {
        // throw new Error("children must be <SliderThumb />")
      }
    } else {
      throw new Error("children is an invalid element.")
    }
  }

  const thumbDragged = useRef(false);
  const handleValue = (event: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (baseWrapperElement.current && thumbDragged.current) {
      if (bodyNoSelect) document.body.classList.add("no-select")
      const {
        left: x1,
        top: y1,
        right: x2,
        bottom: y2
      } = baseWrapperElement.current.getBoundingClientRect()
      const mouseX = event.clientX
      const mouseY = event.clientY
      const n = isHorizontal(direction) ?
        normalizeValue(mouseX, x1, x2) : normalizeValue(mouseY, y1, y2)
      const v = rawValue(isReversed(direction) ? 1 - n : n, min, max, skew)
      const s = stepValue(v, step)
      onChange && onChange(s)
    }
  }

  useEventListener(window, 'mousemove', (event) => {
    handleValue(event)
  })

  useEventListener(window, 'mouseup', () => {
    thumbDragged.current = false
    if (bodyNoSelect) document.body.classList.remove("no-select")
  });

  useEventListener(wrapperElement.current, 'wheel', (event) => {
    if (enableWheel) {
      event.preventDefault()
      let x = event.deltaY > 0 ? enableWheel[1] : -enableWheel[1]
      if (isReversed(direction)) x *= -1
      let v;
      if (enableWheel[0] == "normalized") {
        const n = normalizeValue(value, min, max, skew)
        v = rawValue(n + x, min, max, skew)
      } else {
        v = value + x
      }
      onChange && onChange(stepValue(clamp(v, min, max), step))
    }
  }, { passive: false });

  return (
    <div
      ref={wrapperElement}
      className="tremolo-slider-wrapper"
      css={css({
        display: "inline-block",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
      })}
      onMouseDown={(event) => {
        thumbDragged.current = true
        handleValue(event)
      }}
    >
      <Global
        styles={{
          ".no-select": {
            userSelect: "none"
          }
        }}
      />
      <div
        ref={baseWrapperElement}
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
          margin: "0.7rem",
          position: "relative",
          zIndex: 1,
          cursor: cursor,
          ...style
        })}
      >
        <div
          className="tremolo-slider-thumb-wrapper"
          css={css({
            width: "fix-content",
            height: "fix-content",
            position: "absolute",
            top: isHorizontal(direction) ? "50%" : `${percentRev}%`,
            left: isHorizontal(direction) ? `${percentRev}%` : "50%",
            translate: "-50% -50%",
            zIndex: 10,
            cursor: cursor
          })}
        >
          {children ?
            children :
            <div
              className="tremolo-slider-thumb"
              css={css({
                background: color,
                width: "1.4rem",
                height: "1.4rem",
                borderRadius: "50%",
              })}
            ></div>
          }
        </div>
      </div>
    </div>
  )
}
