/**
 * SelectionService - 划词助手核心服务
 *
 * 功能:
 * - 系统级文本选择监听 (通过 selection-hook)
 * - 悬浮工具栏窗口管理
 * - 动作窗口管理
 * - IPC 通信处理
 */

import { BrowserWindow, ipcMain, screen, systemPreferences } from 'electron'
import { join } from 'path'
import { IpcChannel } from '@shared/IpcChannel'
import type { ActionItem, TextSelectionData } from '@shared/types'

// 类型定义
type Point = { x: number; y: number }

enum TriggerMode {
  Selected = 'selected',
  Ctrlkey = 'ctrlkey',
  Shortcut = 'shortcut'
}

// 常量
const isMac = process.platform === 'darwin'
const isWin = process.platform === 'win32'
const isSupportedOS = isWin || isMac

// selection-hook 类型
type SelectionHookConstructor = any
type SelectionHookInstance = any

let SelectionHook: SelectionHookConstructor | null = null

// 动态加载 selection-hook
try {
  if (isSupportedOS) {
    SelectionHook = require('selection-hook')
  }
} catch (error) {
  console.error('[SelectionService] Failed to load selection-hook:', error)
}

// Windows API 鼠标点击监听
let getAsyncKeyState: ((key: number) => number) | null = null
if (isWin) {
  try {
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    // 使用同步调用
    getAsyncKeyState = user32.func('short GetAsyncKeyState(int vKey)')
    console.log('[SelectionService] Windows API loaded for mouse click detection')
  } catch (error) {
    console.warn('[SelectionService] Failed to load Windows API:', error)
  }
}

// 鼠标按键虚拟键码
const VK_LBUTTON = 0x01

export class SelectionService {
  private static instance: SelectionService

  // 窗口
  private toolbarWindow: BrowserWindow | null = null
  private actionWindow: BrowserWindow | null = null

  // selection-hook 实例
  private selectionHook: SelectionHookInstance | null = null

  // 状态
  private isEnabled: boolean = false
  private triggerMode: TriggerMode = TriggerMode.Selected
  private filterMode: 'default' | 'whitelist' | 'blacklist' = 'default'
  private filterList: string[] = []
  private isFollowToolbar: boolean = true
  private isRememberWinSize: boolean = false
  private isToolbarPending: boolean = false // 防止重复显示工具栏

  // 当前选择数据
  private currentSelection: TextSelectionData | null = null
  private currentAction: ActionItem | null = null

  // 当前的动作列表（从主窗口同步）
  private currentActionItems: ActionItem[] = []

  // 工具栏尺寸
  private toolbarSize = { width: 400, height: 48 }

  // 动作窗口尺寸
  private actionWindowSize = { width: 600, height: 400 }

  // 全局鼠标点击监听
  private mouseClickTimer: NodeJS.Timeout | null = null
  private isMousePressed: boolean = false

  private constructor() {}

  static getInstance(): SelectionService {
    if (!SelectionService.instance) {
      SelectionService.instance = new SelectionService()
    }
    return SelectionService.instance
  }

  /**
   * 初始化服务
   */
  async init(): Promise<void> {
    if (!isSupportedOS) {
      console.warn('[SelectionService] Unsupported OS')
      return
    }

    // 检查 macOS 辅助功能权限
    if (isMac) {
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(true)
      if (!isTrusted) {
        console.warn('[SelectionService] macOS requires accessibility permission')
      }
    }

    // 注册 IPC 处理器
    this.registerIpcHandlers()

    // 从配置加载初始状态
    const { getSetting } = await import('./ConfigService')
    const selectionConfig = getSetting('selection' as any)
    if (selectionConfig) {
      // 加载动作列表
      if (selectionConfig.actionItems) {
        this.currentActionItems = selectionConfig.actionItems
        console.log('[SelectionService] Loaded actionItems from config:', this.currentActionItems.length, 'items')
      }
    }

    // 预留功能状态 (将来使用)
    void this.isFollowToolbar
    void this.isRememberWinSize

    console.log('[SelectionService] Initialized')
  }

