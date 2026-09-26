import { computed, defineComponent, h, reactive } from 'vue'

import { type PointPosition } from '@tremolo-ui/dom'

import {
  PointsEditor,
  PointsEditorBackground,
  PointsEditorContainer,
  PointsEditorPoint,
  PointsEditorSelectionBox,
} from '../src'

import type { Meta, StoryObj } from '@storybook/vue3-vite'

import pointsEditorTheme from 'shared/css/PointsEditor.module.css'

const meta = {
  title: 'Components/PointsEditor',
  component: PointsEditor,
  args: { selectable: true },
} satisfies Meta<typeof PointsEditor>

export default meta
type Story = StoryObj<typeof meta>

/** An envelope-like set of points that can be selected and moved together. */
export const Basic: Story = {
  render: (args) =>
    defineComponent({
      setup() {
        const points = reactive<Record<string, PointPosition>>({
          a: { x: 0.1, y: 0.8 },
          b: { x: 0.3, y: 0.2 },
          c: { x: 0.6, y: 0.4 },
          d: { x: 0.9, y: 0.8 },
        })
        const path = computed(() =>
          Object.values(points)
            .map(
              ({ x, y }, i) => `${i === 0 ? 'M' : 'L'} ${x * 200} ${y * 100}`,
            )
            .join(' '),
        )
        return () =>
          h(
            PointsEditor,
            {
              class: pointsEditorTheme.root,
              style: { width: '400px', height: '200px' },
              ...args,
            },
            () => [
              h(PointsEditorBackground, null, () =>
                h(
                  'svg',
                  {
                    viewBox: '0 0 200 100',
                    preserveAspectRatio: 'none',
                    width: '100%',
                    height: '100%',
                  },
                  h('path', {
                    d: path.value,
                    fill: 'none',
                    stroke: 'currentColor',
                  }),
                ),
              ),
              h(PointsEditorContainer, null, () => [
                ...Object.keys(points).map((id) =>
                  h(PointsEditorPoint, {
                    key: id,
                    id,
                    class: pointsEditorTheme.point,
                    modelValue: points[id],
                    'onUpdate:modelValue': (v: PointPosition) => {
                      points[id] = v
                    },
                    ariaLabel: { x: `${id} time`, y: `${id} level` },
                  }),
                ),
                h(PointsEditorSelectionBox, {
                  class: pointsEditorTheme.selectionBox,
                }),
              ]),
            ],
          )
      },
    }),
}
