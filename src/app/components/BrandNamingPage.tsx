import { useState } from 'react';
import { Sparkles, Search, CheckCircle2, XCircle, AlertCircle, Globe, Scale, Copy, Edit3, ArrowLeft, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { ServiceSelectionModal } from './ServiceSelectionModal';
import { CreditConfirmModal } from './CreditConfirmModal';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getSupabaseClient } from '../../../utils/supabase/client';



// ✅ 네이밍 저장 함수
const saveNamingWithRetry = async (
  namingData: {
    koreanName: string;
    name: string;
    description: string;
    serviceCategory: string;
    keywords: string[];
  },
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔍 디버깅: 저장 시작', namingData);
    
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
      `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/save`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'x-access-token': session.access_token,
        },
        body: JSON.stringify(namingData),
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
    
  } catch (error) {
    console.error('❌ 예외:', error);
    return { success: false, error: '오류 발생' };
  }
};

interface BrandNamingPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onOpenAuthModal: () => void;
  onBrandNameSelect?: (brandName: string, serviceType: string) => void;
  initialJobInput?: string; // 홈에서 전달받은 직업 입력값
  userCredits?: number;
  userPackage?: string | null;
  onServiceConfirm?: (service: any) => void;
  onCreditsUpdate?: (newCredits: number) => void;
}

interface NameCandidate {
  koreanName?: string; // 한글 브랜드명
  name: string; // 영문 브랜드명
  description: string;
  domains: {
    com: boolean | null;
    cokr: boolean | null;
    kr: boolean | null;
    [key: string]: boolean | null;
  };
  industryDomains?: string[];
  trademark: {
    exists: boolean | null;
    similarity: number | null;
    warning: string | null;
  };
  loading: boolean;
}

// 서비스 성격 옵션들
const SERVICE_CATEGORIES = [
  { id: 'IT 서비스', label: 'IT/기술', emoji: '💻', keywords: ['혁신', '기술', '디지털', '솔루션'] },
  { id: '디자인', label: '디자인/크리에이티브', emoji: '🎨', keywords: ['크리에이티브', '디자인', '비주얼', '아트'] },
  { id: '컨설팅', label: '컨설팅/전문', emoji: '💼', keywords: ['전문', '컨설팅', '전략', '솔루션'] },
  { id: '쇼핑', label: '쇼핑/커머스', emoji: '🛍️', keywords: ['쇼핑', '판매', '브랜드', '제품'] },
  { id: '교육', label: '교육/강의', emoji: '📚', keywords: ['교육', '학습', '성장', '발전'] },
  { id: '미디어', label: '미디어/콘텐츠', emoji: '📱', keywords: ['콘텐츠', '미디어', '스토리', '크리에이터'] },
  { id: '헬스', label: '헬스/건강', emoji: '💪', keywords: ['건강', '웰니스', '라이프', '케어'] },
  { id: '금융', label: '금융/투자', emoji: '💰', keywords: ['금융', '투자', '자산', '성장'] },
  { id: '음식', label: '음식/외식', emoji: '🍽️', keywords: ['맛', '음식', '요리', '레스토랑'] },
  { id: '여행', label: '여행/관광', emoji: '✈️', keywords: ['여행', '탐험', '경험', '세계'] },
  { id: '예술', label: '예술/문화', emoji: '🎭', keywords: ['예술', '문화', '창작', '감성'] },
  { id: '스포츠', label: '스포츠/피트니스', emoji: '⚽', keywords: ['스포츠', '운동', '활력', '에너지'] },
];

