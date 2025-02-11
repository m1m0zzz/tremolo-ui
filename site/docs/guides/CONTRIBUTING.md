---
title: Contributing
---

# 🦝Contribution Guide

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

- Web Component

```bash npm2yarn
npm run sb -w packages/web-components
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

In order to use the added functionality with `react`, `web-components`, you need to build the package.

```bash npm2yarn
npm run build:package -w packages/functions
```

## Security Issues

Please see [Reporting a Vulnerability](../SECURITY)


## Other Issue and Bugs
