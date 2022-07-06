import { app, BrowserWindow, ipcMain, Menu, MenuItem } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let count = 0

const createWindow = (): void => {
  count++
  let x = 20
  let y = 20
  const frontWindow = BrowserWindow.getFocusedWindow()
  if (frontWindow) {
    const bounds = frontWindow.getBounds()
    x = bounds.x + 20
    y = bounds.y + 20
  }

  // are we running tests?
  const testing = process.env.CI === 'e2e'

  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    x,
    y,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      additionalArguments: [`--window-id=${count}`],
      nodeIntegration: testing ? true : false,
      contextIsolation: testing ? false : true,
    },
    show: false,
  })

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

function initMenu() {
  const menu = Menu.getApplicationMenu()
  // create the "New Window" MenuItem
  const newWindow = new MenuItem({
    label: 'New Window',
    id: 'new-window',
    accelerator: 'CmdOrCtrl+N',
    click: () => {
      createWindow()
    },
  })
  // find the "File" MenuItem
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const filemenu = menu.items.find(item => item.role === 'filemenu')
  if (filemenu) {
    // add the "New Window" MenuItem to the beginning of the File menu
    filemenu.submenu.insert(0, newWindow)
  }
  // update the application menu
  Menu.setApplicationMenu(menu)
}

app.on('ready', () => {
  initMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/**
 * Respond to IPC request for a new window
 */
ipcMain.on('new-window', () => {
  createWindow()
})

/**
 * Return the current number of windows (via IPC)
 */
ipcMain.handle('how-many-windows', () => {
  return count
})

function mainSynchronousData() {
  return 'Main Synchronous Data'
}

async function mainAsynchronousData() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('Main Asynchronous Data')
    }, 1000)
  })
}

ipcMain.on('main-synchronous-data', (event, arg) => {
  return mainSynchronousData()
})

ipcMain.on('main-asynchronous-data', async (event, arg) => {
  return await mainAsynchronousData() 
})