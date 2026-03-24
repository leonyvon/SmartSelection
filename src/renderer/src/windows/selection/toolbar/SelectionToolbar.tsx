/**
 * 悬浮工具栏组件 - 单列垂直布局
 */

import type { ActionItem } from '@renderer/types'
import { IpcChannel } from '@shared/IpcChannel'
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
  // 自定义动作图标
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
import type { FC } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'

// 图标映射
const iconMap: Record<string, FC<any>> = {
  languages: Languages,
  'file-question': FileQuestion,
  'scan-text': ScanText,
  search: Search,
  'wand-sparkles': WandSparkles,
  quote: Quote,
  // 自定义动作图标
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

const getIconComponent = (iconName?: string): FC<any> => {
  if (!iconName) return MessageSquareHeart
  return iconMap[iconName] || MessageSquareHeart
}

const updateWindowSize = () => {
  const rootElement = document.getElementById('root')
  if (rootElement) {
    window.api?.selection.determineToolbarSize(rootElement.scrollWidth, rootElement.scrollHeight)
  }
}

// 动作按钮组件
const ActionButtons: FC<{
  actionItems: ActionItem[]
  handleAction: (action: ActionItem) => void
  copyIconStatus: 'normal' | 'success' | 'fail'
  copyIconAnimation: 'none' | 'enter' | 'exit'
}> = memo(({ actionItems, handleAction, copyIconStatus, copyIconAnimation }) => {
  const renderCopyIcon = useCallback(() => (
    <>
      <ClipboardCopy className={`btn-icon ${copyIconAnimation === 'enter' ? 'icon-scale-out' : copyIconAnimation === 'exit' ? 'icon-fade-in' : ''}`} />
      {copyIconStatus === 'success' && (
        <ClipboardCheck className={`btn-icon icon-success ${copyIconAnimation === 'enter' ? 'icon-scale-in' : copyIconAnimation === 'exit' ? 'icon-fade-out' : ''}`} />
      )}
      {copyIconStatus === 'fail' && (
        <ClipboardX className={`btn-icon icon-fail ${copyIconAnimation === 'enter' ? 'icon-scale-in' : copyIconAnimation === 'exit' ? 'icon-fade-out' : ''}`} />
      )}
    </>
  ), [copyIconStatus, copyIconAnimation])

  const renderActionButton = useCallback((action: ActionItem) => {
    const IconComponent = getIconComponent(action.icon)
    return (
      <ActionButton
        key={action.id}
        onClick={() => handleAction(action)}
        role="button"
        aria-label={action.name}
        tabIndex={0}>
        <ActionIcon>
          {action.id === 'copy' ? (
            renderCopyIcon()
          ) : (
            <IconComponent key={action.id} className="btn-icon" />
          )}
        </ActionIcon>
        <ActionLabel>{action.name}</ActionLabel>
      </ActionButton>
    )
  }, [handleAction, renderCopyIcon])

  return <>{actionItems?.map(renderActionButton)}</>
})

const SelectionToolbar: FC = () => {
  const [animateKey, setAnimateKey] = useState(0)
  const [copyIconStatus, setCopyIconStatus] = useState<'normal' | 'success' | 'fail'>('normal')
  const [copyIconAnimation, setCopyIconAnimation] = useState<'none' | 'enter' | 'exit'>('none')

  // 从主窗口同步的 actionItems（使用 state 以触发重新渲染）
  const [actionItems, setActionItems] = useState<ActionItem[]>([
    { id: 'translate', name: '翻译', enabled: true, isBuiltIn: true, icon: 'languages' },
    { id: 'explain', name: '解释', enabled: true, isBuiltIn: true, icon: 'file-question' },
    { id: 'summary', name: '总结', enabled: true, isBuiltIn: true, icon: 'scan-text' },
    { id: 'search', name: '搜索', enabled: true, isBuiltIn: true, icon: 'search', searchEngine: 'Google|https://www.google.com/search?q={{queryString}}' },
    { id: 'copy', name: '复制', enabled: true, isBuiltIn: true, icon: 'clipboard-copy' }
  ])

  const realActionItems = useMemo(() => actionItems.filter((item) => item.enabled), [actionItems])
  const selectedText = useRef('')
  const isFullScreen = useRef(false)

  const onHideCleanUp = useCallback(() => {
    setCopyIconStatus('normal')
    setCopyIconAnimation('none')
  }, [])

  useEffect(() => {
    const textSelectionListenRemover = window.electron?.ipcRenderer.on(
      IpcChannel.Selection_TextSelected,
      (_, selectionData: { text: string; isFullscreen?: boolean; actionItems?: ActionItem[] }) => {
        selectedText.current = selectionData.text
        isFullScreen.current = selectionData.isFullscreen ?? false
        // 同步 actionItems（如果主窗口传递了）
        if (selectionData.actionItems) {
          setActionItems(selectionData.actionItems)
        }
        setTimeout(() => setAnimateKey((prev) => prev + 1), 400)
      }
    )

    const toolbarVisibilityChangeRemover = window.electron?.ipcRenderer.on(
      IpcChannel.Selection_ToolbarVisibilityChange,
      (_, isVisible: boolean) => {
        if (!isVisible) onHideCleanUp()
      }
    )

    return () => {
      textSelectionListenRemover?.()
      toolbarVisibilityChangeRemover?.()
    }
  }, [onHideCleanUp])

  useEffect(() => {
    updateWindowSize()
  }, [realActionItems])

  const handleCopy = useCallback(async () => {
    if (selectedText.current) {
      const result = await window.api?.selection.writeToClipboard(selectedText.current)
      setCopyIconStatus(result ? 'success' : 'fail')
      setCopyIconAnimation('enter')
      setTimeout(() => setCopyIconAnimation('exit'), 2000)
    }
  }, [])

  const handleSearch = useCallback((action: ActionItem) => {
    if (!action.selectedText) return
    const selectedText = action.selectedText.trim()

    const isUriOrFilePath = (text: string): boolean => {
      const trimmed = text.trim()
      if (/\s/.test(trimmed)) return false
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return true
      if (/^[a-zA-Z]:[/\\]/.test(trimmed)) return true
      if (/^\/[^/]/.test(trimmed)) return true
      return false
    }

    let actionString = ''
    if (isUriOrFilePath(selectedText)) {
      actionString = selectedText
    } else if (action.searchEngine) {
      const customUrl = action.searchEngine.split('|')[1]
      if (customUrl) {
        actionString = customUrl.replace('{{queryString}}', encodeURIComponent(selectedText))
      }
    }

    if (actionString) {
      window.api?.openWebsite(actionString)
      window.api?.selection.hideToolbar()
    }
  }, [])

  const handleQuote = (action: ActionItem) => {
    if (action.selectedText) {
      window.api?.quoteToMainWindow(action.selectedText)
      window.api?.selection.hideToolbar()
    }
  }

  const handleDefaultAction = (action: ActionItem) => {
    window.api?.selection.processAction(action, isFullScreen.current)
    window.api?.selection.hideToolbar()
  }

  const handleAction = useCallback((action: ActionItem) => {
    const newAction = { ...action, selectedText: selectedText.current }

    switch (action.id) {
      case 'copy':
        handleCopy()
        break
      case 'search':
        handleSearch(newAction)
        break
      case 'quote':
        handleQuote(newAction)
        break
      default:
        handleDefaultAction(newAction)
        break
    }
  }, [handleCopy, handleSearch])

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
    </Container>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const corePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px var(--color-copper-glow);
  }
  50% {
    box-shadow: 0 0 16px var(--color-copper-glow), 0 0 24px var(--color-teal-glow);
  }
`

const scaleIn = keyframes`
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`

const scaleOut = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0); opacity: 0; }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Container = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
  height: auto;
  min-height: 32px;
  border-radius: 8px;
  background: var(--color-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 4px 6px;
  user-select: none;
  box-sizing: border-box;
  overflow: hidden;

  border: 1px solid var(--color-border);
`

/* ═══════════════════════════════════════════════════════════════
   LOGO
   ═══════════════════════════════════════════════════════════════ */

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  -webkit-app-region: drag;
`

const LogoCore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-copper));
  border-radius: 4px;
  color: var(--color-void);
  animation: ${corePulse} 2.5s ease-in-out infinite;
`

/* ═══════════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════════ */

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: linear-gradient(180deg, transparent, var(--color-brass-dark), var(--color-teal), var(--color-brass-dark), transparent);
  opacity: 0.5;
`

/* ═══════════════════════════════════════════════════════════════
   ACTIONS - 垂直单列布局
   ═══════════════════════════════════════════════════════════════ */

const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 2px;
`

const ActionButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 8px;
  background-color: transparent;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  position: relative;

  .btn-icon {
    width: 14px;
    height: 14px;
    color: var(--color-text-warm);
    transition: all 0.15s ease;
  }

  &:hover {
    background: linear-gradient(135deg, rgba(201, 168, 108, 0.12), rgba(0, 212, 170, 0.08));
    border-color: var(--color-border);

    .btn-icon {
      color: var(--color-teal);
    }
  }

  &:active {
    transform: scale(0.95);
    background: rgba(201, 168, 108, 0.15);
  }
`

const ActionIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 14px;
  height: 14px;

  .btn-icon {
    position: absolute;
  }

  .icon-fail { color: var(--color-error); }
  .icon-success { color: var(--color-success); }

  .icon-scale-in { animation: ${scaleIn} 0.25s forwards; }
  .icon-scale-out { animation: ${scaleOut} 0.25s forwards; }
  .icon-fade-in { animation: ${fadeIn} 0.15s forwards; }
  .icon-fade-out { animation: ${fadeOut} 0.15s forwards; }
`

const ActionLabel = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 9px;
  letter-spacing: 0.2px;
  color: var(--color-text-warm);
  white-space: nowrap;
`

export default SelectionToolbar
