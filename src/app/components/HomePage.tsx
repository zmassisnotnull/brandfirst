import { ArrowRight, Sparkles, CreditCard, Smartphone, Printer, Type, Zap, Rocket, Crown, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { LogoSvgRenderer } from './LogoSvgRenderer';
import { FontPreview } from './FontPreview';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const mainCopies = [
    '당신의 첫 번째 브랜드, AI와 함께 쓰는 첫 페이지.',
    '당신의 머릿속 막연한 꿈이, 처음으로 이름을 갖는 순간.',
    '세상에 없던 당신의 이야기에, AI가 색을 입혀 드립니다.',
    '준비는 끝났습니다. 당신의 브랜드를 세상속으로.',
    '내 안의 가능성이, 비즈니스라는 현실이 됩니다.',
    '망설이던 아이디어들, AI가 빠르게 완성해 드립니다.',
    '복잡한 과정은 잊고, 당신은 가치에만 집중하세요.',
    '단 한 번의 클릭으로, 당신의 비전이 바로 브랜드로.',
    '가장 나다운 고유함에, 혁신적인 기술을 더하는 경험.',
    '작은 명함 한 장에 담길, 당신의 원대한 첫발자국.',
  ];

  const [selectedCopy, setSelectedCopy] = useState('당신의 첫 번째 브랜드, AI와 함께 쓰는 첫 페이지.');
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [showcaseDesigns, setShowcaseDesigns] = useState<any[]>([]);
  const [isLoadingShowcase, setIsLoadingShowcase] = useState(true);

  // 초기 랜덤 카피 선택 (한 번만 실행)
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * mainCopies.length);
    const initialCopy = mainCopies[randomIndex];
    setSelectedCopy(initialCopy);
    setDisplayedText('');
    setIsTypingComplete(false);
  }, []);

  // 15초마다 문구 변경 (버튼 hover 상태에 따라 시작/중지)
  useEffect(() => {
    if (!isButtonHovered) {
      const interval = setInterval(() => {
        setSelectedCopy((prevCopy) => {
          // 현재 문구와 다른 문구만 선택
          const availableCopies = mainCopies.filter(copy => copy !== prevCopy);
          const newRandomIndex = Math.floor(Math.random() * availableCopies.length);
          return availableCopies[newRandomIndex];
        });
        setDisplayedText('');
        setIsTypingComplete(false);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isButtonHovered]);

  useEffect(() => {
    if (displayedText.length < selectedCopy.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(selectedCopy.slice(0, displayedText.length + 1));
      }, 50); // 50ms마다 한 글자씩
      return () => clearTimeout(timeout);
    } else {
      setIsTypingComplete(true);
    }
  }, [displayedText, selectedCopy]);

  // 최근 생성 디자인 가져오기
  useEffect(() => {
    const fetchShowcaseDesigns = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/showcase/recent`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to fetch showcase designs');
          setIsLoadingShowcase(false);
          return;
        }

        const data = await response.json();
        console.log('📊 Showcase data:', data);

        // 텍스트 변환 함수 (서버와 동일한 로직)
        const transformText = (text: string, transform?: string): string => {
          if (transform === 'uppercase') return text.toUpperCase();
          if (transform === 'titlecase') {
            if (/[A-Z]/.test(text)) {
              const words = text.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
              return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
            }
            const mid = Math.ceil(text.length / 2);
            return text.substring(0, mid).charAt(0).toUpperCase() + text.substring(0, mid).slice(1).toLowerCase() +
                   text.substring(mid).charAt(0).toUpperCase() + text.substring(mid).slice(1).toLowerCase();
          }
          if (transform === 'sentencecase') {
            return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          }
          return text;
        };

        // 로고와 명함을 합쳐서 표시 (최대 6개)
        const combined = [
          ...data.logos.map((logo: any) => ({
            id: logo.id || `logo-${Math.random()}`,
            type: 'logo',
            title: logo.brandName || logo.business || '브랜드 로고',
            // 로고 전체 정보 저장
            logoUrl: logo.logoUrl,
            brandName: logo.brandName,
            font: logo.font,
            fontColor: logo.fontColor,
            weight: logo.weight,
            spacing: logo.spacing,
            transform: logo.transform,
            isDuotone: logo.isDuotone,
            secondaryColor: logo.secondaryColor,
            color: getGradientForType('logo'),
          })),
          ...data.cards.map((card: any) => ({
            id: card.id || `card-${Math.random()}`,
            type: 'card',
            title: card.name || card.company || '브랜드 명함',
            imageUrl: card.imageUrl,
            color: getGradientForType('card'),
          })),
        ].slice(0, 6);

        setShowcaseDesigns(combined);
        setIsLoadingShowcase(false);
      } catch (error) {
        console.error('Error fetching showcase designs:', error);
        setIsLoadingShowcase(false);
      }
    };

    fetchShowcaseDesigns();
  }, []);

  // 타입에 따라 그라데이션 색상 반환
  const getGradientForType = (type: string) => {
    const gradients = {
      logo: ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-green-500 to-teal-600'],
      card: ['from-orange-500 to-red-600', 'from-cyan-500 to-blue-600', 'from-amber-500 to-yellow-600'],
    };
    
    const options = gradients[type as keyof typeof gradients] || gradients.logo;
    return options[Math.floor(Math.random() * options.length)];
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight min-h-[190px] md:min-h-[240px] flex items-center justify-center m-[0px]">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent gradient-flow inline-block">
              {displayedText.split('').map((char, index) => {
                // 첫 번째 쉼표나 마침표의 인덱스 찾기
                const firstBreakIndex = displayedText.split('').findIndex(c => c === ',' || c === '.');
                const isSecondLine = firstBreakIndex !== -1 && index > firstBreakIndex;
                
                if (char === ',' || char === '.') {
                  return (
                    <span key={index}>
                      {char}
                      <br />
                    </span>
                  );
                }
                return (
                  <span key={index} className={isSecondLine ? 'text-[1.2em]' : ''}>
                    {char}
                  </span>
                );
              })}
            </span>
          </h1>
          
          <p className="text-xl text-gray-600">
            디자인 고민 없이 바로 시작하세요. AI가 당신만의 브랜드를 만들어드립니다.
          </p>

          <div className="flex justify-center">
            <Button
              onClick={() => onNavigate('naming')}
              className="h-16 !px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all hover:scale-105 rounded-[50px]"
              onMouseEnter={() => setIsButtonHovered(true)}
              onMouseLeave={() => setIsButtonHovered(false)}
            >
              시작하기
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="max-w-6xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-4">
            한 번에 끝내는 퍼스널 브랜딩 워크플로우
          </h2>
          <p className="text-center text-gray-600 mb-12">
            로고부터 실물 인쇄까지, 물 흐르듯 이어지는 브랜딩 경험
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              {
                icon: Type,
                title: 'AI 브랜드 네이밍',
                desc: '도메인+상표권 자동 확인',
              },
              {
                icon: Sparkles,
                title: 'AI 브랜드 로고',
                desc: '간단한 선택과 로고 생성',
              },
              {
                icon: CreditCard,
                title: 'AI 브랜드 명함',
                desc: '로고 기반 자동 레이아웃',
              },
              {
                icon: CreditCard,
                title: '브랜드 명함 출고',
                desc: '명함 제작에서 배송까지',
              }, 
              {
                icon: Smartphone,
                title: 'QR 디지털 명함',
                desc: '모바일 프로필 페이지',
              },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative">
                  <Card className="p-6 text-center aspect-square flex flex-col justify-center hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </Card>
                  {index < 4 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-300">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-12">
            <Button
              onClick={() => onNavigate('naming')}
              variant="outline"
              className="h-12 px-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold w-56"
            >
              <Type className="w-5 h-5 mr-2" />
              브랜드 네이밍 만들기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={() => onNavigate('logo')}
              variant="outline"
              className="h-12 px-6 border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold w-56"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              브랜드 로고 만들기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button
              onClick={() => onNavigate('card-choice')}
              variant="outline"
              className="h-12 px-6 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold w-56"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              브랜드 명함 만들기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-6 text-center">
            💡 크레딧은 사전 충전 방식으로, 필요한 만큼 구매하고 매번 결제 없이 편리하게 이용하세요
          </p>
        </div>

        {/* Credit Packages Section */}
        <div className="max-w-6xl mx-auto mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              크레딧 패키지로 시작하세요
            </h2>
            <p className="text-lg text-gray-600">
              필요에 맞는 패키지를 선택하고, 충전된 크레딧으로 자유롭게 이용하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 타터 패키지 */}
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">스타터 패키지</h3>
                <p className="text-blue-100 text-sm mb-4">새롭게 창업하는 분들을 위한</p>
                <div className="text-4xl font-bold mb-2">50,000 크레딧</div>
                <p className="text-blue-100 text-sm">₩50,000 <span className="line-through opacity-70">₩50,000</span> <span className="text-amber-100 text-sm font-bold">0%</span></p>
              </div>
              
              <div className="p-6 bg-white">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>The Starter 명함 1회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>또는 The Starter 로고 5회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>또는 네이밍 10~16회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>기본 지원(48시간 내)</span>
                  </li>
                </ul>
                
                <Button
                  onClick={() => onNavigate('pricing')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-semibold"
                >
                  자세히 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* 리빌더 패키지 */}
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ring-2 ring-purple-400 ring-offset-2">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 text-white relative">
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                  인기
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">리빌더 패키지</h3>
                <p className="text-purple-100 text-sm mb-4">기존 브랜드를 새롭게</p>
                <div className="text-4xl font-bold mb-2">50,000 크레딧</div>
                <p className="text-purple-100 text-sm">₩47,500 <span className="line-through opacity-70">₩50,000</span> <span className="text-amber-100 text-sm font-bold">5%</span></p>
              </div>
              
              <div className="p-6 bg-white">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>The Starter 명함 2회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>또는 The Starter 로고 10회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>또는 네이밍 20~33회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>우선 지원 (24시간 내)</span>
                  </li>
                </ul>
                
                <Button
                  onClick={() => onNavigate('pricing')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 font-semibold"
                >
                  자세히 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            {/* 프리미엄 패키지 */}
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-8 text-white">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">프리미엄 패키지</h3>
                <p className="text-amber-100 text-sm mb-4">다양하게 시도해보는</p>
                <div className="text-4xl font-bold mb-2">100,000 크레딧</div>
                <p className="text-amber-100 text-sm">₩90,000 <span className="line-through opacity-70">₩105,000</span> <span className="text-amber-100 text-sm font-bold">10%</span></p>
              </div>
              
              <div className="p-6 bg-white">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>The Professional 명함 3회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>또는 The Professional 로고 7회</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>또는 풀 서비스 다회 이용</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>VIP 우선 지원 (12시간 내)</span>
                  </li>
                </ul>
                
                <Button
                  onClick={() => onNavigate('pricing')}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-semibold"
                >
                  자세히 보기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            💡 크레딧은 유효기간 제한 없이 사용하실 수 있으며, 사전 충전 방식으로 편리하게 이용하세요
          </p>
        </div>

        {/* Showcase Slider */}
        <div className="max-w-6xl mx-auto mt-20">
          <h3 className="text-center text-xl font-semibold mb-8 text-gray-700">
            최근 생성 디자인
          </h3>
          {isLoadingShowcase ? (
            <div className="flex justify-center">
              <div className="animate-pulse flex gap-4">
                <div className="h-48 bg-gray-200 rounded-lg w-64"></div>
                <div className="h-48 bg-gray-200 rounded-lg w-64"></div>
                <div className="h-48 bg-gray-200 rounded-lg w-64"></div>
              </div>
            </div>
          ) : showcaseDesigns.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>아직 생성된 디자인이 없습니다.</p>
              <p className="text-sm mt-2">첫 번째 브랜드를 만들어보세요! 🚀</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcaseDesigns.map((design) => {
                // 텍스트 변환 함수
                const transformText = (text: string, transform?: string): string => {
                  if (transform === 'uppercase') return text.toUpperCase();
                  if (transform === 'titlecase') {
                    if (/[A-Z]/.test(text)) {
                      const words = text.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
                      return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
                    }
                    const mid = Math.ceil(text.length / 2);
                    return text.substring(0, mid).charAt(0).toUpperCase() + text.substring(0, mid).slice(1).toLowerCase() +
                           text.substring(mid).charAt(0).toUpperCase() + text.substring(mid).slice(1).toLowerCase();
                  }
                  if (transform === 'sentencecase') {
                    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
                  }
                  return text;
                };
                
                return (
                  <Card
                    key={design.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                  >
                    {design.type === 'logo' ? (
                      // 로고 렌더링 (MyBrandingBox와 동일한 로직)
                      <div className="w-full aspect-[1.6/1] overflow-hidden bg-white flex items-center justify-center">
                        {(() => {
                          const isLogoUrlSvg = typeof design.logoUrl === 'string' && design.logoUrl.startsWith('data:image/svg+xml;base64,');
                          const isLogoUrlString = typeof design.logoUrl === 'string';
                          const hasFont = !!design.font;

                          if (isLogoUrlSvg) {
                            return <LogoSvgRenderer svgDataUrl={design.logoUrl} className="w-full h-full flex items-center justify-center" />;
                          } else if (isLogoUrlString && design.logoUrl) {
                            return <img src={design.logoUrl} alt="Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />;
                          } else if (hasFont && design.brandName) {
                            return (
                              <FontPreview
                                font={design.fontFamily || design.font.split(' ')[0]}
                                text={transformText(design.brandName, design.transform)}
                                weight={design.weight || '700'}
                                color={design.fontColor || '#2563EB'}
                                duotone={design.isDuotone || false}
                                secondaryColor={design.secondaryColor}
                                letterSpacing={design.spacing || '0'}
                              />
                            );
                          } else {
                            return (
                              <div className={`w-full h-full bg-gradient-to-br ${design.color} flex items-center justify-center`}>
                                <div className="text-white text-4xl font-bold">🎨</div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    ) : design.imageUrl ? (
                      // 명함 렌더링
                      <div className="w-full aspect-[1.6/1] overflow-hidden bg-gray-100">
                        <img
                          src={design.imageUrl}
                          alt={design.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className={`w-full aspect-[1.6/1] bg-gradient-to-br ${design.color} flex items-center justify-center`}>
                        <div className="text-white text-4xl font-bold">💼</div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800 truncate flex-1">{design.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          design.type === 'logo' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {design.type === 'logo' ? '로고' : '명함'}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
}