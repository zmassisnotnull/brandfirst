/**
 * Typography System Types
 * 폰트 기반 로고/명함 일관성 시스템
 */

// 폰트 메타데이터
export interface FontMetadata {
  id: string;
  user_id: string;
  family: string;
  style: 'normal' | 'italic' | 'oblique';
  weight: number;
  storage_path: string;
  mime: string;
  sha256?: string;
  embedding_allowed: boolean;
  created_at: string;
}

// Typography Kit (로고 폰트 + 본문 폰트 세트)
export interface TypographyKit {
  id: string;
  project_id: string;
  user_id: string;
  logo_font_id: string;
  body_font_id: string;
  scale_json: {
    logo_size_px?: number;
    name_size_pt?: number;
    body_size_pt?: number;
    line_height?: number;
    tracking_default_em?: number;
  };
  created_at: string;
}

// 로고 스펙 (편집 가능한 원본)
export interface LogoSpec {
  id: string;
  project_id: string;
  user_id: string;
  typography_kit_id?: string;
  text: string;
  font_id: string;
  font_size_px: number;
  tracking_em: number;
  kerning: boolean;
  ligatures: boolean;
  colors: {
    primary: string;
    secondary: string[];
  };
  created_at: string;
}

// 로고 자산 (SVG Path 마스터)
export interface LogoAsset {
  id: string;
  logo_spec_id: string;
  user_id: string;
  svg_path_d: string;
  view_box: string;
  metrics: {
    bbox?: { x1: number; y1: number; x2: number; y2: number };
    fontSizePx?: number;
    trackingEm?: number;
    kerning?: boolean;
    ligatures?: boolean;
  };
  version: number;
  created_at: string;
}

// 명함 문서
export interface CardDoc {
  id: string;
  project_id: string;
  user_id: string;
  logo_asset_id?: string;
  typography_kit_id?: string;
  card_info: {
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
    address?: string;
    domain?: string;
  };
  layout: {
    card_size_mm: { w: number; h: number; bleed: number; safe: number };
    elements: CardElement[];
  };
  theme: {
    colors: {
      bg: string;
      text: string;
      accent: string;
    };
  };
  version: number;
  created_at: string;
}

export interface CardElement {
  id: string;
  type: 'logo' | 'text' | 'qr' | 'decoration';
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  align?: 'left' | 'center' | 'right';
  content?: string;
  font_size_pt?: number;
  font_weight?: number;
  line_height?: number;
}

// PDF 출력
export type ExportKind = 'proof' | 'print';

export interface Export {
  id: string;
  project_id: string;
  user_id: string;
  card_doc_id: string;
  kind: ExportKind;
  storage_path: string;
  checksum?: string;
  created_at: string;
}

// 출고 상태
export type FulfillmentStatus =
  | 'APPROVED_PROOF'
  | 'PDF_LOCKED'
  | 'PRINT_QUEUED'
  | 'PRINTING'
  | 'QC_HOLD'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED';

export interface FulfillmentJob {
  id: string;
  export_id: string;
  user_id: string;
  status: FulfillmentStatus;
  print_options: {
    quantity?: number;
    paper?: string;
    coating?: string;
  };
  shipping: {
    address?: string;
    carrier?: string;
    tracking?: string;
  };
  created_at: string;
  updated_at: string;
}

// 디지털 명함
export interface DigitalCard {
  id: string;
  project_id: string;
  user_id: string;
  slug: string;
  data: {
    title: string;
    subtitle: string;
    card_info: CardDoc['card_info'];
    theme: CardDoc['theme'];
  };
  published: boolean;
  published_at?: string;
  created_at: string;
}
