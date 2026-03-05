/**
 * 제약 기반 레이아웃 엔진
 * - 템플릿 기반 안전한 3가지 레이아웃
 * - Preflight 검사 (겹침/잘림/safe zone)
 * - 자동 수정 (폰트 조정/필드 생략)
 */

import type {
  CardSizeMm,
  CardElement,
  CardInfo,
  CardDraft,
  PreflightResult,
  CardLayout,
  CardTheme,
} from './types';
import { DEFAULT_CARD_SIZE, MIN_BODY_PT, MIN_QR_MM } from './types';
import { FontMeasurer } from './fontMetrics';

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
 * 두 요소가 겹치는지 확인
 */
function rectsOverlap(a: CardElement, b: CardElement): boolean {
  const ax2 = a.x_mm + a.w_mm;
  const ay2 = a.y_mm + a.h_mm;
  const bx2 = b.x_mm + b.w_mm;
  const by2 = b.y_mm + b.h_mm;
  
  return !(ax2 <= b.x_mm || bx2 <= a.x_mm || ay2 <= b.y_mm || by2 <= a.y_mm);
}

/**
 * 요소가 Safe Zone 안에 있는지 확인
 */
function insideSafe(card: CardSizeMm, element: CardElement): boolean {
  const safe = safeRect(card);
  
  return (
    element.x_mm >= safe.x &&
    element.y_mm >= safe.y &&
    element.x_mm + element.w_mm <= safe.x + safe.w &&
    element.y_mm + element.h_mm <= safe.y + safe.h
  );
}

/**
 * Preflight 검사
 */
export function preflightCheck(card: CardSizeMm, elements: CardElement[]): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Safe zone 체크
  for (const el of elements) {
    if (!insideSafe(card, el)) {
      errors.push(`${el.id}가 안전 영역 밖에 있습니다`);
    }
    
    // QR 최소 크기
    if (el.kind === 'qr' && (el.w_mm < MIN_QR_MM || el.h_mm < MIN_QR_MM)) {
      errors.push(`QR 코드가 너무 작습니다 (최소 ${MIN_QR_MM}mm)`);
    }
    
    // 텍스트 최소 폰트
    if (el.kind === 'text' && el.style?.sizePt && el.style.sizePt < MIN_BODY_PT) {
      warnings.push(`${el.id} 폰트 크기가 권장 크기(${MIN_BODY_PT}pt)보다 작습니다`);
    }
  }
  
  // 겹침 체크
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (rectsOverlap(elements[i], elements[j])) {
        errors.push(`${elements[i].id}와 ${elements[j].id}가 겹칩니다`);
      }
    }
  }
  
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 우선순위에 따라 필드 생략
 */
function omitByPriority(info: CardInfo, omitFields: string[]): CardInfo {
  const copy = { ...info } as any;
  for (const field of omitFields) {
    delete copy[field];
  }
  return copy as CardInfo;
}

/**
 * 템플릿 A/B/C 생성
 */
