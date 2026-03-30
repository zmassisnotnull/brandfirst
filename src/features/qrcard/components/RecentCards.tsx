import React, { useEffect, useState } from 'react';
import { User as UserIcon, Clock, ArrowRight, Eye, Calendar, Building2 } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { digitalCardApi } from '../../../app/services/digitalCardApi';
import { cn } from '../../../app/components/ui/utils';

interface RecentCardsProps {
  onNavigate: (page: string, params?: any) => void;
}

export function RecentCards({ onNavigate }: RecentCardsProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentProfiles = async () => {
      try {
        setLoading(true);
        const recentIds = JSON.parse(localStorage.getItem('recent_viewed_cards') || '[]');
        if (recentIds.length === 0) {
          setProfiles([]);
          return;
        }

        const profilePromises = recentIds.map(async (id: string) => {
          const { data } = await digitalCardApi.getProfile(id);
          return data;
        });

        const results = await Promise.all(profilePromises);
        setProfiles(results.filter(p => p !== null));
      } catch (err) {
        console.error('Fetch recent profiles error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProfiles();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 animate-pulse text-sm font-medium">최근 명함 불러오는 중...</p>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8 text-blue-300" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">최근 본 명함이 없습니다</h3>
          <p className="text-sm text-slate-500">
            상대의 QR을 스캔하면<br />
            여기에 자동으로 기록되어 다시 볼 수 있습니다.
          </p>
        </div>
        <Button 
          className="mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12"
          onClick={() => onNavigate('app-plus')}
        >
          첫 명함 스캔하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="px-6 pt-4 space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">RECENT CARDS</h2>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">최근 본 명함 리스트</p>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-4 px-6 pb-8 no-scrollbar scroll-smooth snap-x">
          {profiles.map((profile) => (
            <div 
              key={profile.id} 
              className="group relative flex-shrink-0 w-72 snap-center bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-100 border border-slate-100/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer overflow-hidden"
              onClick={() => onNavigate('qrcard-view', { profileId: profile.id })}
            >
              {/* Card visual accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:scale-125 transition-transform" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                    {profile.profile_image ? (
                      <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900 leading-tight">{profile.name}</h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{profile.title}</p>
                </div>

                <div className="pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate font-medium">{profile.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>최근 확인: {new Date().toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty spacer for horizontal scroll end */}
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>

      <div className="px-6 space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">명함 활용 팁</h3>
        <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
            <ArrowRight className="w-6 h-6 text-blue-600" />
          </div>
          <div className="space-y-1">
             <p className="text-xs font-bold text-slate-900">연락처에 바로 저장</p>
             <p className="text-[10px] text-slate-500 leading-relaxed">
               명함 상세 페이지에서 '연락처 저장' 버튼을 누르면 휴대폰 연락처로 즉시 전송됩니다.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
