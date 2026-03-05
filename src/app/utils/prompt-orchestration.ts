/**
 * 프롬프트 오케스트레이션
 * 네이밍 → 로고 → 명함 → QR 플로우 실행
 */

import type { PromptState } from './prompt-contracts';
import { createInitialPromptState } from './prompt-contracts';
import { PromptEngine, createDefaultPromptEngine } from './prompt-engine';
import * as NamingPrompts from './naming-prompts';
import * as LogoPrompts from './logo-prompts';
import * as CardPrompts from './card-prompts';

export type WorkflowStep = 
  | 'N1_keywords' 
  | 'N2_naming_variants'
  | 'N3_domain_check'
  | 'N4_domain_rerank'
  | 'N5_trademark_guide'
  | 'L1_colors'
  | 'L2_styles'
  | 'L3_logo_prompts'
  | 'C1_layout_directions'
  | 'C2_info_normalize'
  | 'C3_card_layouts'
  | 'QR1_digital_card';

export interface WorkflowState {
  state: PromptState;
  currentStep: WorkflowStep;
  history: Array<{
    step: WorkflowStep;
    timestamp: string;
    result: any;
  }>;
}

/**
 * 프롬프트 오케스트레이터
 */
export class PromptOrchestrator {
  private engine: PromptEngine;
  private workflowState: WorkflowState;

  constructor(projectId: string, apiKey: string, mode: 'starter' | 'professional' | 'refiner' = 'starter') {
    this.engine = createDefaultPromptEngine(projectId, apiKey);
    this.workflowState = {
      state: createInitialPromptState(mode),
      currentStep: 'N1_keywords',
      history: [],
    };
  }

  /**
   * 현재 상태 가져오기
   */
  getState(): WorkflowState {
    return this.workflowState;
  }

  /**
   * 상태 업데이트
   */
  updateState(updates: Partial<PromptState>): void {
    this.workflowState.state = {
      ...this.workflowState.state,
      ...updates,
    };
  }

  /**
   * 히스토리에 기록
   */
  private recordHistory(step: WorkflowStep, result: any): void {
    this.workflowState.history.push({
      step,
      timestamp: new Date().toISOString(),
      result,
    });
  }

  /**
   * N1) 키워드 제시 실행
   */
  async executeN1_Keywords(): Promise<NamingPrompts.N1Response> {
    const prompt = NamingPrompts.createN1Prompt(this.workflowState.state);
    const response = await this.engine.execute<NamingPrompts.N1Response>(prompt);
    
    this.recordHistory('N1_keywords', response.data);
    this.workflowState.currentStep = 'N2_naming_variants';
    
    return response.data;
  }

  /**
   * N2) 네이밍 시안 3종 생성
   */
  async executeN2_NamingVariants(): Promise<NamingPrompts.N2Response> {
    const prompt = NamingPrompts.createN2Prompt(this.workflowState.state);
    const response = await this.engine.execute<NamingPrompts.N2Response>(prompt);
    
    this.recordHistory('N2_naming_variants', response.data);
    this.workflowState.currentStep = 'N3_domain_check';
    
    return response.data;
  }

  /**
   * N3) 도메인 체크 요청 생성
   */
  async executeN3_DomainCheck(domainCheckNames: string[]): Promise<NamingPrompts.N3Response> {
    const prompt = NamingPrompts.createN3Prompt(this.workflowState.state, domainCheckNames);
    const response = await this.engine.execute<NamingPrompts.N3Response>(prompt);
    
    this.recordHistory('N3_domain_check', response.data);
    this.workflowState.currentStep = 'N4_domain_rerank';
    
    return response.data;
  }

