import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Mail, User as UserIcon, Clock } from 'lucide-react';
import { cardWalletService, WalletContact } from '../../../app/services/cardWalletService';
import { Button } from '../../../app/components/ui/button';

interface RecentContactsProps {
  onNavigate: (page: string, params?: any) => void;
}

export function RecentContacts({ onNavigate }: RecentContactsProps) {
  const [contacts, setContacts] = useState<WalletContact[]>([]);

  useEffect(() => {
    // Get contacts sorted by last interaction
    const recent = cardWalletService.getRecentContacts(20);
    setContacts(recent);
  }, []);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysContacts = contacts.filter(c => new Date(c.last_contact_at || 0).getTime() >= today);
  const olderContacts = contacts.filter(c => new Date(c.last_contact_at || 0).getTime() < today);

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center transform -rotate-12">
          <Clock className="w-10 h-10 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">첫 소통을 시작해보세요</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            전화, 문자, 이메일로 인사를 건네면<br />
            이곳에 소중한 인연들이 기록됩니다.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('app-wallet')}
          className="mt-6 rounded-2xl border-primary/20 text-primary font-bold px-8 py-6 hover:bg-primary/5 active:scale-95 transition-all"
        >
          명함첩에서 찾기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Horizontal Section: Today's Interactions */}
      {todaysContacts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">오늘의 소통</h2>
            <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">TODAY</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide snap-x">
            {todaysContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
                className="flex-shrink-0 w-36 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] snap-start active:scale-95 transition-all cursor-pointer"
              >
                <div className="relative mb-3">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-50 overflow-hidden ring-4 ring-slate-50 flex items-center justify-center">
                    {contact.profile_image ? (
                      <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="bg-gradient-to-br from-primary/20 to-primary/5 w-full h-full flex items-center justify-center text-primary/40 font-black text-xl">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white">
                    <Phone className="w-3 h-3 fill-current" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">{contact.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                    {new Date(contact.last_contact_at || 0).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vertical Section: History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">최근 상호작용</h2>
          {olderContacts.length > 5 && (
            <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">View History</button>
          )}
        </div>

        <div className="space-y-3">
          {olderContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="group flex items-center gap-4 bg-white/50 p-4 rounded-[1.5rem] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
            >
              <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                {contact.profile_image ? (
                  <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-7 h-7 text-slate-300 group-hover:text-primary/40 transition-colors" />
                )}
              </div>
              
              <div className="flex-grow min-w-0 pr-2">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-black text-slate-900 truncate leading-none">{contact.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {new Date(contact.last_contact_at || 0).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate opacity-70">
                  {contact.title} {contact.company && ` • ${contact.company}`}
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contact.phone) window.location.href = `tel:${contact.phone}`;
                  }}
                >
                  <Phone className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
