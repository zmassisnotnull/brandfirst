import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  Loader2, 
  Image as ImageIcon, 
  QrCode, 
  User, 
  ShieldCheck, 
  Zap,
  Smartphone,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';
import { CameraCapture } from './CameraCapture';
import { getSupabaseClient } from '../../../../utils/supabase/client';
import QRCode from 'qrcode';

interface ManualDigitizationProps {
  onNavigate: (page: string, params?: any) => void;
}

export function ManualDigitization({ onNavigate }: ManualDigitizationProps) {
  const [mode, setMode] = useState<'portal' | 'camera' | 'processing' | 'review' | 'my-qr'>('portal');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    const fetchMyProfile = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        if (data) {
          setUserProfile(data);
          const url = `${window.location.origin}?card=${data.id}`;
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
      }
    };
    fetchMyProfile();
  }, [mode]); // Refresh when entering my-qr

  const handleCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setMode('processing');
      // In a real app, this would trigger AI extraction
      setTimeout(() => setMode('review'), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setMode('processing');
      setTimeout(() => setMode('review'), 2500);
    };
    reader.readAsDataURL(file);
  };

  if (mode === 'camera') {
    return (
      <div className="fixed inset-0 z-[110] animate-in fade-in zoom-in-95 duration-500">
        <CameraCapture 
          onCapture={handleCapture}
          onCancel={() => setMode('portal')}
          onGalleryClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => handleFileUpload(e);
            input.click();
          }}
        />
      </div>
    );
  }

  if (mode === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-10 text-center space-y-12 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute -inset-10 bg-primary/10 blur-[100px] animate-pulse rounded-full" />
          <div className="w-48 h-48 rounded-[4rem] bg-white flex items-center justify-center overflow-hidden border border-white shadow-2xl relative z-10 transition-transform duration-1000 rotate-3">
             {capturedImage ? (
               <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-20 grayscale" />
             ) : (
               <div className="bg-secondary w-full h-full" />
             )}
             <div className="absolute inset-0 flex items-center justify-center">
               <Loader2 className="w-12 h-12 text-primary animate-spin stroke-[2px]" />
             </div>
          </div>
          <div className="absolute -bottom-4 -right-4 bg-primary text-white p-4 rounded-[1.5rem] shadow-xl rotate-12 z-20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-editorial font-black text-slate-900 tracking-tight italic uppercase">Digitizing Network</h2>
          <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase opacity-60 leading-relaxed mx-auto max-w-[200px]">
            AI performing structural analysis on your physical card.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'my-qr') {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
        <header className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-editorial font-extrabold text-slate-900 tracking-tight leading-none italic uppercase">Your Identity</h2>
          <button onClick={() => setMode('portal')} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X className="w-5 h-5" /></button>
        </header>

        <div className="bg-white rounded-[4rem] p-12 shadow-2xl shadow-slate-200 flex flex-col items-center space-y-12 border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
          
          <div className="text-center space-y-3">
            <h3 className="text-3xl font-editorial font-extrabold text-slate-900 italic uppercase leading-none">{userProfile?.name || 'Your Name'}</h3>
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/5 rounded-full">
               <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{userProfile?.title || 'Identity Hub Owner'}</span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-10 bg-primary/5 blur-[80px] opacity-100 group-hover:scale-110 transition-all duration-1000" />
            <div className="bg-white p-8 rounded-[3.5rem] shadow-inner relative z-10 transition-transform duration-700 group-hover:scale-105 border border-slate-100">
               {qrCodeDataUrl ? (
                 <img src={qrCodeDataUrl} alt="Identity QR" className="w-56 h-56 filter contrast-[1.05]" />
               ) : (
                 <div className="w-56 h-56 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary/20 animate-spin" />
                 </div>
               )}
            </div>
          </div>

          <div className="w-full bg-slate-900 p-8 rounded-[2.5rem] flex items-center justify-between text-white shadow-xl">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-xl">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Protocol 1.3</p>
                <p className="text-sm font-bold italic uppercase tracking-tight">Verified Access</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white/30" />
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-40 leading-relaxed px-12">
          Handoff your digital presence by allowing others to scan this high-fidelity signature.
        </p>
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl font-editorial font-extrabold text-slate-900 tracking-tight leading-none italic uppercase">Identity Validation</h2>
          <button onClick={() => setMode('portal')} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="bg-white rounded-[3.5rem] p-2 shadow-2xl shadow-slate-100 overflow-hidden group">
          <div className="aspect-[1.6/1] bg-secondary relative overflow-hidden rounded-[3rem]">
             {capturedImage && <img src={capturedImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Captured Card" />}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
             <div className="absolute bottom-6 left-8 text-white space-y-1">
                <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Authentication Source</span>
                <p className="text-base font-editorial font-bold italic uppercase">Original Physical Capture</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
             {[
               { label: 'Identified Name', value: 'Digitized Profile' },
               { label: 'Role / Designation', value: 'Market Analyst' },
               { label: 'Organization', value: 'Identity Corp' },
               { label: 'Contact Channel', value: 'Verified Mobile' },
             ].map((field, i) => (
               <div key={i} className="group p-6 bg-secondary rounded-[2rem] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-inner relative">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 opacity-50 group-hover:text-primary transition-colors">{field.label}</label>
                 <input 
                   type="text" 
                   defaultValue={field.value} 
                   className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-bold text-lg italic uppercase tracking-tight placeholder:text-slate-300" 
                 />
                 <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="w-10 h-10" />
                 </div>
               </div>
             ))}
          </div>
          
          <Button 
            className="w-full h-20 rounded-[2.25rem] bg-primary hover:bg-slate-900 text-white font-black text-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all text-[12px] tracking-[0.2em] italic uppercase"
            onClick={() => onNavigate('app-wallet')}
          >
            Finalize Transformation
            <ArrowRight className="w-5 h-5 ml-4 opacity-50" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out pb-10">
      <header className="px-1 pt-6 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Quick Add Portal</span>
        </div>
        <h1 className="text-4xl font-editorial font-extrabold text-slate-900 leading-[0.9] tracking-tighter italic uppercase">
          Expand Your<br /><span className="text-primary not-italic">Identity realm</span>
        </h1>
        <p className="text-slate-400 text-xs font-bold opacity-60 leading-relaxed max-w-[280px] uppercase tracking-wide">
          Protocol for converting physical presence into verified digital equity.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* Primary Action: AI Scan */}
        <button 
          onClick={() => setMode('camera')}
          className="group relative flex flex-col items-start justify-end p-10 aspect-[1.1/1] bg-slate-950 rounded-[4rem] text-white shadow-2xl shadow-slate-300 active:scale-[0.98] transition-all overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000">
            <Camera className="w-72 h-72" strokeWidth={1} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          
          <div className="relative z-10 w-full space-y-10">
             <div className="w-20 h-20 bg-white/10 rounded-[2.25rem] flex items-center justify-center backdrop-blur-3xl border border-white/20 group-hover:bg-primary group-hover:border-primary transition-all duration-700 rotate-6 group-hover:rotate-0">
               <Sparkles className="w-10 h-10 text-white" />
             </div>
             <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">External Matrix</span>
                   <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                </div>
                <h3 className="text-3xl font-editorial font-black leading-none italic uppercase tracking-tighter">AI Network Scan</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">Multimodal OCR • 1.3 Signature Analysis</p>
             </div>
          </div>
        </button>

        {/* Secondary Action: My QR */}
        <button 
          onClick={() => setMode('my-qr')}
          className="group relative flex flex-col items-start justify-end p-10 aspect-[1.8/1] bg-white rounded-[4rem] text-slate-900 shadow-2xl shadow-slate-100 border border-slate-50 active:scale-[0.98] transition-all overflow-hidden"
        >
          <div className="absolute top-0 right-0 opacity-[0.02] group-hover:-rotate-12 group-hover:scale-110 transition-all duration-1000 grayscale">
            <QrCode className="w-80 h-80" strokeWidth={1} />
          </div>
          
          <div className="relative z-10 w-full flex items-end justify-between">
             <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Self Presence</span>
                <h3 className="text-2xl font-editorial font-black leading-none italic uppercase tracking-tighter">Identity Broadcast</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal QR • Encrypted Handoff</p>
             </div>
             <div className="w-16 h-16 bg-slate-900 rounded-[1.85rem] flex items-center justify-center text-white group-hover:bg-primary transition-all shadow-xl shadow-slate-200">
               <ArrowUpRight className="w-7 h-7" />
             </div>
          </div>
        </button>

        {/* Gallery & Manual - Grouped */}
        <div className="grid grid-cols-2 gap-6 pb-4">
          <label className="group flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] shadow-sm active:scale-[0.95] cursor-pointer transition-all hover:shadow-xl border border-slate-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <div className="w-16 h-16 bg-secondary rounded-[2rem] flex items-center justify-center mb-6 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
              <ImageIcon className="w-7 h-7 opacity-20 group-hover:opacity-100" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-900 transition-colors relative z-10">Archive</span>
          </label>

          <button 
            className="group flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] shadow-sm active:scale-[0.95] transition-all hover:shadow-xl border border-slate-50 relative overflow-hidden"
            onClick={() => onNavigate('qrcard-create')}
          >
            <div className="absolute inset-0 bg-primary/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-secondary rounded-[2rem] flex items-center justify-center mb-6 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
              <User className="w-7 h-7 opacity-20 group-hover:opacity-100" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-slate-900 transition-colors relative z-10">Manual</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-950 p-10 rounded-[4rem] text-white flex items-center justify-between shadow-2xl shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-18 h-18 bg-white/5 rounded-[2rem] flex items-center justify-center border border-white/5 backdrop-blur-2xl">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em] italic">GoQR Security Vault</h4>
            <p className="text-sm font-bold text-slate-300 mt-1 uppercase tracking-tighter">Encrypted Identity Standard</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
           <span className="text-[8px] font-black">V1.3</span>
        </div>
      </div>
    </div>
  );
}
