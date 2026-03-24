// src/renderer/src/constants/icons.ts

import type { FC } from 'react'
import {
  Sparkles,
  WandSparkles,
  PenTool,
  Edit3,
  Code,
  FileText,
  MessageSquare,
  Languages,
  BookOpen,
  Lightbulb,
  Target,
  Zap,
  Flame,
  Star,
  Heart,
  Bookmark,
  Flag,
  Music,
  Palette,
  Rocket
} from 'lucide-react'

export interface PresetIcon {
  id: string
  name: string
  component: FC<{ size?: number; className?: string }>
}

export const PRESET_ICONS: PresetIcon[] = [
  { id: 'sparkles', name: '火花', component: Sparkles },
  { id: 'wand-sparkles', name: '魔法棒', component: WandSparkles },
  { id: 'pen-tool', name: '画笔', component: PenTool },
  { id: 'edit-3', name: '编辑', component: Edit3 },
  { id: 'code', name: '代码', component: Code },
  { id: 'file-text', name: '文档', component: FileText },
  { id: 'message-square', name: '消息', component: MessageSquare },
  { id: 'languages', name: '语言', component: Languages },
  { id: 'book-open', name: '书本', component: BookOpen },
  { id: 'lightbulb', name: '灯泡', component: Lightbulb },
  { id: 'target', name: '目标', component: Target },
  { id: 'zap', name: '闪电', component: Zap },
  { id: 'flame', name: '火焰', component: Flame },
  { id: 'star', name: '星星', component: Star },
  { id: 'heart', name: '心形', component: Heart },
  { id: 'bookmark', name: '书签', component: Bookmark },
  { id: 'flag', name: '旗帜', component: Flag },
  { id: 'music', name: '音乐', component: Music },
  { id: 'palette', name: '调色板', component: Palette },
  { id: 'rocket', name: '火箭', component: Rocket }
]

export const DEFAULT_ICON_ID = 'sparkles'

export function getIconComponent(iconId?: string): FC<{ size?: number; className?: string }> {
  if (!iconId) return Sparkles
  const found = PRESET_ICONS.find(icon => icon.id === iconId)
  return found ? found.component : Sparkles
}
