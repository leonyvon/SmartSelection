/**
 * 通用动作组件 - 处理解释、总结、润色、自定义动作
 * Retro-Futurism: Atomic Age Elegance
 */

import { getAssistantForAction, buildMessages, fetchChatCompletion } from '@renderer/services/LLMService'
import { getProvider, getModel } from '@renderer/services/ConfigService'
import type { ActionItem, Chunk, Provider, Model } from '@renderer/types'
import { ChunkType } from '@renderer/types'
import { ChevronDown } from 'lucide-react'
import type { FC } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import WindowFooter from './WindowFooter'

interface Props {
  action: ActionItem
  scrollToBottom?: () => void
}

const ActionGeneral: FC<Props> = React.memo(({ action, scrollToBottom }) => {
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [status, setStatus] = useState<'preparing' | 'streaming' | 'finished'>('preparing')
  const [content, setContent] = useState('')
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

  const fetchResult = useCallback(async () => {
    console.log('[ActionGeneral] fetchResult called, action:', action)
    if (!action.selectedText) {
      console.log('[ActionGeneral] No selectedText, returning')
      return
    }

    if (!provider || !model) {
      console.log('[ActionGeneral] No provider or model yet, waiting...')
      return
    }

    setStatus('preparing')
    setError(null)
    setContent('')

    const assistant = getAssistantForAction(action.id, action.prompt)
    const messages = buildMessages(assistant, action.selectedText)

    console.log('[ActionGeneral] Provider:', provider, 'Model:', model)

    if (!provider.apiKey) {
      setError('请先配置 API Key')
      setStatus('finished')
      return
    }

    abortControllerRef.current = new AbortController()

    try {
      await fetchChatCompletion({
        provider,
        model,
        messages,
        temperature: assistant.settings.temperature,
        maxTokens: assistant.settings.maxTokens,
        stream: true,
        abortSignal: abortControllerRef.current.signal,
        onChunk: (chunk: Chunk) => {
          switch (chunk.type) {
            case ChunkType.TEXT_START:
              setStatus('streaming')
              break
            case ChunkType.TEXT_DELTA:
              setContent(chunk.text || '')
              scrollToBottom?.()
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
      fetchResult()
    }
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchResult, provider, model])

  const handlePause = () => {
    abortControllerRef.current?.abort()
  }

  const handleRegenerate = () => {
    setContent('')
    fetchResult()
  }

  const isPreparing = status === 'preparing'
  const isStreaming = status === 'streaming'

  return (
    <>
      <Container>
        <MenuContainer>
          <OriginalHeader onClick={() => setShowOriginal(!showOriginal)}>
            <span>{showOriginal ? '隐藏原文' : '显示原文'}</span>
            <ChevronDown size={11} className={showOriginal ? 'expanded' : ''} />
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
})

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
  justify-content: center;
  width: 100%;
`

const Result = styled.div`
  margin-top: 6px;
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

const MarkdownContent = styled.div`
  /* 应用全局 markdown-content 样式 */
  &.markdown-content,
  & {
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

    p {
      margin: 0.8em 0;
    }

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
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--color-brass-dark), transparent);
      }

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
      position: relative;
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

      p {
        margin: 0.4em 0;
      }
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
  }
`

const MenuContainer = styled.div`
  display: flex;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
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
  padding: 10px;
  margin-top: 8px;
  margin-bottom: 12px;
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

export default ActionGeneral