export function BrandNamingPage({ onNavigate, user, onOpenAuthModal, onBrandNameSelect, initialJobInput, userCredits, userPackage, onServiceConfirm, onCreditsUpdate }: BrandNamingPageProps) {
  // initialJobInput이 있으면 서비스 분야가 이미 입력된 것이므로 'keywords' 단계로 시작
  const [step, setStep] = useState<'choice' | 'service' | 'keywords' | 'generating' | 'results' | 'manual' | 'manual-checking' | 'manual-results'>(
    initialJobInput ? 'keywords' : 'choice'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(initialJobInput || '');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [candidates, setCandidates] = useState<NameCandidate[]>([]);
  
  // 수동 입력 모드용 state
  const [manualNames, setManualNames] = useState<string[]>(['', '', '']);
  const [checking, setChecking] = useState(false);

  // 크레딧 확인 모달 state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);

  // 추천 키워드 목록 (일반적으로 많이 쓰이는 키워드들)
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

  // 커스텀 키워드 추가
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const handleGenerate = async () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }

    if (!selectedCategory) {
      alert('서비스 성격을 입력해주세요.');
      return;
    }

    if (customKeywords.length === 0) {
      alert('최소 1개의 키워드를 선택해주세요.');
      return;
    }

    setGenerating(true);
    setCandidates([]);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            serviceType: selectedCategory, 
            keywords: customKeywords.join(', ') 
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error?.includes('quota') || data.error?.includes('insufficient_quota')) {
          throw new Error('OpenAI API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error(data.error || '네임 생성에 실패했습니다.');
      }

      const initialCandidates: NameCandidate[] = data.names.map((item: any) => ({
        koreanName: item.koreanName, // 한글 브랜드명 추가
        name: item.name,
        description: item.description,
        domains: { com: null, cokr: null, kr: null },
        trademark: { exists: null, similarity: null, warning: null },
        loading: true,
      }));

      setCandidates(initialCandidates);
      setStep('results'); // 결과 화면으로 자동 전환

      for (let i = 0; i < initialCandidates.length; i++) {
        const candidate = initialCandidates[i];
        
        Promise.all([
          checkDomain(candidate.name),
          checkTrademark(candidate.name),
        ]).then(([domainResult, trademarkResult]) => {
          setCandidates((prev) =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    ...domainResult,
                    trademark: trademarkResult,
                    loading: false,
                  }
                : c
            )
          );
        });
      }
    } catch (error) {
      console.error('Failed to generate brand names:', error);
      alert(error instanceof Error ? error.message : '네임 생성에 실패했습니다.');
      setStep('keywords'); // 에러 시 키워드 단계로 돌아가기
    } finally {
      setGenerating(false);
    }
  };

  const checkDomain = async (name: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/check-domain`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ name, serviceType: selectedCategory }),
        }
      );

      const data = await response.json();
      return { 
        domains: data.domains || { com: null, cokr: null, kr: null },
        industryDomains: data.industryDomains || []
      };
    } catch (error) {
      console.error('Domain check failed:', error);
      return { 
        domains: { com: null, cokr: null, kr: null },
        industryDomains: []
      };
    }
  };

  const checkTrademark = async (name: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/check-trademark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();
      return data.trademark || { exists: null, similarity: null, warning: null };
    } catch (error) {
      console.error('Trademark check failed:', error);
      return { exists: null, similarity: null, warning: null };
    }
  };

  const handleCheckManualNames = async () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }

    const filledNames = manualNames.filter(name => name.trim() !== '');
    if (filledNames.length === 0) {
      alert('최소 1개 이상의 네이밍을 입력해주세요.');
      return;
    }

    setChecking(true);
    setCandidates([]);

    try {
      const initialCandidates: NameCandidate[] = filledNames.map((name) => ({
        name: name.trim(),
        description: '직접 입력한 네이밍',
        domains: { com: null, cokr: null, kr: null },
        trademark: { exists: null, similarity: null, warning: null },
        loading: true,
      }));

      setCandidates(initialCandidates);

      for (let i = 0; i < initialCandidates.length; i++) {
        const candidate = initialCandidates[i];
        
        Promise.all([
          checkDomain(candidate.name),
          checkTrademark(candidate.name),
        ]).then(([domainResult, trademarkResult]) => {
          setCandidates((prev) =>
            prev.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    ...domainResult,
                    trademark: trademarkResult,
                    loading: false,
                  }
                : c
            )
          );
        });
      }
    } catch (error) {
      console.error('Failed to check manual names:', error);
      alert(error instanceof Error ? error.message : '네이밍 체크에 실패했습니다.');
    } finally {
      setChecking(false);
      setStep('manual-results');
    }
  };

  const updateManualName = (index: number, value: string) => {
    const newManualNames = [...manualNames];
    newManualNames[index] = value;
    setManualNames(newManualNames);
  };

  const getDomainStatusIcon = (available: boolean | null) => {
    if (available === null) {
      return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
    return available ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getTrademarkStatus = (trademark: NameCandidate['trademark']) => {
    if (trademark.exists === null) {
      return { icon: <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />, text: '확인 중...', color: 'text-gray-600' };
    }
    
    if (trademark.exists && trademark.similarity && trademark.similarity > 70) {
      return { icon: <XCircle className="w-4 h-4 text-red-600" />, text: `유사 상표 존재 (${trademark.similarity}%)`, color: 'text-red-600' };
    }
    
    if (trademark.exists && trademark.similarity && trademark.similarity > 50) {
      return { icon: <AlertCircle className="w-4 h-4 text-orange-600" />, text: `주의 필요 (${trademark.similarity}%)`, color: 'text-orange-600' };
    }
    
    return { icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, text: '사용 가능', color: 'text-green-600' };
  };

  const handleCopyName = async (name: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(name);
        alert(`"${name}" 복사되었습니다.`);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = name;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          alert(`"${name}" 복사되었습니다.`);
        } catch (err) {
          console.error('Fallback copy failed:', err);
        }
        textArea.remove();
      }
    } catch (err) {
      console.error('Copy failed:', err);
      // Show the text for manual copy
      alert(`복사할 텍스트: ${name}`);
    }
  };

  // 진행 인디케이터 렌더링
  const renderProgressIndicator = () => {
    let steps;
    
    if (step === 'manual' || step === 'manual-checking' || step === 'manual-results') {
      // 수동 입력 플로우는 3단계
      steps = [
        { 
          id: 1, 
          label: '네이밍 입력', 
          status: step === 'manual' ? 'current' : 'completed'
        },
        { 
          id: 2, 
          label: 'AI 분석', 
          status: step === 'manual' ? 'upcoming' : step === 'manual-checking' ? 'current' : 'completed'
        },
        { 
          id: 3, 
          label: '결과 확인', 
          status: step === 'manual-results' ? 'current' : 'upcoming'
        },
      ];
    } else {
      // AI 추천 플로우는 4단계
      steps = [
        { 
          id: 1, 
          label: '서비스 분야', 
          status: step === 'service' ? 'current' : (step === 'keywords' || step === 'generating' || step === 'results' ? 'completed' : 'upcoming')
        },
        { 
          id: 2, 
          label: '키워드 선택', 
          status: step === 'service' ? 'upcoming' : step === 'keywords' ? 'current' : (step === 'generating' || step === 'results' ? 'completed' : 'upcoming')
        },
        { 
          id: 3, 
          label: 'AI 생성', 
          status: step === 'generating' ? 'current' : (step === 'results' ? 'completed' : 'upcoming')
        },
        { 
          id: 4, 
          label: '결과 확인', 
          status: step === 'results' ? 'current' : 'upcoming'
        },
      ];
    }

    // 서비스 타입에 따른 색상 설정
    const getColorClasses = () => {
      if (pendingChoice === 'starter') {
        return {
          current: 'bg-emerald-600 text-white shadow-lg',
          completed: 'bg-emerald-100 text-emerald-700',
        };
      } else if (pendingChoice === 'rebuilder') {
        return {
          current: 'bg-blue-600 text-white shadow-lg',
          completed: 'bg-blue-100 text-blue-700',
        };
      } else {
        return {
          current: 'bg-purple-600 text-white shadow-lg',
          completed: 'bg-purple-100 text-purple-700',
        };
      }
    };

    const colors = getColorClasses();

    return (
      <div className="bg-white border-b py-6">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-3">
            {steps.map((s, index) => (
              <div key={s.id} className="flex items-center gap-3">
                {/* Step Pill */}
                <div
                  className={`px-6 py-3 rounded-full flex items-center gap-2 font-medium text-sm transition-all ${
                    s.status === 'current'
                      ? colors.current
                      : s.status === 'completed'
                      ? colors.completed
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="font-bold">{s.id}</span>
                  <span>{s.label}</span>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="w-12 h-0.5 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 선택 화면
  if (step === 'choice') {
    const choices = [
      {
        id: 'starter',
        title: 'The Starter',
        subtitle: '국내 도메인 네이밍',
        credits: '1,500 크레딧',
        description: 'AI가 국내 도메인 등록 가능 3개의 영문 네이밍을 추천합니다',
        icon: <Sparkles className="w-12 h-12" />,
        features: [
          '서비스 성격 선택만으로 시작',
          '키워드 자동 추천 및 선택',
          '국내 도메인(.co.kr, .kr 등 5종) 등록 가능한 영문 네이밍',
          '도메인·상표권 자동 체크',
        ],
        buttonText: 'AI 네이밍 생성하기',
        badge: null,
        gradient: 'from-emerald-500 to-teal-500',
      },
      {
        id: 'ai',
        title: 'The Professional',
        subtitle: '.com 도메인 네이밍',
        credits: '2,500 크레딧',
        description: 'AI가 .com 도메인 등록 가능 3개의 영문 네이밍을 추천합니다',
        icon: <Sparkles className="w-12 h-12" />,
        features: [
          '서비스 성격 선택만으로 시작',
          '키워드 자동 추천 및 선택',
          '국제/국내 도메인(.com, .co.kr, .kr 등 5종) 등록 가능한 영문 네이밍',
          '도메인·상표권 자동 체크',
        ],
        buttonText: 'AI 네이밍 생성하기',
        badge: '추천',
        gradient: 'from-purple-500 to-pink-500',
      },
      {
        id: 'manual',
        title: 'The Rebuilder',
        subtitle: '네이밍 검증',
        credits: '500 크레딧',
        description: '이미 생각해둔 네이밍의 도메인·상표권의 가용성을 확인합니다',
        icon: <Edit3 className="w-12 h-12" />,
        features: [
          '이미 정한 네이밍 확인',
          '최대 3개까지 한 번에 체크',
          '국제/국내 도메인(.com, .co.kr, .kr 등 5종) 가용성 즉시 확인',
          '상표권 중복 여부 검사',
        ],
        buttonText: '내 네이밍 사용하기',
        badge: null,
        gradient: 'from-blue-500 to-cyan-500',
      },
    ];

    const handleChoiceSelect = (choiceId: string) => {
      // 로그인 체크
      if (!user) {
        onOpenAuthModal();
        return;
      }
      
      // 크레딧 요구량 결정
      const creditRequirements: { [key: string]: number } = {
        'starter': 1500,
        'ai': 2500,
        'manual': 500,
      };
      
      const requiredCredits = creditRequirements[choiceId] || 0;
      
      // 크레딧 체크
      if (userCredits === undefined || userCredits < requiredCredits) {
        // 크레딧 부족 - pricing 페이지로 이동
        alert(`크레딧이 부족합니다. ${requiredCredits.toLocaleString()} 크레딧이 필요합니다.`);
        onNavigate('pricing');
        return;
      }
      
      // 확인 모달 열기
      setPendingChoice(choiceId);
      setShowCreditModal(true);
    };

    const handleCreditConfirm = async () => {
      if (!pendingChoice) return;
      
      const creditRequirements: { [key: string]: number } = {
        'starter': 1500,
        'ai': 2500,
        'manual': 500,
      };
      
      const requiredCredits = creditRequirements[pendingChoice] || 0;
      
      // 모달 닫기
      setShowCreditModal(false);
      
      // 크레딧 차감
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('🔐 세션 확인:', {
          hasSession: !!session,
          userId: session?.user?.id,
          tokenLength: session?.access_token?.length,
          tokenPreview: session?.access_token?.substring(0, 30) + '...'
        });
        
        if (!session) {
          console.log('❌ 세션 없음 - 로그인 모달 열기');
          onOpenAuthModal();
          return;
        }
        
        console.log('📤 크레딧 차감 요청:', {
          amount: requiredCredits,
          service: 'naming',
          serviceType: pendingChoice,
          hasAuthHeader: true
        });
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/deduct-credits`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'X-Access-Token': session.access_token,
            },
            body: JSON.stringify({
              userId: session.user.id,
              amount: requiredCredits,
              service: 'naming',
              serviceType: pendingChoice,
            }),
          }
        );
        
        console.log('✅ 크레딧 차감 API 응답:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });
        
        if (!response.ok) {
          const error = await response.json();
          console.error('❌ 크레딧 차감 실패 상세:', {
            status: response.status,
            error: error,
            requiredCredits,
            service: 'naming',
            serviceType: pendingChoice
          });
          throw new Error(error.error || `크레딧 차감에 실패했습니다 (${response.status})`);
        }
        
        const result = await response.json();
        console.log('✅ 크레딧 차감 성공:', result);
        
        // UI 크레딧 업데이트
        if (onCreditsUpdate && result.remainingCredits !== undefined) {
          onCreditsUpdate(result.remainingCredits);
        }
        
        // 크레딧 차감 성공 - 다음 단계로 이동
        setStep(pendingChoice === 'ai' || pendingChoice === 'starter' ? 'service' : 'manual');
        setPendingChoice(null);
      } catch (error) {
        console.error('❌ Credit deduction error:', error);
        alert(error instanceof Error ? error.message : '크레딧 차감 중 오류가 발생했습니다.');
        setPendingChoice(null);
      }
    };

    const getServiceInfo = () => {
      const serviceNames: { [key: string]: string } = {
        'starter': 'The Starter',
        'ai': 'The Professional',
        'manual': 'The Rebuilder',
      };
      
      const gradients: { [key: string]: string } = {
        'starter': 'from-emerald-500 to-teal-500',
        'ai': 'from-purple-500 to-pink-500',
        'manual': 'from-blue-500 to-cyan-500',
      };
      
      return {
        name: serviceNames[pendingChoice || ''] || '',
        gradient: gradients[pendingChoice || ''] || 'from-blue-600 to-purple-600',
      };
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Main Content - 선택 화면에서는 인디케이터 없음 */}
        <div className="flex-1 container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                어떤 방식으로 네이밍을 하시겠어요?
              </h2>
              <p className="text-lg text-gray-600">
                3가지 옵션 중 하나를 선택하세요
              </p>
            </div>

            {/* Choice Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {choices.map((choice) => (
                <Card
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id)}
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
                  <div className={`bg-gradient-to-br ${choice.gradient} p-6 text-white`}>
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
                      {choice.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-0.5">•</span>
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
                <h4 className="font-semibold mb-2">국내 도메인만 필요하다면</h4>
                <p className="text-sm text-gray-600">The Starter로 빠르게 시작하세요</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">.com 도메인이 필요하다면</h4>
                <p className="text-sm text-gray-600">The Professional로 글로벌 진출을 준비하세요</p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">이미 정한 네이밍이 있다면</h4>
                <p className="text-sm text-gray-600">The Rebuilder로 검증하세요</p>
              </div>
            </div>

          </div>
        </div>

        {/* Credit Confirm Modal */}
        {pendingChoice && (
          <CreditConfirmModal
            isOpen={showCreditModal}
            onClose={() => {
              setShowCreditModal(false);
              setPendingChoice(null);
            }}
            onConfirm={handleCreditConfirm}
            serviceName={getServiceInfo().name}
            serviceType="브랜드 네이밍"
            requiredCredits={
              pendingChoice === 'starter' ? 1500 :
              pendingChoice === 'ai' ? 2500 :
              500
            }
            currentCredits={userCredits || 0}
            gradient={getServiceInfo().gradient}
          />
        )}

        <Footer />
      </div>
    );
  }

  // AI 추천 또는 수동 입력 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Progress Indicator */}
      {renderProgressIndicator()}

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12">
        {/* 서비스 분야 입력 화면 (AI 모드 1단계) */}
        {step === 'service' && (
          <div className="max-w-4xl mx-auto">
            {/* 설명 영역 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      STEP 1
                    </span>
                    <span className="text-sm text-gray-500">총 4단계 중</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    어떤 서비스인가요?
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    서비스의 성격을 자유롭게 입력해주세요. AI가 입력하신 내용을 분석해서 
                    <strong className="text-blue-600"> 국내 도메인 등록이 가능한</strong> 기억하기 쉬운 네이밍을 추천해드립니다.
                  </p>
                  <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">💡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">입력 예시</p>
                      <p className="text-sm text-blue-700">
                        "프리미엄 요가 스튜디오", "AI 기반 마케팅 솔루션", "친환경 뷰티 브랜드", "온라인 교육 플랫폼"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 입력 영역 */}
            <Card className="p-8 shadow-lg border-2 border-gray-200">
              <div className="max-w-2xl mx-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  서비스 성격을 입력해주세요
                </label>
                <Input
                  placeholder="예: IT 스타트업, 패션 브랜드, 카페, 요가 스튜디오"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-lg h-16 border-2 focus:border-purple-500"
                  autoFocus
                />
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => setStep('keywords')}
                    disabled={!selectedCategory.trim()}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    다음 단계로
                    <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                  </Button>
                  {!selectedCategory.trim() && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      서비스 성격을 입력하면 다음 단계로 진행할 수 있습니다
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 키워드 선택 화면 (AI 모드 2단계) */}
        {step === 'keywords' && (
          <div className="max-w-4xl mx-auto">
            {/* 설명 영역 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      STEP 2
                    </span>
                    <span className="text-sm text-gray-500">총 4단계 중</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    브랜드를 표현할 핵심 키워드를 선택하세요
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    <strong className="text-purple-600">"{selectedCategory}"</strong> 서비스에 어울리는 키워드를 최대 4개까지 선택해주세요.
                    선택하신 키워드를 바탕으로 AI가 더욱 정확하고 매력적인 브랜드 네이밍을 생성합니다.
                  </p>
                  <div className="flex items-start gap-2 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">💡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900 mb-1">선택 팁</p>
                      <p className="text-sm text-purple-700">
                        브랜드의 핵심 가치나 차별점을 나타내는 키워드를 선택하면 더 좋은 결과를 얻을 수 있습니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 선택 영역 */}
            <Card className="p-8 shadow-lg border-2 border-gray-200">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-700">
                      추천 키워드에서 선택
                    </label>
                    <span className="text-sm text-gray-500">
                      <span className={`font-bold ${customKeywords.length >= 4 ? 'text-purple-600' : 'text-gray-700'}`}>
                        {customKeywords.length}
                      </span>
                      /4개 선택됨
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {SUGGESTED_KEYWORDS.map((keyword) => (
                      <button
                        key={keyword}
                        onClick={() => toggleKeyword(keyword)}
                        disabled={!customKeywords.includes(keyword) && customKeywords.length >= 4}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                          customKeywords.includes(keyword)
                            ? 'bg-purple-600 text-white ring-2 ring-purple-300 ring-offset-2 shadow-lg'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        } ${
                          !customKeywords.includes(keyword) && customKeywords.length >= 4
                            ? 'opacity-40 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {customKeywords.length > 0 && (
                  <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-900">선택된 키워드</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {customKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-300 rounded-full text-sm font-medium text-purple-700 shadow-sm"
                        >
                          {keyword}
                          <button
                            onClick={() => toggleKeyword(keyword)}
                            className="hover:bg-purple-100 rounded-full p-1 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {customKeywords.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">
                      👆 위의 키워드 중 최소 1개를 선택해주세요
                    </p>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setStep('generating');
                      handleGenerate();
                    }}
                    disabled={customKeywords.length === 0}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI 네이밍 생성하기
                  </Button>
                  {customKeywords.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      키워드를 선택하면 AI 네이밍 생성을 시작할 수 있습니다
                    </p>
                  ) : (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      💡 AI가 <strong className="text-purple-600">국내 도메인 등록이 가능한</strong> 네이밍 3개를 추천합니다
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* AI 생성 중 화면 */}
        {step === 'generating' && (
          <Card className="max-w-2xl mx-auto p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-6 animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">AI가 네이밍을 생성하고 있습니다...</h2>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">.com 도메인 등록 가능한 네이밍 생성 중</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">도메인 가용성 확인 중</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">상표권 중복 여부 검사 중</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 수동 입력 화면 (Step 1) */}
        {step === 'manual' && (
          <div className="max-w-4xl mx-auto">
            {/* 설명 영역 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Edit3 className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      STEP 1
                    </span>
                    <span className="text-sm text-gray-500">총 3단계 중</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    생각한 네이밍을 입력해주세요
                  </h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    이미 생각해둔 브랜드 네이밍이 있다면 입력해주세요. AI가 
                    <strong className="text-purple-600"> .com 도메인 가용성</strong>과 
                    <strong className="text-purple-600"> 상표권 중복 여부</strong>를 자동으로 체크해드립니다.
                  </p>
                  <div className="flex items-start gap-2 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">💡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900 mb-1">입력 팁</p>
                      <p className="text-sm text-purple-700">
                        최대 3개까지 입력 가능합니다. 한글, 영문 모두 가능하며 AI가 자동으로 도메인과 상표권을 체크합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 입력 영역 */}
            <Card className="p-8 shadow-lg border-2 border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    네이밍 후보를 입력하세요 (최대 3개)
                  </label>
                  
                  <div className="space-y-4">
                    {manualNames.map((name, index) => (
                      <div key={index}>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </span>
                          <Input
                            placeholder={`예: ${index === 0 ? '브랜드원' : index === 1 ? 'BrandOne' : '마이브랜드'}`}
                            value={name}
                            onChange={(e) => updateManualName(index, e.target.value)}
                            className="text-lg h-14 border-2 focus:border-purple-500"
                            autoFocus={index === 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setStep('manual-checking');
                      handleCheckManualNames();
                    }}
                    disabled={manualNames.filter(n => n.trim()).length === 0}
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    AI 분석 시작하기
                  </Button>
                  {manualNames.filter(n => n.trim()).length === 0 ? (
                    <p className="text-center text-sm text-gray-500 mt-3">
                      최소 1개 이상의 네이밍을 입력해주세요
                    </p>
                  ) : (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      💡 입력하신 <strong className="text-purple-600">{manualNames.filter(n => n.trim()).length}개</strong>의 네이밍을 분석합니다
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 수동 입력 체크 중 화면 */}
        {step === 'manual-checking' && (
          <Card className="max-w-2xl mx-auto p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 animate-pulse">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">AI가 네이밍을 분석하고 있습니다...</h2>
              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">도메인 가용성 확인 중</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">상표권 중복 여부 검사 중</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-sm text-gray-700">가용성 분석 중</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 수동 입력 결과 화면 */}
        {step === 'manual-results' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">네이밍 체크 결과</h2>
              <p className="text-sm text-gray-600">
                총 {candidates.length}개의 네이밍을 분석했습니다
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate, index) => {
                const trademarkStatus = getTrademarkStatus(candidate.trademark);
                const isRecommended = 
                  candidate.domains.com === true && 
                  candidate.trademark.exists === false;

                return (
                  <Card
                    key={index}
                    className={`p-6 ${isRecommended ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                  >
                    {isRecommended && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          등록 가능
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {candidate.koreanName ? `${candidate.name} (${candidate.koreanName})` : candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">{candidate.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyName(candidate.name)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Domain Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">도메인 가용성</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.com)}
                          <span className="text-sm font-medium">.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.cokr)}
                          <span className="text-sm">.co.kr</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.kr)}
                          <span className="text-sm">.kr</span>
                        </div>
                      </div>
                      
                      {candidate.industryDomains && candidate.industryDomains.length > 0 && (
                        <div className="border-t border-gray-200 my-2 pt-2">
                          <p className="text-xs text-gray-500 mb-2">🎯 추천 도메인</p>
                          <div className="grid grid-cols-2 gap-2">
                            {candidate.industryDomains.map((ext) => (
                              <div key={ext} className="flex items-center gap-2">
                                {getDomainStatusIcon(candidate.domains[ext])}
                                <span className="text-sm">.{ext}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trademark Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">상표권 확인</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {trademarkStatus.icon}
                        <span className={`text-sm ${trademarkStatus.color}`}>
                          {trademarkStatus.text}
                        </span>
                      </div>
                      {candidate.trademark.warning && (
                        <p className="text-xs text-orange-600 mt-2">
                          ⚠️ {candidate.trademark.warning}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const result = await saveNamingWithRetry({
                            koreanName: candidate.koreanName,
                            name: candidate.name,
                            description: candidate.description,
                            serviceCategory: selectedCategory,
                            keywords: customKeywords,
                          });
                          if (result.success) {
                            alert('✅ 저장되었습니다!');
                            onNavigate('box');
                          } else {
                            alert(`저장 실패: ${result.error}`);
                          }
                        }}
                        className="w-full h-11 font-medium border-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        마이 네이밍에 저장 후 확인
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          // 네이밍을 먼저 저장
                          const result = await saveNamingWithRetry({
                            koreanName: candidate.koreanName,
                            name: candidate.name,
                            description: candidate.description,
                            serviceCategory: selectedCategory,
                            keywords: customKeywords,
                          });
                          
                          if (result.success) {
                            // 저장 성공 후 로고 만들기로 이동
                            if (onBrandNameSelect) {
                              onBrandNameSelect(candidate.name, selectedCategory, customKeywords);
                            }
                            // state 업데이트를 위한 약간의 딜레이 후 페이지 이동
                            setTimeout(() => {
                              onNavigate('logo');
                            }, 100);
                          } else {
                            alert(`저장 실패: ${result.error}`);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 font-semibold"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        로고 만들기
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* AI 생성 결과 화면 */}
        {step === 'results' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">생성된 네이밍 후보</h2>
              <p className="text-sm text-gray-600">
                총 {candidates.length}개의 후보가 생성되었습니다
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate, index) => {
                const trademarkStatus = getTrademarkStatus(candidate.trademark);
                const isRecommended = 
                  candidate.domains.com === true && 
                  candidate.trademark.exists === false;

                return (
                  <Card
                    key={index}
                    className={`p-6 ${isRecommended ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                  >
                    {isRecommended && (
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          추천
                        </span>
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {candidate.koreanName ? `${candidate.name} (${candidate.koreanName})` : candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">{candidate.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyName(candidate.name)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Domain Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">도메인 가용성</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.com)}
                          <span className="text-sm font-medium">.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.cokr)}
                          <span className="text-sm">.co.kr</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDomainStatusIcon(candidate.domains.kr)}
                          <span className="text-sm">.kr</span>
                        </div>
                      </div>
                      
                      {candidate.industryDomains && candidate.industryDomains.length > 0 && (
                        <div className="border-t border-gray-200 my-2 pt-2">
                          <p className="text-xs text-gray-500 mb-2">🎯 추천 도메인</p>
                          <div className="grid grid-cols-2 gap-2">
                            {candidate.industryDomains.map((ext) => (
                              <div key={ext} className="flex items-center gap-2">
                                {getDomainStatusIcon(candidate.domains[ext])}
                                <span className="text-sm">.{ext}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trademark Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">상표권 확인</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {trademarkStatus.icon}
                        <span className={`text-sm ${trademarkStatus.color}`}>
                          {trademarkStatus.text}
                        </span>
                      </div>
                      {candidate.trademark.warning && (
                        <p className="text-xs text-orange-600 mt-2">
                          ⚠️ {candidate.trademark.warning}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const sessionStr = localStorage.getItem('mybrands_session');
                            if (!sessionStr) {
                              alert('로그인이 필요합니다.');
                              onNavigate('login');
                              return;
                            }

                            const result = await saveNamingWithRetry({
                              koreanName: candidate.koreanName,
                              name: candidate.name,
                              description: candidate.description,
                              serviceCategory: selectedCategory,
                              keywords: customKeywords,
                            });
                            if (result.success) {
                              alert('✅ 저장되었습니다!');
                              onNavigate('box');
                            } else {
                              alert(`저장 실패: ${result.error}`);
                            }
                          } catch (error) {
                            console.error('Error saving naming:', error);
                            alert('네이밍 저장 중 오류가 발생했습니다.');
                          }
                        }}
                        className="w-full h-11 font-medium border-2"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        마이 네이밍에 저장 후 확인
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          // 네이밍을 먼저 저장
                          const result = await saveNamingWithRetry({
                            koreanName: candidate.koreanName,
                            name: candidate.name,
                            description: candidate.description,
                            serviceCategory: selectedCategory,
                            keywords: customKeywords,
                          });
                          
                          if (result.success) {
                            // 저장 성공 후 로고 만들기로 이동
                            if (onBrandNameSelect) {
                              onBrandNameSelect(candidate.name, selectedCategory, customKeywords);
                            }
                            // state 업데이트를 위한 약간의 딜레이 후 페이지 이동
                            setTimeout(() => {
                              onNavigate('logo');
                            }, 100);
                          } else {
                            alert(`저장 실패: ${result.error}`);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 font-semibold"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        로고 만들기
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}