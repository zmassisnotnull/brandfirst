import { Upload, Scan, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { CreditConfirmModal } from './CreditConfirmModal';
import { CheckCircle2, Clock } from 'lucide-react';
import { LogoPreview } from './LogoPreview';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { useState } from 'react';

interface CardCreationChoiceProps {
  onNavigate: (page: string) => void;
  onChoiceSelect: (choice: 'upgrader' | 'professional' | 'starter') => void;
  user?: any;
  userCredits?: number;
  onOpenAuthModal?: () => void;
  onCreditsUpdate?: () => void; // 크레딧 갱신 콜백
  selectedLogoUrl?: string | null;
  selectedLogoData?: any;
}

export function CardCreationChoice({
  onNavigate,
  onChoiceSelect,
  user,
  userCredits,
  onOpenAuthModal,
  onCreditsUpdate,
  selectedLogoUrl,
  selectedLogoData,
}: CardCreationChoiceProps) {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<'starter' | 'professional' | 'upgrader' | null>(null);

  const choices = [
    {
      id: 'starter',
      title: 'The Starter',
      subtitle: '로고+단면 명함+디지털화',
      credits: '20,000 크레딧',
      description: '처음부터 AI가 모든 것을 만드는 단면 명함',
      icon: <Sparkles className="w-12 h-12" />,
      color: 'emerald',
      features: [
        '직업 키워드만 입력',
        'AI가 로고 3종 자동 생성',
        '로고 기반 단면 명함 자동 완성',
        '브랜딩 전체 솔루션',
      ],
      buttonText: 'AI 명함 생성하기',
      badge: '추천',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      id: 'professional',
      title: 'The Professional',
      subtitle: '심볼마크+로고+양면 명함+디지털화',
      credits: '35,000 크레딧',
      description: '심볼마크와 로고에 맞춘 전문가급 양면 명함',
      icon: <Upload className="w-12 h-12" />,
      color: 'purple',
      features: [
        '마크의 주색상 자동 추출 및 적용',
        '로고 형태 분석 및 배열 (가로/세로)',
        '어울리는 레이아웃 3종 추천',
        '브랜드 아이덴티티 유지 양면 명함 완성',
      ],
      buttonText: 'AI 명함 생성하기',
      badge: null,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'upgrader',
      title: 'The Rebuilder',
      subtitle: '명함+재생성+디지털화',
      credits: '15,000 크레딧',
      description: '이미 있는 명함을 데이터화+디지털화 합니다',
      icon: <Scan className="w-12 h-12" />,
      color: 'blue',
      features: [
        '명함 사진 한 장으로 자동 정보 추출',
        'AI Vision OCR로 텍스트 자동 인식',
        '기존 로고 영역 감지 및 추출',
        '1분 만에 디지털화 완료',
      ],
      buttonText: '내 명함 사용하기',
      badge: null,
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const handleSelect = (id: string) => {
    // 로그인 체크
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        alert('로그인이 필요합니다.');
      }
      return;
    }

    // 크레딧 요구량 결정
    const creditRequirements: { [key: string]: number } = {
      'starter': 20000,
      'professional': 35000,
      'upgrader': 15000,
    };
    
    const requiredCredits = creditRequirements[id] || 0;
    
    // 크레딧 체크
    if (userCredits === undefined || userCredits < requiredCredits) {
      alert(`크레딧이 부족합니다. ${requiredCredits.toLocaleString()} 크레딧이 필요합니다.`);
      onNavigate('pricing');
      return;
    }
    
    // 크레딧 확인 모달 열기
    setPendingChoice(id as 'starter' | 'professional' | 'upgrader');
    setShowCreditModal(true);
  };

  const handleCreditConfirm = async () => {
    if (!pendingChoice) return;
    
    setShowCreditModal(false);
    
    const creditRequirements: { [key: string]: number } = {
      'starter': 20000,
      'professional': 35000,
      'upgrader': 15000,
    };
    
    const requiredCredits = creditRequirements[pendingChoice] || 0;
    
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        }
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/deduct-credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify({
            userId: session.user.id,
            amount: requiredCredits,
            service: 'card',
            serviceType: pendingChoice,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '크레딧 차감에 실패했습니다.');
      }
      
      // 크레딧 갱신
      if (onCreditsUpdate) {
        onCreditsUpdate();
      }
      
      // 크레딧 차감 성공 - 다음 페이지로 이동
      if (pendingChoice === 'upgrader') {
        onChoiceSelect('upgrader');
        onNavigate('upgrader');
      } else if (pendingChoice === 'professional') {
        onChoiceSelect('professional');
        onNavigate('professional');
      } else if (pendingChoice === 'starter') {
        onChoiceSelect('starter');
        onNavigate('logo-starter');
      }
    } catch (error) {
      console.error('Credit deduction error:', error);
      alert(error instanceof Error ? error.message : '크레딧 차감 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              어떤 방식으로 명함을 만드시겠어요?
            </h2>
            <p className="text-lg text-gray-600">
              3가지 방식 중 하나를 선택하시면, AI가 최적의 결과물을 만들어드립니다
            </p>
          </div>

          {selectedLogoUrl && (
            <Card className="p-5 mb-8 border-2 border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden shrink-0">
                  <LogoPreview
                    logo={{ ...selectedLogoData, logoUrl: selectedLogoUrl }}
                    className="w-full h-full flex items-center justify-center"
                    imageClassName="w-full h-full object-contain"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-emerald-700">선택한 로고가 적용됩니다</p>
                  <p className="text-base font-bold text-gray-900">{selectedLogoData?.brandName || '선택된 로고'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Choice Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {choices.map((choice) => (
              <Card
                key={choice.id}
                onClick={() => handleSelect(choice.id)}
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
              >
                {/* Badge */}
                {choice.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white shadow-lg`}>
                      {choice.badge}
                    </span>
                  </div>
                )}

                {/* Header with Gradient */}
                <div className={`bg-gradient-to-br ${choice.gradient} p-8 text-white`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {choice.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{choice.title}</h3>
                    <p className="text-white/90 text-sm font-medium mb-2">{choice.subtitle}</p>
                    <div className="text-3xl font-bold">{choice.credits}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    {choice.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {choice.features.map((feature) => (
                      <li key={`${choice.id}-${feature}`} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className={`mt-0.5`}>•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Button */}
                  <Button
                    className={`w-full bg-gradient-to-r ${choice.gradient} hover:opacity-90 font-semibold`}
                  >
                    {choice.buttonText}
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold mb-2">아무것도 없다면</h4>
              <p className="text-sm text-gray-600">The Starter로 AI가 모두 만들어드립니다</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">로고 파일이 있다면</h4>
              <p className="text-sm text-gray-600">The Professional로 업로드하세요</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scan className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">이미 명함이 있다면</h4>
              <p className="text-sm text-gray-600">The Rebuilder로 디지털화 합니다</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* 크레딧 확인 모달 */}
      <CreditConfirmModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditConfirm}
        serviceName={
          pendingChoice === 'starter' ? 'The Starter' :
          pendingChoice === 'professional' ? 'The Professional' : 'The Upgrader'
        }
        serviceType={
          pendingChoice === 'starter' ? '로고+단면 명함+디지털화' :
          pendingChoice === 'professional' ? '심볼마크+로고+양면 명함+디지털화' : '명함 업그레이드'
        }
        requiredCredits={
          pendingChoice === 'starter' ? 20000 :
          pendingChoice === 'professional' ? 35000 : 15000
        }
        currentCredits={userCredits || 0}
        gradient={
          pendingChoice === 'starter' ? 'from-emerald-500 to-teal-500' :
          pendingChoice === 'professional' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'
        }
      />
    </div>
  );
}
