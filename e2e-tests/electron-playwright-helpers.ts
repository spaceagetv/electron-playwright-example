import path from 'path'
import fs from 'fs'
import { ElectronApplication, Page } from 'playwright'
import type { PageFunctionOn } from 'playwright-core/types/structs'
import * as ASAR from 'asar'

/**
 * Execute the .click() method on the element with the given id.
 * @returns Promise<void> - resolves with the result of the click() method - probably `undefined`
 */
export function clickMenuItemById(
  electronApp: ElectronApplication,
  id: string
): Promise<unknown> {
  return electronApp.evaluate(({ Menu }, menuId) => {
    const menu = Menu.getApplicationMenu()
    const menuItem = menu.getMenuItemById(menuId)
    if (menuItem) {
      return menuItem.click()
    } else {
      throw new Error(`Menu item with id ${menuId} not found`)
    }
  }, id)
}

type MenuItemKey = keyof Electron.MenuItem

export function getMenuItemAttribute(
  electronApp: ElectronApplication,
  menuId: string,
  attribute: MenuItemKey
): Promise<unknown> {
  const resultPromise = electronApp.evaluate(
    ({ Menu }, { menuId, attribute }) => {
      const menu = Menu.getApplicationMenu()
      const menuItem = menu.getMenuItemById(menuId)
      if (menuItem) {
        return menuItem[attribute]
      } else {
        throw new Error(`Menu item with id ${menuId} not found`)
      }
    },
    { menuId, attribute }
  )
  return resultPromise
}

export async function waitForMenuItem(
  electronApp: ElectronApplication,
  id: string
) {
  await electronWaitForFunction(
    electronApp,
    ({ Menu }, id) => {
      const menu = Menu.getApplicationMenu()
      return !!menu.getMenuItemById(id)
    },
    id
  )
}

/**
 * Send an ipcRenderer.send() from a given window.
 * Note: nodeIntegration must be true and contextIsolation must be false
 * in the webPreferences for this window
 * @returns Promise<unknown> - resolves with the result of the function
 */
export function ipcRendererSend(
  window: Page,
  message: string,
  ...args: unknown[]
): Promise<unknown> {
  return window.evaluate(
    ({ message, args }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ipcRenderer } = require('electron')
      return ipcRenderer.send(message, ...args)
    },
    { message, args }
  )
}

/**
 * Send an ipcRenderer.invoke() from a given window.
 * Note: nodeIntegration must be true and contextIsolation must be false
 * in the webPreferences for this window
 * @returns Promise<unknown> - resolves with the result of the function
 */
export function ipcRendererInvoke(
  window: Page,
  message: string,
  ...args: unknown[]
): Promise<unknown> {
  return window.evaluate(
    async ({ message, args }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ipcRenderer } = require('electron')
      return await ipcRenderer.invoke(message, ...args)
    },
    { message, args }
  )
}

/**
 * Emit an ipcMain message from the main process.
 * @returns Promise<boolean> - true if there were listeners for this message
 */
export function ipcMainEmit(
  electronApp: ElectronApplication,
  message: string,
  ...args: unknown[]
): Promise<boolean> {
  return electronApp.evaluate(
    ({ ipcMain }, { message, args }) => {
      return ipcMain.emit(message, ...args)
    },
    { message, args }
  )
}

export function ipcMainInvokeFirstListener(
  electronApp: ElectronApplication,
  message: string,
  ...args: unknown[]
): Promise<unknown> {
  return electronApp.evaluate(
    ({ ipcMain }, { message, args }) => {
      if (ipcMain.listenerCount(message) > 0) {
        return ipcMain.listeners(message)[0](...args)
      } else {
        throw new Error(`No listeners for message ${message}`)
      }
    },
    { message, args }
  )
}

/**
 * Wait for a function to evaluate to true in the main Electron process
 * This function is to `electronApp.evaluate()`
 * as `page.waitForFunction()` is `page.evaluate()`
 * @param electronApp
 * @param fn - the function to evaluate in the main process - must return a boolean
 * @param arg - an argument to pass to the function
 */
