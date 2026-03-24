/**
 * Electron 主进程入口
 */

import { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { selectionService } from './services/SelectionService'
import { getSetting, setSetting, getAllSettings } from './services/ConfigService'
import { fetchChatCompletion, abortCompletion } from './services/LLMService'
import { IpcChannel } from '@shared/IpcChannel'

// 启用高 DPI 支持 (Windows)
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', '1')
}

// 主窗口和托盘
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

// 预生成的图标数据 (PNG format)
// 托盘图标 16x16 - 与主界面 logo 一致，含 Sparkles 图标
const TRAY_ICON_16 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAs0lEQVR42mNgoAm4skqRJHHiFeBTBxQ8vijt/7EFyf+Pzk34f2RW7P/DM6L+H54a8f/QpND/BycE/T/Q6/8fryGENO/v8vmP10nomtk4BMAYpnlfh+d/vF5BtxlmAEzz3la3/3jDBt3ZMANgmvc2uRAwAMnZuDBeA9ADDKYJZPOeBsf/u2vt8BuArBnkbJgBMM27qqzxxwKyZpCfYQbANO+ssPhPVsKjLP2TmpypYxkJuREAFTDP4qckPNgAAAAASUVORK5CYII='

// 托盘图标 32x32 (高 DPI)
const TRAY_ICON_32 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACAElEQVR42tWX2UrDQBRA8yQ+BJrHvBWhEMgPqKioKCoqKiqKioqK+gfiggsuuKDiggsuuOCTf9B9b3/A/7lO20zN0pncaKp14NIkneTcudvMFYR/NT7eJSIqEYWITMRDRNR+Ze25mp/nMthLpIYIdr6gzfe6sWLfD7/h+55FCisQXbKgmP+egxeU7NsiZF8XIPMyD5nnOcg8zUL6cQbSD9OQup+C1N0kpG4nIHkzDsnrMUhcjULicgQSF8MQPx+C+NkgxE4HwOQWBbVyt+Cxk36IHfeBJTZsfC66CY8e9UIJd0jsgCHDTXj0sAdYHGuqacNNeOSgG5ipbYl6qgASXlUt5YUHj+x3ATPLTL4v3mJXThXgwSN7ncApVhK9UfX/OYEXlWDAw7sdwAl6tZj3+ucYn5sVYMHDO+08BRR6IRsUQAScRQEGPLTdxlNAphcegwJIs7NEDw9ttfIU8HwVB91gRbtTycFDmy3A3SNKWQBrdiZYW3kOHtxoRlnAEAOYImNndgoPrjehYsCQBZgKZ1GAAQ+sNaKywFAHMOXVzuwUHlhtQNUBQyW0g9NUw8ADK/WISmiqzRh4zufmaC8F9y/XIfYC0+6EgfN8rof7l2qRu6Fpny4z3Mc9EZW5txD5p2Qn53/ncAF3Oi50OOWAK05e+MO+oCI6o4roDX+hO/4E2ClVuVfMlkkAAAAASUVORK5CYII='

// 创建托盘图标
function createTrayIcon(): nativeImage {
  // Windows 需要使用 PNG 数据
  const icon16 = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_16}`)
  const icon32 = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_32}`)

  // 返回合适尺寸的图标
  if (process.platform === 'win32') {
    return icon16
  }
  return icon16
}

// 创建窗口图标 (从资源文件)
function createWindowIcon(): nativeImage {
  // 尝试从 resources 目录加载
  const resourcePath = join(__dirname, '../../resources/icon.png')
  const icon = nativeImage.createFromPath(resourcePath)

  // 如果文件存在且有效，返回它
  if (!icon.isEmpty()) {
    return icon
  }

  // 回退到托盘图标
  return createTrayIcon()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 480,
    minWidth: 300,
    minHeight: 400,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: true,
    autoHideMenuBar: true,
    icon: createWindowIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 关闭时隐藏而不是退出
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const icon = createTrayIcon()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: '启用划词',
      type: 'checkbox',
      checked: true,
      click: (menuItem) => {
        selectionService.setEnabled(menuItem.checked)
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Selection Assistant')
  tray.setContextMenu(contextMenu)

  // 点击托盘图标显示窗口
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

// 应用准备就绪
app.whenReady().then(async () => {
  // 设置应用用户模型ID
  electronApp.setAppUserModelId('com.selection.assistant')

  // 开发模式下默认打开 DevTools
  if (is.dev) {
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
  }

  // 创建系统托盘
  createTray()

  // 创建主窗口
  createWindow()

  // 初始化划词服务
  await selectionService.init()

  // macOS 激活应用
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

// 所有窗口关闭时不退出，保持在托盘
app.on('window-all-closed', () => {
  // 不退出，保持在托盘
})

// 注册 IPC 处理器

// 打开网站
ipcMain.handle(IpcChannel.Open_Website, (_, url: string) => {
  shell.openExternal(url)
})

// 引用到主窗口
ipcMain.handle(IpcChannel.App_QuoteToMain, (_, text: string) => {
  if (mainWindow) {
    mainWindow.webContents.send('quote-text', text)
    mainWindow.focus()
  }
})

// 最小化到托盘
ipcMain.handle(IpcChannel.App_Minimize, () => {
  mainWindow?.hide()
})

// 退出应用
ipcMain.handle(IpcChannel.App_Quit, () => {
  isQuitting = true
  app.quit()
})

// 配置相关
ipcMain.handle(IpcChannel.Config_Get, (_, key: string) => {
  if (key === 'settings') {
    return getAllSettings()
  }
  const value = getSetting(key as any)
  console.log('[Config] Get:', key, JSON.stringify(value, null, 2))
  return value
})

ipcMain.handle(IpcChannel.Config_Set, (_, key: string, value: any) => {
  console.log('[Config] Set:', key, JSON.stringify(value, null, 2))
  setSetting(key as any, value)
})

// LLM 相关
ipcMain.handle(IpcChannel.LLM_ChatCompletion, async (event, params) => {
  // 获取发送请求的窗口
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) {
    throw new Error('No window found for LLM request')
  }

  // 使用渲染进程传递的 requestId
  const requestId = params.requestId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  console.log('[LLM] Starting request:', requestId)

  try {
    const result = await fetchChatCompletion(params, requestId, win)
    return { success: true, content: result, requestId }
  } catch (error) {
    console.error('[LLM] Error:', error)
    return { success: false, error: (error as Error).message, requestId }
  }
})

ipcMain.handle(IpcChannel.LLM_AbortCompletion, (_, requestId: string) => {
  return abortCompletion(requestId)
})
