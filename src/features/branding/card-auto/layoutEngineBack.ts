/**
 * 뒷면 레이아웃 엔진
 * - 로고 + 도메인/웹사이트만 (심플)
 * - 실패율 0에 가깝게
 */

import type {
  CardSizeMm,
  CardElement,
  CardInfo,
  CardDraft,
  CardLayout,
  CardTheme,
} from './types';
import { DEFAULT_CARD_SIZE } from './types';
import { FontMeasurer } from './fontMetrics';
import { preflightCheck } from './layoutEngine';

/**
 * Safe 영역 계산
 */
function safeRect(card: CardSizeMm) {
  const x = card.bleed + card.safe;
  const y = card.bleed + card.safe;
  const w = card.w - card.safe * 2;
  const h = card.h - card.safe * 2;
  return { x, y, w, h };
}

/**
 * 뒷면 템플릿 3종 (A/B/C)
 * - 로고 중심 + 도메인/웹사이트
 * - 최소한의 정보로 실패율 최소화
 */
function buildBackTemplates(args: {
  card: CardSizeMm;
  logoAspect: number;
}): Record<'A' | 'B' | 'C', CardElement[]> {
  const safe = safeRect(args.card);
  
  // 로고 크기 (뒷면은 더 크게)
  const logoW = 45;
  const logoH = Math.max(12, Math.min(20, logoW / Math.max(0.5, args.logoAspect)));
  
  // Template A: 중앙 로고 + 하단 도메인
  const A: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x + (safe.w - logoW) / 2,
      y_mm: safe.y + (safe.h - logoH) / 2 - 3,
      w_mm: logoW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
    {
      id: 'domain',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + safe.h - 8,
      w_mm: safe.w,
      h_mm: 6,
    },
  ];
  
  // Template B: 상단 로고 + 중앙 도메인 (세로 배치)
  const B: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x + (safe.w - logoW) / 2,
      y_mm: safe.y + 3,
      w_mm: logoW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
    {
      id: 'domain',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 8,
      w_mm: safe.w,
      h_mm: 8,
    },
  ];
  
  // Template C: 좌측 로고 + 우측 도메인
  const leftW = Math.max(35, safe.w * 0.5);
  const rightW = safe.w - leftW - 4;
  
  const C: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x,
      y_mm: safe.y + (safe.h - logoH) / 2,
      w_mm: leftW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
    {
      id: 'domain',
      kind: 'text',
      x_mm: safe.x + leftW + 4,
      y_mm: safe.y,
      w_mm: rightW,
      h_mm: safe.h,
    },
  ];
  
  return { A, B, C };
}

/**
 * 뒷면 텍스트 콘텐츠 생성
 * - 도메인 우선, 없으면 이메일 도메인, 없으면 회사명
 */
function buildBackContent(info: CardInfo): { domain: string } {
  let domain = info.domain || '';
  
  // 도메인이 없으면 이메일에서 추출
  if (!domain && info.email) {
    const match = info.email.match(/@(.+)$/);
    if (match) {
      domain = match[1];
    }
  }
  
  // 그래도 없으면 회사명
  if (!domain && info.company) {
    domain = info.company;
  }
  
  // 최종 fallback
  if (!domain) {
    domain = 'mybrand.ai';
  }
  
  return { domain };
}

/**
 * 뒷면 텍스트 렌더링 (도메인만)
 */
function renderBackText(
  elements: CardElement[],
  content: { domain: string },
  logoFontFamily: string,
  bodyFontFamily: string
): CardElement[] {
  const logoMeasurer = new FontMeasurer(logoFontFamily);
  const bodyMeasurer = new FontMeasurer(bodyFontFamily);
  
  const rendered = elements.map((el) => {
    if (el.id !== 'domain' || el.kind !== 'text') {
      return el;
    }
    
    // 도메인은 body font 사용
    const fitted = bodyMeasurer.fitTextBlock({
      textLines: [content.domain],
      maxWmm: el.w_mm,
      maxHmm: el.h_mm,
      maxSizePt: 11,
      minSizePt: 8,
      lineHeight: 1.3,
    });
    
    return {
      ...el,
      style: {
        ...el.style,
        font: 'body' as const,
        sizePt: fitted.sizePt,
        lines: fitted.lines,
        align: 'center' as const,
      },
    };
  });
  
  return rendered;
}

/**
 * 뒷면 3개 시안 자동 생성 (무조건 성공)
 */
export async function autoGenerateBack3(params: {
  cardInfo: CardInfo;
  logoAspect: number;
  logoFontFamily: string;
  bodyFontFamily: string;
  card?: CardSizeMm;
  theme?: CardTheme;
}): Promise<CardDraft[]> {
  const card = params.card ?? DEFAULT_CARD_SIZE;
  const theme = params.theme ?? {
    colors: {
      bg: '#FFFFFF',
      text: '#111111',
      accent: '#0066FF',
    },
  };
  
  const templates = buildBackTemplates({
    card,
    logoAspect: params.logoAspect,
  });
  
  const content = buildBackContent(params.cardInfo);
  
  const variants: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
  const drafts: CardDraft[] = [];
  
  for (const variant of variants) {
    const elements = renderBackText(
      templates[variant],
      content,
      params.logoFontFamily,
      params.bodyFontFamily
    );
    
    const layout: CardLayout = {
      card_size_mm: card,
      elements,
    };
    
    const preflight = preflightCheck(card, elements);
    
    drafts.push({
      variant,
      side: 'back',
      layout,
      theme,
      card_info: params.cardInfo,
      omitted_fields: [], // 뒷면은 필드 생략 없음
      preflight,
    });
  }
  
  return drafts;
}
