import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';
import { FontPreview } from './FontPreview';
import { useState } from 'react';

interface StyleShowcasePageProps {
  onNavigate: (page: string) => void;
}

export function StyleShowcasePage({ onNavigate }: StyleShowcasePageProps) {
  const brandName = "BrandFirst";

  // 전체 폰트 그룹 (백엔드와 동일 - 각 스타일당 3개 그룹, 서로 대비되는 스타일)
  const fontGroups: Record<string, string[][]> = {
    '미니멀한': [
      ['Poppins', 'Raleway', 'Space Mono'],              // Sans Rounded + Sans Thin + Mono
      ['Inter', 'Questrial', 'IBM Plex Mono'],           // Sans Modern + Sans Minimal + Mono Tech
      ['Work Sans', 'Lexend', 'Roboto Mono']             // Sans Versatile + Sans Simple + Mono Clean
    ],
    '고급스러운': [
      ['Playfair Display', 'Bodoni Moda', 'Cinzel'],     // Serif Display + Serif Fashion + Serif Roman
      ['Cormorant Garamond', 'Libre Baskerville', 'Lora'], // Serif Classic + Serif Traditional + Serif Elegant
      ['EB Garamond', 'Crimson Text', 'Spectral']        // Serif Old Style + Serif Text + Serif Modern
    ],
    '화려한': [
      ['Shrikhand', 'Righteous', 'Pacifico'],            // Display Decorative + Display Retro + Script Surf
      ['Rye', 'Bungee Shade', 'Lobster'],                // Display Western Decorative + Display Shadow Effect + Script Casual
      ['Fredericka the Great', 'Bangers', 'Monoton']     // Display Ornate Victorian + Display Comic + Display Line Pattern
    ],
    '친근한': [
      ['Quicksand', 'Nunito', 'Indie Flower'],           // Sans Rounded + Sans Friendly + Handwriting
      ['Comfortaa', 'Fascinate', 'Fredoka'],             // Sans Soft + Display Decorative + Sans Playful  
      ['Modak', 'Baloo 2', 'Caveat']                     // Display Rounded Playful + Sans Bubbly + Handwriting Loose
    ],
    '창의적인': [
      ['Permanent Marker', 'Pacifico', 'Amatic SC'],     // Marker Bold + Script Surf + Handwriting Simple
      ['Lobster', 'Dancing Script', 'Caveat'],           // Script Retro + Script Flowing + Handwriting
      ['Satisfy', 'Kalam', 'Architects Daughter']        // Script Elegant + Handwriting Natural + Handwriting Architect
    ],
    '모던한': [
      ['Outfit', 'Orbitron', 'Rajdhani'],                // Sans Geometric + Display Sci-fi + Sans Tech
      ['Space Grotesk', 'Audiowide', 'Exo 2'],           // Sans Space + Display Digital + Sans Futuristic
      ['Saira', 'Electrolize', 'Chakra Petch']           // Sans Modern + Display Tech + Sans Angular
    ],
  };

  // 각 스타일별 랜덤 그룹 선택 (3개 그룹 중 1개)
  const getRandomGroup = (styleName: string): string[] => {
    const groups = fontGroups[styleName] || fontGroups['미니멀한'];
    const randomIndex = Math.floor(Math.random() * 3);
    return groups[randomIndex];
  };

  // 각 스타일별 폰트와 색상 정의
  const styleShowcase = [
    {
      name: '미니멀한',
      desc: 'Minimal',
      color: '#10B981',
      fonts: getRandomGroup('미니멀한'),
    },
    {
      name: '고급스러운',
      desc: 'Luxury',
      color: '#1F2937',
      fonts: getRandomGroup('고급스러운'),
    },
    {
      name: '화려한',
      desc: 'Vibrant',
      color: '#F97316',
      fonts: getRandomGroup('화려한'),
    },
    {
      name: '친근한',
      desc: 'Friendly',
      color: '#EC4899',
      fonts: getRandomGroup('친근한'),
    },
    {
      name: '창의적인',
      desc: 'Creative',
      color: '#A855F7',
      fonts: getRandomGroup('창의적인'),
    },
    {
      name: '모던한',
      desc: 'Modern',
      color: '#14B8A6',
      fonts: getRandomGroup('모던한'),
    },
  ];

  // variations를 동적으로 생성
  const createVariations = (fonts: string[]) => {
    return [
      { font: fonts[0], weight: '700', text: brandName.toUpperCase(), size: 32, spacing: '0.05em' },
      { font: fonts[1], weight: '400', text: 'BrandFirst', size: 28, spacing: '0.08em', duotone: true },
      { font: fonts[2], weight: '900', text: 'Brandfirst', size: 36, spacing: '-0.02em' },
    ];
  };

  // 색상 변환 함수들
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return { r: r * 255, g: g * 255, b: b * 255 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  // 듀오톤 색상 생성
  const getSecondaryColor = (primaryHex: string): string => {
    const rgb = hexToRgb(primaryHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const analogousHsl = { ...hsl, h: (hsl.h + 30) % 360 };
    const analogousRgb = hslToRgb(analogousHsl.h, analogousHsl.s, analogousHsl.l);
    return rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onNavigate('home')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              스타일 쇼케이스
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              <span className="logo-brand">Brand</span>
              <span className="logo-first">First</span>
              <span className="ml-2 text-gray-600">로고 스타일</span>
            </h2>
            <p className="text-gray-600 text-lg">
              6가지 스타일 × 3개 그룹 = 총 18개 폰트 그룹을 확인하세요
            </p>
          </div>

          <div className="space-y-16">
            {styleShowcase.map((style) => {
              const secondaryColor = getSecondaryColor(style.color);
              const groups = fontGroups[style.name] || fontGroups['미니멀한'];
              
              return (
                <div key={style.name}>
                  {/* Style Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                      <div
                        className="w-12 h-12 rounded-full"
                        style={{ backgroundColor: style.color }}
                      />
                      <div>
                        <h3 className="text-2xl font-bold">{style.name}</h3>
                        <p className="text-gray-500">{style.desc} - 3개 폰트 그룹</p>
                      </div>
                    </div>
                  </div>

                  {/* 3개 그룹 모두 표시 */}
                  <div className="space-y-8">
                    {groups.map((groupFonts, groupIdx) => {
                      const variations = createVariations(groupFonts);
                      
                      return (
                        <div key={groupIdx}>
                          {/* 그룹 헤더 */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-600 bg-gray-100 inline-block px-3 py-1 rounded-full">
                              그룹 {groupIdx + 1}: {groupFonts.join(' / ')}
                            </h4>
                          </div>

                          {/* Variations Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {variations.map((variation, idx) => {
                              const midPoint = Math.floor(variation.text.length / 2);
                              const firstPart = variation.text.slice(0, midPoint);
                              const secondPart = variation.text.slice(midPoint);

                              return (
                                <Card
                                  key={idx}
                                  className="p-8 bg-white hover:shadow-xl transition-shadow"
                                >
                                  <div className="mb-6 text-center">
                                    <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-700 mb-2">
                                      Variation {idx + 1}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {variation.font} {variation.weight === '700' ? 'Bold' : variation.weight === '400' ? 'Regular' : 'Black'}
                                    </div>
                                  </div>

                                  {/* Logo Preview */}
                                  <div className="mb-4">
                                    <FontPreview
                                      font={variation.font}
                                      text={variation.text}
                                      weight={variation.weight}
                                      color={idx === 2 ? '#0463a5' : style.color}
                                      duotone={variation.duotone}
                                      secondaryColor={secondaryColor}
                                      letterSpacing={variation.spacing}
                                    />
                                  </div>

                                  {/* Details */}
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">텍스트:</span>
                                      <span className="font-medium">{variation.text}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">크기:</span>
                                      <span className="font-medium">{variation.size}px</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">자간:</span>
                                      <span className="font-medium">{variation.spacing}</span>
                                    </div>
                                    {variation.duotone && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-500">스타일:</span>
                                        <span className="font-medium">듀오톤</span>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}