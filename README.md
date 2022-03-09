# electron-playwright-example

Example of multi-window [Playwright](https://playwright.dev) testing with [Electron](https://www.electronjs.org)

```shell
git clone https://github.com/spaceagetv/electron-playwright-example.git
cd electron-playwright-example
npm install
npm run e2e
```

## 🚀 electron-playwright-helpers!!

The library of helper functions for this project has been broken out into its own NPM package,
which you can install in your own project and use when writing your own tests. Find the
**electron-playwright-helpers** library [on GitHub](https://github.com/spaceagetv/electron-playwright-helpers) and [NPM](https://www.npmjs.com/package/electron-playwright-helpers).

## Notes

This example uses Electron Forge configured to build with Webpack. Since we're testing the .webpack code, this test does a `npm run package` to prepare the code before each `npm run e2e`.

Note also that `nodeIntegration` is enabled and `contextIsolation` is disabled when the `CI` environment variable is set to "1". This allows us to maintain recommended Electron security for our distributed app, while allowing us greater access while testing.

Find the tests in the `e2e-tests` directory.

**Tests:**

1. The first window is loaded
2. Button exists on the page
3. Clicking the button opens a new window
4. Check the title of the new window
5. Trigger an IPC listener directly in the main process
6. Send an IPC message from the renderer
7. Receive IPC invoke/handle via renderer
8. Click a menu item in the main process
9. Make sure two screenshots match one another

