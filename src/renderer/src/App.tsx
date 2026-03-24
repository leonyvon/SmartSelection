/**
 * 主应用组件 - Retro-Futurism: Atomic Age Elegance
 * 时间折叠 - 1950s Space Age meets Victorian Industrial
 * 黄铜真空管驱动的量子界面
 */

import { useSelectionAssistant } from './hooks/useSelectionAssistant'
import { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  setSelectionEnabled as setSelectionEnabledAction,
  setIsAutoPin as setIsAutoPinAction,
  setIsFollowToolbar as setIsFollowToolbarAction,
  setIsRememberWinSize as setIsRememberWinSizeAction,
  setFilterMode as setFilterModeAction,
  setFilterList as setFilterListAction,
  setActionWindowOpacity as setActionWindowOpacityAction,
  setActionItems as setActionItemsAction
} from './store'
import styled, { keyframes, css } from 'styled-components'
import { Minus, X, Settings, ChevronDown, ChevronRight, Cpu, Sparkles, Atom, Zap, Trash2, Plus } from 'lucide-react'
import { CustomActionDrawer } from './components/CustomActionDrawer'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import type { ActionItem } from '@shared/types'

function App() {
  const dispatch = useDispatch()
  const {
    selectionEnabled,
    setSelectionEnabled,
    actionItems,
    setActionItems
  } = useSelectionAssistant()

  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [modelId, setModelId] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // 自定义动作相关状态
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ visible: boolean; actionId: string; actionName: string }>({
    visible: false,
    actionId: '',
    actionName: ''
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        // 加载 LLM 配置
        const llmConfig = await window.api?.config.get('llmConfig')
        if (llmConfig) {
          setApiKey(llmConfig.provider?.apiKey || '')
          setBaseUrl(llmConfig.provider?.baseUrl || 'https://api.openai.com/v1')
          setModelId(llmConfig.model?.id || 'gpt-4o-mini')
        }

        // 加载 selection 配置并同步到 Redux store 和主进程
        const selectionConfig = await window.api?.config.get('selection')
        if (selectionConfig) {
          if (selectionConfig.selectionEnabled !== undefined) {
            dispatch(setSelectionEnabledAction(selectionConfig.selectionEnabled))
          }
          if (selectionConfig.isAutoPin !== undefined) {
            dispatch(setIsAutoPinAction(selectionConfig.isAutoPin))
          }
          if (selectionConfig.isFollowToolbar !== undefined) {
            dispatch(setIsFollowToolbarAction(selectionConfig.isFollowToolbar))
            window.api?.selection.setFollowToolbar(selectionConfig.isFollowToolbar)
          }
          if (selectionConfig.isRememberWinSize !== undefined) {
            dispatch(setIsRememberWinSizeAction(selectionConfig.isRememberWinSize))
            window.api?.selection.setRemeberWinSize(selectionConfig.isRememberWinSize)
          }
          if (selectionConfig.filterMode) {
            dispatch(setFilterModeAction(selectionConfig.filterMode))
            window.api?.selection.setFilterMode(selectionConfig.filterMode)
          }
          if (selectionConfig.filterList) {
            dispatch(setFilterListAction(selectionConfig.filterList))
            window.api?.selection.setFilterList(selectionConfig.filterList)
          }
          if (selectionConfig.actionWindowOpacity !== undefined) {
            dispatch(setActionWindowOpacityAction(selectionConfig.actionWindowOpacity))
          }
          if (selectionConfig.actionItems) {
            dispatch(setActionItemsAction(selectionConfig.actionItems))
            // 同步动作列表到 SelectionService
            window.api?.selection.setActionItems(selectionConfig.actionItems)
          }

          // 最后启用/禁用 selection hook
          if (selectionConfig.selectionEnabled) {
            window.api?.selection.setEnabled(true)
          }
        }
      } catch (e) {
        console.error('Failed to load config:', e)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [dispatch])

  const handleSaveConfig = () => {
    window.api?.config.set('llmConfig', {
      provider: {
        id: 'custom',
        name: 'Custom',
        type: 'openai',
        apiKey,
        baseUrl,
        models: [{ id: modelId, name: modelId, provider: 'custom' }]
      },
      model: { id: modelId, name: modelId, provider: 'custom' },
      temperature: 0.7,
      maxTokens: 4096,
      stream: true
    })
  }

  const handleMinimize = () => window.api?.minimize()
  const handleClose = () => window.api?.quit()
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleReactorClick = useCallback(() => {
    setSelectionEnabled(!selectionEnabled)
  }, [selectionEnabled, setSelectionEnabled])

  // 打开添加自定义动作Drawer
  const handleAddCustomAction = () => {
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

  if (loading) {
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
    <Container $active={selectionEnabled}>
      {/* Background Energy Particles - 启动时显示 */}
      {selectionEnabled && (
        <EnergyBackground>
          <EnergyParticle $delay={0} $x={20} $y={30} />
          <EnergyParticle $delay={1} $x={60} $y={20} />
          <EnergyParticle $delay={2} $x={40} $y={60} />
          <EnergyParticle $delay={3} $x={80} $y={50} />
          <EnergyParticle $delay={4} $x={30} $y={70} />
        </EnergyBackground>
      )}

      {/* Decorative Corner Atoms */}
      <CornerAtom $position="top-left">
        <Atom size={32} />
      </CornerAtom>
      <CornerAtom $position="bottom-right">
        <Atom size={32} />
      </CornerAtom>

      {/* Title Bar */}
      <TitleBar>
        <LogoSection>
          <LogoFrame>
            <LogoInner>
              <Sparkles size={12} />
            </LogoInner>
            <LogoRing />
          </LogoFrame>
          <TitleGroup>
            <TitleMain>SELECTION</TitleMain>
            <TitleSub>.ASSIST</TitleSub>
          </TitleGroup>
        </LogoSection>
        <WindowControls>
          <ControlButton onClick={handleMinimize} title="最小化到托盘">
            <Minus size={12} />
          </ControlButton>
          <ControlButton className="close" onClick={handleClose} title="退出">
            <X size={12} />
          </ControlButton>
        </WindowControls>
      </TitleBar>

      {/* Status Bar */}
      <StatusBar>
        <StatusFrame>
          <StatusIndicator $active={selectionEnabled}>
            <StatusOrbit $active={selectionEnabled}>
              <StatusElectron $active={selectionEnabled} />
            </StatusOrbit>
            <StatusText>{selectionEnabled ? 'ACTIVE' : 'STANDBY'}</StatusText>
          </StatusIndicator>
        </StatusFrame>
      </StatusBar>

      {/* Content */}
      <Content>
        {/* Reactor Core - 核能反应堆启动器 */}
        <ReactorSection>
          <ReactorContainer onClick={handleReactorClick}>
            {/* 外层防护环 */}
            <ReactorFrame $active={selectionEnabled}>
              {/* 刻度标记 */}
              <TickMark $angle={0} />
              <TickMark $angle={45} />
              <TickMark $angle={90} />
              <TickMark $angle={135} />
              <TickMark $angle={180} />
              <TickMark $angle={225} />
              <TickMark $angle={270} />
              <TickMark $angle={315} />
            </ReactorFrame>

            {/* 能量轨道层 */}
            <OrbitLayer $active={selectionEnabled}>
              <OrbitRing $size={80} $active={selectionEnabled} $reverse={false}>
                <OrbitElectron $active={selectionEnabled} />
              </OrbitRing>
              <OrbitRing $size={60} $active={selectionEnabled} $reverse={true}>
                <OrbitElectron $active={selectionEnabled} />
              </OrbitRing>
              <OrbitRing $size={40} $active={selectionEnabled} $reverse={false}>
                <OrbitElectron $active={selectionEnabled} />
              </OrbitRing>
            </OrbitLayer>

            {/* 反应堆核心 */}
            <ReactorCore $active={selectionEnabled}>
              <CoreGlow $active={selectionEnabled} />
              <CoreInner $active={selectionEnabled}>
                <Zap size={14} />
              </CoreInner>
            </ReactorCore>

            {/* 能量涟漪 - 点击时触发 */}
            <RippleContainer>
              <Ripple $active={selectionEnabled} $delay={0} />
              <Ripple $active={selectionEnabled} $delay={0.5} />
              <Ripple $active={selectionEnabled} $delay={1} />
            </RippleContainer>
          </ReactorContainer>

          {/* 状态标签 */}
          <ReactorLabels>
            <ReactorLabel $active={selectionEnabled === false}>
              OFFLINE
            </ReactorLabel>
            <ReactorLabel $active={selectionEnabled === true}>
              ONLINE
            </ReactorLabel>
          </ReactorLabels>
        </ReactorSection>

        {/* LLM Config */}
        <Section>
          <SectionHeader onClick={() => toggleSection('llm')}>
            <SectionIconFrame>
              <Cpu size={10} />
            </SectionIconFrame>
            <SectionTitle>LLM 配置</SectionTitle>
            <SectionDivider />
            <ExpandIcon>{expandedSection === 'llm' ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</ExpandIcon>
          </SectionHeader>
          {expandedSection === 'llm' && (
            <SectionContent>
              <InputField>
                <InputLabel>API KEY</InputLabel>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </InputField>
              <InputField>
                <InputLabel>BASE URL</InputLabel>
                <Input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </InputField>
              <InputField>
                <InputLabel>MODEL</InputLabel>
                <Input
                  type="text"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </InputField>
              <SaveButton onClick={handleSaveConfig}>
                <ButtonGlow />
                <ButtonText>保存配置</ButtonText>
              </SaveButton>
            </SectionContent>
          )}
        </Section>

        {/* Actions */}
        <Section>
          <SectionHeader onClick={() => toggleSection('actions')}>
            <SectionIconFrame>
              <Settings size={10} />
            </SectionIconFrame>
            <SectionTitle>动作列表</SectionTitle>
            <SectionDivider />
            <ExpandIcon>{expandedSection === 'actions' ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</ExpandIcon>
          </SectionHeader>
          {expandedSection === 'actions' && (
            <SectionContent>
              {/* 内置动作 */}
              {actionItems.filter(item => item.isBuiltIn).map((item, index) => (
                <ActionRow key={item.id}>
                  <ActionName>{item.name}</ActionName>
                  <Toggle
                    $checked={item.enabled}
                    onClick={() => {
                      const builtInItems = actionItems.filter(i => i.isBuiltIn)
                      const allItems = [...actionItems]
                      const globalIndex = actionItems.findIndex(i => i.id === item.id)
                      allItems[globalIndex] = { ...item, enabled: !item.enabled }
                      setActionItems(allItems)
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
        </Section>
      </Content>

      {/* Energy Bar - 能量条 */}
      <BottomDecor>
        <EnergyBar $active={selectionEnabled}>
          <EnergyFlow $active={selectionEnabled} />
        </EnergyBar>
      </BottomDecor>

      {/* Custom Action Drawer */}
      <CustomActionDrawer
        visible={drawerVisible}
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
    </Container>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const orbitSpinReverse = keyframes`
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
`

const electronPulse = keyframes`
  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--color-teal-glow); }
  50% { opacity: 0.6; box-shadow: 0 0 12px var(--color-teal-glow); }
`

const corePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px var(--color-teal-glow), 0 0 40px rgba(0, 212, 170, 0.3);
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    box-shadow: 0 0 30px var(--color-teal-glow), 0 0 60px rgba(0, 212, 170, 0.4), 0 0 80px rgba(123, 104, 238, 0.2);
    transform: translate(-50%, -50%) scale(1.05);
  }
`

const corePulseDim = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
`

const energyRipple = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
`

const particleFloat = keyframes`
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  50% {
    transform: translateY(-30px) translateX(10px);
  }
`

const energyFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

const slideDown = keyframes`
  from { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
  to { opacity: 1; max-height: 400px; padding-top: 12px; padding-bottom: 12px; }
`

const floatSlow = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
  50% { transform: translateY(-8px) rotate(5deg); opacity: 0.25; }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Container = styled.div<{ $active?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  font-size: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    background: linear-gradient(180deg, rgba(201, 168, 108, 0.03) 0%, transparent 100%);
    pointer-events: none;
  }

  ${props => props.$active && css`
    border-color: rgba(0, 212, 170, 0.3);
    box-shadow: 0 0 30px rgba(0, 212, 170, 0.1), inset 0 0 60px rgba(0, 212, 170, 0.02);
  `}
`

const CornerAtom = styled.div<{ $position: string }>`
  position: absolute;
  color: var(--color-brass);
  opacity: 0.12;
  animation: ${floatSlow} 8s ease-in-out infinite;
  z-index: 0;
  pointer-events: none;

  ${props => props.$position === 'top-left' && `
    top: 8px;
    left: 8px;
  `}

  ${props => props.$position === 'bottom-right' && `
    bottom: 8px;
    right: 8px;
    animation-delay: -4s;
  `}
`

/* ═══════════════════════════════════════════════════════════════
   TITLE BAR
   ═══════════════════════════════════════════════════════════════ */

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: linear-gradient(180deg, rgba(201, 168, 108, 0.06) 0%, transparent 100%);
  border-bottom: 1px solid var(--color-border);
  -webkit-app-region: drag;
  position: relative;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-brass-dark), transparent);
    opacity: 0.3;
  }
`

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const LogoFrame = styled.div`
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LogoInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-copper));
  border-radius: 4px;
  color: var(--color-void);
  z-index: 1;
`

const LogoRing = styled.div`
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-teal);
  border-radius: 50%;
  opacity: 0.4;
  animation: ${orbitSpin} 20s linear infinite;
`

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.1;
`

const TitleMain = styled.div`
  font-family: 'Audiowide', sans-serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 3px;
  color: var(--color-brass-light);
  text-shadow: 0 0 12px var(--color-copper-glow);
`

const TitleSub = styled.div`
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 2px;
  color: var(--color-teal);
  opacity: 0.8;
`

const WindowControls = styled.div`
  display: flex;
  gap: 6px;
  -webkit-app-region: no-drag;
`

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(201, 168, 108, 0.15);
    border-color: var(--color-brass);
    color: var(--color-brass-light);
  }

  &.close:hover {
    background: var(--color-error);
    border-color: var(--color-error);
    color: #fff;
  }
`

/* ═══════════════════════════════════════════════════════════════
   STATUS BAR - 小球转转转
   ═══════════════════════════════════════════════════════════════ */

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(201, 168, 108, 0.02);
  border-bottom: 1px solid var(--color-border);
`

const StatusFrame = styled.div`
  display: flex;
  align-items: center;
`

const StatusIndicator = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
`

const StatusOrbit = styled.div<{ $active: boolean }>`
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid ${props => props.$active ? 'var(--color-teal)' : 'var(--color-brass-dark)'};
  border-radius: 50%;
  animation: ${props => props.$active ? orbitSpin : 'none'} 4s linear infinite;
`

const StatusElectron = styled.div<{ $active: boolean }>`
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: ${props => props.$active ? 'var(--color-teal)' : 'var(--color-brass-dark)'};
  border-radius: 50%;
  animation: ${props => props.$active ? electronPulse : 'none'} 1.5s ease-in-out infinite;
`

const StatusText = styled.span`
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--color-text-secondary);
`

/* ═══════════════════════════════════════════════════════════════
   REACTOR CORE - 核能反应堆启动器
   ═══════════════════════════════════════════════════════════════ */

const ReactorSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
`

const ReactorContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`

const ReactorFrame = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  border: 2px solid ${props => props.$active ? 'var(--color-teal)' : 'var(--color-brass-dark)'};
  border-radius: 50%;
  background: ${props => props.$active
    ? 'radial-gradient(circle, rgba(0, 212, 170, 0.05) 0%, transparent 70%)'
    : 'radial-gradient(circle, rgba(201, 168, 108, 0.02) 0%, transparent 70%)'};
  transition: all 0.5s ease;
  box-shadow: ${props => props.$active
    ? '0 0 30px rgba(0, 212, 170, 0.2), inset 0 0 20px rgba(0, 212, 170, 0.1)'
    : 'inset 0 0 10px rgba(0, 0, 0, 0.3)'};
`

const TickMark = styled.div<{ $angle: number }>`
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 8px;
  background: var(--color-brass-dark);
  transform-origin: center 60px;
  transform: translateX(-50%) rotate(${props => props.$angle}deg);
  border-radius: 1px;
`

const OrbitLayer = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  opacity: ${props => props.$active ? 1 : 0};
  transition: opacity 0.5s ease;
`

const OrbitRing = styled.div<{ $size: number; $active: boolean; $reverse: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border: 1px solid ${props => props.$active ? 'rgba(0, 212, 170, 0.3)' : 'transparent'};
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ${props => props.$active
    ? css`${props.$reverse ? orbitSpinReverse : orbitSpin} ${8 + props.$size / 10}s linear infinite`
    : 'none'};
`

const OrbitElectron = styled.div<{ $active: boolean }>`
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: ${props => props.$active ? 'var(--color-teal)' : 'transparent'};
  border-radius: 50%;
  box-shadow: ${props => props.$active ? '0 0 8px var(--color-teal), 0 0 16px var(--color-teal-glow)' : 'none'};
  animation: ${props => props.$active ? electronPulse : 'none'} 1.5s ease-in-out infinite;
`

const ReactorCore = styled.div<{ $active: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  background: ${props => props.$active
    ? 'linear-gradient(135deg, var(--color-teal), var(--color-violet))'
    : 'linear-gradient(135deg, var(--color-metal-dark), var(--color-metal-mid))'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
  box-shadow: ${props => props.$active
    ? '0 0 20px var(--color-teal-glow), 0 0 40px rgba(0, 212, 170, 0.3)'
    : '0 2px 8px rgba(0, 0, 0, 0.3)'};
  animation: ${props => props.$active ? corePulse : 'none'} 2s ease-in-out infinite;
`

const CoreGlow = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 170, 0.3) 0%, transparent 70%);
  opacity: ${props => props.$active ? 1 : 0};
  transition: opacity 0.5s ease;
  animation: ${props => props.$active ? corePulseDim : 'none'} 2s ease-in-out infinite;
`

const CoreInner = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$active ? 'var(--color-void)' : 'var(--color-brass-dark)'};
  transition: color 0.3s ease;
  z-index: 1;
`

const RippleContainer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`

const Ripple = styled.div<{ $active: boolean; $delay: number }>`
  position: absolute;
  inset: 20px;
  border: 1px solid var(--color-teal);
  border-radius: 50%;
  opacity: 0;
  animation: ${props => props.$active ? energyRipple : 'none'} 2s ease-out infinite;
  animation-delay: ${props => props.$delay}s;
`

const ReactorLabels = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
`

const ReactorLabel = styled.span<{ $active: boolean }>`
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  letter-spacing: 2px;
  color: ${props => props.$active ? 'var(--color-teal)' : 'var(--color-text-dim)'};
  text-shadow: ${props => props.$active ? '0 0 10px var(--color-teal-glow)' : 'none'};
  transition: all 0.3s ease;
`

/* ═══════════════════════════════════════════════════════════════
   ENERGY BACKGROUND PARTICLES
   ═══════════════════════════════════════════════════════════════ */

const EnergyBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
`

const EnergyParticle = styled.div<{ $delay: number; $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}%;
  top: ${props => props.$y}%;
  width: 3px;
  height: 3px;
  background: var(--color-teal);
  border-radius: 50%;
  opacity: 0;
  animation: ${particleFloat} 4s ease-in-out infinite;
  animation-delay: ${props => props.$delay}s;
  box-shadow: 0 0 6px var(--color-teal);
`

/* ═══════════════════════════════════════════════════════════════
   CONTENT & SECTIONS
   ═══════════════════════════════════════════════════════════════ */

const Content = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
`

const Section = styled.div`
  margin-bottom: 8px;
  background: var(--color-glass-light);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-brass-dark), transparent);
    opacity: 0.5;
  }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(90deg, rgba(201, 168, 108, 0.04) 0%, transparent 100%);
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;

  &:hover {
    background: linear-gradient(90deg, rgba(201, 168, 108, 0.08) 0%, transparent 100%);
  }
`

const SectionIconFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 10px;
  color: var(--color-brass);
`

const SectionTitle = styled.div`
  font-family: 'Playfair Display', serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: var(--color-text);
  white-space: nowrap;
`

const SectionDivider = styled.div`
  flex: 1;
  height: 1px;
  margin: 0 12px;
  background: linear-gradient(90deg, var(--color-border), transparent);
`

const ExpandIcon = styled.div`
  color: var(--color-text-dim);
  transition: transform 0.2s ease;
`

const SectionContent = styled.div`
  padding: 12px;
  border-top: 1px solid var(--color-border);
  animation: ${slideDown} 0.25s ease-out;
`

/* ═══════════════════════════════════════════════════════════════
   TOGGLE SWITCH
   ═══════════════════════════════════════════════════════════════ */

const Toggle = styled.div<{ $checked: boolean }>`
  position: relative;
  width: 36px;
  height: 20px;
  cursor: pointer;
`

const ToggleTrack = styled.div`
  position: absolute;
  inset: 0;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition: all 0.25s ease;
`

const ToggleKnob = styled.div<{ $checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${props => props.$checked ? '18px' : '2px'};
  width: 16px;
  height: 16px;
  background: ${props => props.$checked
    ? 'linear-gradient(135deg, var(--color-teal), var(--color-violet))'
    : 'var(--color-brass-dark)'};
  border-radius: 50%;
  transition: all 0.25s ease;
  box-shadow: ${props => props.$checked ? '0 0 10px var(--color-teal-glow)' : 'none'};
`

/* ═══════════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════════ */

const InputField = styled.div`
  margin-bottom: 12px;
`

const InputLabel = styled.div`
  font-family: 'Audiowide', sans-serif;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 2px;
  color: var(--color-text-dim);
  margin-bottom: 6px;
`

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  background: var(--color-metal-dark);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text);
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-brass);
  }

  &:focus {
    outline: none;
    border-color: var(--color-teal);
    box-shadow: 0 0 8px var(--color-teal-glow);
  }

  &::placeholder {
    color: var(--color-text-dim);
  }
`

/* ═══════════════════════════════════════════════════════════════
   SAVE BUTTON
   ═══════════════════════════════════════════════════════════════ */

const SaveButton = styled.button`
  position: relative;
  width: 100%;
  padding: 10px;
  margin-top: 4px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-copper));
  border: none;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--color-copper-glow);
  }

  &:active {
    transform: translateY(0);
  }
