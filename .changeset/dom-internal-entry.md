---
'@tremolo-ui/dom': minor
'@tremolo-ui/react': minor
'@tremolo-ui/svelte': minor
'@tremolo-ui/vue': minor
---

Split `@tremolo-ui/dom` into two entries before 1.0, when everything in the
main one comes under semver.

The main entry keeps what users of the components and of this package write:
the `create*` interactions, the values and types that appear in props (the
default input options, `SHORTCUTS`, the mappings, `XY` and so on), and the
geometry a part of your own needs to draw (`KNOB_VIEWBOX_SIZE`, `knobArcPath`,
`knobArcRadius`, `knobAngles`, `valuePercent`, `notePosition`).

What only the wrappers use moves to `@tremolo-ui/dom/internal`, which is not
covered by semver: the number input's text and draft handling
(`parseNumberText`, `numberSpan`, `commitNumberInputText`,
`nudgeNumberInput`, ...), `createStepperDrag`, the key and wheel direction
helpers, `applyDelta` and `selectModifier`, the piano layout apart from
`notePosition`, `clampPoint` / `POINT_AXIS` / `POINTS_EDITOR_DEFAULT_*`,
`sliderMarks`, `partitionByAccept`, `replaceOptions`, `checkSteps`,
`cssLength`, `visuallyHiddenStyle` and `toXY`.

The wrappers now depend on `@tremolo-ui/dom` at the exact version rather than
a caret range, since they use the internal entry.