  /**
   * N4) 도메인 결과 기반 재랭킹
   */
  async executeN4_DomainRerank(topPicks: string[], domainResults: NamingPrompts.DomainResult[]): Promise<NamingPrompts.N4Response> {
    const prompt = NamingPrompts.createN4Prompt(topPicks, domainResults);
    const response = await this.engine.execute<NamingPrompts.N4Response>(prompt);
    
    // 최종 네이밍 상태 업데이트
    this.updateState({
      brand: {
        ...this.workflowState.state.brand,
        naming: {
          ...this.workflowState.state.brand.naming,
          final_name: response.data.handoff.final_name,
        },
        logo: {
          ...this.workflowState.state.brand.logo,
          text: response.data.handoff.logo_text,
        },
      },
    });
    
    this.recordHistory('N4_domain_rerank', response.data);
    this.workflowState.currentStep = 'N5_trademark_guide';
    
    return response.data;
  }

  /**
   * N5) 상표 검색 가이드
   */
  async executeN5_TrademarkGuide(): Promise<NamingPrompts.N5Response> {
    const prompt = NamingPrompts.createN5Prompt(this.workflowState.state);
    const response = await this.engine.execute<NamingPrompts.N5Response>(prompt);
    
    this.recordHistory('N5_trademark_guide', response.data);
    this.workflowState.currentStep = 'L1_colors';
    
    return response.data;
  }

  /**
   * L1) 컬러 9종 제시
   */
  async executeL1_Colors(): Promise<LogoPrompts.L1Response> {
    const prompt = LogoPrompts.createL1Prompt(this.workflowState.state);
    const response = await this.engine.execute<LogoPrompts.L1Response>(prompt);
    
    this.recordHistory('L1_colors', response.data);
    this.workflowState.currentStep = 'L2_styles';
    
    return response.data;
  }

  /**
   * L2) 스타일 제시
   */
  async executeL2_Styles(): Promise<LogoPrompts.L2Response> {
    const prompt = LogoPrompts.createL2Prompt(this.workflowState.state);
    const response = await this.engine.execute<LogoPrompts.L2Response>(prompt);
    
    this.recordHistory('L2_styles', response.data);
    this.workflowState.currentStep = 'L3_logo_prompts';
    
    return response.data;
  }

  /**
   * L3) 로고 시안 3종 프롬프트 생성
   */
  async executeL3_LogoPrompts(): Promise<LogoPrompts.L3Response> {
    const prompt = LogoPrompts.createL3Prompt(this.workflowState.state);
    const response = await this.engine.execute<LogoPrompts.L3Response>(prompt);
    
    this.recordHistory('L3_logo_prompts', response.data);
    this.workflowState.currentStep = 'C1_layout_directions';
    
    return response.data;
  }

  /**
   * C1) 레이아웃 방향 제시
   */
  async executeC1_LayoutDirections(logoObservation: string): Promise<CardPrompts.C1Response> {
    const prompt = CardPrompts.createC1Prompt(logoObservation, this.workflowState.state.brand.keywords);
    const response = await this.engine.execute<CardPrompts.C1Response>(prompt);
    
    this.recordHistory('C1_layout_directions', response.data);
    this.workflowState.currentStep = 'C2_info_normalize';
    
    return response.data;
  }

  /**
   * C2) 정보 입력 정규화
   */
  async executeC2_InfoNormalize(rawText: string): Promise<CardPrompts.C2Response> {
    const prompt = CardPrompts.createC2Prompt(rawText);
    const response = await this.engine.execute<CardPrompts.C2Response>(prompt);
    
    // 명함 정보 상태 업데이트
    this.updateState({
      brand: {
        ...this.workflowState.state.brand,
        card: {
          ...this.workflowState.state.brand.card,
          info: {
            name: response.data.card_info.name.value,
            title: response.data.card_info.title.value,
            company: response.data.card_info.company.value,
            phone: response.data.card_info.phone.value,
            email: response.data.card_info.email.value,
            address: response.data.card_info.address.value,
            domain: response.data.card_info.domain.value,
          },
        },
      },
    });
    
    this.recordHistory('C2_info_normalize', response.data);
    this.workflowState.currentStep = 'C3_card_layouts';
    
    return response.data;
  }

