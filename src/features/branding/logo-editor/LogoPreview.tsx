/**
 * 로고 미리보기 컴포넌트
 * - 브라우저에서 폰트로 빠르게 렌더링 (편집 중)
 * - 서버 렌더 결과 SVG Path 표시 (최종 확인)
 */

import React from 'react';
import type { LogoEditorState, FontFace, LogoRenderResult } from './logoEditor.types';
import { buildFontFamily } from './utils';
import { LogoPreview as SharedLogoPreview } from '../../../app/components/LogoPreview';

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
  if (mode === 'live') {
    const textFeatureSettings = [
      !state.kerning ? '"kern" 0' : '',
      state.ligatures ? '"liga" 1' : '"liga" 0',
    ]
      .filter(Boolean)
      .join(', ');

    if (!font) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ backgroundColor }}>
          <p className="text-sm text-muted-foreground">폰트를 선택하세요.</p>
        </div>
      );
    }

    if (!state.text || state.text.trim().length === 0) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ backgroundColor }}>
          <p className="text-sm text-muted-foreground">텍스트를 입력하세요.</p>
        </div>
      );
    }

    return (
      <SharedLogoPreview
        logo={{
          brandName: state.text,
          fontFamily: buildFontFamily(font),
          weight: String(font.weight || 700),
          fontColor: state.primaryColor,
          spacing: String(state.trackingEm),
        }}
        rawText={state.text}
        fontFeatureSettings={textFeatureSettings || 'normal'}
        rotateDeg={state.rotate_deg}
        backgroundColor={backgroundColor}
        className={`w-full h-full ${className}`}
      />
    );
  }

  if (mode === 'rendered' && renderResult) {
    return (
      <SharedLogoPreview
        logo={{}}
        renderResult={{
          svgPathD: renderResult.svg_path_d,
          viewBox: renderResult.view_box,
          color: state.primaryColor,
        }}
        backgroundColor={backgroundColor}
        className={`w-full h-full ${className}`}
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
              <title>{`Logo ${v.label}`}</title>
              <path d={result.svg_path_d} fill={v.color} />
            </svg>
          </div>
          <p className="text-xs text-center text-muted-foreground">{v.label}</p>
        </div>
      ))}
    </div>
  );
}
