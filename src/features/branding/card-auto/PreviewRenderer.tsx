/**
 * 명함 시안 미리보기 렌더러 (SVG)
 */

import React from 'react';
import type { CardDraft } from './types';

interface PreviewRendererProps {
  draft: CardDraft;
  logoSvgPath?: string;
  qrDataUrl?: string;
  className?: string;
}

const MM_TO_PX = 96 / 25.4;

function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}

export function PreviewRenderer({
  draft,
  logoSvgPath,
  qrDataUrl,
  className = '',
}: PreviewRendererProps) {
  const { layout, theme } = draft;
  const { card_size_mm, elements } = layout;
  
  const pageW = card_size_mm.w + card_size_mm.bleed * 2;
  const pageH = card_size_mm.h + card_size_mm.bleed * 2;
  
  const trimX = card_size_mm.bleed;
  const trimY = card_size_mm.bleed;
  
  const safeX = card_size_mm.bleed + card_size_mm.safe;
  const safeY = card_size_mm.bleed + card_size_mm.safe;
  const safeW = card_size_mm.w - card_size_mm.safe * 2;
  const safeH = card_size_mm.h - card_size_mm.safe * 2;
  
  return (
    <svg
      viewBox={`0 0 ${mmToPx(pageW)} ${mmToPx(pageH)}`}
      className={className}
      style={{ backgroundColor: theme.colors.bg }}
    >
      {/* Bleed 영역 (연한 회색) */}
      <rect
        x={0}
        y={0}
        width={mmToPx(pageW)}
        height={mmToPx(pageH)}
        fill={theme.colors.bg}
        stroke="#E5E5E5"
        strokeWidth={1}
      />
      
      {/* Trim 영역 */}
      <rect
        x={mmToPx(trimX)}
        y={mmToPx(trimY)}
        width={mmToPx(card_size_mm.w)}
        height={mmToPx(card_size_mm.h)}
        fill="none"
        stroke="#CCCCCC"
        strokeWidth={2}
      />
      
      {/* Safe 영역 (점선) */}
      <rect
        x={mmToPx(safeX)}
        y={mmToPx(safeY)}
        width={mmToPx(safeW)}
        height={mmToPx(safeH)}
        fill="none"
        stroke="#FF9500"
        strokeWidth={1}
        strokeDasharray="4 2"
        opacity={0.3}
      />
      
      {/* Elements */}
      {elements.map((el) => {
        const x = mmToPx(el.x_mm);
        const y = mmToPx(el.y_mm);
        const w = mmToPx(el.w_mm);
        const h = mmToPx(el.h_mm);
        
        if (el.kind === 'logo' && logoSvgPath) {
          return (
            <g key={el.id}>
              <rect x={x} y={y} width={w} height={h} fill="none" stroke="#E5E5E5" strokeWidth={0.5} />
              <svg x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid meet">
                <path d={logoSvgPath} fill={el.style?.color ?? theme.colors.accent} />
              </svg>
            </g>
          );
        }
        
        if (el.kind === 'qr' && qrDataUrl) {
          return (
            <g key={el.id}>
              <rect x={x} y={y} width={w} height={h} fill="#FFFFFF" stroke="#E5E5E5" strokeWidth={0.5} />
              <image
                x={x}
                y={y}
                width={w}
                height={h}
                href={qrDataUrl}
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
          );
        }
        
        if (el.kind === 'text' && el.style?.lines) {
          const fontSize = el.style.sizePt ? el.style.sizePt * MM_TO_PX : 12;
          const lineHeight = fontSize * 1.25;
          const align = el.style.align ?? 'left';
          
          return (
            <g key={el.id}>
              {/* Debug rect */}
              <rect x={x} y={y} width={w} height={h} fill="none" stroke="#E5E5E5" strokeWidth={0.5} opacity={0.3} />
              
              {/* Text lines */}
              {el.style.lines.map((line, idx) => {
                let textX = x;
                let textAnchor: 'start' | 'middle' | 'end' = 'start';
                
                if (align === 'center') {
                  textX = x + w / 2;
                  textAnchor = 'middle';
                } else if (align === 'right') {
                  textX = x + w;
                  textAnchor = 'end';
                }
                
                const textY = y + (idx + 1) * lineHeight;
                
                return (
                  <text
                    key={idx}
                    x={textX}
                    y={textY}
                    fontSize={fontSize}
                    fill={el.style?.color ?? theme.colors.text}
                    textAnchor={textAnchor}
                    fontFamily={el.style?.font === 'logo' ? 'var(--font-logo)' : 'var(--font-body)'}
                  >
                    {line}
                  </text>
                );
              })}
            </g>
          );
        }
        
        // Fallback
        return (
          <rect
            key={el.id}
            x={x}
            y={y}
            width={w}
            height={h}
            fill="#F5F5F5"
            stroke="#E5E5E5"
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
