# 自定义动作功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为划词助手添加自定义动作功能，支持用户新增、删除自定义动作

**Architecture:** 在现有动作列表基础上，添加 Drawer 侧边栏用于创建自定义动作，支持预设图标选择、名称/提示词输入验证，删除时二次确认。Drawer 根据窗口位置智能决定展开方向。

**Tech Stack:** React, styled-components, lucide-react, antd (Modal.confirm)

---

## File Structure

```
src/renderer/src/
├── constants/
│   └── icons.ts                    # [Create] 预设图标列表
├── utils/
│   ├── byteLength.ts               # [Create] 字节长度计算
│   └── getDrawerAnchor.ts          # [Create] Drawer方向计算
├── components/
│   ├── CustomActionDrawer.tsx      # [Create] 自定义动作编辑侧边栏
│   └── DeleteConfirmModal.tsx      # [Create] 删除确认弹窗
├── App.tsx                         # [Modify] 添加自定义动作UI
└── windows/selection/toolbar/
    └── SelectionToolbar.tsx        # [Modify] 支持自定义图标渲染
```

---

### Task 1: 工具函数 - 字节长度计算

**Files:**
- Create: `src/renderer/src/utils/byteLength.ts`

- [ ] **Step 1: 创建字节长度计算函数**

```typescript
// src/renderer/src/utils/byteLength.ts

/**
 * 计算字符串的字节长度
 * 中文占3字节，英文占1字节（UTF-8编码）
 */
export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

/**
 * 截断字符串到指定字节长度
 */
export function truncateToByteLength(str: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let result = ''
  let currentBytes = 0

  for (const char of str) {
    const charBytes = encoder.encode(char).length
    if (currentBytes + charBytes > maxBytes) {
      break
    }
    result += char
    currentBytes += charBytes
  }

  return result
}
```

- [ ] **Step 2: 验证函数工作正常**

在浏览器控制台测试：
```javascript
import { getByteLength, truncateToByteLength } from './utils/byteLength'
console.log(getByteLength('润色')) // 6 bytes (2中文 × 3)
console.log(getByteLength('abc')) // 3 bytes
console.log(truncateToByteLength('润色文本', 9)) // '润色' (6 bytes, 第三个字'文'会超过9)
```

---

### Task 2: 工具函数 - Drawer方向计算

**Files:**
- Create: `src/renderer/src/utils/getDrawerAnchor.ts`

- [ ] **Step 1: 创建Drawer方向计算函数**

```typescript
// src/renderer/src/utils/getDrawerAnchor.ts

/**
 * 根据窗口屏幕位置计算Drawer展开方向
 * 窗口在屏幕左侧 → 从右侧展开
 * 窗口在屏幕右侧 → 从左侧展开
 */
export function getDrawerAnchor(): 'left' | 'right' {
  const windowX = window.screenX
  const screenWidth = screen.width
  return windowX < screenWidth / 2 ? 'right' : 'left'
}
```

---

### Task 3: 常量 - 预设图标列表

**Files:**
- Create: `src/renderer/src/constants/icons.ts`

- [ ] **Step 1: 创建预设图标常量**

```typescript
// src/renderer/src/constants/icons.ts

import type { FC } from 'react'
import {
  Sparkles,
  WandSparkles,
  PenTool,
  Edit3,
  Code,
  FileText,
  MessageSquare,
  Languages,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Flame,
  Star,
  Heart,
  Bookmark,
  Flag,
  Music,
  Palette,
  Rocket
} from 'lucide-react'

export interface PresetIcon {
  id: string
  name: string
  component: FC<{ size?: number; className?: string }>
}

export const PRESET_ICONS: PresetIcon[] = [
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

export const DEFAULT_ICON_ID = 'sparkles'

export function getIconComponent(iconId?: string): FC<{ size?: number; className?: string }> {
  if (!iconId) return Sparkles
  const found = PRESET_ICONS.find(icon => icon.id === iconId)
  return found ? found.component : Sparkles
}
```

---

### Task 4: 组件 - 删除确认弹窗

**Files:**
- Create: `src/renderer/src/components/DeleteConfirmModal.tsx`

- [ ] **Step 1: 创建删除确认弹窗组件**

