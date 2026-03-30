import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Share2, 
  Edit3, 
  Settings, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Users, 
  BarChart3,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';
import { digitalCardApi } from '../../../app/services/digitalCardApi';
import QRCode from 'qrcode';

interface MyCardViewProps {
  onNavigate: (page: string, params?: any) => void;
  user: any;
}

export function MyCardView({ onNavigate, user }: MyCardViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    fetchMyProfile();
  }, [user]);

  const fetchMyProfile = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const data = await digitalCardApi.getProfile(user.id);
      setProfile(data);
      
      if (data) {
        const url = `${window.location.origin}?card=${data.id}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 600,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!profile) return;
    const url = `${window.location.origin}?card=${profile.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[40px] animate-pulse" />
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">내 프로필 로드 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-10 text-center space-y-12">
        <div className="w-24 h-24 bg-secondary rounded-[3rem] flex items-center justify-center shadow-inner opacity-40">
           <Smartphone className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-editorial font-black text-slate-900 tracking-tighter italic uppercase leading-none">기능 비활성화</h2>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-[220px] mx-auto opacity-70">
             디지털 명함 정보가 아직 생성되지 않았습니다.
          </p>
        </div>
        <Button 
          onClick={() => onNavigate('qrcard-create')}
          className="rounded-[2rem] bg-primary hover:bg-slate-900 text-white font-black px-12 h-20 shadow-2xl shadow-primary/20 transition-all text-xs tracking-[0.3em] uppercase italic"
        >
          명함 만들기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-1000">
      {/* Prime Header: Profile Identity */}
      <section className="bg-white rounded-b-[4.5rem] p-10 pt-6 space-y-10 shadow-2xl shadow-slate-200 border-b border-slate-100">
        <header className="flex items-center justify-between">
           <div className="flex items-center gap-3 bg-secondary/50 px-5 py-2.5 rounded-full border border-slate-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">활성 상태</span>
           </div>
           <div className="flex gap-4">
              <button className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                 <Settings className="w-5 h-5 stroke-[2.2px]" />
              </button>
           </div>
        </header>

        <div className="flex flex-col items-center text-center space-y-8">
           <div className="relative group">
              <div className="absolute -inset-6 bg-primary/5 blur-3xl opacity-100 group-hover:scale-110 transition-all duration-1000" />
              <div className="w-36 h-36 rounded-[4rem] bg-secondary overflow-hidden ring-4 ring-white shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-105 border border-slate-50">
                {profile.profile_image ? (
                  <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 italic opacity-40 font-editorial font-black text-3xl">{profile.name.charAt(0)}</div>
                )}
              </div>
              <button 
                onClick={() => onNavigate('qrcard-create')}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl z-20 hover:bg-primary transition-all active:scale-90"
              >
                 <Edit3 className="w-5 h-5" />
              </button>
           </div>

           <div className="space-y-3">
              <h1 className="text-4xl font-editorial font-black text-slate-900 italic uppercase tracking-tighter leading-none">{profile.name}</h1>
              <div className="flex flex-col items-center gap-2">
                 <span className="text-[11px] font-black text-primary bg-primary/5 px-5 py-1.5 rounded-full uppercase tracking-[0.2em]">{profile.title || '비즈니스 전문가'}</span>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2 opacity-60 italic">
                   <Building2 className="w-3 h-3" />
                   {profile.company || '개인 포트폴리오'}
                 </p>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <button 
                onClick={handleCopyLink}
                className="h-18 bg-slate-900 hover:bg-black text-white rounded-[1.75rem] gap-4 text-xs font-black shadow-xl transition-all active:scale-95 flex items-center justify-center tracking-[0.25em] italic uppercase"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 opacity-40" />}
                {copied ? '복사됨' : '링크 복사'}
              </button>
              <button className="h-18 bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 rounded-[1.75rem] gap-4 text-xs font-black shadow-sm transition-all active:scale-95 flex items-center justify-center tracking-[0.25em] italic uppercase">
                <Share2 className="w-5 h-5 text-primary opacity-40" />
                명함 공유
              </button>
           </div>
        </div>
      </section>

      {/* Sharing Matrix Section (Dark High-Contrast) */}
      <section className="p-8 pt-12 space-y-10">
        <div className="bg-slate-950 rounded-[4.5rem] p-12 text-center space-y-12 shadow-2xl shadow-slate-400/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 blur-[100px] rounded-full group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="space-y-3 relative z-10">
            <h3 className="text-[12px] font-black text-white tracking-[0.4em] uppercase opacity-40 italic">명함 스캔</h3>
            <p className="text-2xl font-editorial font-black text-white italic uppercase tracking-tighter">내 디지털 명함 QR</p>
          </div>

          <div className="relative group mx-auto inline-block p-10 bg-white rounded-[4rem] shadow-2xl relative z-10 transition-transform duration-700 hover:scale-105 border border-white/10">
             {qrCodeDataUrl ? (
               <img src={qrCodeDataUrl} alt="Identity QR" className="w-56 h-56 filter contrast-[1.05]" />
             ) : (
               <div className="w-56 h-56 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary/20 animate-spin" />
               </div>
             )}
          </div>

          <div className="flex flex-col items-center gap-4 relative z-10">
             <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-3xl">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">보안 표준 v1.3</span>
             </div>
             <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest leading-relaxed max-w-[200px]">
               상대방이 이 QR 코드를 스캔하면 내 프로필 정보를 공유할 수 있습니다.
             </p>
          </div>
        </div>

        {/* Intelligence Statistics Hub */}
        <div className="bg-white rounded-[4rem] p-10 space-y-10 border border-slate-50 shadow-sm">
           <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] italic px-2">데이터 통계</h3>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="p-8 bg-secondary/50 rounded-[2.5rem] border border-slate-50 space-y-3 shadow-inner">
                 <Users className="w-6 h-6 text-primary opacity-30" />
                 <div className="space-y-1">
                    <p className="text-3xl font-editorial font-black text-slate-900 italic tracking-tighter leading-none">248</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">누적 공유</p>
                 </div>
              </div>
              <div className="p-8 bg-secondary/50 rounded-[2.5rem] border border-slate-50 space-y-3 shadow-inner">
                 <BarChart3 className="w-6 h-6 text-primary opacity-30" />
                 <div className="space-y-1">
                    <p className="text-3xl font-editorial font-black text-slate-900 italic tracking-tighter leading-none">+12%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">성장 지표</p>
                 </div>
              </div>
           </div>

           <Button
             variant="ghost"
             className="w-full h-18 bg-secondary hover:bg-slate-900 hover:text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 italic"
           >
             상세 분석 보기
             <ArrowUpRight className="w-4 h-4 opacity-40 shrink-0" />
           </Button>
        </div>
      </section>

      {/* Advanced Footer Context */}
      <footer className="text-center p-14 pt-0 space-y-6 pb-24 opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex flex-col items-center gap-1.5 grayscale opacity-50">
          <p className="text-[9px] font-black text-slate-900 tracking-[0.4em] uppercase">G-PLATFORM 제공</p>
          <div className="flex items-center gap-4">
             <span className="w-1 h-1 bg-slate-300 rounded-full" />
             <p className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase leading-none">인증된 서명 활성</p>
             <span className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
