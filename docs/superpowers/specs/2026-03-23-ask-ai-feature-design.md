# 问AI功能设计

## 概述

在划词助手中添加内置功能"问AI"。启用后，工具栏底部显示输入框，用户可输入关于选中文本的问题，由 LLM 回答，并支持多轮对话。

## 需求

- 主窗口设置中新增"问AI"开关
- 启用后，工具栏底部显示输入框和提交按钮
- 用户输入问题后，打开动作窗口显示 LLM 回答
- 动作窗口支持多轮对话追问

## 设计

### 1. 数据结构

**新增配置项：**

```typescript
// 存储路径：ConfigService
enableAskAi: boolean  // 默认 false
```

**动作标识：**

工具栏提交时构造的 action 对象：

```typescript
{
  id: 'ask-ai',
  name: '问AI',
  isBuiltIn: true,
  selectedText: string,  // 选中的文本
  userQuestion: string   // 用户输入的问题
}
```

### 2. 工具栏改动

**文件：** `src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx`

**布局：**

```
┌─────────────────────────────────┐
│ ✨ │ 翻译 │ 解释 │ 总结 │ ... │  ← 原有动作按钮
├─────────────────────────────────┤
│ [输入框................] [提交] │  ← enableAskAi=true 时显示
└─────────────────────────────────┘
```

**改动点：**

1. 从主窗口同步 `enableAskAi` 状态（通过 `TextSelected` IPC 事件传递）
2. 新增 `AskAiInputSection` 组件：
   - 文本输入框（支持 Enter 提交）
   - 提交按钮（输入为空时禁用）
3. 提交时构造 action 对象，调用 `processAction`

**交互流程：**

1. 用户选中文本 → 工具栏显示
2. 若 `enableAskAi` 为 true，底部显示输入区域
3. 用户输入问题，点击提交或按 Enter
4. 构造 action 对象（包含 selectedText 和 userQuestion），调用 `window.api.selection.processAction`
5. 工具栏隐藏，动作窗口打开

### 3. 动作窗口改动

**新建文件：** `src/renderer/src/windows/selection/action/components/ActionAskAi.tsx`

**组件结构：**

```tsx
interface ActionAskAiProps {
  action: ActionItem
  scrollToBottom: () => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}
```

**功能：**

1. 接收 action（包含 selectedText）和用户初始问题
2. 构造初始消息：
   ```
   选中的文本：
   {selectedText}

   我的问题：{userQuestion}
   ```
3. 调用 LLM API，流式显示回答
4. 底部固定输入区域，支持追问
5. 追问时追加消息到对话历史

**对话上下文管理：**

```typescript
const [messages, setMessages] = useState<Message[]>([])
const [isStreaming, setIsStreaming] = useState(false)

// 初始化
useEffect(() => {
  const initialMessage = `选中的文本：\n${action.selectedText}\n\n我的问题：${action.userQuestion}`
  setMessages([{ role: 'user', content: initialMessage }])
  callLLM(initialMessage)
}, [])

// 追问
const handleFollowUp = (question: string) => {
  setMessages(prev => [...prev, { role: 'user', content: question }])
  callLLM(question, [...messages, { role: 'user', content: question }])
}
```

**路由逻辑：**

修改 `SelectionActionApp.tsx`：

```tsx
{action.id === 'translate' && <ActionTranslate action={action} scrollToBottom={handleScrollToBottom} />}
{action.id === 'ask-ai' && <ActionAskAi action={action} scrollToBottom={handleScrollToBottom} />}
{action.id !== 'translate' && action.id !== 'ask-ai' && <ActionGeneral action={action} scrollToBottom={handleScrollToBottom} />}
```

### 4. 主窗口设置页改动

**文件：** `src/renderer/src/App.tsx`（或相关设置组件）

**改动点：**

1. 新增"问AI"开关控件
2. 开关状态存储到 `ConfigService` 的 `enableAskAi`
3. 与其他内置动作的启用/禁用逻辑保持一致

### 5. IPC 通信改动

**文件：** `src/shared/IpcChannel.ts`（如需新增通道）

**数据传递：**

`TextSelected` 事件已有传递 `actionItems` 的机制，扩展其数据结构以传递 `enableAskAi`：

```typescript
interface SelectionData {
  text: string
  isFullscreen?: boolean
  actionItems?: ActionItem[]
  enableAskAi?: boolean  // 新增
}
```

### 6. ActionItem 类型扩展

**文件：** `src/shared/types.ts`

```typescript
interface ActionItem {
  id: string
  name: string
  enabled: boolean
  isBuiltIn: boolean
  icon?: string
  prompt?: string
  searchEngine?: string
  selectedText?: string
  userQuestion?: string  // 新增：问AI时用户输入的问题
}
```

## 文件改动清单

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `src/shared/types.ts` | 修改 | ActionItem 新增 userQuestion 字段 |
| `src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx` | 修改 | 新增 AskAiInputSection 组件 |
| `src/renderer/src/windows/selection/action/components/ActionAskAi.tsx` | 新建 | 多轮对话组件 |
| `src/renderer/src/windows/selection/action/SelectionActionApp.tsx` | 修改 | 路由到 ActionAskAi |
| `src/renderer/src/App.tsx` | 修改 | 新增"问AI"开关 |
| `src/main/services/SelectionService.ts` | 修改 | 传递 enableAskAi 到工具栏 |
| `src/main/services/ConfigService.ts` | 修改 | 新增 enableAskAi 配置项 |

## 实现顺序

1. 类型定义扩展（types.ts）
2. 配置服务扩展（ConfigService.ts）
3. 工具栏输入区域（SelectionToolbar.tsx）
4. IPC 数据传递（SelectionService.ts）
5. 动作窗口组件（ActionAskAi.tsx + SelectionActionApp.tsx）
6. 主窗口设置页开关（App.tsx）
