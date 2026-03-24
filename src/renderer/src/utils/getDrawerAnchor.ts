// src/renderer/src/utils/getDrawerAnchor.ts

/**
 * 根据窗口屏幕位置计算Drawer展开方向
 * 窗口在屏幕左侧 → 从右侧展开
 * 窗口在屏幕右侧 → 从左侧展开
 */
export function getDrawerAnchor(): 'left' | 'right' {
  const windowX = window.screenX
  const screenWidth = screen.width
  return windowX < screenWidth / 2 ? 'right' : 'left'
}
