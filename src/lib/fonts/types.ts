/**
 * 폰트 관련 타입 정의
 */

/**
 * 폰트 파일 형식
 */
export type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf';

/**
 * 폰트 스타일
 */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/**
 * 폰트 메타데이터
 */
export interface FontMetadata {
  id: string;
  name: string;
  family: string;
  postscriptName?: string;
  version: string; // 버전 번호 또는 해시
  weights: number[]; // 사용 가능한 weight 목록 (예: [400, 700])
  styles: FontStyle[];
  isVariable: boolean; // Variable font 여부
  variableAxes?: string[]; // Variable font의 경우 axes (예: ['wght', 'wdth'])
  createdAt: string;
  updatedAt: string;
}

/**
 * 폰트 파일 정보
 */
export interface FontFile {
  format: FontFormat;
  url: string; // Storage URL (버전 포함)
  size: number; // 파일 크기 (bytes)
  weight?: number; // static font의 경우
  style?: FontStyle;
}

/**
 * 폰트 전체 정보 (DB 저장용)
 */
export interface Font {
  metadata: FontMetadata;
  originalFile: FontFile; // 원본 (OTF/TTF)
  webFiles: FontFile[]; // 웹용 (WOFF2)
}

/**
 * @font-face CSS 생성 옵션
 */
export interface FontFaceOptions {
  fontFamily: string;
  src: string; // URL
  format: FontFormat;
  fontWeight?: string | number; // Variable font면 "100 900", static이면 400
  fontStyle?: FontStyle;
  fontDisplay?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  unicodeRange?: string; // 서브셋팅 (예: "U+0041-005A" for A-Z)
}

/**
 * @font-face CSS 문자열 생성
 */
export function generateFontFaceCSS(options: FontFaceOptions): string {
  const {
    fontFamily,
    src,
    format,
    fontWeight = 400,
    fontStyle = 'normal',
    fontDisplay = 'swap',
    unicodeRange,
  } = options;

  return `
@font-face {
  font-family: "${fontFamily}";
  src: url("${src}") format("${format}");
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: ${fontDisplay};
  ${unicodeRange ? `unicode-range: ${unicodeRange};` : ''}
}`.trim();
}

/**
 * CSS 변수로 폰트 패밀리 설정
 */
export function setFontFamilyVariable(name: string, fontFamily: string): void {
  document.documentElement.style.setProperty(`--font-${name}`, fontFamily);
}

/**
 * 폰트 폴백 체인 생성
 */
export function createFontFallbackChain(
  primaryFont: string,
  fallbacks: string[] = ['system-ui', '-apple-system', '"Segoe UI"', 'Arial', 'sans-serif']
): string {
  return [primaryFont, ...fallbacks].join(', ');
}
