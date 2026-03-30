import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  ArrowUpDown, 
  MoreVertical, 
  Share2, 
  Mail, 
  Phone, 
  Building2, 
  User, 
  Clock, 
  Star,
  ChevronRight,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { cardWalletService, WalletContact } from '../../../app/services/cardWalletService';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';

interface WalletViewProps {
  onNavigate: (page: string, params?: any) => void;
}

export function WalletView({ onNavigate }: WalletViewProps) {
  const [contacts, setContacts] = useState<WalletContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = cardWalletService.getAllContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.company && contact.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[40px] animate-pulse" />
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Accessing Business Ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-1000">
      {/* Editorial Header Hub */}
      <header className="px-1 pt-6 space-y-8 mb-10">
        <div className="flex items-center justify-between">
           <div className="space-y-1.5">
             <h1 className="text-4xl font-editorial font-black text-slate-900 tracking-tighter italic uppercase leading-none px-1">Identity Wallet</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] opacity-60">Verified Business Ledger 1.3</p>
           </div>
           <button 
             onClick={() => onNavigate('qrcard-digitize')}
             className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-slate-200 active:scale-95 transition-all group"
           >
             <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
           </button>
        </div>

        {/* Intelligence Search Bar */}
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-slate-100 border border-slate-50 transition-all focus-within:shadow-xl">
           <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
           </div>
           <input 
             type="text" 
             placeholder="Search Name, Role, or Organization" 
             className="w-full h-18 pl-16 pr-8 bg-transparent border-none focus:ring-0 text-slate-900 font-bold placeholder:text-slate-300 transition-all uppercase tracking-tight text-sm italic"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="absolute inset-y-0 right-6 flex items-center text-slate-300 hover:text-slate-900"
             >
               <X className="w-5 h-5" />
             </button>
           )}
        </div>

        {/* Refined Sorting/View Controls */}
        <div className="flex items-center justify-between px-2 pt-2">
           <div className="flex items-center gap-6">
              <button className="flex items-center gap-2.5 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] group">
                 <Filter className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                 FILTERS
              </button>
              <button className="flex items-center gap-2.5 text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] group">
                 <ArrowUpDown className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                 SORT
              </button>
           </div>
           <div className="flex items-center bg-secondary/50 p-1.5 rounded-[1.25rem] border border-slate-100">
             <button 
               onClick={() => setViewMode('grid')}
               className={cn(
                 "p-2.5 rounded-[1rem] transition-all",
                 viewMode === 'grid' ? "bg-white shadow-md text-slate-900" : "text-slate-300 hover:text-slate-900"
               )}
             >
               <LayoutGrid className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={cn(
                 "p-2.5 rounded-[1rem] transition-all",
                 viewMode === 'list' ? "bg-white shadow-md text-slate-900" : "text-slate-300 hover:text-slate-900"
               )}
             >
               <List className="w-4 h-4" />
             </button>
           </div>
        </div>
      </header>

      {/* Connection Grid/List Area */}
      <main className="flex-grow space-y-10 pb-24">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-10">
            <div className="w-32 h-32 bg-secondary rounded-[4rem] flex items-center justify-center transform 3.5:2 rotate-6 opacity-30">
               <User className="w-16 h-16 text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-editorial font-black text-slate-900 italic uppercase">NO CONNECTIONS FOUND</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">
                Expand your search or add a new identity to the ledger.
              </p>
            </div>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
          )}>
            {filteredContacts.map((contact) => (
              <div 
                key={contact.id}
                onClick={() => onNavigate('qrcard-view', { profileId: contact.id })}
                className="group relative bg-white hover:bg-slate-50 p-8 rounded-[3.5rem] shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-50 cursor-pointer active:scale-[0.98] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-8">
                   <div className="flex gap-6">
                      <div className="w-20 h-20 rounded-[2.25rem] bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-inner group-hover:scale-105 transition-transform duration-700">
                        {contact.profile_image ? (
                          <img src={contact.profile_image} className="w-full h-full object-cover" alt={contact.name} />
                        ) : (
                          <div className="text-slate-300 font-editorial font-black text-2xl italic uppercase">{contact.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="space-y-1 pr-6 pt-1">
                        <h4 className="font-editorial font-black text-slate-900 truncate text-2xl italic uppercase tracking-tighter leading-none">{contact.name}</h4>
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em] opacity-80">{contact.title || 'Verified Professional'}</span>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-50">{contact.company || 'Direct Entity Hub'}</p>
                        </div>
                      </div>
                   </div>
                   <button className="p-3 rounded-2xl bg-secondary text-slate-300 hover:text-slate-950 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                   </button>
                </div>

                <div className="flex items-end justify-between">
                   <div className="flex gap-4">
                      {contact.phone && (
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-sm">
                            <Phone className="w-4.5 h-4.5" />
                         </div>
                      )}
                      {contact.email && (
                         <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:bg-white transition-all shadow-sm">
                            <Mail className="w-4.5 h-4.5" />
                         </div>
                      )}
                   </div>
                   <div className="flex flex-col items-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                      <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest leading-none">Last Sync</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                         {new Date(contact.last_contact_at || Date.now()).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                      </span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Advanced Branding Sync */}
      <footer className="mt-auto px-1 pt-12 pb-24 text-center opacity-30">
        <div className="flex flex-col items-center gap-1 grayscale opacity-50">
          <p className="text-[10px] font-black text-slate-900 tracking-[0.4em] uppercase">Built on G-PLATFORM</p>
          <p className="text-[8px] font-bold text-slate-500 tracking-[0.2em] uppercase">VERIFIED IDENTITY 1.3 LEDGER</p>
        </div>
      </footer>
    </div>
  );
}
