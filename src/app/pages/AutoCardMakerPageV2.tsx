/**
 * 자동 명함 제작 페이지 V2 (양면 지원)
 * - Starter: 단면만
 * - Professional: 양면 필수
 * - Refiner: 사용자 선택
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { CardInfoForm } from '../../features/branding/card-auto/CardInfoForm';
import { CardConceptPickerDouble } from '../../features/branding/card-auto/CardConceptPickerDouble';
import type { CardInfo } from '../../features/branding/card-auto/types';
import { Sparkles, CreditCard, Layers, Check } from 'lucide-react';

interface AutoCardMakerPageV2Props {
  onNavigate?: (page: string) => void;
}

type Mode = 'starter' | 'professional' | 'refiner';
type Step = 'mode' | 'input' | 'generate' | 'complete';

export default function AutoCardMakerPageV2({ onNavigate }: AutoCardMakerPageV2Props) {
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<Mode>('professional');
  const [isDoubleSided, setIsDoubleSided] = useState(false);
  
  const [cardInfo, setCardInfo] = useState<CardInfo>({});
  const [qrEnabled, setQrEnabled] = useState(true);
  
  const project_id = 'auto-card-project';
  const typography_kit_id = 'default-typography-kit';
  const logo_asset_id = 'default-logo-asset';
  
  const handleModeSelect = (selectedMode: Mode) => {
    setMode(selectedMode);
    
    // Starter/Professional은 단/양면 강제
    if (selectedMode === 'starter') {
      setIsDoubleSided(false);
    } else if (selectedMode === 'professional') {
      setIsDoubleSided(true);
    }
    // Refiner는 사용자 선택
    
    setStep('input');
  };
  
  const handleInfoSubmit = (info: CardInfo, qr: boolean) => {
    setCardInfo(info);
    setQrEnabled(qr);
    setStep('generate');
  };
  
  const handleComplete = () => {
    toast.success('명함 제작이 완료되었습니다!');
    setStep('complete');
  };
  
  // ========== 렌더링 ==========
  
  // Step 1: 모드 선택
  if (step === 'mode') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">AI 자동 명함 제작</h1>
            <p className="text-lg text-muted-foreground">
              먼저 명함 제작 모드를 선택해주세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-2"
              onClick={() => handleModeSelect('starter')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Starter</h3>
                  <Badge className="mb-3">단면 전용</Badge>
                  <p className="text-sm text-muted-foreground">
                    단면 명함 3종 자동 생성
                  </p>
                </div>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>앞면 정보만 입력</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>3가지 디자인 자동 생성</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>1페이지 PDF 출력</span>
                  </li>
                </ul>
                
                <Button className="w-full" variant="outline">
                  Starter 선택
                </Button>
              </div>
            </Card>
            
            {/* Professional */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-blue-500 relative"
              onClick={() => handleModeSelect('professional')}
            >
              <Badge className="absolute top-4 right-4 bg-blue-600">추천</Badge>
              
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Layers className="w-8 h-8 text-purple-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Professional</h3>
                  <Badge variant="outline" className="mb-3">양면 필수</Badge>
                  <p className="text-sm text-muted-foreground">
                    앞/뒷면 각 3종 자동 생성
                  </p>
                </div>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>앞면 3종 + 뒷면 3종</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>각 면에서 1개씩 선택</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>2페이지 PDF 출력</span>
                  </li>
                </ul>
                
                <Button className="w-full">
                  Professional 선택
                </Button>
              </div>
            </Card>
            
            {/* Refiner */}
            <Card
              className="p-6 cursor-pointer hover:shadow-lg transition-all border-2"
              onClick={() => handleModeSelect('refiner')}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">Refiner</h3>
                  <Badge variant="secondary" className="mb-3">자유 선택</Badge>
                  <p className="text-sm text-muted-foreground">
                    단/양면을 자유롭게 선택
                  </p>
                </div>
                
                <ul className="text-sm text-left space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>단면 또는 양면 선택 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>기존 명함 업로드 분석</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>유연한 커스터마이징</span>
                  </li>
                </ul>
                
                <Button className="w-full" variant="outline">
                  Refiner 선택
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  // Step 2: 정보 입력
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setStep('mode')}
              className="mb-4"
            >
              ← 모드 변경
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">명함 정보 입력</h1>
              <Badge>{mode === 'starter' ? '단면' : mode === 'professional' ? '양면' : '자유 선택'}</Badge>
            </div>
            <p className="text-muted-foreground">
              AI가 자동으로 3가지 디자인을 생성합니다
            </p>
          </div>
          
          {/* Refiner: 단/양면 선택 */}
          {mode === 'refiner' && (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="double-sided" className="text-base font-medium">
                  양면 명함으로 제작
                </Label>
                <Switch
                  id="double-sided"
                  checked={isDoubleSided}
                  onCheckedChange={setIsDoubleSided}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isDoubleSided
                  ? '앞면 3종 + 뒷면 3종이 생성됩니다'
                  : '앞면 3종만 생성됩니다'}
              </p>
            </Card>
          )}
          
          {/* Form */}
          <CardInfoForm onSubmit={handleInfoSubmit} loading={false} />
        </div>
      </div>
    );
  }
  
  // Step 3: 시안 생성 & 선택
  if (step === 'generate') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setStep('input')}
              className="mb-4"
            >
              ← 정보 수정
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">시안 선택</h1>
              <Badge>{isDoubleSided ? '양면 (앞 3종 + 뒤 3종)' : '단면 (앞 3종)'}</Badge>
            </div>
            <p className="text-muted-foreground">
              AI가 생성한 디자인 중 마음에 드는 것을 선택하세요
            </p>
          </div>
          
          {/* Picker */}
          <CardConceptPickerDouble
            project_id={project_id}
            typography_kit_id={typography_kit_id}
            logo_asset_id={logo_asset_id}
            card_info={cardInfo}
            qr_enabled={qrEnabled}
            is_double_sided={isDoubleSided}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }
  
  // Step 4: 완료
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <Card className="p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold mb-3">모든 과정이 완료되었습니다!</h2>
            <p className="text-lg text-muted-foreground mb-8">
              명함 제작 요청이 성공적으로 제출되었습니다
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => onNavigate?.('box')}
              >
                마이 브랜딩 박스로 이동
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setStep('mode');
                  setCardInfo({});
                }}
              >
                새 명함 만들기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return null;
}
