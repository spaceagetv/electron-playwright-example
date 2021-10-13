import path from 'path'
import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  const main = path.join(__dirname, '..', '.webpack', 'main', 'index.js')
  // set the CI environment variable to true
  process.env.CI = '1'
  electronApp = await electron.launch({
    args: [main],
  })
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page

test('renders the first page', async () => {
  page = await electronApp.firstWindow()
  await page.waitForSelector('h1')
  const text = await page.$eval('h1', (el) => el.textContent)
  expect(text).toBe('Hello World!')
  const title = await page.title()
  expect(title).toBe('Window 1')
})

test(`"create new window" button exists`, async () => {
  expect(await page.$('#new-window')).toBeTruthy()
})

test('click the button to open new window', async () => {
  await page.click('#new-window')
  const newPage = await electronApp.waitForEvent('window')
  expect(newPage).toBeTruthy()
  page = newPage
})

test('window 2 has correct title', async () => {
  const title = await page.title()
  expect(title).toBe('Window 2')
})

test('trigger IPC listener via main process', async () => {
  electronApp.evaluate(({ ipcMain }) => {
    ipcMain.emit('new-window')
  })
  const newPage = await electronApp.waitForEvent('window')
  expect(newPage).toBeTruthy()
  expect(await newPage.title()).toBe('Window 3')
  page = newPage
})

test('send IPC message from renderer', async () => {
  // evaluate this script in render process
  // requires webPreferences.nodeIntegration true and contextIsolation false
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron').ipcRenderer.send('new-window')
  })
  const newPage = await electronApp.waitForEvent('window')
  expect(newPage).toBeTruthy()
  expect(await newPage.title()).toBe('Window 4')
  page = newPage
})

test('receive IPC invoke/handle via renderer', async () => {
  // evaluate this script in render process and collect the result
  const result = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke('how-many-windows')
  })
  expect(result).toBe(4)
})