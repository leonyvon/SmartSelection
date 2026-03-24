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
