/**
 * 프롬프트 실행 엔진
 * - OpenAI API 호출
 * - JSON 응답 파싱
 * - 에러 핸들링
 */

import type { PromptResponse } from './prompt-contracts';

export interface PromptEngineConfig {
  apiUrl: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class PromptEngine {
  private config: PromptEngineConfig;

  constructor(config: PromptEngineConfig) {
    this.config = {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    };
  }

  /**
   * 프롬프트 실행 (JSON 응답 보장)
   */
  async execute<T = any>(prompt: string): Promise<PromptResponse<T>> {
    try {
      console.log('🎯 Executing prompt...');
      
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          prompt,
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Prompt executed successfully');

      // JSON 파싱 시도
      try {
        const parsedData = this.parseJSON(result.content || result.response || result);
        return {
          data: parsedData as T,
          ui: parsedData.ui,
          handoff: parsedData.handoff,
        };
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      console.error('❌ Prompt execution failed:', error);
      throw error;
    }
  }

  /**
   * JSON 파싱 (마크다운 코드블록 제거)
   */
  private parseJSON(text: string): any {
    // 마크다운 코드블록 제거
    let cleaned = text.trim();
    
    // ```json ... ``` 형태 제거
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    }
    
    // 앞뒤 공백 제거
    cleaned = cleaned.trim();
    
    return JSON.parse(cleaned);
  }

  /**
   * 스트리밍 실행 (선택적)
   */
  async *executeStream(prompt: string): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({
          prompt,
          model: this.config.model,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        yield chunk;
      }
    } catch (error) {
      console.error('❌ Stream execution failed:', error);
      throw error;
    }
  }
}

/**
 * 기본 프롬프트 엔진 생성 (Supabase Functions 사용)
 */
export function createDefaultPromptEngine(projectId: string, apiKey: string): PromptEngine {
  return new PromptEngine({
    apiUrl: `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/ai/prompt`,
    apiKey,
  });
}
