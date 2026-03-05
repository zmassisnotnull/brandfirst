/**
 * MM (밀리미터) 단위 변환 유틸리티
 * 명함 제작의 모든 레이아웃은 mm 기준
 */

// mm → px (화면 표시용, 기본 96 DPI)
export const mmToPx = (mm: number, dpi: number = 96): number => {
  return (mm * dpi) / 25.4;
};

// px → mm
export const pxToMm = (px: number, dpi: number = 96): number => {
  return (px * 25.4) / dpi;
};

// mm → pt (PDF용, 72 DPI)
export const mmToPt = (mm: number): number => {
  return (mm * 72) / 25.4;
};

// pt → mm
export const ptToMm = (pt: number): number => {
  return (pt * 25.4) / 72;
};

// mm 좌표를 PDF 좌표로 변환 (좌상단 → 좌하단 기준)
export interface MmRect {
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
}

export interface PdfRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function mmTopLeftToPdfPt(
  rect: MmRect,
  pageWmm: number,
  pageHmm: number
): PdfRect {
  const x = mmToPt(rect.xMm);
  const yTop = mmToPt(rect.yMm);
  const h = mmToPt(rect.hMm);
  const pageH = mmToPt(pageHmm);
  
  // PDF는 좌하단이 원점이므로 Y축 반전
  const y = pageH - yTop - h;
  
  return {
    x,
    y,
    w: mmToPt(rect.wMm),
    h,
  };
}

// 명함 표준 사이즈
export const CARD_SIZES = {
  standard: {
    w: 90,
    h: 50,
    bleed: 3,
    safe: 4,
  },
  nameCard: {
    w: 86,
    h: 52,
    bleed: 3,
    safe: 4,
  },
} as const;

// 화면 표시용 스케일 계산 (명함을 특정 너비로 표시)
export function calculateCardScale(
  cardWmm: number,
  targetWidthPx: number,
  dpi: number = 96
): number {
  const cardWidthPx = mmToPx(cardWmm, dpi);
  return targetWidthPx / cardWidthPx;
}

// Safe zone 체크
export function isInSafeZone(
  element: MmRect,
  cardSize: typeof CARD_SIZES.standard
): boolean {
  const safeLeft = cardSize.bleed + cardSize.safe;
  const safeRight = cardSize.w + cardSize.bleed - cardSize.safe;
  const safeTop = cardSize.bleed + cardSize.safe;
  const safeBottom = cardSize.h + cardSize.bleed - cardSize.safe;

  return (
    element.xMm >= safeLeft &&
    element.xMm + element.wMm <= safeRight &&
    element.yMm >= safeTop &&
    element.yMm + element.hMm <= safeBottom
  );
}

// Bleed 영역 포함한 전체 페이지 크기
export function getPageSize(cardSize: typeof CARD_SIZES.standard) {
  return {
    w: cardSize.w + cardSize.bleed * 2,
    h: cardSize.h + cardSize.bleed * 2,
  };
}
