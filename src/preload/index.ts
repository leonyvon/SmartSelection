/**
 * 预加载脚本 - 暴露安全的 API 给渲染进程
 */

import { contextBridge, ipcRenderer, shell } from 'electron'
import { IpcChannel } from '@shared/IpcChannel'
import type { ActionItem } from '@shared/types'

// 暴露给渲染进程的 API
const api = {
  // 应用相关
  quit: () => ipcRenderer.invoke(IpcChannel.App_Quit),
  minimize: () => ipcRenderer.invoke(IpcChannel.App_Minimize),
  reload: () => ipcRenderer.invoke(IpcChannel.App_Reload),
  openWebsite: (url: string) => ipcRenderer.invoke(IpcChannel.Open_Website, url),
  quoteToMainWindow: (text: string) => ipcRenderer.invoke(IpcChannel.App_QuoteToMain, text),

  // 划词相关
  selection: {
    hideToolbar: () => ipcRenderer.invoke(IpcChannel.Selection_ToolbarHide),
    writeToClipboard: (text: string) => ipcRenderer.invoke(IpcChannel.Selection_WriteToClipboard, text),
    determineToolbarSize: (width: number, height: number) =>
      ipcRenderer.invoke(IpcChannel.Selection_ToolbarDetermineSize, width, height),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke(IpcChannel.Selection_SetEnabled, enabled),
    setTriggerMode: (mode: string) => ipcRenderer.invoke(IpcChannel.Selection_SetTriggerMode, mode),
    setFollowToolbar: (isFollow: boolean) => ipcRenderer.invoke(IpcChannel.Selection_SetFollowToolbar, isFollow),
    setRemeberWinSize: (isRemember: boolean) =>
      ipcRenderer.invoke(IpcChannel.Selection_SetRemeberWinSize, isRemember),
    setFilterMode: (mode: string) => ipcRenderer.invoke(IpcChannel.Selection_SetFilterMode, mode),
    setFilterList: (list: string[]) => ipcRenderer.invoke(IpcChannel.Selection_SetFilterList, list),
    setActionItems: (items: ActionItem[]) => ipcRenderer.invoke(IpcChannel.Selection_SetActionItems, items),
    processAction: (action: ActionItem, isFullScreen: boolean = false) =>
      ipcRenderer.invoke(IpcChannel.Selection_ProcessAction, action, isFullScreen),
    closeActionWindow: () => ipcRenderer.invoke(IpcChannel.Selection_ActionWindowClose),
    minimizeActionWindow: () => ipcRenderer.invoke(IpcChannel.Selection_ActionWindowMinimize),
    pinActionWindow: (isPinned: boolean) => ipcRenderer.invoke(IpcChannel.Selection_ActionWindowPin, isPinned),
    resizeActionWindow: (deltaX: number, deltaY: number, direction: string) =>
      ipcRenderer.invoke(IpcChannel.Selection_ActionWindowResize, deltaX, deltaY, direction)
  },

  // 配置相关
  config: {
    get: (key: string) => ipcRenderer.invoke(IpcChannel.Config_Get, key),
    set: (key: string, value: any) => ipcRenderer.invoke(IpcChannel.Config_Set, key, value)
  },

  // LLM 相关
  llm: {
    chatCompletion: (params: any) => ipcRenderer.invoke(IpcChannel.LLM_ChatCompletion, params),
    abortCompletion: (id: string) => ipcRenderer.invoke(IpcChannel.LLM_AbortCompletion, id)
  },

  // Shell
  shell: {
    openExternal: (url: string) => shell.openExternal(url)
  }
}

// 暴露 IPC 事件监听
const electron = {
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => {
      const listener = (_event: any, ...args: any[]) => callback(_event, ...args)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback)
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    }
  }
}

// 暴露 API
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electron', electron)
  } catch (error) {
    console.error('[Preload] Failed to expose APIs:', error)
  }
} else {
  // @ts-ignore
  window.api = api
  // @ts-ignore
  window.electron = electron
}

// 类型导出
export type WindowApiType = typeof api
export type WindowElectronType = typeof electron
