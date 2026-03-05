import { useEffect, useState } from 'react';

interface LogoSvgRendererProps {
  svgDataUrl: string;
  className?: string;
}

export function LogoSvgRenderer({ svgDataUrl, className = '' }: LogoSvgRendererProps) {
  const [svgHtml, setSvgHtml] = useState('');

  useEffect(() => {
    if (!svgDataUrl.startsWith('data:image/svg+xml;base64,')) {
      setSvgHtml('');
      return;
    }

    // SVG 디코딩
    const decodedSvg = atob(svgDataUrl.replace('data:image/svg+xml;base64,', ''));
    
    // SVG 크기 조정 스타일만 추가
    const styledSvg = decodedSvg.replace(
      /<svg /,
      '<svg style="max-width: 100%; max-height: 100%; width: auto; height: auto;" '
    );
    
    setSvgHtml(styledSvg);
  }, [svgDataUrl]);

  if (!svgHtml) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
