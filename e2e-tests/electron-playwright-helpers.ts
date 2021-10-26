import { ElectronApplication, Page } from 'playwright'

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
    return menuItem.click()
  }, id)
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