/**
 * 로고 편집기 유틸리티
 */

import type { LogoEditorState, FontFace } from './logoEditor.types';

// 기본 로고 상태
export function getDefaultLogoState(): LogoEditorState {
  return {
    text: 'MyBrand',
    fontId: null,
    fontSizePx: 160,
    trackingEm: 0,
    kerning: true,
    ligatures: false,
    rotate_deg: 0,
    primaryColor: '#111111',
    secondaryColors: [],
  };
}

// CSS font-family 생성 (폰트 로드용)
export function buildFontFamily(font: FontFace): string {
  return `"${font.family}"`;
}

// @font-face CSS 생성 (동적 폰트 로드)
export function buildFontFaceCSS(font: FontFace, url: string): string {
  return `
    @font-face {
      font-family: "${font.family}";
      src: url("${url}") format("${getFontFormat(font.storage_path)}");
      font-weight: ${font.weight};
      font-style: ${font.style};
      font-display: swap;
    }
  `;
}

function getFontFormat(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'woff2': return 'woff2';
    case 'woff': return 'woff';
    case 'ttf': return 'truetype';
    case 'otf': return 'opentype';
    default: return 'opentype';
  }
}

// SVG 문자열 생성 (미리보기용)
export function createPreviewSVG(params: {
  pathD: string;
  viewBox: string;
  color: string;
  width?: number;
  height?: number;
}): string {
  const { pathD, viewBox, color, width, height } = params;
  const sizeAttrs = width && height ? `width="${width}" height="${height}"` : '';
  
  return `
    <svg ${sizeAttrs} viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathD}" fill="${color}" />
    </svg>
  `;
}

// HEX 색상 유효성 검사
export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

// 자간 em 값을 CSS letter-spacing으로 변환
export function trackingEmToCss(em: number, fontSizePx: number): string {
  return `${em * fontSizePx}px`;
}

// 로고 텍스트 유효성 검사
export function validateLogoText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: '로고 텍스트를 입력하세요.' };
  }
  
  if (text.length > 30) {
    return { valid: false, error: '텍스트는 30자 이하로 입력하세요.' };
  }
  
  return { valid: true };
}

// 권장 폰트 크기 범위
export const FONT_SIZE_RANGE = {
  min: 80,
  max: 320,
  default: 160,
  step: 10,
} as const;

// 권장 자간 범위 (em)
export const TRACKING_RANGE = {
  min: -0.1,
  max: 0.3,
  default: 0,
  step: 0.01,
} as const;
