import { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Sparkles, Crown, Star, Users, Globe, MessageSquare, Zap, QrCode, BarChart3, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface QRCardPricingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onOpenAuthModal?: () => void;
  onCreditsUpdate?: (newCredits: number, newPlan: string) => void;
  getAccessToken?: () => Promise<string | null>;
}

export function QRCardPricingPage({ 
  onNavigate, 
  user, 
  onOpenAuthModal, 
  onCreditsUpdate, 
  getAccessToken 
}: QRCardPricingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise' | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const supabase = getSupabaseClient();

  const plans = [
    {
      id: 'starter',
      name: '스타터 플랜',
      subtitle: '개인 사용자를 위한',
      icon: Star,
      monthlyPrice: 0,
      yearlyPrice: 0,
      gradient: 'from-yellow-500 to-orange-500',
      features: [
        '디지털 명함 싱글 프로필 1개',
        '기본 정보 입력 (이름, 직함, 연락처, 이메일, 웹사이트, 주소)',
        'QR 코드 생성',
        '명함 공유 (링크, QR)',
        '무제한 조회수',
        'VCF 연락처 저장',
        '기본 통계',
        '기본 지원',
      ],
      limitations: [
        '프로필 1개로 제한',
        '소셜 미디어 링크 없음',
        '커스텀 필드 없음',
        '테마 커스터마이징 제한',
      ],
      bestFor: [
        '처음 디지털 명함을 시작하는 개인',
        '간단한 명함만 필요한 경우',
        '무료로 사용해보고 싶은 경우',
      ],
    },
    {
      id: 'professional',
      name: '프로페셔널 플랜',
      subtitle: '개인 전문가를 위한',
      icon: Crown,
      monthlyPrice: 500,
      yearlyPrice: 5000,
      gradient: 'from-blue-600 to-purple-600',
      badge: '추천',
      features: [
        '모든 스타터 플랜 기능 포함',
        '무제한 멀티 프로필 (직업용, 취미용 등)',
        '소셜 미디어 링크 (LinkedIn, GitHub, Instagram 등)',
        '커스텀 필드 3개 추가',
        '프리미엄 테마 및 색상 커스터마이징',
        '고급 통계 및 분석',
        '우선 지원 (48시간 내 응답)',
        '광고 제거',
      ],
      limitations: [],
      bestFor: [
        '여러 역할을 가진 프리랜서',
        '네트워킹이 중요한 비즈니스 전문가',
        '브랜드 이미지를 중요시하는 경우',
      ],
    },
    {
      id: 'enterprise',
      name: '팀/기업 플랜',
      subtitle: '팀/그룹 및 기업 비즈니스를 위한',
      icon: Users,
      monthlyPrice: 5000,
      yearlyPrice: 50000,
      gradient: 'from-gray-800 to-black',
      features: [
        '모든 프로페셔널 플랜 기능 포함',
        '커스텀 필드 5개 추가',
        '프리미엄 테마 및 색상 커스터마이징',
        '고급 통계 및 분석',
        '응급 지원 (24시간 내 응답)',
        '광고 제거',
        '고객 관리 시스템 통합',
        '데이터 분석 도구',
      ],
      limitations: [],
      bestFor: [
        '팀/그룹 및 기업',
        '고객 관리가 중요한 비즈니스',
        '고급 분석 도구가 필요한 경우',
      ],
    },
  ];

  const handlePurchase = async (planId: 'starter' | 'professional' | 'enterprise') => {
    console.log('🔍 구독 시도:', { user, planId, billingCycle });
    
    if (!user) {
      console.log('⚠️ 사용자 없음 - 로그인 모달 표시');
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    if (planId === 'starter') {
      alert('이미 스타터 플랜을 사용 중입니다.');
      return;
    }

    setPurchasing(true);
    setSelectedPlan(planId);

    try {
      const accessToken = getAccessToken ? await getAccessToken() : null;
      
      if (!accessToken) {
        alert('인증 토큰을 가져올 수 없습니다.');
        setPurchasing(false);
        return;
      }

      const plan = plans.find(p => p.id === planId);
      const amount = billingCycle === 'monthly' ? plan?.monthlyPrice : plan?.yearlyPrice;

      // 결제 요청
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/qrcard/subscribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            billingCycle,
            amount,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '구독 처리 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      console.log('✅ 구독 성공:', data);

      if (onCreditsUpdate) {
        onCreditsUpdate(0, planId); // QR Card는 크레딧이 아닌 플랜 기반
      }

      alert(`${plan?.name} 구독이 완료되었습니다! 🎉`);
      onNavigate('qrcard-digital');

    } catch (error) {
      console.error('❌ 구독 오류:', error);
      alert(error instanceof Error ? error.message : '구독 처리 중 오류가 발생했습니다.');
    } finally {
      setPurchasing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            onClick={() => onNavigate('qrcard-landing')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </Button>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-[0px] pt-[0px] pb-[2px] mx-[0px] mt-[0px] mb-[14px]">
              디지털 명함 플랜 선택
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              당신의 네트워킹 스타일에 맞는 플랜을 선택하세요
            </p>

            {/* Billing Cycle Toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-full mb-12">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                월간 결제
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                연간 결제
                <span className="ml-2 text-xs text-green-600 font-semibold">2개월 무료</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-[1450px] mx-auto mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl max-w-[450px] mx-auto w-full ${
                  plan.id === 'professional' ? 'ring-2 ring-purple-500' : 
                  plan.id === 'enterprise' ? 'ring-2 ring-gray-700' : ''
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`text-white text-xs font-bold px-3 py-1 rounded-full ${
                      plan.id === 'professional' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-r from-gray-700 to-gray-900'
                    }`}>
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Gradient Background */}
                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-r ${plan.gradient} opacity-10`} />

                <div className="relative p-8">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-gray-500">{plan.subtitle}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6 border-b px-[0px] pt-[30px] pb-[15px]">
                    {price === 0 ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900">무료</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-4xl font-bold text-gray-900">
                            {price.toLocaleString()} 크레딧
                          </span><span className="text-gray-500">/ {billingCycle === 'monthly' ? '월' : '년 ← 2개월 무료'}</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-gray-500">
                            월 {monthlyEquivalent.toLocaleString()} 크레딧 (월 {(plan.yearlyPrice / 12 / 10 * 2).toFixed(1)} 크레딧 절약) → 16.7% 할인
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">포함된 기능</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    null
                  )}

                  {/* Best For */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">적합한 사용자</h4>
                    <ul className="space-y-2">
                      {plan.bestFor.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePurchase(plan.id as 'starter' | 'professional' | 'enterprise')}
                    disabled={purchasing || (plan.id === 'starter' && user)}
                    className={`w-full py-6 text-base font-semibold rounded-xl ${
                      plan.id === 'professional'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                        : plan.id === 'enterprise'
                        ? 'bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {purchasing && selectedPlan === plan.id ? (
                      <>처리 중...</>
                    ) : plan.id === 'starter' && user ? (
                      <>현재 플랜</>
                    ) : plan.id === 'starter' ? (
                      <>무료로 시작하기</>
                    ) : plan.id === 'enterprise' ? (
                      <>팀/기업으로 업그레이드</>
                    ) : (
                      <>프로페셔널로 업그레이드</>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mx-[0px] mt-[30px] mb-[0px]">
                    BrandFirst.ai 제공{' '}
                    <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                    </span>
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">기능 상세 비교</h2>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6 text-gray-900 font-semibold w-1/3">기능</th>
                  <th className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-900 font-semibold w-1/3">스타터</th>
                  <th className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold w-1/3">프로페셔널</th>
                  <th className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold w-1/3">팀/기업</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">디지털 명함 개수</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">1개</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">무제한</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">무제한</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">멀티 프로필 (직업/취미 등)</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-400">×</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-green-600 font-semibold">✓</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">소셜 미디어 링크</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-400">×</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-green-600 font-semibold">✓</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-green-600 font-semibold">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">커스텀 필드</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">0개</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">3개</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">5개</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">테마 커스터마이징</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">기본</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">고급</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">고급</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">통계 및 분석</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">기본</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">고급</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">고급</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-6 text-gray-700">고객 지원</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">기본</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">우선 (24시간)</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">우선 (24시간)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 text-gray-700">광고</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-orange-50 to-pink-50 text-gray-600">표시됨</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 font-semibold">제거됨</td>
                  <td className="text-center py-4 px-6 bg-gradient-to-r from-green-50 to-teal-50 text-gray-900 font-semibold">제거됨</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">무료 플랜으로 충분한가요?</h3>
              <p className="text-gray-600">
                개인적인 용도로 간단한 명함만 필요하다면 스타터 플랜으로도 충분합니다. 
                하지만 여러 역할을 가지고 있거나 소셜 미디어를 적극 활용한다면 프로페셔널 플랜을 추천합니다.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">언제든지 플랜을 변경할 수 있나요?</h3>
              <p className="text-gray-600">
                네, 언제든지 프로페셔널 플랜으로 업그레이드하거나 스타터 플랜으로 다운그레이드할 수 있습니다. 
                업그레이드 시에는 즉시 적용되며, 다운그레이드는 다음 결제 주기부터 적용됩니다.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">연간 결제 시 할인 혜택은?</h3>
              <p className="text-gray-600">
                연간 결제 시 2개월 무료 혜택을 제공합니다.<br /> 예시) 프로페셔널 플랜은 월 500원 × 12개월 = 6,000원이지만, 
                연간 결제는 5,000원으로 약 16.7% 할인됩니다.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">환불 정책은 어떻게 되나요?</h3>
              <p className="text-gray-600">
                구독 후 7일 이내에는 100% 환불이 가능합니다. 
                7일 이후에는 다음 결제 주기 전에 구독을 취소할 수 있으며, 현재 주기가 끝날 때까지 서비스를 계속 이용할 수 있습니다.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-xl text-gray-600 mb-8">
            무료로 시작하고, 필요할 때 업그레이드하세요
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => user ? onNavigate('qrcard-digital') : onOpenAuthModal?.()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl"
            >
              {user ? '내 명함 관리하기' : '무료로 시작하기'}
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}