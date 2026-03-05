/**
 * Prompt Contract - 공통 JSON 상태 스키마
 * 모든 단계에서 이 상태를 업데이트하며 전달
 */

export interface SessionState {
  id: string;
  lang: 'ko' | 'en' | 'mixed';
  market: 'KR' | 'Global';
}

export interface BrandKeywords {
  primary: string;
  secondary: string[];
}

export interface BrandNaming {
  selected_candidates: string[];
  final_name: string;
}

export interface BrandLogo {
  text: string;
  colors: {
    primary: string;
    secondary: string[];
  };
  style_pick: {
    primary: string;
    secondary: string[];
  };
}

export interface BrandCard {
  info: {
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    domain: string;
  };
  qr: {
    enabled: boolean;
    url: string;
  };
}

export interface BrandState {
  service_domain: string;
  keywords: BrandKeywords;
  naming: BrandNaming;
  logo: BrandLogo;
  card: BrandCard;
}

export interface Constraints {
  avoid_words: string[];
  profanity_block: boolean;
}

export interface PromptState {
  session: SessionState;
  mode: 'starter' | 'professional' | 'refiner';
  brand: BrandState;
  constraints: Constraints;
}

/**
 * 공통 출력 규칙
 * - 모든 프롬프트는 반드시 JSON만 출력
 * - 시안은 항상 A/B/C로 고정
 * - UI hints 포함
 */
export interface PromptResponse<T = any> {
  data: T;
  ui?: {
    instruction?: string;
    note?: string;
    next?: string;
    go_to_editor?: boolean;
  };
  handoff?: Record<string, any>;
}

/**
 * 기본 PromptState 생성
 */
export function createInitialPromptState(mode: 'starter' | 'professional' | 'refiner' = 'starter'): PromptState {
  return {
    session: {
      id: crypto.randomUUID(),
      lang: 'ko',
      market: 'KR',
    },
    mode,
    brand: {
      service_domain: '',
      keywords: {
        primary: '',
        secondary: [],
      },
      naming: {
        selected_candidates: [],
        final_name: '',
      },
      logo: {
        text: '',
        colors: {
          primary: '#000000',
          secondary: ['#FFFFFF', '#CCCCCC'],
        },
        style_pick: {
          primary: '',
          secondary: [],
        },
      },
      card: {
        info: {
          name: '',
          title: '',
          company: '',
          phone: '',
          email: '',
          address: '',
          domain: '',
        },
        qr: {
          enabled: true,
          url: '',
        },
      },
    },
    constraints: {
      avoid_words: [],
      profanity_block: true,
    },
  };
}
