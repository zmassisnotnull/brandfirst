import { useState, useEffect, useCallback } from 'react';
import { CardMaker } from './components/CardMaker';
import LogoEditorPage from './pages/LogoEditorPage';
import CardEditorPage from './pages/CardEditorPage';
import AutoCardMakerPage from './pages/AutoCardMakerPage';
import AutoCardMakerPageV2 from './pages/AutoCardMakerPageV2';
import { Navigation } from './components/Navigation';
import { QRCardNavigation } from './components/QRCardNavigation';
import { QRCardLandingPage } from './components/QRCardLandingPage';
import { QRCardPricingPage } from './components/QRCardPricingPage';
import { QRCardCreditPage } from './components/QRCardCreditPage';
import { AuthModal } from './components/AuthModal';
import { ServiceTracker } from './components/ServiceTracker';
import { StyleShowcasePage } from './components/StyleShowcasePage';
import { HomePage } from './components/HomePage';
import { ProfileEditModal } from './components/ProfileEditModal';
import { LogoCreationPage } from './components/LogoCreationPage';
import { EditorPage } from './components/EditorPage';
import { CardCreationChoice } from './components/CardCreationChoice';
import { CardUpgrader } from './components/CardUpgrader';
import { LogoUploader } from './components/LogoUploader';
import { DigitalCard } from './components/DigitalCard';
import { PublicProfile } from './components/PublicProfile';
import { MyBrandingBox } from './components/MyBrandingBox';
import { OrderPage } from './components/OrderPage';
import { ContactBook } from './components/ContactBook';
import { BrandNamingPage } from './components/BrandNamingPage';
import { PricingPage } from './components/PricingPage';
import { AccountPage } from './components/AccountPage';
import { getSupabaseClient } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface ContactWithCompany {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  notes: string;
}

interface UsedService {
  id: string;
  category: string;
  title: string;
  credits: number;
  timestamp: number;
}

const getInitialPage = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 서브도메인별 초기 페이지 분기
    if (hostname === 'print.brandfirst.ai') return 'home'; // Print 사이트
    if (hostname === 'qrcard.brandfirst.ai') return 'qrcard-landing'; // QR Card 사이트
    if (hostname === 'ops.brandfirst.ai') return 'ops-landing'; // Ops 사이트 (추후 컴포넌트 추가 필요)
    if (hostname === 'admin.brandfirst.ai') return 'admin-landing'; // Admin 사이트 (추후 컴포넌트 추가 필요)

    // 로컬 개발 환경(localhost) 또는 루트 도메인 기본값
    return 'qrcard-landing';
  }
  return 'qrcard-landing';
};

