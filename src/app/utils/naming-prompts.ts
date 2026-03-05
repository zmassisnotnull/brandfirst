/**
 * 네이밍 프롬프트 템플릿 (N1 ~ N5 + Refiner)
 */

import type { PromptState, PromptResponse } from './prompt-contracts';

/**
 * N1) 키워드 제시 (Starter=3개 / Pro=6개)
 */
export interface KeywordOption {
  keyword: string;
  why: string;
  tone: string;
  naming_angle: string;
}

export interface N1Response {
  keywords: KeywordOption[];
  auto_recommend: {
    primary: string;
    secondary: string[];
    reason: string;
  };
  ui: {
    instruction: string;
  };
}

export function createN1Prompt(state: PromptState): string {
  const keywordCount = state.mode === 'professional' ? 6 : 3;
  
  return `SYSTEM:
너는 브랜드 네이밍 전략가다. 출력은 JSON만.
mode에 따라 키워드 풀 크기를 다르게 구성한다:
- starter: 3개 제시
- professional: 6개 제시
각 키워드는 '네이밍 방향'과 '톤'이 명확해야 한다.

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  mode: state.mode,
  lang: state.session.lang,
  market: state.session.market,
}, null, 2)}

출력 형식:
{
  "keywords": [
    { "keyword": "", "why": "", "tone": "", "naming_angle": "" }
  ],
  "auto_recommend": { "primary": "", "secondary": ["", ""], "reason": "" },
  "ui": { "instruction": "키워드 1개 선택 시, 나머지 2개는 자동 추천됩니다." }
}

출력 (JSON만):`;
}

/**
 * N2) 네이밍 시안 3종 생성 (A/B/C)
 */
export interface NamingCandidate {
  name: string;
  pronunciation: string;
  meaning: string;
  rationale: string;
  slug_suggestion: string;
  risk_flags: string[];
}

export interface NamingVariant {
  variant: 'A' | 'B' | 'C';
  strategy: string;
  candidates: NamingCandidate[];
}

export interface N2Response {
  variants: NamingVariant[];
  top_picks: string[];
  handoff: {
    domain_check_names: string[];
    suggested_finalists: string[];
  };
  ui: {
    next: string;
  };
}

export function createN2Prompt(state: PromptState): string {
  return `SYSTEM:
너는 네이밍 디렉터다. 출력은 JSON만.
규칙:
- 서비스분야/키워드/금지어를 엄수
- 발음/철자 혼동 최소화
- A/B/C는 전략이 달라야 함(직관형/조어형/메타포형)
- 도메인 친화 slug(소문자/하이픈 최소)를 함께 만든다.

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  keywords: state.brand.keywords,
  avoid_words: state.constraints.avoid_words,
  market: state.session.market,
  lang: state.session.lang,
}, null, 2)}

출력 형식:
{
  "variants": [
    {
      "variant": "A",
      "strategy": "직관형/합성어",
      "candidates": [
        {
          "name": "",
          "pronunciation": "",
          "meaning": "",
          "rationale": "",
          "slug_suggestion": "",
          "risk_flags": []
        }
      ]
    },
    { "variant": "B", "strategy": "조어형/브랜드형", "candidates": [...] },
    { "variant": "C", "strategy": "메타포/의미확장", "candidates": [...] }
  ],
  "top_picks": ["5개"],
  "handoff": {
    "domain_check_names": ["도메인 검색에 넘길 후보 5개"],
    "suggested_finalists": ["최종 후보군 3개"]
  },
  "ui": { "next": "도메인 검색을 진행합니다." }
}

출력 (JSON만):`;
}

/**
 * N3) 도메인 체크 요청 payload 생성
 */
export interface DomainRequest {
  name: string;
  base_slugs: string[];
  com_alternative_slugs: string[];
  queries: Array<{
    tld: string;
    fqdn: string;
  }>;
  fallback_service_domain_slugs: string[];
}

export interface N3Response {
  domain_requests: DomainRequest[];
  ui: {
    note: string;
  };
}

export function createN3Prompt(state: PromptState, domainCheckNames: string[]): string {
  return `SYSTEM:
너는 도메인 가용성 조회 요청을 생성하는 엔진이다. 출력은 JSON만.
규칙:
- 기본은 .com/.co.kr/.kr 세 가지
- .com이 어려울 때를 대비해 'com_alternative_slugs'를 최대 2개 만든다(의미 보존)
- service_domain 관련 도메인(설명형 2종)도 보조로 제안할 수 있다.

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  names: domainCheckNames,
  tlds: ['.com', '.co.kr', '.kr'],
}, null, 2)}

출력 형식:
{
  "domain_requests": [
    {
      "name": "",
      "base_slugs": [""],
      "com_alternative_slugs": ["", ""],
      "queries": [
        { "tld": ".com", "fqdn": "" },
        { "tld": ".co.kr", "fqdn": "" },
        { "tld": ".kr", "fqdn": "" }
      ],
      "fallback_service_domain_slugs": ["서비스분야관련-설명형-2종"]
    }
  ],
  "ui": { "note": "도메인 결과에 따라 최종 후보를 재추천합니다." }
}

출력 (JSON만):`;
}

