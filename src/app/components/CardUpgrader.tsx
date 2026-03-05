import { useState, useRef } from 'react';
import { Upload, Camera, ArrowLeft, Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface CardUpgraderProps {
  onNavigate: (page: string) => void;
  onDataExtracted: (logoUrl: string | null, data: any) => void;
}

export function CardUpgrader({ onNavigate, onDataExtracted }: CardUpgraderProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedImage(imageUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('📤 Sending card analysis request...');
      console.log('Image data length:', uploadedImage.length);
      
      // OpenAI Vision API로 명함 분석
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/analyze-card`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            imageBase64: uploadedImage,
          }),
        }
      );

      console.log('📥 Response status:', response.status);

      // Check for quota exceeded error
      if (response.status === 429) {
        const errorData = await response.json();
        console.log('⚠️ Quota exceeded, enabling manual input mode');
        
        // Enable manual input mode
        setExtractedData({
          name: '',
          title: '',
          company: '',
          phone: '',
          email: '',
          logoUrl: null,
          manualMode: true,
        });
        setIsProcessing(false);
        setError('💡 AI 분석 서비스가 일시적으로 사용 제한에 도달했습니다.\n아래에서 명함 정보를 직접 입력해주세요.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error response:', errorData);
        
        // If fallback mode is suggested, enable manual input
        if (errorData.fallbackMode) {
          setExtractedData({
            name: '',
            title: '',
            company: '',
            phone: '',
            email: '',
            logoUrl: null,
            manualMode: true,
          });
          setError(errorData.suggestion || errorData.error || '수동으로 정보를 입력해주세요.');
          setIsProcessing(false);
          return;
        }
        
        throw new Error(errorData.error || '명함 분석에 실패했습니다');
      }

      const result = await response.json();
      
      console.log('✅ 명함 분석 완료:', result);
      
      setExtractedData(result);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('❌ 명함 분석 오류:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message || '명함 분석 중 오류가 발생했습니다');
      setIsProcessing(false);
    }
  };

  const handleProceedToEditor = () => {
    if (!extractedData) return;

    // 추출된 로고와 데이터를 CardMaker로 전달
    onDataExtracted(extractedData.logoUrl || null, extractedData);
    onNavigate('card');
  };

  const handleRetry = () => {
    setUploadedImage(null);
    setExtractedData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onNavigate('card-choice')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              처음으로
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              !uploadedImage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <span className="text-sm font-semibold">명함 촬영</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              uploadedImage && !extractedData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="text-sm font-semibold">AI 분석</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              extractedData ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="text-sm font-semibold">편집기 이동</span>
            </div>
          </div>

          {/* Upload Section */}
          {!uploadedImage && (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-3">명함을 촬영하거나 업로드하세요</h2>
                <p className="text-gray-600 mb-8">
                  AI가 자동으로 이름, 전화번호, 이메일, 로고를 추출합니다
                </p>

                <div className="space-y-4">
                  {/* File Upload Button */}
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-5 h-5" />
                    파일에서 선택
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {/* Camera Button (Mobile) */}
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="w-5 h-5" />
                    카메라로 촬영
                  </Button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Tips */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">📸 촬영 팁</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 명함이 화면에 꽉 차도록 촬영하세요</li>
                    <li>• 조명이 밝은 곳에서 촬영하세요</li>
                    <li>• 명함이 평평하게 놓여있는지 확인하세요</li>
                    <li>• 그림자나 반사가 없도록 주의하세요</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Preview & Analysis */}
          {uploadedImage && !extractedData && (
            <Card className="p-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-center">업로드된 명함</h2>
                
                {/* Image Preview */}
                <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={uploadedImage}
                    alt="Uploaded business card"
                    className="w-full h-auto"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-1">분석 오류</h4>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    다시 선택
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isProcessing}
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI 분석 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        AI 분석 시작
                      </>
                    )}
                  </Button>
                </div>

                {/* Processing Info */}
                {isProcessing && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="font-semibold text-blue-900">AI가 명함을 분석하고 있습니다...</span>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-1 ml-8">
                      <li>• 텍스트 정보 추출 중 (이름, 전화번호, 이메일)</li>
                      <li>• 로고 영역 감지 및 추출 중</li>
                      <li>• 레이아웃 구조 분석 중</li>
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Extracted Data Display */}
          {extractedData && (
            <Card className="p-8">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    extractedData.manualMode ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {extractedData.manualMode ? (
                      <Sparkles className="w-8 h-8 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {extractedData.manualMode ? '수동 입력 모드' : '분석 완료!'}
                  </h2>
                  <p className="text-gray-600">
                    {extractedData.manualMode 
                      ? '명함 정보를 직접 입력해주세요' 
                      : '추출된 정보를 확인하고 편집기로 이동하세요'}
                  </p>
                </div>

                {/* Warning for manual mode */}
                {extractedData.manualMode && error && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 whitespace-pre-line">{error}</p>
                  </div>
                )}

                {/* Extracted Info Grid - Editable in manual mode */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">이름</h4>
                    {extractedData.manualMode ? (
                      <input
                        type="text"
                        value={extractedData.name || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="홍길동"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{extractedData.name || '-'}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">직함</h4>
                    {extractedData.manualMode ? (
                      <input
                        type="text"
                        value={extractedData.title || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="대표이사"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{extractedData.title || '-'}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">회사명</h4>
                    {extractedData.manualMode ? (
                      <input
                        type="text"
                        value={extractedData.company || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MyBrands.ai"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{extractedData.company || '-'}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">전화번호</h4>
                    {extractedData.manualMode ? (
                      <input
                        type="tel"
                        value={extractedData.phone || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="010-1234-5678"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{extractedData.phone || '-'}</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">이메일</h4>
                    {extractedData.manualMode ? (
                      <input
                        type="email"
                        value={extractedData.email || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="hello@mybrands.ai"
                      />
                    ) : (
                      <p className="text-lg font-semibold">{extractedData.email || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Logo Preview */}
                {extractedData.logoUrl && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">추출된 로고</h4>
                    <div className="bg-white p-4 rounded border border-gray-200 inline-block">
                      <img
                        src={extractedData.logoUrl}
                        alt="Extracted logo"
                        className="max-w-[200px] max-h-[100px]"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="flex-1"
                  >
                    다시 촬영
                  </Button>
                  <Button
                    onClick={handleProceedToEditor}
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    편집기로 이동
                    <Sparkles className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}