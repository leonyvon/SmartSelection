// IPC 通道定义
export const IpcChannel = {
  // Selection 相关
  Selection_TextSelected: 'selection:text-selected',
  Selection_ToolbarHide: 'selection:toolbar-hide',
  Selection_ToolbarShow: 'selection:toolbar-show',
  Selection_ToolbarVisibilityChange: 'selection:toolbar-visibility-change',
  Selection_ToolbarDetermineSize: 'selection:toolbar-determine-size',
  Selection_UpdateActionData: 'selection:update-action-data',
  Selection_ProcessAction: 'selection:process-action',
  Selection_SetEnabled: 'selection:set-enabled',
  Selection_SetTriggerMode: 'selection:set-trigger-mode',
  Selection_SetFilterMode: 'selection:set-filter-mode',
  Selection_SetFilterList: 'selection:set-filter-list',
  Selection_SetFollowToolbar: 'selection:set-follow-toolbar',
  Selection_SetRemeberWinSize: 'selection:set-remember-win-size',
  Selection_WriteToClipboard: 'selection:write-to-clipboard',
  Selection_ActionWindowClose: 'selection:action-window-close',
  Selection_ActionWindowMinimize: 'selection:action-window-minimize',
  Selection_ActionWindowPin: 'selection:action-window-pin',
  Selection_ActionWindowResize: 'selection:action-window-resize',
  Selection_SetActionItems: 'selection:set-action-items',

  // App 相关
  App_Quit: 'app:quit',
  App_Minimize: 'app:minimize',
  App_Reload: 'app:reload',
  Open_Website: 'open:website',
  App_QuoteToMain: 'app:quote-to-main',

  // 配置
  Config_Get: 'config:get',
  Config_Set: 'config:set',

  // LLM 调用
  LLM_ChatCompletion: 'llm:chat-completion',
  LLM_AbortCompletion: 'llm:abort-completion'
} as const
