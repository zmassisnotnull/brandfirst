import { useState } from 'react';
import { X, Sparkles, Loader2, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { projectId } from '../../../utils/supabase/info';

interface LogoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogoSelect: (logoUrl: string, logoData?: LogoData) => void;
}

export interface LogoData {
  industry: string;
  mood: string;
  color: string;
  style: string;
}

export function LogoGeneratorModal({ isOpen, onClose, onLogoSelect }: LogoGeneratorModalProps) {
  const [mode, setMode] = useState<'ai' | 'upload'>('ai');
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([]);
  const [selectedLogo, setSelectedLogo] = useState(0);
  
  // AI Generation selections
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  const businessTypes = [
    { id: 'tech', label: '테크/IT', icon: '💻', desc: '소프트웨어, 스타트업' },
    { id: 'creative', label: '크리에이티브', icon: '🎨', desc: '디자인, 예술' },
    { id: 'food', label: '음식/카페', icon: '☕', desc: '레스토랑, 카페' },
    { id: 'health', label: '헬스/웰니스', icon: '🧘', desc: '요가, 피트니스' },
    { id: 'business', label: '비즈니스', icon: '💼', desc: '컨설팅, 금융' },
    { id: 'education', label: '교육', icon: '📚', desc: '강사, 튜터' },
    { id: 'retail', label: '리테일', icon: '🛍️', desc: '쇼핑, 판매' },
    { id: 'service', label: '서비스', icon: '🔧', desc: '수리, 관리' },
  ];

  const moods = [
    { id: 'professional', label: '프로페셔널', icon: '👔', desc: '신뢰감 있는' },
    { id: 'modern', label: '모던', icon: '✨', desc: '세련된' },
    { id: 'friendly', label: '친근한', icon: '😊', desc: '따뜻한' },
    { id: 'bold', label: '대담한', icon: '⚡', desc: '강렬한' },
    { id: 'minimal', label: '미니멀', icon: '⚪', desc: '심플한' },
    { id: 'luxury', label: '럭셔리', icon: '💎', desc: '고급스러운' },
  ];

  const colors = [
    { id: 'blue', label: '블루', hex: '#3B82F6', desc: '신뢰, 안정' },
    { id: 'purple', label: '퍼플', hex: '#A855F7', desc: '창의, 혁신' },
    { id: 'green', label: '그린', hex: '#10B981', desc: '자연, 성장' },
    { id: 'orange', label: '오렌지', hex: '#F97316', desc: '열정, 에너지' },
    { id: 'pink', label: '핑크', hex: '#EC4899', desc: '부드러움' },
    { id: 'black', label: '블랙', hex: '#1F2937', desc: '고급, 모던' },
    { id: 'red', label: '레드', hex: '#EF4444', desc: '강렬함' },
    { id: 'teal', label: '틸', hex: '#14B8A6', desc: '균형, 차분' },
  ];

  const styles = [
    { id: 'geometric', label: '기하학', icon: '◆', desc: '도형 기반' },
    { id: 'text', label: '텍스트', icon: 'Aa', desc: '글자 중심' },
    { id: 'icon', label: '아이콘', icon: '🎯', desc: '심볼 중심' },
    { id: 'abstract', label: '추상', icon: '🌀', desc: '예술적' },
  ];

  const handleBusinessSelect = (id: string) => {
    setSelectedBusiness(id);
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleMoodSelect = (id: string) => {
    setSelectedMood(id);
    setTimeout(() => setCurrentStep(3), 300);
  };

  const handleColorSelect = (id: string) => {
    setSelectedColor(id);
    setTimeout(() => setCurrentStep(4), 300);
  };

  const handleStyleSelect = (id: string) => {
    setSelectedStyle(id);
    setTimeout(() => setCurrentStep(5), 300);
  };

  const handleGenerate = async () => {
    if (!selectedBusiness || !selectedMood || !selectedColor || !selectedStyle) {
      alert('모든 항목을 선택해주세요.');
      return;
    }

    setIsGenerating(true);
    setGeneratedLogos([]);

    try {
      const sessionStr = localStorage.getItem('mybrands_session');
      if (!sessionStr) {
        alert('로그인이 필요합니다.');
        setIsGenerating(false);
        return;
      }

      const session = JSON.parse(sessionStr);
      const business = businessTypes.find(b => b.id === selectedBusiness);
      const mood = moods.find(m => m.id === selectedMood);
      const color = colors.find(c => c.id === selectedColor);
      const style = styles.find(s => s.id === selectedStyle);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/logo/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            business: business?.label,
            mood: mood?.label,
            color: color?.label,
            style: style?.label,
            count: 4,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '로고 생성에 실패했습니다.');
      }

      const data = await response.json();
      setGeneratedLogos(data.logos || []);
      setCurrentStep(6);
    } catch (error) {
      console.error('Logo generation error:', error);
      alert(error instanceof Error ? error.message : '로고 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 파일 형식입니다. PNG, JPG, SVG, WebP만 가능합니다.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const base64Reader = new FileReader();
      base64Reader.onload = async (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];

        const sessionStr = localStorage.getItem('mybrands_session');
        if (!sessionStr) {
          alert('로그인이 필요합니다.');
          setIsUploading(false);
          return;
        }

        const session = JSON.parse(sessionStr);

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/upload/logo`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              imageData: base64Data,
              fileName: file.name,
              contentType: file.type,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '로고 업로드에 실패했습니다.');
        }

        setUploadedLogo(data.logoUrl);
        console.log('Logo uploaded successfully:', data.logoUrl);
      };
      base64Reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert(err.message || '로고 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUploadedLogoSelect = () => {
    if (uploadedLogo) {
      onLogoSelect(uploadedLogo);
      onClose();
      setMode('ai');
      setUploadedLogo(null);
      setUploadPreview(null);
    }
  };

  const handleSelectLogo = () => {
    const logoData: LogoData = {
      industry: businessTypes.find(b => b.id === selectedBusiness)?.label || '',
      mood: moods.find(m => m.id === selectedMood)?.label || '',
      color: colors.find(c => c.id === selectedColor)?.label || '',
      style: styles.find(s => s.id === selectedStyle)?.label || '',
    };
    onLogoSelect(generatedLogos[selectedLogo], logoData);
    onClose();
    setCurrentStep(1);
  };

  const handleRegenerate = () => {
    setCurrentStep(1);
    setGeneratedLogos([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative my-8">
        <button
          onClick={onClose}
          className="sticky top-4 right-4 float-right p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">로고 선택</h2>
            <p className="text-gray-600">AI로 생성하거나 직접 업로드하세요</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'ai' | 'upload')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI 생성
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="w-4 h-4" />
                직접 업로드
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai">
              {currentStep < 6 ? (
                <>
                  <div className="space-y-6">
                    {/* Business Type Selection */}
                    {currentStep === 1 && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm">1</span>
                          비즈니스 유형 선택
                        </Label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {businessTypes.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => handleBusinessSelect(type.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                selectedBusiness === type.id
                                  ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{type.icon}</span>
                                <span className="text-sm">{type.label}</span>
                              </div>
                              <p className="text-xs text-gray-500">{type.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mood Selection */}
                    {currentStep === 2 && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-sm">2</span>
                          브랜드 무드/분위기
                        </Label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {moods.map((mood) => (
                            <button
                              key={mood.id}
                              onClick={() => handleMoodSelect(mood.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-sm ${
                                selectedMood === mood.id
                                  ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{mood.icon}</span>
                                <span className="text-sm">{mood.label}</span>
                              </div>
                              <p className="text-xs text-gray-500">{mood.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Selection */}
                    {currentStep === 3 && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm">3</span>
                          대표 컬러
                        </Label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                          {colors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => handleColorSelect(color.id)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                selectedColor === color.id
                                  ? 'border-blue-600 shadow-md scale-105'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="w-full h-12 rounded mb-2" style={{ backgroundColor: color.hex }}></div>
                              <p className="text-xs font-medium text-center">{color.label}</p>
                              <p className="text-xs text-gray-500 text-center">{color.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Style Selection */}
                    {currentStep === 4 && (
                      <div>
                        <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-sm">4</span>
                          로고 스타일
                        </Label>
                        <div className="grid grid-cols-4 gap-3">
                          {styles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => handleStyleSelect(style.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedStyle === style.id
                                  ? 'border-orange-600 bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-3xl mb-2 text-center">{style.icon}</div>
                              <p className="text-sm font-medium text-center mb-1">{style.label}</p>
                              <p className="text-xs text-gray-500 text-center">{style.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {currentStep === 5 && (
                      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <h4 className="font-semibold text-sm mb-3 text-gray-700">✅ 선택 완료</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">비즈니스:</span>
                            <span className="font-medium text-gray-800 px-2 py-1 bg-white rounded">{businessTypes.find(b => b.id === selectedBusiness)?.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">무드:</span>
                            <span className="font-medium text-gray-800 px-2 py-1 bg-white rounded">{moods.find(m => m.id === selectedMood)?.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">컬러:</span>
                            <span className="font-medium text-gray-800 px-2 py-1 bg-white rounded">{colors.find(c => c.id === selectedColor)?.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">스타일:</span>
                            <span className="font-medium text-gray-800 px-2 py-1 bg-white rounded">{styles.find(s => s.id === selectedStyle)?.label}</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Generate Button */}
                    {currentStep === 5 && (
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            AI가 로고를 생성하고 있습니다... (최대 2분 소요)
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            AI 로고 생성하기 (무료)
                          </>
                        )}
                      </Button>
                    )}
                    
                    <p className="text-xs text-gray-500 text-center">
                      Hugging Face AI가 4가지 로고 시안을 무료로 생성합니다 (첫 실행 시 모델 로딩에 20초 소요)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-6">
                    {/* Generated Logos Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {generatedLogos.map((logo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedLogo(index)}
                          className={`p-6 rounded-xl border-4 transition-all bg-white ${
                            selectedLogo === index
                              ? 'border-blue-600 shadow-lg scale-105'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img src={logo} alt={`Logo ${index + 1}`} className="w-full h-full object-contain" />
                          </div>
                          <p className="text-sm font-medium mt-3 text-center">
                            {selectedLogo === index ? '✓ 선택됨' : `옵션 ${index + 1}`}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleRegenerate}
                        className="flex-1"
                      >
                        다시 생성하기
                      </Button>
                      <Button
                        onClick={handleSelectLogo}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        이 로고 선택하기
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="upload">
              <div className="space-y-6">
                {/* Upload Area */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
                >
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-4">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                          <p className="text-lg font-medium text-gray-700">업로드 중...</p>
                        </>
                      ) : uploadPreview ? (
                        <>
                          <div className="w-48 h-48 rounded-lg overflow-hidden bg-white border-2 border-gray-200 flex items-center justify-center">
                            <img src={uploadPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                          </div>
                          <p className="text-lg font-medium text-green-600">✓ 업로드 완료</p>
                          <p className="text-sm text-gray-500">다른 파일을 선택하려면 클릭하세요</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-16 h-16 text-gray-400" />
                          <div>
                            <p className="text-lg font-medium text-gray-700 mb-1">
                              로고 이미지를 드래그하거나 클릭하여 업로드
                            </p>
                            <p className="text-sm text-gray-500">
                              PNG, JPG, SVG, WebP (최대 5MB)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Upload Tips */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h4 className="font-semibold text-sm mb-2 text-blue-900">📋 업로드 팁</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>배경이 투명한 PNG 파일을 권장합니다</li>
                    <li>정사각형 비율 (1:1)이 가장 적합합니다</li>
                    <li>최소 500x500px 이상의 고해상도 이미지를 사용하세요</li>
                    <li>로고에 텍스트가 있어도 괜찮습니다</li>
                  </ul>
                </Card>

                {/* Upload Button */}
                {uploadedLogo && (
                  <Button
                    onClick={handleUploadedLogoSelect}
                    className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    이 로고 사용하기
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}