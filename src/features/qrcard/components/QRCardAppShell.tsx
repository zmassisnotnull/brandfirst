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
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground pb-24">
      {/* Top Header - Editorial Style */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/20 px-6 h-16 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform hover:rotate-3 active:scale-95">
            <span className="text-white font-black text-2xl leading-none italic pb-0.5 pr-0.5">Q</span>
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter text-slate-900 block leading-none">GO QR CARD</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mt-1">Connect People</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all active:scale-90">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all active:scale-90 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          {!isLoggedIn && (
            <button className="ml-2 text-sm font-bold text-primary px-4 py-2 hover:bg-primary/5 rounded-full border border-primary/20 transition-all active:scale-95 leading-none">
              연결
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-8 overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation - Premium Floating Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.03)] rounded-t-[2rem]">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-20 px-2 lg:px-8">
          {/* Tab 1: Recent Contacts */}
          <button 
            onClick={() => onTabChange('recent_contacts')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 w-20 h-full transition-all duration-300",
              activeTab === 'recent_contacts' ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Users className={cn("w-6 h-6", activeTab === 'recent_contacts' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-extrabold">최근 연락</span>
          </button>

          {/* Tab 2: Recent Cards */}
          <button 
            onClick={() => onTabChange('recent_cards')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 w-20 h-full transition-all duration-300",
              activeTab === 'recent_cards' ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <History className={cn("w-6 h-6", activeTab === 'recent_cards' ? "stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-extrabold">최근 명함</span>
          </button>

          {/* Tab 3: Plus (Center Action) - High Impact */}
          <div className="relative -top-3 px-2">
            <button 
              onClick={() => onTabChange('plus')}
              className={cn(
                "p-4 rounded-[1.5rem] shadow-xl shadow-primary/20 transition-all duration-300 active:scale-90 group",
                activeTab === 'plus' ? "bg-primary text-white scale-110" : "bg-white border-2 border-primary/50 text-primary hover:bg-primary/5"
              )}
            >
              <PlusCircle className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500 ease-out" />
            </button>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-max">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wider",
                activeTab === 'plus' ? "text-primary" : "text-slate-400"
              )}>명함 추가</span>
            </div>
          </div>

          {/* Tab 4: Wallet/Card Case */}
          <button 
            onClick={() => onTabChange('wallet')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 w-20 h-full transition-all duration-300",
              activeTab === 'wallet' ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Wallet className={cn("w-6 h-6", activeTab === 'wallet' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-extrabold">명함첩</span>
          </button>

          {/* Tab 5: My Card */}
          <button 
            onClick={() => onTabChange('my_card')}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 w-20 h-full transition-all duration-300",
              activeTab === 'my_card' ? "text-primary scale-110" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <User className={cn("w-6 h-6", activeTab === 'my_card' ? "fill-primary/10 stroke-[2.5px]" : "stroke-[2px]")} />
            <span className="text-[10px] font-extrabold">내 명함</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
