/**
 * DeepSeek API 客户端
 * 用于调用 DeepSeek API 生成 AI 建议
 */

import type { DeepSeekAnalysisInput, DeepSeekAnalysisOutput } from './deepseek-prompt'
import { generateDeepSeekPrompt, parseDeepSeekResponse } from './deepseek-prompt'

// DeepSeek API 配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export interface DeepSeekConfig {
  apiKey: string
  model?: string // 默认使用 deepseek-chat
  temperature?: number // 0-1，默认 0.7
  maxTokens?: number // 最大返回 token 数，默认 2000
}

/**
 * 调用 DeepSeek API 生成建议
 */
export async function generateAIRecommendations(
  input: DeepSeekAnalysisInput,
  config: DeepSeekConfig
): Promise<DeepSeekAnalysisOutput | null> {
  try {
    const prompt = generateDeepSeekPrompt(input)
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的时尚衣橱管理顾问，擅长数据分析和个性化建议。你的回答必须简洁、专业、基于数据。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2000,
        response_format: { type: 'json_object' } // 要求返回 JSON 格式
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('DeepSeek API returned no choices')
    }
    
    const content = data.choices[0].message?.content
    
    if (!content) {
      throw new Error('DeepSeek API returned empty content')
    }
    
    // 解析响应
    const result = parseDeepSeekResponse(content)
    
    if (!result) {
      throw new Error('Failed to parse DeepSeek response')
    }
    
    return result
  } catch (error) {
    console.error('DeepSeek API call failed:', error)
    return null
  }
}

/**
 * 流式调用 DeepSeek API（可选，用于实时显示生成过程）
 */
export async function* streamAIRecommendations(
  input: DeepSeekAnalysisInput,
  config: DeepSeekConfig
): AsyncGenerator<string, void, unknown> {
  try {
    const prompt = generateDeepSeekPrompt(input)
    
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的时尚衣橱管理顾问，擅长数据分析和个性化建议。你的回答必须简洁、专业、基于数据。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2000,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }
    
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            return
          }
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            
            if (content) {
              yield content
            }
          } catch (e) {
            console.error('Failed to parse stream chunk:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('DeepSeek streaming failed:', error)
    throw error
  }
}
