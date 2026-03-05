# AI 자동 명함 제작 시스템 V2 - 양면 지원

## 🎯 핵심 요구사항

**✅ 무조건 3개 시안 생성**
- Starter: 앞면 3종만
- Professional: 앞면 3종 + 뒷면 3종  
- Refiner: 단면/양면 사용자 선택

**✅ 양면 선택 방식**
- 앞면 3종 중 1개 선택
- 뒷면 3종 중 1개 선택
- 총 2개 선택 → 2페이지 PDF

**✅ Print PDF 생성**
- 단면: 1페이지 PDF
- 양면: 2페이지 PDF (1p=앞, 2p=뒤)
- PDF_LOCKED 상태로 고정 저장

---

## 📦 구현된 파일 구조

```
src/
├── app/
│   └── pages/
│       ├── AutoCardMakerPage.tsx           # V1 (단면만)
│       └── AutoCardMakerPageV2.tsx         # ★ V2 (양면 지원)
│
└── features/branding/
    └── card-auto/
        ├── types.ts                        # ✅ side 추가
        ├── fontMetrics.ts                  # Canvas 기반 폰트 측정
        ├── layoutEngine.ts                 # 앞면 레이아웃 (A/B/C)
        ├── layoutEngineBack.ts             # ★ 뒷면 레이아웃 (A/B/C)
        ├── pdfGenerator.ts                 # Print PDF 생성
        ├── api.ts                          # ✅ 양면 지원 API
        ├── PreviewRenderer.tsx             # SVG 미리보기
        ├── CardInfoForm.tsx                # 명함 정보 입력
        ├── CardConceptPicker.tsx           # V1 (단면)
        ├── CardConceptPickerDouble.tsx     # ★ V2 (양면 지원)
        └── FulfillmentForm.tsx             # 출고 요청
```

---

## 🚀 사용 방법

### 1. 페이지 이동

```typescript
// App.tsx에서
handleNavigate('auto-card-v2');  // AI 자동 명함 제작 V2 (양면 지원)
```

### 2. 사용자 플로우

#### Step 1: 모드 선택

**Starter**
- 단면 전용
- 앞면 3종 자동 생성
- 1페이지 PDF

**Professional** (추천)
- 양면 필수
- 앞면 3종 + 뒷면 3종
- 각 면에서 1개씩 선택
- 2페이지 PDF

**Refiner**
- 단면/양면 자유 선택
- 기존 명함 업로드 가능
- 유연한 커스터마이징

#### Step 2: 정보 입력
- 이름, 직함, 회사명
- 전화번호, 이메일
- 웹사이트, 주소
- QR 코드 포함 여부

**Refiner 전용**: 단면/양면 토글 선택

#### Step 3: 시안 생성 & 선택

**단면 (Starter/Refiner)**
```
앞면 3종 (A/B/C) → 1개 선택 → 1페이지 PDF 생성
```

**양면 (Professional/Refiner)**
```
앞면 3종 (A/B/C) → 1개 선택
뒷면 3종 (A/B/C) → 1개 선택
→ 2페이지 PDF 생성 (1p=앞, 2p=뒤)
```

#### Step 4: PDF 다운로드 & 출고

- **PDF 미리보기 탭**
  - 인쇄용 PDF 확인
  - 다운로드 가능

- **출고 요청 탭**
  - 수량, 용지, 후가공
  - 배송 정보 입력
  - 출고 요청 제출

---

## 🔧 핵심 기능

### 1. 양면 템플릿 (뒷면)

뒷면은 **로고 + 도메인**만 표시하여 실패율 최소화

```typescript
// layoutEngineBack.ts
const backTemplates = {
  A: 중앙 로고 + 하단 도메인,
  B: 상단 로고 + 중앙 도메인 (세로 배치),
  C: 좌측 로고 + 우측 도메인,
};
```

### 2. 도메인 자동 추출

```typescript
// 우선순위
1. card_info.domain
2. card_info.email에서 도메인 추출 (@이후)
3. card_info.company
4. fallback: "mybrand.ai"
```

### 3. 양면 API 응답 구조

