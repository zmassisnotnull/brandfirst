import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, X, Zap, ZapOff, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  onGalleryClick: () => void;
}

const ASPECT_RATIO = 1.8; // 90mm x 50mm

export function CameraCapture({ onCapture, onCancel, onGalleryClick }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // 후면 카메라 우선
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Camera Access Error:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해 주세요.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !stream || !containerRef.current || !stream.getVideoTracks()[0]) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    // 1. 실제 비디오 해상도
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // 2. 화면상의 컨테이너 및 가이드 프레임 위치 계산 (getBoundingClientRect로 정밀도 확보)
    const containerRect = container.getBoundingClientRect();
    // 가이드 프레임 요소를 직접 찾기 위해 ref를 사용하거나 querySelector 활용
    const frameElement = container.querySelector('.border-blue-500');
    if (!frameElement) return;
    const frameRect = frameElement.getBoundingClientRect();
    
    // 3. 비디오가 object-cover로 렌더링될 때의 실제 표시 영역 계산
    const videoAspectRatio = videoWidth / videoHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    let renderWidth, renderHeight, offsetX = 0, offsetY = 0;
    
    if (videoAspectRatio > containerAspectRatio) {
      renderHeight = containerRect.height;
      renderWidth = containerRect.height * videoAspectRatio;
      offsetX = (renderWidth - containerRect.width) / 2;
    } else {
      renderWidth = containerRect.width;
      renderHeight = containerRect.width / videoAspectRatio;
      offsetY = (renderHeight - containerRect.height) / 2;
    }

    const scale = videoWidth / renderWidth;
    
    // 4. 프레임 '안쪽'을 기준으로 자르기 위해 테두리 두께(2px)만큼 보정
    const borderWidth = 2;
    const relativeX = frameRect.left - containerRect.left + borderWidth;
    const relativeY = frameRect.top - containerRect.top + borderWidth;
    const innerWidth = frameRect.width - (borderWidth * 2);
    const innerHeight = frameRect.height - (borderWidth * 2);

    // 5. 비디오 좌표계로 변환 (정수형으로 반올림하여 서브픽셀 누수 방지)
    const cropX = Math.round((relativeX + offsetX) * scale);
    const cropY = Math.round((relativeY + offsetY) * scale);
    const cropWidth = Math.round(innerWidth * scale);
    const cropHeight = Math.round(innerHeight * scale);

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 보정된 좌표로 비디오 프레임 추출
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
      } catch (err) {
        console.error('Torch error:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-in fade-in">
      {/* 상단 헤더 */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onCancel} 
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-medium text-sm drop-shadow-md">명함 촬영</span>
        <button 
          onClick={toggleFlash}
          className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          {isFlashOn ? <Zap className="w-6 h-6 text-yellow-400" /> : <ZapOff className="w-6 h-6" />}
        </button>
      </div>

      {/* 비디오 화면 및 오버레이 */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-black flex items-center justify-center"
      >
        {error ? (
          <div className="p-8 text-center space-y-4">
            <p className="text-white/80">{error}</p>
            <Button variant="outline" className="border-white text-white hover:bg-white/10" onClick={startCamera}>
              다시 시도
            </Button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* 가이드 프레임 (SVG Overlay) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-[30px]">
              <div className="relative w-full max-h-full aspect-[9/5] border-2 border-blue-500 rounded-xl shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)] animate-pulse">
                {/* 모서리 표시 (선선택사항) */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              </div>
            </div>

            {/* 안내 텍스트 */}
            <div className="absolute top-[45%] left-0 w-full text-center z-20 pointer-events-none px-8">
              <p className="text-white/90 text-sm font-medium drop-shadow-md">
                파란색 프레임 안에 명함을 맞춰주세요.<br/>
                정보가 잘 보이도록 찍어주시면 정확도가 높아집니다.
              </p>
            </div>
          </>
        )}
      </div>

      {/* 하단 컨트롤러 */}
      <div className="p-8 bg-black shrink-0 flex items-center justify-between px-12">
        <button 
          onClick={onGalleryClick}
          className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
        >
          <div className="p-3 bg-white/10 rounded-full">
            <ImageIcon className="w-6 h-6" />
          </div>
          <span className="text-[10px]">앨범</span>
        </button>

        <button 
          onClick={handleCapture}
          className="relative flex items-center justify-center group active:scale-95 transition-transform"
          disabled={isInitializing || !!error}
        >
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
              <CameraIcon className="w-8 h-8 text-black" />
            </div>
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        </button>

        <button 
          onClick={startCamera}
          className="flex flex-col items-center gap-1 text-white/50 hover:text-white transition-colors"
          disabled={isInitializing}
        >
          <div className="p-3 bg-white/5 rounded-full">
            <RefreshCw className={`w-6 h-6 ${isInitializing ? 'animate-spin text-blue-400' : ''}`} />
          </div>
          <span className="text-[10px]">재설정</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
