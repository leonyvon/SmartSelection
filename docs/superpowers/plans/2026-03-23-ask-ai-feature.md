# 问AI功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在划词助手中添加"问AI"功能，启用后工具栏底部显示输入框，支持多轮对话。

**Architecture:** 新增 `enableAskAi` 配置项控制功能开关；工具栏条件渲染输入区域；新建 `ActionAskAi.tsx` 组件处理多轮对话；复用现有 LLMService 流式调用。

**Tech Stack:** React, TypeScript, styled-components, Redux Toolkit, Electron IPC

---

## File Structure

| File | Action | Description |
|------|--------|-------------|
| `src/shared/types.ts` | Modify | Add `userQuestion` field to `ActionItem`, add `enableAskAi` to `SelectionState` |
| `src/main/services/ConfigService.ts` | Modify | Add `enableAskAi` to default settings |
| `src/renderer/src/services/LLMService.ts` | Modify | Add `getAskAiAssistant()` helper |
| `src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx` | Modify | Add `AskAiInputSection` component |
| `src/main/services/SelectionService.ts` | Modify | Pass `enableAskAi` to toolbar via IPC |
| `src/renderer/src/windows/selection/action/components/ActionAskAi.tsx` | Create | Multi-turn conversation component |
| `src/renderer/src/windows/selection/action/SelectionActionApp.tsx` | Modify | Route to `ActionAskAi` for `ask-ai` action |
| `src/renderer/src/App.tsx` | Modify | Add "问AI" toggle switch in settings |
| `src/renderer/src/hooks/useSelectionAssistant.ts` | Modify | Add `enableAskAi` state and setter |
| `src/renderer/src/store/index.ts` | Modify | Add `enableAskAi` to Redux state and actions |

---

### Task 1: 类型定义扩展

**Files:**
- Modify: `src/shared/types.ts`

- [ ] **Step 1: Add `userQuestion` field to `ActionItem`**

```typescript
// 在 ActionItem interface 中添加
export interface ActionItem {
  id: string
  name: string
  enabled: boolean
  isBuiltIn: boolean
  icon?: string
  prompt?: string
  assistantId?: string
  selectedText?: string
  searchEngine?: string
  userQuestion?: string  // 新增：问AI时用户输入的问题
}
```

- [ ] **Step 2: Add `enableAskAi` to `SelectionState`**

```typescript
// 在 SelectionState interface 中添加
export interface SelectionState {
  selectionEnabled: boolean
  triggerMode: TriggerMode
  isCompact: boolean
  isAutoClose: boolean
  isAutoPin: boolean
  isFollowToolbar: boolean
  isRememberWinSize: boolean
  filterMode: FilterMode
  filterList: string[]
  actionWindowOpacity: number
  actionItems: ActionItem[]
  enableAskAi?: boolean  // 新增：问AI功能开关
}
```

- [ ] **Step 3: Commit**

```bash
git add src/shared/types.ts
git commit -m "feat(types): add userQuestion to ActionItem and enableAskAi to SelectionState"
```

---

### Task 2: 配置服务扩展

**Files:**
- Modify: `src/main/services/ConfigService.ts`

- [ ] **Step 1: Add `enableAskAi` to default settings**

在 `defaultSettings.selection` 对象中添加：

```typescript
const defaultSettings: AppSettings = {
  // ...existing code...
  selection: {
    selectionEnabled: false,
    triggerMode: 'selected',
    isCompact: false,
    isAutoClose: false,
    isAutoPin: false,
    isFollowToolbar: true,
    isRememberWinSize: false,
    filterMode: 'default',
    filterList: [],
    actionWindowOpacity: 100,
    actionItems: [
      // ...existing items...
    ],
    enableAskAi: false  // 新增
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/services/ConfigService.ts
git commit -m "feat(config): add enableAskAi default setting"
```

---

### Task 3: LLM Service 扩展

**Files:**
- Modify: `src/renderer/src/services/LLMService.ts`

- [ ] **Step 1: Add `getAskAiAssistant()` helper**

在 `getRefineAssistant()` 之后添加：

```typescript
/**
 * 获取问AI助手
 */
export function getAskAiAssistant(): Assistant {
  return {
    id: 'ask-ai',
    name: '问AI',
    prompt: '你是一个智能助手。请根据用户提供的文本和问题，给出清晰、准确、有帮助的回答。',
    settings: {
      temperature: 0.7,
      enableTemperature: true,
      streamOutput: true
    }
  }
}
```