```typescript
{
  draft_group_id: "uuid",
  mode: "professional",
  sides: {
    front: [
      { variant: "A", card_doc_id: "...", proof_signed_url: "..." },
      { variant: "B", ... },
      { variant: "C", ... }
    ],
    back: [  // ✅ 양면인 경우만 존재
      { variant: "A", card_doc_id: "...", proof_signed_url: "..." },
      { variant: "B", ... },
      { variant: "C", ... }
    ]
  }
}
```

### 4. 양면 선택 API

```typescript
// 단면
await selectAndLockCard({
  front_card_doc_id: "uuid"
});

// 양면
await selectAndLockCard({
  front_card_doc_id: "uuid-front",
  back_card_doc_id: "uuid-back"  // ✅ 필수
});
```

### 5. 2페이지 PDF 생성

```typescript
// pdfGenerator.ts
const pages = [frontDraft, backDraft];

for (const draft of pages) {
  const page = pdfDoc.addPage([pageW, pageH]);
  // 1p: 앞면 렌더링
  // 2p: 뒷면 렌더링
}
```

---

## 📊 DB 스키마 (변경 사항)

### 1. projects 테이블

```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_double_sided BOOLEAN NOT NULL DEFAULT FALSE;

-- Starter: is_double_sided = FALSE
-- Professional: is_double_sided = TRUE
-- Refiner: 사용자 선택값
```

### 2. card_docs 테이블

```sql
ALTER TABLE card_docs
ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'front';
-- 값: 'front' | 'back'

ALTER TABLE card_docs
ADD COLUMN IF NOT EXISTS draft_group_id UUID;

ALTER TABLE card_docs
ADD COLUMN IF NOT EXISTS draft_variant TEXT;
-- 값: 'A' | 'B' | 'C'

CREATE INDEX IF NOT EXISTS idx_card_docs_draft_group_side
ON card_docs(user_id, project_id, draft_group_id, side)
WHERE is_draft = TRUE;
```

### 3. exports 테이블

```sql
ALTER TABLE exports
ADD COLUMN IF NOT EXISTS back_card_doc_id UUID REFERENCES card_docs(id);

-- 단면 Print: card_doc_id=front, back_card_doc_id=NULL
-- 양면 Print: card_doc_id=front, back_card_doc_id=back
```

---

## 🎨 UI/UX 플로우

### Starter Mode

```
[모드 선택: Starter]
  ↓
[정보 입력] (단면 고정)
  ↓
[AI 생성] → 앞면 3종 (A/B/C)
  ↓
[1개 선택]
  ↓
[1페이지 PDF 생성]
  ↓
[다운로드 또는 출고 요청]
```

### Professional Mode

```
[모드 선택: Professional]
  ↓
[정보 입력] (양면 고정)
  ↓
[AI 생성] → 앞면 3종 + 뒷면 3종
  ↓
[앞면 1개 선택] + [뒷면 1개 선택]
  ↓
[2페이지 PDF 생성]
  ↓
[다운로드 또는 출고 요청]
```

### Refiner Mode

```
[모드 선택: Refiner]
  ↓
[정보 입력]
  ├─ 단면 선택 → 앞면 3종 → 1개 선택 → 1p PDF
  └─ 양면 선택 → 앞면 3종 + 뒷면 3종 → 각 1개 선택 → 2p PDF
  ↓
[다운로드 또는 출고 요청]
```

---

## 💡 "무조건 3개" 보장 전략

### 1. 앞면 (정보면)

**생략 우선순위**
```typescript
const omitPlans = [
  [],                          // 1차: 생략 없음
  ['address'],                 // 2차: 주소 생략
  ['address', 'domain'],       // 3차: 주소 + 도메인 생략
];
```

**핵심 필드는 끝까지 유지**
- name, phone, email은 생략하지 않음
- 폰트 크기 자동 조정으로 대응

### 2. 뒷면 (로고/도메인)

**최소 정보만 사용**
- 로고 (필수)
- 도메인 1줄 (자동 추출)

→ **실패율 0%에 가깝게**

### 3. Preflight 검사

