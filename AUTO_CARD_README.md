# AI 자동 명함 제작 시스템

## 🎯 핵심 목표

**"사람이 편집할 필요가 없을 정도로"** 완전 자동화된 명함 시안 생성

- AI는 디자인 의사결정만 (방향/위계/스타일)
- 레이아웃 엔진이 mm 단위 배치 + 폰트 메트릭 피팅 + 충돌/잘림 검증
- 3개 모두 Preflight 통과 (겹침 없음, 잘림 없음, Safe Zone 준수)
- 사용자는 **선택만**

---

## 📦 구현된 파일 구조

```
src/
├── app/
│   └── pages/
│       └── AutoCardMakerPage.tsx          # ★ 메인 자동 명함 제작 페이지
│
└── features/branding/
    └── card-auto/                         # ★ 자동 시안 생성 시스템
        ├── types.ts                       # 타입 정의
        ├── fontMetrics.ts                 # Canvas 기반 폰트 측정
        ├── layoutEngine.ts                # 제약 기반 레이아웃 엔진
        ├── pdfGenerator.ts                # Print PDF 생성 (pdf-lib)
        ├── api.ts                         # API 함수 (Mock/Real)
        ├── PreviewRenderer.tsx            # SVG 미리보기
        ├── CardInfoForm.tsx               # 명함 정보 입력 폼
        ├── CardConceptPicker.tsx          # 3개 시안 선택 UI
        └── FulfillmentForm.tsx            # 출고 요청 폼
```

---

## 🚀 사용 방법

### 1. 페이지 이동

```typescript
// App.tsx에서
handleNavigate('auto-card');  // AI 자동 명함 제작
```

또는 URL: `/auto-card`

### 2. 사용자 플로우

#### Step 1: 정보 입력
- 이름 (필수)
- 직함, 회사명
- 전화번호, 이메일
- 웹사이트, 주소
- QR 코드 포함 여부

→ "AI로 3개 시안 자동 생성" 버튼 클릭

#### Step 2: 시안 선택
- AI가 생성한 3가지 레이아웃 (A/B/C)
  - **Template A**: 클래식 (좌상단 로고 + 우상단 QR)
  - **Template B**: 중앙 강조 (센터 로고 + 강조 이름)
  - **Template C**: 좌우 분할 (좌측 로고/이름 + 우측 연락처)

→ 마음에 드는 시안 1개 선택

#### Step 3: PDF 생성 & 출고
- **PDF 미리보기 탭**
  - 인쇄용 PDF 자동 생성
  - 다운로드 가능

- **출고 요청 탭**
  - 수량, 용지, 후가공 선택
  - 배송 정보 입력
  - 출고 요청 제출

→ 완료!

---

## 🔧 핵심 기능

### 1. 템플릿 기반 안전한 3가지 레이아웃

```typescript
// layoutEngine.ts
buildTemplates({
  card: { w: 90, h: 50, bleed: 3, safe: 4 },
  logoAspect: 2.8,
  qrEnabled: true,
})
// → A/B/C 템플릿 생성
```

### 2. 폰트 메트릭 기반 자동 피팅

```typescript
// fontMetrics.ts
const measurer = new FontMeasurer('Inter');

measurer.fitTextBlock({
  textLines: ['홍길동', '대표이사'],
  maxWmm: 80,
  maxHmm: 10,
  maxSizePt: 12,
  minSizePt: 7.5,
  lineHeight: 1.25,
});
// → 자동으로 폰트 크기 조정 + 줄바꿈
```

### 3. 자동 필드 생략 (우선순위)

```typescript
const omitPlans = [
  [],                    // 1차: 생략 없음
  ['address'],           // 2차: 주소 생략
  ['address', 'domain'], // 3차: 주소 + 도메인 생략
];
```

→ 공간 부족 시 자동으로 낮은 우선순위 필드 생략

### 4. Preflight 검사

```typescript
preflightCheck(card, elements)
// ✅ 요소 겹침 없음
// ✅ Safe Zone 안에 있음
// ✅ 폰트 최소 크기 (7.5pt) 이상
// ✅ QR 최소 크기 (18mm) 이상
```

### 5. Print PDF 생성

