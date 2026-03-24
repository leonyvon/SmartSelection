/**
 * LLM 服务 - 处理与大语言模型的通信
 * 通过 IPC 调用主进程的 LLM 服务，避免 CORS 问题
 */

import type { Assistant, Model, Provider, Message, Chunk } from '../types'
import { ChunkType } from '../types'

// LLM 请求参数
interface ChatCompletionParams {
  provider: Provider
  model: Model
  messages: Message[]
  temperature?: number
  maxTokens?: number
  stream?: boolean
  onChunk?: (chunk: Chunk) => void
  abortSignal?: AbortSignal
}

// 当前请求 ID
let currentRequestId: string | null = null
let chunkListener: (() => void) | null = null

/**
 * 生成唯一请求 ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 调用 LLM Chat Completion API (通过主进程)
 */
export async function fetchChatCompletion(params: ChatCompletionParams): Promise<string> {
  const { provider, model, messages, temperature, maxTokens, stream = true, onChunk } = params

  // 清理之前的监听器
  if (chunkListener) {
    chunkListener()
    chunkListener = null
  }

  // 先生成请求 ID
  const requestId = generateRequestId()
  currentRequestId = requestId

  // 设置流式响应监听器
  if (stream && onChunk && window.electron) {
    chunkListener = window.electron.ipcRenderer.on('llm:chunk', (_, data) => {
      if (data.requestId !== currentRequestId) return

      console.log('[LLMService] Received chunk:', data.type, data.text?.substring(0, 50))

      switch (data.type) {
        case 'TEXT_START':
          onChunk({ type: ChunkType.TEXT_START })
          break
        case 'TEXT_DELTA':
          onChunk({ type: ChunkType.TEXT_DELTA, text: data.text })
          break
        case 'TEXT_COMPLETE':
          onChunk({ type: ChunkType.TEXT_COMPLETE, text: data.text })
          break
        case 'ERROR':
          onChunk({ type: ChunkType.ERROR, error: { message: data.error, name: 'LLMError' } })
          break
      }
    })
  }

  try {
    // 调用主进程，传递 requestId
    const result = await window.api?.llm.chatCompletion({
      requestId,
      provider: {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl
      },
      model: {
        id: model.id,
        name: model.name,
        provider: model.provider
      },
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      temperature,
      maxTokens,
      stream
    })

    if (!result?.success) {
      throw new Error(result?.error || 'LLM request failed')
    }

    // 非流式响应直接返回
    if (!stream) {
      return result.content || ''
    }

    // 流式响应返回完整内容（通过 onChunk 回调处理增量）
    return result.content || ''
  } finally {
    // 清理监听器
    if (chunkListener) {
      chunkListener()
      chunkListener = null
    }
    currentRequestId = null
  }
}

/**
 * 中止当前请求
 */
export function abortCurrentRequest(): void {
  if (currentRequestId) {
    window.api?.llm.abortCompletion(currentRequestId)
    currentRequestId = null
  }
}

/**
 * 创建默认助手配置
 */
export function getDefaultAssistant(): Assistant {
  return {
    id: 'default',
    name: '助手',
    prompt: '',
    settings: {
      temperature: 0.7,
      enableTemperature: false,
      maxTokens: 4096,
      enableMaxTokens: false,
      streamOutput: true
    }
  }
}

/**
 * 获取翻译助手
 */
export function getTranslateAssistant(targetLanguage: string): Assistant {
  return {
    id: 'translate',
    name: '翻译',
    prompt: `你是一个专业的翻译助手。请将用户提供的文本翻译成${targetLanguage}，只输出翻译结果，不要添加任何解释或说明。`,
    settings: {
      temperature: 0.3,
      enableTemperature: true,
      streamOutput: true
    }
  }
}

/**
 * 获取解释助手
 */
export function getExplainAssistant(): Assistant {
  return {
    id: 'explain',
    name: '解释',
    prompt: '你是一个专业的解释助手。请用简洁清晰的语言解释用户提供的文本内容。',
    settings: {
      temperature: 0.5,
      enableTemperature: true,
      streamOutput: true
    }
  }
}

/**
 * 获取总结助手
 */
export function getSummaryAssistant(): Assistant {
  return {
    id: 'summary',
    name: '总结',
    prompt: '你是一个专业的总结助手。请对用户提供的文本进行简洁的总结，提取关键要点。',
    settings: {
      temperature: 0.3,
      enableTemperature: true,
      streamOutput: true
    }
  }
}

/**
 * 获取润色助手
 */
export function getRefineAssistant(): Assistant {
  return {
    id: 'refine',
    name: '润色',
    prompt: '你是一个专业的文字润色助手。请优化用户提供的文本，使其更加流畅、专业、优雅，同时保持原意不变。',
    settings: {
      temperature: 0.5,
      enableTemperature: true,
      streamOutput: true
    }
  }
}

/**
 * 根据动作 ID 获取助手
 */
export function getAssistantForAction(actionId: string, customPrompt?: string): Assistant {
  switch (actionId) {
    case 'translate':
      return getTranslateAssistant('中文')
    case 'explain':
      return getExplainAssistant()
    case 'summary':
      return getSummaryAssistant()
    case 'refine':
      return getRefineAssistant()
    default:
      return {
        id: 'custom',
        name: '自定义',
        prompt: customPrompt || '',
        settings: {
          temperature: 0.7,
          enableTemperature: false,
          streamOutput: true
        }
      }
  }
}

/**
 * 构建消息列表
 */
export function buildMessages(assistant: Assistant, userText: string): Message[] {
  const messages: Message[] = []

  // 添加系统提示
  if (assistant.prompt) {
    messages.push({
      id: 'system-1',
      role: 'system',
      content: assistant.prompt,
      createdAt: new Date().toISOString()
    })
  }

  // 添加用户消息
  messages.push({
    id: 'user-1',
    role: 'user',
    content: userText,
    createdAt: new Date().toISOString()
  })

  return messages
}
