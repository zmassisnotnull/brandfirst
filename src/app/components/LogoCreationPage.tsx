import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Upload, Check, Loader2, CheckCircle2, Save, Palette, CreditCard, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { CreditConfirmModal } from './CreditConfirmModal';
import { LogoRenderer } from './LogoRenderer';
import { FontPreview } from './FontPreview';
import { LogoSvgRenderer } from './LogoSvgRenderer';
import { LogoCreationStarter } from './LogoCreationStarter';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getSupabaseClient } from '../../../utils/supabase/client';

// ✅ 텍스트 변환 함수 (서버와 동일한 로직)
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

// ✅ 로고 저장 함수 (하이브리드 방식 업데이트)
const saveLogoWithRetry = async (
  logoData: {
    logoUrl: string;
    brandName: string;
    business: string;
    mood: string;
    color: string;
    logoType: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔍 디버깅: 로고 저장 시작', logoData);
    
    const sessionStr = localStorage.getItem('mybrands_session');
    if (!sessionStr) {
      alert('로그인이 필요합니다.');
      window.location.href = '/';
      return { success: false, error: '세션 없음' };
    }
    const session = JSON.parse(sessionStr);
    
    console.log('🔍 세션:', { 
      hasToken: !!session?.access_token,
      tokenStart: session?.access_token?.substring(0, 20)
    });
    
    console.log('🔍 API 호출:', session.access_token.substring(0, 20) + '...');
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-access-token': session.access_token,
        },
        body: JSON.stringify(logoData),
      }
    );
    
    console.log('🔍 응답:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ 저장 성공!');
      return { success: true };
    }
    
    const errorData = await response.json();
    console.error('❌ 실패:', errorData);
    return { success: false, error: errorData.error || '저장 실패' };
    
  } catch (error: any) {
    console.error('❌ 네트워크 에러:', error);
    return { success: false, error: error.message || '네트워크 에러' };
  }
};

interface LogoCreationPageProps {
  onNavigate: (page: string) => void;
  onLogoCreated?: (logoUrl: string, logoData: any) => void;
  onOpenAuthModal?: () => void;
  user?: any;
  userCredits?: number;
  selectedBrandName?: string | null;
  serviceCategory?: string | null;
  selectedKeywords?: string[] | null;
  startDirectly?: boolean;
  onCreditsUpdate?: () => void;
}

