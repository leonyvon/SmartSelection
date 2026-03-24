# Cherry Studio 划词功能技术文档

## 一、功能概述

Cherry Studio 的划词功能允许用户在系统任意位置选中文本后，显示一个悬浮工具栏，提供多种 AI 处理动作（翻译、解释、总结、润色等）。

## 二、系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         主进程 (Main)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ SelectionService│  │   IPC Handler   │  │ ConfigManager   │  │
│  │   (单例服务)     │  │   (ipc.ts)      │  │   (配置管理)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           ▼                    ▼                    ▼           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    selection-hook (Native Addon)            ││
│  │         系统级文本选择监听 (Windows/macOS)                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ IPC 通信
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       渲染进程 (Renderer)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ SelectionToolbar│  │SelectionActionApp│  │   Redux Store   │  │
│  │   (工具栏窗口)   │  │   (动作窗口)     │  │   (状态管理)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 三、核心组件

### 3.1 SelectionService (主进程服务)

**文件位置**: `src/main/services/SelectionService.ts`

**职责**:
- 管理系统级文本选择监听 (通过 selection-hook)
- 创建和管理工具栏窗口 (Toolbar Window)
- 创建和管理动作窗口 (Action Window)
- 处理 IPC 通信

**关键设计**:

```typescript
class SelectionService {
  private static instance: SelectionService

  // 窗口实例
  private toolbarWindow: BrowserWindow | null = null
  private actionWindow: BrowserWindow | null = null

  // selection-hook 实例
  private selectionHook: SelectionHookInstance | null = null

  // 状态
  private isEnabled: boolean = false
  private triggerMode: TriggerMode = TriggerMode.Selected
  private currentSelection: TextSelectionData | null = null
  private currentAction: ActionItem | null = null
  private pendingAction: ActionItem | null = null  // 关键：等待窗口加载的动作数据

  static getInstance(): SelectionService
  async init(): Promise<void>
  setEnabled(enabled: boolean): void
}
```

### 3.2 工具栏窗口 (Toolbar Window)

**特点**:
- `frame: false` - 无边框
- `transparent: true` - 透明背景
- `alwaysOnTop: true` - 始终置顶
- `skipTaskbar: true` - 不显示在任务栏
- `hasShadow: false` - 无阴影

**创建代码**:

```typescript
private createToolbarWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 400,
    height: 48,
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

  // 加载独立的 HTML 入口
  if (isDev) {
    window.loadURL(`${devServerUrl}/selectionToolbar.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/selectionToolbar.html'))
  }

  return window
}
```

### 3.3 动作窗口 (Action Window)

**特点**:
- `frame: false` - 无边框
- `transparent: true` - 透明背景
- `alwaysOnTop: false` - 默认不置顶，用户可手动固定
- `resizable: true` - 可调整大小
- `hasShadow: true` - 有阴影

**关键：窗口创建和数据传递**:

```typescript
private pendingAction: ActionItem | null = null

private createActionWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 400,
    minHeight: 300,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: false,  // 关键：默认不置顶
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 加载页面
  if (isDev) {
    window.loadURL(`${devServerUrl}/selectionAction.html`)
  } else {
    window.loadFile(join(__dirname, '../renderer/selectionAction.html'))
  }

  // 关键：页面加载完成后发送数据并显示窗口
  window.webContents.on('did-finish-load', () => {
    if (window.isDestroyed()) return

    // 发送待处理的动作数据
    if (this.pendingAction) {
      window.webContents.send(IpcChannel.Selection_UpdateActionData, this.pendingAction)
      this.pendingAction = null
    }

    window.show()
  })

  return window
}