```typescript
// src/renderer/src/components/DeleteConfirmModal.tsx

import React from 'react'
import styled from 'styled-components'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmModalProps {
  visible: boolean
  actionName: string
  onConfirm: () => void
  onCancel: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  actionName,
  onConfirm,
  onCancel
}) => {
  if (!visible) return null

  return (
    <Overlay onClick={onCancel}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <AlertIcon>
            <AlertTriangle size={20} />
          </AlertIcon>
          <ModalTitle>确认删除</ModalTitle>
          <CloseButton onClick={onCancel}>
            <X size={14} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <ConfirmText>
            确定要删除「<ActionName>{actionName}</ActionName>」吗？
          </ConfirmText>
          <WarningText>此操作无法撤销。</WarningText>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onCancel}>取消</CancelButton>
          <DeleteButton onClick={onConfirm}>删除</DeleteButton>
        </ModalFooter>
      </ModalContainer>
    </Overlay>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 16, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`

const ModalContainer = styled.div`
  min-width: 280px;
  background: var(--color-glass);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(201, 168, 108, 0.06) 0%, transparent 100%);
`

const AlertIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(248, 113, 113, 0.15);
  border-radius: 6px;
  color: var(--color-error);
`

const ModalTitle = styled.div`
  flex: 1;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-brass-light);
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(201, 168, 108, 0.1);
    border-color: var(--color-border);
    color: var(--color-text);
  }
`

const ModalBody = styled.div`
  padding: 16px;
`

const ConfirmText = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: var(--color-text);
  margin-bottom: 8px;
`

const ActionName = styled.span`
  color: var(--color-teal);
  font-weight: 500;
`

const WarningText = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  color: var(--color-text-dim);
`

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
`

const CancelButton = styled.button`
  padding: 8px 16px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(201, 168, 108, 0.1);
    border-color: var(--color-brass);
    color: var(--color-text);
  }
`

const DeleteButton = styled.button`
  padding: 8px 16px;
  background: var(--color-error);
  border: 1px solid var(--color-error);
  border-radius: 4px;
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  letter-spacing: 1px;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #ef4444;
    box-shadow: 0 0 12px rgba(248, 113, 113, 0.4);
  }
`
```

---

### Task 5: 组件 - 自定义动作Drawer

**Files:**
- Create: `src/renderer/src/components/CustomActionDrawer.tsx`

- [ ] **Step 1: 创建Drawer组件**

```typescript
// src/renderer/src/components/CustomActionDrawer.tsx

import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { X, Check } from 'lucide-react'
import type { ActionItem } from '@shared/types'
import { PRESET_ICONS, DEFAULT_ICON_ID, getIconComponent } from '../constants/icons'
import { getByteLength, truncateToByteLength } from '../utils/byteLength'

const MAX_NAME_BYTES = 15
const MAX_PROMPT_CHARS = 2000

interface CustomActionDrawerProps {
  visible: boolean
  anchor: 'left' | 'right'
  onClose: () => void
  onSave: (action: { name: string; icon: string; prompt: string }) => void
}

