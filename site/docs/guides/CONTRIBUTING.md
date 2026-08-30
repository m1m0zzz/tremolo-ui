---
title: 🦝Contributing
---

First, make sure that the program so far works correctly in your environment.
If it does not work properly, please report a bug at [Issues](https://github.com/m1m0zzz/tremolo-ui/issues/new?template=bug_report.md).

```bash npm2yarn
npm i
npm run test
npm run build:package
```

## Contribute Component

Launch Storybook.

- React

```bash npm2yarn
npm run sb -w packages/react
```

Then check the component in your browser.

## Contribute function

Make changes to the source code and test them.

```bash npm2yarn
npm run test -w packages/functions
```

To run only a specific test file, add the path as the first argument.

```bash npm2yarn
cd packages/functions
npm run test  __tests__/any.test.ts
```

In order to use the added functionality with `react` you need to build the package.

```bash npm2yarn
npm run build:package -w packages/functions
```

## Changeset

If your change should be included in a release, add a changeset.

```bash npm2yarn
npm run changeset
```

This creates a markdown file under `.changeset/`. Commit it together with your change.

Choose the bump type as follows:

- `patch` — bug fixes
- `minor` — new features, **and breaking changes** (this project stays on `0.x`, and `major` would bump it to `1.0.0`)
- `major` — do not use for now

`@tremolo-ui/functions` and `@tremolo-ui/react` are always released at the same version,
so selecting only one of them still bumps both.

Releases are automated: when a change lands on `main`, a "Version Packages" pull request is
opened (or updated). Merging that pull request publishes the packages to npm and generates
the CHANGELOG.

## Security Issues

Please see [Reporting a Vulnerability](../SECURITY)

<!-- ## Other Issue and Bugs -->
