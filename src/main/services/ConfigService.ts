/**
 * 配置管理服务 - 主进程
 */

import Store from 'electron-store'
import type { AppSettings, Provider, Model } from '@shared/types'

// 默认配置
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
      { id: 'copy', name: '复制', enabled: true, isBuiltIn: true, icon: 'clipboard-copy' }
    ]
  }
}

// 创建存储实例
const store = new Store<AppSettings>({
  defaults: defaultSettings,
  name: 'selection-assistant-config'
})

// 获取配置
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  return store.get(key)
}

// 设置配置
export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  console.log('[ConfigService] Setting:', key, JSON.stringify(value, null, 2))
  store.set(key, value)
  console.log('[ConfigService] After set, reading back:', JSON.stringify(store.get(key), null, 2))
}

// 获取完整配置
export function getAllSettings(): AppSettings {
  return {
    language: store.get('language'),
    llmConfig: store.get('llmConfig'),
    selection: store.get('selection')
  }
}

// 获取 Provider
export function getProvider(): Provider {
  return store.get('llmConfig').provider
}

// 获取 Model
export function getModel(): Model {
  return store.get('llmConfig').model
}

// 导出 store
export { store }
