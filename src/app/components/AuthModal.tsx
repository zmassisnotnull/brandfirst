import React, { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Mail, Lock, User, X, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getSupabaseClient } from '/utils/supabase/client';

// API URL helper function
const getApiUrl = (path: string) => {
  // Figma Make deploys Edge Function as 'make-server'
  return `https://${projectId}.supabase.co/functions/v1/make-server${path}`;
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  currentPage?: string;
  defaultTab?: 'signin' | 'signup';
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, currentPage, defaultTab = 'signin' }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = getSupabaseClient();
  
  // QR Card 사이트인지 확인
  const isQRCardSite = currentPage ? ['qrcard-landing', 'qrcard-digital', 'qrcard-pricing', 'qrcard-plans', 'qrcard-credit'].includes(currentPage) : false;
  
  // 디버깅용 로그
  console.log('🔍 AuthModal - currentPage:', currentPage);
  console.log('🔍 AuthModal - isQRCardSite:', isQRCardSite);
  
  // Edge Function 테스트
  React.useEffect(() => {
    const testEdgeFunction = async () => {
      try {
        console.log('🏥 Testing Edge Function...');
        
        const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-98397747/health`;
        
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'apikey': publicAnonKey,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Edge Function is working!', data);
        } else {
          console.error('❌ Edge Function error:', response.status, await response.text());
        }
      } catch (err: any) {
        console.error('❌ Edge Function not reachable:', err);
      }
    };
    
    if (isOpen) {
      testEdgeFunction();
    }
  }, [isOpen]);
  
  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Sign In State
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 회원가입 시작:', signUpData.email);
      
      const signupUrl = `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/auth/signup`;
      
      const response = await fetch(signupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({
          email: signUpData.email,
          password: signUpData.password,
          name: signUpData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 회원가입 성공:', data);

      // Save to localStorage
      if (data.user) {
        localStorage.setItem('mybrands_user', JSON.stringify(data.user));
        if (data.session) {
          localStorage.setItem('mybrands_session', JSON.stringify(data.session));
        }
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err: any) {
      console.error('❌ 회원가입 에러:', err);
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 로그인 시작:', signInData.email);
      
      const signinUrl = `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/auth/signin`;
      
      const response = await fetch(signinUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({
          email: signInData.email,
          password: signInData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 로그인 성공:', data);

      // Save to localStorage
      if (data.user) {
        localStorage.setItem('mybrands_user', JSON.stringify(data.user));
        if (data.session) {
          localStorage.setItem('mybrands_session', JSON.stringify(data.session));
        }
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err: any) {
      console.error('❌ 로그인 에러:', err);
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            {isQRCardSite ? (
              // QR Card 사이트 (GoQRCard.com)
              <>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="hidden md:inline">
                    <span className="logo-first">Go</span>
                    <span className="logo-brand">QR</span>
                    <span className="logo-first">Card.com</span>
                  </span>
                </h2>
                <p className="text-gray-600 mt-2">나만의 QR 디지털 명함</p>
              </>
            ) : (
              // Print 사이트 (HiQRCard.com)
              <>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="hidden md:inline">
                    <span className="logo-first">Hi</span>
                    <span className="logo-brand">QR</span>
                    <span className="logo-first">Card.com</span>
                  </span>
                </h2>
                <p className="text-gray-600 mt-2">AI로 만드는 QR 프리미엄 명함</p>
              </>
            )}
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">이메일</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      className="pl-10 placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signin-password">비밀번호</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      className="pl-10 placeholder:text-gray-300 m-[0px]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 mx-[0px] mt-[18px] mb-[0px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    '로그인'
                  )}
                </Button>
              </form>
              <p className="text-xs text-gray-500 text-center m-[0px] px-[0px] pt-[20px] pb-[0px]">
                Powered by{' '}
                <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                </span>
              </p>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">이름</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="홍길동"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      className="pl-10 placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email">이메일</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      className="pl-10 placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-password">비밀번호</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      className="pl-10 placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-confirm-password">비밀번호 확인</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      className="pl-10 placeholder:text-gray-300"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 px-[16px] py-[8px] mt-[18px] mb-[0px]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      가입 중...
                    </>
                  ) : (
                    '회원가입'
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center m-[0px] px-[0px] pt-[20px] pb-[0px]">
                  Powered by{' '}
                  <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                  </span>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}