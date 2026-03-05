/**
 * 명함 프롬프트 템플릿 (C1 ~ C3 + Refiner + QR)
 */

import type { PromptState, PromptResponse, BrandCard } from './prompt-contracts';

/**
 * C1) PDF 로고 업로드 분석 → 자동 톤/색/레이아웃 추천
 */
export interface LayoutDirection {
  variant: 'A' | 'B' | 'C';
  direction: string;
  why: string;
  layout_hint: string[];
}

export interface C1Response {
  auto_style_rules: {
    background_from_logo: boolean;
    text_color_by_logo_brightness: boolean;
    layout_fit_by_logo_shape: boolean;
  };
  directions: LayoutDirection[];
}

export function createC1Prompt(logoObservation: string, keywords: any): string {
  return `SYSTEM:
너는 명함 디자인 디렉터다. 출력은 JSON만.
로고 분석 요약을 기반으로:
- 배경/텍스트/포인트 컬러 적용 규칙
- 레이아웃 방향 3개(A/B/C)
- 텍스트 대비(로고 밝기 기반) 조정 가이드를 제안한다.

USER:
입력:
${JSON.stringify({
  logo_observation: logoObservation,
  brand_keywords: keywords,
}, null, 2)}

출력 형식:
{
  "auto_style_rules": {
    "background_from_logo": true,
    "text_color_by_logo_brightness": true,
    "layout_fit_by_logo_shape": true
  },
  "directions": [
    { "variant": "A", "direction": "클린/미니멀", "why": "", "layout_hint": [""] },
    { "variant": "B", "direction": "프리미엄/에디토리얼", "why": "", "layout_hint": [""] },
    { "variant": "C", "direction": "테크/그리드", "why": "", "layout_hint": [""] }
  ]
}

출력 (JSON만):`;
}

/**
 * C2) 정보 입력 정규화 (사용자 입력 또는 OCR 텍스트)
 */
export interface CardInfoField {
  value: string;
  confidence: number;
}

export interface C2Response {
  card_info: {
    name: CardInfoField;
    title: CardInfoField;
    company: CardInfoField;
    phone: CardInfoField;
    email: CardInfoField;
    address: CardInfoField;
    domain: CardInfoField;
  };
  questions_to_confirm: string[];
}

export function createC2Prompt(rawText: string, locale: string = 'ko-KR'): string {
  return `SYSTEM:
너는 명함 정보 정규화 엔진이다. 출력은 JSON만.
추정하지 말고 confidence로 표시한다.

USER:
입력:
${JSON.stringify({
  raw_text: rawText,
  locale,
}, null, 2)}

출력 형식:
{
  "card_info": {
    "name": { "value": "", "confidence": 0 },
    "title": { "value": "", "confidence": 0 },
    "company": { "value": "", "confidence": 0 },
    "phone": { "value": "", "confidence": 0 },
    "email": { "value": "", "confidence": 0 },
    "address": { "value": "", "confidence": 0 },
    "domain": { "value": "", "confidence": 0 }
  },
  "questions_to_confirm": ["확인 질문 1~3개"]
}

출력 (JSON만):`;
}

/**
 * C3) 시안 3종 레이아웃 생성 (명함 편집기용 JSON)
 */
export interface CardElement {
  id: string;
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  align: 'left' | 'center' | 'right';
}

