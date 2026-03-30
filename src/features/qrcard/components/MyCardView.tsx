import React, { useState, useEffect } from 'react';
import { QrCode, Share2, Edit3, Settings, ExternalLink, Copy, Check, Download, Users, BarChart3 } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';
import { digitalCardApi } from '../../../app/services/digitalCardApi';

interface MyCardViewProps {
  onNavigate: (page: string, params?: any) => void;
  user: any;
}

export function MyCardView({ onNavigate, user }: MyCardViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        setLoading(true);
        // Placeholder for user's profile fetching logic
        if (user?.id) {
           // const { data } = await digitalCardApi.getMyProfile();
           // setProfile(data);
        }
      } catch (err) {
        console.error('Fetch my profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, [user]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/p/${profile?.id || 'demo'}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse font-medium">프로필 로딩 중...</p>
      </div>
    );
  }

  const displayProfile = profile || {
    name: user?.name || "홍길동",
    title: "대표이사 / CEO",
    company: "(주) 브랜드퍼스트",
    email: user?.email || "hello@brandfirst.ai",
    phone: "010-1234-5678",
    profile_image: user?.image || null
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="px-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MY CARD</h1>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">내 프로필 명함</p>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 border border-slate-100 shadow-sm" onClick={() => onNavigate('account')}>
              <Settings className="w-5 h-5 text-slate-400" />
           </Button>
           <Button variant="ghost" size="icon" className="rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
              <BarChart3 className="w-5 h-5 text-slate-400" />
           </Button>
        </div>
      </div>

      <div className="px-6 space-y-8 max-w-lg mx-auto">
        <div className="group relative">
           <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-5 rounded-full" />
           <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-100 border border-slate-100/50 overflow-hidden">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-2xl opacity-40 group-hover:scale-110 transition-transform duration-700" />
             <div className="relative z-10 space-y-8">
               <div className="flex justify-between items-start">
                 <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 overflow-hidden">
                   {displayProfile.profile_image ? (
                     <img src={displayProfile.profile_image} alt={displayProfile.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-2xl font-black tracking-tighter">BF</span>
                   )}
                 </div>
                 <div className="text-right">
                    <h2 className="text-2xl font-black text-slate-900 leading-none">{displayProfile.name}</h2>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2">{displayProfile.title}</p>
                 </div>
               </div>
               <div className="space-y-1">
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{displayProfile.company}</p>
                 <div className="flex flex-col gap-1.5 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                       {displayProfile.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                       <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                       {displayProfile.email}
                    </div>
                 </div>
               </div>
             </div>
             <div className="mt-8 flex gap-3 relative z-10">
                <Button className="flex-grow h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-100" onClick={() => onNavigate('qrcard-view', { profileId: 'demo' })}>
                   프로필 상세보기 <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                   <Edit3 className="w-5 h-5" />
                </Button>
             </div>
           </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 text-center space-y-6 shadow-2xl shadow-slate-200 border border-slate-800">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white tracking-tight">명함 공유하기</h3>
            <p className="text-xs text-slate-500 font-medium">상대방에게 이 QR 코드를 보여주세요</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] inline-block shadow-xl relative group">
             <QrCode className="w-40 h-40 text-slate-900" />
             <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                <Button size="icon" className="rounded-full bg-slate-900 text-white w-12 h-12 shadow-xl animate-bounce">
                   <Download className="w-6 h-6" />
                </Button>
             </div>
          </div>
          <div className="flex gap-3 justify-center">
             <Button 
               variant="ghost" 
               className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl px-6 h-12 transition-all border border-slate-700"
               onClick={handleCopyLink}
             >
               {copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
               {copied ? '복사됨' : '링크 복사'}
             </Button>
             <Button variant="ghost" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl px-6 h-12 transition-all border border-blue-500">
               <Share2 className="w-4 h-4 mr-2" />
               공유
             </Button>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-end">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">내 활동 통계</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">이번 달</span>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                 <div className="flex justify-between items-center text-slate-400">
                    <Users className="w-4 h-4" />
                    <span className="text-[10px] font-bold">방문자</span>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">128</span>
                    <span className="text-[10px] font-bold text-green-500">+12%</span>
                 </div>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
                 <div className="flex justify-between items-center text-slate-400">
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-bold">저장</span>
                 </div>
                 <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">45</span>
                    <span className="text-[10px] font-bold text-green-500">+5%</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