export const CustomActionDrawer: React.FC<CustomActionDrawerProps> = ({
  visible,
  anchor,
  onClose,
  onSave
}) => {
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_ICON_ID)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [nameBytes, setNameBytes] = useState(0)
  const [promptError, setPromptError] = useState('')

  // 重置表单
  useEffect(() => {
    if (visible) {
      setSelectedIcon(DEFAULT_ICON_ID)
      setName('')
      setPrompt('')
      setNameBytes(0)
      setPromptError('')
    }
  }, [visible])

  // 名称输入处理
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const truncated = truncateToByteLength(value, MAX_NAME_BYTES)
    setName(truncated)
    setNameBytes(getByteLength(truncated))
  }

  // 提示词输入处理
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_PROMPT_CHARS)
    setPrompt(value)

    if (value && !value.includes('{{selection}}')) {
      setPromptError('必须包含 {{selection}}')
    } else {
      setPromptError('')
    }
  }

  // 验证表单
  const isFormValid = useCallback(() => {
    return name.trim() &&
           prompt.trim() &&
           prompt.includes('{{selection}}') &&
           nameBytes <= MAX_NAME_BYTES
  }, [name, prompt, nameBytes])

  // 保存
  const handleSave = () => {
    if (!isFormValid()) return

    onSave({
      name: name.trim(),
      icon: selectedIcon,
      prompt: prompt.trim()
    })
    onClose()
  }

  if (!visible) return null

  return (
    <DrawerOverlay onClick={onClose}>
      <DrawerContainer $anchor={anchor} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <DrawerHeader>
          <DrawerTitle>
            <GearIcon>⚙</GearIcon>
            自定义动作
          </DrawerTitle>
          <CloseBtn onClick={onClose}>
            <X size={14} />
          </CloseBtn>
        </DrawerHeader>

        {/* Content */}
        <DrawerContent>
          {/* Icon Selector */}
          <FieldSection>
            <FieldLabel>图标</FieldLabel>
            <IconGrid>
              {PRESET_ICONS.map(icon => {
                const IconComponent = icon.component
                const isSelected = selectedIcon === icon.id
                return (
                  <IconButton
                    key={icon.id}
                    $selected={isSelected}
                    onClick={() => setSelectedIcon(icon.id)}
                    title={icon.name}
                  >
                    <IconComponent size={16} />
                    {isSelected && <SelectedIndicator><Check size={10} /></SelectedIndicator>}
                  </IconButton>
                )
              })}
            </IconGrid>
          </FieldSection>

          {/* Name Input */}
          <FieldSection>
            <FieldLabel>名称</FieldLabel>
            <StyledInput
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="例如：润色"
              maxLength={20}
            />
            <ByteCounter $warning={nameBytes > MAX_NAME_BYTES}>
              {nameBytes}/{MAX_NAME_BYTES} 字节
            </ByteCounter>
          </FieldSection>

          {/* Prompt Input */}
          <FieldSection>
            <FieldLabel>提示词</FieldLabel>
            <StyledTextarea
              value={prompt}
              onChange={handlePromptChange}
              placeholder="请对以下文本进行处理：&#10;{{selection}}"
              rows={6}
            />
            <FieldHint $error={!!promptError}>
              {promptError || `${prompt.length}/${MAX_PROMPT_CHARS} 字符`}
            </FieldHint>
          </FieldSection>

          {/* Save Button */}
          <SaveBtn onClick={handleSave} disabled={!isFormValid()}>
            <ButtonGlow />
            <ButtonText>保 存</ButtonText>
          </SaveBtn>
        </DrawerContent>
      </DrawerContainer>
    </DrawerOverlay>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const slideInRight = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const slideInLeft = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 16, 0.75);
  backdrop-filter: blur(4px);
  z-index: 100;
  animation: ${fadeIn} 0.2s ease;
`

const DrawerContainer = styled.div<{ $anchor: 'left' | 'right' }>`
  position: fixed;
  top: 0;
  ${props => props.$anchor}: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-glass);
  backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-${props => props.$anchor === 'right' ? 'left' : 'right'}: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  animation: ${props => props.$anchor === 'right' ? slideInRight : slideInLeft} 0.25s ease;
  box-shadow: ${props => props.$anchor === 'right'
    ? '-8px 0 32px rgba(0, 0, 0, 0.3)'
    : '8px 0 32px rgba(0, 0, 0, 0.3)'};
`

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(201, 168, 108, 0.06) 0%, transparent 100%);
`

const DrawerTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-brass-light);
`

const GearIcon = styled.span`
  color: var(--color-brass);
`

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(201, 168, 108, 0.1);
    border-color: var(--color-border);
    color: var(--color-text);
  }
`

const DrawerContent = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`

const FieldSection = styled.div`
  margin-bottom: 16px;
`

const FieldLabel = styled.div`
  font-family: 'Audiowide', sans-serif;
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--color-text-dim);
  margin-bottom: 8px;
`

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
`

const IconButton = styled.div<{ $selected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${props => props.$selected
    ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(123, 104, 238, 0.1))'
    : 'var(--color-metal-dark)'};
  border: 1px solid ${props => props.$selected
    ? 'var(--color-teal)'
    : 'var(--color-border)'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: ${props => props.$selected ? 'var(--color-teal)' : 'var(--color-text-secondary)'};

  &:hover {
    background: rgba(201, 168, 108, 0.1);
    border-color: var(--color-brass);
    color: var(--color-text);
  }

  ${props => props.$selected && `
    box-shadow: 0 0 10px var(--color-teal-glow);
  `}
`

const SelectedIndicator = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  background: var(--color-teal);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-void);
`

const StyledInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  transition: all 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--color-teal);
    box-shadow: 0 0 8px var(--color-teal-glow);
  }

  &::placeholder {
    color: var(--color-text-dim);
  }
`

const ByteCounter = styled.div<{ $warning: boolean }>`
  margin-top: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 9px;
  color: ${props => props.$warning ? 'var(--color-error)' : 'var(--color-text-dim)'};
