# 自定义动作功能设计

## 概述

为划词助手添加自定义动作功能，允许用户创建、删除自定义动作，扩展 AI 处理能力。

## 需求总结

| 项目 | 决策 |
|------|------|
| 操作 | 新增、删除自定义动作（内置动作不可删除） |
| 图标 | 预设图标列表选择（20个 lucide-react 图标） |
| 名称限制 | 15字节（约5个中文字或15个英文字符） |
| 提示词限制 | 2000字符，必须包含 `{{selection}}` |
| 删除确认 | 二次确认弹窗 |
| UI 形式 | 智能方向 Drawer（根据窗口位置决定展开方向） |

## 架构设计

### 整体流程

```
用户点击"添加自定义动作"
    ↓
检测主窗口屏幕位置
    ↓
┌─────────────────────────────────────┐
│ X < 屏幕宽度/2 → Drawer 从右侧展开  │
│ X >= 屏幕宽度/2 → Drawer 从左侧展开 │
└─────────────────────────────────────┘
    ↓
用户填写表单（图标、名称、提示词）
    ↓
表单验证通过
    ↓
保存到 actionItems（新增 ActionItem）
    ↓
同步到主进程持久化
```

### 组件结构

```
App.tsx
├── Section (动作列表)
│   ├── ActionRow (内置动作) × N
│   │   └── Toggle
│   ├── ActionRow (自定义动作) × M
│   │   ├── Toggle
│   │   └── DeleteButton
│   └── AddCustomActionBtn
└── CustomActionDrawer (新增)
    ├── DrawerHeader
    ├── IconSelector (图标选择器)
    ├── NameInput (名称输入，15字节限制)
    ├── PromptInput (提示词输入，2000字符限制)
    └── SaveButton
```

## 模块设计

### 1. ActionItem 类型扩展

现有 `ActionItem` 已支持 `prompt` 和 `isBuiltIn` 字段，无需修改类型定义。

```typescript
// src/shared/types.ts
interface ActionItem {
  id: string
  name: string
  enabled: boolean
  isBuiltIn: boolean
  icon?: string
  prompt?: string        // 自定义动作的提示词
  // ...其他字段
}
```

### 2. 预设图标列表

```typescript
// src/renderer/src/constants/icons.ts
import {
  Sparkles, WandSparkles, PenTool, Edit3, Code,
  FileText, MessageSquare, Languages, BookOpen, Lightbulb,
  Target, Zap, Flame, Star, Heart,
  Bookmark, Flag, Music, Palette, Rocket
} from 'lucide-react'

export const PRESET_ICONS = [
  { id: 'sparkles', name: '火花', component: Sparkles },
  { id: 'wand-sparkles', name: '魔法棒', component: WandSparkles },
  { id: 'pen-tool', name: '画笔', component: PenTool },
  { id: 'edit-3', name: '编辑', component: Edit3 },
  { id: 'code', name: '代码', component: Code },
  { id: 'file-text', name: '文档', component: FileText },
  { id: 'message-square', name: '消息', component: MessageSquare },
  { id: 'languages', name: '语言', component: Languages },
  { id: 'book-open', name: '书本', component: BookOpen },
  { id: 'lightbulb', name: '灯泡', component: Lightbulb },
  { id: 'target', name: '目标', component: Target },
  { id: 'zap', name: '闪电', component: Zap },
  { id: 'flame', name: '火焰', component: Flame },
  { id: 'star', name: '星星', component: Star },
  { id: 'heart', name: '心形', component: Heart },
  { id: 'bookmark', name: '书签', component: Bookmark },
  { id: 'flag', name: '旗帜', component: Flag },
  { id: 'music', name: '音乐', component: Music },
  { id: 'palette', name: '调色板', component: Palette },
  { id: 'rocket', name: '火箭', component: Rocket }
]
```

### 3. CustomActionDrawer 组件

```typescript
// src/renderer/src/components/CustomActionDrawer.tsx

interface CustomActionDrawerProps {
  visible: boolean
  onClose: () => void
  onSave: (action: Omit<ActionItem, 'id' | 'enabled'>) => void
  anchorPosition: 'left' | 'right'  // 根据 window 位置计算
}

// 功能：
// 1. 图标网格选择器（单选）
// 2. 名称输入（字节计数，15字节限制）
// 3. 提示词输入（字符计数，2000字符限制，验证 {{selection}}）
// 4. 保存按钮（表单验证通过后启用）
```

### 4. 字节计算工具

```typescript
// src/renderer/src/utils/byteLength.ts

export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}
```

### 5. 删除确认弹窗

```typescript
// 使用 antd Modal.confirm 或自定义确认弹窗
// 样式需与主窗口 Retro-Futurism 风格一致

const confirmDelete = (actionName: string, onConfirm: () => void) => {
  // 弹出确认对话框
}
```

### 6. Drawer 方向计算

```typescript
// src/renderer/src/utils/getDrawerAnchor.ts

export function getDrawerAnchor(): 'left' | 'right' {
  const windowX = window.screenX
  const screenWidth = screen.width
  return windowX < screenWidth / 2 ? 'right' : 'left'
}
```

## UI 设计

### 1. 动作列表扩展

在现有"动作列表"section 中：
- 内置动作行保持不变（名称 + Toggle）
- 自定义动作行添加删除按钮（垃圾桶图标）
- 列表底部添加"添加自定义动作"按钮

### 2. Drawer 侧边栏样式

- 背景色：`var(--color-glass)`
- 边框：`1px solid var(--color-border)`
- 字体：Audiowide（标题）、Fira Code（内容）
- 配色：黄铜色（`var(--color-brass)`）+ 青色（`var(--color-teal)`）

### 3. 图标选择器

- 4×5 网格布局
- 选中状态：青色边框 + 发光效果
- 未选中状态：透明背景，hover 时显示边框

### 4. 删除确认弹窗

- 标题：黄铜色
- 删除按钮：`var(--color-error)` 红色
- 取消按钮：默认样式

## 数据流

```
用户操作
    ↓
App.tsx 状态更新 (useState)
    ↓
Redux store 更新 (setActionItems)
    ↓
持久化到 electron-store (window.api.config.set)
    ↓
同步到主进程 (SelectionService)
    ↓
划词时传递到 Toolbar
```

## 错误处理

| 场景 | 处理方式 |
|------|----------|
| 名称为空 | 禁用保存按钮，显示错误提示 |
| 名称超长 | 输入时截断或阻止输入 |
| 提示词为空 | 禁用保存按钮，显示错误提示 |
| 提示词缺少 {{selection}} | 禁用保存按钮，显示"必须包含 {{selection}}" |
| 提示词超长 | 输入时截断或阻止输入 |

## 测试要点

1. **新增动作**
   - 所有字段正确填写，保存成功
   - 名称边界：0字节、15字节、16字节
   - 提示词边界：无 {{selection}}、有 {{selection}}
   - 图标选择：默认状态、选中状态

2. **删除动作**
   - 点击删除按钮，弹窗确认
   - 确认删除，动作从列表移除
   - 取消删除，动作保持不变
   - 内置动作无删除按钮

3. **Drawer 方向**
   - 窗口在屏幕左侧，Drawer 从右侧展开
   - 窗口在屏幕右侧，Drawer 从左侧展开

4. **持久化**
   - 新增动作后重启应用，动作仍存在
   - 删除动作后重启应用，动作已移除
