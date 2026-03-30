import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../app/components/ui/button';
import { cardWalletService, WalletContact } from '../../../app/services/cardWalletService';
import { Calendar, ChevronRight, Share2, MoreHorizontal, Layout, User, Building2, Smartphone, ArrowRight } from 'lucide-react';
import { cn } from '../../../app/components/ui/utils';

interface RecentCardsProps {
  onNavigate: (page: string, params?: any) => void;
}

export function RecentCards({ onNavigate }: RecentCardsProps) {
  const [recentCards, setRecentCards] = useState<WalletContact[]>([]);

  useEffect(() => {
    const cards = cardWalletService.getRecentContacts(15);
    setRecentCards(cards);
  }, []);

  if (recentCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 blur-[40px] rounded-full animate-pulse" />
          <div className="w-32 h-20 bg-white rounded-[1.5rem] flex items-center justify-center transform 3.5:2 rotate-3 transition-transform hover:rotate-0 duration-700 shadow-2xl shadow-slate-200 relative z-10 border border-slate-50">
            <Layout className="w-10 h-10 text-slate-200 stroke-[1.5px]" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-3xl font-editorial font-black text-slate-900 tracking-tighter italic uppercase leading-none px-4">IDENTITY ARCHIVE</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[220px] mx-auto opacity-60">
            A curated portfolio of your recent professional connections.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('app-wallet')}
          className="rounded-[1.5rem] border border-slate-100 text-slate-900 font-black px-10 h-16 hover:bg-slate-50 active:scale-95 transition-all text-[10px] tracking-[0.2em] uppercase italic bg-white shadow-sm"
        >
          View Business Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-14 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      {/* Prime Portfolio Carousel */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-1">
           <div className="space-y-1">
              <h2 className="text-2xl font-editorial font-black text-slate-900 tracking-tight italic uppercase leading-none">Prime Gallery</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Prioritized Identity Hubs</p>
           </div>
           <button 
             onClick={() => onNavigate('app-wallet')}
             className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 group"
           >
             ALL CARDS
             <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
        
        <div className="flex gap-8 overflow-x-auto pb-10 -mx-8 px-8 scrollbar-hide snap-x">
          {recentCards.map((card) => (
            <div 
              key={card.id}
              onClick={() => onNavigate('qrcard-view', { profileId: card.id })}
              className="flex-shrink-0 w-[300px] aspect-[1.75/1] bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 snap-center active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between border border-slate-50"
            >
              {/* Card Aura Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/[0.03] blur-[60px] rounded-full pointer-events-none" />
              
              <div className="p-8 relative z-10 flex items-start gap-5">
                 <div className="w-16 h-16 rounded-[1.75rem] bg-secondary flex-shrink-0 overflow-hidden ring-4 ring-white shadow-inner">
                    {card.profile_image ? (
                      <img src={card.profile_image} className="w-full h-full object-cover" alt={card.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-editorial font-black text-2xl italic uppercase">{card.name.charAt(0)}</div>
                    )}
                 </div>
                 <div className="min-w-0 space-y-1 pr-6">
                    <h4 className="font-editorial font-black text-slate-900 italic uppercase leading-tight text-xl tracking-tighter truncate">{card.name}</h4>
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-80">{card.title || 'Professional'}</span>
                 </div>
              </div>

              <div className="p-8 pt-0 relative z-10 flex items-end justify-between">
                 <div className="space-y-1.5 opacity-40">
                    <p className="text-[10px] font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                       <Building2 className="w-3 h-3 stroke-[2.5px]" />
                       {card.company || 'Private Entity'}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-[1.2rem]">
                       SYNC {new Date(card.created_at || Date.now()).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                    </p>
                 </div>
                 <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white group-hover:bg-primary transition-all shadow-lg shadow-slate-200">
                    <ChevronRight className="w-6 h-6 stroke-[3px]" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grouped by Date */}
      <section className="space-y-10 pb-16">
        <div className="flex items-center gap-4">
           <div className="h-px bg-slate-100 flex-grow" />
           <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">Chronicle Library</span>
           <div className="h-px bg-slate-100 flex-grow" />
        </div>

        <div className="space-y-8">
           {/* Date Group Placeholder (Simplified for logic) */}
           <div className="space-y-4">
             <div className="flex items-center gap-3 px-1">
                <Calendar className="w-4 h-4 text-slate-300 stroke-[2px]" />
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Recent Conversions</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-5">
                {recentCards.slice(0, 10).map((card) => (
                  <div 
                    key={`list-${card.id}`}
                    onClick={() => onNavigate('qrcard-view', { profileId: card.id })}
                    className="group bg-white p-6 rounded-[2.5rem] flex items-center gap-6 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all border border-transparent hover:border-slate-50 cursor-pointer active:scale-[0.99]"
                  >
                    <div className="w-14 h-14 rounded-[1.50rem] bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden ring-4 ring-white group-hover:ring-primary/5 transition-all shadow-inner">
                       {card.profile_image ? (
                         <img src={card.profile_image} className="w-full h-full object-cover" alt={card.name} />
                       ) : (
                         <div className="text-slate-300 font-editorial font-black text-xl italic uppercase font-black">{card.name.charAt(0)}</div>
                       )}
                    </div>
                    
                    <div className="flex-grow min-w-0 space-y-1">
                       <h5 className="font-editorial font-black text-slate-900 italic uppercase tracking-tight text-base leading-none">{card.name}</h5>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate opacity-60 italic">{card.company || 'Direct Network'}</p>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="text-right hidden sm:block">
                          <p className="text-[9px] font-black text-slate-950 uppercase tracking-tighter italic">AUTHENTICATED</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">G-PLATFORM 1.3</p>
                       </div>
                       <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                          <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
                       </div>
                    </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </section>

      {/* Technical Footer Branding */}
      <footer className="text-center p-12 pt-0 space-y-4 pb-24 opacity-30 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col items-center gap-1 grayscale opacity-50">
          <p className="text-[9px] font-black text-slate-900 tracking-[0.5em] uppercase">GOQR CORE INDEX</p>
          <div className="flex items-center gap-4">
             <span className="w-1 h-1 bg-slate-300 rounded-full" />
             <p className="text-[7px] font-bold text-slate-500 tracking-[0.2em] uppercase">1.3 PROTOCOL ACTIVE</p>
             <span className="w-1 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
