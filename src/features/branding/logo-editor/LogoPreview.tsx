/**
 * 로고 미리보기 컴포넌트
 * - 브라우저에서 폰트로 빠르게 렌더링 (편집 중)
 * - 서버 렌더 결과 SVG Path 표시 (최종 확인)
 */

import React, { useMemo } from 'react';
import type { LogoEditorState, FontFace, LogoRenderResult } from './logoEditor.types';
import { buildFontFamily, trackingEmToCss } from './utils';

interface LogoPreviewProps {
  state: LogoEditorState;
  font: FontFace | null;
  mode: 'live' | 'rendered';
  renderResult?: LogoRenderResult;
  backgroundColor?: string;
  className?: string;
}

export function LogoPreview({
  state,
  font,
  mode,
  renderResult,
  backgroundColor = '#F5F5F5',
  className = '',
}: LogoPreviewProps) {
  
  // Live 모드: 브라우저 폰트 렌더링
  if (mode === 'live') {
    return (
      <LivePreview
        state={state}
        font={font}
        backgroundColor={backgroundColor}
        className={className}
      />
    );
  }
  
  // Rendered 모드: 서버에서 생성한 SVG Path
  if (mode === 'rendered' && renderResult) {
    return (
      <RenderedPreview
        result={renderResult}
        color={state.primaryColor}
        backgroundColor={backgroundColor}
        className={className}
      />
    );
  }
  
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ backgroundColor }}
    >
      <p className="text-sm text-muted-foreground">미리보기를 표시할 수 없습니다.</p>
    </div>
  );
}

function LivePreview({
  state,
  font,
  backgroundColor,
  className,
}: {
  state: LogoEditorState;
  font: FontFace | null;
  backgroundColor: string;
  className: string;
}) {
  
  const fontStyle = useMemo(() => {
    if (!font) return {};
    
    return {
      fontFamily: buildFontFamily(font),
      fontWeight: font.weight,
      fontStyle: font.style,
      fontSize: `${state.fontSizePx}px`,
      letterSpacing: trackingEmToCss(state.trackingEm, state.fontSizePx),
      color: state.primaryColor,
      transform: `rotate(${state.rotate_deg}deg)`,
    };
  }, [font, state]);
  
  const textFeatureSettings = useMemo(() => {
    const features: string[] = [];
    
    if (!state.kerning) {
      features.push('"kern" 0');
    }
    
    if (state.ligatures) {
      features.push('"liga" 1');
    } else {
      features.push('"liga" 0');
    }
    
    return features.length > 0 ? features.join(', ') : 'normal';
  }, [state.kerning, state.ligatures]);
  
  if (!font) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor }}
      >
        <p className="text-sm text-muted-foreground">폰트를 선택하세요.</p>
      </div>
    );
  }
  
  if (!state.text || state.text.trim().length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ backgroundColor }}
      >
        <p className="text-sm text-muted-foreground">텍스트를 입력하세요.</p>
      </div>
    );
  }
  
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor }}
    >
      <div
        className="whitespace-nowrap select-none"
        style={{
          ...fontStyle,
          fontFeatureSettings: textFeatureSettings,
          lineHeight: 1,
        }}
      >
        {state.text}
      </div>
    </div>
  );
}

function RenderedPreview({
  result,
  color,
  backgroundColor,
  className,
}: {
  result: LogoRenderResult;
  color: string;
  backgroundColor: string;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ backgroundColor }}
    >
      <svg
        viewBox={result.view_box}
        className="w-full h-full"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        <path d={result.svg_path_d} fill={color} />
      </svg>
    </div>
  );
}

// 로고 컬러 변형 미리보기 (Primary, Black, White)
export function LogoColorVariants({
  result,
  className = '',
}: {
  result: LogoRenderResult;
  className?: string;
}) {
  const variants = [
    { label: 'Primary', color: '#0066FF', bg: '#FFFFFF' },
    { label: 'Black', color: '#000000', bg: '#FFFFFF' },
    { label: 'White', color: '#FFFFFF', bg: '#000000' },
  ];
  
  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {variants.map((v) => (
        <div key={v.label} className="space-y-2">
          <div
            className="w-full aspect-[2/1] rounded-lg border flex items-center justify-center p-4"
            style={{ backgroundColor: v.bg }}
          >
            <svg
              viewBox={result.view_box}
              className="w-full h-full"
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            >
              <path d={result.svg_path_d} fill={v.color} />
            </svg>
          </div>
          <p className="text-xs text-center text-muted-foreground">{v.label}</p>
        </div>
      ))}
    </div>
  );
}
