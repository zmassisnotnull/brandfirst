import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Rect } from 'fabric';
import { Check, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  image: File;
  onCrop: (croppedImage: File) => void;
  onCancel: () => void;
}

const ASPECT_RATIO = 1.8; // 9cm x 5cm

export function ImageCropper({ image, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastPinchDistRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    let canvas: Canvas | null = null;
    
    // 레이아웃이 완전히 정착된 후 실행하기 위해 약간의 지연 부여
    const timer = setTimeout(() => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      canvas = new Canvas(canvasRef.current!, {
        width,
        height,
        backgroundColor: '#1a1a1a',
        selection: false,
        allowTouchScrolling: false,
      });
      fabricRef.current = canvas;

      // 가이드 프레임 영역 계산
      const padding = 30;
      let frameWidth = width - padding * 2;
      let frameHeight = frameWidth / ASPECT_RATIO;
      
      if (frameHeight > height - padding * 2) {
        frameHeight = height - padding * 2;
        frameWidth = frameHeight * ASPECT_RATIO;
      }
      
      const frameLeft = (width - frameWidth) / 2;
      const frameTop = (height - frameHeight) / 2;

      // 오버레이 생성
      const overlayColor = 'rgba(0, 0, 0, 0.6)';
      const overlays = [
        new Rect({ left: 0, top: 0, width, height: frameTop, fill: overlayColor, selectable: false, evented: false }),
        new Rect({ left: 0, top: frameTop + frameHeight, width, height: height - (frameTop + frameHeight), fill: overlayColor, selectable: false, evented: false }),
        new Rect({ left: 0, top: frameTop, width: frameLeft, height: frameHeight, fill: overlayColor, selectable: false, evented: false }),
        new Rect({ left: frameLeft + frameWidth, top: frameTop, width: width - (frameLeft + frameWidth), height: frameHeight, fill: overlayColor, selectable: false, evented: false }),
        new Rect({ left: frameLeft, top: frameTop, width: frameWidth, height: frameHeight, fill: 'transparent', stroke: '#3b82f6', strokeWidth: 2, selectable: false, evented: false })
      ];

      // 이미지 로드 및 초기 배치
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        FabricImage.fromURL(url).then((img) => {
          if (!canvas) return;
          imageRef.current = img;
          
          // 이미지가 프레임을 꽉 채우도록 초기 스케일 계산
          const scaleX = frameWidth / img.width!;
          const scaleY = frameHeight / img.height!;
          const initialScale = Math.max(scaleX, scaleY);
          
          img.set({
            left: width / 2,
            top: height / 2,
            originX: 'center',
            originY: 'center',
            scaleX: initialScale,
            scaleY: initialScale,
            hasControls: false,
            selectable: true,
            hoverCursor: 'grab',
            moveCursor: 'grabbing',
          });
          
          canvas.add(img, ...overlays);
          canvas.setActiveObject(img);
          canvas.renderAll();
          setIsReady(true);
        });
      };
      reader.readAsDataURL(image);

      // 핀치 줌 및 마우스 휠 지원
      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        const img = imageRef.current;
        if (img) {
          const factor = 0.999 ** delta;
          const newScale = img.scaleX! * factor;
          if (newScale > 0.05 && newScale < 15) {
            img.scale(newScale);
            canvas!.renderAll();
          }
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // 터치 이벤트 핸들링 (핀치 줌 구현)
      canvas.on('mouse:move', (opt: any) => {
        const e = opt.e as TouchEvent;
        if (e.touches && e.touches.length === 2 && imageRef.current) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          
          if (lastPinchDistRef.current > 0) {
            const delta = dist / lastPinchDistRef.current;
            const img = imageRef.current;
            const newScale = img.scaleX! * delta;
            
            if (newScale > 0.05 && newScale < 15) {
              img.scale(newScale);
              canvas!.renderAll();
            }
          }
          lastPinchDistRef.current = dist;
          // 핀치 중에는 이미지가 드래그되어 튀지 않도록 제어
          imageRef.current.selectable = false;
        }
      });

      canvas.on('mouse:up', () => {
        lastPinchDistRef.current = 0;
        if (imageRef.current) imageRef.current.selectable = true;
      });

      canvas.on('mouse:down', (opt) => {
        // 배경을 터치해도 명함 이미지가 항상 선택되도록 함
        if (imageRef.current) {
          canvas!.setActiveObject(imageRef.current);
        }
      });

    }, 100);

    return () => {
      clearTimeout(timer);
      if (canvas) canvas.dispose();
    };
  }, [image]);

  const handleZoom = (factor: number) => {
    if (!imageRef.current || !fabricRef.current) return;
    const img = imageRef.current;
    const newScale = img.scaleX! * factor;
    if (newScale > 0.05 && newScale < 15) {
      img.scale(newScale);
      fabricRef.current.renderAll();
    }
  };

  const handleRotate = () => {
    if (!imageRef.current || !fabricRef.current) return;
    const img = imageRef.current;
    img.rotate((img.angle! + 90) % 360);
    fabricRef.current.renderAll();
  };

  const handleDone = async () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const { width, height } = canvas;
    
    // 프레임 영역 재계산
    const padding = 30;
    let frameWidth = width! - padding * 2;
    let frameHeight = frameWidth / ASPECT_RATIO;
    if (frameHeight > height! - padding * 2) {
      frameHeight = height! - padding * 2;
      frameWidth = frameHeight * ASPECT_RATIO;
    }
    const frameLeft = (width! - frameWidth) / 2;
    const frameTop = (height! - frameHeight) / 2;

    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      left: frameLeft,
      top: frameTop,
      width: frameWidth,
      height: frameHeight,
      multiplier: 2,
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    onCrop(new File([blob], image.name, { type: 'image/jpeg' }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in">
      <div className="p-4 flex items-center justify-between text-white border-b border-white/10 shrink-0">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <span className="font-semibold text-sm">명함 영역 맞추기</span>
        <button onClick={handleDone} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full">
          <Check className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#1a1a1a]" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
            이미지 로딩 중...
          </div>
        )}
      </div>

      <div className="p-4 bg-black/80 backdrop-blur-md flex items-center justify-around shrink-0 border-t border-white/5">
        <button onClick={() => handleZoom(0.85)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={() => handleZoom(1.15)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={handleRotate} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-black p-4 pb-8 text-center shrink-0">
        <p className="text-white/40 text-[10px] select-none uppercase tracking-wider mb-2">Instructions</p>
        <p className="text-white/70 text-xs select-none">
          두 손가락으로 사진을 확대/축소하거나<br/>
          한 손가락으로 드래그하여 명함 위치를 맞춰주세요.
        </p>
      </div>
    </div>
  );
}
