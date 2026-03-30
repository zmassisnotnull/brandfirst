import React, { useEffect, useState } from 'react';
import { Search, Filter, User as UserIcon, Grid, List as ListIcon, Phone, Mail, Wallet } from 'lucide-react';
import { cardWalletService, WalletContact } from '../../../app/services/cardWalletService';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';

interface WalletViewProps {
  onNavigate: (page: string, params?: any) => void;
}

export function WalletView({ onNavigate }: WalletViewProps) {
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setContacts(cardWalletService.getWallet());
  }, []);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center transform rotate-6 border border-primary/10">
          <Wallet className="w-12 h-12 text-primary/40" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">명함첩이 비어있네요</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            받은 명함을 보관하고 소중하게 관리하세요.<br />
            나만의 비즈니스 네트워크가 시작됩니다.
          </p>
        </div>
        <Button 
          onClick={() => onNavigate('app-plus')}
          className="mt-6 bg-primary hover:bg-primary/90 text-white rounded-2xl px-10 py-7 font-black shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          첫 명함 담기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="sticky top-0 bg-background/90 backdrop-blur-xl z-20 pb-4 pt-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">명함첩</h2>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Your Network</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 shrink-0'
              )}
            >
              <ListIcon className="w-4 h-4 stroke-[2.5px]" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-slate-400 shrink-0'
              )}
            >
              <Grid className="w-4 h-4 stroke-[2.5px]" />
            </button>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="이름, 회사, 키워드 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-[1.25rem] text-sm focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-bold placeholder:text-slate-300 shadow-sm"
          />
        </div>
      </div>

      {/* Filter Chips (Feature Mockup for v1.3 aesthetic) */}
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 scrollbar-hide pb-2">
        {['전체', '즐겨찾기', '최근 추가'].map((filter, i) => (
          <button 
            key={filter} 
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all border",
              i === 0 ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Contacts List/Grid */}
      {viewMode === 'list' ? (
        <div className="space-y-3 pb-24">
          {filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="group flex items-center gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100/50 shadow-sm hover:border-primary/20 transition-all active:scale-[0.98] cursor-pointer"
              onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
            >
              <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-slate-50 group-hover:ring-primary/10">
                {contact.profile_image ? (
                  <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-gradient-to-br from-slate-100 to-slate-50 w-full h-full flex items-center justify-center text-slate-300 font-black text-lg">
                    {contact.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0 pr-1">
                <h4 className="font-black text-slate-900 truncate leading-none mb-1.5">{contact.name}</h4>
                <p className="text-[11px] font-bold text-slate-500 truncate opacity-70">
                  {contact.title} {contact.company && ` • ${contact.company}`}
                </p>
              </div>
              <div className="flex gap-1.5">
                {contact.phone && (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-transform">
                    <Phone className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pb-24">
          {filteredContacts.map((contact) => (
            <div 
              key={contact.id} 
              className="group bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100/50 flex flex-col items-center text-center space-y-4 hover:border-primary/20 hover:shadow-md active:scale-95 transition-all cursor-pointer"
              onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
            >
              <div className="w-20 h-20 rounded-[1.75rem] bg-slate-50 flex items-center justify-center overflow-hidden ring-4 ring-slate-50 group-hover:ring-primary/5">
                {contact.profile_image ? (
                  <img src={contact.profile_image} alt={contact.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-gradient-to-br from-slate-100 to-slate-50 w-full h-full flex items-center justify-center text-slate-300 font-black text-2xl">
                    {contact.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="w-full overflow-hidden space-y-1">
                <h4 className="font-black text-slate-900 truncate text-base leading-none">{contact.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 truncate tracking-tight uppercase opacity-80">
                  {contact.company || 'Private'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredContacts.length === 0 && searchQuery && (
        <div className="py-24 text-center animate-in fade-in duration-500">
          <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
            <Search className="w-8 h-8 text-slate-200" />
          </div>
          <p className="text-slate-400 text-sm font-bold tracking-tight">찾으시는 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
