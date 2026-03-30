import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Download, 
  MapPin, 
  Globe, 
  Share2, 
  Loader2, 
  ArrowLeft,
  MessageSquare,
  Building2,
  Smartphone,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { digitalCardApi } from '@/app/services/digitalCardApi';
import { usePWAInstall as usePWA } from '@/app/hooks/usePWAInstall';
import QRCode from 'qrcode';
import { cn } from '@/app/components/ui/utils';

interface CardViewerProps {
  id: string;
  onNavigate: (page: string, params?: { id?: string; profileId?: string }) => void;
}

export function CardViewer({ id, onNavigate }: CardViewerProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const { isInstallable, install } = usePWA();
  const [showConversion, setShowConversion] = useState(false);

  useEffect(() => {
    loadProfile();
    // Show conversion CTA after 3 seconds for anonymous viewers
    const timer = setTimeout(() => setShowConversion(true), 3000);
    return () => clearTimeout(timer);
  }, [id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await digitalCardApi.getProfile(id);
      setProfile(data);
      if (data) {
        const url = `${window.location.origin}?card=${id}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = () => {
    if (!profile) return;
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
ORG:${profile.company || ''}
TITLE:${profile.title || ''}
TEL;TYPE=CELL:${profile.phone}
EMAIL:${profile.email}
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${profile.name}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleActionClick = (action: () => void, label: string) => {
    // Tracking could be added here
    action();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[40px] animate-pulse" />
          <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Accessing Identity Hub...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center space-y-8">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-slate-200" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-editorial font-black text-slate-900 italic">IDENTITY OBSOLETE</h2>
          <p className="text-sm text-slate-400 font-bold leading-relaxed px-4">This profile may have been decommissioned or is currently unavailable.</p>
        </div>
        <Button 
          variant="outline" 
          className="rounded-2xl h-14 px-8 font-black text-[10px] tracking-widest uppercase italic"
          onClick={() => onNavigate('recent_cards')}
        >
          Return to Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 animate-in fade-in duration-1000">
      {/* Visual Identity Section */}
      <div className="bg-white rounded-b-[4rem] shadow-2xl shadow-slate-200 border-b border-slate-100 p-8 pt-4 space-y-10">
        <header className="flex items-center justify-between">
           <button 
             onClick={() => onNavigate('recent_cards')}
             className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors active:scale-90"
           >
             <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
           </button>
           <button className="w-12 h-12 bg-secondary/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors active:scale-90">
             <Share2 className="w-5 h-5 stroke-[2.5px]" />
           </button>
        </header>

        <section className="space-y-10">
          {/* Identity Presentation */}
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-32 h-32 rounded-[3.5rem] bg-secondary overflow-hidden ring-4 ring-white shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-105">
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt={profile.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Building2 className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-editorial font-extrabold text-slate-900 tracking-tight leading-none italic uppercase">{profile.name}</h1>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-primary bg-primary/5 px-4 py-1.5 rounded-full uppercase tracking-widest">{profile.title}</span>
                  <p className="text-xs font-bold text-slate-400 flex items-center gap-2 opacity-60">
                     {profile.company || 'Private Portfolio'}
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Action Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleActionClick(() => window.location.href = `tel:${profile.phone}`, 'call')}
                className="group h-16 bg-primary hover:bg-slate-900 text-white rounded-[1.5rem] gap-3 text-base font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                  <Phone className="w-4 h-4 fill-current group-hover:rotate-12 transition-transform" />
                </div>
                <span>CALL NOW</span>
              </button>
              <button 
                onClick={() => handleActionClick(() => window.location.href = `sms:${profile.phone}`, 'message')}
                className="group h-16 bg-slate-900 hover:bg-black text-white rounded-[1.5rem] gap-3 text-base font-bold shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                  <MessageSquare className="w-4 h-4 fill-current group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <span>TEXT</span>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Ad / CTA Slot */}
        {showConversion && (
          <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl text-white space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,102,255,0.1),_transparent)]" />
            <div className="space-y-2 relative z-10">
              <h3 className="font-editorial font-extrabold text-2xl tracking-tight leading-tight italic">ELEVATE YOUR NETWORK</h3>
              <p className="text-slate-500 text-[11px] font-bold tracking-[0.05em] leading-relaxed uppercase">Update anytime, track interactions, and stay connected.</p>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-16 rounded-[1.5rem] text-sm shadow-lg transition-all active:scale-95 relative z-10"
              onClick={() => onNavigate('qrcard-create')}
            >
              CREATE YOUR DIGITAL IDENTITY
              <ArrowRight className="w-4 h-4 ml-3 opacity-50" />
            </Button>
          </div>
        )}

        {/* Contact Intelligence Hub */}
        <section className="space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 space-y-8">
            <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] italic">Contact Intelligence</h3>

            <div className="space-y-6">
              {profile.phone && (
                <div className="flex items-center gap-5 group cursor-pointer" onClick={() => window.location.href = `tel:${profile.phone}`}>
                  <div className="w-14 h-14 rounded-[1.25rem] bg-secondary flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-inner">
                    <Smartphone className="w-6 h-6 stroke-[2.2px]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Mobile Access</p>
                    <span className="text-slate-900 font-bold tracking-tight text-base italic">{profile.phone}</span>
                  </div>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-5 group cursor-pointer" onClick={() => window.location.href = `mailto:${profile.email}`}>
                  <div className="w-14 h-14 rounded-[1.25rem] bg-secondary flex items-center justify-center text-slate-400 group-hover:text-primary transition-all shadow-inner">
                    <Mail className="w-6 h-6 stroke-[2.2px]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mb-1">Electronic Mail</p>
                    <span className="text-slate-900 font-bold tracking-tight text-base italic truncate max-w-[200px] block">{profile.email}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full h-16 bg-secondary hover:bg-primary/5 text-slate-900 hover:text-primary font-bold rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-95"
              onClick={handleSaveContact}
            >
              <Download className="w-5.5 h-5.5 opacity-30 group-hover:opacity-100" />
              <span>GENERATE VCARD</span>
            </button>
          </div>

          {/* Presentation QR Hub */}
          <div className="bg-white rounded-[3.5rem] p-12 text-center space-y-10 border border-slate-50 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-lg font-editorial font-black text-slate-900 tracking-tight italic">PRESENT QR</h3>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase opacity-60 px-8">Save this identity directly to your business wallet</p>
            </div>

            <div className="relative group mx-auto inline-block">
              <div className="absolute -inset-10 bg-primary/5 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="bg-white p-10 rounded-[3rem] shadow-inner relative z-10 transition-transform duration-700 group-hover:scale-105 border border-slate-50">
                 {qrCodeDataUrl ? (
                   <img src={qrCodeDataUrl} alt="Identity QR" className="w-52 h-52 filter contrast-[1.05]" />
                 ) : (
                   <div className="w-52 h-52 flex items-center justify-center">
                     <Loader2 className="w-10 h-10 text-primary/20 animate-spin" />
                   </div>
                 )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Editorial Branding */}
        <footer className="text-center p-12 pt-4 space-y-6">
          <div className="flex flex-col items-center gap-1 opacity-20 filter grayscale">
            <p className="text-[10px] font-black text-slate-900 tracking-[0.4em] uppercase">Built on GoQRCard Platform</p>
            <p className="text-[8px] font-bold text-slate-500 tracking-widest">VERIFIED IDENTITY 1.3</p>
          </div>
          {isInstallable && (
            <button
              className="text-[10px] font-black text-primary underline underline-offset-8 decoration-[3px] decoration-primary/20 hover:decoration-primary/60 transition-all uppercase tracking-widest"
              onClick={install}
            >
              Instantiate Application
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
