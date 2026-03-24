/**
 * 配置管理服务 - 渲染进程
 * 通过 IPC 与主进程通信来访问配置
 */

import type { AppSettings, Provider, Model } from '../types'

// 默认配置（用于初始化）
const defaultSettings: AppSettings = {
  language: 'zh-CN',
  llmConfig: {
    provider: {
      id: 'openai',
      name: 'OpenAI',
      type: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      models: []
    },
    model: {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai'
    },
    temperature: 0.7,
    maxTokens: 4096,
    stream: true
  },
  selection: {
    selectionEnabled: false,
    triggerMode: 'selected',
    isCompact: false,
    isAutoClose: false,
    isAutoPin: false,
    isFollowToolbar: true,
    isRememberWinSize: false,
    filterMode: 'default',
    filterList: [],
    actionWindowOpacity: 100,
    actionItems: [
      { id: 'translate', name: '翻译', enabled: true, isBuiltIn: true, icon: 'languages' },
      { id: 'explain', name: '解释', enabled: true, isBuiltIn: true, icon: 'file-question' },
      { id: 'summary', name: '总结', enabled: true, isBuiltIn: true, icon: 'scan-text' },
      { id: 'search', name: '搜索', enabled: true, isBuiltIn: true, icon: 'search', searchEngine: 'Google|https://www.google.com/search?q={{queryString}}' },
      { id: 'copy', name: '复制', enabled: true, isBuiltIn: true, icon: 'clipboard-copy' },
      { id: 'refine', name: '润色', enabled: false, isBuiltIn: true, icon: 'wand-sparkles' }
    ]
  }
}

// 缓存配置
let cachedSettings: AppSettings | null = null

// 获取配置
export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  if (cachedSettings) {
    return cachedSettings[key]
  }
  const value = await window.api?.config.get(key)
  return value ?? defaultSettings[key]
}

// 同步获取配置（从缓存）
export function getSettingSync<K extends keyof AppSettings>(key: K): AppSettings[K] {
  if (cachedSettings) {
    return cachedSettings[key]
  }
  return defaultSettings[key]
}

// 设置配置
export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  await window.api?.config.set(key, value)
  if (cachedSettings) {
    cachedSettings[key] = value
  }
}

// 获取 LLM 配置
export async function getLLMConfig(): Promise<AppSettings['llmConfig']> {
  const config = await window.api?.config.get('llmConfig')
  return config ?? defaultSettings.llmConfig
}

// 设置 LLM 配置
export async function setLLMConfig(config: AppSettings['llmConfig']): Promise<void> {
  await window.api?.config.set('llmConfig', config)
  cachedSettings = cachedSettings ? { ...cachedSettings, llmConfig: config } : null
}

// 获取 Provider
export async function getProvider(): Promise<Provider> {
  const config = await getLLMConfig()
  return config.provider
}

// 设置 Provider
export async function setProvider(provider: Provider): Promise<void> {
  const config = await getLLMConfig()
  await setLLMConfig({ ...config, provider })
}

// 获取 Model
export async function getModel(): Promise<Model> {
  const config = await getLLMConfig()
  return config.model
}

// 设置 Model
export async function setModel(model: Model): Promise<void> {
  const config = await getLLMConfig()
  await setLLMConfig({ ...config, model })
}

// 初始化配置缓存
export async function initSettings(): Promise<AppSettings> {
  const settings = await window.api?.config.get('settings')
  cachedSettings = settings ?? defaultSettings
  return cachedSettings!
}

// 导出默认配置
export { defaultSettings }