private showActionWindow(action: ActionItem): void {
  // 如果窗口已存在且可见，只更新数据
  if (this.actionWindow && !this.actionWindow.isDestroyed() && this.actionWindow.isVisible()) {
    this.actionWindow.webContents.send(IpcChannel.Selection_UpdateActionData, action)
    this.actionWindow.focus()
    return
  }

  // 保存动作数据，等待窗口加载完成后发送
  this.pendingAction = action

  // 创建新窗口
  if (!this.actionWindow || this.actionWindow.isDestroyed()) {
    this.actionWindow = this.createActionWindow()
  }

  // 设置窗口位置...

  // 如果页面已经加载完成（复用隐藏窗口），直接发送数据并显示
  if (!this.actionWindow.webContents.isLoading()) {
    if (this.pendingAction) {
      this.actionWindow.webContents.send(IpcChannel.Selection_UpdateActionData, this.pendingAction)
      this.pendingAction = null
    }
    this.actionWindow.show()
  }
}
```

## 四、IPC 通信设计

### 4.1 IPC 通道定义

```typescript
// src/shared/IpcChannel.ts
export const IpcChannel = {
  // Selection 相关
  Selection_TextSelected: 'selection:text-selected',
  Selection_ToolbarHide: 'selection:toolbar-hide',
  Selection_ToolbarVisibilityChange: 'selection:toolbar-visibility-change',
  Selection_UpdateActionData: 'selection:update-action-data',
  Selection_ProcessAction: 'selection:process-action',
  Selection_SetEnabled: 'selection:set-enabled',

  // 窗口控制
  Selection_ActionWindowClose: 'selection:action-window-close',
  Selection_ActionWindowMinimize: 'selection:action-window-minimize',
  Selection_ActionWindowPin: 'selection:action-window-pin',
  Selection_ActionWindowResize: 'selection:action-window-resize',

  // 配置
  Config_Get: 'config:get',
  Config_Set: 'config:set',
} as const
```

### 4.2 Preload 脚本

```typescript
// src/preload/index.ts
const api = {
  selection: {
    hideToolbar: () => ipcRenderer.invoke(IpcChannel.Selection_ToolbarHide),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.Selection_SetEnabled, enabled),
    processAction: (action: ActionItem) => ipcRenderer.invoke(IpcChannel.Selection_ProcessAction, action),
    closeActionWindow: () => ipcRenderer.invoke(IpcChannel.Selection_ActionWindowClose),
    pinActionWindow: (isPinned: boolean) => ipcRenderer.invoke(IpcChannel.Selection_ActionWindowPin, isPinned),
    resizeActionWindow: (deltaX: number, deltaY: number, direction: string) =>
      ipcRenderer.invoke(IpcChannel.Selection_ActionWindowResize, deltaX, deltaY, direction),
  },
  config: {
    get: (key: string) => ipcRenderer.invoke(IpcChannel.Config_Get, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IpcChannel.Config_Set, key, value),
  }
}

// 暴露 IPC 事件监听
const electron = {
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      const listener = (_event: any, ...args: any[]) => callback(_event, ...args)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('electron', electron)
```

## 五、渲染进程组件

### 5.1 SelectionActionApp (动作窗口主组件)

```typescript
const SelectionActionApp: FC = () => {
  const [action, setAction] = useState<ActionItem | null>(null)
  const isActionLoaded = useRef(false)

  // 监听动作数据更新
  useEffect(() => {
    const remover = window.electron?.ipcRenderer.on(
      IpcChannel.Selection_UpdateActionData,
      (_, actionItem: ActionItem) => {
        setAction(actionItem)
        isActionLoaded.current = true
      }
    )

    return () => remover?.()
  }, [])

  // action 为 null 时显示加载状态，而不是返回 null
  if (!action) {
    return <LoadingContainer>Loading...</LoadingContainer>
  }

  return (
    <WindowFrame>
      <TitleBar>
        {/* 标题栏按钮：固定、透明度、最小化、关闭 */}
      </TitleBar>
      <MainContainer>
        <Content>
          {action.id === 'translate' && <ActionTranslate action={action} />}
          {action.id !== 'translate' && <ActionGeneral action={action} />}
        </Content>
      </MainContainer>
    </WindowFrame>
  )
}
```

### 5.2 ActionGeneral (通用动作处理组件)

```typescript
const ActionGeneral: FC<Props> = ({ action, scrollToBottom }) => {
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'preparing' | 'streaming' | 'finished'>('preparing')

  const assistantRef = useRef<Assistant | null>(null)
  const topicRef = useRef<Topic | null>(null)
  const initialized = useRef(false)

  // 初始化 Assistant 和 Topic
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const currentAssistant = action.assistantId
      ? getAssistantById(action.assistantId)
      : getDefaultAssistant()

    assistantRef.current = currentAssistant
    topicRef.current = getDefaultTopic(currentAssistant.id)
  }, [action])

  // 获取结果
  const fetchResult = useCallback(() => {
    setStatus('preparing')

    processMessages(
      assistantRef.current,
      topicRef.current,
      action.selectedText,
      onStream: () => setStatus('streaming'),
      onFinish: (content) => {
        setStatus('finished')
        setContentToCopy(content)
      },
      onError: (error) => {
        setStatus('finished')
        setError(error.message)
      }
    )
  }, [action])

  useEffect(() => {
    fetchResult()
  }, [fetchResult])

  return (
    <Container>
      <Result>
        {isPreparing && <LoadingOutlined spin />}
        {!isPreparing && <MessageContent message={currentAssistantMessage} />}
      </Result>
    </Container>
  )
}
```

## 六、HTML 入口配置

### 6.1 selectionAction.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>划词助手</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100vw;
        height: 100vh;
        /* 重要：设置背景色确保窗口可见 */
        background-color: var(--color-background, #1a1a2e);
      }
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/windows/selection/action/entryPoint.tsx"></script>
  </body>
</html>
```

