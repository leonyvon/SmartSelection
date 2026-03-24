// src/renderer/src/utils/byteLength.ts

/**
 * 计算字符串的字节长度
 * 中文占3字节，英文占1字节（UTF-8编码）
 */
export function getByteLength(str: string): number {
  return new TextEncoder().encode(str).length
}

/**
 * 截断字符串到指定字节长度
 */
export function truncateToByteLength(str: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  let result = ''
  let currentBytes = 0

  for (const char of str) {
    const charBytes = encoder.encode(char).length
    if (currentBytes + charBytes > maxBytes) {
      break
    }
    result += char
    currentBytes += charBytes
  }

  return result
}
