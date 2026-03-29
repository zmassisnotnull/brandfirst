import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  Download, 
  Share2, 
  ExternalLink, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  User as UserIcon,
  QrCode,
  Check,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { digitalCardApi } from '@/app/services/digitalCardApi';
import { downloadVCard } from '@/app/utils/vcard';
import QRCode from 'qrcode';

interface CardViewerProps {
  profileId: string;
  onNavigate: (page: string) => void;
}

export function CardViewer({ profileId, onNavigate }: CardViewerProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: profileData, error } = await digitalCardApi.getProfile(profileId);
        if (error) throw new Error(error);
        
        setProfile(profileData);
        
        // QR 코드 생성 (디지털 명함 URL 기반)
        const cardUrl = `${window.location.origin}/?card=${profileId}`;
        const qrData = await QRCode.toDataURL(cardUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrData);

        // 조회수 증가 API 호출
        await digitalCardApi.logView(profileId);

      } catch (err: any) {
        console.error('Fetch profile error:', err);
        setError('명함을 찾을 수 없거나 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (profileId) fetchProfile();
  }, [profileId]);

  const handleSaveContact = () => {
    if (!profile) return;
    
    downloadVCard({
      name: profile.name,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      email: profile.email,
      website: profile.website || '',
      address: profile.location || '',
      photo: qrCodeDataUrl || '', // QR 이미지를 주소록 사진으로 저장 (나중에 재접속 용이)
      cardUrl: `${window.location.origin}/?card=${profileId}`
    });
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/?card=${profileId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}의 디지털 명함`,
          text: `${profile.company} ${profile.name}`,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-500 animate-pulse">명함을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('qrcard-digital')} className="text-gray-600">
            <ArrowLeft className="w-5 h-5 mr-1" /> 목록
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center flex-grow p-8 space-y-6 text-center">
          <div className="bg-red-50 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">{error || '알 수 없는 오류'}</h2>
            <p className="text-gray-500">ID: {profileId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Dynamic Header/Cover */}
      <div className={`h-40 bg-gradient-to-br ${profile.theme_color || 'from-blue-600 to-indigo-700'} relative`}>
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 -mt-12 space-y-6 relative z-10 w-full max-w-md mx-auto">
        {/* Profile Card */}
        <Card className="shadow-xl border-none overflow-hidden">
          <CardContent className="p-0">
            {/* Business Card Image Row */}
            {profile.profile_image && (
              <div className="aspect-[1.6/1] w-full bg-black flex items-center justify-center overflow-hidden">
                <img 
                  src={profile.profile_image} 
                  alt="Original Card" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            
            <div className="p-6 space-y-6 text-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                <p className="text-blue-600 font-medium">{profile.title}</p>
                <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1.5 font-light">
                  <Building2 className="w-3 h-3" /> {profile.company}
                </p>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold"
                  onClick={handleSaveContact}
                >
                  <Download className="w-4 h-4" /> 연락처 저장
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl gap-2 font-bold"
                  asChild
                >
                  <a href={`tel:${profile.phone}`}>
                    <Phone className="w-4 h-4" /> 전화하기
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl gap-2 font-bold"
                  asChild
                >
                  <a href={`sms:${profile.phone}`}>
                    <MessageSquare className="w-4 h-4" /> 문자하기
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  className="h-12 border-2 border-gray-200 hover:bg-gray-50 rounded-xl gap-2 font-bold"
                  asChild
                >
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="w-4 h-4" /> 이메일
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">연락처 정보</h3>
            {profile.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-700">{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-700 font-medium">{profile.email}</span>
              </div>
            )}
          </div>

          {/* QR Scan Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col items-center gap-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">QR 코드로 공유</h3>
            {qrCodeDataUrl ? (
              <div className="p-3 bg-white border-4 border-gray-50 rounded-2xl shadow-inner">
                <img src={qrCodeDataUrl} alt="QR Code" className="w-40 h-40" />
              </div>
            ) : (
              <div className="w-40 h-40 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-300" />
              </div>
            )}
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              상대방이 이 화면의 QR 코드를 스캔하면 <br/>
              나의 디지털 명함으로 즉시 연결됩니다.
            </p>
          </div>
        </div>

        {/* Expiry / CTA Note */}
        <div className="text-center p-8 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            * 이 명함은 {profile.user_id ? '평생 보관' : '90일간 보관'}됩니다. <br/>
            {!profile.user_id && '지금 가입하시면 영구 보관이 가능합니다!'}
          </p>
          {!profile.user_id && (
            <Button variant="ghost" className="text-blue-600 font-bold gap-2">
              회원가입하고 내 명함 저장하기 <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Fixed bottom footer (optionally) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t p-3 flex justify-center text-[10px] text-gray-400 z-50">
        © GoQRCard.com - Connect Smarter.
      </div>
    </div>
  );
}
