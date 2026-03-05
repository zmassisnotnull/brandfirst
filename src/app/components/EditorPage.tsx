import { useState } from 'react';
import { ArrowLeft, Save, Type, Palette, Sparkles, Download, QrCode } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Footer } from './Footer';

interface EditorPageProps {
  onNavigate: (page: string) => void;
}

export function EditorPage({ onNavigate }: EditorPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    name: '김철수',
    title: 'Software Engineer',
    phone: '010-1234-5678',
    email: 'hello@mybrands.ai',
  });

  const designs = [
    { id: 0, name: '블루톤', color: 'from-blue-600 to-blue-400', icon: '💼' },
    { id: 1, name: '미니멀', color: 'from-gray-800 to-gray-600', icon: '⚡' },
    { id: 2, name: '럭셔리', color: 'from-purple-600 to-pink-600', icon: '💎' },
    { id: 3, name: '그라데이션', color: 'from-orange-500 to-red-500', icon: '🔥' },
  ];

  const fonts = [
    { name: 'Pretendard', value: 'font-sans' },
    { name: 'Noto Sans KR', value: 'font-serif' },
    { name: 'Gothic', value: 'font-mono' },
  ];

  const currentDesign = designs[selectedDesign];

  const handleLogoGenerated = (logoUrl: string) => {
    setGeneratedLogo(logoUrl);
    console.log('Logo generated:', logoUrl);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('home')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              뒤로가기
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                1.로고확정
              </span>
              <span className="text-gray-300">{'>'}</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                2.상세편집
              </span>
              <span className="text-gray-300">{'>'}</span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                3.인쇄/저장
              </span>
            </div>
          </div>
          <Button className="gap-2" onClick={() => onNavigate('box')}>
            <Save className="w-4 h-4" />
            저장하기
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Tools */}
          <Card className="p-6 h-fit lg:col-span-1">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="text" className="text-xs">
                  <Type className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs">
                  <Palette className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="logo" className="text-xs">
                  <Sparkles className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <h3 className="font-semibold mb-4">텍스트 수정</h3>
                <div className="space-y-3">
                  <div>
                    <Label>이름</Label>
                    <Input
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>직함</Label>
                    <Input
                      value={cardData.title}
                      onChange={(e) => setCardData({ ...cardData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>전화번호</Label>
                    <Input
                      value={cardData.phone}
                      onChange={(e) => setCardData({ ...cardData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>이메일</Label>
                    <Input
                      value={cardData.email}
                      onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4">
                <h3 className="font-semibold mb-4">폰트 변경</h3>
                <div className="space-y-2">
                  {fonts.map((font) => (
                    <button
                      key={font.value}
                      className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className={font.value}>{font.name}</span>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="logo" className="space-y-4">
                <h3 className="font-semibold mb-4">AI 로고 생성</h3>
                <div className="space-y-3">
                  {generatedLogo && (
                    <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                      <p className="text-sm font-medium text-blue-900 mb-2">현재 로고</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-white flex items-center justify-center">
                        <img src={generatedLogo} alt="Generated Logo" className="w-full h-full object-contain p-4" />
                      </div>
                    </div>
                  )}
                  <Button 
                    className="w-full gap-2"
                    onClick={() => handleLogoGenerated('https://via.placeholder.com/150')}
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatedLogo ? '새 로고 생성' : '로고 생성하기'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    AI가 4가지 옵션으로 로고를 자동 생성합니��
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Center - Business Card Canvas */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-8 bg-white">
              <div className="max-w-2xl mx-auto">
                {/* Business Card Preview */}
                <div
                  className={`w-full aspect-[1.8/1] bg-gradient-to-br ${currentDesign.color} rounded-2xl shadow-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden`}
                >
                  {/* Logo/Icon */}
                  <div className="absolute top-6 right-6">
                    {generatedLogo ? (
                      <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center p-2">
                        <img src={generatedLogo} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                        {currentDesign.icon}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-1 mt-auto">
                    <h2 className="text-3xl font-bold">{cardData.name}</h2>
                    <p className="text-lg opacity-90">{cardData.title}</p>
                  </div>

                  <div className="flex items-end justify-between mt-6">
                    <div className="space-y-1 text-sm opacity-90">
                      <p>{cardData.phone}</p>
                      <p>{cardData.email}</p>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-800" />
                    </div>
                  </div>
                </div>

                {/* Design Selector */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedDesign((prev) => (prev > 0 ? prev - 1 : designs.length - 1))
                    }
                  >
                    {'<'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedDesign + 1} / {designs.length} 시안 선택
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedDesign((prev) => (prev < designs.length - 1 ? prev + 1 : 0))
                    }
                  >
                    {'>'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Style Recommendations */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">스타일 추천</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {designs.map((design) => (
                  <button
                    key={design.id}
                    onClick={() => setSelectedDesign(design.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDesign === design.id
                        ? 'border-blue-600 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-full h-20 bg-gradient-to-br ${design.color} rounded-lg mb-2 flex items-center justify-center text-2xl`}
                    >
                      {design.icon}
                    </div>
                    <p className="text-sm font-medium text-center">{design.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                다운로드
              </Button>
              <Button className="gap-2" onClick={() => onNavigate('box')}>
                다음 단계
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}