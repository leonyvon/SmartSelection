/**
 * 划词助手 Hook
 */

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setActionItems, setActionWindowOpacity, setFilterList, setFilterMode, setIsAutoPin, setIsFollowToolbar, setIsRememberWinSize, setSelectionEnabled } from '../store'
import type { ActionItem, FilterMode } from '../types'

// 获取完整的 selection 配置
const getSelectionConfig = () => window.api?.config.get('selection')

// 保存 selection 配置
const saveSelectionConfig = async (updates: Partial<any>) => {
  const current = await getSelectionConfig() || {}
  const updated = { ...current, ...updates }
  window.api?.config.set('selection', updated)
}

export function useSelectionAssistant() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s.selection)

  // 注意：setter 函数名与 state 属性同名会导致覆盖，需要显式返回
  return {
    // state 属性
    selectionEnabled: state.selectionEnabled,
    triggerMode: state.triggerMode,
    isCompact: state.isCompact,
    isAutoClose: state.isAutoClose,
    isAutoPin: state.isAutoPin,
    isFollowToolbar: state.isFollowToolbar,
    isRememberWinSize: state.isRememberWinSize,
    filterMode: state.filterMode,
    filterList: state.filterList,
    actionWindowOpacity: state.actionWindowOpacity,
    actionItems: state.actionItems,
    // setter 函数
    setSelectionEnabled: async (enabled: boolean) => {
      dispatch(setSelectionEnabled(enabled))
      window.api?.selection.setEnabled(enabled)
      await saveSelectionConfig({ selectionEnabled: enabled })
    },
    setIsAutoPin: async (isAutoPin: boolean) => {
      dispatch(setIsAutoPin(isAutoPin))
      await saveSelectionConfig({ isAutoPin })
    },
    setIsFollowToolbar: async (isFollowToolbar: boolean) => {
      dispatch(setIsFollowToolbar(isFollowToolbar))
      window.api?.selection.setFollowToolbar(isFollowToolbar)
      await saveSelectionConfig({ isFollowToolbar })
    },
    setIsRememberWinSize: async (isRememberWinSize: boolean) => {
      dispatch(setIsRememberWinSize(isRememberWinSize))
      window.api?.selection.setRemeberWinSize(isRememberWinSize)
      await saveSelectionConfig({ isRememberWinSize })
    },
    setFilterMode: async (mode: FilterMode) => {
      dispatch(setFilterMode(mode))
      window.api?.selection.setFilterMode(mode)
      await saveSelectionConfig({ filterMode: mode })
    },
    setFilterList: async (list: string[]) => {
      dispatch(setFilterList(list))
      window.api?.selection.setFilterList(list)
      await saveSelectionConfig({ filterList: list })
    },
    setActionWindowOpacity: async (opacity: number) => {
      dispatch(setActionWindowOpacity(opacity))
      await saveSelectionConfig({ actionWindowOpacity: opacity })
    },
    setActionItems: async (items: ActionItem[]) => {
      dispatch(setActionItems(items))
      // 同步动作列表到 SelectionService
      window.api?.selection.setActionItems(items)
      await saveSelectionConfig({ actionItems: items })
    }
  }
}