`

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: all 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--color-teal);
    box-shadow: 0 0 8px var(--color-teal-glow);
  }

  &::placeholder {
    color: var(--color-text-dim);
  }
`

const FieldHint = styled.div<{ $error: boolean }>`
  margin-top: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 9px;
  color: ${props => props.$error ? 'var(--color-error)' : 'var(--color-text-dim)'};
`

const SaveBtn = styled.button<{ disabled: boolean }>`
  position: relative;
  width: 100%;
  padding: 12px;
  background: ${props => props.disabled
    ? 'var(--color-metal-dark)'
    : 'linear-gradient(135deg, var(--color-brass), var(--color-copper))'};
  border: none;
  border-radius: 4px;
  overflow: hidden;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--color-copper-glow);
  }
`

const ButtonGlow = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;

  ${SaveBtn}:hover:not(:disabled) & {
    transform: translateX(100%);
  }
`

const ButtonText = styled.span`
  position: relative;
  z-index: 1;
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--color-void);
`
```

---

### Task 6: 修改App.tsx - 添加自定义动作UI

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: 添加imports和状态**

在文件顶部添加 imports：
```typescript
import { Trash2, Plus } from 'lucide-react'
import { CustomActionDrawer } from './components/CustomActionDrawer'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { getDrawerAnchor } from './utils/getDrawerAnchor'
```

在 App 组件内添加状态（约第27行后）：
```typescript
// 自定义动作相关状态
const [drawerVisible, setDrawerVisible] = useState(false)
const [drawerAnchor, setDrawerAnchor] = useState<'left' | 'right'>('right')
const [deleteModal, setDeleteModal] = useState<{ visible: boolean; actionId: string; actionName: string }>({
  visible: false,
  actionId: '',
  actionName: ''
})
```

- [ ] **Step 2: 添加处理函数**

在 `handleReactorClick` 函数后添加：
```typescript
// 打开添加自定义动作Drawer
const handleAddCustomAction = () => {
  setDrawerAnchor(getDrawerAnchor())
  setDrawerVisible(true)
}

// 保存自定义动作
const handleSaveCustomAction = (action: { name: string; icon: string; prompt: string }) => {
  const newAction: ActionItem = {
    id: `custom-${Date.now()}`,
    name: action.name,
    icon: action.icon,
    prompt: action.prompt,
    enabled: true,
    isBuiltIn: false
  }
  const newItems = [...actionItems, newAction]
  setActionItems(newItems)
}

// 删除自定义动作
const handleDeleteAction = () => {
  const newItems = actionItems.filter(item => item.id !== deleteModal.actionId)
  setActionItems(newItems)
  setDeleteModal({ visible: false, actionId: '', actionName: '' })
}

// 打开删除确认
const openDeleteConfirm = (actionId: string, actionName: string) => {
  setDeleteModal({ visible: true, actionId, actionName })
}
```

注意：需要在顶部添加 `import type { ActionItem } from '@shared/types'`（如果尚未导入）。

- [ ] **Step 3: 修改动作列表渲染**

找到 `{expandedSection === 'actions' && (` 部分，替换整个 `SectionContent` 内容：

```typescript
{expandedSection === 'actions' && (
  <SectionContent>
    {/* 内置动作 */}
    {actionItems.filter(item => item.isBuiltIn).map((item, index) => (
      <ActionRow key={item.id}>
        <ActionName>{item.name}</ActionName>
        <Toggle
          $checked={item.enabled}
          onClick={() => {
            const newItems = [...actionItems]
            newItems[index] = { ...item, enabled: !item.enabled }
            setActionItems(newItems)
          }}
        >
          <ToggleTrack />
          <ToggleKnob $checked={item.enabled} />
        </Toggle>
      </ActionRow>
    ))}

    {/* 分隔线 - 仅当有自定义动作时显示 */}
    {actionItems.some(item => !item.isBuiltIn) && (
      <ActionDivider />
    )}

    {/* 自定义动作 */}
    {actionItems.filter(item => !item.isBuiltIn).map((item) => (
      <ActionRow key={item.id}>
        <ActionName>{item.name}</ActionName>
        <ActionRowRight>
          <Toggle
            $checked={item.enabled}
            onClick={() => {
              const newItems = actionItems.map(a =>
                a.id === item.id ? { ...a, enabled: !a.enabled } : a
              )
              setActionItems(newItems)
            }}
          >
            <ToggleTrack />
            <ToggleKnob $checked={item.enabled} />
          </Toggle>
          <DeleteBtn onClick={() => openDeleteConfirm(item.id, item.name)}>
            <Trash2 size={12} />
          </DeleteBtn>
        </ActionRowRight>
      </ActionRow>
    ))}

    {/* 添加按钮 */}
    <AddButton onClick={handleAddCustomAction}>
      <Plus size={12} />
      <AddButtonText>添加自定义动作</AddButtonText>
    </AddButton>
  </SectionContent>
)}
```

