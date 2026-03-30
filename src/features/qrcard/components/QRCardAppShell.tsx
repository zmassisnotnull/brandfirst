import React, { useState } from 'react';
import { 
  Users, 
  History, 
  PlusCircle, 
  Wallet, 
  User,
  Search,
  Bell
} from 'lucide-react';
import { cn } from '../../../app/components/ui/utils';

export type QRCardTab = 'recent_contacts' | 'recent_cards' | 'plus' | 'wallet' | 'my_card';

interface QRCardAppShellProps {
  children: React.ReactNode;
  activeTab: QRCardTab;
  onTabChange: (tab: QRCardTab) => void;
  isLoggedIn?: boolean;
}

export const QRCardAppShell: React.FC<QRCardAppShellProps> = ({
  children,
  activeTab,
  onTabChange,
  isLoggedIn = false
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground pb-24 selection:bg-primary/10">
      {/* Top Header - Editorial Style */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl px-6 h-18 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onTabChange('recent_cards')}>
          <div className="w-11 h-11 bg-primary rounded-[1rem] flex items-center justify-center shadow-lg shadow-primary/20 transition-all group-hover:rotate-6 group-active:scale-90">
            <span className="text-white font-black text-2xl leading-none italic pb-0.5 pr-0.5">Q</span>
          </div>
          <div>
            <span className="font-editorial font-extrabold text-xl tracking-tighter text-slate-900 block leading-none">GO QR CARD</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.25em] leading-none mt-1.5 opacity-80">Premium Networking</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
            <Search className="w-5.5 h-5.5 stroke-[2.2px]" />
          </button>
          <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 relative">
            <Bell className="w-5.5 h-5.5 stroke-[2.2px]" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full ring-2 ring-white animate-pulse"></span>
          </button>
          {!isLoggedIn && (
            <button className="ml-1.5 text-xs font-bold text-primary px-4 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all active:scale-95 leading-none">
              연결
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation - Premium Tonal Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-100/50 safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,0.04)] rounded-t-[2.5rem]">
        <div className="max-w-2xl mx-auto flex items-center justify-between h-22 px-4 lg:px-10">
          {/* Tab 1: Recent Contacts */}
          <button 
            onClick={() => onTabChange('recent_contacts')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 w-16 h-full transition-all duration-300",
              activeTab === 'recent_contacts' ? "text-primary scale-105" : "text-slate-400 hover:text-slate-500"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-colors",
              activeTab === 'recent_contacts' && "bg-primary/5"
            )}>
              <Users className={cn("w-6 h-6", activeTab === 'recent_contacts' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2.2px]")} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">연락</span>
          </button>

          {/* Tab 2: Recent Cards */}
          <button 
            onClick={() => onTabChange('recent_cards')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 w-16 h-full transition-all duration-300",
              activeTab === 'recent_cards' ? "text-primary scale-105" : "text-slate-400 hover:text-slate-500"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-colors",
              activeTab === 'recent_cards' && "bg-primary/5"
            )}>
              <History className={cn("w-6 h-6", activeTab === 'recent_cards' ? "stroke-[2.5px]" : "stroke-[2.2px]")} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">명함</span>
          </button>

          {/* Tab 3: Plus (Center Action) */}
          <div className="relative -top-4 px-2">
            <button 
              onClick={() => onTabChange('plus')}
              className={cn(
                "p-4.5 rounded-[1.75rem] shadow-2xl shadow-primary/30 transition-all duration-500 active:scale-90 group",
                activeTab === 'plus' ? "bg-primary text-white scale-110 rotate-180" : "bg-white border-2 border-primary/20 text-primary hover:border-primary"
              )}
            >
              <PlusCircle className="w-8.5 h-8.5" />
            </button>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-max">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                activeTab === 'plus' ? "text-primary" : "text-slate-300"
              )}>추가</span>
            </div>
          </div>

          {/* Tab 4: Wallet */}
          <button 
            onClick={() => onTabChange('wallet')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 w-16 h-full transition-all duration-300",
              activeTab === 'wallet' ? "text-primary scale-105" : "text-slate-400 hover:text-slate-500"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-colors",
              activeTab === 'wallet' && "bg-primary/5"
            )}>
              <Wallet className={cn("w-6 h-6", activeTab === 'wallet' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2.2px]")} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">명함첩</span>
          </button>

          {/* Tab 5: My Card */}
          <button 
            onClick={() => onTabChange('my_card')}
            className={cn(
              "flex flex-col items-center justify-center gap-2 w-16 h-full transition-all duration-300",
              activeTab === 'my_card' ? "text-primary scale-105" : "text-slate-400 hover:text-slate-500"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-colors",
              activeTab === 'my_card' && "bg-primary/5"
            )}>
              <User className={cn("w-6 h-6", activeTab === 'my_card' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2.2px]")} />
            </div>
            <span className="text-[10px] font-bold tracking-tight">프로필</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
