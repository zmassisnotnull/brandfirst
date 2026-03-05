/**
 * 폰트 메트릭 측정 (Canvas 기반)
 */

const PT_TO_PX = 96 / 72;

export class FontMeasurer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(private fontFamily: string) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  /**
   * 텍스트 너비 측정 (pt 단위)
   */
  widthPt(text: string, sizePt: number): number {
    const sizePx = sizePt * PT_TO_PX;
    this.ctx.font = `${sizePx}px "${this.fontFamily}"`;
    const metrics = this.ctx.measureText(text);
    return metrics.width / PT_TO_PX;
  }
  
  /**
   * 텍스트를 최대 너비에 맞게 줄바꿈
   */
  wrapTextToWidth(args: {
    text: string;
    maxWidthPt: number;
    fontSizePt: number;
  }): string[] {
    const { text, maxWidthPt, fontSizePt } = args;
    
    // 공백이 있으면 단어 단위, 없으면 글자 단위로 쪼개기
    const hasSpaces = /\s/.test(text);
    const tokens = hasSpaces ? text.split(/\s+/) : [...text];
    
    const lines: string[] = [];
    let currentLine = '';
    
    const pushLine = () => {
      if (currentLine.trim().length) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
    };
    
    for (const token of tokens) {
      const candidate = currentLine
        ? (hasSpaces ? `${currentLine} ${token}` : `${currentLine}${token}`)
        : token;
      
      const width = this.widthPt(candidate, fontSizePt);
      
      if (width <= maxWidthPt) {
        currentLine = candidate;
      } else {
        if (!currentLine) {
          // 한 토큰이 너무 길면 강제로 넣음
          lines.push(candidate);
          currentLine = '';
        } else {
          pushLine();
          currentLine = token;
        }
      }
    }
    
    pushLine();
    
    return lines.length > 0 ? lines : [''];
  }
  
  /**
   * 텍스트 블록을 박스에 피팅 (자동 폰트 크기 조정)
   */
  fitTextBlock(args: {
    textLines: string[];
    maxWmm: number;
    maxHmm: number;
    maxSizePt: number;
    minSizePt: number;
    lineHeight: number;
  }): {
    ok: boolean;
    fontSizePt: number;
    lines: string[];
    totalHmm: number;
  } {
    const { textLines, maxWmm, maxHmm, maxSizePt, minSizePt, lineHeight } = args;
    
    const maxWpt = this.mmToPt(maxWmm);
    const maxHpt = this.mmToPt(maxHmm);
    
    // 폰트 크기를 줄여가며 시도
    for (let sizePt = maxSizePt; sizePt >= minSizePt; sizePt -= 0.5) {
      const wrapped: string[] = [];
      
      for (const rawLine of textLines) {
        if (!rawLine || rawLine.trim().length === 0) continue;
        
        const lines = this.wrapTextToWidth({
          text: rawLine,
          maxWidthPt: maxWpt,
          fontSizePt: sizePt,
        });
        
        wrapped.push(...lines);
      }
      
      const totalHpt = wrapped.length * sizePt * lineHeight;
      const totalHmm = this.ptToMm(totalHpt);
      
      if (totalHpt <= maxHpt) {
        return {
          ok: true,
          fontSizePt: sizePt,
          lines: wrapped,
          totalHmm,
        };
      }
    }
    
    // 최소 크기에서도 안 들어감
    return {
      ok: false,
      fontSizePt: minSizePt,
      lines: [],
      totalHmm: maxHmm + 1,
    };
  }
  
  private mmToPt(mm: number): number {
    return mm * 72 / 25.4;
  }
  
  private ptToMm(pt: number): number {
    return pt * 25.4 / 72;
  }
}

/**
 * 폰트 로드 대기
 */
export async function ensureFontLoaded(fontFamily: string): Promise<void> {
  if (!document.fonts) return;
  
  try {
    await document.fonts.load(`12px "${fontFamily}"`);
    await document.fonts.load(`16px "${fontFamily}"`);
    await document.fonts.ready;
  } catch (error) {
    console.warn('Font loading check failed:', error);
  }
}
