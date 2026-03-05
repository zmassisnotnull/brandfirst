/**
 * 폰트 기반 로고 편집기 타입
 */

export interface LogoEditorState {
  text: string;
  fontId: string | null;
  fontSizePx: number;
  trackingEm: number;    // letter-spacing in em
  kerning: boolean;
  ligatures: boolean;
  
  // Transform
  rotate_deg: number;
  
  // Colors
  primaryColor: string;
  secondaryColors: string[];
}

export interface FontFace {
  id: string;
  family: string;
  style: 'normal' | 'italic' | 'oblique';
  weight: number;
  storage_path: string;
  url?: string; // signed URL for preview
}

export interface LogoRenderResult {
  svg_path_d: string;
  view_box: string;
  metrics: {
    bbox: { x1: number; y1: number; x2: number; y2: number };
    fontSizePx: number;
    trackingEm: number;
    kerning: boolean;
    ligatures: boolean;
  };
}

export interface LogoSpec {
  id: string;
  project_id: string;
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

export interface LogoAsset {
  id: string;
  logo_spec_id: string;
  svg_path_d: string;
  view_box: string;
  metrics: Record<string, any>;
  version: number;
  created_at: string;
}