export async function electronWaitForFunction<R, Arg>(
  electronApp: ElectronApplication,
  fn: PageFunctionOn<typeof Electron.CrossProcessExports, Arg, R>,
  arg?: Arg
): Promise<void> {
  while (!(await electronApp.evaluate(fn, arg))) {
    // wait 100ms before trying again
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * Parses the `out` directory to find the latest build.
 * Use `npm run package` (or similar) to build your app prior to testing.
 * @returns path to the most recently modified build directory
 */
export function findLatestBuild(): string {
  // root of your project
  const rootDir = path.resolve('./')
  // directory where the builds are stored
  const outDir = path.join(rootDir, 'out')
  // list of files in the out directory
  const builds = fs.readdirSync(outDir)
  const platforms = [
    'win32',
    'win',
    'windows',
    'darwin',
    'mac',
    'macos',
    'osx',
    'linux',
    'ubuntu',
  ]
  const latestBuild = builds
    .map((fileName) => {
      // make sure it's a directory with "-" delimited platform in its name
      const stats = fs.statSync(path.join(outDir, fileName))
      const isBuild = fileName
        .toLocaleLowerCase()
        .split('-')
        .some((part) => platforms.includes(part))
      if (stats.isDirectory() && isBuild) {
        return {
          name: fileName,
          time: fs.statSync(path.join(outDir, fileName)).mtimeMs,
        }
      }
    })
    .sort((a, b) => b.time - a.time)
    .map((file) => {
      if (file) {
        return file.name
      }
    })[0]
  if (!latestBuild) {
    throw new Error('No build found in out directory')
  }
  return path.join(outDir, latestBuild)
}

type Architecture = 'x64' | 'x32' | 'arm64'
export interface ElectronAppInfo {
  /** Path to the app's executable file */
  executable: string
  /** Path to the app's main (JS) file */
  main: string
  /** Name of the app */
  name: string
  /** Resources directory */
  resourcesDir: string
  /** True if the app is using asar */
  asar: boolean
  /** OS platform */
  platform: 'darwin' | 'win32' | 'linux'
  arch: Architecture
}

/**
 * Given a directory containing an Electron app build,
 * return the path to the app's executable and the path to the app's main file.
 */
export function parseElectronApp(buildDir: string): ElectronAppInfo {
  console.log(`Parsing Electron app in ${buildDir}`)
  let platform: string
  if (buildDir.endsWith('.app')) {
    buildDir = path.dirname(buildDir)
    platform = 'darwin'
  }
  if (buildDir.endsWith('.exe')) {
    buildDir = path.dirname(buildDir)
    platform = 'win32'
  }

  const baseName = path.basename(buildDir).toLowerCase()
  if (!platform) {
    // parse the directory name to figure out the platform
    if (baseName.includes('win')) {
      platform = 'win32'
    }
    if (
      baseName.includes('linux') ||
      baseName.includes('ubuntu') ||
      baseName.includes('debian')
    ) {
      platform = 'linux'
    }
    if (
      baseName.includes('darwin') ||
      baseName.includes('mac') ||
      baseName.includes('osx')
    ) {
      platform = 'darwin'
    }
  }

  if (!platform) {
    throw new Error(`Platform not found in directory name: ${baseName}`)
  }

  let arch: Architecture
  if (baseName.includes('x32') || baseName.includes('i386')) {
    arch = 'x32'
  }
  if (baseName.includes('x64')) {
    arch = 'x64'
  }
  if (baseName.includes('arm64')) {
    arch = 'arm64'
  }

  let executable: string
  let main: string
  let name: string
  let asar: boolean
  let resourcesDir: string

  if (platform === 'darwin') {
    // MacOS Structure
    // <buildDir>/
    //   <appName>.app/
    //     Contents/
    //       MacOS/
    //        <appName> (executable)
    //       Info.plist
    //       PkgInfo
    //       Resources/
    //         electron.icns
    //         file.icns
    //         app.asar (asar bundle) - or -
    //         app
    //           package.json
    //           (your app structure)

    const list = fs.readdirSync(buildDir)
    const appBundle = list.find((fileName) => {
      return fileName.endsWith('.app')
    })
    const appDir = path.join(buildDir, appBundle, 'Contents', 'MacOS')
    const appName = fs.readdirSync(appDir)[0]
    executable = path.join(appDir, appName)

    resourcesDir = path.join(buildDir, appBundle, 'Contents', 'Resources')
    const resourcesList = fs.readdirSync(resourcesDir)
    asar = resourcesList.includes('app.asar')

    let packageJson: { main: string; name: string }
    if (asar) {
      const asarPath = path.join(resourcesDir, 'app.asar')
      packageJson = JSON.parse(
        ASAR.extractFile(asarPath, 'package.json').toString('utf8')
      )
      main = path.join(asarPath, packageJson.main)
    } else {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(resourcesDir, 'app', 'package.json'), 'utf8')
      )
      main = path.join(resourcesDir, 'app', packageJson.main)
    }
    name = packageJson.name
  } else if (platform === 'win32') {
    // Windows Structure
    // <buildDir>/
    //   <appName>.exe (executable)
    //   resources/
    //     app.asar (asar bundle) - or -
    //     app
    //       package.json
    //       (your app structure)

    const list = fs.readdirSync(buildDir)
    const exe = list.find((fileName) => {
      return fileName.endsWith('.exe')
    })
    executable = path.join(buildDir, exe)

    resourcesDir = path.join(buildDir, 'resources')
    const resourcesList = fs.readdirSync(resourcesDir)
    asar = resourcesList.includes('app.asar')

    let packageJson: { main: string; name: string }

    if (asar) {
      const asarPath = path.join(resourcesDir, 'app.asar')
      packageJson = JSON.parse(
        ASAR.extractFile(asarPath, 'package.json').toString('utf8')
      )
      main = path.join(asarPath, packageJson.main)
    } else {
      packageJson = JSON.parse(
        fs.readFileSync(path.join(resourcesDir, 'app', 'package.json'), 'utf8')
      )
      main = path.join(resourcesDir, 'app', packageJson.main)
    }
    name = packageJson.name
  } else {
    /**  @todo add support for linux */
    throw new Error(`Platform not supported: ${platform}`)
  }
  return {
    executable,
    main,
    asar,
    name,
    platform,
    resourcesDir,
    arch,
  }
}