/**
 * N4) 도메인 결과 기반 재랭킹
 */
export interface DomainResult {
  fqdn: string;
  available: boolean;
  price: number;
  notes: string;
}

export interface N4Response {
  final_recommendation: {
    primary: {
      name: string;
      fqdn: string;
      why: string;
    };
    alternates: Array<{
      name: string;
      fqdn: string;
      why: string;
    }>;
  };
  handoff: {
    final_name: string;
    logo_text: string;
  };
  ui: {
    next: string;
  };
}

export function createN4Prompt(topPicks: string[], domainResults: DomainResult[]): string {
  return `SYSTEM:
너는 네이밍 최종 의사결정 보조자다. 출력은 JSON만.
도메인 결과(available/price/notes)를 반영해 최종 1종과 대안 2종을 추천한다.

USER:
입력:
${JSON.stringify({
  top_picks: topPicks,
  domain_results: domainResults,
}, null, 2)}

출력 형식:
{
  "final_recommendation": {
    "primary": { "name": "", "fqdn": "", "why": "" },
    "alternates": [{ "name": "", "fqdn": "", "why": "" }]
  },
  "handoff": { "final_name": "", "logo_text": "" },
  "ui": { "next": "상표 검색/등록 확인을 진행하세요." }
}

출력 (JSON만):`;
}

/**
 * N5) 상표 검색/등록 확인 가이드
 */
export interface N5Response {
  trademark_check: {
    search_terms: string[];
    checklist: string[];
  };
  ui: {
    note: string;
  };
}

export function createN5Prompt(state: PromptState): string {
  return `SYSTEM:
너는 상표 사전검토 가이드를 만드는 엔진이다. 출력은 JSON만.
법률 자문이 아니라 '사용자 확인을 돕는 체크리스트'를 제공한다.

USER:
입력:
${JSON.stringify({
  final_name: state.brand.naming.final_name,
  market: state.session.market,
}, null, 2)}

출력 형식:
{
  "trademark_check": {
    "search_terms": ["", "유사 철자 1", "띄어쓰기 변형 1"],
    "checklist": [
      "동일/유사 표장이 있는지 확인",
      "동일 업종/유사 업종에서 충돌 가능성 확인",
      "호칭/관념/외관이 유사한지 확인"
    ]
  },
  "ui": { "note": "상표 가능성은 최종적으로 전문 검토가 필요할 수 있습니다." }
}

출력 (JSON만):`;
}

/**
 * N-Refiner) 네이밍 입력 기반 리파인
 */
export interface RefinerVariant {
  name: string;
  why: string;
}

export interface RefinedNaming {
  base: string;
  best_logo_form: {
    text: string;
    case: 'TitleCase' | 'UPPER' | 'lower';
    spacing_hint: string;
  };
  variants: RefinerVariant[];
  risk_notes: Array<{
    issue: string;
    mitigation: string;
  }>;
}

export interface NRefinerResponse {
  refined: RefinedNaming[];
  handoff: {
    domain_check_names: string[];
    logo_text: string;
  };
}

export function createNRefinerPrompt(state: PromptState): string {
  return `SYSTEM:
너는 네이밍 리파이너다. 출력은 JSON만.
입력 후보 각각에 대해:
- 개선 변형 5개
- 혼동/부정 뉘앙스/유사상표 위험 포인트
- 로고타입 표기(대소문자/자간/리듬) 추천

USER:
입력:
${JSON.stringify({
  service_domain: state.brand.service_domain,
  selected_candidates: state.brand.naming.selected_candidates,
  keywords: state.brand.keywords,
  market: state.session.market,
  lang: state.session.lang,
}, null, 2)}

출력 형식:
{
  "refined": [
    {
      "base": "",
      "best_logo_form": { "text": "", "case": "TitleCase", "spacing_hint": "" },
      "variants": [{ "name": "", "why": "" }],
      "risk_notes": [{ "issue": "", "mitigation": "" }]
    }
  ],
  "handoff": { "domain_check_names": ["..."], "logo_text": "" }
}

출력 (JSON만):`;
}
