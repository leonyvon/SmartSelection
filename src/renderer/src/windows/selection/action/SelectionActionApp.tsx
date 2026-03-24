/**
 * 动作窗口主组件 - Retro-Futurism: Atomic Age Elegance
 * 时间折叠 - 真空管显示屏界面
 */

import { useSelectionAssistant } from '@renderer/hooks/useSelectionAssistant'
import type { ActionItem } from '@renderer/types'
import { IpcChannel } from '@shared/IpcChannel'
import { Button, Slider, Tooltip } from 'antd'
import { Droplet, Minus, Pin, X, Languages, FileQuestion, ScanText, Search, ClipboardCopy, WandSparkles, Quote, MessageSquareHeart, Atom } from 'lucide-react'
import type { FC, MouseEvent as ReactMouseEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import ActionGeneral from './components/ActionGeneral'
import ActionTranslate from './components/ActionTranslate'

// 图标映射
const iconMap: Record<string, FC<any>> = {
  languages: Languages,
  'file-question': FileQuestion,
  'scan-text': ScanText,
  search: Search,
  'clipboard-copy': ClipboardCopy,
  'wand-sparkles': WandSparkles,
  quote: Quote
}

const getIconComponent = (iconName?: string): FC<any> => {
  if (!iconName) return MessageSquareHeart
  return iconMap[iconName] || MessageSquareHeart
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const isWin = navigator.userAgent.includes('Windows')
const isMac = navigator.userAgent.includes('Mac')

const SelectionActionApp: FC = () => {
  const { isAutoPin, actionWindowOpacity } = useSelectionAssistant()

  const [action, setAction] = useState<ActionItem | null>(null)
  const [isPinned, setIsPinned] = useState(isAutoPin)
  const [isWindowFocus, setIsWindowFocus] = useState(true)
  const [showOpacitySlider, setShowOpacitySlider] = useState(false)
  const [opacity, setOpacity] = useState(actionWindowOpacity)

  const contentElementRef = useRef<HTMLDivElement>(null)
  const isAutoScrollEnabled = useRef(true)

  useEffect(() => {
    const remover = window.electron?.ipcRenderer.on(
      IpcChannel.Selection_UpdateActionData,
      (_, actionItem: ActionItem) => {
        console.log('[SelectionActionApp] Received action:', actionItem)
        setAction(actionItem)
      }
    )

    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      remover?.()
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])

  useEffect(() => {
    if (isAutoPin) {
      window.api?.selection.pinActionWindow(true)
      setIsPinned(true)
    }
  }, [isAutoPin])

  const handleMinimize = () => window.api?.selection.minimizeActionWindow()
  const handleClose = () => window.api?.selection.closeActionWindow()
  const togglePin = () => {
    setIsPinned(!isPinned)
    window.api?.selection.pinActionWindow(!isPinned)
  }

  const handleWindowFocus = () => setIsWindowFocus(true)
  const handleWindowBlur = () => setIsWindowFocus(false)

  const handleOpacityChange = (value: number) => setOpacity(value)

  const handleScrollToBottom = useCallback(() => {
    if (contentElementRef.current && isAutoScrollEnabled.current) {
      contentElementRef.current.scrollTo({
        top: contentElementRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const handleResizeStart = useCallback((e: ReactMouseEvent, direction: ResizeDirection) => {
    e.preventDefault()
    e.stopPropagation()

    let lastX = e.screenX
    let lastY = e.screenY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.screenX - lastX
      const deltaY = moveEvent.screenY - lastY

      if (deltaX !== 0 || deltaY !== 0) {
        window.api?.selection.resizeActionWindow(deltaX, deltaY, direction)
        lastX = moveEvent.screenX
        lastY = moveEvent.screenY
      }
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  if (!action) {
    return (
      <LoadingContainer>
        <LoadingOrbit>
          <LoadingRing />
          <LoadingCore />
        </LoadingOrbit>
      </LoadingContainer>
    )
  }

  return (
    <WindowFrame $opacity={opacity / 100}>
      {/* Windows 调整手柄 */}
      {isWin && (
        <>
          <ResizeHandle $direction="n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <ResizeHandle $direction="s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <ResizeHandle $direction="e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <ResizeHandle $direction="w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <ResizeHandle $direction="ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <ResizeHandle $direction="nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <ResizeHandle $direction="se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <ResizeHandle $direction="sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
        </>
      )}

      {/* Decorative Corner Atoms */}
      <CornerAtom $position="top-right">
        <Atom size={28} />
      </CornerAtom>
      <CornerAtom $position="bottom-left">
        <Atom size={28} />
      </CornerAtom>

      {/* Title Bar */}
      <TitleBar $isWindowFocus={isWindowFocus} style={isMac ? { paddingLeft: '70px' } : {}}>
        {action.icon && (
          <TitleBarIconFrame>
            {(() => {
              const IconComponent = getIconComponent(action.icon)
              return <IconComponent size={12} />
            })()}
          </TitleBarIconFrame>
        )}
        <TitleBarCaption>{action.name}</TitleBarCaption>
        <TitleBarButtons>
          <Tooltip title={isPinned ? '已固定' : '固定窗口'} placement="bottom">
            <WinButton
              type="text"
              icon={<Pin size={11} className={isPinned ? 'pinned' : ''} />}
              onClick={togglePin}
              className={isPinned ? 'pinned' : ''}
            />
          </Tooltip>
          <Tooltip title="透明度" placement="bottom" {...(showOpacitySlider ? { open: false } : {})}>
            <WinButton
              type="text"
              icon={<Droplet size={11} />}
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              className={showOpacitySlider ? 'active' : ''}
            />
          </Tooltip>
          {showOpacitySlider && (
            <OpacitySlider>
              <Slider
                vertical
                min={20}
                max={100}
                value={opacity}
                onChange={handleOpacityChange}
                onChangeComplete={() => setShowOpacitySlider(false)}
                tooltip={{ formatter: (value) => `${value}%` }}
              />
            </OpacitySlider>
          )}
          {!isMac && (
            <>
              <WinButton type="text" icon={<Minus size={12} />} onClick={handleMinimize} />
              <WinButton type="text" icon={<X size={12} />} onClick={handleClose} className="close" />
            </>
          )}
        </TitleBarButtons>
      </TitleBar>

      {/* Main Content */}
      <MainContainer>
        <Content ref={contentElementRef}>
          {action.id === 'translate' && <ActionTranslate action={action} scrollToBottom={handleScrollToBottom} />}
          {action.id !== 'translate' && <ActionGeneral action={action} scrollToBottom={handleScrollToBottom} />}
        </Content>
      </MainContainer>
    </WindowFrame>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const corePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px var(--color-copper-glow);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 16px var(--color-teal-glow);
    opacity: 0.8;
  }
`

const floatSlow = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: translateY(-6px) rotate(5deg);
    opacity: 0.18;
  }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const WindowFrame = styled.div<{ $opacity: number }>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  margin: 2px;
  background: var(--color-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
  opacity: ${(props) => props.$opacity};

  /* Decorative top gradient */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(180deg, rgba(201, 168, 108, 0.04) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  box-shadow:
    0 4px 30px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(201, 168, 108, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.02);
`

const CornerAtom = styled.div<{ $position: string }>`
  position: absolute;
  color: var(--color-brass);
  opacity: 0.1;
  animation: ${floatSlow} 10s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;

  ${props => props.$position === 'top-right' && `
    top: 8px;
    right: 8px;
  `}

  ${props => props.$position === 'bottom-left' && `
    bottom: 8px;
    left: 8px;
    animation-delay: -5s;
  `}
`

/* ═══════════════════════════════════════════════════════════════
   TITLE BAR
   ═══════════════════════════════════════════════════════════════ */

const TitleBar = styled.div<{ $isWindowFocus: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: row;
  height: 32px;
  padding: 0 10px;
  background: linear-gradient(180deg, rgba(201, 168, 108, 0.08) 0%, transparent 100%);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s ease;
  -webkit-app-region: drag;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-brass-dark), transparent);
    opacity: 0.4;
  }
`

const TitleBarIconFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 2px;
  color: var(--color-brass-light);
`

const TitleBarCaption = styled.div`
  margin-left: 8px;
  font-family: 'Audiowide', sans-serif;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 1.5px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-warm);
`

const TitleBarButtons = styled.div`
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
  position: relative;

  .lucide.pinned {
    color: var(--color-teal);
  }
`

const WinButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 4px;
  transition: all 0.15s ease;
  color: var(--color-text-secondary);

  svg {
    stroke-width: 2;
    transition: all 0.2s ease;
  }

  &.pinned svg {
    transform: rotate(45deg);
  }

  &.pinned:hover {
    background: rgba(0, 212, 170, 0.15) !important;
  }

  &.close:hover {
    background: var(--color-error) !important;
    color: #fff !important;
    border-color: var(--color-error);
  }

  &.active {
    background: rgba(201, 168, 108, 0.15) !important;
    color: var(--color-brass-light) !important;
    border-color: var(--color-border);
  }

  &:hover {
    background: rgba(201, 168, 108, 0.12) !important;
    color: var(--color-brass-light) !important;
    border-color: var(--color-border);
  }
`

const OpacitySlider = styled.div`
  position: absolute;
  left: 42px;
  top: 100%;
  margin-top: 4px;
  background: var(--color-glass);
  backdrop-filter: blur(16px);
  padding: 12px 6px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  height: 100px;
  z-index: 10000;
`

/* ═══════════════════════════════════════════════════════════════
   MAIN CONTENT
   ═══════════════════════════════════════════════════════════════ */

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
  z-index: 1;
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 14px;
  padding-bottom: 50px;
  overflow: auto;
  font-size: 12px;
  -webkit-app-region: none;
  user-select: text;
  max-width: 1280px;
`

/* ═══════════════════════════════════════════════════════════════
   RESIZE HANDLES
   ═══════════════════════════════════════════════════════════════ */

const ResizeHandle = styled.div<{ $direction: ResizeDirection }>`
  position: absolute;
  -webkit-app-region: no-drag;
  z-index: 10;

  ${({ $direction }) => {
    const edge = '6px'
    const corner = '12px'
    switch ($direction) {
      case 'n': return `top: 0; left: ${corner}; right: ${corner}; height: ${edge}; cursor: ns-resize;`
      case 's': return `bottom: 0; left: ${corner}; right: ${corner}; height: ${edge}; cursor: ns-resize;`
      case 'e': return `right: 0; top: ${corner}; bottom: ${corner}; width: ${edge}; cursor: ew-resize;`
      case 'w': return `left: 0; top: ${corner}; bottom: ${corner}; width: ${edge}; cursor: ew-resize;`
      case 'ne': return `top: 0; right: 0; width: ${corner}; height: ${corner}; cursor: nesw-resize;`
      case 'nw': return `top: 0; left: 0; width: ${corner}; height: ${corner}; cursor: nwse-resize;`
      case 'se': return `bottom: 0; right: 0; width: ${corner}; height: ${corner}; cursor: nwse-resize;`
      case 'sw': return `bottom: 0; left: 0; width: ${corner}; height: ${corner}; cursor: nesw-resize;`
      default: return ''
    }
  }}
`

/* ═══════════════════════════════════════════════════════════════
   LOADING STATE
   ═══════════════════════════════════════════════════════════════ */

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-glass);
`

const LoadingOrbit = styled.div`
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoadingRing = styled.div`
  position: absolute;
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-brass);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${orbitSpin} 1.2s linear infinite;
`

const LoadingCore = styled.div`
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-teal));
  border-radius: 50%;
  animation: ${corePulse} 1.5s ease-in-out infinite;
`

export default SelectionActionApp
