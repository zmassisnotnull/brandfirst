import { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Sparkles, Zap, Rocket, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface PricingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onOpenAuthModal?: () => void;
  onCreditsUpdate?: (newCredits: number, newPackage: string) => void;
  getAccessToken?: () => Promise<string | null>;
}

export function PricingPage({ onNavigate, user, onOpenAuthModal, onCreditsUpdate, getAccessToken }: PricingPageProps) {
  const [selectedPackage, setSelectedPackage] = useState<'starter' | 'rebuilder' | 'premium' | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const supabase = getSupabaseClient();

  const packages = [
    {
      id: 'starter',
      name: '스타터 패키지',
      subtitle: '새롭게 창업하는 분들을 위한',
      icon: Zap,
      credits: 30000,
      price: 30000,
      originalPrice: 30000,
      gradient: 'from-blue-500 to-blue-600',
      features: [
        'The Starter 단면 명함 1회 (©20,000 x 1)',
        'The Starter 로고 1회 (©5,000 x 1)',
        'The Professional 네이밍 1회 (©2,500 x 1)',
        '기본 지원 (48시간 내 응답)',
        '크레딧 3년 보관',
      ],
      bestFor: [
        '처음 브랜드를 시작하는 창업자',
        '1개의 브랜드 아이덴티티 완성',
        '1개의 명함 출력까지 완료',
      ],
    },
    {
      id: 'rebuilder',
      name: '리빌더 패키지',
      subtitle: '기존 브랜드를 새롭게',
      icon: Rocket,
      credits: 50000,
      price: 45000,
      originalPrice: 50000,
      gradient: 'from-purple-500 to-purple-600',
      badge: '인기',
      features: [
        'The Starter 명함 2회 (©20,000 x 2)',
        'The Starter 로고 1회 (©5,000 x 1)',
        'The Professional 네이밍 1회 (©2,500 x 1)',
        '우선 지원 (24시간 내 응답)',
        '크레딧 3년 보관',
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
        'The Professional 양면 명함 2회 (©35,000 x 2)',
        'The Professional 마크+로고 1회 (©15,000 x 1)',
        'The Professional 네이밍 1회 (©2,500 x 1)',
        'VIP 우선 지원 (12시간 내 응답)',
        '크레딧 3년 보관',
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
        console.log('🔑 토큰 가져오기 (세션):', accessToken ? '토큰 있음' : '토 없음');
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
      console.log('🌐 요청 URL:', `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/purchase`);
      console.log('👤 사용자 ID:', user.id);
      
      console.log('🚀 purchase 함수 - 실제 API 호출 시작...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,  // publicAnonKey 사용 (항상 유효)
          },
          body: JSON.stringify({
            packageId,
            credits: pkg.credits,
            userId: user.id,  // userId를 body에 포함
          }),
        }
      );

      console.log('📡 fetch 완료! 응답 받음');
      console.log('📡 API 응답 상태:', response.status);
      console.log('📡 API 응답 헤더:', Object.fromEntries(response.headers.entries()));

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
      
      // Navigate to home
      onNavigate('home');
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      alert(`구매 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-6">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              크레딧 패키지 선택
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              필요에 맞는 패키지를 선택하고, AI 브랜딩을 시작하세요
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>최종 사용일부터 3년간 보관</span>
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
                      disabled={purchasing}
                      className={`w-full h-12 font-semibold bg-gradient-to-r ${pkg.gradient} hover:opacity-90 transition-opacity disabled:opacity-50`}
                    >
                      {purchasing ? '구매 중...' : (isSelected ? '선택됨 - 구매하기' : '구매하기')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">패키지 상세 비교</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">기능</th>
                    <th className="text-center py-4 px-4 font-semibold text-blue-600">스타터</th>
                    <th className="text-center py-4 px-4 font-semibold text-purple-600">리빌더</th>
                    <th className="text-center py-4 px-4 font-semibold text-amber-600">프리미엄</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">크레딧</td>
                    <td className="text-center py-4 px-4 font-semibold">50,000</td>
                    <td className="text-center py-4 px-4 font-semibold">50,000</td>
                    <td className="text-center py-4 px-4 font-semibold">100,000</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">가격</td>
                    <td className="text-center py-4 px-4 font-semibold">₩50,000</td>
                    <td className="text-center py-4 px-4 font-semibold">₩47,500</td>
                    <td className="text-center py-4 px-4 font-semibold">₩90,000</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">브랜드 네이밍</td>
                    <td className="text-center py-4 px-4">10회</td>
                    <td className="text-center py-4 px-4">20회</td>
                    <td className="text-center py-4 px-4">-</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">브랜드 로고</td>
                    <td className="text-center py-4 px-4">5회</td>
                    <td className="text-center py-4 px-4">10회</td>
                    <td className="text-center py-4 px-4">20회</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">로고 형태</td>
                    <td className="text-center py-4 px-4">로고</td>
                    <td className="text-center py-4 px-4">로고/심볼마크+로고</td>
                    <td className="text-center py-4 px-4">심볼마크+로고</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">브랜드 명함</td>
                    <td className="text-center py-4 px-4">1회</td>
                    <td className="text-center py-4 px-4">2회</td>
                    <td className="text-center py-4 px-4">5회</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">명함 형태</td>
                    <td className="text-center py-4 px-4">단면</td>
                    <td className="text-center py-4 px-4">단면/양면</td>
                    <td className="text-center py-4 px-4">양면</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">명함 제작</td>
                    <td className="text-center py-4 px-4">1회</td>
                    <td className="text-center py-4 px-4">2회</td>
                    <td className="text-center py-4 px-4">5회</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">제작 형태</td>
                    <td className="text-center py-4 px-4">단면</td>
                    <td className="text-center py-4 px-4">단면/양면</td>
                    <td className="text-center py-4 px-4">양면</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">지원 응답 시간</td>
                    <td className="text-center py-4 px-4">48시간</td>
                    <td className="text-center py-4 px-4">24시</td>
                    <td className="text-center py-4 px-4">12시간</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 text-gray-700">할인율</td>
                    <td className="text-center py-4 px-4">-</td>
                    <td className="text-center py-4 px-4">4%</td>
                    <td className="text-center py-4 px-4">10%</td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-4 px-4 text-gray-700">크레딧 유효기간</td>
                    <td className="text-center py-4 px-4 text-green-600 font-semibold">3년</td>
                    <td className="text-center py-4 px-4 text-green-600 font-semibold">3년</td>
                    <td className="text-center py-4 px-4 text-green-600 font-semibold">3년</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h3>
            
            <div className="space-y-6 container mx-auto px-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💳 크레딧은 어떻게 사용하나요?</h4>
                <p className="text-gray-600 text-sm">
                  각 서비스마다 필요한 크레딧이 다릅니다.
                  충전된 크레딧으로 원하는 서비스를 자유롭게 이용할 수 있습니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⏰ 크레딧 유효기간이 있나요?</h4>
                <p className="text-gray-600 text-sm">
                  네. 구매하신 크레딧은 최종 사용일부터 <strong>3년 보관 후 만료되며 잔액은 소멸</strong>합니다. 매년 잔액 소멸에 대한 안내를 보내드리고 있습니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔄 환불이 가능한가요?</h4>
                <p className="text-gray-600 text-sm">
                  네. 크레딧 구매 후 <strong>사용하지 않으신 경우, 구매일로부터 7일 이내 100% 환불이 가능</strong>합니다.
                  사용하신 크레딧의 경우 <strong>잔여 크레딧에 대한 환불은 불가능</strong> 합니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📦 패키지 추가 구매가 가능한가요?</h4>
                <p className="text-gray-600 text-sm">
                  네. 언제든지 추가로 패키지를 구매하실 수 있습니다. 크레딧은 누적되어 사용 가능합니다.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 어떤 패키지를 선택해야 할까요?</h4>
                <p className="text-gray-600 text-sm">
                  처음 시작하시는 분은 <strong>스타터 패키지</strong>, 여러 브랜드를 운영하거나 리브랜딩을 준비하시는 분은 <strong>리빌더 패키지</strong>,
                  에이전시나 대량으로 이용하시는 분은 <strong>프리미엄 패키지</strong>를 추천드립니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}