export interface CardLayout {
  variant: 'A' | 'B' | 'C';
  grid: {
    columns: number;
    gutter_mm: number;
    margin_mm: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  elements: CardElement[];
  typography: {
    sizes_pt: {
      name: number;
      meta: number;
      body: number;
    };
    line_height: {
      body: number;
    };
  };
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
}

export interface C3Response {
  layouts: CardLayout[];
  preflight: string[];
}

export function createC3Prompt(
  logoShape: 'wide' | 'square' | 'tall',
  logoColors: { primary: string; secondary: string[] },
  cardInfo: any,
  directionPick: 'A' | 'B' | 'C'
): string {
  return `SYSTEM:
너는 인쇄용 명함 편집 디자이너다. 출력은 JSON만.
규칙:
- 90x50mm, bleed 3mm, safe zone 4mm
- 최소 글자 7.5pt 이상 권장
- 시안 A/B/C는 정보 위계가 달라야 한다(이름/회사/연락처 강조 축 다르게)

USER:
입력:
${JSON.stringify({
  card_size_mm: { w: 90, h: 50, bleed: 3, safe: 4 },
  logo_shape: logoShape,
  logo_colors: logoColors,
  card_info: cardInfo,
  direction_pick: directionPick,
}, null, 2)}

출력 형식:
{
  "layouts": [
    {
      "variant": "A",
      "grid": { "columns": 6, "gutter_mm": 2.5, "margin_mm": { "top": 6, "right": 6, "bottom": 6, "left": 6 } },
      "elements": [
        { "id": "logo", "x_mm": 6, "y_mm": 6, "w_mm": 28, "h_mm": 10, "align": "left" },
        { "id": "name", "x_mm": 6, "y_mm": 22, "w_mm": 78, "h_mm": 6, "align": "left" },
        { "id": "title_company", "x_mm": 6, "y_mm": 29, "w_mm": 78, "h_mm": 5, "align": "left" },
        { "id": "contact", "x_mm": 6, "y_mm": 36, "w_mm": 78, "h_mm": 12, "align": "left" }
      ],
      "typography": { "sizes_pt": { "name": 11, "meta": 8.5, "body": 8 }, "line_height": { "body": 1.25 } },
      "colors": { "bg": "#FFFFFF", "text": "#111111", "accent": "#..." }
    },
    { "variant": "B", "grid": {}, "elements": [], "typography": {}, "colors": {} },
    { "variant": "C", "grid": {}, "elements": [], "typography": {}, "colors": {} }
  ],
  "preflight": ["bleed 포함", "safe zone 준수", "가독성(대비)", "오탈자", "QR 스캔 테스트(있을 경우)"]
}

출력 (JSON만):`;
}

/**
 * C-Refiner) 모바일 명함 촬영 → OCR → 정보 확인/수정 → "편집기 패치" 생성
 */
export interface EditorPatch {
  action: 'resize' | 'move' | 'align' | 'set_color' | 'set_font';
  target: 'logo' | 'name' | 'contact' | 'title_company';
  value: Record<string, any>;
}

export interface CRefinerResponse {
  editor_patch: EditorPatch[];
  ui: {
    go_to_editor: boolean;
    next: string;
  };
}

export function createCRefinerPrompt(
  ocrText: string,
  cardInfo: any,
  userRequests: string[]
): string {
  return `SYSTEM:
너는 명함 리파이너다. 출력은 JSON만.
목표:
- OCR 추출 결과 기반으로 '편집기에서 바로 적용할 패치' 생성
- 사용자가 요구한 수정사항을 반영

USER:
입력:
${JSON.stringify({
  ocr_text: ocrText,
  card_info: cardInfo,
  user_requests: userRequests,
}, null, 2)}

출력 형식:
{
  "editor_patch": [
    { "action": "resize", "target": "logo", "value": {} }
  ],
  "ui": { "go_to_editor": true, "next": "최종 편집" }
}

출력 (JSON만):`;
}

/**
 * QR1) 디지털 명함 페이지 스펙 생성
 */
export interface DigitalCardSection {
  id: string;
  fields: string[];
}

export interface DigitalCardButton {
  type: 'call' | 'email' | 'save_vcard' | 'website';
}

export interface QR1Response {
  digital_card: {
    title: string;
    subtitle: string;
    sections: DigitalCardSection[];
    theme: {
      bg: string;
      text: string;
      accent: string;
    };
    share: {
      qr_target_url: string;
      slug_suggestion: string;
    };
  };
}

export function createQR1Prompt(
  cardInfo: BrandCard['info'],
  brandName: string,
  logoTheme: { primary: string; secondary: string[] },
  domain: string
): string {
  return `SYSTEM:
너는 QR 디지털 명함 페이지 기획자다. 출력은 JSON만.
목표: 웹 페이지 구성(섹션), 표시 데이터, 톤앤매너, 공유/QR 연결 정보를 만든다.

USER:
입력:
${JSON.stringify({
  card_info: cardInfo,
  brand_name: brandName,
  logo_theme: logoTheme,
  domain,
}, null, 2)}

출력 형식:
{
  "digital_card": {
    "title": "",
    "subtitle": "",
    "sections": [
      { "id": "profile", "fields": ["name", "title", "company"] },
      { "id": "contacts", "fields": ["phone", "email", "domain"] },
      { "id": "actions", "buttons": [{ "type": "call" }, { "type": "email" }, { "type": "save_vcard" }] }
    ],
    "theme": { "bg": "#FFFFFF", "text": "#111111", "accent": "#..." },
    "share": { "qr_target_url": "", "slug_suggestion": "" }
  }
}

출력 (JSON만):`;
}