export default function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage()); // 접속 도메인에 따라 기본 페이지 다르게 설정
  const [profileId, setProfileId] = useState<string | null>(null); // 공개 프로필 ID
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userPackage, setUserPackage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDefaultTab, setAuthModalDefaultTab] = useState<'signin' | 'signup'>('signin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoData, setLogoData] = useState<any>(null);
  const [recommendedLayouts, setRecommendedLayouts] = useState<string[]>([]);
  const [currentChoice, setCurrentChoice] = useState<'upgrader' | 'professional' | 'starter' | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactWithCompany | null>(null);
  const [contactSelectMode, setContactSelectMode] = useState(false);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [previousPage, setPreviousPage] = useState<string>('home'); // 이전 페이지 추적
  const [usedServices, setUsedServices] = useState<UsedService[]>([]); // 사용 중인 서비스 추적 (빈 배열로 시작)
  const [pendingService, setPendingService] = useState<any>(null); // 결제 대기 중인 서비스
  const [showServiceModal, setShowServiceModal] = useState(false); // 서비스 선택 모달 표시 여부

  const supabase = getSupabaseClient();

  // 보호된 페이지 목록 (이 페이지들은 반드시 로그인 필요)
  const protectedPages = ['box', 'digital', 'qrcard-digital', 'order', 'upgrader', 'professional', 'card', 'logo-starter'];

  // 사용자 크레딧 조회 함수
  const fetchUserCredits = useCallback(async (userId: string) => {
    console.log('💰 fetchUserCredits 호출 - userId:', userId);
    try {
      const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/user/credits?userId=${userId}`;
      console.log('💰 API 호출:', apiUrl);

      // ✅ Supabase Edge Function 호출 시 ANON_KEY 필요 (Edge Function 레벨 인증)
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`, // Supabase Edge Function 인증용
        },
      });

      console.log('💰 API 응답 상태:', response.status, response.ok ? 'OK' : 'ERROR');

      if (response.ok) {
        const data = await response.json();
        console.log('💰 크레딧 데이터:', data);
        console.log('✅ 크레딧 설정:', data.credits || 0);
        setUserCredits(data.credits || 0);
      } else {
        const errorText = await response.text();
        console.error('❌ 크레딧 조회 실패:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ fetchUserCredits 에러:', error);
    }
  }, []);

  // 사용자 패키지 조회 함수
  const fetchUserPackage = useCallback(async (userId: string) => {
    console.log('📦 fetchUserPackage 호출 - userId:', userId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/user/package?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`, // Supabase Edge Function 인증용
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUserPackage(data.package || null);
      }
    } catch (error) {
      console.error('Failed to fetch user package:', error);
    }
  }, []);

  useEffect(() => {
    // Check for existing session using Supabase
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setUser(session.user);
        setSession(session);
        fetchUserCredits(session.user.id);
        fetchUserPackage(session.user.id);
        console.log('✅ 세션 복원:', session.user);
        return;
      }

      const storedSession = localStorage.getItem('mybrands_session');
      const storedUser = localStorage.getItem('mybrands_user');

      if (storedSession && storedUser) {
        try {
          const parsedSession = JSON.parse(storedSession);
          const parsedUser = JSON.parse(storedUser);

          if (parsedSession?.access_token && parsedSession?.refresh_token) {
            await supabase.auth.setSession({
              access_token: parsedSession.access_token,
              refresh_token: parsedSession.refresh_token,
            });
          }

          setUser(parsedUser);
          setSession(parsedSession);
          fetchUserCredits(parsedUser.id);
          fetchUserPackage(parsedUser.id);
          console.log('✅ localStorage 세션 복원:', parsedUser);
        } catch (error) {
          console.error('❌ localStorage 세션 복원 실패:', error);
        }
      }
    };

    // ✅ URL 파라미터 확인 (공개 프로필)
    const checkUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const cardId = params.get('card');

      if (cardId) {
        console.log('🔗 공개 프로필 URL 감지:', cardId);
        setProfileId(cardId);
        setCurrentPage('public-profile');
      }
    };

    checkSession();
    checkUrlParams();

    // 세션 자동 갱신 리스너 추가
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ 토큰이 자동으 갱신되었습니다');
        // localStorage의 세션도 업데이트
        if (session) {
          localStorage.setItem('mybrands_session', JSON.stringify(session));
          setSession(session);
        }
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setSession(session);
        localStorage.setItem('mybrands_session', JSON.stringify(session));
        localStorage.setItem('mybrands_user', JSON.stringify(session.user));
        fetchUserCredits(session.user.id);
        fetchUserPackage(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        localStorage.removeItem('mybrands_session');
        localStorage.removeItem('mybrands_user');
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserCredits, fetchUserPackage, supabase]);

  const handleLogin = async (user: any) => {
    console.log('✅ 로그인 성공:', user);
    setUser(user);

    // 세션 다시 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 로그인 후 세션 확인:', session);

    if (session) {
      setSession(session);
    }

    fetchUserCredits(user.id);
    fetchUserPackage(user.id);

    // QR Card 랜딩 페이지에서 로그인한 경우 디지털 명함으로 자동 이동
    if (currentPage === 'qrcard-landing') {
      setCurrentPage('qrcard-digital');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserCredits(0);
    setUserPackage(null);
    setCurrentPage('home');
    console.log('✅ 로그아웃 완료');
  };

  // 페이지 이동 시 인증 체크
  const handleNavigate = (page: string) => {
    // 보호된 페이지인지 확인
    if (protectedPages.includes(page) && !user) {
      console.log('⚠️ 로그인 필요:', page);
      setIsAuthModalOpen(true);
      return;
    }

    // 로고 페이지로 직접 이동하는 경우에만 브랜드명 초기화
    // (네비게이션 바에서 직접 클릭하는 경우)
    // 브랜드명이 설정되어 있는 상태에서는 초기화하지 않음
    if (page === 'logo' && currentPage !== 'naming' && currentPage !== 'box') {
      setSelectedBrandName(null);
      setLogoData(null);
    }

    setPreviousPage(currentPage); // 이전 페이지 저장
    setCurrentPage(page);

    // 페이지 전환 시 스크롤을 최상단으로 이동
    window.scrollTo(0, 0);
  };

  const handleLogoCreated = (logoUrl: string, data: any) => {
    console.log('Logo created:', logoUrl, data);
    setCurrentLogo(logoUrl);
    setLogoData(data);
  };

  const handleChoiceSelect = (choice: 'upgrader' | 'professional' | 'starter') => {
    setCurrentChoice(choice);
    console.log('Selected choice:', choice);
  };

  const handleDataExtracted = (logoUrl: string | null, data: any) => {
    console.log('Data extracted from card scan:', logoUrl, data);
    setCurrentLogo(logoUrl);
    setLogoData(data);
  };

  const handleLogoAnalyzed = (logoUrl: string, data: any, layouts: string[]) => {
    console.log('Logo analyzed:', logoUrl, data, layouts);
    setCurrentLogo(logoUrl);
    setLogoData(data);
    setRecommendedLayouts(layouts);
  };

  const handleContactSelect = (contact: ContactWithCompany) => {
    console.log('Contact selected:', contact);
    setSelectedContact(contact);
    // ContactBook will navigate to card-maker
  };

  const handleEditProfile = (profileId: number) => {
    console.log('Editing profile:', profileId);
    setEditingProfileId(profileId);
    setCurrentPage('card');
    setIsProfileModalOpen(true);
  };

  const handleBrandNameSelect = (brandName: string, serviceType: string, keywords?: string[]) => {
    console.log('🔍 handleBrandNameSelect 호출:', { brandName, serviceType, keywords });
    setSelectedBrandName(brandName);
    // serviceType과 keywords를 logoData에 저장하여 나중에 활용
    setLogoData({ serviceCategory: serviceType, brandName, keywords });
    console.log('✅ State 업데이트 완료:', { brandName, serviceType, keywords });
  };

  const handleLogoSelect = (logoUrl: string, data: any) => {
    console.log('Logo selected:', logoUrl, data);
    setCurrentLogo(logoUrl);
    const normalizedKeywords = Array.isArray(data?.keywords)
      ? data.keywords
      : typeof data?.keywords === 'string'
      ? data.keywords
          .split(',')
          .map((keyword: string) => keyword.trim())
          .filter(Boolean)
      : [];

    const normalizedServiceCategory = data?.serviceCategory || data?.business || 'other';

    setLogoData({
      ...data,
      serviceCategory: normalizedServiceCategory,
      keywords: normalizedKeywords,
    });

    if (data?.brandName) {
      setSelectedBrandName(data.brandName);
    }
  };

  const handleServiceConfirm = (service: any) => {
    console.log('Service confirmed:', service);
    // 사용 서비스에 추가
    const newService: UsedService = {
      id: `service-${Date.now()}`,
      category: service.category,
      title: service.title,
      credits: service.credits,
      timestamp: Date.now(),
    };
    setUsedServices([...usedServices, newService]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'qrcard-landing':
        return <QRCardLandingPage
          onNavigate={handleNavigate}
          user={user}
          onOpenAuthModal={() => {
            setAuthModalDefaultTab('signup');
            setIsAuthModalOpen(true);
          }}
        />;
      case 'qrcard-plans':
        return <QRCardPricingPage
          onNavigate={handleNavigate}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onCreditsUpdate={async (newCredits: number, newPlan: string) => {
            setUserCredits(newCredits);
            setUserPackage(newPlan);
          }}
          getAccessToken={async () => {
            console.log('🔐 QRCard Plans에서 토큰 가져오기 시작...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔐 QRCard Plans 세션:', session ? '세션 있음' : '세션 없음');
            if (session) {
              console.log('🔐 토큰:', session.access_token?.substring(0, 20) + '...');
            }
            return session?.access_token || null;
          }}
        />;
      case 'qrcard-pricing':
        return <QRCardPricingPage
          onNavigate={handleNavigate}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onCreditsUpdate={async (newCredits: number, newPlan: string) => {
            setUserCredits(newCredits);
            setUserPackage(newPlan);
          }}
          getAccessToken={async () => {
            console.log('🔐 QRCard Pricing에서 토큰 가져오기 시작...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔐 QRCard Pricing 세션:', session ? '세션 있음' : '세션 없음');
            if (session) {
              console.log('🔐 토큰:', session.access_token?.substring(0, 20) + '...');
            }
            return session?.access_token || null;
          }}
        />;
      case 'qrcard-credit':
        return <QRCardCreditPage
          onNavigate={handleNavigate}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onCreditsUpdate={async (newCredits: number, newPackage: string) => {
            setUserCredits(newCredits);
            setUserPackage(newPackage);
          }}
          getAccessToken={async () => {
            console.log('🔐 QRCard Credit에서 토큰 가져오기 시작...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔐 QRCard Credit 세션:', session ? '세션 있음' : '세션 없음');
            if (session) {
              console.log('🔐 토큰:', session.access_token?.substring(0, 20) + '...');
            }
            return session?.access_token || null;
          }}
        />;
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'logo-editor':
        return <LogoEditorPage />;
      case 'card-editor':
        return <CardEditorPage />;
      case 'auto-card':
        return <AutoCardMakerPage onNavigate={handleNavigate} />;
      case 'auto-card-v2':
        return <AutoCardMakerPageV2 onNavigate={handleNavigate} />;
      case 'logo':
        return (
          <>
            <LogoCreationPage
              onNavigate={handleNavigate}
              user={user}
              userCredits={userCredits}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogoCreated={handleLogoCreated}
              selectedBrandName={selectedBrandName}
              serviceCategory={logoData?.serviceCategory}
              selectedKeywords={logoData?.keywords}
              onCreditsUpdate={() => user && fetchUserCredits(user.id)}
            />
            <ServiceTracker services={usedServices} />
          </>
        );
      case 'logo-starter':
        return (
          <>
            <LogoCreationPage
              onNavigate={handleNavigate}
              user={user}
              userCredits={userCredits}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogoCreated={handleLogoCreated}
              selectedBrandName={selectedBrandName}
              serviceCategory={logoData?.serviceCategory}
              selectedKeywords={logoData?.keywords}
              startDirectly={true}
              onCreditsUpdate={() => user && fetchUserCredits(user.id)}
            />
            <ServiceTracker services={usedServices} />
          </>
        );
      case 'editor':
        return <EditorPage onNavigate={handleNavigate} />;
      case 'card-choice':
        return <CardCreationChoice onNavigate={(page) => {
          if (page === 'contact') {
            setContactSelectMode(true);
          }
          if (page === 'professional') {
            // Reset selectedContact when starting professional flow
            setSelectedContact(null);
          }
          handleNavigate(page);
        }} onChoiceSelect={handleChoiceSelect} user={user} userCredits={userCredits} onOpenAuthModal={() => setIsAuthModalOpen(true)} onCreditsUpdate={() => user && fetchUserCredits(user.id)} selectedLogoUrl={currentLogo} selectedLogoData={logoData} />;
      case 'upgrader':
        return <CardUpgrader onNavigate={handleNavigate} user={user} onOpenAuthModal={() => setIsAuthModalOpen(true)} onDataExtracted={handleDataExtracted} />;
      case 'professional':
        return <LogoUploader
          onNavigate={handleNavigate}
          onLogoAnalyzed={handleLogoAnalyzed}
          initialLogoUrl={currentLogo}
          initialLogoData={logoData}
          selectedContact={selectedContact}
          onContactBookOpen={() => {
            setContactSelectMode(true);
            handleNavigate('contact');
          }}
        />;
      case 'card':
        return <CardMaker onNavigate={handleNavigate} user={user} onOpenAuthModal={() => setIsAuthModalOpen(true)} logoUrl={currentLogo} logoData={logoData} recommendedLayouts={recommendedLayouts} editingProfileId={editingProfileId} />;
      case 'digital':
        return <DigitalCard onNavigate={handleNavigate} />;
      case 'qrcard-digital':
        return <DigitalCard onNavigate={handleNavigate} />;
      case 'box':
        return <MyBrandingBox onNavigate={handleNavigate} onEditProfile={handleEditProfile} onBrandNameSelect={handleBrandNameSelect} onLogoSelect={handleLogoSelect} />;
      case 'order':
        return <OrderPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactBook
          onNavigate={(page) => {
            setContactSelectMode(false);
            handleNavigate(page);
          }}
          onContactSelect={(contact) => {
            handleContactSelect(contact);
            setContactSelectMode(false);
            // If in select mode, navigate back to the page that opened the contact book
            if (contactSelectMode) {
              // currentChoice에 따라 적절한 페이지로 돌아가기
              if (currentChoice === 'professional') {
                handleNavigate('professional');
              } else {
                handleNavigate('card');
              }
            }
          }}
          selectMode={contactSelectMode}
          previousPage={previousPage}
        />;
      case 'naming':
        return (
          <>
            <BrandNamingPage
              onNavigate={handleNavigate}
              user={user}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onBrandNameSelect={handleBrandNameSelect}
              userCredits={userCredits}
              userPackage={userPackage}
              onServiceConfirm={handleServiceConfirm}
              onCreditsUpdate={(newCredits: number) => {
                setUserCredits(newCredits);
              }}
            />
            <ServiceTracker services={usedServices} />
          </>
        );
      case 'pricing':
        return <PricingPage
          onNavigate={handleNavigate}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onCreditsUpdate={async (newCredits: number, newPackage: string) => {
            setUserCredits(newCredits);
            setUserPackage(newPackage);
          }}
          getAccessToken={async () => {
            console.log('🔐 App.tsx에서 토큰 가져오기 시작...');
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔐 App.tsx 세션:', session ? '세션 있음' : '세션 없음');
            if (session) {
              console.log('🔐 토큰:', session.access_token?.substring(0, 20) + '...');
            }
            return session?.access_token || null;
          }}
        />;
      case 'account':
        return <AccountPage
          onNavigate={handleNavigate}
          user={user}
          userCredits={userCredits}
        />;
      case 'style-showcase':
        return <StyleShowcasePage onNavigate={handleNavigate} />;
      case 'public-profile':
        return profileId ? <PublicProfile profileId={profileId} /> : <HomePage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  // QR Card 사이트 페이지인지 확인 (QR Card 전용 Navigation 사용)
  const isQRCardSite = ['qrcard-landing', 'qrcard-digital', 'qrcard-pricing', 'qrcard-plans', 'qrcard-credit'].includes(currentPage);

  // 디버깅용 로그
  console.log('🔍 App.tsx - currentPage:', currentPage);
  console.log('🔍 App.tsx - isQRCardSite:', isQRCardSite);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - QR Card 사이트와 Print 사이트 구분 */}
      {currentPage !== 'public-profile' && (
        isQRCardSite ? (
          <QRCardNavigation
            currentPage={currentPage}
            onNavigate={handleNavigate}
            user={user}
            userCredits={userCredits}
            onAuthClick={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        ) : (
          <Navigation
            currentPage={currentPage}
            onNavigate={handleNavigate}
            user={user}
            userCredits={userCredits}
            onAuthClick={() => setIsAuthModalOpen(true)}
            onSignOut={handleSignOut}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        )
      )}
      {currentPage !== 'public-profile' && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleLogin}
          currentPage={currentPage}
          defaultTab={authModalDefaultTab}
        />
      )}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onProfileUpdate={(updatedUser) => {
          setUser(updatedUser);
          console.log('✅ 프로필 업데이트 완료:', updatedUser);
        }}
      />
      {renderPage()}
    </div>
  );
}
