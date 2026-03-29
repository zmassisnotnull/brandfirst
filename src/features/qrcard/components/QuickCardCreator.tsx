import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Mail,
  Building2,
  QrCode,
  Image as ImageIcon,
  User as UserIcon,
  Phone,
  ArrowRight
} from 'lucide-react';
import { useIsMobile } from '@/app/components/ui/use-mobile';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { digitalCardApi } from '@/app/services/digitalCardApi';
import { getDeviceId } from '@/app/utils/deviceId';
import { getSupabaseClient } from '../../../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

interface ExtractedData {
  name: string;
  phone: string;
  email: string;
}

export function QuickCardCreator({ onNavigate }: { onNavigate: (page: string, params?: { id?: string; profileId?: string }) => void }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm'>('upload');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [uploadSide, setUploadSide] = useState<'front' | 'back' | null>(null);
  const [data, setData] = useState<ExtractedData>({
    name: '',
    phone: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 선택 핸들러
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSide) return;

    const previewUrl = URL.createObjectURL(file);
    
    if (uploadSide === 'front') {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else {
      setBackImage(file);
      setBackPreview(previewUrl);
    }

    // 앞면인 경우에만 AI 분석 실행
    if (uploadSide === 'front') {
      setStep('analyzing');
      setError(null);

      try {
        const reader = new FileReader();
        reader.onerror = () => {
          throw new Error('파일을 읽는 중 오류가 발생했습니다.');
        };
        
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/analyze-card`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'apikey': publicAnonKey,
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ 
                image: base64, 
                imageBase64: base64
              })
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || '명함 분석에 실패했습니다.');
            }

            const result = await response.json();
            const extracted = result.data || result;

            setData({
              name: extracted.name || '',
              phone: extracted.mobile || 
                     (extracted.landline?.replace(/[^\d]/g, '').startsWith('010') ? extracted.landline : '') ||
                     (extracted.phone?.replace(/[^\d]/g, '').startsWith('010') ? extracted.phone : '') ||
                     '',
              email: extracted.email || ''
            });
            setStep('confirm');
          } catch (innerErr: any) {
            console.error('Inner Analysis error:', innerErr);
            setError('AI 분석 중 오류가 발생했습니다. 직접 입력해 주세요.');
            setStep('confirm');
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error('Outer Analysis error:', err);
        setError('이미지 처리 중 오류가 발생했습니다.');
        setStep('confirm');
      }
    }
    
    setUploadSide(null); // 사용 완료 후 초기화
  };

  // 최종 저장 핸들러
  const handleSave = async () => {
    if (!frontImage) return;
    setIsSaving(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      
      // 1. 앞면 이미지 업로드
      const frontFileName = `${Date.now()}-front-${frontImage.name}`;
      const { data: frontUploadData, error: frontUploadError } = await supabase.storage
        .from('make-45024be7-assets')
        .upload(`qrcards/${frontFileName}`, frontImage);

      if (frontUploadError) {
        console.error('Front Image Upload Error:', frontUploadError);
        throw new Error(`앞면 이미지 업로드 실패: ${frontUploadError.message}`);
      }

      const { data: { publicUrl: frontUrl } } = supabase.storage
        .from('make-45024be7-assets')
        .getPublicUrl(`qrcards/${frontUploadData.path}`);

      // 2. 뒷면 이미지 업로드 (있는 경우)
      let backUrl = null;
      if (backImage) {
        const backFileName = `${Date.now()}-back-${backImage.name}`;
        const { data: backUploadData, error: backUploadError } = await supabase.storage
          .from('make-45024be7-assets')
          .upload(`qrcards/${backFileName}`, backImage);

        if (!backUploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('make-45024be7-assets')
            .getPublicUrl(`qrcards/${backUploadData.path}`);
          backUrl = publicUrl;
        }
      }

      // 3. 익명 프로필 저장 (device_id 포함)
      const deviceId = getDeviceId();
      const result = await digitalCardApi.saveAnonymousProfile({
        ...data,
        profile_image: frontUrl,
        back_image: backUrl,
        is_public: true
      }, deviceId);

      if (result.success) {
        const myCards = JSON.parse(localStorage.getItem('my_qrcards') || '[]');
        myCards.push(result.id);
        localStorage.setItem('my_qrcards', JSON.stringify(myCards));
        
        onNavigate('qrcard-view', { id: result.id });
      } else {
        throw new Error(result.message || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          10초 만에 QR 명함 만들기
        </h1>
        <p className="text-gray-500 text-sm">
          명함 사진 한 장이면 충분합니다. 회원가입도 필요 없어요!
        </p>
      </div>

      {step === 'upload' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 앞면 업로드 */}
          <Card 
            className={`border-dashed border-2 transition-colors cursor-pointer ${frontPreview ? 'border-blue-500 bg-blue-50/30' : 'bg-gray-50/50 hover:bg-gray-50'}`} 
            onClick={() => {
              setUploadSide('front');
              fileInputRef.current?.click();
            }}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
              {frontPreview ? (
                <div className="relative w-full aspect-[1.6/1] rounded-lg overflow-hidden border">
                  <img src={frontPreview} alt="Front preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
              ) : (
                <div className={`w-12 h-12 ${isMobile ? 'bg-orange-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                  {isMobile ? <Camera className="w-6 h-6 text-orange-600" /> : <Upload className="w-6 h-6 text-blue-600" />}
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-gray-700 text-sm">앞면 (필수)</p>
                <p className="text-[10px] text-gray-400 mt-1">정보가 있는 면을 찍어주세요</p>
              </div>
            </CardContent>
          </Card>

          {/* 뒷면 업로드 */}
          <Card 
            className={`border-dashed border-2 transition-colors cursor-pointer ${backPreview ? 'border-purple-500 bg-purple-50/30' : 'bg-gray-50/50 hover:bg-gray-50'}`} 
            onClick={() => {
              setUploadSide('back');
              fileInputRef.current?.click();
            }}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 space-y-3">
              {backPreview ? (
                <div className="relative w-full aspect-[1.6/1] rounded-lg overflow-hidden border">
                  <img src={backPreview} alt="Back preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-600" />
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-gray-700 text-sm">뒷면 (선택)</p>
                <p className="text-[10px] text-gray-400 mt-1">추가 정보나 로고가 있다면</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'analyzing' && (
        <Card className="py-20">
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-blue-400/20 rounded-full"></div>
              <div className="relative bg-white p-4 rounded-full shadow-lg border border-blue-100">
                <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="font-bold text-lg">AI가 정보를 읽고 있어요...</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                약 5~10초 정도 소요됩니다
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('front')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'front' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                앞면
              </button>
              <button 
                onClick={() => setActiveTab('back')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'back' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
              >
                뒷면 {!backPreview && '(없음)'}
              </button>
            </div>

            <div className={`relative aspect-[1.6/1] rounded-xl overflow-hidden border shadow-sm ${activeTab === 'front' ? 'bg-black/5' : (backPreview ? 'bg-black/5' : 'bg-gray-50')}`}>
              {activeTab === 'front' ? (
                <>
                  <img 
                    src={frontPreview || ''} 
                    alt="Front preview" 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 bg-blue-600/50">
                    <CheckCircle2 className="w-3 h-3" />
                    정보 분석용
                  </div>
                </>
              ) : (
                backPreview ? (
                  <>
                    <img 
                      src={backPreview} 
                      alt="Back preview" 
                      className="w-full h-full object-contain" 
                    />
                    <div className="absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 bg-purple-600/50">
                      <CheckCircle2 className="w-3 h-3" />
                      참고용
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-gray-100/80 transition-colors"
                    onClick={() => {
                      setUploadSide('back');
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Upload className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-600">명함 뒷면 등록하기</p>
                      <p className="text-[10px] text-gray-400">추가 정보나 로고가 있다면 올려주세요</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">정보 확인</CardTitle>
              <CardDescription>성함, 연락처, 이메일을 확인해 주세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3" /> 성함 (Name)
                  </label>
                  <Input 
                    value={data.name} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> 연락처 (Mobile)
                  </label>
                  <Input 
                    value={data.phone} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value.replace(/[^\d]/g, '');
                      let formatted = val;
                      if (val.length > 3 && val.length <= 7) {
                        formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                      } else if (val.length > 7) {
                        formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 11)}`;
                      }
                      setData({ ...data, phone: formatted });
                    }}
                    placeholder="010-1234-5678"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email (E)
                  </label>
                  <Input 
                    value={data.email} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, email: e.target.value })}
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button 
                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    디지털 명함 생성 중...
                  </>
                ) : (
                  <>
                    명함 만들기 완료
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
              
              <p className="text-[10px] text-gray-400 text-center">
                * 익명으로 생성된 명함은 90일간 보관됩니다. <br/>
                나중에 가입하시면 평생 보관 및 편집이 가능합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        capture={isMobile ? "environment" : undefined}
        onChange={handleImageChange} 
      />
    </div>
  );
}
