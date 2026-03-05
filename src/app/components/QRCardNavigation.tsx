import { Smartphone, LogIn, LogOut, User, Coins, ChevronDown, QrCode, Share2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface QRCardNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: any;
  onAuthClick: () => void;
  onSignOut: () => void;
  userCredits?: number;
  onOpenProfileModal?: () => void;
}

export function QRCardNavigation({ 
  currentPage, 
  onNavigate, 
  user, 
  onAuthClick, 
  onSignOut, 
  userCredits, 
  onOpenProfileModal 
}: QRCardNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const menuItems = [
    { id: 'qrcard-landing', label: '디지털 명함 소개', icon: QrCode },
    { id: 'qrcard-plans', label: '디지털 명함 플랜', icon: Share2 },
    { id: 'qrcard-digital', label: '내 디지털 명함', icon: Smartphone },
  ];

  // 사이트 채널 목록
  const siteChannels = [
    { 
      id: 'print', 
      label: 'Print', 
      url: 'print.brandfirst.ai',
      description: '명함 제작',
      active: false,
      internalPage: 'home', // 내부 페이지로 이동
    },
    { 
      id: 'qrcard', 
      label: 'QR Card', 
      url: 'qrcard.brandfirst.ai',
      description: 'QR 디지털 명함',
      active: true, // 현재 사이트
      internalPage: 'qrcard-landing',
    },
    { 
      id: 'ops', 
      label: 'Ops', 
      url: 'ops.brandfirst.ai',
      description: '브랜드 운영',
      active: false,
      internalPage: 'home', // 임시로 home으로
    },
    { 
      id: 'admin', 
      label: 'Admin', 
      url: 'admin.brandfirst.ai',
      description: '관리자',
      active: false,
      internalPage: 'home', // 임시로 home으로
    },
  ];

  return (
    <>
      {/* 🔝 상단 채널 헤더 */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-700">
        <div className="container mx-auto px-6 h-10 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            {siteChannels.map((channel, index) => (
              <div key={channel.id} className="flex items-center">
                {index > 0 && <span className="text-gray-600 mx-2">|</span>}
                <a
                  href={channel.active ? '#' : `https://${channel.url}`}
                  className={`px-3 py-1 rounded transition-colors ${
                    channel.active
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!channel.active) {
                      onNavigate(channel.internalPage);
                    }
                  }}
                  title={channel.description}
                >
                  {channel.label}
                  {channel.active && (
                    <span className="ml-1 text-[10px] opacity-75">●</span>
                  )}
                </a>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-400">
            <span className="hidden md:inline">통합 브랜딩 플랫폼</span>
          </div>
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <nav className={`bg-white sticky top-0 z-50 ${currentPage !== 'qrcard-landing' ? 'border-b shadow-sm' : ''}`}>
        <div className="container mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span
              onClick={() => onNavigate('qrcard-landing')}
              className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text cursor-pointer select-none"
              style={{ 
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
              }}
            >
              {/* 모바일: HQRC, 데스크톱: HiQRCard.com */}
              <span className="hidden md:inline">
                <span className="logo-first">Go</span>
                <span className="logo-brand">QR</span>
                <span className="logo-first">Card.com</span>
              </span>
              <span className="md:hidden logo-first">G</span>
              <span className="md:hidden logo-brand">QR</span>
              <span className="md:hidden logo-first">C</span>
            </span>
            
            <div className="hidden md:flex items-center gap-6">
              {user && menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      currentPage === item.id 
                        ? 'text-purple-600 font-bold' 
                        : 'text-gray-600 hover:text-blue-600'
                    } mx-[0px] mt-[5px] mb-[0px]`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {user ? (
            <div className="flex items-center gap-3">
              {/* 보유 크레딧 표시 - 모바일: 아이콘+숫자만, 데스크톱: 아이콘+숫자+텍스트 */}
              <Button 
                variant="outline" 
                className="gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
                onClick={() => onNavigate('qrcard-credit')}
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-700">{(userCredits || 0).toLocaleString()}</span>
                <span className="hidden md:inline font-semibold text-amber-700">크레딧</span>
              </Button>
              
              {/* 사용자 메뉴 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="hidden md:inline text-sm text-gray-700">{user.user_metadata?.name || user.email}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* 드롭다운 메뉴 */}
                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    {/* 사용자 정보 헤더 */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {user.user_metadata?.name || '사용자'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* 메뉴 아이템 */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigate('qrcard-digital');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">내 디지털 명함</div>
                        <div className="text-xs text-gray-500">명함 관리 및 편집</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenProfileModal) onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">프로필 설정</div>
                        <div className="text-xs text-gray-500">이름, 사진 등을 변경</div>
                      </div>
                    </button>

                    {/* 구분선 */}
                    <div className="my-2 border-t border-gray-200"></div>

                    {/* 로그아웃 */}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left text-red-600"
                    >
                      <LogOut className="w-5 h-5" />
                      <div className="text-sm font-medium">로그아웃</div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* 크레딧 버튼 */}
              <Button 
                variant="outline" 
                className="gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300"
                onClick={() => onNavigate('qrcard-credit')}
              >
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-amber-700">크레딧</span>
              </Button>
              
              <Button variant="outline" className="gap-2" onClick={onAuthClick}>
                <LogIn className="w-4 h-4" />
                로그인
              </Button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}