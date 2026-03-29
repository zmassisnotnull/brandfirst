import React, { useEffect, useRef, useState } from 'react';
import { Canvas, FabricImage, Rect } from 'fabric';
import { Button } from '@/app/components/ui/button';
import { Check, X, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  image: File;
  onCrop: (croppedImage: File) => void;
  onCancel: () => void;
}

export function ImageCropper({ image, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const imageRef = useRef<FabricImage | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 명함 표준 비율: 1.8 : 1 (90mm x 50mm)
  const ASPECT_RATIO = 1.8;

  useEffect(() => {
    if (!canvasRef.current) return;

    let canvas: Canvas | null = null;

    // 약간의 지연을 주어 레이아웃이 확정된 후 크기를 가져옴
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

      // 가이드 프레임 (홀) 생성
      const padding = 30;
      let frameWidth = width - padding * 2;
      let frameHeight = frameWidth / ASPECT_RATIO;

      if (frameHeight > height - padding * 2) {
        frameHeight = height - padding * 2;
        frameWidth = frameHeight * ASPECT_RATIO;
      }

      const frameLeft = (width - frameWidth) / 2;
      const frameTop = (height - frameHeight) / 2;

      // 1. 반투명 배경
      const overlayColor = 'rgba(0, 0, 0, 0.6)';
      const topRect = new Rect({ left: 0, top: 0, width, height: frameTop, fill: overlayColor, selectable: false, evented: false });
      const bottomRect = new Rect({ left: 0, top: frameTop + frameHeight, width, height: height - (frameTop + frameHeight), fill: overlayColor, selectable: false, evented: false });
      const leftRect = new Rect({ left: 0, top: frameTop, width: frameLeft, height: frameHeight, fill: overlayColor, selectable: false, evented: false });
      const rightRect = new Rect({ left: frameLeft + frameWidth, top: frameTop, width: width - (frameLeft + frameWidth), height: frameHeight, fill: overlayColor, selectable: false, evented: false });

      // 2. 가이드 테두리 (중앙 정렬 확인용)
      const border = new Rect({
        left: frameLeft,
        top: frameTop,
        width: frameWidth,
        height: frameHeight,
        fill: 'transparent',
        stroke: '#3b82f6',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      // 이미지 로드
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        FabricImage.fromURL(url).then((img) => {
          if (!canvas) return;
          imageRef.current = img;
          
          const scaleX = frameWidth / img.width!;
          const scaleY = frameHeight / img.height!;
          const initialScale = Math.max(scaleX, scaleY) * 1.1; // 약간 더 크게
          
          img.set({
            left: width / 2,
            top: height / 2,
            originX: 'center',
            originY: 'center',
            scaleX: initialScale,
            scaleY: initialScale,
            hasControls: false,
          });

          canvas.add(img);
          canvas.add(topRect, bottomRect, leftRect, rightRect, border);
          canvas.setActiveObject(img);
          canvas.renderAll();
          setIsReady(true);
        });
      };
      reader.readAsDataURL(image);

      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas!.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas!.setZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
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
    img.scale(img.scaleX! * factor);
    fabricRef.current.renderAll();
  };

  const handleRotate = () => {
    if (!imageRef.current || !fabricRef.current) return;
    const img = imageRef.current;
    img.rotate((img.angle! + 90) % 360);
    fabricRef.current.renderAll();
  };

  const handleDone = async () => {
    if (!fabricRef.current || !imageRef.current) return;

    const canvas = fabricRef.current;
    const width = canvas.width!;
    const height = canvas.height!;
    
    // 다시 계산
    const padding = 30;
    let frameWidth = width - padding * 2;
    let frameHeight = frameWidth / ASPECT_RATIO;
    if (frameHeight > height - padding * 2) {
      frameHeight = height - padding * 2;
      frameWidth = frameHeight * ASPECT_RATIO;
    }
    const frameLeft = (width - frameWidth) / 2;
    const frameTop = (height - frameHeight) / 2;

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
    const croppedFile = new File([blob], image.name, { type: 'image/jpeg' });
    
    onCrop(croppedFile);
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
        <canvas ref={canvasRef} className="absolute left-0 top-0" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
            이미지 로딩 중...
          </div>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-md flex items-center justify-around shrink-0">
        <button onClick={() => handleZoom(0.9)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={() => handleZoom(1.1)} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={handleRotate} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-black p-4 pb-8 text-center shrink-0">
        <p className="text-white/60 text-xs">
          명함이 파란색 프레임 안에 쏙 들어가도록 맞춰주세요.<br/>
          두 손가락으로 확대/축소하거나 드래그하여 이동할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
