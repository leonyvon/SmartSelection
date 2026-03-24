/**
 * 窗口底部控制栏 - Retro-Futurism: Atomic Age Elegance
 * 时间折叠 - 机械控制台按钮
 */

import { Copy, Pause, RefreshCw } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import styled, { keyframes } from 'styled-components'

interface Props {
  loading: boolean
  onPause: () => void
  onRegenerate: () => void
  content: string
}

const WindowFooter: FC<Props> = ({ loading, onPause, onRegenerate, content }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  return (
    <FooterContainer>
      {/* Decorative Line */}
      <DecorLine />

      <FooterButtons>
        <FooterButton onClick={handleCopy} disabled={!content} $active={copied} $variant="brass">
          <ButtonIcon>
            <Copy size={11} />
          </ButtonIcon>
          <ButtonLabel>{copied ? '已复制' : '复制'}</ButtonLabel>
          {copied && <ActiveGlow />}
        </FooterButton>

        {loading && (
          <FooterButton onClick={onPause} $variant="teal">
            <ButtonIcon>
              <Pause size={11} />
            </ButtonIcon>
            <ButtonLabel>暂停</ButtonLabel>
          </FooterButton>
        )}

        {!loading && content && (
          <FooterButton onClick={onRegenerate} $variant="brass">
            <ButtonIcon>
              <RefreshCw size={11} />
            </ButtonIcon>
            <ButtonLabel>重新生成</ButtonLabel>
          </FooterButton>
        )}
      </FooterButtons>
    </FooterContainer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const glowPulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const FooterContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, transparent, rgba(201, 168, 108, 0.03));
  padding-top: 8px;
`

const DecorLine = styled.div`
  height: 1px;
  margin: 0 14px 8px;
  background: linear-gradient(90deg, transparent, var(--color-border), transparent);
`

const FooterButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 14px;
`

const FooterButton = styled.button<{ $active?: boolean; $variant?: 'brass' | 'teal' }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.$active
    ? 'linear-gradient(135deg, var(--color-brass), var(--color-copper))'
    : 'var(--color-metal-dark)'};
  border: 1px solid ${props => props.$active ? 'transparent' : 'var(--color-border)'};
  border-radius: 4px;
  overflow: hidden;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.4 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.$active
      ? 'linear-gradient(135deg, var(--color-brass-light), var(--color-brass))'
      : props.$variant === 'teal'
        ? 'rgba(0, 212, 170, 0.12)'
        : 'rgba(201, 168, 108, 0.12)'};
    border-color: ${props => props.$variant === 'teal' ? 'var(--color-teal)' : 'var(--color-brass)'};
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
`

const ButtonIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${props => props.theme.active ? 'var(--color-void)' : 'var(--color-text-secondary)'};
  transition: color 0.2s ease;

  ${FooterButton}:hover:not(:disabled) & {
    color: var(--color-brass-light);
  }
`

const ButtonLabel = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  letter-spacing: 0.3px;
  color: ${props => props.theme.active ? 'var(--color-void)' : 'var(--color-text)'};
  transition: color 0.2s ease;

  ${FooterButton}:hover:not(:disabled) & {
    color: var(--color-brass-light);
  }
`

const ActiveGlow = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, var(--color-teal-glow), transparent 70%);
  animation: ${glowPulse} 1.5s ease-in-out infinite;
  pointer-events: none;
`

export default WindowFooter
