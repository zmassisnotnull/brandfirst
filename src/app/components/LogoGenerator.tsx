import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';

interface LogoGeneratorProps {
  onLogoGenerated?: (logoUrl: string, logoData: LogoData) => void;
}

export interface LogoData {
  industry: string;
  mood: string;
  color: string;
  style: string;
}

export function LogoGenerator({ onLogoGenerated }: LogoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoData, setLogoData] = useState<LogoData>({
    industry: 'IT 스타트업',
    mood: '미니멀한',
    color: '딥 블루',
    style: '심볼형',
  });

  const industries = [
    'IT 스타트업',
    '카페',
    '꽃집',
    '법률 사무소',
    '프리랜서 개발자',
    '디자인 에이전시',
    '헬스케어',
    '교육/강의',
    '부동산',
    '뷰티/미용',
    '요식업',
    '패션/의류',
    '컨설팅',
    '금융/재테크',
    '마케팅',
  ];

  const moods = [
    '미니멀한',
    '화려한',
    '신뢰감 있는',
    '귀여운',
    '미래지향적인',
    '고급스러운',
    '친근한',
    '전문적인',
    '창의적인',
    '모던한',
    '클래식한',
    '활기찬',
  ];

  const colors = [
    { name: '딥 블루', value: '#1E40AF', hex: 'bg-blue-800' },
    { name: '파스텔 핑크', value: '#FDB6D8', hex: 'bg-pink-300' },
    { name: '블랙 & 골드', value: '#000000', hex: 'bg-black' },
    { name: '자연 초록', value: '#059669', hex: 'bg-emerald-600' },
    { name: '퍼플', value: '#7C3AED', hex: 'bg-violet-600' },
    { name: '오렌지', value: '#EA580C', hex: 'bg-orange-600' },
    { name: '티파니 블루', value: '#06B6D4', hex: 'bg-cyan-500' },
    { name: '와인 레드', value: '#BE123C', hex: 'bg-rose-700' },
    { name: '네이비', value: '#1E3A8A', hex: 'bg-blue-900' },
    { name: '민트', value: '#10B981', hex: 'bg-green-500' },
  ];

  const styles = [
    {
      id: '심볼형',
      name: '심볼형',
      description: '아이콘/심볼만 사용',
      example: '🔷',
    },
    {
      id: '워드마크형',
      name: '워드마크형',
      description: '글자 위주 디자인',
      example: 'AB',
    },
    {
      id: '엠블럼형',
      name: '엠블럼형',
      description: '도장/뱃지 형태',
      example: '🛡️',
    },
    {
      id: '콤비네이션',
      name: '콤비네이션',
      description: '심볼 + 텍스트 조합',
      example: '🔷 Brand',
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      // Build prompt from selections
      const prompt = `${logoData.style} logo for ${logoData.industry}, ${logoData.mood} mood, ${logoData.color} color palette`;
      
      // TODO: Call API to generate logo
      console.log('Generating logo with prompt:', prompt);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock logo URL for now
      const mockLogoUrl = 'https://placehold.co/400x400/000000/FFFFFF/png?text=Logo';
      
      if (onLogoGenerated) {
        onLogoGenerated(mockLogoUrl, logoData);
      }
    } catch (error) {
      console.error('Logo generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Industry Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          1. 비즈니스 유형 선택
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {industries.map((industry) => (
            <button
              key={industry}
              onClick={() => setLogoData({ ...logoData, industry })}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                logoData.industry === industry
                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      {/* Mood Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          2. 브랜드 무드/분위기
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setLogoData({ ...logoData, mood })}
              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                logoData.mood === mood
                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          3. 핵심 컬러
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => setLogoData({ ...logoData, color: color.name })}
              className={`p-3 rounded-lg border-2 transition-all ${
                logoData.color === color.name
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-12 ${color.hex} rounded mb-2`}></div>
              <p className="text-xs font-medium text-center">{color.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Style Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          4. 로고 스타일
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setLogoData({ ...logoData, style: style.id })}
              className={`p-4 rounded-lg border-2 transition-all ${
                logoData.style === style.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-3xl mb-2 text-center">{style.example}</div>
              <p className="text-sm font-medium text-center mb-1">{style.name}</p>
              <p className="text-xs text-gray-500 text-center">{style.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Preview of Selection */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h4 className="font-semibold text-sm mb-2 text-gray-700">선택한 옵션</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">비즈니스:</span>{' '}
            <span className="font-medium text-gray-800">{logoData.industry}</span>
          </div>
          <div>
            <span className="text-gray-600">무드:</span>{' '}
            <span className="font-medium text-gray-800">{logoData.mood}</span>
          </div>
          <div>
            <span className="text-gray-600">컬러:</span>{' '}
            <span className="font-medium text-gray-800">{logoData.color}</span>
          </div>
          <div>
            <span className="text-gray-600">스타일:</span>{' '}
            <span className="font-medium text-gray-800">{logoData.style}</span>
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            로고 생성 중...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            AI 로고 생성하기
          </>
        )}
      </Button>
    </div>
  );
}
