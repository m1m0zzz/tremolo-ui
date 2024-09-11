import { ElementType, ComponentPropsWithoutRef, useState } from 'react'

import { isEmpty } from '../util'

import { UserActionPseudoProps } from './pseudo'

interface Props<T extends ElementType> {
  as?: T
}

export function BaseElement<T extends ElementType = 'div'>(
  props: Props<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof Props<T>> &
    UserActionPseudoProps,
) {
  const [overrideStyle, setOverrideStyle] = useState<UserActionPseudoProps>({})

  const {
    children,
    as: Component = 'div',
    style,
    onFocus,
    onBlur,
    onMouseDown,
    onMouseUp,
    onMouseOver,
    onMouseLeave,
    _active,
    _focus,
    _hover,
    ...attributes
  } = props
  return (
    <Component
      style={{
        ...style,
        ...overrideStyle._active,
        ...overrideStyle._hover,
        ...overrideStyle._focus,
      }}
      onFocus={(event) => {
        console.log('base el focus!')
        if (_focus && !isEmpty(_focus)) {
          setOverrideStyle({ ...overrideStyle, _focus: _focus })
        }
        if (onFocus) onFocus(event)
      }}
      onBlur={(event) => {
        // pseudo
        if (_focus && !isEmpty(_focus)) {
          setOverrideStyle({ ...overrideStyle, _focus: {} })
        }
        if (onBlur) onBlur(event)
      }}
      onMouseOver={(event) => {
        if (_hover && !isEmpty(_hover))
          setOverrideStyle({ ...overrideStyle, _hover: _hover })
        if (onMouseOver) onMouseOver(event)
      }}
      onMouseLeave={(event) => {
        if (_hover && !isEmpty(_hover)) {
          setOverrideStyle({ ...overrideStyle, _hover: {} })
        }
        if (onMouseLeave) onMouseLeave(event)
      }}
      onMouseDown={(event) => {
        if (_active && !isEmpty(_active)) {
          setOverrideStyle({ ...overrideStyle, _active: _active })
        }
        if (onMouseDown) onMouseDown(event)
      }}
      onMouseUp={(event) => {
        if (_active && !isEmpty(_active)) {
          setOverrideStyle({ ...overrideStyle, _active: {} })
        }
        if (onMouseUp) onMouseUp(event)
      }}
      {...attributes}
    >
      {children}
    </Component>
  )
}
