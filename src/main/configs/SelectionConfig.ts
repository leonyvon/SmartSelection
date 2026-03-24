/**
 * 应用黑名单配置
 *
 * 预定义的应用过滤列表，用于在选中模式下禁用不需要文本选择的应用
 */

interface IFilterList {
  WINDOWS: string[]
  MAC: string[]
}

export const SELECTION_PREDEFINED_BLACKLIST: IFilterList = {
  WINDOWS: [
    'explorer.exe',
    // 截图工具
    'snipaste.exe',
    'pixpin.exe',
    'sharex.exe',
    // Office
    'excel.exe',
    'powerpnt.exe',
    // 图像编辑
    'photoshop.exe',
    'illustrator.exe',
    // 视频编辑
    'adobe premiere pro.exe',
    'afterfx.exe',
    // 3D 编辑
    'blender.exe',
    '3dsmax.exe',
    'maya.exe',
    // CAD
    'acad.exe',
    'sldworks.exe',
    // 远程桌面
    'mstsc.exe'
  ],
  MAC: ['com.apple.finder']
}
