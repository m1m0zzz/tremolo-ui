# shared

The demo theme, as CSS Modules — one file per component.

The documentation publishes these for copying and Storybook reads the same
files, so there is one copy of the theme rather than one per consumer. Nothing
here is published to npm.

**They say what the parts look like, not where they go.** A component places
its own parts, so a theme that leaves a rule out cannot put one in the wrong
place. See `docs/core-extraction-plan.md` 9.3.