function buildTemplates(args: {
  card: CardSizeMm;
  logoAspect: number;
  qrEnabled: boolean;
}): Record<'A' | 'B' | 'C', CardElement[]> {
  const safe = safeRect(args.card);
  
  // 로고 크기 계산
  const logoW = 28;
  const logoH = Math.max(8, Math.min(14, logoW / Math.max(0.5, args.logoAspect)));
  
  // QR 크기
  const qr = args.qrEnabled ? { w: MIN_QR_MM, h: MIN_QR_MM } : null;
  
  // Template A: 좌상단 로고 + 우상단 QR + 아래 정보
  const A: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x,
      y_mm: safe.y,
      w_mm: logoW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
  ];
  
  if (qr) {
    A.push({
      id: 'qr',
      kind: 'qr',
      x_mm: safe.x + safe.w - qr.w,
      y_mm: safe.y,
      w_mm: qr.w,
      h_mm: qr.h,
      style: { lockAspect: true },
    });
  }
  
  A.push(
    {
      id: 'name',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 4,
      w_mm: safe.w,
      h_mm: 7,
    },
    {
      id: 'contact',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 13,
      w_mm: safe.w,
      h_mm: safe.h - (logoH + 13),
    }
  );
  
  // Template B: 중앙 로고 + 강조 이름 + 하단 정보
  const B: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x + (safe.w - logoW) / 2,
      y_mm: safe.y,
      w_mm: logoW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
    {
      id: 'name',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 5,
      w_mm: safe.w,
      h_mm: 9,
    },
    {
      id: 'contact',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 16,
      w_mm: safe.w,
      h_mm: safe.h - (logoH + 16),
    },
  ];
  
  if (qr) {
    B.push({
      id: 'qr',
      kind: 'qr',
      x_mm: safe.x + safe.w - qr.w,
      y_mm: safe.y + safe.h - qr.h,
      w_mm: qr.w,
      h_mm: qr.h,
      style: { lockAspect: true },
    });
  }
  
  // Template C: 좌측 로고/이름 + 우측 연락처 + QR 하단
  const leftW = Math.max(32, safe.w * 0.45);
  const rightW = safe.w - leftW - 3;
  
  const C: CardElement[] = [
    {
      id: 'logo',
      kind: 'logo',
      x_mm: safe.x,
      y_mm: safe.y,
      w_mm: leftW,
      h_mm: logoH,
      style: { lockAspect: true },
    },
    {
      id: 'name',
      kind: 'text',
      x_mm: safe.x,
      y_mm: safe.y + logoH + 4,
      w_mm: leftW,
      h_mm: safe.h - (logoH + 4) - (qr ? qr.h + 3 : 0),
    },
    {
      id: 'contact',
      kind: 'text',
      x_mm: safe.x + leftW + 3,
      y_mm: safe.y,
      w_mm: rightW,
      h_mm: safe.h - (qr ? qr.h + 3 : 0),
    },
  ];
  
  if (qr) {
    C.push({
      id: 'qr',
      kind: 'qr',
      x_mm: safe.x + leftW + 3 + rightW - qr.w,
      y_mm: safe.y + safe.h - qr.h,
      w_mm: qr.w,
      h_mm: qr.h,
      style: { lockAspect: true },
    });
  }
  
  return { A, B, C };
}

/**
 * 단일 variant 생성 (폰트 피팅 + Preflight)
 */
