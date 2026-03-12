import { Plus, Edit, Printer, Linkedin, Github, Youtube, Instagram, Package, FolderOpen, BookUser, Sparkles, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Footer } from './Footer';
import { LogoPreview } from './LogoPreview';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface SavedCard {
  id: number;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  logoUrl?: string;
  brandColor?: string;
  createdAt: string;
  updatedAt: string;
}

interface SavedNaming {
  koreanName: string;
  name: string;
  description: string;
  createdAt: string;
  serviceCategory: string;
  keywords: string[];
}

interface SavedLogo {
  logoUrl: string;
  brandName: string;
  business: string;
  mood: string;
  color: string;
  style: string;
  font?: string; // 폰트 정보 추가
  fontColor?: string; // 실제 폰트 색상 hex 값
  weight?: string;
  spacing?: string;
  transform?: string;
  isDuotone?: boolean;
  secondaryColor?: string;
  createdAt: string;
}

interface MyBrandingBoxProps {
  onNavigate: (page: string) => void;
  onEditProfile?: (profileId: number) => void;
  onBrandNameSelect?: (brandName: string, serviceType: string, keywords: string[]) => void;
  onLogoSelect?: (logoUrl: string, logoData: any) => void;
}

export function MyBrandingBox({ onNavigate, onEditProfile, onBrandNameSelect, onLogoSelect }: MyBrandingBoxProps) {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [savedNamings, setSavedNamings] = useState<SavedNaming[]>([]);
  const [savedLogos, setSavedLogos] = useState<SavedLogo[]>([]);
  const [loadingNamings, setLoadingNamings] = useState(true);
  const [loadingLogos, setLoadingLogos] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'naming' | 'logo' | 'card' | null;
    item: any;
    index: number;
  }>({
    isOpen: false,
    type: null,
    item: null,
    index: -1,
  });
  const [previewLogo, setPreviewLogo] = useState<SavedLogo | null>(null);

  // localStorage에서 저장된 명함 불러오기
  useEffect(() => {
    const loadSavedCards = () => {
      const cardsData = localStorage.getItem('savedCards');
      if (cardsData) {
        try {
          const cards = JSON.parse(cardsData);
          setSavedCards(cards);
          console.log('✅ 저장된 명함 불러오기:', cards);
        } catch (err) {
          console.error('❌ 명함 데이터 파싱 오류:', err);
          setSavedCards([]);
        }
      } else {
        setSavedCards([]);
      }
    };

    loadSavedCards();
  }, []);

  // 백엔드에서 저장된 네이밍 불러오기
  useEffect(() => {
    const loadNamings = async () => {
      try {
        setLoadingNamings(true);
        const sessionStr = localStorage.getItem('mybrands_session');
        
        if (!sessionStr) {
          console.log('No session found');
          setLoadingNamings(false);
          return;
        }

        const session = JSON.parse(sessionStr);
        const accessToken = session.access_token;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/list`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'x-access-token': accessToken,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSavedNamings(data.namings || []);
          console.log('✅ 저장된 네이밍 불러오기:', data.namings);
        } else {
          console.warn('Failed to load namings');
        }
      } catch (error) {
        console.error('Error loading namings:', error);
      } finally {
        setLoadingNamings(false);
      }
    };

    loadNamings();
  }, []);

  // 백엔드에서 저장된 로고 불러오기
  useEffect(() => {
    const loadLogos = async () => {
      try {
        setLoadingLogos(true);
        const sessionStr = localStorage.getItem('mybrands_session');
        
        if (!sessionStr) {
          console.log('No session found');
          setLoadingLogos(false);
          return;
        }

        const session = JSON.parse(sessionStr);
        const accessToken = session.access_token;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/list`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'x-access-token': accessToken,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSavedLogos(data.logos || []);
          console.log('✅ 저장된 로고 불러오기:', data.logos);
          // 각 로고의 createdAt 확인
          data.logos?.forEach((logo: any, idx: number) => {
            console.log(`로고 ${idx + 1} createdAt:`, logo.createdAt, 'brandName:', logo.brandName);
          });
        } else {
          console.warn('Failed to load logos');
        }
      } catch (error) {
        console.error('Error loading logos:', error);
      } finally {
        setLoadingLogos(false);
      }
    };

    loadLogos();
  }, []);

  const handleEditCard = (cardId: number) => {
    if (onEditProfile) {
      onEditProfile(cardId);
    }
  };

  // 삭제 확인 및 실행
  const handleDelete = async () => {
    const { type, item, index } = deleteModal;
    
    if (!type || !item) return;

    try {
      const sessionStr = localStorage.getItem('mybrands_session');
      if (!sessionStr) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      const session = JSON.parse(sessionStr);
      const accessToken = session.access_token;

      if (type === 'naming') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/naming/delete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'x-access-token': accessToken,
            },
            body: JSON.stringify({ namingId: item.name, createdAt: item.createdAt }),
          }
        );
        
        if (response.ok) {
          setSavedNamings(prev => prev.filter((_, i) => i !== index));
          console.log('✅ 네이밍 삭제 완료');
        } else {
          alert('삭제에 실패했습니다.');
        }
      } else if (type === 'logo') {
        // logoUrl이 객체일 수도 있으므로 문자열 URL만 추출
        const logoUrl = typeof item.logoUrl === 'string' ? item.logoUrl : item.logoUrl?.url || '';
        
        console.log('🗑️ 로고 삭제 요청:', { logoUrl, createdAt: item.createdAt });
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/delete`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
              'x-access-token': accessToken,
            },
            body: JSON.stringify({ logoUrl, createdAt: item.createdAt }),
          }
        );
        
        if (response.ok) {
          console.log('✅ 로고 삭제 완료');
          alert('✅ 로고가 삭제되었습니다!');
          
          // 삭제 후 로고 목록 다시 불러오기
          const listResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/list`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'x-access-token': accessToken,
              },
            }
          );
          
          if (listResponse.ok) {
            const data = await listResponse.json();
            console.log('🔄 새로고침된 로고 목록:', data.logos);
            console.log('📊 새로고침 후 로고 개수:', data.logos?.length || 0);
            setSavedLogos(data.logos || []);
            console.log(' 로고 목록 새로고침 완료');
          } else {
            console.error('❌ 로고 목록 새로고침 실패');
          }
        } else {
          const errorData = await response.json();
          console.error('❌ 삭제 실패:', errorData);
          alert(`삭제에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
        }
      }
      
      setDeleteModal({ isOpen: false, type: null, item: null, index: -1 });
    } catch (error) {
      console.error('❌ 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const orders = [
    {
      id: 1,
      date: '2025.01.10',
      type: '일반지 200매',
      status: '배송 중',
      statusColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 2,
      date: '2024.12.28',
      type: '고급지 100매',
      status: '배송 완료',
      statusColor: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">마이 브랜드 박스</h1>
            <p className="text-gray-600 mt-2">당신의 모든 브랜드를 한 곳에서 관리하세요</p>
          </div>
          <Button
            onClick={() => onNavigate('contact')}
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <BookUser className="w-5 h-5" />
            주소록
          </Button>
        </div>

        {/* My Naming Section */}
        <Card className="p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">마이 네이밍</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('naming')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              네이밍 생성하기
            </Button>
          </div>

          {loadingNamings ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">네이밍을 불러오는 중...</p>
            </div>
          ) : savedNamings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedNamings.map((naming, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow border-2 relative">
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, type: 'naming', item: naming, index })}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <h3 className="text-lg font-bold text-purple-900 mb-1">
                        {naming.koreanName ? `${naming.name} (${naming.koreanName})` : naming.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(naming.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                    {naming.description}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => {
                        // 먼저 브랜드명 설정 후 로고 페이로 이동
                        if (onBrandNameSelect) {
                          onBrandNameSelect(naming.name, naming.serviceCategory || 'general', naming.keywords);
                        }
                        // state 업데이트를 위한 약간의 딜레이 후 페이지 이동
                        setTimeout(() => {
                          onNavigate('logo');
                        }, 100);
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      로고 만들기
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                저장된 네이밍이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                AI가 생성한 브랜드 네이밍을 저장하고 관리하세요
              </p>
              <Button
                onClick={() => onNavigate('naming')}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4" />
                네이밍 생성하기
              </Button>
            </div>
          )}
        </Card>

        {/* My Logo Section */}
        <Card className="p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold">마이 로고</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('logo')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              로고 생성하기
            </Button>
          </div>

          {loadingLogos ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">로고를 불러오는 중...</p>
            </div>
          ) : savedLogos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedLogos.map((logo, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow border-2 relative">
                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, type: 'logo', item: logo, index })}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-8">
                      <h3 className="text-lg font-bold text-purple-900 mb-1">
                        {logo.brandName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(logo.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center mb-4 bg-white rounded-lg aspect-square cursor-pointer hover:bg-gray-50 transition-colors border-2 border-gray-100 hover:border-purple-300 overflow-hidden"
                    onClick={() => {
                      console.log('🔍 Logo data:', logo);
                      console.log('  logoUrl type:', typeof logo.logoUrl);
                      console.log('  logoUrl starts with SVG:', logo.logoUrl?.startsWith('data:image/svg+xml;base64,'));
                      console.log('  has font:', !!logo.font);
                      setPreviewLogo(logo);
                    }}
                  >
                    <LogoPreview
                      logo={logo}
                      className="w-full h-full flex items-center justify-center"
                      imageClassName="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => {
                        if (onLogoSelect) {
                          onLogoSelect(logo.logoUrl, logo);
                        }
                        setTimeout(() => {
                          onNavigate('card-choice');
                        }, 10);
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      명함 만들기
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                저장된 로고가 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                AI가 생성한 브랜드 로고를 저장하고 관리하세요
              </p>
              <Button
                onClick={() => onNavigate('logo')}
                className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="w-4 h-4" />
                로고 생성하기
              </Button>
            </div>
          )}
        </Card>

        {/* My Business Card Section */}
        <Card className="p-6 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">마이 명함</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => onNavigate('card-choice')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              명함 만들기
            </Button>
          </div>

          {savedCards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {savedCards.map((card) => (
                <Card key={card.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Card Header with Gradient */}
                  <div className={`h-32 bg-gradient-to-br ${card.brandColor || 'from-blue-600 to-indigo-600'} relative`}>
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute bottom-4 left-6 flex items-center gap-4">
                      <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                        {card.logoUrl ? (
                          <img src={card.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="text-4xl">💼</span>
                        )}
                      </div>
                      <div className="text-white">
                        <h3 className="text-2xl font-bold">{card.name}</h3>
                        <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">
                          {card.company}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">직함</p>
                        <p className="font-medium">{card.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">연락처</p>
                        <p className="font-medium text-xs">{card.phone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm mb-1">이메일</p>
                      <p className="text-sm font-medium text-gray-700">{card.email}</p>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => handleEditCard(card.id)}
                      >
                        <Edit className="w-4 h-4" />
                        편집하기
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => onNavigate('order')}
                      >
                        <Printer className="w-4 h-4" />
                        인쇄 주문
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                저장된 명함이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                첫 번째 명함을 만들어보세요! AI가 도와드립니다.
              </p>
              <Button
                onClick={() => onNavigate('card-choice')}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="w-4 h-4" />
                명함 만들기
              </Button>
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card className="p-6 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">최근 주문 내역</h2>
          </div>

          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Printer className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">{order.type}</p>
                    <p className="text-sm text-gray-500">{order.date}</p>
                  </div>
                </div>
                <Badge className={order.statusColor}>{order.status}</Badge>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-4">
            전체 주문 내역 보기
          </Button>
        </Card>
      </div>
      
      {/* 삭제 확인 모달 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">삭제 확인</h3>
                <p className="text-sm text-gray-500">이 작업은 취소할 수 없습니다</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                {deleteModal.type === 'naming' && deleteModal.item && (
                  <>
                    <span className="font-semibold text-purple-900">"{deleteModal.item.name}"</span> 네이밍을 삭제하시겠습니까?
                  </>
                )}
                {deleteModal.type === 'logo' && deleteModal.item && (
                  <>
                    <span className="font-semibold text-purple-900">"{deleteModal.item.brandName}"</span> 로고를 삭제하시겠습니까?
                  </>
                )}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteModal({ isOpen: false, type: null, item: null, index: -1 })}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                삭제하기
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* 로고 프리뷰 모달 */}
      {previewLogo && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewLogo(null)}
        >
          <div 
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setPreviewLogo(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <span>ESC</span>
                <span className="text-2xl">✕</span>
              </div>
            </button>

            {/* 로고 정보 */}
            <div className="bg-white rounded-t-2xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{previewLogo.brandName}</h2>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>스타일: {previewLogo.style}</span>
                <span>색상: {previewLogo.color}</span>
                <span>분야: {previewLogo.business}</span>
                {previewLogo.font && <span>폰트: {previewLogo.font}</span>}
              </div>
            </div>

            {/* 로고 이미지 */}
            <div className="bg-white rounded-b-2xl p-12">
              <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-xl">
                <LogoPreview
                  logo={previewLogo}
                  className="w-full h-full flex items-center justify-center"
                  imageClassName="max-w-full max-h-full object-contain p-8"
                  fallbackClassName="text-gray-400"
                />
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 bg-white"
                onClick={() => setPreviewLogo(null)}
              >
                닫기
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => {
                  if (onLogoSelect) {
                    onLogoSelect(previewLogo.logoUrl, previewLogo);
                  }
                  setPreviewLogo(null);
                  setTimeout(() => {
                    onNavigate('card-choice');
                  }, 10);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                명함 만들기
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
