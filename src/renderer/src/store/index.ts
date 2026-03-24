/**
 * 划词助手 Redux Store
 */

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { ActionItem, SelectionState, TriggerMode, FilterMode } from '../types'

// 默认动作项
export const defaultActionItems: ActionItem[] = [
  { id: 'translate', name: '翻译', enabled: true, isBuiltIn: true, icon: 'languages' },
  { id: 'explain', name: '解释', enabled: true, isBuiltIn: true, icon: 'file-question' },
  { id: 'summary', name: '总结', enabled: true, isBuiltIn: true, icon: 'scan-text' },
  {
    id: 'search',
    name: '搜索',
    enabled: true,
    isBuiltIn: true,
    icon: 'search',
    searchEngine: 'Google|https://www.google.com/search?q={{queryString}}'
  },
  { id: 'copy', name: '复制', enabled: true, isBuiltIn: true, icon: 'clipboard-copy' }
]

// 初始状态
const initialState: SelectionState = {
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
  actionItems: defaultActionItems
}

// Slice
const selectionSlice = createSlice({
  name: 'selection',
  initialState,
  reducers: {
    setSelectionEnabled: (state, action: PayloadAction<boolean>) => {
      state.selectionEnabled = action.payload
    },
    setTriggerMode: (state, action: PayloadAction<TriggerMode>) => {
      state.triggerMode = action.payload
    },
    setIsCompact: (state, action: PayloadAction<boolean>) => {
      state.isCompact = action.payload
    },
    setIsAutoClose: (state, action: PayloadAction<boolean>) => {
      state.isAutoClose = action.payload
    },
    setIsAutoPin: (state, action: PayloadAction<boolean>) => {
      state.isAutoPin = action.payload
    },
    setIsFollowToolbar: (state, action: PayloadAction<boolean>) => {
      state.isFollowToolbar = action.payload
    },
    setIsRememberWinSize: (state, action: PayloadAction<boolean>) => {
      state.isRememberWinSize = action.payload
    },
    setFilterMode: (state, action: PayloadAction<FilterMode>) => {
      state.filterMode = action.payload
    },
    setFilterList: (state, action: PayloadAction<string[]>) => {
      state.filterList = action.payload
    },
    setActionWindowOpacity: (state, action: PayloadAction<number>) => {
      state.actionWindowOpacity = action.payload
    },
    setActionItems: (state, action: PayloadAction<ActionItem[]>) => {
      state.actionItems = action.payload
    }
  }
})

// 导出 actions
export const {
  setSelectionEnabled,
  setTriggerMode,
  setIsCompact,
  setIsAutoClose,
  setIsAutoPin,
  setIsFollowToolbar,
  setIsRememberWinSize,
  setFilterMode,
  setFilterList,
  setActionWindowOpacity,
  setActionItems
} = selectionSlice.actions

// 创建 store
export const store = configureStore({
  reducer: {
    selection: selectionSlice.reducer
  }
})

// 类型导出
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