  /**
   * C3) 명함 레이아웃 3종 생성
   */
  async executeC3_CardLayouts(
    logoShape: 'wide' | 'square' | 'tall',
    directionPick: 'A' | 'B' | 'C'
  ): Promise<CardPrompts.C3Response> {
    const prompt = CardPrompts.createC3Prompt(
      logoShape,
      this.workflowState.state.brand.logo.colors,
      this.workflowState.state.brand.card.info,
      directionPick
    );
    const response = await this.engine.execute<CardPrompts.C3Response>(prompt);
    
    this.recordHistory('C3_card_layouts', response.data);
    this.workflowState.currentStep = 'QR1_digital_card';
    
    return response.data;
  }

  /**
   * QR1) 디지털 명함 스펙 생성
   */
  async executeQR1_DigitalCard(): Promise<CardPrompts.QR1Response> {
    const prompt = CardPrompts.createQR1Prompt(
      this.workflowState.state.brand.card.info,
      this.workflowState.state.brand.naming.final_name,
      this.workflowState.state.brand.logo.colors,
      this.workflowState.state.brand.card.info.domain
    );
    const response = await this.engine.execute<CardPrompts.QR1Response>(prompt);
    
    // QR 정보 업데이트
    this.updateState({
      brand: {
        ...this.workflowState.state.brand,
        card: {
          ...this.workflowState.state.brand.card,
          qr: {
            enabled: true,
            url: response.data.digital_card.share.qr_target_url,
          },
        },
      },
    });
    
    this.recordHistory('QR1_digital_card', response.data);
    
    return response.data;
  }

  /**
   * 전체 플로우 실행 (자동화)
   */
  async executeFullWorkflow(): Promise<WorkflowState> {
    try {
      // N1 ~ N5: 네이밍
      const n1 = await this.executeN1_Keywords();
      console.log('✅ N1 완료:', n1);

      const n2 = await this.executeN2_NamingVariants();
      console.log('✅ N2 완료:', n2);

      const n3 = await this.executeN3_DomainCheck(n2.handoff.domain_check_names);
      console.log('✅ N3 완료:', n3);

      // 여기서 실제 도메인 조회 API 호출 필요
      // const domainResults = await callDomainCheckAPI(n3.domain_requests);
      
      // 임시 mock 데이터
      const domainResults: NamingPrompts.DomainResult[] = n2.handoff.domain_check_names.map(name => ({
        fqdn: `${name}.com`,
        available: Math.random() > 0.5,
        price: 15,
        notes: '',
      }));

      const n4 = await this.executeN4_DomainRerank(n2.top_picks, domainResults);
      console.log('✅ N4 완료:', n4);

      const n5 = await this.executeN5_TrademarkGuide();
      console.log('✅ N5 완료:', n5);

      // L1 ~ L3: 로고
      const l1 = await this.executeL1_Colors();
      console.log('✅ L1 완료:', l1);

      const l2 = await this.executeL2_Styles();
      console.log('✅ L2 완료:', l2);

      const l3 = await this.executeL3_LogoPrompts();
      console.log('✅ L3 완료:', l3);

      // C1 ~ C3: 명함
      const c1 = await this.executeC1_LayoutDirections('로고 분석 결과...');
      console.log('✅ C1 완료:', c1);

      const c2 = await this.executeC2_InfoNormalize('홍길동\n대표이사\n010-1234-5678\nhong@example.com');
      console.log('✅ C2 완료:', c2);

      const c3 = await this.executeC3_CardLayouts('wide', 'A');
      console.log('✅ C3 완료:', c3);

      // QR1: 디지털 명함
      const qr1 = await this.executeQR1_DigitalCard();
      console.log('✅ QR1 완료:', qr1);

      return this.workflowState;
    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      throw error;
    }
  }
}
