/**
 * 자동 명함 제작 페이지
 * - 정보 입력 → AI 자동 3시안 생성 → 선택 → PDF 생성 → 출고
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CardInfoForm } from '../../features/branding/card-auto/CardInfoForm';
import { CardConceptPicker } from '../../features/branding/card-auto/CardConceptPicker';
import { autoGenerate3Drafts } from '../../features/branding/card-auto/layoutEngine';
import { ensureFontLoaded } from '../../features/branding/card-auto/fontMetrics';
import type { CardInfo, CardDraft } from '../../features/branding/card-auto/types';
import QRCode from 'qrcode';

interface AutoCardMakerPageProps {
  onNavigate?: (page: string) => void;
}

export default function AutoCardMakerPage({ onNavigate }: AutoCardMakerPageProps) {
  const [step, setStep] = useState<'input' | 'select' | 'complete'>('input');
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState<CardDraft[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const logoFontFamily = 'Inter';
  const bodyFontFamily = 'Inter';
  
  // Mock data - 실제로는 props나 context에서 받아옴
  const logoAspect = 2.8; // w/h ratio
  const logoSvgPath = 'M10,15 L50,15 L50,35 L10,35 Z'; // Mock SVG path
  
  const handleSubmit = async (info: CardInfo, qrEnabled: boolean) => {
    setLoading(true);
    
    try {
      // QR 코드 생성
      let qrUrl = '';
      if (qrEnabled && info.domain) {
        qrUrl = await QRCode.toDataURL(`https://${info.domain}`, {
          width: 512,
          margin: 1,
        });
        setQrDataUrl(qrUrl);
      }
      
      // 폰트 로드 대기
      await ensureFontLoaded(logoFontFamily);
      await ensureFontLoaded(bodyFontFamily);
      
      // 자동 3시안 생성
      const generated = await autoGenerate3Drafts({
        cardInfo: info,
        qrEnabled,
        logoAspect,
        logoFontFamily,
        bodyFontFamily,
      });
      
      console.log('Generated drafts:', generated);
      
      if (generated.length === 0) {
        toast.error('시안 생성에 실패했습니다. 입력 정보를 확인해주세요.');
        return;
      }
      
      setDrafts(generated);
      setStep('select');
      
      toast.success(`${generated.length}개의 시안이 생성되었습니다!`);
    } catch (error: any) {
      console.error('Draft generation error:', error);
      toast.error(error.message || '시안 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegenerate = () => {
    setStep('input');
    setDrafts([]);
    setQrDataUrl('');
  };
  
  const handleComplete = () => {
    toast.success('명함 제작이 완료되었습니다!');
    setStep('complete');
  };
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI 자동 명함 제작</h1>
          <p className="text-muted-foreground">
            정보만 입력하면 AI가 자동으로 3가지 디자인을 만들어드립니다
          </p>
        </div>
        
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step === 'input' ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'input'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">정보 입력</span>
            </div>
            
            <div className="flex-1 h-px bg-muted" />
            
            <div
              className={`flex items-center gap-2 ${
                step === 'select' ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'select'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">시안 선택</span>
            </div>
            
            <div className="flex-1 h-px bg-muted" />
            
            <div
              className={`flex items-center gap-2 ${
                step === 'complete' ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'complete'
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">완료</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        {step === 'input' && (
          <div className="max-w-2xl mx-auto">
            <CardInfoForm onSubmit={handleSubmit} loading={loading} />
          </div>
        )}
        
        {step === 'select' && (
          <CardConceptPicker
            drafts={drafts}
            logoSvgPath={logoSvgPath}
            qrDataUrl={qrDataUrl}
            logoFontFamily={logoFontFamily}
            bodyFontFamily={bodyFontFamily}
            onRegenerate={handleRegenerate}
            onComplete={handleComplete}
          />
        )}
        
        {step === 'complete' && (
          <div className="max-w-2xl mx-auto">
            <div className="p-8 border rounded-xl text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Completion check icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-2">모든 과정이 완료되었습니다!</h2>
                <p className="text-muted-foreground">
                  명함 제작 요청이 성공적으로 제출되었습니다
                </p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate?.('box')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  마이 브랜딩 박스로 이동
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRegenerate()}
                  className="px-6 py-3 border rounded-lg hover:bg-muted"
                >
                  새 명함 만들기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