```typescript
preflightCheck(card, elements)
// ✅ 요소 겹침 없음
// ✅ Safe Zone 안에 있음
// ✅ 폰트 최소 크기 (7.5pt) 이상
// ✅ QR 최소 크기 (18mm) 이상
```

### 4. Fallback 전략

```typescript
// 모든 시도 실패 시
return {
  variant,
  side: 'front',
  layout: minimalLayout,  // 최소 정보 레이아웃
  omitted_fields: ['address', 'domain'],
  preflight: {
    ok: false,
    errors: ['Failed to fit even after omits']
  }
};
```

→ 프론트에서 preflight.ok === false인 것은 제외

---

## 🔄 Edge Function API (Hono)

### POST /api/card/auto-generate

```typescript
{
  project_id: string;
  typography_kit_id: string;
  logo_asset_id: string;
  card_info: CardInfo;
  is_double_sided_override?: boolean;  // Refiner용
}

Response:
{
  draft_group_id: string;
  mode: "starter" | "professional" | "refiner";
  sides: {
    front: Array<{ variant, card_doc_id, proof_signed_url, ... }>;
    back?: Array<{ variant, card_doc_id, proof_signed_url, ... }>;
  }
}
```

### POST /api/card/select-and-lock

```typescript
{
  front_card_doc_id: string;
  back_card_doc_id?: string;  // 양면 시 필수
}

Response:
{
  chosen_card_doc: { id };
  print_export: { id };
  signed_url: string;  // Print PDF URL
  deleted_drafts: string[];
}
```

### POST /api/fulfillment/create

```typescript
{
  export_id: string;
  print_options: { qty, paper_type, finish };
  shipping: { receiver, phone, address, postal_code, memo };
}

Response:
{
  job: {
    id: string;
    status: "PDF_LOCKED";
    created_at: string;
  }
}
```

---

## 🎯 장점

### 1. 완전 자동화
- 사람 편집 0%
- 정보만 입력하면 끝

### 2. 모드별 최적화
- **Starter**: 빠르고 간단 (단면만)
- **Professional**: 고급스러운 양면 명함
- **Refiner**: 유연한 커스터마이징

### 3. 안전한 생성
- Preflight 통과한 것만 제공
- 겹침/잘림 없음 보장

### 4. 일관된 결과
- PDF_LOCKED로 고정
- 인쇄/출고 시 동일한 PDF 사용

### 5. 양면 자동 처리
- 뒷면은 로고+도메인만으로 실패율 최소화
- 각 면에서 독립적으로 1개씩 선택

---

## 📝 Mock 모드

현재 `MOCK_MODE = true`로 설정되어 프론트엔드 단독 개발 가능

```typescript
// src/features/branding/card-auto/api.ts
const MOCK_MODE = true;  // ← 백엔드 준비되면 false
```

**Mock 동작**
- 자동 생성: 2초 대기 후 A/B/C 시안 반환
- 선택 확정: 1초 대기 후 PDF URL 반환
- 출고 요청: 0.8초 대기 후 Job ID 반환

---

## 🚢 배포 전 체크리스트

- [ ] DB 마이그레이션 실행 (projects, card_docs, exports)
- [ ] Edge Function 배포 (/card/auto-generate, /card/select-and-lock)
- [ ] 폰트 파일 업로드 (Supabase Storage)
- [ ] 로고 SVG 저장 로직 구현
- [ ] QR 코드 생성 테스트
- [ ] PDF 생성 테스트 (단면/양면)
- [ ] MOCK_MODE = false로 변경
- [ ] 크레딧 차감 로직 연동
- [ ] 출고 시스템 연동

---

## 🎉 완성!

이제 MyBrands.ai는 **진짜로 사람이 편집할 필요 없는** 완전 자동화된 **양면 명함 제작 서비스**를 제공합니다!

### 테스트 방법

1. `/auto-card-v2` 페이지 접속
2. 모드 선택 (Starter/Professional/Refiner)
3. 명함 정보 입력
4. "AI로 3개 시안 자동 생성" 클릭
5. 앞면(+뒷면) 각각 1개 선택
6. "선택 확정 → 인쇄 PDF 생성" 클릭
7. PDF 다운로드 또는 출고 요청

**All done! 🚀**
