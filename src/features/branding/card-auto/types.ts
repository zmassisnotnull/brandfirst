/**
 * 자동 명함 시안 생성 타입
 */

export interface CardInfo {
  name?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  domain?: string;
}

export interface CardSizeMm {
  w: number;
  h: number;
  bleed: number;
  safe: number;
}

export interface CardElement {
  id: string;
  kind: 'logo' | 'text' | 'qr';
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  style?: {
    lockAspect?: boolean;
    font?: 'logo' | 'body';
    sizePt?: number;
    lines?: string[];
    align?: 'left' | 'center' | 'right';
    color?: string;
  };
}

export interface CardLayout {
  card_size_mm: CardSizeMm;
  elements: CardElement[];
}

export interface CardTheme {
  colors: {
    bg: string;
    text: string;
    accent: string;
  };
}

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CardDraft {
  variant: 'A' | 'B' | 'C';
  side: 'front' | 'back'; // ✅ 추가
  layout: CardLayout;
  theme: CardTheme;
  card_info: CardInfo;
  omitted_fields: string[];
  preflight: PreflightResult;
}

export interface AutoGenerateParams {
  cardInfo: CardInfo;
  qrEnabled: boolean;
  logoAspect: number;
  card?: CardSizeMm;
  theme?: CardTheme;
  logoSvgPath?: string;
  qrDataUrl?: string;
  logoFontFamily?: string; // ✅ 추가
  bodyFontFamily?: string; // ✅ 추가
}

export const DEFAULT_CARD_SIZE: CardSizeMm = {
  w: 90,
  h: 50,
  bleed: 3,
  safe: 4,
};

export const MIN_BODY_PT = 7.5;
export const MIN_QR_MM = 18;
export const MIN_LOGO_H_MM = 8;