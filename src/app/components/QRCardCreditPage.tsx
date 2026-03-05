import { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Sparkles, Zap, Rocket, Crown, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface QRCardCreditPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onOpenAuthModal?: () => void;
  onCreditsUpdate?: (newCredits: number, newPackage: string) => void;
  getAccessToken?: () => Promise<string | null>;
}

export function QRCardCreditPage({ onNavigate, user, onOpenAuthModal, onCreditsUpdate, getAccessToken }: QRCardCreditPageProps) {
  const [selectedPackage, setSelectedPackage] = useState<'starter' | 'rebuilder' | 'premium' | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const supabase = getSupabaseClient();

  const packages = [
    {
      id: 'starter',
      name: '스타터 패키지',
      subtitle: '새롭게 시작하는 분들을 위한',
      icon: Zap,
      credits: 30000,
      price: 30000,
      originalPrice: 30000,
      gradient: 'from-blue-500 to-blue-600',
      features: [
        '기본 지원 (48시간 내 응답)',
        '크레딧 3년간 보관',
        '부담 없는 기본 패키지'
      ],
      bestFor: [
        '처음 브랜드를 시작하는 창업자',
        '1개의 브랜드 아이덴티티 완성',
        '다양한 네이밍 테스트',
      ],
    },
    {
      id: 'rebuilder',
      name: '리빌더 패키지',
      subtitle: '기존 브랜드를 새롭게',
      icon: Rocket,
      credits: 50000,
      price: 47500,
      originalPrice: 50000,
      gradient: 'from-purple-500 to-purple-600',
      badge: '인기',
      features: [
        '우선 지원 (24시간 내 응답)',
        '크레딧 3년간 보관',
        '5% 할인 혜택',
      ],
      bestFor: [
        '리브랜딩을 준비하는 기업',
        '여러 브랜드를 운영하는 사업자',
        '다양한 디자인 시도',
      ],
    },
    {
      id: 'premium',
      name: '프리미엄 패키지',
      subtitle: '다양하게 시도해보는',
      icon: Crown,
      credits: 100000,
      price: 90000,
      originalPrice: 100000,
      gradient: 'from-amber-500 to-amber-600',
      features: [
        'VIP 우선 지원 (12시간 내 응답)',
        '크레딧 3년간 보관',
        '10% 할인 혜택',
      ],
      bestFor: [
        '에이전시 및 대량 이용자',
        '다양한 브랜드 프로젝트',
        '모든 서비스 자유롭게 조합',
      ],
    },
  ];

  const handlePurchase = async (packageId: 'starter' | 'rebuilder' | 'premium') => {
    console.log('🔍 구매 시도:', { user, packageId });
    
    if (!user) {
      console.log('⚠️ 사용자 없음 - 로그인 모달 표시');
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    console.log('✅ 사용자 확인:', user);
    setPurchasing(true);

    try {
      let accessToken: string | null = null;
      if (getAccessToken) {
        accessToken = await getAccessToken();
        console.log('🔑 토큰 가져오기 (getAccessToken):', accessToken ? '토큰 있음' : '토큰 없음', accessToken?.substring(0, 20) + '...');
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔑 세션:', session);
        
        if (!session) {
          alert('로그인이 필요합니다.');
          setPurchasing(false);
          return;
        }
        accessToken = session.access_token;
        console.log('🔑 토큰 가져오기 (세션):', accessToken ? '토큰 있음' : '토큰 없음');
      }

      if (!accessToken) {
        alert('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.');
        setPurchasing(false);
        return;
      }

      // Get package info
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        alert('패키지 정보를 찾을 수 없습니다.');
        setPurchasing(false);
        return;
      }

      console.log('📦 구매할 패키지:', pkg);
      console.log('🔐 사용할 액세스 토큰:', accessToken ? accessToken.substring(0, 30) + '...' : 'null');
      console.log('🌐 요청 URL:', `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/qrcard/purchase-credits`);
      console.log('👤 사용자 ID:', user.id);

      // Call purchase API
      console.log('📡 fetch 호출 직전...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/qrcard/purchase-credits`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            packageId,
            credits: pkg.credits,
            amount: pkg.price,
          }),
        }
      );

      console.log('📡 fetch 완료! 응답 받음');
      console.log('📡 API 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API 에러:', errorData);
        throw new Error(errorData.error || '구매에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 패키지 구매 성공:', data);

      // Update credits in parent component
      if (onCreditsUpdate) {
        onCreditsUpdate(data.credits, data.package);
      }

      alert(`🎉 ${pkg.name} 구매가 완료되었습니다!\n\n💰 ${pkg.credits.toLocaleString()} 크레딧이 충전되었습니다.`);
      
      // Navigate to qrcard-digital
      onNavigate('qrcard-digital');
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      alert(`구매 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => onNavigate('qrcard-landing')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로 가기
          </Button>

          {/* Title Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              크레딧 패키지 선택
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              필요에 맞는 패키지를 선택하고, AI 브랜딩을 시작하세요
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>크레딧은 만료되지 않습니다</span>
              <span>•</span>
              <span>언제든 사용 가능</span>
              <span>•</span>
              <span>환불 가능 (미사용 시)</span>
            </div>
          </div>

          {/* Package Comparison */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              const isSelected = selectedPackage === pkg.id;
              const isPopular = pkg.badge === '인기';

              return (
                <Card
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id as any)}
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                      : 'hover:shadow-xl hover:-translate-y-1'
                  } ${
                    isPopular ? 'ring-2 ring-purple-400 ring-offset-2' : ''
                  }`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${pkg.gradient} text-white shadow-lg`}>
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className={`bg-gradient-to-br ${pkg.gradient} p-8 text-white`}>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">{pkg.name}</h3>
                    <p className="text-white/90 text-sm mb-6">{pkg.subtitle}</p>
                    
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold">₩{pkg.price.toLocaleString()}</span>
                    </div>
                    {pkg.originalPrice && (
                      <p className="text-white/70 text-sm">
                        <span className="line-through">₩{pkg.originalPrice.toLocaleString()}</span>
                        <span className="ml-2 font-semibold text-white">
                          {Math.round((1 - pkg.price / pkg.originalPrice) * 100)}% 할인
                        </span>
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="text-3xl font-bold">{pkg.credits.toLocaleString()} 크레딧</div>
                      <p className="text-white/80 text-sm mt-1">
                        크레딧당 ₩{Math.round(pkg.price / pkg.credits).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-8">
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">포함 내역</h4>
                      <ul className="space-y-3">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 bg-gradient-to-br ${pkg.gradient} text-white rounded-full p-0.5`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 text-base">추천 대상</h4>
                      <ul className="space-y-2">
                        {pkg.bestFor.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(pkg.id as any);
                      }}
                      disabled={purchasing && selectedPackage === pkg.id}
                      className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white font-semibold py-6 rounded-xl transition-all duration-300`}
                    >
                      {purchasing && selectedPackage === pkg.id ? (
                        <>구매 중...</>
                      ) : (
                        <>₩{pkg.price.toLocaleString()} 구매하기</>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Additional Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">크레딧 사용 안내</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">무기한 보관</h3>
                <p className="text-sm text-gray-600">
                  구매한 크레딧은 만료 기간이 없습니다. 필요할 때 언제든 사용하세요.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">안전한 결제</h3>
                <p className="text-sm text-gray-600">
                  모든 결제는 안전하게 암호화되어 처리됩니다.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">환불 가능</h3>
                <p className="text-sm text-gray-600">
                  미사용 크레딧은 7일 이내 100% 환불 가능합니다.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
            
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">크레딧은 어떻게 사용하나요?</h3>
                <p className="text-gray-600">
                  각 서비스마다 필요한 크레딧이 정해져 있습니다. 명함 제작, 로고 생성, 브랜드 네이밍 등 원하는 서비스를 선택하면 자동으로 크레딧이 차감됩니다.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">크레딧이 부족하면 어떻게 하나요?</h3>
                <p className="text-gray-600">
                  언제든지 추가로 크레딧을 구매할 수 있습니다. 기존 크레딧과 합산되어 사용됩니다.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">환불은 어떻게 받나요?</h3>
                <p className="text-gray-600">
                  구매 후 7일 이내, 크레딧을 사용하지 않은 경우 100% 환불이 가능합니다. 고객센터로 문의해주세요.
                </p>
              </Card>
            </div>
          </div>

          {/* Enterprise Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300">
              <div className="p-10">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-3xl font-bold text-gray-900">엔터프라이즈</h2>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-700 text-white">맞춤형</span>
                    </div>
                    <p className="text-lg text-gray-700 mb-6">
                      대량 사용자와 기업을 위한 맞춤형 솔루션
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">무제한 크레딧</p>
                          <p className="text-sm text-gray-600">월간 사용량에 맞춘 크레딧 제공</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">전담 계정 매니저</p>
                          <p className="text-sm text-gray-600">1:1 맞춤 지원 및 컨설팅</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">API 연동</p>
                          <p className="text-sm text-gray-600">자사 시스템과 통합 가능</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">우선 처리</p>
                          <p className="text-sm text-gray-600">최우선 작업 처리 및 즉시 응답</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">커스텀 기능 개발</p>
                          <p className="text-sm text-gray-600">요구사항에 맞춘 기능 제작</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">법인 계약</p>
                          <p className="text-sm text-gray-600">세금계산서 발행 및 후불 가능</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => window.open('mailto:enterprise@brandfirst.ai?subject=엔터프라이즈 플랜 문의', '_blank')}
                      className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-8 py-6 rounded-xl transition-all duration-300 w-full md:w-auto"
                    >
                      엔터프라이즈 문의하기
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}