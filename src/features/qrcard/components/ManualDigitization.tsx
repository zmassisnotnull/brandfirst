import React, { useState } from 'react';
import { Camera, Upload, Sparkles, X, Check, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { cn } from '../../../app/components/ui/utils';
import { CameraCapture } from './CameraCapture';

interface ManualDigitizationProps {
  onNavigate: (page: string, params?: any) => void;
}

export function ManualDigitization({ onNavigate }: ManualDigitizationProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'processing' | 'review'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
      setMode('processing');
      // Simulate AI extraction
      setTimeout(() => {
        setMode('review');
      }, 2000);
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
      setTimeout(() => {
        setMode('review');
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  if (mode === 'camera') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex justify-between items-center p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={() => setMode('idle')}
          >
            <X className="w-6 h-6" />
          </Button>
          <span className="text-white font-medium">명함 스캔</span>
          <div className="w-10" />
        </div>
        
        <div className="flex-grow flex items-center justify-center relative">
          <CameraCapture 
            onCapture={handleCapture}
            onCancel={() => setMode('idle')}
            onGalleryClick={() => {/* Gallery Trigger */}}
          />
        </div>
        
        <div className="p-8 bg-black/50 backdrop-blur-md text-center">
          <p className="text-white/70 text-sm mb-6">명함을 사각형 프레임 안에 맞춰주세요</p>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl bg-blue-50 flex items-center justify-center overflow-hidden border border-blue-100">
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover opacity-50 grayscale" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 text-white shadow-lg">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">AI 분석 중...</h2>
          <p className="text-slate-500 text-sm">
            명함에서 정보를 추출하고 있습니다.<br />
            잠시만 기다려주세요.
          </p>
        </div>
        
        <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full w-1/3 animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  if (mode === 'review') {
    return (
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">정보 확인</h2>
          <Button variant="ghost" size="sm" onClick={() => setMode('idle')} className="text-slate-400">
            취소
          </Button>
        </div>

        <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-100 overflow-hidden">
          <div className="aspect-[1.6/1] bg-slate-100 relative overflow-hidden">
             {capturedImage && <img src={capturedImage} className="w-full h-full object-cover" alt="Captured Card" />}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-500 transition-colors">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">성함</label>
               <input type="text" defaultValue="홍길동" className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-bold" />
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-500 transition-colors">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">직함</label>
               <input type="text" defaultValue="대표이사 / CEO" className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-bold" />
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-500 transition-colors">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">회사명</label>
               <input type="text" defaultValue="(주) 브랜드퍼스트" className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-bold" />
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-blue-500 transition-colors">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">연락처</label>
               <input type="text" defaultValue="010-1234-5678" className="w-full bg-transparent border-none p-0 focus:outline-none text-slate-900 font-bold" />
             </div>
          </div>
          
          <Button 
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-200"
            onClick={() => onNavigate('app-wallet')}
          >
            기기에 저장하기
          </Button>
          
          <p className="text-center text-xs text-slate-400">
            저장된 정보는 연락처 목록에서 언제든 수정할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-lg mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          새로운 인연을<br />
          간편하게 등록하세요
        </h1>
        <p className="text-slate-500 text-sm">
          상대의 명함을 스캔하거나 이미지를 업로드하면<br />
          AI가 자동으로 정보를 추출합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setMode('camera')}
          className="group relative flex flex-col items-center justify-center p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-200 active:scale-[0.98] transition-all overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12">
            <Camera className="w-24 h-24" />
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <span className="text-lg font-bold">실시간 명함 스캔</span>
          <span className="text-xs text-white/70 mt-1">카메라로 명함을 비춰주세요</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm active:scale-[0.98] cursor-pointer transition-all hover:bg-slate-50">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-sm font-bold text-slate-900">사진 업로드</span>
          </label>

          <button 
            className="flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50"
            onClick={() => {/* Manual Input */}}
          >
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-sm font-bold text-slate-900">직접 입력</span>
          </button>
        </div>
      </div>

      <div className="pt-4">
        <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex gap-4 items-center">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <Check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">강력한 AI 추출 엔진</h4>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
              업로드된 명함 이미지는 AI 분석 후 안전하게 기기에 저장됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
