import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Mail,
  Building2,
  QrCode,
  Image as ImageIcon,
  User as UserIcon,
  Phone,
  ArrowRight,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useIsMobile } from '@/app/components/ui/use-mobile';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { ImageCropper } from './ImageCropper';
import { CameraCapture } from './CameraCapture';
import { digitalCardApi } from '@/app/services/digitalCardApi';
import { getDeviceId } from '@/app/utils/deviceId';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { cn } from "@/app/components/ui/utils";

const formatKRPhoneNumber = (val: string) => {
  let digits = val.replace(/[^\d]/g, '');
  if (digits.startsWith('82') && digits.length >= 10) {
    digits = '0' + digits.slice(2);
  }
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.startsWith('0')) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return digits;
};

interface ExtractedData {
  name: string;
  phone: string;
  email: string;
}

export function QuickCardCreator({ onNavigate }: { onNavigate: (page: string, params?: { id?: string; profileId?: string }) => void }) {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'upload' | 'analyzing' | 'confirm'>('upload');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'front' | 'back'>('front');
  const [uploadSide, setUploadSide] = useState<'front' | 'back' | null>(null);
  const [data, setData] = useState<ExtractedData>({
    name: '',
    phone: '',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadSide) return;
    const previewUrl = URL.createObjectURL(file);
    if (uploadSide === 'front') {
      setFrontImage(file);
      setFrontPreview(previewUrl);
      processAnalysis(file);
    } else {
      setBackImage(file);
      setBackPreview(previewUrl);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    const currentSide = uploadSide;
    setShowCamera(false);
    setUploadSide(null);
    const previewUrl = URL.createObjectURL(file);
    if (currentSide === 'back') {
      setBackImage(file);
      setBackPreview(previewUrl);
    } else {
      setFrontImage(file);
      setFrontPreview(previewUrl);
      await processAnalysis(file);
    }
  };

  const processAnalysis = async (file: File) => {
    setStep('analyzing');
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/analyze-card`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ 
              image: base64, 
              imageBase64: base64
            })
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || '명함 분석에 실패했습니다.');
          }
          const result = await response.json();
          const extracted = result.data || result;
          const findPhoneNumber = (obj: any) => {
            if (!obj) return '';
            const mobileKeys = ['mobile', 'cell', 'phone'];
            for (const key of mobileKeys) {
              const val = String(obj[key] || '');
              const digits = val.replace(/[^\d]/g, '');
              if ((digits.startsWith('010') && digits.length >= 10) || 
                  (digits.startsWith('8210') && digits.length >= 11)) {
                return val;
              }
            }
            const phoneKeys = ['phone', 'tel', 'landline', 'office', 'call', 'mobile'];
            for (const key of phoneKeys) {
              const val = String(obj[key] || '');
              const digits = val.replace(/[^\d]/g, '');
              if (digits.length >= 7) return val;
            }
            return obj.mobile || obj.phone || obj.tel || '';
          };
          const phoneVal = findPhoneNumber(extracted);
          setData({
            name: extracted.name || '',
            phone: formatKRPhoneNumber(phoneVal),
            email: extracted.email || ''
          });
          setStep('confirm');
        } catch (innerErr: any) {
          console.error('Inner Analysis error:', innerErr);
          setError('AI 분석 중 오류가 발생했습니다. 직접 입력해 주세요.');
          setStep('confirm');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Outer Analysis error:', err);
      setError('이미지 처리 중 오류가 발생했습니다.');
      setStep('confirm');
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setShowCropper(false);
    setSelectedImage(null);
    setUploadSide(null);
    const previewUrl = URL.createObjectURL(croppedFile);
    setFrontImage(croppedFile);
    setFrontPreview(previewUrl);
    await processAnalysis(croppedFile);
  };

  const handleSave = async () => {
    if (!frontImage) return;
    setIsSaving(true);
    setError(null);
    try {
      const frontUrl = await digitalCardApi.uploadQrCardImage(frontImage);
      let backUrl = null;
      if (backImage) {
        try {
          backUrl = await digitalCardApi.uploadQrCardImage(backImage);
        } catch (backErr) {
          console.error('Back image upload failed, proceeding without it:', backErr);
        }
      }
      const deviceId = getDeviceId();
      const result = await digitalCardApi.saveAnonymousProfile({
        ...data,
        profile_image: frontUrl,
        back_image: backUrl,
        is_public: true
      }, deviceId);
      if (result.success) {
        const myCards = JSON.parse(localStorage.getItem('my_qrcards') || '[]');
        myCards.push(result.id);
        localStorage.setItem('my_qrcards', JSON.stringify(myCards));
        onNavigate('qrcard-view', { id: result.id });
      } else {
        throw new Error(result.message || '저장에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-1000">
      <div className="max-w-lg mx-auto w-full px-6 pt-16 space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Instant Digitization</span>
          </div>
          <h1 className="text-4xl font-editorial font-extrabold text-slate-900 tracking-tight leading-none italic text-nowrap">
            10-SECOND IDENTITY
          </h1>
          <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase opacity-60">
            One photo is all it takes. No registration required.
          </p>
        </header>

        {step === 'upload' && (
          <div className="grid grid-cols-1 gap-6">
            <div 
              className={cn(
                "group relative bg-white rounded-[3rem] p-10 flex flex-col items-center justify-center space-y-6 transition-all duration-700 cursor-pointer",
                frontPreview ? "shadow-2xl shadow-slate-200" : "shadow-sm hover:shadow-xl hover:translate-y-[-4px]",
                "border border-white hover:border-slate-100"
              )}
              onClick={() => {
                setUploadSide('front');
                if (isMobile) {
                  setShowCamera(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              {frontPreview ? (
                <div className="relative w-full aspect-[1.5/1] rounded-[2rem] overflow-hidden shadow-inner bg-slate-50">
                  <img src={frontPreview} alt="Identity Preview" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-secondary rounded-[1.75rem] flex items-center justify-center group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-500">
                  <Camera className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              )}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-editorial font-black text-slate-900 tracking-tight italic">PRIMARY IDENTITY</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.1em] uppercase opacity-70">
                  {frontPreview ? "Identity processing complete" : "Scan the front of your card"}
                </p>
                {isMobile && !frontPreview && (
                  <button 
                    className="mt-4 text-[10px] font-black text-primary underline underline-offset-4 decoration-2 opacity-60 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadSide('front');
                      fileInputRef.current?.click();
                    }}
                  >
                    SELECT FROM GALLERY
                  </button>
                )}
              </div>
            </div>
            <div 
              className={cn(
                "group relative bg-white rounded-[3rem] p-8 flex items-center gap-8 shadow-sm border border-white hover:border-slate-100 cursor-pointer transition-all",
                backPreview && "shadow-xl"
              )}
              onClick={() => {
                setUploadSide('back');
                if (isMobile) {
                  setShowCamera(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className={cn(
                "w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-all",
                backPreview ? "bg-slate-900" : "bg-secondary group-hover:bg-primary/5"
              )}>
                {backPreview ? (
                   <img src={backPreview} alt="Back Preview" className="w-full h-full object-cover rounded-[1.25rem]" />
                ) : (
                   <Upload className="w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-editorial font-bold text-slate-900 italic">SUPPLEMENTAL BRANDING</h4>
                <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase opacity-60">
                   Back of card or additional logos (optional)
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="bg-white py-32 rounded-[4rem] shadow-2xl shadow-slate-200 border border-white flex flex-col items-center space-y-10 animate-in zoom-in-95 duration-1000">
            <div className="relative">
              <div className="absolute -inset-10 bg-primary/10 blur-[100px] animate-pulse" />
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center relative z-10 animate-bounce">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-editorial font-extrabold text-slate-900 tracking-tight leading-none italic uppercase">Authenticating Identity</h2>
              <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold tracking-[0.2em] justify-center uppercase">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing structure...
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 ease-out">
            <div className="space-y-5">
              <div className="flex bg-secondary p-1.5 rounded-[1.5rem] w-fit mx-auto">
                <button 
                  onClick={() => setActiveTab('front')}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black rounded-[1.25rem] uppercase tracking-widest transition-all",
                    activeTab === 'front' ? "bg-white text-slate-900 shadow-sm italic" : "text-slate-400"
                  )}
                >
                  Front
                </button>
                <button 
                  onClick={() => setActiveTab('back')}
                  className={cn(
                    "px-6 py-2 text-[10px] font-black rounded-[1.25rem] uppercase tracking-widest transition-all",
                    activeTab === 'back' ? "bg-white text-slate-900 shadow-sm italic" : "text-slate-400"
                  )}
                >
                  Back {!backPreview && '(Empty)'}
                </button>
              </div>
              <div className="bg-white p-4 rounded-[3.5rem] shadow-2xl shadow-slate-300 border border-white overflow-hidden aspect-[1.5/1]">
                 <img 
                   src={(activeTab === 'front' ? frontPreview : backPreview) || ''} 
                   alt="Identity View" 
                   className="w-full h-full object-contain filter drop-shadow-lg" 
                 />
              </div>
            </div>
            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-50 space-y-12">
              <div className="space-y-1.5 text-center">
                <h3 className="text-xl font-editorial font-black text-slate-900 italic">VERIFY INTELLIGENCE</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60">Ensure all extracted data is correct</p>
              </div>
              <div className="space-y-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 italic">Legal Name</label>
                    <div className="relative group/field">
                      <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within/field:text-primary transition-colors" />
                      <Input 
                        value={data.name} 
                        onChange={(e: any) => setData({ ...data, name: e.target.value })}
                        className="pl-16 h-18 rounded-[1.5rem] bg-secondary border-none focus-visible:ring-4 focus-visible:ring-primary/5 text-base font-bold text-slate-900 italic"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 italic">Direct Mobile</label>
                    <div className="relative group/field">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within/field:text-primary transition-colors" />
                      <Input 
                        value={data.phone} 
                        onChange={(e: any) => setData({ ...data, phone: formatKRPhoneNumber(e.target.value) })}
                        className="pl-16 h-18 rounded-[1.5rem] bg-secondary border-none focus-visible:ring-4 focus-visible:ring-primary/5 text-base font-bold text-slate-900 italic"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-2 italic">Electronic Address</label>
                    <div className="relative group/field">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within/field:text-primary transition-colors" />
                      <Input 
                        value={data.email} 
                        onChange={(e: any) => setData({ ...data, email: e.target.value })}
                        className="pl-16 h-18 rounded-[1.5rem] bg-secondary border-none focus-visible:ring-4 focus-visible:ring-primary/5 text-base font-bold text-slate-900 italic"
                      />
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="p-5 bg-red-50 text-red-500 rounded-[1.5rem] text-[11px] font-bold flex items-center gap-4 italic shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button 
                  className="w-full h-20 text-lg font-black bg-primary hover:bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-primary/30 active:scale-95 transition-all uppercase italic tracking-tighter"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Materializing Identity...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>FINALIZE IDENTITY</span>
                      <ArrowRight className="w-6 h-6 opacity-30" />
                    </div>
                  )}
                </Button>
                <p className="text-[9px] text-slate-300 font-bold text-center uppercase tracking-widest px-8 leading-relaxed opacity-60">
                  Data is processed under v1.3 encryption protocols. <br/>
                  Anonymous identities are retained for 90 days.
                </p>
              </div>
            </div>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageChange} 
        />
        {showCropper && selectedImage && (
          <ImageCropper 
            image={selectedImage}
            onCrop={handleCropComplete}
            onCancel={() => {
              setShowCropper(false);
              setSelectedImage(null);
              setUploadSide(null);
            }}
          />
        )}
        {showCamera && (
          <CameraCapture 
            onCapture={handleCameraCapture}
            onCancel={() => {
              setShowCamera(false);
              setUploadSide(null);
            }}
            onGalleryClick={() => {
              const currentSide = uploadSide;
              setShowCamera(false);
              setUploadSide(currentSide);
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 100);
            }}
          />
        )}
      </div>
    </div>
  );
}
