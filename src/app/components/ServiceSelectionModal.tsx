import { useState } from 'react';
import { X, Sparkles, Zap, Rocket, Crown, ChevronDown, ChevronRight, Type, CreditCard, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Plan {
  id: 'starter' | 'professional' | 'rebuilder';
  title: string;
  subtitle: string;
  credits: number;
  description: string;
  features: string[];
  gradient: string;
  icon: React.ReactNode;
  popular?: boolean;
}

interface ServiceSelectionModalProps {
  serviceType: 'naming' | 'logo' | 'card';
  userCredits?: number;
  userPackage?: string | null;
  onClose: () => void;
  onConfirm: (service: any) => void;
  onNavigate?: (page: string) => void;
}

export function ServiceSelectionModal({ 
  serviceType, 
  userCredits = 0, 
  userPackage, 
  onClose, 
  onConfirm,
  onNavigate,
}: ServiceSelectionModalProps) {
  const [showAllPlans, setShowAllPlans] = useState(false);
  
  // 3가지 플랜 정의
  const plans: Plan[] = [
    {
      id: 'starter',
      title: 'The Starter',
      subtitle: '처음 시작하는',
      credits: serviceType === 'naming' ? 1500 : serviceType === 'logo' ? 5000 : 20000,
      description: '새롭게 브랜드를 시작하시는 분들을 위한 기본 플랜',
      features: [
        'AI 기반 기본 생성',
        '빠른 제작 시간',
        '필수 기능 포함',
        '커뮤니티 지원',
      ],
      gradient: 'from-blue-500 to-blue-600',
      icon: <Zap className="w-8 h-8 text-white" />,
    },
    {
      id: 'professional',
      title: 'The Professional',
      subtitle: '전문적으로',
      credits: serviceType === 'naming' ? 2500 : serviceType === 'logo' ? 15000 : 35000,
      description: '더 정교하고 전문적인 결과물을 원하시는 분들을 위한 플랜',
      features: [
        'AI 고급 알고리즘 적용',
        '다양한 옵션 제공',
        '프리미엄 결과물',
        '우선 지원 (24시간 내)',
      ],
      gradient: 'from-purple-500 to-purple-600',
      icon: <Rocket className="w-8 h-8 text-white" />,
      popular: true,
    },
    {
      id: 'rebuilder',
      title: 'The Rebuilder',
      subtitle: '완전히 새롭게',
      credits: serviceType === 'naming' ? 500 : serviceType === 'logo' ? 10000 : 15000,
      description: '기존 브랜드를 완전히 리뉴얼하거나 최고급 결과를 원하시는 분들을 위한 플랜',
      features: [
        'AI 최고급 모델 사용',
        '무제한 수정 옵션',
        '최상급 퀄리티 보장',
        'VIP 지원 (즉시 응답)',
      ],
      gradient: 'from-amber-500 to-amber-600',
      icon: <Crown className="w-8 h-8 text-white" />,
    },
  ];

  // 권장 플랜 결정 (프리미엄 패키지 → The Professional 권장)
  const recommendedPlan = plans.find(p => p.id === 'professional') || plans[1];

  const handleSelectPlan = (plan: Plan) => {
    if (userCredits < plan.credits) {
      // 크레딧 부족 - 충전 페이지로 이동
      if (onNavigate) {
        onClose();
        onNavigate('pricing');
      }
      return;
    }

    onConfirm({
      type: serviceType,
      plan: plan.id,
      credits: plan.credits,
      title: plan.title,
    });
  };

  // 서비스 타입별 정보
  const serviceSteps = [
    { id: 'naming', label: '네이밍 생성', icon: Type },
    { id: 'logo', label: '로고 생성', icon: Sparkles },
    { id: 'card', label: '명함 생성', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-all"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {!showAllPlans ? (
          // 권장 플랜 화면 (기본)
          <>
            {/* Header with Gradient */}
            <div className={`bg-gradient-to-br ${recommendedPlan.gradient} p-8 text-white relative`}>
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {serviceSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === serviceType;
                  const isPassed = serviceSteps.findIndex(s => s.id === serviceType) > index;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                        isActive 
                          ? 'bg-white/30 backdrop-blur-sm' 
                          : isPassed 
                          ? 'bg-white/10' 
                          : 'bg-white/5'
                      }`}>
                        <StepIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < serviceSteps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-white/30 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Recommended Badge */}
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  추천 플랜
                </div>
              </div>
              
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  {recommendedPlan.icon}
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-3xl font-bold mb-2 text-center">{recommendedPlan.title}</h2>
              <p className="text-white/90 text-sm mb-4 text-center">{recommendedPlan.subtitle}</p>
              
              {/* Credits */}
              <div className="text-4xl font-bold mb-4 text-center">{recommendedPlan.credits.toLocaleString()} 크레딧</div>
              
              {/* User Credits Info */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>보유: {userCredits.toLocaleString()} 크레딧</span>
                  {userPackage && (
                    <>
                      <span className="text-white/60">•</span>
                      <span>{userPackage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-center text-gray-700 font-medium mb-6">
                {recommendedPlan.description}
              </p>

              {/* Features */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">이 플랜의 혜택</h3>
                <ul className="space-y-3">
                  {recommendedPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Main CTA Button */}
              {userCredits >= recommendedPlan.credits ? (
                <Button
                  onClick={() => handleSelectPlan(recommendedPlan)}
                  className={`w-full h-14 text-lg font-bold bg-gradient-to-r ${recommendedPlan.gradient} hover:opacity-90 shadow-lg mb-4`}
                >
                  결제하고 시작하기
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => handleSelectPlan(recommendedPlan)}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg mb-4"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  크레딧 충전하기 ({recommendedPlan.credits.toLocaleString()} 필요)
                </Button>
              )}

              {/* Show Other Plans Link */}
              <button
                onClick={() => setShowAllPlans(true)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 flex items-center justify-center gap-2 group"
              >
                <span>다른 플랜도 볼래요</span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </>
        ) : (
          // 전체 플랜 선택 화면
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white">
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {serviceSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === serviceType;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                        isActive ? 'bg-white/30 backdrop-blur-sm' : 'bg-white/5'
                      }`}>
                        <StepIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/50'}`} />
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < serviceSteps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-white/30 mx-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              <h2 className="text-2xl font-bold mb-2 text-center">플랜 선택</h2>
              <p className="text-white/90 text-sm text-center">원하시는 플랜을 선택하세요</p>
              
              {/* User Credits Info */}
              <div className="mt-4 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>보유: {userCredits.toLocaleString()} 크레딧</span>
                  {userPackage && (
                    <>
                      <span className="text-white/60">•</span>
                      <span>{userPackage}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const hasEnoughCredits = userCredits >= plan.credits;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${
                        plan.popular ? 'ring-2 ring-purple-400' : ''
                      }`}
                    >
                      {/* Popular Badge */}
                      {plan.popular && (
                        <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                          추천
                        </div>
                      )}

                      {/* Plan Header */}
                      <div className={`bg-gradient-to-br ${plan.gradient} p-4 text-white`}>
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3">
                          {plan.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-1">{plan.title}</h3>
                        <p className="text-white/80 text-xs mb-3">{plan.subtitle}</p>
                        <div className="text-2xl font-bold">{plan.credits.toLocaleString()}</div>
                        <p className="text-white/80 text-xs">크레딧</p>
                      </div>

                      {/* Plan Content */}
                      <div className="p-4">
                        <p className="text-xs text-gray-600 mb-3 h-10">
                          {plan.description}
                        </p>

                        {/* Features */}
                        <ul className="space-y-1.5 mb-4">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                              <span className="flex-shrink-0 w-1 h-1 rounded-full bg-purple-600 mt-1.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Select Button */}
                        {hasEnoughCredits ? (
                          <Button
                            onClick={() => handleSelectPlan(plan)}
                            size="sm"
                            className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 font-semibold text-sm`}
                          >
                            선택하기
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleSelectPlan(plan)}
                            size="sm"
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 font-semibold text-xs"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            충전하기
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Back Button */}
              <button
                onClick={() => setShowAllPlans(false)}
                className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                ← 추천 플랜으로 돌아가기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
