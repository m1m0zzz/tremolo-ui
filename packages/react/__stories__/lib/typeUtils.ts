// import { Meta } from "@storybook/react"
// import { ComponentType } from "react"

export const InputEventOptionString = `['normalized' | 'raw', number]`

export const inputEventOptionType = {
  summary: `InputEventOption | null`,
  detail: `${InputEventOptionString} | null`,
}

export const sizesOptionType = {
  summary: 'number | `${number}%`',
}

// export function defaultMeta(name: string, component: any) {
//   return ({
//     title: `React/Components/${name}`,
//     component: component,
//     argTypes: {
//       value: {
//         control: false,
//       },
//       children: {
//         control: false,
//       },
//     }
//   } satisfies Meta<typeof component>)
// }