```typescript
// pdfGenerator.ts
const pdfBytes = await generatePrintPdf({
  draft,
  logoSvgPath,
  qrDataUrl,
});
// → Bleed/Trim/Safe 영역 포함
// → 실제 폰트 임베드
// → QR 코드 임베드
```

---

## 🎨 템플릿 설명

### Template A: 클래식 레이아웃
```
┌─────────────────────────┐
│ [Logo]          [QR]    │
│                         │
│ 홍길동                   │
│ 대표이사 · (주)마이브랜드 │
│ 010-1234-5678          │
│ hello@mybrand.ai       │
└─────────────────────────┘
```

### Template B: 중앙 강조 레이아웃
```
┌─────────────────────────┐
│      [Logo]             │
│                         │
│       홍길동             │
│                         │
│ 대표이사 · (주)마이브랜드 │
│ 010-1234-5678    [QR]  │
└─────────────────────────┘
```

### Template C: 좌우 분할 레이아웃
```
┌─────────────────────────┐
│ [Logo]  │ 대표이사       │
│         │ (주)마이브랜드  │
│ 홍길동   │ 010-1234-5678 │
│         │ hello@...      │
│         │         [QR]   │
└─────────────────────────┘
```

---

## 💡 장점

### 1. 사람 편집 0%
- 정보만 입력하면 끝
- AI + 제약 엔진이 모든 레이아웃 자동 처리

### 2. 항상 안전
- Preflight 통과한 것만 제공
- 겹침/잘림 없음 보장

### 3. 일관된 품질
- 템플릿 기반 + 제약 조건
- 실무 검증된 레이아웃

### 4. 유연한 대응
- 긴 텍스트 자동 처리
- 줄바꿈/축소/생략 자동화

### 5. 빠른 선택
- 3개 중 선택만 하면 완료
- 즉시 인쇄 PDF 생성

---

## 🔄 수동 편집기는 보조 역할

- **메인**: AutoCardMakerPage (자동 생성) ← 기본 플로우
- **보조**: CardEditor (드래그/리사이즈) ← 필요시만 사용

---

## 📊 운영 규칙 (편집 0 보장)

### 1. API는 Preflight 통과한 시안만 반환
```typescript
const validDrafts = drafts.filter(d => d.preflight.ok);
// → 겹침/잘림/Safe Zone 위반은 사용자에게 보여주지 않음
```

### 2. 공간 부족 시 자동 정책
```typescript
// 우선순위: 이름 > 직함/회사 > 연락처 > 도메인 > 주소
// → 낮은 우선순위부터 자동 생략
```

### 3. Print PDF 고정 (SSOT)
```typescript
// 선택 → 즉시 Print PDF 생성
// → 이후 모든 출력/출고는 이 PDF만 사용
// → 편집 불가 (일관성 보장)
```

---

## 🛠 기술 스택

- **Frontend**: React + TypeScript + Tailwind v4
- **PDF**: pdf-lib + @pdf-lib/fontkit
- **QR**: qrcode
- **Font Metrics**: Canvas API
- **UI**: shadcn/ui

---

## 📝 API 엔드포인트 (Mock/Real)

### 1. 3개 시안 생성
```typescript
POST /api/card/auto-generate-3
Body: {
  project_id, typography_kit_id, logo_asset_id,
  card_info, qr_enabled
}
Response: {
  drafts: [
    { variant: 'A', card_doc, proof_signed_url, ... },
    { variant: 'B', ... },
    { variant: 'C', ... }
  ]
}
```

### 2. 시안 선택 & Print PDF
```typescript
POST /api/card/select-and-lock
Body: { card_doc_id }
Response: {
  chosen_card_doc, print_export,
  signed_url, deleted_drafts
}
```

### 3. 출고 요청
```typescript
POST /api/fulfillment/create
Body: {
  export_id, print_options, shipping
}
Response: {
  job: { id, status: 'PDF_LOCKED', ... }
}
```

---

## 🎉 완성!

이제 MyBrands.ai는 **"사람이 편집할 필요 없는"** 완전 자동화된 명함 제작 서비스를 제공합니다!

### 테스트 방법
1. `/auto-card` 페이지 접속
2. 명함 정보 입력
3. "AI로 3개 시안 자동 생성" 클릭
4. 마음에 드는 시안 선택
5. PDF 다운로드 또는 출고 요청

**All done! 🚀**
