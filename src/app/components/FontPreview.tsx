import { useEffect, useRef, useState } from 'react';
import { useSingleFontLoading } from '../../lib/fonts/useFontLoading';

interface FontPreviewProps {
  font: string;
  text: string;
  weight: string;
  color: string;
  duotone?: boolean;
  secondaryColor?: string;
  letterSpacing?: string;
  fontFeatureSettings?: string;
  rotateDeg?: number;
}

export function FontPreview({
  font,
  text,
  weight,
  color,
  duotone,
  secondaryColor,
  letterSpacing = '0',
  fontFeatureSettings,
  rotateDeg,
}: FontPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(10);
  
  // ✅ 폰트 로딩 상태 관리 (핵심!)
  const { ready: fontReady, error: fontError } = useSingleFontLoading(font);
  
  // 듀오톤 텍스트 분리
  const midPoint = Math.floor(text.length / 2);
  const firstPart = text.slice(0, midPoint);
  const secondPart = text.slice(midPoint);

  useEffect(() => {
    const calculateOptimalFontSize = () => {
      if (!containerRef.current) return;
      if (!fontReady) return; // ✅ 폰트 준비 전에는 측정 금지

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      // 여백 비율 설정 (0.9 × 0.8)
      const targetWidth = containerWidth * 0.9;
      const targetHeight = containerHeight * 0.8;

      // Canvas를 사용한 정확한 텍스트 측정
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 이진 탐색으로 최적 폰트 크기 찾기
      let minSize = 10;
      let maxSize = 500; // 최대 한계치
      let bestSize = minSize;

      // 폰트 weight 설정
      const fontWeightValue = duotone ? '700' : weight;
      
      // 폰트명 처리 (공백 있으면 따옴표로 감싸기)
      const fontName = font.includes(' ') ? `"${font}"` : font;

      for (let i = 0; i < 20; i++) { // 20회 반복으로 정밀도 확보
        const midSize = Math.floor((minSize + maxSize) / 2);
        ctx.font = `${fontWeightValue} ${midSize}px ${fontName}, sans-serif`;

        // 텍스트 너비 측정 (자간 포함)
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        
        // 자간 추가 계산 (letter-spacing을 px로 변환)
        const spacingValue = parseFloat(letterSpacing) || 0;
        const adjustedWidth = textWidth + (text.length - 1) * midSize * spacingValue;
        
        // 텍스트 높이 (대략적)
        const textHeight = midSize * 1.2;

        if (adjustedWidth <= targetWidth && textHeight <= targetHeight) {
          bestSize = midSize;
          minSize = midSize + 1;
        } else {
          maxSize = midSize - 1;
        }
      }

      // 최소/최대 제한 적용 + 안전 계수 (95%)
      const finalSize = Math.floor(Math.max(12, Math.min(bestSize, 200)) * 0.95);
      
      setFontSize(finalSize);
    };

    // ✅ 폰트 준비 후에만 측정 (핵심 규칙!)
    if (fontReady) {
      // 폰트 로드 후 여러 번 측정 (안정성 확보)
      const timeouts = [0, 100, 300].map(delay =>
        setTimeout(calculateOptimalFontSize, delay)
      );

      window.addEventListener('resize', calculateOptimalFontSize);
      
      return () => {
        timeouts.forEach(clearTimeout);
        window.removeEventListener('resize', calculateOptimalFontSize);
      };
    }
  }, [font, text, weight, duotone, letterSpacing, fontReady]); // ✅ fontReady 의존성 추가

  return (
    <>
      {fontReady && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}&display=swap`}
          rel="stylesheet"
        />
      )}
      <div 
        ref={containerRef}
        className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center border-2 border-gray-100 relative"
        style={{ padding: '5%' }}
      >
        {/* 폰트 로딩 중 스켈레톤 */}
        {!fontReady && !fontError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        )}

        {/* 폰트 로딩 실패 */}
        {fontError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-red-500 text-center px-4">
              Font loading failed<br/>
              <span className="text-xs text-gray-500">{font}</span>
            </div>
          </div>
        )}

        {/* 실제 텍스트 (폰트 로드 후) */}
        <div
          className="text-center whitespace-nowrap flex items-center justify-center"
          style={{
            fontFamily: `${font}, sans-serif`,
            fontSize: `${fontSize}px`,
            fontWeight: duotone ? 700 : weight,
            color: duotone ? color : color,
            lineHeight: 1,
            letterSpacing: letterSpacing,
            fontFeatureSettings,
            transform: rotateDeg ? `rotate(${rotateDeg}deg)` : undefined,
            opacity: fontReady ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        >
          {duotone && secondaryColor ? (
            <>
              <span style={{ fontWeight: 700, color }}>{firstPart}</span>
              <span style={{ fontWeight: 400, color: secondaryColor }}>{secondPart}</span>
            </>
          ) : (
            text
          )}
        </div>
      </div>
    </>
  );
}
