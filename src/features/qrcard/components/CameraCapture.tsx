import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, X, Zap, ZapOff, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

const ASPECT_RATIO = 1.8; // 90mm x 50mm

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 비디오 실제 해상도 기반으로 캔버스 설정
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // 화면상의 가이드 프레임 위치 및 크기 계산 (비율 기반)
    // 화면 중앙에 위치한 가이드 프레임의 상대적 좌표를 비디오 해상도에 매핑
    const containerWidth = video.clientWidth;
    const containerHeight = video.clientHeight;
    
    // 가이드 프레임 (CSS와 동일한 로직)
    const padding = 30;
    let frameWidth = containerWidth - padding * 2;
    let frameHeight = frameWidth / ASPECT_RATIO;
    
    if (frameHeight > containerHeight - padding * 2) {
      frameHeight = containerHeight - padding * 2;
      frameWidth = frameHeight * ASPECT_RATIO;
    }
    
    const frameLeft = (containerWidth - frameWidth) / 2;
    const frameTop = (containerHeight - frameHeight) / 2;

    // 비디오 해상도 대비 가이드 프레임의 비율 계산
    const scaleX = videoWidth / containerWidth;
    const scaleY = videoHeight / containerHeight;

    const cropX = frameLeft * scaleX;
    const cropY = frameTop * scaleY;
    const cropWidth = frameWidth * scaleX;
    const cropHeight = frameHeight * scaleY;

    // 캔버스 크기를 자를 영역만큼 설정
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 비디오에서 프레임 영역만 추출하여 캔버스에 그림
    ctx.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight, // 소스 영역 (비디오 해상도 기준)
      0, 0, cropWidth, cropHeight          // 대상 영역 (캔버스 기준)
    );

    // 이미지 파일로 변환
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
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
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
            
            {/* 가이드 가이드 프레임 (SVG Overlay) */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <svg className="w-full h-full">
                <defs>
                  <mask id="hole">
                    <rect width="100%" height="100%" fill="white" />
                    <rect 
                      x="30" 
                      y="15%" 
                      width="calc(100% - 60px)" 
                      height="calc((100% - 60px) / 1.8)" 
                      fill="black" 
                      rx="12"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#hole)" />
                {/* 파란색 테두리 */}
                <rect 
                  x="30" 
                  y="15%" 
                  width="calc(100% - 60px)" 
                  height="calc((100% - 60px) / 1.8)" 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2" 
                  rx="12"
                  className="animate-pulse"
                />
              </svg>
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
      <div className="p-8 bg-black shrink-0 flex items-center justify-center space-x-12">
        <button 
          onClick={startCamera}
          className="p-3 text-white/50 hover:text-white transition-colors"
          disabled={isInitializing}
        >
          <RefreshCw className={`w-6 h-6 ${isInitializing ? 'animate-spin text-blue-400' : ''}`} />
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

        <div className="w-12" /> {/* 간격 맞추기용 더미 */}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
