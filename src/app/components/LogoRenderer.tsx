interface LogoRendererProps {
  logo: { url: string; font: string };
  brandName: string;
  index: number;
  primaryColor: string;
  onClick?: () => void;
}

export function LogoRenderer({ logo, brandName, index, primaryColor, onClick }: LogoRendererProps) {
  // 폰트 정보 파싱
  const [fontFamily, fontWeight] = logo.font.split(' ');
  
  // variation별 텍스트 스타일
  let displayText = '';
  let isDuotone = false;
  let letterSpacing = '0.05em';
  let weight = 700;
  let textColor = primaryColor;
  
  if (index === 0) {
    displayText = brandName.toUpperCase();
    letterSpacing = '0.05em';
    weight = 700;
    textColor = primaryColor;
  } else if (index === 1) {
    const mid = Math.ceil(brandName.length / 2);
    const firstPart = brandName.substring(0, mid);
    const secondPart = brandName.substring(mid);
    displayText = firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase() +
                 secondPart.charAt(0).toUpperCase() + secondPart.slice(1).toLowerCase();
    isDuotone = true;
    letterSpacing = '0.08em';
  } else {
    displayText = brandName.charAt(0).toUpperCase() + brandName.slice(1).toLowerCase();
    letterSpacing = '-0.02em';
    weight = 900;
    textColor = '#0463a5';
  }
  
  // 듀오톤 색상 계산
  const getSecondaryColor = (primaryHex: string): string => {
    const r = parseInt(primaryHex.slice(1, 3), 16);
    const g = parseInt(primaryHex.slice(3, 5), 16);
    const b = parseInt(primaryHex.slice(5, 7), 16);
    
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }
    
    const newH = (h * 360 + 30) % 360;
    
    const hueToRgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hNorm = newH / 360;
    const rNew = Math.round(hueToRgb(p, q, hNorm + 1/3) * 255);
    const gNew = Math.round(hueToRgb(p, q, hNorm) * 255);
    const bNew = Math.round(hueToRgb(p, q, hNorm - 1/3) * 255);
    
    return `#${rNew.toString(16).padStart(2, '0')}${gNew.toString(16).padStart(2, '0')}${bNew.toString(16).padStart(2, '0')}`;
  };
  
  const secondaryColor = getSecondaryColor(primaryColor);
  const midPoint = Math.floor(displayText.length / 2);
  const firstPart = displayText.slice(0, midPoint);
  const secondPart = displayText.slice(midPoint);
  
  // SVG viewBox 크기 (텍스트 길이에 따라 조정)
  const viewBoxWidth = displayText.length * 70;
  
  return (
    <>
      <link
        href={`https://fonts.googleapis.com/css2?family=${fontFamily?.replace(/ /g, '+')}:wght@400;700;900&display=swap`}
        rel="stylesheet"
      />
      
      <button
        onClick={onClick}
        className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center mb-4 border-2 border-gray-100 hover:border-green-400 transition-all cursor-zoom-in p-4"
      >
        <svg 
          viewBox={`0 0 ${viewBoxWidth} 200`} 
          className="w-full h-full"
          style={{ maxWidth: '90%', maxHeight: '90%' }}
        >
          <defs>
            <style>
              {`@import url('https://fonts.googleapis.com/css2?family=${fontFamily?.replace(/ /g, '+')}:wght@400;700;900&display=swap');`}
            </style>
          </defs>
          
          {isDuotone ? (
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              fontFamily={`${fontFamily}, sans-serif`}
              fontSize="120"
              letterSpacing={letterSpacing}
            >
              <tspan fill={primaryColor} fontWeight="700">{firstPart}</tspan>
              <tspan fill={secondaryColor} fontWeight="400">{secondPart}</tspan>
            </text>
          ) : (
            <text
              x="50%"
              y="50%"
              dominantBaseline="central"
              textAnchor="middle"
              fontFamily={`${fontFamily}, sans-serif`}
              fontSize="120"
              fontWeight={weight}
              fill={textColor}
              letterSpacing={letterSpacing}
            >
              {displayText}
            </text>
          )}
        </svg>
      </button>
    </>
  );
}