  /**
   * 注册 IPC 处理器
   */
  private registerIpcHandlers(): void {
    // 启用/禁用
    ipcMain.handle(IpcChannel.Selection_SetEnabled, (_, enabled: boolean) => {
      this.setEnabled(enabled)
    })

    // 触发模式
    ipcMain.handle(IpcChannel.Selection_SetTriggerMode, (_, mode: TriggerMode) => {
      this.triggerMode = mode
    })

    // 过滤模式
    ipcMain.handle(IpcChannel.Selection_SetFilterMode, (_, mode: string) => {
      this.filterMode = mode as any
    })

    // 过滤列表
    ipcMain.handle(IpcChannel.Selection_SetFilterList, (_, list: string[]) => {
      this.filterList = list
    })

    // 跟随工具栏
    ipcMain.handle(IpcChannel.Selection_SetFollowToolbar, (_, isFollow: boolean) => {
      this.isFollowToolbar = isFollow
    })

    // 记住窗口尺寸
    ipcMain.handle(IpcChannel.Selection_SetRemeberWinSize, (_, isRemember: boolean) => {
      this.isRememberWinSize = isRemember
    })

    // 隐藏工具栏
    ipcMain.handle(IpcChannel.Selection_ToolbarHide, () => {
      this.hideToolbar()
    })

    // 写入剪贴板
    ipcMain.handle(IpcChannel.Selection_WriteToClipboard, (_, text: string) => {
      return this.writeToClipboard(text)
    })

    // 确定工具栏尺寸
    ipcMain.handle(IpcChannel.Selection_ToolbarDetermineSize, (_, width: number, height: number) => {
      this.toolbarSize = { width, height }
      this.resizeToolbarWindow()
    })

    // 处理动作
    ipcMain.handle(IpcChannel.Selection_ProcessAction, (_, action: ActionItem, isFullScreen: boolean) => {
      this.processAction(action, isFullScreen)
    })

    // 关闭动作窗口
    ipcMain.handle(IpcChannel.Selection_ActionWindowClose, () => {
      this.closeActionWindow()
    })

    // 最小化动作窗口
    ipcMain.handle(IpcChannel.Selection_ActionWindowMinimize, () => {
      this.minimizeActionWindow()
    })

    // 固定动作窗口
    ipcMain.handle(IpcChannel.Selection_ActionWindowPin, (_, isPinned: boolean) => {
      this.pinActionWindow(isPinned)
    })

    // 调整动作窗口大小
    ipcMain.handle(IpcChannel.Selection_ActionWindowResize, (_, deltaX: number, deltaY: number, direction: string) => {
      this.resizeActionWindow(deltaX, deltaY, direction)
    })

    // 更新动作列表（从主窗口同步）
    ipcMain.handle(IpcChannel.Selection_SetActionItems, (_, items: ActionItem[]) => {
      this.currentActionItems = items
      console.log('[SelectionService] Updated actionItems:', items.length, 'items')
    })
  }

  /**
   * 启用/禁用选择监听
   */
  setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return

    if (enabled) {
      this.startSelectionHook()
    } else {
      this.stopSelectionHook()
      this.hideToolbar()
      this.closeActionWindow()
    }