### 6.2 electron.vite.config.ts

```typescript
export default defineConfig({
  main: { /* ... */ },
  preload: { /* ... */ },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          selectionToolbar: resolve(__dirname, 'src/renderer/selectionToolbar.html'),
          selectionAction: resolve(__dirname, 'src/renderer/selectionAction.html'),
        }
      }
    }
  }
})
```

## 七、关键问题与解决方案

### 7.1 窗口不可见问题

**原因**:
1. `body { background-color: transparent }` 配合 `transparent: true` 导致完全透明
2. 窗口在页面加载前显示

**解决方案**:
```html
<!-- HTML 中设置背景色 -->
<style>
  html, body {
    background-color: #1a1a2e;  /* 与 CSS 变量一致 */
  }
</style>
```

### 7.2 动作数据不显示问题

**原因**:
- IPC 消息在 React 组件挂载前发送
- 组件在 `action === null` 时返回 `null`，不渲染任何内容

**解决方案**:
```typescript
// 1. 使用 pendingAction 暂存数据
private pendingAction: ActionItem | null = null

// 2. 在 did-finish-load 回调中发送数据
window.webContents.on('did-finish-load', () => {
  if (this.pendingAction) {
    window.webContents.send(IpcChannel.Selection_UpdateActionData, this.pendingAction)
    this.pendingAction = null
  }
  window.show()
})

// 3. 组件中显示加载状态而非返回 null
if (!action) {
  return <LoadingContainer>Loading...</LoadingContainer>
}
```

### 7.3 窗口置顶阻止输入问题

**原因**: `alwaysOnTop: true` 导致窗口抢占焦点

**解决方案**: 默认 `alwaysOnTop: false`，用户可手动固定

## 八、文件结构

```
src/
├── main/
│   ├── services/
│   │   └── SelectionService.ts    # 核心服务
│   └── ipc.ts                     # IPC 处理
├── preload/
│   └── index.ts                   # Preload 脚本
├── renderer/
│   ├── selectionAction.html       # 动作窗口入口
│   ├── selectionToolbar.html      # 工具栏窗口入口
│   └── src/
│       └── windows/
│           └── selection/
│               ├── action/
│               │   ├── SelectionActionApp.tsx
│               │   ├── entryPoint.tsx
│               │   └── components/
│               │       ├── ActionGeneral.tsx
│               │       ├── ActionTranslate.tsx
│               │       └── WindowFooter.tsx
│               └── toolbar/
│                   └── SelectionToolbar.tsx
├── shared/
│   ├── IpcChannel.ts              # IPC 通道定义
│   └── types.ts                   # 共享类型
└── electron.vite.config.ts        # 构建配置
```

## 九、最佳实践

1. **窗口显示时机**: 始终在 `did-finish-load` 后显示窗口
2. **数据传递**: 使用 `pendingAction` 模式确保数据不丢失
3. **类型安全**: 共享类型放在 `src/shared/` 目录
4. **状态管理**: 使用 Redux 管理全局状态
5. **错误处理**: 组件显示错误信息而非崩溃
6. **加载状态**: 组件在数据加载前显示 Loading 状态