- [ ] **Step 2: Update `getAssistantForAction` to handle `ask-ai`**

修改 `getAssistantForAction` 函数，在 switch 中添加 case：

```typescript
export function getAssistantForAction(actionId: string, customPrompt?: string): Assistant {
  switch (actionId) {
    case 'translate':
      return getTranslateAssistant('中文')
    case 'explain':
      return getExplainAssistant()
    case 'summary':
      return getSummaryAssistant()
    case 'refine':
      return getRefineAssistant()
    case 'ask-ai':  // 新增
      return getAskAiAssistant()
    default:
      return {
        id: 'custom',
        name: '自定义',
        prompt: customPrompt || '',
        settings: {
          temperature: 0.7,
          enableTemperature: false,
          streamOutput: true
        }
      }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/services/LLMService.ts
git commit -m "feat(llm): add getAskAiAssistant helper"
```

---

### Task 4: Redux Store 扩展

**Files:**
- Modify: `src/renderer/src/store/index.ts`

- [ ] **Step 1: Add `enableAskAi` to initial state**

在 `initialState` 中添加：

```typescript
const initialState: SelectionState = {
  selectionEnabled: false,
  triggerMode: 'selected',
  isCompact: false,
  isAutoClose: false,
  isAutoPin: false,
  isFollowToolbar: true,
  isRememberWinSize: false,
  filterMode: 'default',
  filterList: [],
  actionWindowOpacity: 100,
  actionItems: [],
  enableAskAi: false  // 新增
}
```

- [ ] **Step 2: Add `setEnableAskAi` action**

在 `slice` 定义中添加 reducer：

```typescript
const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    // ...existing reducers...
    setEnableAskAi: (state, action: PayloadAction<boolean>) => {
      state.enableAskAi = action.payload
    }
  }
})

export const {
  // ...existing exports...
  setEnableAskAi
} = selectionSlice.actions
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/store/index.ts
git commit -m "feat(store): add enableAskAi state and action"
```

---

### Task 5: Hook 扩展

**Files:**
- Modify: `src/renderer/src/hooks/useSelectionAssistant.ts`

- [ ] **Step 1: Add `enableAskAi` to hook return value**

读取文件后，在 hook 中添加：

```typescript
import { setEnableAskAi as setEnableAskAiAction } from '../store'

// 在 hook 内部
const enableAskAi = useAppSelector((state) => state.selection.enableAskAi)

const setEnableAskAi = useCallback((value: boolean) => {
  dispatch(setEnableAskAiAction(value))
  // 保存到配置
  window.api?.config.set('selection', {
    ...window.api?.config.get('selection'),
    enableAskAi: value
  })
  // 通知 SelectionService 更新状态
  window.api?.selection.setEnableAskAi(value)
}, [dispatch])

// 在返回值中添加
return {
  // ...existing returns...
  enableAskAi,
  setEnableAskAi
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/hooks/useSelectionAssistant.ts
git commit -m "feat(hook): add enableAskAi state management"
```

---

### Task 6: SelectionService IPC 扩展

**Files:**
- Modify: `src/main/services/SelectionService.ts`

- [ ] **Step 1: Add `enableAskAi` property**

在 `SelectionService` 类中添加属性：

```typescript
export class SelectionService {
  // ...existing properties...
  private enableAskAi: boolean = false
```

- [ ] **Step 2: Add IPC handler for `enableAskAi`**

在 `registerIpcHandlers()` 方法中添加：

```typescript
// 启用/禁用问AI
ipcMain.handle(IpcChannel.Selection_SetEnableAskAi, (_, enabled: boolean) => {
  this.enableAskAi = enabled
})
```

- [ ] **Step 3: Pass `enableAskAi` to toolbar in `displayToolbarAt`**

修改 `displayToolbarAt()` 方法中发送数据部分：

```typescript
this.toolbarWindow.webContents.send(IpcChannel.Selection_TextSelected, {
  ...this.currentSelection,
  actionItems: this.currentActionItems,
  enableAskAi: this.enableAskAi  // 新增
})
```

- [ ] **Step 4: Load `enableAskAi` from config in `init`**

在 `init()` 方法中，加载配置时添加：

