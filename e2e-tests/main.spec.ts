import path from 'path'
import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { test, expect } from '@playwright/test'

let electronApp: ElectronApplication

// const forgePath = require.resolve('@electron-forge/cli/dist/electron-forge.js')

test.beforeAll(async () => {
  const main = path.join(__dirname, '..', '.webpack', 'main', 'index.js')
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