- [ ] **Step 4: 在组件末尾添加Drawer和Modal**

在 `</Container>` 之前添加：
```typescript
      {/* Custom Action Drawer */}
      <CustomActionDrawer
        visible={drawerVisible}
        anchor={drawerAnchor}
        onClose={() => setDrawerVisible(false)}
        onSave={handleSaveCustomAction}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        visible={deleteModal.visible}
        actionName={deleteModal.actionName}
        onConfirm={handleDeleteAction}
        onCancel={() => setDeleteModal({ visible: false, actionId: '', actionName: '' })}
      />
```

- [ ] **Step 5: 添加新的styled components**

在文件末尾（`export default App` 之前）添加：
```typescript
/* ═══════════════════════════════════════════════════════════════
   CUSTOM ACTION STYLES
   ═══════════════════════════════════════════════════════════════ */

const ActionDivider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
  margin: 8px 0;
`

const ActionRowRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const DeleteBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(248, 113, 113, 0.15);
    border-color: var(--color-error);
    color: var(--color-error);
  }
`

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  background: rgba(0, 212, 170, 0.08);
  border: 1px dashed var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--color-text-secondary);

  &:hover {
    background: rgba(0, 212, 170, 0.15);
    border-color: var(--color-teal);
    color: var(--color-teal);
  }
`

const AddButtonText = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 10px;
`
```

---

### Task 7: 修改工具栏 - 支持自定义图标渲染

**Files:**
- Modify: `src/renderer/src/windows/selection/toolbar/SelectionToolbar.tsx`

- [ ] **Step 1: 更新iconMap添加新图标**

找到 `iconMap` 定义，更新为：
```typescript
import {
  ClipboardCheck,
  ClipboardCopy,
  ClipboardX,
  MessageSquareHeart,
  Languages,
  FileQuestion,
  ScanText,
  Search,
  WandSparkles,
  Quote,
  Sparkles,
  // 新增图标
  PenTool,
  Edit3,
  Code,
  FileText,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Flame,
  Star,
  Heart,
  Bookmark,
  Flag,
  Music,
  Palette,
  Rocket
} from 'lucide-react'

// 图标映射
const iconMap: Record<string, FC<any>> = {
  languages: Languages,
  'file-question': FileQuestion,
  'scan-text': ScanText,
  search: Search,
  'wand-sparkles': WandSparkles,
  quote: Quote,
  // 新增图标
  sparkles: Sparkles,
  'pen-tool': PenTool,
  'edit-3': Edit3,
  code: Code,
  'file-text': FileText,
  'message-square': MessageSquare,
  'book-open': BookOpen,
  lightbulb: Lightbulb,
  target: Target,
  zap: Zap,
  flame: Flame,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  music: Music,
  palette: Palette,
  rocket: Rocket
}
```

---

### Task 8: 测试验证

- [ ] **Step 1: 启动开发模式**

```bash
cd E:/LEON/selection-assistant
pnpm dev
```

- [ ] **Step 2: 验证功能**

1. 打开主窗口，展开"动作列表"
2. 点击"添加自定义动作"，验证Drawer展开方向
3. 测试图标选择器
4. 测试名称输入（验证字节限制）
5. 测试提示词输入（验证必须包含 `{{selection}}`）
6. 保存自定义动作，验证出现在列表中
7. 划词测试，验证自定义动作出现在工具栏
8. 测试删除功能，验证二次确认弹窗
9. 重启应用，验证自定义动作持久化

- [ ] **Step 3: 提交代码**

```bash
git add .
git commit -m "feat: add custom action feature

- Add CustomActionDrawer component with smart anchor positioning
- Add DeleteConfirmModal for delete confirmation
- Add preset icon selector (20 lucide-react icons)
- Add byte-length validation for action name (15 bytes max)
- Add prompt validation (must contain {{selection}})
- Support add/delete custom actions (built-in actions cannot be deleted)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```
