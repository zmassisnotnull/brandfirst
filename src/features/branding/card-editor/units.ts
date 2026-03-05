export const DEFAULT_DPI = 96;

// 1 inch = 25.4mm
export function mmToPx(mm: number, dpi = DEFAULT_DPI) {
  return (mm * dpi) / 25.4;
}

export function pxToMm(px: number, dpi = DEFAULT_DPI) {
  return (px * 25.4) / dpi;
}

// 드래그 중 소수점 난조 방지(0.1mm 단위로 반올림 등)
export function roundMm(value: number, step = 0.1) {
  return Math.round(value / step) * step;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