```typescript
if (selectionConfig.enableAskAi !== undefined) {
  this.enableAskAi = selectionConfig.enableAskAi
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/services/SelectionService.ts
git commit -m "feat(selection-service): add enableAskAi IPC support"
```

---

### Task 7: IPC Channel 定义

**Files:**
- Modify: `src/shared/IpcChannel.ts`

- [ ] **Step 1: Add new IPC channel**

```typescript
export const IpcChannel = {
  // ...existing channels...
  Selection_SetEnableAskAi: 'selection:set-enable-ask-ai'
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/IpcChannel.ts
git commit -m "feat(ipc): add Selection_SetEnableAskAi channel"
```

---

### Task 8: Preload 脚本扩展

**Files:**
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Add `setEnableAskAi` to selection API**

在 `selection` 对象中添加：

```typescript
selection: {
  // ...existing methods...
  setEnableAskAi: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.Selection_SetEnableAskAi, enabled)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat(preload): add setEnableAskAi to selection API"
```

---

### Task 9: 工具栏输入区域

**Files:**
- Modify: `src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { Send } from 'lucide-react'
```

- [ ] **Step 2: Add state for `enableAskAi` and input**

在 `SelectionToolbar` 组件中添加：

```typescript
const [enableAskAi, setEnableAskAi] = useState(false)
const [askAiInput, setAskAiInput] = useState('')
```

- [ ] **Step 3: Sync `enableAskAi` from IPC**

在 `useEffect` 中监听：

```typescript
const textSelectionListenRemover = window.electron?.ipcRenderer.on(
  IpcChannel.Selection_TextSelected,
  (_, selectionData: { text: string; isFullscreen?: boolean; actionItems?: ActionItem[]; enableAskAi?: boolean }) => {
    selectedText.current = selectionData.text
    isFullScreen.current = selectionData.isFullscreen ?? false
    if (selectionData.actionItems) {
      setActionItems(selectionData.actionItems)
    }
    if (selectionData.enableAskAi !== undefined) {
      setEnableAskAi(selectionData.enableAskAi)
    }
    setTimeout(() => setAnimateKey((prev) => prev + 1), 400)
  }
)
```

- [ ] **Step 4: Add `handleAskAiSubmit` handler**

```typescript
const handleAskAiSubmit = useCallback(() => {
  if (!askAiInput.trim() || !selectedText.current) return

  const action: ActionItem = {
    id: 'ask-ai',
    name: '问AI',
    isBuiltIn: true,
    selectedText: selectedText.current,
    userQuestion: askAiInput.trim()
  }

  window.api?.selection.processAction(action, isFullScreen.current)
  window.api?.selection.hideToolbar()
  setAskAiInput('')
}, [askAiInput])
```

- [ ] **Step 5: Add `AskAiInputSection` styled component**

在文件末尾添加 styled components：

```typescript
/* ═══════════════════════════════════════════════════════════════
   ASK AI INPUT SECTION
   ═══════════════════════════════════════════════════════════════ */

const AskAiInputSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--color-border);
`

const AskAiInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const AskAiInput = styled.input`
  flex: 1;
  padding: 6px 8px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: var(--color-teal);
    box-shadow: 0 0 6px var(--color-teal-glow);
  }

  &::placeholder {
    color: var(--color-text-dim);
  }
`

