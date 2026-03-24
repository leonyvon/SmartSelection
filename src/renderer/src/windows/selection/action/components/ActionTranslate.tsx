/**
 * 翻译动作组件 - Retro-Futurism: Atomic Age Elegance
 * 时间折叠 - 通用翻译器界面
 */

import { getTranslateAssistant, buildMessages, fetchChatCompletion } from '@renderer/services/LLMService'
import { getProvider, getModel } from '@renderer/services/ConfigService'
import type { ActionItem, Chunk, Provider, Model } from '@renderer/types'
import { ChunkType } from '@renderer/types'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import WindowFooter from './WindowFooter'

// 支持的语言
const LANGUAGES = [
  { code: 'zh-CN', name: '中文', emoji: '🇨🇳' },
  { code: 'en-US', name: 'English', emoji: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', emoji: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', emoji: '🇰🇷' },
  { code: 'fr-FR', name: 'Français', emoji: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', emoji: '🇩🇪' },
  { code: 'es-ES', name: 'Español', emoji: '🇪🇸' },
  { code: 'pt-BR', name: 'Português', emoji: '🇧🇷' },
  { code: 'ru-RU', name: 'Русский', emoji: '🇷🇺' },
  { code: 'ar-SA', name: 'العربية', emoji: '🇸🇦' }
]

interface Props {
  action: ActionItem
  scrollToBottom: () => void
}

const ActionTranslate: FC<Props> = ({ action, scrollToBottom }) => {
  const [targetLanguage, setTargetLanguage] = useState(LANGUAGES[0])
  const [detectedLanguage, setDetectedLanguage] = useState<typeof LANGUAGES[0] | null>(null)
  const [error, setError] = useState('')
  const [showOriginal, setShowOriginal] = useState(false)
  const [status, setStatus] = useState<'preparing' | 'streaming' | 'finished'>('preparing')
  const [content, setContent] = useState('')
  const [showLangSelect, setShowLangSelect] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [model, setModel] = useState<Model | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      const p = await getProvider()
      const m = await getModel()
      setProvider(p)
      setModel(m)
    }
    loadConfig()
  }, [])

  const fetchResult = useCallback(async (targetLang: typeof LANGUAGES[0]) => {
    if (!action.selectedText) return
    if (!provider || !model) return

    setStatus('preparing')
    setError('')
    setContent('')

    const assistant = getTranslateAssistant(targetLang.name)
    const messages = buildMessages(assistant, action.selectedText!)

    if (!provider.apiKey) {
      setError('请先配置 API Key')
      setStatus('finished')
      return
    }

    abortControllerRef.current = new AbortController()

    // 简单的语言检测（基于字符）
    const text = action.selectedText
    let detected = LANGUAGES[1] // 默认英语
    if (/[\u4e00-\u9fff]/.test(text)) {
      detected = LANGUAGES[0] // 中文
    } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      detected = LANGUAGES[2] // 日语
    } else if (/[\uac00-\ud7af]/.test(text)) {
      detected = LANGUAGES[3] // 韩语
    }
    setDetectedLanguage(detected)

    try {
      await fetchChatCompletion({
        provider,
        model,
        messages,
        temperature: 0.3,
        stream: true,
        abortSignal: abortControllerRef.current.signal,
        onChunk: (chunk: Chunk) => {
          switch (chunk.type) {
            case ChunkType.TEXT_START:
              setStatus('streaming')
              break
            case ChunkType.TEXT_DELTA:
              setContent(chunk.text || '')
              scrollToBottom()
              break
            case ChunkType.TEXT_COMPLETE:
              setStatus('finished')
              setContent(chunk.text || '')
              break
            case ChunkType.ERROR:
              setStatus('finished')
              setError(chunk.error?.message || '发生错误')
              break
          }
        }
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message)
      setStatus('finished')
    }
  }, [action, scrollToBottom, provider, model])

  useEffect(() => {
    if (provider && model) {
      fetchResult(targetLanguage)
    }
    return () => abortControllerRef.current?.abort()
  }, [targetLanguage, fetchResult, provider, model])

  const handlePause = () => abortControllerRef.current?.abort()

  const handleRegenerate = () => {
    setContent('')
    fetchResult(targetLanguage)
  }

  const isPreparing = status === 'preparing'
  const isStreaming = status === 'streaming'

  return (
    <>
      <Container>
        <MenuContainer>
          <LeftGroup>
            {/* 检测到的语言 */}
            <DetectedLanguageTag>
              {isPreparing ? (
                <LoadingDots>...</LoadingDots>
              ) : (
                <>
                  <LangEmoji>{detectedLanguage?.emoji}</LangEmoji>
                  <LangName>{detectedLanguage?.name}</LangName>
                </>
              )}
            </DetectedLanguageTag>

            <ArrowIcon size={12} />

            {/* 目标语言选择 */}
            <LanguageSelect onClick={() => setShowLangSelect(!showLangSelect)}>
              <LangEmoji>{targetLanguage.emoji}</LangEmoji>
              <LangName>{targetLanguage.name}</LangName>
              <ChevronDown size={10} className={showLangSelect ? 'expanded' : ''} />
            </LanguageSelect>

            {showLangSelect && (
              <LanguageDropdown>
                {LANGUAGES.map(lang => (
                  <LanguageOption
                    key={lang.code}
                    onClick={() => { setTargetLanguage(lang); setShowLangSelect(false); }}
                    $selected={targetLanguage.code === lang.code}
                  >
                    <LangEmoji>{lang.emoji}</LangEmoji>
                    <LangName>{lang.name}</LangName>
                  </LanguageOption>
                ))}
              </LanguageDropdown>
            )}
          </LeftGroup>

          <OriginalHeader onClick={() => setShowOriginal(!showOriginal)}>
            <span>{showOriginal ? '隐藏原文' : '显示原文'}</span>
            <ChevronDown size={10} className={showOriginal ? 'expanded' : ''} />
          </OriginalHeader>
        </MenuContainer>

        {showOriginal && <OriginalContent>{action.selectedText}</OriginalContent>}

        <Result>
          {isPreparing && (
            <LoadingIndicator>
              <LoadingOrbit>
                <LoadingRing />
                <LoadingCore />
              </LoadingOrbit>
            </LoadingIndicator>
          )}
          {!isPreparing && content && (
            <MarkdownContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </MarkdownContent>
          )}
        </Result>
        {error && <ErrorMsg>{error}</ErrorMsg>}
      </Container>
      <WindowFooter loading={isStreaming} onPause={handlePause} onRegenerate={handleRegenerate} content={content} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

const orbitSpin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const corePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 8px var(--color-copper-glow);
  }
  50% {
    box-shadow: 0 0 16px var(--color-teal-glow);
  }
