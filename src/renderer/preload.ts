import { ipcRenderer } from 'electron'

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('new-window')
  button.onclick = () => {
    ipcRenderer.send('new-window')
  }
  const arg = process.argv.find(arg => arg.startsWith('--window-id'))
  if (arg) {
    const id = arg.split('=')[1]
    document.title = `Window ${id}`
  }
})

function getSyncronousData(): string {
  return 'Synchronous Data'
}

function getAsynchronousData(): Promise<string> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('Asynchronous Data')
    }, 1000)
  })
}

/**
 * ipcRenderer listeners do not usually return a value
 * but the e2e test will call this function to get the data
 */
ipcRenderer.addListener('get-synchronous-data', () => {
  return getSyncronousData()
})

ipcRenderer.addListener('get-asynchronous-data', async () => {
  return await getAsynchronousData()
})