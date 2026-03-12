import { FontPreview } from './FontPreview';
import { LogoSvgRenderer } from './LogoSvgRenderer';

type LogoLike = {
  logoUrl?: string | { url?: string };
  brandName?: string;
  font?: string;
  fontFamily?: string;
  fontColor?: string;
  color?: string;
  weight?: string;
  spacing?: string;
  transform?: string;
  isDuotone?: boolean;
  secondaryColor?: string;
};

interface LogoPreviewProps {
  logo: LogoLike;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  rawText?: string;
  fontFeatureSettings?: string;
  rotateDeg?: number;
  backgroundColor?: string;
  renderResult?: {
    svgPathD: string;
    viewBox: string;
    color?: string;
  };
}

const transformText = (text: string, transform?: string): string => {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'titlecase') {
    if (/[A-Z]/.test(text)) {
      const words = text.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
      return words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    }
    const mid = Math.ceil(text.length / 2);
    return (
      text.substring(0, mid).charAt(0).toUpperCase() +
      text.substring(0, mid).slice(1).toLowerCase() +
      text.substring(mid).charAt(0).toUpperCase() +
      text.substring(mid).slice(1).toLowerCase()
    );
  }
  if (transform === 'sentencecase') {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  return text;
};

const resolveLogoUrl = (logoUrl?: string | { url?: string }): string => {
  if (typeof logoUrl === 'string') return logoUrl;
  if (logoUrl && typeof logoUrl.url === 'string') return logoUrl.url;
  return '';
};

export function LogoPreview({
  logo,
  className = '',
  imageClassName = 'w-full h-full object-contain',
  fallbackClassName = 'text-gray-400 text-sm',
  rawText,
  fontFeatureSettings,
  rotateDeg,
  backgroundColor,
  renderResult,
}: LogoPreviewProps) {
  if (renderResult) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ backgroundColor }}>
        <svg
          viewBox={renderResult.viewBox}
          className="w-full h-full"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          <title>Logo preview</title>
          <path d={renderResult.svgPathD} fill={renderResult.color || '#111111'} />
        </svg>
      </div>
    );
  }

  const logoUrl = resolveLogoUrl(logo.logoUrl);
  const previewText = rawText ?? logo.brandName;
  const hasFontPreview = Boolean(previewText && (logo.fontFamily || logo.font));
  const isSvgDataUrl = logoUrl.startsWith('data:image/svg+xml;base64,');

  if (hasFontPreview && previewText) {
    return (
      <div className={className} style={{ backgroundColor }}>
        <FontPreview
          font={logo.fontFamily || logo.font || 'Inter'}
          text={rawText || transformText(previewText, logo.transform)}
          weight={logo.weight || '700'}
          color={logo.fontColor || logo.color || '#2563EB'}
          duotone={logo.isDuotone || false}
          secondaryColor={logo.secondaryColor}
          letterSpacing={logo.spacing || '0'}
          fontFeatureSettings={fontFeatureSettings}
          rotateDeg={rotateDeg}
        />
      </div>
    );
  }

  if (isSvgDataUrl) {
    return <LogoSvgRenderer svgDataUrl={logoUrl} className={className} />;
  }

  if (logoUrl) {
    return (
      <div className={className}>
        <img src={logoUrl} alt="Logo" className={imageClassName} />
      </div>
    );
  }

  return <div className={fallbackClassName}>로고를 불러올 수 없습니다</div>;
}