async function buildVariant(args: {
  variant: 'A' | 'B' | 'C';
  baseElements: CardElement[];
  cardInfo: CardInfo;
  card: CardSizeMm;
  theme: CardTheme;
  logoFontFamily: string;
  bodyFontFamily: string;
}): Promise<CardDraft> {
  const { variant, baseElements, cardInfo, card, theme, logoFontFamily, bodyFontFamily } = args;
  
  // 생략 우선순위
  const omitPlans: string[][] = [
    [],                          // 1차: 생략 없음
    ['address'],                 // 2차: 주소 생략
    ['address', 'domain'],       // 3차: 주소 + 도메인 생략
  ];
  
  const logoMeasurer = new FontMeasurer(logoFontFamily);
  const bodyMeasurer = new FontMeasurer(bodyFontFamily);
  
  // 각 생략 플랜 시도
  for (const omitFields of omitPlans) {
    const info = omitByPriority(cardInfo, omitFields);
    const elements = structuredClone(baseElements);
    
    // 이름 블록 피팅 (로고 폰트, 크게)
    const nameEl = elements.find((e) => e.id === 'name');
    if (nameEl) {
      const nameText = (info.name ?? '').trim() || 'Name';
      
      const fitted = logoMeasurer.fitTextBlock({
        textLines: [nameText],
        maxWmm: nameEl.w_mm,
        maxHmm: nameEl.h_mm,
        maxSizePt: variant === 'B' ? 13 : 11.5,
        minSizePt: 8.5,
        lineHeight: 1.1,
      });
      
      if (!fitted.ok) continue;
      
      nameEl.style = {
        ...(nameEl.style ?? {}),
        font: 'logo',
        sizePt: fitted.fontSizePt,
        lines: fitted.lines,
        align: variant === 'B' ? 'center' : 'left',
        color: theme.colors.text,
      };
    }
    
    // 연락처 블록 피팅 (바디 폰트, 작게, 여러 줄)
    const contactEl = elements.find((e) => e.id === 'contact');
    if (contactEl) {
      const lines = [
        [info.title, info.company].filter(Boolean).join(' · '),
        info.phone,
        info.email,
        info.domain,
        info.address,
      ].filter(Boolean) as string[];
      
      const fitted = bodyMeasurer.fitTextBlock({
        textLines: lines.length ? lines : ['Contact'],
        maxWmm: contactEl.w_mm,
        maxHmm: contactEl.h_mm,
        maxSizePt: 8.5,
        minSizePt: MIN_BODY_PT,
        lineHeight: 1.25,
      });
      
      if (!fitted.ok) continue;
      
      contactEl.style = {
        ...(contactEl.style ?? {}),
        font: 'body',
        sizePt: fitted.fontSizePt,
        lines: fitted.lines,
        align: 'left',
        color: theme.colors.text,
      };
    }
    
    // Preflight 검사
    const preflight = preflightCheck(card, elements);
    
    if (preflight.ok) {
      // 성공!
      return {
        variant,
        side: 'front', // ✅ 추가
        layout: { card_size_mm: card, elements },
        theme,
        card_info: info,
        omitted_fields: omitFields,
        preflight,
      };
    }
  }
  
  // 모든 시도 실패 - 최소 정보로 fallback
  const info = omitByPriority(cardInfo, ['address', 'domain']);
  const elements = structuredClone(baseElements);
  const preflight = preflightCheck(card, elements);
  
  return {
    variant,
    side: 'front', // ✅ 추가
    layout: { card_size_mm: card, elements },
    theme,
    card_info: info,
    omitted_fields: ['address', 'domain'],
    preflight: {
      ok: false,
      errors: [...preflight.errors, 'Failed to fit even after omits'],
    },
  };
}

/**
 * 자동 3개 시안 생성
 */
export async function autoGenerate3Drafts(args: {
  cardInfo: CardInfo;
  qrEnabled: boolean;
  logoAspect: number;
  logoFontFamily: string;
  bodyFontFamily: string;
  card?: CardSizeMm;
  theme?: CardTheme;
}): Promise<CardDraft[]> {
  const card = args.card ?? DEFAULT_CARD_SIZE;
  
  const theme: CardTheme = args.theme ?? {
    colors: {
      bg: '#FFFFFF',
      text: '#111111',
      accent: '#111111',
    },
  };
  
  const templates = buildTemplates({
    card,
    logoAspect: args.logoAspect,
    qrEnabled: args.qrEnabled,
  });
  
  const [A, B, C] = await Promise.all([
    buildVariant({
      variant: 'A',
      baseElements: templates.A,
      cardInfo: args.cardInfo,
      card,
      theme,
      logoFontFamily: args.logoFontFamily,
      bodyFontFamily: args.bodyFontFamily,
    }),
    buildVariant({
      variant: 'B',
      baseElements: templates.B,
      cardInfo: args.cardInfo,
      card,
      theme,
      logoFontFamily: args.logoFontFamily,
      bodyFontFamily: args.bodyFontFamily,
    }),
    buildVariant({
      variant: 'C',
      baseElements: templates.C,
      cardInfo: args.cardInfo,
      card,
      theme,
      logoFontFamily: args.logoFontFamily,
      bodyFontFamily: args.bodyFontFamily,
    }),
  ]);
  
  // Preflight 통과한 것만 반환 (원칙적으로)
  // 실무에서는 모두 ok일 때까지 재시도/템플릿 추가
  return [A, B, C].filter((d) => d.preflight.ok);
}