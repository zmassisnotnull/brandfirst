import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Mail, User as UserIcon, Clock, ChevronRight, ArrowUpRight } from 'lucide-react';
import { cardWalletService, WalletContact } from '../../../app/services/cardWalletService';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';

interface RecentContactsProps {
  onNavigate: (page: string, params?: any) => void;
}

export function RecentContacts({ onNavigate }: RecentContactsProps) {
  const [contacts, setContacts] = useState<WalletContact[]>([]);

  useEffect(() => {
    const recent = cardWalletService.getRecentContacts(20);
    setContacts(recent);
  }, []);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysContacts = contacts.filter(c => new Date(c.last_contact_at || 0).getTime() >= today);
  const olderContacts = contacts.filter(c => new Date(c.last_contact_at || 0).getTime() < today);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 blur-[40px] rounded-full animate-pulse" />
          <div className="w-28 h-28 bg-white rounded-[3rem] flex items-center justify-center transform -rotate-3 transition-transform hover:rotate-0 duration-700 shadow-2xl shadow-slate-200 relative z-10 border border-slate-50">
            <Clock className="w-12 h-12 text-slate-200 stroke-[1.5px]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-editorial font-black text-slate-900 tracking-tighter italic uppercase leading-none px-4">최근 연락</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[220px] mx-auto opacity-60">
            최근 활동 내역이 여기에 실시간으로 표시됩니다.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('app-wallet')}
          className="mt-4 rounded-[1.5rem] border-slate-200 text-slate-900 font-black px-10 h-16 hover:bg-slate-50 active:scale-95 transition-all text-[10px] tracking-[0.2em] uppercase italic"
        >
          명함첩으로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      {/* Today's High-Priority Interactions */}
      {todaysContacts.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between px-1">
             <div className="space-y-1">
                <h2 className="text-2xl font-editorial font-black text-slate-900 tracking-tight italic uppercase">최근 활동</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">오늘의 주요 연락</p>
             </div>
             <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                <span className="text-[10px] font-black text-primary tracking-widest uppercase">실시간</span>
             </div>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-8 -mx-8 px-8 scrollbar-hide snap-x">
            {todaysContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
                className="flex-shrink-0 w-44 bg-white p-6 rounded-[3rem] shadow-2xl shadow-slate-200/50 snap-start active:scale-[0.97] transition-all cursor-pointer group relative overflow-hidden text-center border border-slate-50"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-[2rem] bg-secondary overflow-hidden ring-4 ring-white group-hover:ring-primary/5 transition-all shadow-inner relative z-10">
                    {contact.profile_image ? (
                      <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    ) : (
                      <div className="bg-gradient-to-br from-slate-100 to-slate-50 w-full h-full flex items-center justify-center text-slate-300 font-black text-3xl font-editorial italic uppercase">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-1 w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl z-20 group-hover:bg-primary transition-colors">
                    <Phone className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-editorial font-black text-slate-900 italic uppercase tracking-tight text-base truncate px-1">{contact.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
                    {new Date(contact.last_contact_at || 0).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Connection History List */}
      <section className="space-y-10 pb-16">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
             <h2 className="text-xl font-editorial font-black text-slate-900 tracking-tight italic uppercase">연락 기록</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">인증된 모든 연락 내역</p>
          </div>
          <span className="text-[10px] font-black text-slate-900 tracking-[0.25em] uppercase py-2 px-5 bg-secondary rounded-full border border-slate-100 shadow-sm">
            IDX {contacts.length}
          </span>
        </div>

        <div className="space-y-5">
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className="group flex items-center gap-6 bg-white hover:bg-slate-50 p-6 rounded-[3rem] active:scale-[0.99] transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 border border-transparent hover:border-slate-50"
              onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
            >
              <div className="w-18 h-18 rounded-[2rem] bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden ring-4 ring-white group-hover:ring-primary/5 transition-all shadow-inner relative">
                {contact.profile_image ? (
                  <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 font-editorial font-black text-2xl italic uppercase">{contact.name.charAt(0)}</div>
                )}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-editorial font-black text-slate-900 truncate text-lg italic uppercase tracking-tight">{contact.name}</h4>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-50 px-3 py-1 bg-secondary rounded-full">
                    {new Date(contact.last_contact_at || 0).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-primary font-black uppercase tracking-widest">{contact.title || '전문가'}</p>
                  {contact.company && (
                    <>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest truncate">{contact.company}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                <button 
                  className="w-14 h-14 rounded-[1.75rem] bg-secondary text-slate-400 hover:bg-slate-900 hover:text-white transition-all active:scale-90 shadow-sm flex items-center justify-center group-hover:shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contact.phone) window.location.href = `tel:${contact.phone}`;
                  }}
                >
                  <ArrowUpRight className="w-6 h-6 stroke-[2.5px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
