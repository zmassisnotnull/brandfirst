/**
 * 폰트 관리 라이브러리
 * 
 * 웹에서 폰트를 안정적으로 로드/측정/렌더링하는 시스템
 */

// 핵심 유틸리티
export {
  ensureFontReady,
  ensureMultipleFontsReady,
  ensureFontReadyWithTimeout,
  isFontReady,
} from './useFontReady';

// React Hooks
export {
  useFontLoading,
  useSingleFontLoading,
  useConditionalFontLoading,
} from './useFontLoading';

// 타입 & 헬퍼
export type {
  FontFormat,
  FontStyle,
  FontMetadata,
  FontFile,
  Font,
  FontFaceOptions,
} from './types';

export {
  generateFontFaceCSS,
  setFontFamilyVariable,
  createFontFallbackChain,
} from './types';
