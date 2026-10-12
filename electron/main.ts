import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { closeDatabase, initializeDatabase } from './database/store'
import { registerPersistenceIpc } from './database/ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let unregisterPersistenceIpc: (() => void) | null = null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  const databasePath = path.join(app.getPath('userData'), 'filetrail.sqlite')
  try {
    initializeDatabase(databasePath)
  } catch (error) {
    console.error('FileTrail database initialization failed:', error)
    dialog.showErrorBox(
      'Local history could not be initialized',
      'Check that the application data folder is writable and restart FileTrail. See the application log for technical details.',
    )
    app.quit()
    return
  }

  unregisterPersistenceIpc = registerPersistenceIpc({
    databasePath,
    developmentUrl: VITE_DEV_SERVER_URL,
    rendererHtmlPath: path.join(RENDERER_DIST, 'index.html'),
  })
  createWindow()
}).catch((error: unknown) => {
  console.error('FileTrail startup failed:', error)
  dialog.showErrorBox(
    'FileTrail could not start',
    'The application failed to open. See the application log for technical details.',
  )
  app.quit()
})

app.on('before-quit', () => {
  unregisterPersistenceIpc?.()
  unregisterPersistenceIpc = null
  try {
    closeDatabase()
  } catch (error) {
    console.error('FileTrail database shutdown failed:', error)
  }
})
