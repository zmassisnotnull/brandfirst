import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Calendar, CreditCard, Package, ChevronRight, Shield, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { getSupabaseClient } from '../../../utils/supabase/client';

interface AccountPageProps {
  onNavigate: (page: string) => void;
  user: any;
  userCredits: number;
}

export function AccountPage({ onNavigate, user, userCredits }: AccountPageProps) {
  const [createdAt, setCreatedAt] = useState<string>('');
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (user?.created_at) {
      const date = new Date(user.created_at);
      setCreatedAt(date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
      <div className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">홈으로</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.user_metadata?.name || '사용자'}님의 계정
              </h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 계정 정보 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">계정 정보</h2>
            <Card className="divide-y divide-gray-200">
              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">이름</div>
                    <div className="text-sm text-gray-500">{user?.user_metadata?.name || '미설정'}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">이메일</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.email_confirmed_at ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      인증됨
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                      미인증
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">가입일</div>
                    <div className="text-sm text-gray-500">{createdAt}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 크레딧 및 결제 정보 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">크레딧 및 결제</h2>
            <Card className="divide-y divide-gray-200">
              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onNavigate('pricing')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">보유 크레딧</div>
                    <div className="text-sm text-gray-500">
                      <span className="font-semibold text-amber-600 text-lg">{userCredits.toLocaleString()}</span> 크레딧
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onNavigate('pricing')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">크레딧 충전</div>
                    <div className="text-sm text-gray-500">패키지 구매하기</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">결제 내역</div>
                    <div className="text-sm text-gray-500">구매 및 사용 기록</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>

          {/* 설정 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">설정</h2>
            <Card className="divide-y divide-gray-200">
              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">보안 설정</div>
                    <div className="text-sm text-gray-500">비밀번호 변경, 2단계 인증</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">알림 설정</div>
                    <div className="text-sm text-gray-500">이메일 알림, 푸시 알림</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>

          {/* 계정 관리 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">계정 관리</h2>
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">계정 삭제</div>
                  <div className="text-sm text-gray-500 mb-4">
                    계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    잔여 크레딧은 환불되지 않습니다.
                  </div>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  >
                    계정 삭제 요청
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}