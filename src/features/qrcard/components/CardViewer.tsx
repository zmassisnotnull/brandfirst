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
  ArrowRight,
  PlusCircle,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Card, CardContent } from '../../../app/components/ui/card';
import { digitalCardApi } from '../../../app/services/digitalCardApi';
import { downloadVCard } from '../../../app/utils/vcard';
import { cardWalletService } from '../../../app/services/cardWalletService';
import { usePWAInstall } from '../../../app/hooks/usePWAInstall';
import QRCode from 'qrcode';
import { cn } from '../../../app/components/ui/utils';

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
  const [showConversion, setShowConversion] = useState(false);
  const { isInstallable, install } = usePWAInstall();

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
            dark: '#0066FF',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrData);

        // 조회수 증가 API 호출
        await digitalCardApi.logView(profileId);

        // 최근 본 명함에 추가 (로컬 스토리지)
        const recentCards = JSON.parse(localStorage.getItem('recent_viewed_cards') || '[]');
        const updatedRecent = [profileId, ...recentCards.filter((id: string) => id !== profileId)].slice(0, 5);
        localStorage.setItem('recent_viewed_cards', JSON.stringify(updatedRecent));

      } catch (err: any) {
        console.error('Fetch profile error:', err);
        setError('명함을 찾을 수 없거나 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (profileId) fetchProfile();
  }, [profileId]);

  const handleActionClick = (action: () => void, type?: 'call' | 'message' | 'email') => {
    action();
    if (type && profile) {
      cardWalletService.logInteraction(profile.id, type);
    }
    // 액션 수행 후 전환 UX 노출 (약간의 지연 후)
    setTimeout(() => setShowConversion(true), 1500);
  };

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
      photo: qrCodeDataUrl || '', // QR 이미지를 주소록 사진으로 저장
      cardUrl: `${window.location.origin}/?card=${profileId}`
    });
    
    // Save to Wallet (v1.3)
    cardWalletService.saveToWallet(profile);
    
    setTimeout(() => setShowConversion(true), 2000);
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary/40" />
          </div>
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Identity...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 p-8 pt-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto transform rotate-12">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{error || '명함을 찾을 수 없습니다'}</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">잘못된 접근이거나 삭제된 명함일 수 있습니다.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('qrcard-landing')} 
          className="rounded-2xl border-slate-200 text-slate-600 font-bold px-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 홈으로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 animate-in fade-in duration-700">
      {/* Floating Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate('qrcard-landing')}
          className="w-11 h-11 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-slate-900 pointer-events-auto active:scale-90 transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
        </Button>
        <button 
          onClick={handleShare}
          className="w-11 h-11 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-slate-900 flex items-center justify-center pointer-events-auto active:scale-90 transition-all"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5 stroke-[2.5px]" />}
        </button>
      </div>

      {/* Profile Cover / Hero Section */}
      <div className={cn(
        "h-[220px] bg-gradient-to-br transition-all relative overflow-hidden",
        profile.theme_color || 'from-[#0066FF] to-[#0044BB]'
      )}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_30%,_rgba(255,255,255,1),_transparent)]" />
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>

      {/* Main Content Card Area */}
      <div className="px-6 -mt-32 space-y-8 relative z-10 w-full max-w-md mx-auto">
        {/* The Card */}
        <section className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/50 overflow-hidden">
          {/* Card Image Display */}
          {profile.profile_image ? (
            <div className="aspect-[1.6/1] w-full bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-100">
              <img 
                src={profile.profile_image} 
                alt="Business Card" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="p-8 pt-12 text-center border-b border-slate-50 bg-slate-50/30">
               <div className="w-24 h-24 mx-auto bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-4 ring-8 ring-slate-100/30">
                  <UserIcon className="w-10 h-10 text-slate-300" />
               </div>
            </div>
          )}
          
          <div className="p-8 pb-10 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{profile.name}</h1>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">{profile.title}</span>
                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-2">
                  <Building2 className="w-3.5 h-3.5" /> {profile.company || 'Private Professional'}
                </p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleActionClick(() => window.location.href = `tel:${profile.phone}`, 'call')}
                className="h-16 bg-primary hover:bg-black text-white rounded-3xl gap-3 text-lg font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                <Phone className="w-5 h-5 fill-current" /> 전화기
              </Button>
              <Button 
                onClick={() => handleActionClick(() => window.location.href = `sms:${profile.phone}`, 'message')}
                className="h-16 bg-slate-900 hover:bg-black text-white rounded-3xl gap-3 text-lg font-black shadow-xl shadow-slate-200 active:scale-95 transition-all"
              >
                <MessageSquare className="w-5 h-5 fill-current" /> 메시지
              </Button>
            </div>
          </div>
        </section>

        {/* Transition UX / Branding Hook */}
        {showConversion && (
          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-2xl text-white space-y-5 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-16 h-16 text-white transform rotate-12" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="font-black text-xl tracking-tight leading-tight">종이 명함의 한계를 넘으세요</h3>
              <p className="text-slate-400 text-xs font-bold font-medium leading-relaxed">언제든 정보를 수정하고, 상대방의 소통을 기록합니다.</p>
            </div>
            <Button 
              className="w-full bg-white text-slate-900 hover:bg-primary hover:text-white font-black h-14 rounded-2xl text-md shadow-lg transition-all group-hover:scale-[1.02]"
              onClick={() => onNavigate('qrcard-create')}
            >
              내 디지털 명함 만들기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Detailed Info Section */}
        <section className="space-y-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100/50 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</h3>
            
            <div className="grid gap-5">
              {profile.phone && (
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = `tel:${profile.phone}`}>
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Smartphone className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">Mobile</p>
                    <span className="text-slate-900 font-extrabold tracking-tight">{profile.phone}</span>
                  </div>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = `mailto:${profile.email}`}>
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Mail className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mb-0.5">Email</p>
                    <span className="text-slate-900 font-extrabold tracking-tight truncate">{profile.email}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              variant="outline"
              className="w-full h-14 border-slate-200 hover:border-primary/30 hover:bg-primary/5 text-slate-900 font-black rounded-2xl gap-3 shadow-none active:scale-95 transition-all pt-1"
              onClick={handleSaveContact}
            >
              <Download className="w-5 h-5 stroke-[2.5px]" /> 주소록에 스마트 저장
            </Button>
          </div>

          {/* QR Share Section */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100/50 flex flex-col items-center gap-8 border-dashed border-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">QR Connect</h3>
            <div className="relative group p-6 bg-white rounded-[2rem] border border-slate-100 shadow-inner">
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] scale-95 opacity-0 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-44 h-44 relative z-10 transition-transform group-hover:scale-105" />
              ) : (
                <div className="w-44 h-44 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-200" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center leading-relaxed font-bold tracking-tight px-4">
              QR 코드를 스캔하여 <br/>상대방의 명함첩에 바로 담으세요.
            </p>
          </div>
        </section>

        {/* Status / Retention Note */}
        <footer className="text-center p-8 space-y-4">
          <p className="text-[10px] text-slate-400 leading-relaxed font-bold tracking-tight opacity-50">
            © 2026 GoQRCard. All Rights Reserved. <br/>
            이 데이터는 {profile.user_id ? '안전하게 영구 보관' : '임시 보관'} 중입니다.
          </p>
          {isInstallable && (
            <Button 
              variant="ghost" 
              className="text-[11px] font-black text-primary underline underline-offset-4 decoration-2"
              onClick={install}
            >
              앱으로 간편하게 사용하기
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

