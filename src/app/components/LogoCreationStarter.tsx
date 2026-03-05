import { ArrowLeft, ArrowRight, Sparkles, Check, Loader2, Save, CreditCard, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { FontPreview } from './FontPreview';
import { LogoSvgRenderer } from './LogoSvgRenderer';

interface LogoCreationStarterProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  customBusiness: string;
  setCustomBusiness: (value: string) => void;
  selectedColor: string;
  setSelectedColor: (value: string) => void;
  selectedStyle: string;
  handleStyleSelect: (styleId: string) => void;
  isGenerating: boolean;
  generatedLogos: any[];
  colors: any[];
  styles: any[];
  handleSaveLogo: (index: number) => void;
  handleSelectLogo: () => void;
  setPreviewIndex: (index: number) => void;
  setShowPreviewModal: (show: boolean) => void;
  setGeneratedLogos: (logos: any[]) => void;
  setPendingServiceType: (type: any) => void;
  selectedLogo: number;
  setSelectedLogo: (index: number) => void;
}

export function LogoCreationStarter({
  currentStep,
  setCurrentStep,
  customBusiness,
  setCustomBusiness,
  selectedColor,
  setSelectedColor,
  selectedStyle,
  handleStyleSelect,
  isGenerating,
  generatedLogos,
  colors,
  styles,
  handleSaveLogo,
  handleSelectLogo,
  setPreviewIndex,
  setShowPreviewModal,
  setGeneratedLogos,
  setPendingServiceType,
  selectedLogo,
  setSelectedLogo,
}: LogoCreationStarterProps) {
  
  const handleColorSelect = (id: string) => {
    setSelectedColor(id);
    // 컬러 선택 시 자동으로 다음 단계(Step 4)로 이동
    setTimeout(() => setCurrentStep(4), 300);
  };

  return (
    <>
      {/* Step 1-4: Container 안에 */}
      {currentStep >= 1 && currentStep <= 4 && (
        <div className="container mx-auto px-6 py-12 flex-1">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: 서비스 분야 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                  <h2 className="text-2xl font-bold mb-4">어떤 서비스인가요?</h2>
                  <p className="text-gray-600 mb-6">서비스의 성격을 자유롭게 입력해주세요</p>
                </div>

                <Card className="p-8 shadow-lg border-2 border-gray-200">
                  <Input
                    placeholder="예: IT 스타트업, 패션 브랜드, 카페"
                    value={customBusiness}
                    onChange={(e) => setCustomBusiness(e.target.value)}
                    className="text-lg h-16 border-2 mb-6"
                    autoFocus
                  />
                  
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!customBusiness.trim()}
                    className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    다음 단계로
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Card>
              </div>
            )}

            {/* Step 2: 네이밍 입력 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
                  <h2 className="text-2xl font-bold mb-4">브랜드 네이밍을 입력해주세요</h2>
                  <p className="text-gray-600">로고에 들어갈 이름을 입력하세요</p>
                </div>

                <Card className="p-8 shadow-lg border-2 border-emerald-200">
                  <Input
                    value={customBusiness}
                    onChange={(e) => setCustomBusiness(e.target.value)}
                    placeholder="예: MyBrands"
                    className="mb-6 h-16 text-lg border-2"
                    autoFocus
                  />
                  <Button
                    onClick={() => setCurrentStep(3)}
                    disabled={!customBusiness.trim()}
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    다음
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Card>
              </div>
            )}

            {/* Step 3: 색상 선택 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border p-8">
                  <h2 className="text-2xl font-bold mb-3">대표 컬러를 선택하세요</h2>
                  <p className="text-gray-600">브랜드를 상징할 색상을 골라주세요</p>
                </div>

                <Card className="p-8 shadow-lg border-2 border-emerald-200">
                  <div className="grid grid-cols-4 gap-4">
                    {colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleColorSelect(color.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedColor === color.id
                            ? 'border-emerald-600 shadow-lg scale-105 ring-2 ring-emerald-300'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="w-full h-20 rounded-lg mb-3" style={{ backgroundColor: color.hex }}></div>
                        <p className="font-semibold text-center mb-1">{color.label}</p>
                        <p className="text-xs text-gray-500 text-center">{color.desc}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Step 4: 스타일 선택 */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border p-8">
                  <h2 className="text-2xl font-bold mb-3">로고 스타일을 선택하세요</h2>
                  <p className="text-gray-600">선호하는 디자인 느낌을 1개 선택해주세요</p>
                </div>

                <Card className="p-8 shadow-lg border-2 border-emerald-200">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style.id)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                          selectedStyle === style.id
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 ring-offset-2 shadow-lg'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 5: AI 생성 중 (Full Screen) */}
      {currentStep === 5 && (
        <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center z-40">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-6 animate-spin text-emerald-600" />
            <h2 className="text-3xl font-bold mb-2">AI가 로고를 생성하고 있습니다</h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </div>
        </div>
      )}

      {/* Step 6: 결과 확인 (Full Screen) */}
      {currentStep === 6 && generatedLogos.length > 0 && (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50">
          {/* Progress Indicator */}
          <div className="bg-white border-b py-6">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-emerald-100 text-emerald-700">
                  <span className="font-bold">1</span>
                  <span>서비스 분야</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-emerald-100 text-emerald-700">
                  <span className="font-bold">2</span>
                  <span>네이밍</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-emerald-100 text-emerald-700">
                  <span className="font-bold">3</span>
                  <span>컬러</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-emerald-100 text-emerald-700">
                  <span className="font-bold">4</span>
                  <span>스타일</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-medium text-xs transition-all whitespace-nowrap bg-emerald-600 text-white shadow-lg">
                  <span className="font-bold">5</span>
                  <span>결과 확인</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-6 py-12 flex-1">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">로고가 완성되었습니다! 🎉</h2>
                <p className="text-gray-600">마음에 드는 디자인을 선택하세요</p>
              </div>

              {/* 디버깅: generatedLogos 전체 확인 */}
              {console.log('🔍 Step 6 - generatedLogos 전체:', generatedLogos)}

              {/* 3개의 로고 카드 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {generatedLogos.map((logo, index) => {
                  console.log(`🔍 Step 6 - 로고 ${index + 1}:`, {
                    index,
                    font: logo.font,
                    url: logo.url?.substring(0, 100),
                    urlLength: logo.url?.length
                  });

                  return (
                  <Card
                    key={index}
                    className="p-6 transition-all hover:shadow-lg border-2 border-emerald-100"
                  >
                    {/* 로고 이미지 - LogoSvgRenderer 사용 */}
                    <div 
                      className="cursor-zoom-in"
                      onClick={() => {
                        setPreviewIndex(index);
                        setShowPreviewModal(true);
                      }}
                    >
                      {logo.url ? (
                        <LogoSvgRenderer 
                          svgDataUrl={logo.url}
                          className="w-full h-full flex items-center justify-center"
                        />
                      ) : <div className="h-64 flex items-center justify-center text-gray-400">로고 로딩 중...</div>}
                    </div>

                    {/* 옵션 번호 및 폰트 이름 */}
                    <div className="mb-4 text-center">
                      <p className="text-lg font-bold">
                        옵션 {index + 1}
                      </p>
                      {typeof logo === 'object' && logo.font && (
                        <p className="text-sm text-gray-500 mt-1">
                          {logo.font}
                        </p>
                      )}
                    </div>

                    {/* 액션 버튼 */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log(`💾 저장 버튼 클릭 - 로고 ${index + 1}:`, {
                            index,
                            font: logo.font,
                            urlLength: logo.url?.length
                          });
                          handleSaveLogo(index);
                        }}
                        className="w-full h-11 font-medium border-2 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        마이 로고에 저장 후 확인
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedLogo(index);
                          handleSelectLogo();
                        }}
                        className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        명함 만들기
                      </Button>
                    </div>
                  </Card>
                  );
                })}
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(0);
                    setGeneratedLogos([]);
                    setPendingServiceType(null);
                  }}
                  className="px-8 h-12 border-2 border-emerald-300 hover:bg-emerald-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  처음으로
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