    this.isEnabled = enabled
  }

  /**
   * 启动选择钩子
   */
  private startSelectionHook(): void {
    if (!SelectionHook || this.selectionHook) return

    try {
      this.selectionHook = new SelectionHook()

      // 文本选择事件
      this.selectionHook.on('text-selection', (data: TextSelectionData) => {
        this.handleTextSelected(data)
      })

      // 启动监听，启用剪贴板回退功能（用于浏览器和 VSCode 等应用）
      this.selectionHook.start({
        enableClipboard: true
      })

      // 设置剪贴板回退白名单：只对浏览器和 VSCode 启用
      // 这些应用的自定义文本渲染可能导致 UIA/Accessibility API 失效
      const clipboardWhitelist = [
        // 浏览器
        'chrome.exe',
        'msedge.exe',
        'firefox.exe',
        'brave.exe',
        'opera.exe',
        'vivaldi.exe',
        'arc.exe',
        // VSCode 及相关
        'code.exe',
        'code-insiders.exe',
        'vscodium.exe',
        'cursor.exe',
        // 其他 Electron 编辑器
        'notion.exe',
        'obsidian.exe'
      ]
      this.selectionHook.setClipboardMode(
        SelectionHook!.FilterMode.INCLUDE_LIST,
        clipboardWhitelist
      )

      console.log('[SelectionService] Selection hook started with clipboard whitelist')
    } catch (error) {
      console.error('[SelectionService] Failed to start selection hook:', error)
    }
  }

  /**
   * 停止选择钩子
   */
  private stopSelectionHook(): void {
    if (this.selectionHook) {
      this.selectionHook.stop()
      this.selectionHook.cleanup()
      this.selectionHook = null
    }
  }

  /**
   * 处理文本选择
   */
  private handleTextSelected(rawData: any): void {
    console.log('[SelectionService] handleTextSelected rawData:', rawData)

    // 检查工具栏是否已经可见或正在显示中
    if (this.isToolbarPending) {
      console.log('[SelectionService] Toolbar is pending, skipping')
      return
    }
    if (this.toolbarWindow && !this.toolbarWindow.isDestroyed() && this.toolbarWindow.isVisible()) {
      console.log('[SelectionService] Toolbar already visible, skipping')
      return
    }

    // 从原始数据构建 TextSelectionData
    // 优先使用 mousePosEnd，如果没有则使用 mousePosStart
    const mousePos = rawData.mousePosEnd || rawData.mousePosStart || rawData.position || { x: 0, y: 0 }
    console.log('[SelectionService] Using mousePos:', mousePos)

    const data: TextSelectionData = {
      text: rawData.text,
      programName: rawData.programName,
      mousePosStart: rawData.mousePosStart,
      mousePosEnd: rawData.mousePosEnd,
      position: mousePos,
      isFullscreen: rawData.isFullscreen
    }

    // 过滤检查
    if (!this.shouldShowToolbar(data)) return

    this.currentSelection = data

    // 根据触发模式处理
    if (this.triggerMode === TriggerMode.Selected) {
      this.showToolbar(data.position)
    }
  }

  /**
   * 检查是否应该显示工具栏
   */
  private shouldShowToolbar(data: TextSelectionData): boolean {
    // 空文本检查
    if (!data.text || data.text.trim().length === 0) return false

    // 过滤模式检查
    const processName = data.programName?.toLowerCase()
    if (processName) {
      if (this.filterMode === 'blacklist' && this.filterList.some(p => p.toLowerCase() === processName)) {
        return false
      }
      if (this.filterMode === 'whitelist' && !this.filterList.some(p => p.toLowerCase() === processName)) {
        return false
      }
    }

    return true
  }

  // 待显示的工具栏位置（用于窗口加载完成后显示）
  private pendingToolbarPosition: Point | null = null

  /**
   * 创建工具栏窗口
   */
  private createToolbarWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: this.toolbarSize.width,
      height: this.toolbarSize.height,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    // 开发模式下加载开发服务器
    if (process.env.NODE_ENV === 'development') {
      const devServerUrl = process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:5173'
      window.loadURL(`${devServerUrl}/selectionToolbar.html`)
    } else {
      window.loadFile(join(__dirname, '../renderer/selectionToolbar.html'))
    }

    // 页面加载完成后显示
    window.webContents.on('did-finish-load', () => {
      if (window.isDestroyed()) return

      // 如果有待显示的位置，显示工具栏
      if (this.pendingToolbarPosition) {
        this.displayToolbarAt(this.pendingToolbarPosition)
        this.pendingToolbarPosition = null
      }
    })

    // 窗口失焦时隐藏
    window.on('blur', () => {
      try {
        // 检查窗口是否已销毁
        if (window.isDestroyed()) return
        if (this.isEnabled) {
          const actionVisible = this.actionWindow && !this.actionWindow.isDestroyed() && this.actionWindow.isVisible()
          if (!actionVisible) {
            this.hideToolbar()
          }
        }
      } catch {
        // 窗口可能已销毁，忽略错误
      }
    })

    return window
  }

  /**
   * 在指定位置显示工具栏（内部方法，直接显示不检查加载状态）
   */
  private displayToolbarAt(position: Point): void {
    if (!this.toolbarWindow || this.toolbarWindow.isDestroyed()) return

    // 找到包含该物理坐标的显示器
    const displays = screen.getAllDisplays()
    let targetDisplay = displays[0]

    for (const display of displays) {
      const { bounds, scaleFactor } = display
      const physLeft = Math.round(bounds.x * scaleFactor)
      const physTop = Math.round(bounds.y * scaleFactor)
      const physRight = Math.round((bounds.x + bounds.width) * scaleFactor)
      const physBottom = Math.round((bounds.y + bounds.height) * scaleFactor)

      if (position.x >= physLeft && position.x < physRight &&
          position.y >= physTop && position.y < physBottom) {
        targetDisplay = display
        break
      }
    }

    const { workArea, scaleFactor } = targetDisplay
    const logicalX = position.x / scaleFactor
    const logicalY = position.y / scaleFactor
    const { width, height } = this.toolbarSize

    let x = logicalX - width / 2
    let y = logicalY + 15

    // 边界检查
    if (x < workArea.x) x = workArea.x + 5
    if (x + width > workArea.x + workArea.width) x = workArea.x + workArea.width - width - 5
    if (y + height > workArea.y + workArea.height) {
      y = logicalY - height - 15
    }
    if (y < workArea.y) y = workArea.y + 5

    console.log('[SelectionService] Displaying toolbar at:', { x, y })

    this.toolbarWindow.setPosition(Math.round(x), Math.round(y))
    this.toolbarWindow.setSize(width, height)
    this.toolbarWindow.show()

    // 清除标志
    this.isToolbarPending = false

    if (!this.toolbarWindow.isDestroyed()) {
      // 发送选中文本和动作列表到工具栏
      this.toolbarWindow.webContents.send(IpcChannel.Selection_TextSelected, {
        ...this.currentSelection,
        actionItems: this.currentActionItems
      })
    }

    this.broadcastToolbarVisibility(true)

    // 启动全局鼠标点击监听
    this.startMouseClickMonitor()
  }

  /**
   * 显示工具栏
   */
  private showToolbar(position: Point): void {
    console.log('[SelectionService] showToolbar at position:', position)

    // 设置标志，防止重复显示
    this.isToolbarPending = true

    // 如果窗口不存在或已销毁，创建新窗口
    if (!this.toolbarWindow || this.toolbarWindow.isDestroyed()) {
      this.toolbarWindow = this.createToolbarWindow()
      // 保存位置，等待页面加载完成后显示
      this.pendingToolbarPosition = position
      return
    }

    // 如果页面正在加载，保存位置等待加载完成
    if (this.toolbarWindow.webContents.isLoading()) {
      this.pendingToolbarPosition = position
      return
    }

    // 页面已加载，直接显示
    this.displayToolbarAt(position)
    this.isToolbarPending = false
  }

  /**
   * 隐藏工具栏
   */
  private hideToolbar(): void {
    try {
      // 停止鼠标点击监听
      this.stopMouseClickMonitor()

      // 清除标志和待显示位置
      this.isToolbarPending = false
      this.pendingToolbarPosition = null

      if (this.toolbarWindow && !this.toolbarWindow.isDestroyed()) {
        // 销毁窗口而不是仅隐藏，避免出现多个窗口
        this.toolbarWindow.destroy()
        this.toolbarWindow = null
        this.broadcastToolbarVisibility(false)
      }
    } catch {
      // 窗口可能已销毁，忽略错误
    }
  }

  /**
   * 启动全局鼠标点击监听
   */
  private startMouseClickMonitor(): void {
    if (!isWin || !getAsyncKeyState) return

    // 先停止之前的监听
    this.stopMouseClickMonitor()

    this.isMousePressed = false
    console.log('[SelectionService] Starting mouse click monitor')

    this.mouseClickTimer = setInterval(() => {
      if (!this.toolbarWindow || this.toolbarWindow.isDestroyed() || !this.toolbarWindow.isVisible()) {
        this.stopMouseClickMonitor()
        return
      }

      try {
        // 检查鼠标左键状态 (同步调用)
        const state = getAsyncKeyState!(VK_LBUTTON)
        const isPressed = (state & 0x8000) !== 0

        // 检测从按下到释放的转变
        if (this.isMousePressed && !isPressed) {
          // 鼠标释放，检查是否在工具栏外部
          this.checkClickOutside()
        }

        this.isMousePressed = isPressed
      } catch (err) {
        console.error('[SelectionService] Error checking mouse state:', err)
      }
    }, 50) // 50ms 检测间隔
  }

  /**
   * 停止全局鼠标点击监听
   */
  private stopMouseClickMonitor(): void {
    if (this.mouseClickTimer) {
      clearInterval(this.mouseClickTimer)
      this.mouseClickTimer = null
      console.log('[SelectionService] Stopped mouse click monitor')
    }
    this.isMousePressed = false
  }

  /**
   * 检查点击是否在工具栏外部
   */
  private checkClickOutside(): void {
    if (!this.toolbarWindow || this.toolbarWindow.isDestroyed()) return

    try {
      // 获取鼠标位置
      const mousePos = screen.getCursorScreenPoint()

      // 获取工具栏窗口边界
      const bounds = this.toolbarWindow.getBounds()

      // 检查鼠标是否在工具栏内
      const isInside =
        mousePos.x >= bounds.x &&
        mousePos.x <= bounds.x + bounds.width &&
        mousePos.y >= bounds.y &&
        mousePos.y <= bounds.y + bounds.height

      if (!isInside) {
        console.log('[SelectionService] Click outside toolbar, hiding')
        this.hideToolbar()
      }
    } catch {
      // 忽略错误
    }
  }

  /**
   * 调整工具栏窗口大小
   */
  private resizeToolbarWindow(): void {
    if (this.toolbarWindow && !this.toolbarWindow.isDestroyed() && this.toolbarWindow.isVisible()) {
      this.toolbarWindow.setSize(this.toolbarSize.width, this.toolbarSize.height)
    }
  }

  /**
   * 广播工具栏可见性
   */
  private broadcastToolbarVisibility(isVisible: boolean): void {
    try {
      if (this.toolbarWindow && !this.toolbarWindow.isDestroyed()) {
        this.toolbarWindow.webContents.send(IpcChannel.Selection_ToolbarVisibilityChange, isVisible)
      }
    } catch {
      // 窗口可能已销毁，忽略错误
    }
  }

  // 当前动作数据（用于新窗口加载后发送）
  private pendingAction: ActionItem | null = null

  /**
   * 创建动作窗口
   */
  private createActionWindow(): BrowserWindow {
    const window = new BrowserWindow({
      width: this.actionWindowSize.width,
      height: this.actionWindowSize.height,
      minWidth: 400,
      minHeight: 300,
      show: false,
      frame: false,
      transparent: true,
      alwaysOnTop: false,
      resizable: true,
      skipTaskbar: false,
      hasShadow: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    // 开发模式下加载开发服务器
    const devServerUrl = process.env['ELECTRON_RENDERER_URL']
    if (devServerUrl) {
      window.loadURL(`${devServerUrl}/selectionAction.html`)
    } else {
      window.loadFile(join(__dirname, '../renderer/selectionAction.html'))
    }

    // 页面加载完成后发送数据并显示窗口
    window.webContents.on('did-finish-load', () => {
      if (window.isDestroyed()) return

      console.log('[SelectionService] did-finish-load, pendingAction:', this.pendingAction)

      // 发送待处理的动作数据
      if (this.pendingAction) {
        console.log('[SelectionService] Sending action data to renderer')
        window.webContents.send(IpcChannel.Selection_UpdateActionData, this.pendingAction)
        this.pendingAction = null
      }

      window.show()
    })

    // 开发模式下打开 DevTools
    if (process.env.NODE_ENV === 'development') {
      window.webContents.openDevTools({ mode: 'detach' })
    }

    return window
  }

  /**
   * 显示动作窗口
   */
  private showActionWindow(action: ActionItem): void {
    console.log('[SelectionService] showActionWindow called with action:', action)

    // 如果窗口已存在且可见，只更新数据
    if (this.actionWindow && !this.actionWindow.isDestroyed() && this.actionWindow.isVisible()) {
      console.log('[SelectionService] Window already visible, updating data')
      this.actionWindow.webContents.send(IpcChannel.Selection_UpdateActionData, action)
      this.actionWindow.focus()
      return
    }

    // 保存动作数据，等待窗口加载完成后发送
    this.pendingAction = action
    console.log('[SelectionService] Saved pendingAction:', this.pendingAction)

    // 创建新窗口
    if (!this.actionWindow || this.actionWindow.isDestroyed()) {
      this.actionWindow = this.createActionWindow()
    }

    // 计算窗口位置
    const display = screen.getPrimaryDisplay()
    const { workArea } = display

    // 居中显示
    const x = workArea.x + (workArea.width - this.actionWindowSize.width) / 2
    const y = workArea.y + (workArea.height - this.actionWindowSize.height) / 2

    this.actionWindow.setPosition(Math.round(x), Math.round(y))

    // 如果页面已经加载完成（复用隐藏窗口的情况），直接发送数据并显示
    if (!this.actionWindow.webContents.isLoading()) {
      if (this.pendingAction) {
        this.actionWindow.webContents.send(IpcChannel.Selection_UpdateActionData, this.pendingAction)
        this.pendingAction = null
      }
      this.actionWindow.show()
    }
  }

  /**
   * 处理动作
   */
  private processAction(action: ActionItem, _isFullScreen: boolean = false): void {
    console.log('[SelectionService] processAction called:', {
      action,
      currentSelection: this.currentSelection
    })

    // 优先使用 action 中已有的 selectedText，否则从 currentSelection 获取
    const selectedText = action.selectedText || this.currentSelection?.text
    if (!selectedText) {
      console.error('[SelectionService] No selected text available')
      return
    }

    this.currentAction = { ...action, selectedText }
    console.log('[SelectionService] currentAction:', this.currentAction)

    // 隐藏工具栏
    this.hideToolbar()

    // 根据动作类型处理
    if (action.id === 'search' && action.searchEngine) {
      // 搜索动作 - 打开浏览器
      const searchUrl = action.searchEngine.split('|')[1]?.replace('{{queryString}}', encodeURIComponent(action.selectedText || ''))
      if (searchUrl) {
        require('electron').shell.openExternal(searchUrl)
      }
      return
    }

    if (action.id === 'quote') {
      // 引用动作 - 发送到主窗口
      ipcMain.emit(IpcChannel.App_QuoteToMain, action.selectedText)
      return
    }

    // 其他动作 - 显示动作窗口
    this.showActionWindow(this.currentAction)
  }

  /**
   * 关闭动作窗口
   */
  private closeActionWindow(): void {
    if (this.actionWindow && !this.actionWindow.isDestroyed()) {
      this.actionWindow.hide()
    }
  }

  /**
   * 最小化动作窗口
   */
  private minimizeActionWindow(): void {
    if (this.actionWindow && !this.actionWindow.isDestroyed()) {
      this.actionWindow.minimize()
    }
  }

  /**
   * 固定动作窗口
   */
  private pinActionWindow(isPinned: boolean): void {
    if (this.actionWindow && !this.actionWindow.isDestroyed()) {
      this.actionWindow.setAlwaysOnTop(isPinned)
    }
  }

  /**
   * 调整动作窗口大小
   */
  private resizeActionWindow(deltaX: number, deltaY: number, direction: string): void {
    if (!this.actionWindow || this.actionWindow.isDestroyed()) return

    const [width, height] = this.actionWindow.getSize()
    const [x, y] = this.actionWindow.getPosition()

    let newWidth = width
    let newHeight = height
    let newX = x
    let newY = y

    // 根据方向调整
    if (direction.includes('e')) newWidth = Math.max(400, width + deltaX)
    if (direction.includes('w')) {
      newWidth = Math.max(400, width - deltaX)
      newX = x + deltaX
    }
    if (direction.includes('s')) newHeight = Math.max(300, height + deltaY)
    if (direction.includes('n')) {
      newHeight = Math.max(300, height - deltaY)
      newY = y + deltaY
    }

    this.actionWindow.setSize(newWidth, newHeight)
    if (direction.includes('w') || direction.includes('n')) {
      this.actionWindow.setPosition(newX, newY)
    }
  }

  /**
   * 写入剪贴板
   */
  private async writeToClipboard(text: string): Promise<boolean> {
    try {
      const { clipboard } = require('electron')
      clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopSelectionHook()
    if (this.toolbarWindow && !this.toolbarWindow.isDestroyed()) {
      this.toolbarWindow.destroy()
    }
    if (this.actionWindow && !this.actionWindow.isDestroyed()) {
      this.actionWindow.destroy()
    }
    this.toolbarWindow = null
    this.actionWindow = null
  }
}

// 导出单例
export const selectionService = SelectionService.getInstance()
