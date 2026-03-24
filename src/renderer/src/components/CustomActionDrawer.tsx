// src/renderer/src/components/CustomActionDrawer.tsx

import React, { useState, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { X, Check } from 'lucide-react'
import { PRESET_ICONS, DEFAULT_ICON_ID } from '../constants/icons'
import { getByteLength, truncateToByteLength } from '../utils/byteLength'

const MAX_NAME_BYTES = 15
const MAX_PROMPT_CHARS = 2000

interface CustomActionDrawerProps {
  visible: boolean
  onClose: () => void
  onSave: (action: { name: string; icon: string; prompt: string }) => void
}

export const CustomActionDrawer: React.FC<CustomActionDrawerProps> = ({
  visible,
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
      <DrawerContainer onClick={e => e.stopPropagation()}>
        {/* Header */}
        <DrawerHeader>
          <DrawerTitle>
            <GearIcon>⚙</GearIcon>
            自定义动作
          </DrawerTitle>
          <CloseBtn type="button" onClick={(e) => { e.stopPropagation(); onClose(); }}>
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

const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  background: var(--color-glass);
  backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 101;
  animation: ${slideInRight} 0.25s ease forwards;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);
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
  position: relative;
  z-index: 10;
  pointer-events: auto;

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
