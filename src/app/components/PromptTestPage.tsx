/**
 * 프롬프트 엔지니어링 시스템 테스트 페이지
 * 개발 및 디버깅용
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PromptOrchestrator, WorkflowState } from '../utils/prompt-orchestration';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { AlertCircle, CheckCircle, Loader2, Play, RotateCcw } from 'lucide-react';

export function PromptTestPage() {
  const [orchestrator] = useState(() => new PromptOrchestrator(projectId, publicAnonKey, 'starter'));
  const [serviceDomain, setServiceDomain] = useState('IT 서비스');
  const [mode, setMode] = useState<'starter' | 'professional' | 'refiner'>('starter');
  
  const [currentStep, setCurrentStep] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);

  const handleReset = () => {
    setCurrentStep('');
    setResult(null);
    setError(null);
    setWorkflowState(null);
  };

  const executeStep = async (stepName: string, executor: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    setCurrentStep(stepName);
    
    try {
      const stepResult = await executor();
      setResult(stepResult);
      setWorkflowState(orchestrator.getState());
      console.log(`✅ ${stepName} 완료:`, stepResult);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
      console.error(`❌ ${stepName} 실패:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleN1 = async () => {
    // 서비스 분야 설정
    orchestrator.updateState({
      brand: {
        ...orchestrator.getState().state.brand,
        service_domain: serviceDomain,
      },
    });
    
    await executeStep('N1: 키워드 제시', () => orchestrator.executeN1_Keywords());
  };

  const handleN2 = async () => {
    // 키워드 선택 (자동으로 첫 번째 선택)
    if (result?.keywords?.[0]) {
      orchestrator.updateState({
        brand: {
          ...orchestrator.getState().state.brand,
          keywords: {
            primary: result.keywords[0].keyword,
            secondary: result.auto_recommend.secondary,
          },
        },
      });
    }
    
    await executeStep('N2: 네이밍 시안 생성', () => orchestrator.executeN2_NamingVariants());
  };

  const handleN3 = async () => {
    if (!result?.handoff?.domain_check_names) {
      setError('N2 단계를 먼저 실행해주세요.');
      return;
    }
    
    await executeStep('N3: 도메인 체크 요청', () => 
      orchestrator.executeN3_DomainCheck(result.handoff.domain_check_names)
    );
  };

  const handleL1 = async () => {
    await executeStep('L1: 컬러 팔레트 제시', () => orchestrator.executeL1_Colors());
  };

  const handleL2 = async () => {
    // 컬러 선택 (자동으로 첫 번째 선택)
    if (result?.palette9?.[0]) {
      orchestrator.updateState({
        brand: {
          ...orchestrator.getState().state.brand,
          logo: {
            ...orchestrator.getState().state.brand.logo,
            colors: {
              primary: result.palette9[0].hex,
              secondary: result.auto_recommend.secondary,
            },
          },
        },
      });
    }
    
    await executeStep('L2: 스타일 제시', () => orchestrator.executeL2_Styles());
  };

  const handleL3 = async () => {
    // 스타일 선택 (자동으로 첫 번째 선택)
    if (result?.style_options?.[0]) {
      orchestrator.updateState({
        brand: {
          ...orchestrator.getState().state.brand,
          logo: {
            ...orchestrator.getState().state.brand.logo,
            style_pick: {
              primary: result.style_options[0].style,
              secondary: result.auto_recommend.secondary,
            },
          },
        },
      });
    }
    
    await executeStep('L3: 로고 프롬프트 생성', () => orchestrator.executeL3_LogoPrompts());
  };

  const handleC2 = async () => {
    const mockOCR = '홍길동\n대표이사\n브랜딩허브\n010-1234-5678\nhong@brandinghub.com';
    await executeStep('C2: 정보 정규화', () => orchestrator.executeC2_InfoNormalize(mockOCR));
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">프롬프트 엔지니어링 테스트</h1>
            <p className="text-gray-600">각 단계별 프롬프트 실행 및 결과 확인</p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 컨트롤 패널 */}
          <div className="space-y-6">
            {/* 설정 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">설정</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>서비스 분야</Label>
                  <Input
                    value={serviceDomain}
                    onChange={(e) => setServiceDomain(e.target.value)}
                    placeholder="예: IT 서비스, 카페, 디자인 스튜디오"
                  />
                </div>

                <div>
                  <Label>모드</Label>
                  <div className="flex gap-2 mt-2">
                    {(['starter', 'professional', 'refiner'] as const).map((m) => (
                      <Button
                        key={m}
                        variant={mode === m ? 'default' : 'outline'}
                        onClick={() => setMode(m)}
                        size="sm"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 단계별 실행 */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">단계별 실행</h2>
              
              <Tabs defaultValue="naming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="naming">네이밍</TabsTrigger>
                  <TabsTrigger value="logo">로고</TabsTrigger>
                  <TabsTrigger value="card">명함</TabsTrigger>
                </TabsList>

                <TabsContent value="naming" className="space-y-2 mt-4">
                  <Button
                    onClick={handleN1}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'N1: 키워드 제시' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'N1: 키워드 제시' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    N1: 키워드 제시
                  </Button>

                  <Button
                    onClick={handleN2}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'N2: 네이밍 시안 생성' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'N2: 네이밍 시안 생성' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    N2: 네이밍 시안 생성
                  </Button>

                  <Button
                    onClick={handleN3}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'N3: 도메인 체크 요청' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'N3: 도메인 체크 요청' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    N3: 도메인 체크 요청
                  </Button>
                </TabsContent>

                <TabsContent value="logo" className="space-y-2 mt-4">
                  <Button
                    onClick={handleL1}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'L1: 컬러 팔레트 제시' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'L1: 컬러 팔레트 제시' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    L1: 컬러 팔레트 제시
                  </Button>

                  <Button
                    onClick={handleL2}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'L2: 스타일 제시' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'L2: 스타일 제시' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    L2: 스타일 제시
                  </Button>

                  <Button
                    onClick={handleL3}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'L3: 로고 프롬프트 생성' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'L3: 로고 프롬프트 생성' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    L3: 로고 프롬프트 생성
                  </Button>
                </TabsContent>

                <TabsContent value="card" className="space-y-2 mt-4">
                  <Button
                    onClick={handleC2}
                    disabled={loading}
                    className="w-full justify-start"
                    variant={currentStep === 'C2: 정보 정규화' ? 'default' : 'outline'}
                  >
                    {loading && currentStep === 'C2: 정보 정규화' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    C2: 정보 정규화 (Mock OCR)
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* 결과 패널 */}
          <div className="space-y-6">
            {/* 현재 단계 */}
            {currentStep && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : error ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <h3 className="text-lg font-semibold">{currentStep}</h3>
                </div>
                
                {loading && (
                  <p className="text-gray-600">실행 중...</p>
                )}
              </Card>
            )}

            {/* 에러 */}
            {error && (
              <Card className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">오류 발생</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* 결과 */}
            {result && !loading && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">실행 결과</h3>
                <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                  <pre className="text-xs text-gray-800">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </Card>
            )}

            {/* 워크플로우 상태 */}
            {workflowState && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">워크플로우 상태</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">현재 단계</Label>
                    <p className="font-medium">{workflowState.currentStep}</p>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">실행 히스토리</Label>
                    <div className="mt-2 space-y-2">
                      {workflowState.history.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{h.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">브랜드 상태</Label>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="text-gray-600">서비스 분야:</span> {workflowState.state.brand.service_domain || '-'}</p>
                      <p><span className="text-gray-600">키워드:</span> {workflowState.state.brand.keywords.primary || '-'}</p>
                      <p><span className="text-gray-600">최종 네이밍:</span> {workflowState.state.brand.naming.final_name || '-'}</p>
                      <p><span className="text-gray-600">로고 텍스트:</span> {workflowState.state.brand.logo.text || '-'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
