/**
 * 共享类型定义 - 主进程和渲染进程都可使用
 */

// 划词功能类型定义

export type TriggerMode = 'selected' | 'ctrlkey' | 'shortcut'
export type FilterMode = 'default' | 'whitelist' | 'blacklist'

// 动作项
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
  userQuestion?: string // 问AI时用户输入的问题
}

// 划词设置状态
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
  enableAskAi?: boolean // 问AI功能开关
}

// 模型配置
export interface Model {
  id: string
  name: string
  provider: string
  maxTokens?: number
  supportStream?: boolean
}

// Provider 配置
export interface Provider {
  id: string
  name: string
  type: string
  apiKey: string
  baseUrl: string
  models: Model[]
}

// Assistant 配置
export interface Assistant {
  id: string
  name: string
  emoji?: string
  prompt: string
  model?: Model
  settings: AssistantSettings
}

// Assistant 设置
export interface AssistantSettings {
  temperature?: number
  enableTemperature?: boolean
  maxTokens?: number
  enableMaxTokens?: boolean
  topP?: number
  enableTopP?: boolean
  contextCount?: number
  streamOutput?: boolean
  customParameters?: CustomParameter[]
}

// 自定义参数
export interface CustomParameter {
  name: string
  value: string | number | boolean
  type: 'string' | 'number' | 'boolean'
}

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

// Topic 类型
export interface Topic {
  id: string
  assistantId: string
  name: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

// 文本选择数据 (来自 selection-hook)
export interface TextSelectionData {
  text: string
  programName?: string
  mousePosStart?: { x: number; y: number }
  mousePosEnd?: { x: number; y: number }
  position: { x: number; y: number } // 计算后的位置
  isFullscreen?: boolean
}

// LLM 响应 Chunk 类型
export enum ChunkType {
  TEXT_START = 'text_start',
  TEXT_DELTA = 'text_delta',
  TEXT_COMPLETE = 'text_complete',
  THINKING_START = 'thinking_start',
  THINKING_DELTA = 'thinking_delta',
  THINKING_COMPLETE = 'thinking_complete',
  ERROR = 'error',
  BLOCK_COMPLETE = 'block_complete',
  LLM_RESPONSE_COMPLETE = 'llm_response_complete'
}

export interface Chunk {
  type: ChunkType
  text?: string
  error?: Error
  thinking_millsec?: number
}

// LLM 配置
export interface LLMConfig {
  provider: Provider
  model: Model
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// 设置存储
export interface AppSettings {
  language: string
  llmConfig: LLMConfig
  selection: SelectionState
}
