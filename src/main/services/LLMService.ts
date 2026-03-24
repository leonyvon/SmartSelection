/**
 * LLM 服务 - 主进程
 * 处理与大语言模型的通信
 */

import { BrowserWindow } from 'electron'

// 请求参数类型
interface ChatCompletionParams {
  requestId?: string
  provider: {
    id: string
    name: string
    type: string
    apiKey: string
    baseUrl: string
  }
  model: {
    id: string
    name: string
    provider: string
  }
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// AbortController 管理
const abortControllers = new Map<string, AbortController>()

/**
 * 调用 LLM Chat Completion API
 */
export async function fetchChatCompletion(
  params: ChatCompletionParams,
  requestId: string,
  senderWindow: BrowserWindow
): Promise<string> {
  const { provider, model, messages, temperature, maxTokens, stream = true } = params

  // 创建 AbortController
  const abortController = new AbortController()
  abortControllers.set(requestId, abortController)

  // 构建请求体
  const requestBody: any = {
    model: model.id,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    stream
  }

  if (temperature !== undefined) requestBody.temperature = temperature
  if (maxTokens !== undefined) requestBody.max_tokens = maxTokens

  // 构建请求 URL
  const baseUrl = provider.baseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/chat/completions`

  console.log('[LLMService] Provider:', JSON.stringify(provider, null, 2))
  console.log('[LLMService] Model:', JSON.stringify(model, null, 2))
  console.log('[LLMService] Fetching from:', url)

  const sendChunk = (type: string, text?: string, error?: string) => {
    try {
      if (!senderWindow.isDestroyed()) {
        senderWindow.webContents.send('llm:chunk', { requestId, type, text, error })
      }
    } catch (e) {
      console.error('[LLMService] Failed to send chunk:', e)
    }
  }

  try {
    // 发起请求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      const errorMsg = `API Error: ${response.status} - ${errorText}`
      sendChunk('ERROR', undefined, errorMsg)
      throw new Error(errorMsg)
    }

    if (!stream) {
      // 非流式响应
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      sendChunk('TEXT_COMPLETE', content)
      return content
    }

    // 流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      const errorMsg = 'No response body'
      sendChunk('ERROR', undefined, errorMsg)
      throw new Error(errorMsg)
    }

    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    // 发送开始事件
    sendChunk('TEXT_START')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')

      // 保留最后一个可能不完整的行
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            fullContent += delta
            sendChunk('TEXT_DELTA', fullContent)
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    sendChunk('TEXT_COMPLETE', fullContent)

    return fullContent
  } catch (error) {
    // 如果是被中止的请求，不发送错误
    if ((error as Error).name === 'AbortError') {
      console.log('[LLMService] Request aborted')
      throw error
    }

    console.error('[LLMService] Error:', error)
    sendChunk('ERROR', undefined, (error as Error).message)
    throw error
  } finally {
    abortControllers.delete(requestId)
  }
}

/**
 * 中止请求
 */
export function abortCompletion(requestId: string): boolean {
  const controller = abortControllers.get(requestId)
  if (controller) {
    controller.abort()
    abortControllers.delete(requestId)
    return true
  }
  return false
}
