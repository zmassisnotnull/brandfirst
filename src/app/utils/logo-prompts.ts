/**
 * 로고 프롬프트 템플릿 (L1 ~ L3 + Refiner)
 */

import type { PromptState, PromptResponse } from './prompt-contracts';

/**
 * L1) 컬러 9종 제시 + (1선택 + 2자동추천)
 */
export interface ColorOption {
  name: string;
  hex: string;
  fit: string;
}

export interface L1Response {
  palette9: ColorOption[];
  auto_recommend: {
    primary: string;
    secondary: string[];
    reason: string;
  };
  ui: {
    instruction: string;
  };
}

export function createL1Prompt(state: PromptState): string {
  return `SYSTEM:
너는 브랜드 컬러 디렉터다. 출력은 JSON만.
서비스분야 기반으로 '선호 컬러 9종'을 제시하고,
사용자가 1개 선택하면 2개는 자동 추천될 수 있게 구성한다.

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  keywords: state.brand.keywords,
  mode: state.mode,
}, null, 2)}

출력 형식:
{
  "palette9": [
    { "name": "", "hex": "#", "fit": "" }
  ],
  "auto_recommend": { "primary": "#...", "secondary": ["#...", "#..."], "reason": "" },
  "ui": { "instruction": "컬러 1개 선택 시 2개는 자동 추천됩니다." }
}

출력 (JSON만):`;
}

/**
 * L2) 스타일 제시 (Starter=3종 / Pro=6종) + 자동추천
 */
export interface StyleOption {
  style: string;
  why: string;
  visual_cues: string[];
}

export interface L2Response {
  style_options: StyleOption[];
  auto_recommend: {
    primary: string;
    secondary: string[];
    reason: string;
  };
}

export function createL2Prompt(state: PromptState): string {
  const styleCount = state.mode === 'professional' ? 6 : 3;
  
  return `SYSTEM:
너는 로고 스타일 전략가다. 출력은 JSON만.
mode에 따라 스타일 후보 수를 다르게 제공한다:
- starter: 3종(예: 모던/친근/화려)
- professional: 6종(예: 미니멀/화려/창의/고급/기술/클래식 등)
사용자가 1개 선택하면 2개를 자동 추천할 수 있게 한다.

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  logo_text: state.brand.logo.text,
  mode: state.mode,
}, null, 2)}

출력 형식:
{
  "style_options": [
    { "style": "", "why": "", "visual_cues": [""] }
  ],
  "auto_recommend": { "primary": "", "secondary": ["", ""], "reason": "" }
}

출력 (JSON만):`;
}

/**
 * L3) 로고 "시안 3종" 생성용 Prompt Pack
 * (이미지 생성 모델에 전달할 프롬프트 생성)
 */
export interface LogoPromptVariant {
  variant: 'A' | 'B' | 'C';
  concept: string;
  image_prompt: string;
  negative_prompt: string[];
}

export interface L3Response {
  prompt_pack: LogoPromptVariant[];
  ui: {
    next: string;
  };
  print_note: string;
}

export function createL3Prompt(state: PromptState): string {
  return `SYSTEM:
너는 로고타입 프롬프트 엔지니어다. 출력은 JSON만.
규칙:
- logotype 중심(텍스트 기반)
- 흰 배경, 플랫, 선명한 엣지(벡터 느낌), 목업 금지
- A/B/C는 서로 다른 조형 포인트

USER:
입력:
${JSON.stringify({
  logo_text: state.brand.logo.text,
  service_domain: state.brand.service_domain,
  colors: state.brand.logo.colors,
  style_pick: state.brand.logo.style_pick,
  keywords: state.brand.keywords,
}, null, 2)}

출력 형식:
{
  "prompt_pack": [
    {
      "variant": "A",
      "concept": "",
      "image_prompt": "",
      "negative_prompt": ["mockup", "photo", "blurry", "3D", "complex gradient", "watermark"]
    },
    { "variant": "B", "concept": "", "image_prompt": "", "negative_prompt": [...] },
    { "variant": "C", "concept": "", "image_prompt": "", "negative_prompt": [...] }
  ],
  "ui": { "next": "로고 시안 3종을 생성합니다." },
  "print_note": "최종 로고는 폰트 텍스트가 아닌 SVG path로 저장 권장"
}

출력 (JSON만):`;
}

/**
 * L-Refiner) 모바일 촬영/PDF 업로드 로고 분석 → 수정지시
 */
export interface LRefinerResponse {
  diagnosis: {
    strengths: string[];
    issues: string[];
  };
  fix_instructions: string[];
  next_prompt: {
    image_prompt: string;
    negative_prompt: string[];
  };
  print_note: string;
}

export function createLRefinerPrompt(
  uploadType: 'photo' | 'pdf',
  observation: string,
  userRequests: string[]
): string {
  return `SYSTEM:
너는 로고 QA/리파이너다. 출력은 JSON만.
업로드 분석 요약을 바탕으로 문제 진단 → 수정지시 → 재생성 프롬프트를 만든다.

USER:
입력:
${JSON.stringify({
  upload_type: uploadType,
  observation,
  user_requests: userRequests,
}, null, 2)}

출력 형식:
{
  "diagnosis": { "strengths": [""], "issues": [""] },
  "fix_instructions": ["구체 지시 8개"],
  "next_prompt": {
    "image_prompt": "(수정 반영)",
    "negative_prompt": ["mockup", "photo", "blurry", "3D", "complex gradient"]
  },
  "print_note": "확정 로고는 SVG path로 고정 권장"
}

출력 (JSON만):`;
}
