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