`

/* ═══════════════════════════════════════════════════════════════
   STYLED COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  width: 100%;
`

const Result = styled.div`
  margin-top: 14px;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
`

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px;
`

const LoadingOrbit = styled.div`
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoadingRing = styled.div`
  position: absolute;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-brass);
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${orbitSpin} 1s linear infinite;
`

const LoadingCore = styled.div`
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, var(--color-brass), var(--color-teal));
  border-radius: 50%;
  animation: ${corePulse} 1.5s ease-in-out infinite;
`

const LoadingDots = styled.span`
  color: var(--color-brass);
  font-size: 10px;
`

const MarkdownContent = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.75;
  color: var(--color-text);

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
    font-weight: 600;
    color: var(--color-brass-light);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    line-height: 1.3;
  }

  h1 { font-size: 1.6em; border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; }
  h2 { font-size: 1.4em; }
  h3 { font-size: 1.2em; color: var(--color-teal); }
  h4 { font-size: 1.1em; }

  p { margin: 0.8em 0; }

  strong {
    color: var(--color-brass-light);
    font-weight: 600;
  }

  em {
    color: var(--color-text-secondary);
    font-style: italic;
  }

  a {
    color: var(--color-teal);
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;

    &:hover {
      border-bottom-color: var(--color-teal);
    }
  }

  code {
    font-family: 'Fira Code', monospace;
    font-size: 0.9em;
    background: rgba(201, 168, 108, 0.1);
    border: 1px solid var(--color-border);
    border-radius: 3px;
    padding: 0.15em 0.4em;
    color: var(--color-teal);
  }

  pre {
    background: rgba(10, 15, 26, 0.8);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    padding: 14px 16px;
    margin: 1em 0;
    overflow-x: auto;

    code {
      background: transparent;
      border: none;
      padding: 0;
      font-size: 0.85em;
      color: var(--color-text);
      line-height: 1.6;
    }
  }

  ul, ol {
    margin: 0.8em 0;
    padding-left: 1.5em;
  }

  li {
    margin: 0.4em 0;
  }

  ul li::marker {
    color: var(--color-brass);
  }

  ol li::marker {
    color: var(--color-brass);
    font-weight: 500;
  }

  blockquote {
    margin: 1em 0;
    padding: 0.8em 1em;
    background: rgba(201, 168, 108, 0.05);
    border-left: 3px solid var(--color-brass);
    border-radius: 0 4px 4px 0;
    color: var(--color-text-secondary);

    p { margin: 0.4em 0; }
  }

  hr {
    border: none;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border), transparent);
    margin: 1.5em 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-size: 0.9em;

    th, td {
      border: 1px solid var(--color-border);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: rgba(201, 168, 108, 0.1);
      color: var(--color-brass-light);
      font-weight: 600;
    }

    tr:nth-child(even) {
      background: rgba(201, 168, 108, 0.03);
    }
  }
`

const MenuContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
`

const DetectedLanguageTag = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(201, 168, 108, 0.08);
  border: 1px solid var(--color-border);
  border-radius: 4px;
`

const LangEmoji = styled.span`
  font-size: 11px;
`

const LangName = styled.span`
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  color: var(--color-text-secondary);
`

const ArrowIcon = styled(ArrowRight)`
  color: var(--color-text-dim);
`

const LanguageSelect = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(0, 212, 170, 0.08);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 170, 0.15);
    border-color: var(--color-teal);
  }

  .lucide {
    transition: transform 0.2s ease;
    &.expanded {
      transform: rotate(180deg);
    }
  }
`

const LanguageDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--color-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  min-width: 130px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`

const LanguageOption = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
  background: ${props => props.$selected ? 'rgba(201, 168, 108, 0.12)' : 'transparent'};

  &:hover {
    background: rgba(201, 168, 108, 0.1);
  }
`

const OriginalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  cursor: pointer;
  color: var(--color-text-dim);
  font-family: 'Fira Code', monospace;
  font-size: 10px;
  padding: 4px 0;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-teal);
  }

  .lucide {
    transition: transform 0.2s ease;
    &.expanded {
      transform: rotate(180deg);
    }
  }
`

const OriginalContent = styled.div`
  margin-top: 8px;
  padding: 10px;
  background: rgba(201, 168, 108, 0.04);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  white-space: pre-wrap;
  word-break: break-word;
  width: 100%;
  line-height: 1.6;
`

const ErrorMsg = styled.div`
  color: var(--color-error);
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 10px 14px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  word-break: break-all;
`

export default ActionTranslate
