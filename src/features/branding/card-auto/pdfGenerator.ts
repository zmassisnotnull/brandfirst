/**
 * 인쇄용 Print PDF 생성 엔진
 * - Bleed/Trim/Safe 영역 포함
 * - 실제 폰트 임베드
 * - 로고 SVG → PDF 변환
 * - QR 코드 임베드
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { CardDraft } from './types';
import QRCode from 'qrcode';

const MM_TO_PT = 72 / 25.4;

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

interface PDFGeneratorOptions {
  draft: CardDraft;
  logoSvgPath?: string;
  qrDataUrl?: string;
  logoFontUrl?: string;
  bodyFontUrl?: string;
}

/**
 * SVG Path를 PDF에 그리기 (간단한 path만 지원)
 * 실무에서는 svg-path-parser 같은 라이브러리 사용 권장
 */
function drawSimpleSvgPath(
  page: PDFPage,
  pathDataInput: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
) {
  const svgTagMatch = pathDataInput.match(/<path[^>]*d=["']([^"']+)["']/i);
  const pathData = svgTagMatch?.[1] ?? pathDataInput;

  try {
    const baseSize = 100;
    const scale = Math.max(0.01, Math.min(width, height) / baseSize);
    const drawW = baseSize * scale;
    const drawH = baseSize * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;

    page.drawSvgPath(pathData, {
      x: drawX,
      y: drawY,
      scale,
      color: rgb(color.r, color.g, color.b),
      borderWidth: 0,
    });
  } catch (error) {
    console.error('SVG path render error, using fallback rectangle:', error);
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(color.r, color.g, color.b),
    });
  }
}

/**
 * Hex color를 RGB 객체로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * QR 코드 생성
 */
async function generateQRDataUrl(content: string): Promise<string> {
  try {
    return await QRCode.toDataURL(content, {
      width: 512,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return '';
  }
}

/**
 * Print PDF 생성 (Bleed 포함)
 */
export async function generatePrintPdf(options: PDFGeneratorOptions): Promise<Uint8Array> {
  const { draft } = options;
  const { layout, theme, card_info } = draft;
  const { card_size_mm, elements } = layout;
  
  // PDF 문서 생성
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // 페이지 크기 (Bleed 포함)
  const pageW = mmToPt(card_size_mm.w + card_size_mm.bleed * 2);
  const pageH = mmToPt(card_size_mm.h + card_size_mm.bleed * 2);
  
  const page = pdfDoc.addPage([pageW, pageH]);
  
  // 배경색
  const bgColor = hexToRgb(theme.colors.bg);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
    color: rgb(bgColor.r, bgColor.g, bgColor.b),
  });
  
  let logoFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (options.logoFontUrl) {
    try {
      const logoFontBytes = await fetch(options.logoFontUrl).then((r) => r.arrayBuffer());
      logoFont = await pdfDoc.embedFont(logoFontBytes);
    } catch (error) {
      console.error('Failed to load logo font URL, using fallback font:', error);
    }
  }

  if (options.bodyFontUrl) {
    try {
      const bodyFontBytes = await fetch(options.bodyFontUrl).then((r) => r.arrayBuffer());
      bodyFont = await pdfDoc.embedFont(bodyFontBytes);
    } catch (error) {
      console.error('Failed to load body font URL, using fallback font:', error);
    }
  }
  
  // QR 코드 생성 (필요시)
  let qrImage = null;
  const qrElement = elements.find((e) => e.kind === 'qr');
  if (qrElement && card_info.domain) {
    const qrDataUrl = await generateQRDataUrl(`https://${card_info.domain}`);
    if (qrDataUrl) {
      const qrBytes = await fetch(qrDataUrl).then((r) => r.arrayBuffer());
      qrImage = await pdfDoc.embedPng(qrBytes);
    }
  }
  
  // Elements 렌더링
  for (const el of elements) {
    const x = mmToPt(el.x_mm);
    // PDF 좌표계는 bottom-left 기준이므로 Y축 반전
    const y = pageH - mmToPt(el.y_mm) - mmToPt(el.h_mm);
    const w = mmToPt(el.w_mm);
    const h = mmToPt(el.h_mm);
    
    if (el.kind === 'logo') {
      // 로고 렌더링 (SVG path 또는 placeholder)
      if (options.logoSvgPath) {
        const logoColor = hexToRgb(el.style?.color ?? theme.colors.accent);
        drawSimpleSvgPath(page, options.logoSvgPath, x, y, w, h, logoColor);
      } else {
        // Placeholder
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
      }
    } else if (el.kind === 'qr') {
      // QR 코드
      if (qrImage) {
        page.drawImage(qrImage, {
          x,
          y,
          width: w,
          height: h,
        });
      } else {
        // Placeholder
        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          color: rgb(0.9, 0.9, 0.9),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
        });
      }
    } else if (el.kind === 'text' && el.style?.lines) {
      // 텍스트 렌더링
      const font = el.style.font === 'logo' ? logoFont : bodyFont;
      const fontSize = el.style.sizePt ?? 10;
      const lineHeight = fontSize * 1.25;
      const textColor = hexToRgb(el.style.color ?? theme.colors.text);
      const align = el.style.align ?? 'left';
      
      for (let i = 0; i < el.style.lines.length; i++) {
        const line = el.style.lines[i];
        const textY = y + h - (i + 1) * lineHeight;
        
        let textX = x;
        if (align === 'center') {
          const textWidth = font.widthOfTextAtSize(line, fontSize);
          textX = x + (w - textWidth) / 2;
        } else if (align === 'right') {
          const textWidth = font.widthOfTextAtSize(line, fontSize);
          textX = x + w - textWidth;
        }
        
        page.drawText(line, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
      }
    }
  }
  
  // Trim marks (재단선 표시)
  const trimX = mmToPt(card_size_mm.bleed);
  const trimY = mmToPt(card_size_mm.bleed);
  const trimW = mmToPt(card_size_mm.w);
  const trimH = mmToPt(card_size_mm.h);
  
  // 재단선 (점선, 실무에서는 crop marks)
  page.drawRectangle({
    x: trimX,
    y: trimY,
    width: trimW,
    height: trimH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
    borderOpacity: 0.3,
  });
  
  // PDF 메타데이터
  pdfDoc.setTitle(`MyBrands.ai - ${card_info.name ?? 'Business Card'}`);
  pdfDoc.setProducer('MyBrands.ai');
  pdfDoc.setCreationDate(new Date());
  
  // PDF 바이트 생성
  const pdfBytes = await pdfDoc.save();
  
  return pdfBytes;
}

/**
 * PDF를 Blob URL로 변환 (미리보기용)
 */
export function pdfBytesToBlobUrl(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

/**
 * PDF 다운로드
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}
