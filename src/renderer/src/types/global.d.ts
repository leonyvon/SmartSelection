// 全局类型声明

interface WindowApi {
  quit: () => Promise<void>
  minimize: () => Promise<void>
  reload: () => Promise<void>
  openWebsite: (url: string) => Promise<void>
  quoteToMainWindow: (text: string) => Promise<void>
  selection: {
    hideToolbar: () => Promise<void>
    writeToClipboard: (text: string) => Promise<boolean>
    determineToolbarSize: (width: number, height: number) => Promise<void>
    setEnabled: (enabled: boolean) => Promise<void>
    setTriggerMode: (mode: string) => Promise<void>
    setFollowToolbar: (isFollow: boolean) => Promise<void>
    setRemeberWinSize: (isRemember: boolean) => Promise<void>
    setFilterMode: (mode: string) => Promise<void>
    setFilterList: (list: string[]) => Promise<void>
    processAction: (action: any, isFullScreen?: boolean) => Promise<void>
    closeActionWindow: () => Promise<void>
    minimizeActionWindow: () => Promise<void>
    pinActionWindow: (isPinned: boolean) => Promise<void>
    resizeActionWindow: (deltaX: number, deltaY: number, direction: string) => Promise<void>
  }
  config: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
  }
  llm: {
    chatCompletion: (params: any) => Promise<any>
    abortCompletion: (id: string) => Promise<void>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

interface ElectronApi {
  ipcRenderer: {
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => () => void
    removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
  }
}

declare global {
  interface Window {
    api?: WindowApi
    electron?: ElectronApi
  }
}

export {}
