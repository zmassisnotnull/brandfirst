# 프롬프트 엔지니어링 가이드

MyBrands.ai의 프롬프트 기반 워크플로우 시스템 문서입니다.

## 📋 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [프롬프트 계약 (Prompt Contract)](#프롬프트-계약-prompt-contract)
4. [네이밍 프롬프트 (N1-N5)](#네이밍-프롬프트-n1-n5)
5. [로고 프롬프트 (L1-L3)](#로고-프롬프트-l1-l3)
6. [명함 프롬프트 (C1-C3)](#명함-프롬프트-c1-c3)
7. [QR 디지털 명함 (QR1)](#qr-디지털-명함-qr1)
8. [사용 예제](#사용-예제)

---

## 개요

### 핵심 개념

**각 박스(단계) = 1개의 프롬프트 + 고정 JSON 스키마**

- 모든 프롬프트는 **JSON만 출력**
- 시안은 항상 **A/B/C로 고정** (진짜 다른 전략)
- 사용자 선택 항목은 **UI hints** 포함
- 외부 조회(도메인, OCR, 상표)는 AI가 직접 확정하지 않고 **요청 payload 생성** 또는 **결과 해석/재랭킹**만 수행

### 워크플로우

```
서비스 분야 입력
    ↓
네이밍 (N1~N5)
    ↓
로고 (L1~L3)
    ↓
명함 (C1~C3)
    ↓
QR 디지털 명함 (QR1)
```

---

## 시스템 아키텍처

### 파일 구조

```
/src/app/utils/
├── prompt-contracts.ts          # 공통 상태 스키마 + 타입 정의
├── prompt-engine.ts             # OpenAI API 호출 엔진
├── naming-prompts.ts            # 네이밍 프롬프트 (N1~N5, Refiner)
├── logo-prompts.ts              # 로고 프롬프트 (L1~L3, Refiner)
├── card-prompts.ts              # 명함 프롬프트 (C1~C3, Refiner, QR1)
└── prompt-orchestration.ts      # 오케스트레이션 (전체 플로우 실행)

/supabase/functions/server/
└── index.tsx                    # /api/ai/prompt 엔드포인트 추가
```

### 데이터 흐름

```
프론트엔드
    ↓ (프롬프트 생성)
PromptEngine
    ↓ (HTTP POST)
Supabase Functions (/api/ai/prompt)
    ↓ (OpenAI API 호출)
OpenAI GPT-4o-mini
    ↓ (JSON 응답)
프론트엔드
    ↓ (상태 업데이트 + 다음 단계)
```

---

## 프롬프트 계약 (Prompt Contract)

### 공통 입력 상태 (PromptState)

모든 프롬프트는 이 상태를 입력받고, 업데이트하며 다음 단계로 전달합니다.

```typescript
interface PromptState {
  session: {
    id: string;                          // 세션 ID
    lang: 'ko' | 'en' | 'mixed';         // 언어
    market: 'KR' | 'Global';             // 시장
  };
  mode: 'starter' | 'professional' | 'refiner'; // 플랜
  brand: {
    service_domain: string;              // 서비스 분야
    keywords: {
      primary: string;                   // 선택된 키워드
      secondary: string[];               // 자동 추천 키워드
    };
    naming: {
      selected_candidates: string[];     // 선택된 후보들
      final_name: string;                // 최종 네이밍
    };
    logo: {
      text: string;                      // 로고 텍스트
      colors: {
        primary: string;                 // 선택 컬러
        secondary: string[];             // 자동 추천 컬러
      };
      style_pick: {
        primary: string;                 // 선택 스타일
        secondary: string[];             // 자동 추천 스타일
      };
    };
    card: {
      info: { ... };                     // 명함 정보
      qr: { ... };                       // QR 정보
    };
  };
  constraints: {
    avoid_words: string[];               // 금지어
    profanity_block: boolean;            // 비속어 차단
  };
}
```

### 공통 출력 규칙

```typescript
interface PromptResponse<T> {
  data: T;                               // 실제 데이터
  ui?: {
    instruction?: string;                // UI 안내 문구
    note?: string;                       // 참고 사항
    next?: string;                       // 다음 단계 안내
    go_to_editor?: boolean;              // 편집기 이동 여부
  };
  handoff?: Record<string, any>;         // 다음 프롬프트에 전달할 데이터
}
```

---

## 네이밍 프롬프트 (N1-N5)

### N1) 키워드 제시

**목적**: 서비스 분야 기반으로 키워드 제시 (Starter=3개, Pro=6개)

```typescript
import { createN1Prompt } from './naming-prompts';

const prompt = createN1Prompt(state);
const response = await engine.execute<N1Response>(prompt);

// 결과
{
  "keywords": [
    { "keyword": "혁신", "why": "...", "tone": "...", "naming_angle": "..." }
  ],
  "auto_recommend": {
    "primary": "혁신",
    "secondary": ["성장", "신뢰"],
    "reason": "..."
  },
  "ui": { "instruction": "키워드 1개 선택 시, 나머지 2개는 자동 추천됩니다." }
}
```

### N2) 네이밍 시안 3종 생성

**목적**: A/B/C 전략으로 네이밍 시안 생성

```typescript
const prompt = createN2Prompt(state);
const response = await engine.execute<N2Response>(prompt);

// 결과
{
  "variants": [
    {
      "variant": "A",
      "strategy": "직관형/합성어",
      "candidates": [
        {
          "name": "브랜딩허브",
          "pronunciation": "브랜딩 허브",
          "meaning": "브랜드를 만드는 중심지",
          "rationale": "...",
          "slug_suggestion": "brandinghub",
          "risk_flags": []
        }
      ]
    },
    { "variant": "B", ... },
    { "variant": "C", ... }
  ],
  "top_picks": ["브랜딩허브", "브랜드핏", "마이브랜즈", ...],
  "handoff": {
    "domain_check_names": ["brandinghub", "brandfit", ...],
    "suggested_finalists": ["브랜딩허브", "브랜드핏", "마이브랜즈"]
  }
}
```

### N3) 도메인 체크 요청 생성

**목적**: .com/.co.kr/.kr + 대안 도메인 요청 payload 생성

```typescript
const prompt = createN3Prompt(state, domainCheckNames);
const response = await engine.execute<N3Response>(prompt);

// 결과
{
  "domain_requests": [
    {
      "name": "브랜딩허브",
      "base_slugs": ["brandinghub"],
      "com_alternative_slugs": ["brandinghub-ai", "mybrandinghub"],
      "queries": [
        { "tld": ".com", "fqdn": "brandinghub.com" },
        { "tld": ".co.kr", "fqdn": "brandinghub.co.kr" },
        { "tld": ".kr", "fqdn": "brandinghub.kr" }
      ],
      "fallback_service_domain_slugs": ["branding-service", "brand-maker"]
    }
  ]
}
```

### N4) 도메인 결과 기반 재랭킹

**목적**: 도메인 가용성 결과를 반영하여 최종 추천

```typescript
const prompt = createN4Prompt(topPicks, domainResults);
const response = await engine.execute<N4Response>(prompt);

// 결과
{
  "final_recommendation": {
    "primary": {
      "name": "브랜딩허브",
      "fqdn": "brandinghub.com",
      "why": ".com 확보 가능 + 직관적"
    },
    "alternates": [
      { "name": "브랜드핏", "fqdn": "brandfit.com", "why": "..." }
    ]
  },
  "handoff": {
    "final_name": "브랜딩허브",
    "logo_text": "BrandingHub"
  }
}
```

### N5) 상표 검색 가이드

**목적**: 사용자가 상표 검색을 할 수 있도록 가이드 제공

```typescript
const prompt = createN5Prompt(state);
const response = await engine.execute<N5Response>(prompt);

// 결과
{
  "trademark_check": {
    "search_terms": ["브랜딩허브", "브랜딩 허브", "Brandinghub"],
    "checklist": [
      "동일/유사 표장이 있는지 확인",
      "동일 업종/유사 업종에서 충돌 가능성 확인",
      "호칭/관념/외관이 유사한지 확인"
    ]
  },
  "ui": { "note": "상표 가능성은 최종적으로 전문 검토가 필요할 수 있습니다." }
}
```

---

## 로고 프롬프트 (L1-L3)

### L1) 컬러 9종 제시

**목적**: 서비스 분야 기반 컬러 팔레트 제시

```typescript
const prompt = createL1Prompt(state);
const response = await engine.execute<L1Response>(prompt);

// 결과
{
  "palette9": [
    { "name": "프로페셔널 블루", "hex": "#2563EB", "fit": "신뢰감과 전문성" },
    { "name": "혁신 퍼플", "hex": "#7C3AED", "fit": "창의성과 혁신" },
    ...
  ],
  "auto_recommend": {
    "primary": "#2563EB",
    "secondary": ["#7C3AED", "#10B981"],
    "reason": "IT 서비스 특성상 신뢰감과 혁신성을 동시에 표현"
  }
}
```

### L2) 스타일 제시

**목적**: Starter=3종, Pro=6종 스타일 제시

```typescript
const prompt = createL2Prompt(state);
const response = await engine.execute<L2Response>(prompt);

// 결과
{
  "style_options": [
    {
      "style": "미니멀",
      "why": "깔끔하고 현대적인 느낌",
      "visual_cues": ["단순한 형태", "여백 활용", "모노톤"]
    },
    { "style": "모던", ... },
    { "style": "테크", ... }
  ],
  "auto_recommend": {
    "primary": "미니멀",
    "secondary": ["모던", "테크"],
    "reason": "IT 서비스 특성에 가장 적합"
  }
}
```

### L3) 로고 시안 프롬프트 생성

**목적**: 이미지 생성 모델에 전달할 프롬프트 3종 생성

```typescript
const prompt = createL3Prompt(state);
const response = await engine.execute<L3Response>(prompt);

// 결과
{
  "prompt_pack": [
    {
      "variant": "A",
      "concept": "워드마크 중심 + 미니멀 아이콘",
      "image_prompt": "Modern minimalist logotype for 'BrandingHub', ...",
      "negative_prompt": ["mockup", "photo", "blurry", "3D", ...]
    },
    { "variant": "B", ... },
    { "variant": "C", ... }
  ],
  "ui": { "next": "로고 시안 3종을 생성합니다." },
  "print_note": "최종 로고는 SVG path로 저장 권장"
}
```

---

## 명함 프롬프트 (C1-C3)

### C1) 레이아웃 방향 제시

**목적**: 로고 분석을 기반으로 명함 레이아웃 방향 3개 제시

```typescript
const prompt = createC1Prompt(logoObservation, keywords);
const response = await engine.execute<C1Response>(prompt);

// 결과
{
  "auto_style_rules": {
    "background_from_logo": true,
    "text_color_by_logo_brightness": true,
    "layout_fit_by_logo_shape": true
  },
  "directions": [
    {
      "variant": "A",
      "direction": "클린/미니멀",
      "why": "로고가 단순하고 현대적이므로",
      "layout_hint": ["여백 강조", "좌측 정렬", "심플한 타이포"]
    },
    { "variant": "B", "direction": "프리미엄/에디토리얼", ... },
    { "variant": "C", "direction": "테크/그리드", ... }
  ]
}
```

### C2) 정보 입력 정규화

**목적**: OCR 또는 사용자 입력을 정규화

```typescript
const prompt = createC2Prompt(rawText);
const response = await engine.execute<C2Response>(prompt);

// 결과
{
  "card_info": {
    "name": { "value": "홍길동", "confidence": 0.95 },
    "title": { "value": "대표이사", "confidence": 0.9 },
    "company": { "value": "브랜딩허브", "confidence": 0.85 },
    "phone": { "value": "010-1234-5678", "confidence": 1.0 },
    "email": { "value": "hong@brandinghub.com", "confidence": 1.0 },
    "address": { "value": "", "confidence": 0 },
    "domain": { "value": "brandinghub.com", "confidence": 0.8 }
  },
  "questions_to_confirm": ["회사 주소를 입력해주세요."]
}
```

### C3) 명함 레이아웃 3종 생성

**목적**: 인쇄용 명함 편집기 JSON 생성

```typescript
const prompt = createC3Prompt(logoShape, logoColors, cardInfo, directionPick);
const response = await engine.execute<C3Response>(prompt);

// 결과
{
  "layouts": [
    {
      "variant": "A",
      "grid": { "columns": 6, "gutter_mm": 2.5, ... },
      "elements": [
        { "id": "logo", "x_mm": 6, "y_mm": 6, "w_mm": 28, "h_mm": 10, ... },
        { "id": "name", "x_mm": 6, "y_mm": 22, "w_mm": 78, "h_mm": 6, ... },
        ...
      ],
      "typography": { "sizes_pt": { "name": 11, "meta": 8.5, "body": 8 }, ... },
      "colors": { "bg": "#FFFFFF", "text": "#111111", "accent": "#2563EB" }
    },
    { "variant": "B", ... },
    { "variant": "C", ... }
  ],
  "preflight": ["bleed 포함", "safe zone 준수", "가독성(대비)", ...]
}
```

---

## QR 디지털 명함 (QR1)

### QR1) 디지털 명함 페이지 스펙 생성

**목적**: 웹 페이지 구성 JSON 생성

```typescript
const prompt = createQR1Prompt(cardInfo, brandName, logoTheme, domain);
const response = await engine.execute<QR1Response>(prompt);

// 결과
{
  "digital_card": {
    "title": "홍길동",
    "subtitle": "브랜딩허브 대표이사",
    "sections": [
      { "id": "profile", "fields": ["name", "title", "company"] },
      { "id": "contacts", "fields": ["phone", "email", "domain"] },
      { "id": "actions", "buttons": [{ "type": "call" }, { "type": "email" }, ...] }
    ],
    "theme": { "bg": "#FFFFFF", "text": "#111111", "accent": "#2563EB" },
    "share": {
      "qr_target_url": "https://mybrands.ai/card/hong",
      "slug_suggestion": "hong"
    }
  }
}
```

---

## 사용 예제

### 1. 기본 사용 (단계별 실행)

```typescript
import { PromptOrchestrator } from './prompt-orchestration';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// 오케스트레이터 생성
const orchestrator = new PromptOrchestrator(projectId, publicAnonKey, 'starter');

// 서비스 분야 설정
orchestrator.updateState({
  brand: {
    ...orchestrator.getState().state.brand,
    service_domain: 'IT 서비스',
  },
});

// N1: 키워드 제시
const keywords = await orchestrator.executeN1_Keywords();
console.log('키워드:', keywords);

// 사용자가 키워드 선택
orchestrator.updateState({
  brand: {
    ...orchestrator.getState().state.brand,
    keywords: {
      primary: keywords.keywords[0].keyword,
      secondary: keywords.auto_recommend.secondary,
    },
  },
});

// N2: 네이밍 시안 생성
const naming = await orchestrator.executeN2_NamingVariants();
console.log('네이밍 시안:', naming);

// ... 계속
```

### 2. 전체 자동 실행

```typescript
const orchestrator = new PromptOrchestrator(projectId, publicAnonKey, 'professional');

// 서비스 분야만 설정
orchestrator.updateState({
  brand: {
    ...orchestrator.getState().state.brand,
    service_domain: 'IT 서비스',
  },
});

// 전체 플로우 자동 실행
const result = await orchestrator.executeFullWorkflow();
console.log('완료된 워크플로우:', result);
```

### 3. React 컴포넌트에서 사용

```typescript
import { useState, useEffect } from 'react';
import { PromptOrchestrator } from './utils/prompt-orchestration';

export function NamingPage() {
  const [orchestrator] = useState(() => 
    new PromptOrchestrator(projectId, publicAnonKey, 'starter')
  );
  const [keywords, setKeywords] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      // 서비스 분야 설정
      orchestrator.updateState({
        brand: {
          ...orchestrator.getState().state.brand,
          service_domain: serviceDomain,
        },
      });

      // 키워드 생성
      const result = await orchestrator.executeN1_Keywords();
      setKeywords(result);
    } catch (error) {
      console.error('키워드 생성 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleStart} disabled={loading}>
        {loading ? '생성 중...' : '키워드 생성'}
      </button>
      
      {keywords && (
        <div>
          {keywords.keywords.map(k => (
            <div key={k.keyword}>
              <h3>{k.keyword}</h3>
              <p>{k.why}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 운영 팁 (품질 향상 포인트)

### 1. A/B/C가 진짜 다르게 나오게

프롬프트에 `strategy`, `concept`, `information_hierarchy`를 강제 필드로 두세요.

```typescript
"A/B/C는 전략이 달라야 함(직관형/조어형/메타포형)"
```

### 2. 도메인/상표 처리

AI가 확정하지 말고 **요청 payload 생성** + **결과 기반 재랭킹**으로만 처리하세요.

### 3. 선택 가이드 제공

"결과 확인(1종 선택)" 단계에서, AI가 **선택 가이드(장단점 3개)**를 같이 주면 이탈률이 줄어듭니다.

### 4. SVG path 권장

로고는 인쇄/재사용을 위해 최종 저장 시 **SVG path 기반**을 권장 (텍스트 폰트 의존 최소화).

### 5. 레이아웃 JSON 호환성

명함은 **레이아웃 JSON을 편집기가 그대로 읽게** 만들면, AI 편집 → 수동 편집 전환이 부드럽습니다.

---

## 디버깅

### 프롬프트 실행 로그 확인

```typescript
// 프롬프트 엔진에 로깅 추가
const engine = new PromptEngine({
  apiUrl: '...',
  apiKey: '...',
});

// 실행
const response = await engine.execute(prompt);

// 콘솔에서 확인:
// 🎯 Executing prompt...
// ✅ Prompt executed successfully
```

### JSON 파싱 오류 처리

AI가 가끔 마크다운 코드블록(```json)으로 감싸서 반환할 수 있습니다.
`PromptEngine.parseJSON()`이 자동으로 처리합니다.

### 상태 히스토리 확인

```typescript
const history = orchestrator.getState().history;
console.log('실행 히스토리:', history);
```

---

## 라이선스

MIT License
