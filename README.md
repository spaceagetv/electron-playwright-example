# electron-playwright-example

Example of multi-window [Playwright](https://playwright.dev) testing with [Electron](https://www.electronjs.org)

```shell
git clone https://github.com/spaceagetv/electron-playwright-example.git
cd electron-playwright-example
npm install
npm run e2e
```

This example uses Electron Forge configured to build with Webpack. Since we're testing the .webpack code, this test does a `npm run package` to prepare the code before each `npm run e2e`.
