import { noteNumber } from "@tremolo-ui/functions"
import { Piano } from "@tremolo-ui/react"

export default function ControllableSimplePiano() {
  return (
    <div>
      <Piano
        noteRange={{ first: noteNumber('C3'), last: noteNumber('B3') }}
      ></Piano>
    </div>
  )
}