`

const ButtonGlow = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;

  ${SaveButton}:hover & {
    transform: translateX(100%);
  }
`

const ButtonText = styled.span`
  position: relative;
  z-index: 1;
  font-family: 'Audiowide', sans-serif;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 2px;
  color: var(--color-void);
`

/* ═══════════════════════════════════════════════════════════════
   ACTION ROWS
   ═══════════════════════════════════════════════════════════════ */

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(201, 168, 108, 0.05);

  &:last-child {
    border-bottom: none;
  }
`

const ActionName = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  color: var(--color-text);
`

/* ═══════════════════════════════════════════════════════════════
   ENERGY BAR - 能量条
   ═══════════════════════════════════════════════════════════════ */

const BottomDecor = styled.div`
  padding: 8px 12px;
  border-top: 1px solid var(--color-border);
`

const EnergyBar = styled.div<{ $active: boolean }>`
  position: relative;
  height: 4px;
  background: var(--color-metal-dark);
  border-radius: 2px;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${props => props.$active
      ? 'linear-gradient(90deg, transparent, var(--color-teal), var(--color-violet), var(--color-teal), transparent)'
      : 'linear-gradient(90deg, transparent, var(--color-brass-dark), var(--color-teal), var(--color-brass-dark), transparent)'};
    opacity: ${props => props.$active ? 1 : 0.3};
    background-size: 200% 100%;
    animation: ${props => props.$active ? energyFlow : 'none'} 3s linear infinite;
  }
`

const EnergyFlow = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(0, 212, 170, 0.5) 50%, transparent 100%);
  transform: translateX(-100%);
  animation: ${props => props.$active ? css`${energyFlow} 2s linear infinite` : 'none'};
`

/* ═══════════════════════════════════════════════════════════════
   LOADING STATE
   ═══════════════════════════════════════════════════════════════ */

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
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
  animation: ${electronPulse} 1.5s ease-in-out infinite;
`

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

export default App