const AskAiSubmitBtn = styled.button<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: ${props => props.$disabled
    ? 'var(--color-metal-dark)'
    : 'linear-gradient(135deg, var(--color-brass), var(--color-copper))'};
  border: 1px solid ${props => props.$disabled ? 'var(--color-border)' : 'transparent'};
  border-radius: 4px;
  color: ${props => props.$disabled ? 'var(--color-text-dim)' : 'var(--color-void)'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;

  &:hover {
    ${props => !props.$disabled && `
      transform: translateY(-1px);
      box-shadow: 0 2px 8px var(--color-copper-glow);
    `}
  }
`
```

- [ ] **Step 6: Render `AskAiInputSection` in JSX**

在 `Container` 内，`ActionsWrapper` 之后添加：

```tsx
return (
  <Container>
    {/* Logo */}
    <LogoSection key={animateKey}>
      <LogoCore>
        <Sparkles size={12} />
      </LogoCore>
    </LogoSection>

    {/* Divider */}
    <Divider />

    {/* Actions - 单列垂直布局 */}
    <ActionsWrapper>
      <ActionButtons
        actionItems={realActionItems}
        handleAction={handleAction}
        copyIconStatus={copyIconStatus}
        copyIconAnimation={copyIconAnimation}
      />
    </ActionsWrapper>

    {/* Ask AI Input - 条件渲染 */}
    {enableAskAi && (
      <AskAiInputSection>
        <AskAiInputRow>
          <AskAiInput
            type="text"
            placeholder="输入问题..."
            value={askAiInput}
            onChange={(e) => setAskAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && askAiInput.trim()) {
                handleAskAiSubmit()
              }
            }}
          />
          <AskAiSubmitBtn
            $disabled={!askAiInput.trim()}
            onClick={handleAskAiSubmit}
            disabled={!askAiInput.trim()}
          >
            <Send size={12} />
          </AskAiSubmitBtn>
        </AskAiInputRow>
      </AskAiInputSection>
    )}
  </Container>
)
```

- [ ] **Step 7: Update `updateWindowSize` to recalculate when `enableAskAi` changes**

在 `useEffect` 中添加依赖：

```typescript
useEffect(() => {
  updateWindowSize()
}, [realActionItems, enableAskAi])
```

- [ ] **Step 8: Commit**

```bash
git add src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx
git commit -m "feat(toolbar): add AskAiInputSection component"
```

---

### Task 10: ActionAskAi 组件

**Files:**
- Create: `src/renderer/src/windows/selection/action/components/ActionAskAi.tsx`

- [ ] **Step 1: Create `ActionAskAi.tsx`**

```tsx
/**
 * 问AI动作组件 - 多轮对话
 * Retro-Futurism: Atomic Age Elegance
 */

import { getAskAiAssistant, fetchChatCompletion, abortCurrentRequest } from '@renderer/services/LLMService'
import { getProvider, getModel } from '@renderer/services/ConfigService'
import type { ActionItem, Chunk, Provider, Model } from '@renderer/types'
import { ChunkType } from '@renderer/types'
import { Send, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  action: ActionItem
  scrollToBottom?: () => void
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const ActionAskAi: FC<Props> = React.memo(({ action, scrollToBottom }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentResponse, setCurrentResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'preparing' | 'streaming' | 'finished'>('preparing')
  const [inputValue, setInputValue] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [model, setModel] = useState<Model | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      const p = await getProvider()
      const m = await getModel()
      setProvider(p)
      setModel(m)
    }
    loadConfig()
  }, [])

  const callLLM = useCallback(async (msgs: Message[]) => {
    if (!provider || !model) return
    if (!provider.apiKey) {
      setError('请先配置 API Key')
      setStatus('finished')
      return
    }

    setStatus('preparing')
    setError(null)
    setCurrentResponse('')

    const assistant = getAskAiAssistant()
    const apiMessages = [
      { role: 'system' as const, content: assistant.prompt },
      ...msgs.map(m => ({ role: m.role, content: m.content }))
    ]

    abortControllerRef.current = new AbortController()

    try {
      await fetchChatCompletion({
        provider,
        model,
        messages: apiMessages.map((m, i) => ({
          id: `msg-${i}`,
          role: m.role,
          content: m.content,
          createdAt: new Date().toISOString()
        })),
        temperature: assistant.settings.temperature,
        stream: true,
        abortSignal: abortControllerRef.current.signal,
        onChunk: (chunk: Chunk) => {
          switch (chunk.type) {
            case ChunkType.TEXT_START:
              setStatus('streaming')
              break
            case ChunkType.TEXT_DELTA:
              setCurrentResponse(chunk.text || '')
              scrollToBottom?.()
              break
            case ChunkType.TEXT_COMPLETE:
              setStatus('finished')
              // Add assistant message to history
              setMessages(prev => [...prev, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: chunk.text || ''
              }])
              setCurrentResponse('')
              break
            case ChunkType.ERROR:
              setStatus('finished')
              setError(chunk.error?.message || '发生错误')
              break
          }
        }
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message)
      setStatus('finished')
    }
  }, [provider, model, scrollToBottom])

  // Initialize with first question
  useEffect(() => {
    if (provider && model && action.selectedText && action.userQuestion) {
      const initialMessage: Message = {
        id: 'user-initial',
        role: 'user',
        content: `选中的文本：\n${action.selectedText}\n\n我的问题：${action.userQuestion}`
      }
      setMessages([initialMessage])
      callLLM([initialMessage])
    }
  }, [action.selectedText, action.userQuestion, provider, model, callLLM])

  const handleFollowUp = useCallback(() => {
    if (!inputValue.trim() || status === 'streaming') return

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim()
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputValue('')
    callLLM([...messages, newUserMessage])
  }, [inputValue, status, messages, callLLM])

  const handlePause = useCallback(() => {
    abortControllerRef.current?.abort()
    setStatus('finished')
  }, [])

  const isStreaming = status === 'streaming'

  return (
    <Container>
      <MenuContainer>
        <OriginalHeader onClick={() => setShowOriginal(!showOriginal)}>
          <span>{showOriginal ? '隐藏原文' : '显示原文'}</span>
          <ChevronDown size={11} className={showOriginal ? 'expanded' : ''} />
        </OriginalHeader>
      </MenuContainer>

      {showOriginal && <OriginalContent>{action.selectedText}</OriginalContent>}

      <MessagesContainer>
        {messages.map((msg, index) => (
          <MessageBubble key={msg.id} $role={msg.role}>
            {msg.role === 'user' ? (
              <UserContent>{msg.content}</UserContent>
            ) : (
              <MarkdownContent>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </MarkdownContent>
            )}
          </MessageBubble>
        ))}

        {isStreaming && currentResponse && (
          <MessageBubble $role="assistant">
            <MarkdownContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentResponse}</ReactMarkdown>
            </MarkdownContent>
          </MessageBubble>
        )}

        {status === 'preparing' && (
          <LoadingIndicator>
            <LoadingOrbit>
              <LoadingRing />
              <LoadingCore />
            </LoadingOrbit>
          </LoadingIndicator>
        )}

        {error && <ErrorMsg>{error}</ErrorMsg>}
      </MessagesContainer>

      <InputContainer>
        <InputRow>
          <ChatInput
            type="text"
            placeholder="继续追问..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim() && !isStreaming) {
                handleFollowUp()
              }
            }}
            disabled={isStreaming}
          />
          <SendBtn
            $disabled={!inputValue.trim() || isStreaming}
            onClick={isStreaming ? handlePause : handleFollowUp}
          >
            {isStreaming ? '...' : <Send size={12} />}
          </SendBtn>
        </InputRow>
      </InputContainer>
    </Container>
  )
})

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const corePulse = keyframes`
  0%, 100% { box-shadow: 0 0 8px var(--color-copper-glow); }
  50% { box-shadow: 0 0 16px var(--color-teal-glow); }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`

const MenuContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`

const OriginalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  cursor: pointer;
  color: var(--color-text-dim);
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  padding: 4px 0;
  transition: color 0.2s ease;

  &:hover { color: var(--color-teal); }

  .lucide {
    transition: transform 0.2s ease;
    &.expanded { transform: rotate(180deg); }
  }
`

const OriginalContent = styled.div`
  padding: 10px;
  margin-bottom: 12px;
  background: rgba(201, 168, 108, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
`

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
  margin-bottom: 12px;
`

const MessageBubble = styled.div<{ $role: 'user' | 'assistant' }>`
  padding: 10px 12px;
  border-radius: 8px;
  max-width: 90%;
  align-self: ${props => props.$role === 'user' ? 'flex-end' : 'flex-start'};
  background: ${props => props.$role === 'user'
    ? 'linear-gradient(135deg, var(--color-brass), var(--color-copper))'
    : 'rgba(201, 168, 108, 0.08)'};
  border: 1px solid ${props => props.$role === 'user'
    ? 'transparent'
    : 'var(--color-border)'};
`

const UserContent = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: var(--color-void);
  white-space: pre-wrap;
  word-break: break-word;
`

const MarkdownContent = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text);

  p { margin: 0.5em 0; }
  code {
    background: rgba(201, 168, 108, 0.1);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0.1em 0.3em;
    font-size: 0.9em;
    color: var(--color-teal);
  }
  pre {
    background: rgba(10, 15, 26, 0.8);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 10px;
    overflow-x: auto;
    code {
      background: transparent;
      border: none;
      padding: 0;
    }
  }
`

const InputContainer = styled.div`
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ChatInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text);
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: var(--color-teal);
    box-shadow: 0 0 8px var(--color-teal-glow);
  }

  &:disabled {
    opacity: 0.6;
  }

  &::placeholder { color: var(--color-text-dim); }
`

const SendBtn = styled.button<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${props => props.$disabled
    ? 'var(--color-metal-dark)'
    : 'linear-gradient(135deg, var(--color-brass), var(--color-copper))'};
  border: 1px solid ${props => props.$disabled ? 'var(--color-border)' : 'transparent'};
  border-radius: 6px;
  color: ${props => props.$disabled ? 'var(--color-text-dim)' : 'var(--color-void)'};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;

  &:hover {
    ${props => !props.$disabled && `
      transform: translateY(-1px);
      box-shadow: 0 2px 8px var(--color-copper-glow);
    `}
  }
`

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`

const LoadingOrbit = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoadingRing = styled.div`
  position: absolute;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-brass);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${orbitSpin} 1s linear infinite;
`

const LoadingCore = styled.div`
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-teal));
  border-radius: 50%;
  animation: ${corePulse} 1.5s ease-in-out infinite;
`

const ErrorMsg = styled.div`
  color: var(--color-error);
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 10px 14px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
`

export default ActionAskAi
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/windows/selection/action/components/ActionAskAi.tsx
git commit -m "feat(action): create ActionAskAi component for multi-turn conversation"
```

---

### Task 11: 路由到 ActionAskAi

**Files:**
- Modify: `src/renderer/src/windows/selection/action/SelectionActionApp.tsx`

- [ ] **Step 1: Import ActionAskAi**

```typescript
import ActionAskAi from './components/ActionAskAi'
```

- [ ] **Step 2: Add routing for `ask-ai` action**

修改 `Content` 部分的渲染逻辑：

```tsx
<Content ref={contentElementRef}>
  {action.id === 'translate' && <ActionTranslate action={action} scrollToBottom={handleScrollToBottom} />}
  {action.id === 'ask-ai' && <ActionAskAi action={action} scrollToBottom={handleScrollToBottom} />}
  {action.id !== 'translate' && action.id !== 'ask-ai' && <ActionGeneral action={action} scrollToBottom={handleScrollToBottom} />}
</Content>
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/windows/selection/action/SelectionActionApp.tsx
git commit -m "feat(action): route ask-ai action to ActionAskAi component"
```

---

### Task 12: 主窗口设置页开关

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add `enableAskAi` from hook**

在 `useSelectionAssistant` 解构中添加：

```typescript
const {
  selectionEnabled,
  setSelectionEnabled,
  actionItems,
  setActionItems,
  enableAskAi,
  setEnableAskAi
} = useSelectionAssistant()
```

- [ ] **Step 2: Add import and load `enableAskAi` from config**

在文件顶部添加 import：

```typescript
import { setEnableAskAi as setEnableAskAiAction } from './store'
```

在 `useEffect` 的 `loadConfig` 函数中，与其他配置加载一起添加：

```typescript
// 在加载 selection 配置的代码块中
if (selectionConfig.enableAskAi !== undefined) {
  dispatch(setEnableAskAiAction(selectionConfig.enableAskAi))
}
```

- [ ] **Step 3: Add "问AI" toggle in Actions section**

在动作列表部分，内置动作之前添加：

```tsx
{/* 问AI 开关 */}
<ActionRow>
  <ActionName>问AI</ActionName>
  <Toggle
    $checked={enableAskAi}
    onClick={() => setEnableAskAi(!enableAskAi)}
  >
    <ToggleTrack />
    <ToggleKnob $checked={enableAskAi} />
  </Toggle>
</ActionRow>

<ActionDivider />
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat(settings): add 问AI toggle switch"
```

---

### Task 13: 集成测试与验证

- [ ] **Step 1: Start development server**

```bash
cd E:/LEON/selection-assistant
pnpm dev
```

- [ ] **Step 2: Verify feature works**

1. 打开主窗口，在动作列表中开启"问AI"
2. 在任意应用中选中文本
3. 确认工具栏底部显示输入框
4. 输入问题并提交
5. 确认动作窗口打开并显示回答
6. 在动作窗口中输入追问，确认多轮对话正常

- [ ] **Step 3: Final commit if all tests pass**

```bash
git add -A
git commit -m "feat: complete 问AI feature implementation"
```