export function LogoCreationPage({ 
  onNavigate, 
  onLogoCreated, 
  onOpenAuthModal, 
  user, 
  userCredits, 
  selectedBrandName, 
  serviceCategory,
  selectedKeywords,
  startDirectly = false,
  onCreditsUpdate 
}: LogoCreationPageProps) {
  // 네이밍/마이박스에서 온 경우: Step 1,2 충족 → Step 3부터 시작
  // 키워드도 있으면: Step 1,2,3 충족 → Step 4부터 시작
  // 항상 Step 0 (로고 선택)부터 시작
  // 서비스 타입 선택 후 키워드 유무에 따라 분기
  const initialStep = startDirectly ? 1 : 0;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<Array<{ url: string; font: string }>>([]);
  const [selectedLogo, setSelectedLogo] = useState(0);

  // User selections
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [customBusiness, setCustomBusiness] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // 키워드 선택 state
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  // 크레딧 확인 모달 state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingServiceType, setPendingServiceType] = useState<'starter' | 'professional' | 'rebuilder' | null>(null);

  // 로고 미리보기 모달 state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Professional 플랜 전용 state
  const [symbolMarks, setSymbolMarks] = useState<string[]>([]);
  const [logotypes, setLogotypes] = useState<Array<{ url: string; font: string }>>([]);
  const [selectedSymbolIndex, setSelectedSymbolIndex] = useState<number | null>(null);
  const [selectedLogotypeIndex, setSelectedLogotypeIndex] = useState<number | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<'horizontal-left' | 'horizontal-right' | 'vertical-top' | 'vertical-bottom' | null>(null);
  const [subStep, setSubStep] = useState<6.1 | 6.2 | 6.3 | null>(null); // Step 6의 서브 단계

  // 추천 키워드 목록
  const SUGGESTED_KEYWORDS = [
    '혁신', '전문', '프리미엄', '빠른', '간편한',
    '스마트', '창의적', '신뢰', '글로벌', '지속가능',
    '맞춤형', '효율적', '미래', '연결', '성장'
  ];

  // 키워드 토글
  const toggleKeyword = (keyword: string) => {
    if (customKeywords.includes(keyword)) {
      setCustomKeywords(customKeywords.filter(k => k !== keyword));
    } else {
      if (customKeywords.length < 4) {
        setCustomKeywords([...customKeywords, keyword]);
      }
    }
  };

  const businessTypes = [
    { id: 'tech', label: '테크/IT', icon: '💻', desc: '소프트웨어, 스타트업' },
    { id: 'creative', label: '크리에이티브', icon: '🎨', desc: '인, 예술' },
    { id: 'food', label: '음식/카페', icon: '☕', desc: '레스토랑, 카페' },
    { id: 'health', label: '헬스/웰니스', icon: '🧘', desc: '요가, 피트니스' },
    { id: 'business', label: '비즈니스', icon: '💼', desc: '컨설팅, 금융' },
    { id: 'education', label: '교육', icon: '📚', desc: '강사, 튜터' },
    { id: 'retail', label: '리테일', icon: '🛍️', desc: '쇼핑, 판매' },
    { id: 'service', label: '서비스', icon: '🔧', desc: '수리, 관리' },
    { id: 'other', label: '기타', icon: '✏️', desc: '직접 입력' },
  ];

  const colors = [
    { id: 'blue', label: '블루', hex: '#3B82F6', desc: '신뢰, 안정' },
    { id: 'purple', label: '퍼플', hex: '#A855F7', desc: '창의, 혁신' },
    { id: 'green', label: '그린', hex: '#10B981', desc: '자연, 성장' },
    { id: 'orange', label: '오렌지', hex: '#F97316', desc: '열정, 에너지' },
    { id: 'pink', label: '핑크', hex: '#EC4899', desc: '부드러움' },
    { id: 'black', label: '블랙', hex: '#1F2937', desc: '고급, 모던' },
    { id: 'red', label: '레드', hex: '#EF4444', desc: '강렬함' },
    { id: 'teal', label: '틸', hex: '#14B8A6', desc: '균형, 차분' },
  ];

  const styles = [
    { id: '미니멀한', label: '미니멀한', desc: 'Minimal' },
    { id: '고급스러운', label: '고급스러운', desc: 'Luxury' },
    { id: '화려한', label: '화려한', desc: 'Vibrant' },
    { id: '친근한', label: '친근한', desc: 'Friendly' },
    { id: '창의적인', label: '창의적인', desc: 'Creative' },
    { id: '모던한', label: '모던한', desc: 'Modern' },
  ];

  // 네이밍에서 넘어온 경우 자동 설정
  useEffect(() => {
    console.log('🔍 LogoCreationPage useEffect:', { selectedBrandName, serviceCategory, selectedKeywords });
    
    if (selectedBrandName && serviceCategory) {
      console.log('✅ 네이밍에서 넘어옴 → 자동 설정 시작');
      const categoryMapping: { [key: string]: string } = {
        '테크': 'tech',
        '디자인': 'creative',
        '마케팅': 'business',
        '경영': 'business',
        '교육': 'education',
        '미디어': 'creative',
        '헬스': 'health',
        '금융': 'business',
        '음식': 'food',
        '여행': 'service',
        '예술': 'creative',
        '스포츠': 'health',
      };
      
      const mappedCategory = categoryMapping[serviceCategory] || 'other';
      setSelectedBusiness(mappedCategory);
      setCustomBusiness(selectedBrandName);
      
      // 네이밍에서 키워드를 선택했으면 자동으로 설정
      if (selectedKeywords && selectedKeywords.length > 0) {
        setCustomKeywords(selectedKeywords);
      }
      
      console.log('✅ 자동 설정 완료:', { mappedCategory, selectedBrandName, selectedKeywords });
    } else {
      console.log('⚠️ selectedBrandName 또는 serviceCategory 없음');
    }
  }, [selectedBrandName, serviceCategory, selectedKeywords]);

  const handleNext = () => {
    if (currentStep === 1 && !customBusiness.trim()) {
      alert('서비스명을 입력해주세요.');
      return;
    }
    if (currentStep === 2 && !customBusiness.trim()) {
      alert('브랜드 네이밍을 입력해주세요.');
      return;
    }
    if (currentStep === 3 && !selectedColor) {
      alert('대표 컬러를 선택해주세요.');
      return;
    }
    if (currentStep === 4 && !selectedStyle) {
      alert('로고 스타일을 선택해주세요.');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleColorSelect = (id: string) => {
    setSelectedColor(id);
    setTimeout(() => setCurrentStep(4), 300);
  };

  const handleStyleSelect = async (id: string) => {
    setSelectedStyle(id);
    // 스타일 선택 시 즉시 생성 시작
    handleGenerate(id);
  };

  const handleGenerate = async (styleId?: string) => {
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    // styleId가 전달되면 사용 (state 업데이트와 별도로 바로 사용)
    const finalStyleId = styleId || selectedStyle;
    if (styleId) {
      setSelectedStyle(styleId);
    }

    setCurrentStep(5); // Step 5: AI 생성 중
    setIsGenerating(true);
    setGeneratedLogos([]);

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        }
        setIsGenerating(false);
        return;
      }

      const business = selectedBusiness === 'other' ? customBusiness : businessTypes.find(b => b.id === selectedBusiness)?.label;
      const keywords = customKeywords.join(', ');
      const color = colors.find(c => c.id === selectedColor);
      const style = styles.find(s => s.id === finalStyleId); // selectedStyle 대신 finalStyleId 사용
      
      // 서비스 타입에 따라 로고 타입 결정
      // The Starter (5,000) → 하이브리드 (서버 폰트 렌더링)
      // The Professional (15,000) → 하이브리드 + DALL-E 심볼마크 조합
      const logoType = pendingServiceType === 'starter' ? 'logotype' : 'combination';
      const brandName = customBusiness.trim();

      // API 엔드포인트 선택
      const apiEndpoint = pendingServiceType === 'starter' 
        ? '/api/logo/generate-hybrid'
        : pendingServiceType === 'professional'
        ? '/api/logo/generate-professional'
        : '/api/logo/generate';

      console.log('📤 로고 생성 API 호출:', {
        pendingServiceType,
        apiEndpoint,
        brandName,
        mood: finalStyleId,
        color: selectedColor,
        style: finalStyleId,
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747${apiEndpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify(
            pendingServiceType === 'starter' || pendingServiceType === 'professional'
              ? {
                  // 하이브리드 API: 간단한 파라미터만
                  brandName,
                  mood: finalStyleId, // Mood가 스타일
                  color: selectedColor,
                  style: finalStyleId,
                  business,
                  keywords,
                }
              : {
                  // DALL-E API: 기존 파라미터 (Rebuilder)
                  business,
                  keywords,
                  color: color?.label,
                  style: style?.label,
                  logoType,
                  brandName,
                  count: 3,
                }
          ),
        }
      );

      if (pendingServiceType === 'starter' || pendingServiceType === 'professional') {
        console.log('📤 하이브리드 로고 생성 요청:', {
          brandName,
          mood: finalStyleId,
          color: selectedColor,
          style: finalStyleId,
          business,
          keywords,
          serviceType: pendingServiceType,
        });
      } else {
        console.log('📤 로고 생성 요청:', {
          business,
          keywords,
          color: color?.label,
          style: style?.label,
          logoType,
          brandName,
          serviceType: pendingServiceType,
          count: 3,
        });
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API 에러 응답:', error);
        throw new Error(error.error || '로고 생성에 실패했습니다.');
      }

      const data = await response.json();

      console.log('✅ API 응답 데이터:', data);

      // Professional: 심볼마크 + 로고타입 선택 플로우
      if (pendingServiceType === 'professional' && data.success && data.symbolMarks && data.logotypes) {
        console.log(`📊 심볼마크 ${data.symbolMarks.length}개, 로고타입 ${data.logotypes.length}개 생성됨`);
        setSymbolMarks(data.symbolMarks);
        setLogotypes(data.logotypes);
        setCurrentStep(6); // Step 6: 내용 확인 (선택 플로우 시작)
        setSubStep(6.1); // 6-1: 심볼마크 선택부터
      }
      // Starter: 로고타입 3개 바로 결과 표시
      else if (data.success && data.logos) {
        console.log(`📊 생성된 로고 개수: ${data.logos.length}`);
        data.logos.forEach((logo: any, idx: number) => {
          console.log(`  로고 ${idx + 1}:`, {
            font: logo.font,
            urlLength: logo.url?.length,
            urlPreview: logo.url?.substring(0, 100) + '...'
          });
        });
        
        setGeneratedLogos(data.logos);
        setSelectedLogo(0);
        setCurrentStep(6); // Step 6: 결과 확인 (Starter)
      } else {
        console.error('❌ API 에러 응답:', data);
        throw new Error(data.error || '로고 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Logo generation error:', error);
      setCurrentStep(4); // 에러 시 Step 4(스타일 선택)로 돌아가기
      alert(error instanceof Error ? error.message : '로고 생성에 실���했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Professional: 심볼마크 + 로고타입 조합
  const handleCombineLogos = async () => {
    if (selectedSymbolIndex === null || selectedLogotypeIndex === null || !selectedLayout) {
      alert('모든 선택을 완료해주세요.');
      return;
    }

    setIsGenerating(true);
    setCurrentStep(5); // 생성 중 화면

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        }
        return;
      }

      const symbolUrl = symbolMarks[selectedSymbolIndex];
      const logotype = logotypes[selectedLogotypeIndex];

      console.log('🔨 조합 API 호출:', {
        hasSymbol: !!symbolUrl,
        hasLogotype: !!logotype,
        layout: selectedLayout
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/combine-logo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify({
            symbolUrl,
            logotype,
            layout: selectedLayout,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '로고 조합에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 조합 결과:', data);

      if (data.success && data.logo) {
        // 2가지 레이아웃으로 조합 생성 (좌우, 상하)
        const layouts: Array<'horizontal-left' | 'vertical-top'> = [
          'horizontal-left',
          'vertical-top'
        ];

        // 2가지 조합 모두 생성
        const combinedLogos = await Promise.all(
          layouts.map(async (layout) => {
            const res = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/combine-logo`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'x-access-token': session.access_token,
                },
                body: JSON.stringify({
                  symbolUrl,
                  logotype,
                  layout,
                }),
              }
            );
            const result = await res.json();
            return result.logo;
          })
        );

        console.log(`✅ 2가지 조합 완료`);
        setGeneratedLogos(combinedLogos);
        setSelectedLogo(0);
        setCurrentStep(7); // Step 7: 결과 확인
      } else {
        throw new Error('로고 조합에 실패했습니다.');
      }
    } catch (error) {
      console.error('Logo combination error:', error);
      alert(error instanceof Error ? error.message : '로고 조합에 실패했습니다.');
      setCurrentStep(6);
      setSubStep(6.3);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. PNG, JPG, SVG, WebP만 가능합니다.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const logoWidth = img.width;
      const logoHeight = img.height;
      URL.revokeObjectURL(imageUrl);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];

        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (onOpenAuthModal) {
            onOpenAuthModal();
          }
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/upload/logo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-User-Token': session.access_token,
            },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: file.name,
              contentType: file.type,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '로고 업로드에 실패했습니다.');
        }

        const aiResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/ai/generate-card`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-User-Token': session.access_token,
            },
            body: JSON.stringify({
              logoUrl: data.logoUrl,
              occupation: customBusiness || 'Professional',
              logoWidth,
              logoHeight,
            }),
          }
        );

        const aiData = await aiResponse.json();

        if (onLogoCreated) {
          onLogoCreated(data.logoUrl, {
            ...aiData,
            business: customBusiness,
            keywords: customKeywords.join(', '),
          });
        }
        
        setTimeout(() => {
          onNavigate('professional');
        }, 100);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert(err.message || '로고 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    const requiredCredits = 10000;
    
    if (userCredits === undefined || userCredits < requiredCredits) {
      alert(`크레딧이 부족합니다. ${requiredCredits.toLocaleString()} 크레딧이 필요합니다.`);
      onNavigate('pricing');
      return;
    }
    
    setPendingServiceType('rebuilder');
    setShowCreditModal(true);
  };

  const handleStartGeneration = (serviceType: 'starter' | 'professional' = 'starter') => {
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      }
      return;
    }

    const requiredCredits = serviceType === 'starter' ? 5000 : 15000;
    
    console.log('🔍 크레딧 체크:', {
      userCredits,
      requiredCredits,
      serviceType,
      hasEnough: userCredits !== undefined && userCredits >= requiredCredits
    });
    
    // userCredits가 명확히 부족한 경우만 에러
    if (userCredits !== undefined && userCredits < requiredCredits) {
      alert(`크레딧이 부족합니다. ${requiredCredits.toLocaleString()} 크레딧이 필요합니다. (현재: ${userCredits.toLocaleString()})`);
      onNavigate('pricing');
      return;
    }
    
    // userCredits가 undefined이거나 충분하면 진행 (모달에서 다시 확인)
    setPendingServiceType(serviceType);
    setShowCreditModal(true);
  };

  const handleCreditConfirm = async () => {
    if (!pendingServiceType) return;
    
    setShowCreditModal(false);
    const requiredCredits = pendingServiceType === 'starter' ? 5000 : 
                            pendingServiceType === 'professional' ? 15000 : 10000;
    
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
            service: 'logo',
            serviceType: pendingServiceType,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '크레딧 차감에 실패했습니다.');
      }
      
      if (onCreditsUpdate) {
        onCreditsUpdate();
      }
      
      if (pendingServiceType === 'rebuilder') {
        document.getElementById('logo-upload')?.click();
      } else {
        // 네이밍에서 온 경우: brandName이 있으면 Step 3(컬러)로 바로 이동
        console.log('🔍 결제 완료 후 체크:', { selectedBrandName, serviceCategory, selectedKeywords });
        if (selectedBrandName) {
          console.log('✅ 네이밍에서 왔음 → Step 3(컬러)로 이동');
          setCurrentStep(3);
        } else {
          console.log('⚠️ 직접 진입 → Step 1(서비스 분야)부터');
          // 직접 진입한 경우 Step 1(서비스 분야)부터
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('Credit deduction error:', error);
      alert(error instanceof Error ? error.message : '크레딧 차감 중 오류가 발생했습니다.');
    }
  };

  const handleSelectLogo = async () => {
    try {
      setIsGenerating(true);
      
      const logo = generatedLogos[selectedLogo];
      const logoUrl = typeof logo === 'string' ? logo : logo.url;
      
      // 로고 생성 시 사용한 데이터 준비
      const business = selectedBusiness === 'other' ? customBusiness : businessTypes.find(b => b.id === selectedBusiness)?.label;
      const logoType = pendingServiceType === 'starter' ? 'logotype' : 'combination';
      
      const logoData = {
        logoUrl,
        business,
        keywords: customKeywords.join(', '),
        color: colors.find(c => c.id === selectedColor)?.label,
        style: styles.find(s => s.id === selectedStyle)?.label,
        brandName: customBusiness.trim(),
        logoType,
        font: typeof logo === 'object' ? logo.font : '',
        fontColor: typeof logo === 'object' ? logo.color : '',
        weight: typeof logo === 'object' ? logo.weight : '',
        spacing: typeof logo === 'object' ? logo.spacing : '',
        transform: typeof logo === 'object' ? logo.transform : '',
        isDuotone: typeof logo === 'object' ? logo.isDuotone : false,
        secondaryColor: typeof logo === 'object' ? logo.secondaryColor : '',
      };
      
      // DALL-E 임시 URL을 Supabase Storage에 영구 저장 (HD 재생성)
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        }
        return;
      }

      // 1. 먼저 마이 로고에 저장
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify(logoData),
        }
      );

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        throw new Error(error.error || '로고 저장에 실패했습니다.');
      }

      console.log('✅ Logo saved to branding box');

      // 2. 로고 이미지를 HD로 재생성하고 영구 저장
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/save-permanent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify(logoData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '로고 저장에 실패했습니다.');
      }

      const data = await response.json();
      const permanentLogoUrl = data.permanentUrl;

      console.log('✅ Logo saved permanently for business card:', permanentLogoUrl);

      if (onLogoCreated) {
        onLogoCreated(permanentLogoUrl, logoData);
      }
      onNavigate('professional');
    } catch (error) {
      console.error('Logo save error:', error);
      alert(error instanceof Error ? error.message : '로고 저장 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveLogo = async (logoIndex?: number) => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (onOpenAuthModal) {
          onOpenAuthModal();
        }
        return;
      }

      // logoIndex가 전달되면 사용, 아니면 selectedLogo 사용
      const indexToUse = logoIndex !== undefined ? logoIndex : selectedLogo;
      const logo = generatedLogos[indexToUse];
      const logoUrl = typeof logo === 'string' ? logo : logo.url; // URL 문자열만 추출
      const business = selectedBusiness === 'other' ? customBusiness : businessTypes.find(b => b.id === selectedBusiness)?.label;
      const logoType = pendingServiceType === 'starter' ? 'logotype' : 'combination';

      console.log('💾 Saving logo to branding box:', {
        logoUrl: logoUrl?.substring(0, 100) + '...',
        logoUrlLength: logoUrl?.length,
        brandName: customBusiness,
        business,
        logoType,
        font: typeof logo === 'object' ? logo.font : undefined,
        index: indexToUse,
        fullLogo: logo
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'x-access-token': session.access_token,
          },
          body: JSON.stringify({
            logoUrl,
            brandName: customBusiness,
            business,
            keywords: customKeywords.join(', '),
            mood: styles.find(s => s.id === selectedStyle)?.label,
            color: colors.find(c => c.id === selectedColor)?.label,
            logoType,
            font: typeof logo === 'object' ? logo.font : '', // "Poppins Bold" (표시용)
            fontFamily: typeof logo === 'object' ? logo.fontFamily : '', // "Poppins" (실제 폰트명)
            fontColor: typeof logo === 'object' ? logo.color : '', // 실제 폰트 색상 hex
            weight: typeof logo === 'object' ? logo.weight : '',
            spacing: typeof logo === 'object' ? logo.spacing : '',
            transform: typeof logo === 'object' ? logo.transform : '',
            isDuotone: typeof logo === 'object' ? logo.isDuotone : false,
            secondaryColor: typeof logo === 'object' ? logo.secondaryColor : '',
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Logo saved successfully:', data);
        alert('✅ 로고가 마이 브랜딩 박스에 저장되었습니다!');
        onNavigate('box');
      } else {
        const error = await response.json();
        console.error('❌ Save error response:', error);
        throw new Error(error.error || '로고 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Logo save error:', error);
      alert(error instanceof Error ? error.message : '로고 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mode Selection */}
      {currentStep === 0 && (
        <div className="flex-1 container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                어떤 방식으로 로고를 만드시겠어요?
              </h2>
              <p className="text-lg text-gray-600">
                3가지 방식 중 하나를 선택하시면, AI가 최적의 결과물을 만들어드립니다
              </p>
            </div>

            {/* Choice Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* The Starter */}
              <Card 
                onClick={() => handleStartGeneration('starter')}
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white shadow-lg">
                    추천
                  </span>
                </div>

                {/* Header with Gradient */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-8 text-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">The Starter</h3>
                    <p className="text-white/90 text-sm font-medium mb-2">AI 자동 로고 생성</p>
                    <div className="text-3xl font-bold">5,000 크레딧</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    처음부터 AI가 로고타입을 자동으로 생성합니다
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>서비스명과 키워드만 입력</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>AI가 로고타입 3종 자동 생성</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>텍스트 중심의 깔끔한 로고</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>명함 제작에 바로 사용 가능</span>
                    </li>
                  </ul>

                  {/* Button */}
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 font-semibold pointer-events-none">
                    AI 로고 생성하기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>

              {/* The Professional */}
              <Card 
                onClick={() => handleStartGeneration('professional')}
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
              >
                {/* Header with Gradient */}
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Palette className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">The Professional</h3>
                    <p className="text-white/90 text-sm font-medium mb-2">AI 맞춤 마크 + 로고 생성</p>
                    <div className="text-3xl font-bold">15,000 크레딧</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    심볼마크와 로고를 함께 생성하여 전문적인 브랜딩
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>심볼마크 + 로고타입 조합</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>브랜드 아이덴티티 강화</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>다양한 스타일 옵션 제공</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>고품질 인쇄 가능 해상도</span>
                    </li>
                  </ul>

                  {/* Button */}
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-semibold pointer-events-none">
                    AI 로고 생성하기
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>

              {/* The Rebuilder */}
              <Card 
                onClick={handleUploadClick}
                className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-105"
              >
                {/* Header with Gradient */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1">The Rebuilder</h3>
                    <p className="text-white/90 text-sm font-medium mb-2">기존 로고 업로드</p>
                    <div className="text-3xl font-bold">10,000 크레딧</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    이미 가지고 있는 로고 파일을 업로드하여 사용
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>PNG, JPG, SVG 파일 지원</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>기존 브랜드 아이덴티티 유지</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>명함 제작에 바로 활용</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5">•</span>
                      <span>빠른 명함 제작 가능</span>
                    </li>
                  </ul>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {/* Button */}
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 font-semibold pointer-events-none"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        업로드 중...
                      </>
                    ) : (
                      <>
                        내 로고 사용하기
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
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
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">전문적인 브랜딩</h4>
                <p className="text-sm text-gray-600">The Professional로 심볼마크를 함께 제작하세요</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">이미 로고가 있다면</h4>
                <p className="text-sm text-gray-600">The Rebuilder로 업로드하세요</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Steps */}
      {currentStep >= 1 && currentStep <= 5 && (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Progress Indicator */}
          <div className="bg-white border-b py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 1 ? 'bg-green-600 text-white shadow-lg' : currentStep > 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">1</span>
                  <span>서비스 분야</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 2 ? 'bg-green-600 text-white shadow-lg' : currentStep > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">2</span>
                  <span>네이밍</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 3 ? 'bg-green-600 text-white shadow-lg' : currentStep > 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">3</span>
                  <span>컬러</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 4 ? 'bg-green-600 text-white shadow-lg' : currentStep > 4 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">4</span>
                  <span>스타일</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 5 ? 'bg-green-600 text-white shadow-lg' : currentStep > 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">5</span>
                  <span>AI 생성</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className={`px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap ${
                  currentStep === 6 ? 'bg-green-600 text-white shadow-lg' : currentStep > 6 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  <span className="font-bold">6</span>
                  <span>결과 확인</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========== THE STARTER FLOW (초록색) ========== */}
          {pendingServiceType === 'starter' && (
            <LogoCreationStarter
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              customBusiness={customBusiness}
              setCustomBusiness={setCustomBusiness}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedStyle={selectedStyle}
              handleStyleSelect={handleStyleSelect}
              isGenerating={isGenerating}
              generatedLogos={generatedLogos}
              colors={colors}
              styles={styles}
              handleSaveLogo={handleSaveLogo}
              handleSelectLogo={handleSelectLogo}
              setPreviewIndex={setPreviewIndex}
              setShowPreviewModal={setShowPreviewModal}
              setGeneratedLogos={setGeneratedLogos}
              setPendingServiceType={setPendingServiceType}
              selectedLogo={selectedLogo}
              setSelectedLogo={setSelectedLogo}
            />
          )}
        </div>
      )}

      {/* Step 5: AI 생성 중 */}
      {currentStep === 5 && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center z-40">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-green-600" />
            <h2 className="text-3xl font-bold mb-2">AI가 로고를 생성하고 있습니다</h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </div>
        </div>
      )}

      {/* Step 6: 결과 확인 (Starter) */}
      {currentStep === 6 && pendingServiceType === 'starter' && generatedLogos.length > 0 && (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
          {/* Progress Indicator */}
          <div className="bg-white border-b py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-green-100 text-green-700">
                  <span className="font-bold">1</span>
                  <span>서비스 분야</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-green-100 text-green-700">
                  <span className="font-bold">2</span>
                  <span>네이밍</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-green-100 text-green-700">
                  <span className="font-bold">3</span>
                  <span>컬러</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-green-100 text-green-700">
                  <span className="font-bold">4</span>
                  <span>스타일</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-green-600 text-white shadow-lg">
                  <span className="font-bold">5</span>
                  <span>결과 확인</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12 flex-1">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">로고가 완성되었습니다! 🎉</h2>
                <p className="text-gray-600">마음에 드는 디자인을 선택하세요</p>
              </div>

              {/* 3개의 로고 카드 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {generatedLogos.map((logo, index) => (
                  <Card
                    key={index}
                    className="p-6 transition-all hover:shadow-lg"
                  >
                    {/* 로고 이미지 - FontPreview 사용 */}
                    <div 
                      className="cursor-zoom-in"
                      onClick={() => {
                        setPreviewIndex(index);
                        setShowPreviewModal(true);
                      }}
                    >
                      {typeof logo === 'object' && (logo.fontFamily || logo.font) ? (
                        <FontPreview
                          font={logo.fontFamily || logo.font?.split(' ')[0] || 'Arial'}
                          text={customBusiness.trim()}
                          weight={logo.weight || '400'}
                          color={logo.color || colors.find(c => c.id === selectedColor)?.hex || '#2563EB'}
                          duotone={logo.isDuotone || false}
                          secondaryColor={logo.secondaryColor}
                          letterSpacing={logo.spacing || '0'}
                        />
                      ) : <div className="h-64 flex items-center justify-center text-gray-400">로고 로딩 중...</div>}
                    </div>

                    {/* 옵션 번호 및 폰트 이름 */}
                    <div className="mb-4 text-center">
                      <p className="text-lg font-bold">
                        옵션 {index + 1}
                      </p>
                      {typeof logo === 'object' && logo.font && (
                        <p className="text-sm text-gray-500 mt-1">
                          {logo.font}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSaveLogo(index)}
                        className="w-full h-11 font-medium border-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        마이 로고에 저장 후 확인
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedLogo(index);
                          handleSelectLogo();
                        }}
                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        명함 만들기
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(0);
                    setGeneratedLogos([]);
                    setPendingServiceType(null);
                  }}
                  className="px-8 h-12"
                >
                  <Home className="w-4 h-4 mr-2" />
                  처음으로
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 6: 내용 확인 (Professional 선택 플로우) */}
      {currentStep === 6 && pendingServiceType === 'professional' && subStep && (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-purple-50">
          {/* Progress Indicator - Professional */}
          <div className="bg-white border-b py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">1</span>
                  <span>서비스 분야</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">2</span>
                  <span>네이밍</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">3</span>
                  <span>컬러</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">4</span>
                  <span>스타일</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-600 text-white shadow-lg">
                  <span className="font-bold">5</span>
                  <span>내용 확인</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12">
            <div className="max-w-6xl mx-auto">
              {/* Step 6-1: 심볼마크 선택 */}
              {subStep === 6.1 && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">심볼마크를 선택하세요 🎨</h2>
                    <p className="text-gray-600">마음에 드는 심볼마크 1개를 골라주세요</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {symbolMarks.map((symbol, index) => (
                      <Card
                        key={index}
                        className={`p-6 cursor-pointer transition-all ${
                          selectedSymbolIndex === index
                            ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedSymbolIndex(index)}
                      >
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                          <img
                            src={symbol}
                            alt={`Symbol ${index + 1}`}
                            className="max-w-full max-h-full object-contain p-4"
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-bold">옵션 {index + 1}</p>
                          {selectedSymbolIndex === index && (
                            <p className="text-purple-600 font-semibold mt-2">✓ 선택됨</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={() => {
                        if (selectedSymbolIndex === null) {
                          alert('심볼마크를 선택해주세요.');
                          return;
                        }
                        setSubStep(6.2);
                      }}
                      disabled={selectedSymbolIndex === null}
                      className="px-12 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      다음: 로고타입 선택
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 6-2: 로고타입 선택 */}
              {subStep === 6.2 && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">로고타입을 선택하세요 ✍️</h2>
                    <p className="text-gray-600">마음에 드는 로고타입 1개를 골라주세요</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {logotypes.map((logotype, index) => (
                      <Card
                        key={index}
                        className={`p-6 cursor-pointer transition-all ${
                          selectedLogotypeIndex === index
                            ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedLogotypeIndex(index)}
                      >
                        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                          <img
                            src={logotype.url}
                            alt={`Logotype ${index + 1}`}
                            className="max-w-full max-h-full object-contain p-4"
                          />
                        </div>
                        <div className="text-center">
                          <p className="font-bold">옵션 {index + 1}</p>
                          <p className="text-sm text-gray-500 mt-1">{logotype.font}</p>
                          {selectedLogotypeIndex === index && (
                            <p className="text-purple-600 font-semibold mt-2">✓ 선택됨</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSubStep(6.1)}
                      className="px-8 h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      이전
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedLogotypeIndex === null) {
                          alert('로고타입을 선택해주세요.');
                          return;
                        }
                        setSubStep(6.3);
                      }}
                      disabled={selectedLogotypeIndex === null}
                      className="px-12 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      다음: 조합 방식 선택
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 6-3: 조합 방식 선택 */}
              {subStep === 6.3 && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-2">조합 방식을 선택하세요 🔄</h2>
                    <p className="text-gray-600">심볼마크와 로고타입의 배치를 선택해주세요</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
                    {[
                      { id: 'horizontal-left' as const, label: '좌우 배치', icon: '● ━━━', desc: '심볼마크 왼쪽 + 텍스트 오른쪽' },
                      { id: 'vertical-top' as const, label: '상하 배치', icon: '●\n━━', desc: '심볼마크 위 + 텍스트 아래' },
                    ].map((layout) => (
                      <Card
                        key={layout.id}
                        className={`p-8 cursor-pointer transition-all ${
                          selectedLayout === layout.id
                            ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                            : 'hover:shadow-lg'
                        }`}
                        onClick={() => setSelectedLayout(layout.id)}
                      >
                        <div className="text-center">
                          <div className="text-5xl mb-4 whitespace-pre-line font-bold">{layout.icon}</div>
                          <p className="font-bold text-xl mb-2">{layout.label}</p>
                          <p className="text-sm text-gray-500">{layout.desc}</p>
                          {selectedLayout === layout.id && (
                            <p className="text-purple-600 font-semibold mt-4">✓ 선택됨</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSubStep(6.2)}
                      className="px-8 h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      이전
                    </Button>
                    <Button
                      onClick={handleCombineLogos}
                      disabled={!selectedLayout || isGenerating}
                      className="px-12 h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          로고 생성하기
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 7: 결과 확인 (Professional 전용) */}
      {currentStep === 7 && pendingServiceType === 'professional' && generatedLogos.length > 0 && (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-purple-50">
          {/* Progress Indicator - Professional */}
          <div className="bg-white border-b py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">1</span>
                  <span>서비스 분야</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">2</span>
                  <span>네이밍</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">3</span>
                  <span>컬러</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-100 text-purple-700">
                  <span className="font-bold">4</span>
                  <span>스타일</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-purple-600 text-white shadow-lg">
                  <span className="font-bold">5</span>
                  <span>결과 확인</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12 flex-1">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">로고가 완성되었습니다! 🎉</h2>
                <p className="text-gray-600">마음에 드는 디자인을 선택하세요</p>
              </div>

              {/* 3개의 로고 카드 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {generatedLogos.map((logo, index) => (
                  <Card
                    key={index}
                    className="p-6 transition-all hover:shadow-lg"
                  >
                    {/* 로고 이미지 */}
                    <div 
                      className="cursor-zoom-in h-64 bg-gray-50 rounded-lg flex items-center justify-center"
                      onClick={() => {
                        setPreviewIndex(index);
                        setShowPreviewModal(true);
                      }}
                    >
                      {typeof logo === 'object' && logo.url ? (
                        <img 
                          src={logo.url} 
                          alt={`Logo ${index + 1}`}
                          className="max-w-full max-h-full object-contain p-4"
                        />
                      ) : <div className="text-gray-400">로고 로딩 중...</div>}
                    </div>

                    {/* 옵션 번호 및 폰트 이름 */}
                    <div className="mb-4 text-center">
                      <p className="text-lg font-bold">
                        옵션 {index + 1}
                      </p>
                      {typeof logo === 'object' && logo.font && (
                        <p className="text-sm text-gray-500 mt-1">
                          {logo.font}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => handleSaveLogo(index)}
                        className="w-full h-11 font-medium border-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        마이 로고에 저장 후 확인
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setSelectedLogo(index);
                          handleSelectLogo();
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 font-semibold"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        명함 만들기
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 처음으로 버튼 */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  className="px-8 h-12 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  처음으로
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* 로고 미리보기 모달 */}
      {showPreviewModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <span>ESC</span>
                <span className="text-2xl">✕</span>
              </div>
            </button>

            {/* 로고 이미지 */}
            <div className="bg-white rounded-2xl p-12 mb-4">
              <div className="aspect-square flex items-center justify-center">
                {typeof generatedLogos[previewIndex] === 'object' && generatedLogos[previewIndex].fontFamily ? (
                  <FontPreview
                    font={generatedLogos[previewIndex].fontFamily}
                    text={transformText(customBusiness.trim(), generatedLogos[previewIndex].transform)}
                    weight={generatedLogos[previewIndex].weight || '400'}
                    color={generatedLogos[previewIndex].color || colors.find(c => c.id === selectedColor)?.hex || '#2563EB'}
                    duotone={generatedLogos[previewIndex].isDuotone || false}
                    secondaryColor={generatedLogos[previewIndex].secondaryColor}
                    letterSpacing={generatedLogos[previewIndex].spacing || '0'}
                  />
                ) : null}
              </div>
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPreviewIndex((previewIndex - 1 + generatedLogos.length) % generatedLogos.length)}
                disabled={generatedLogos.length <= 1}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">이전</span>
              </button>

              <div className="text-white font-medium">
                {previewIndex + 1} / {generatedLogos.length}
              </div>

              <button
                onClick={() => setPreviewIndex((previewIndex + 1) % generatedLogos.length)}
                disabled={generatedLogos.length <= 1}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium">다음</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 크레딧 확인 모달 */}
      <CreditConfirmModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleCreditConfirm}
        serviceName={
          pendingServiceType === 'starter' ? 'The Starter' :
          pendingServiceType === 'professional' ? 'The Professional' : 'The Rebuilder'
        }
        serviceType={
          pendingServiceType === 'starter' ? 'AI 자동 로고 생성' :
          pendingServiceType === 'professional' ? 'AI 맞춤 로고 생성' : '기존 로고 업로드'
        }
        requiredCredits={
          pendingServiceType === 'starter' ? 5000 :
          pendingServiceType === 'professional' ? 15000 : 10000
        }
        currentCredits={userCredits || 0}
        gradient={
          pendingServiceType === 'starter' ? 'from-emerald-500 to-teal-500' :
          pendingServiceType === 'professional' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500'
        }
      />
    </div>
  );
}