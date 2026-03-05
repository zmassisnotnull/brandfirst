import { useState, useRef, useEffect } from 'react';
import { Upload, ArrowLeft, Sparkles, Loader2, CheckCircle, Palette, Shapes, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Footer } from './Footer';
import ColorThief from 'colorthief';
import { ContactWithCompany } from '../types/contact';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface LogoUploaderProps {
  onNavigate: (page: string) => void;
  onLogoAnalyzed: (logoUrl: string, data: any, recommendedLayouts: string[]) => void;
  initialLogoUrl?: string | null;
  initialLogoData?: any;
  selectedContact?: ContactWithCompany | null;
  onContactBookOpen?: () => void; // 주소록 열기 콜백 추가
}

export function LogoUploader({ onNavigate, onLogoAnalyzed, initialLogoUrl, initialLogoData, selectedContact, onContactBookOpen }: LogoUploaderProps) {
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(initialLogoUrl || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    address: '',
  });
  const [saveToContactBook, setSaveToContactBook] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('new');
  const [companies, setCompanies] = useState<any[]>([]);
  const [matchingCompany, setMatchingCompany] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The Starter에서 로고가 전달되면 자동으로 분석 시작
  useEffect(() => {
    if (initialLogoUrl && !analysisResult) {
      analyzeLogo(initialLogoUrl);
    }
  }, [initialLogoUrl]);

  // 주소록에서 연락처를 선택하면 폼 데이터 자동 채우기
  useEffect(() => {
    if (selectedContact) {
      setFormData({
        name: selectedContact.name,
        title: selectedContact.position,
        company: selectedContact.company.name,
        phone: selectedContact.mobile || '',
        email: selectedContact.email || '',
        address: selectedContact.address || '',
      });
      console.log('✅ 주소록 연락처 정보 자동 입력:', selectedContact);
    }
  }, [selectedContact]);

  // 주소록에 등록 체크 시 그룹 목록 불러오기
  useEffect(() => {
    if (saveToContactBook) {
      loadCompanies();
    }
  }, [saveToContactBook]);

  // 회사명 입력 시 실시간으로 기존 그룹과 매칭 체크
  useEffect(() => {
    const checkExistingCompany = async () => {
      if (!formData.company.trim() || selectedContact) return;

      try {
        const companiesRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies`,
          {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          }
        );
        const companiesData = await companiesRes.json();
        const allCompanies = Array.isArray(companiesData) ? companiesData : [];
        setCompanies(allCompanies);

        // 입력한 회사명과 정확히 일치하는 그룹 찾기
        const matching = allCompanies.find(
          (c: any) => c.name.toLowerCase() === formData.company.toLowerCase()
        );

        if (matching) {
          setMatchingCompany(matching);
          setSaveToContactBook(true); // 자동으로 체크박스 활성화
          setSelectedCompanyId(matching.id); // 해당 그룹 자동 선택
          console.log(`✅ 기존 그룹 발견: "${matching.name}" (ID: ${matching.id})`);
        } else {
          setMatchingCompany(null);
          if (saveToContactBook) {
            setSelectedCompanyId('new'); // 새 그룹 만들기로 리셋
          }
        }
      } catch (error) {
        console.error('Failed to check existing companies:', error);
      }
    };

    // 디바운스: 500ms 후 체크
    const timer = setTimeout(checkExistingCompany, 500);
    return () => clearTimeout(timer);
  }, [formData.company, selectedContact]);

  const loadCompanies = async () => {
    try {
      const companiesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const companiesData = await companiesRes.json();
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      
      // 회사명과 일치하는 그룹이 있으면 자동 선택
      const matchingCompany = companiesData.find((c: any) => c.name === formData.company);
      if (matchingCompany) {
        setSelectedCompanyId(matchingCompany.id);
        setMatchingCompany(matchingCompany);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (2MB 제한)
    if (file.size > 2 * 1024 * 1024) {
      alert('로고 파일 크기는 2MB 이하여야 합니다');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      setUploadedLogo(logoUrl);
      analyzeLogo(logoUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeLogo = async (logoUrl: string) => {
    setIsAnalyzing(true);

    try {
      // SVG인지 확인
      const isSVG = logoUrl.startsWith('data:image/svg+xml');
      
      if (isSVG) {
        console.log('🎨 SVG 로고 감지 → SVG 파서로 분석');
        
        try {
          // base64 디코딩
          const base64Data = logoUrl.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid SVG data URL');
          }
          
          const svgString = atob(base64Data);
          console.log('✅ SVG 디코딩 성공, 길이:', svgString.length);
          
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
          
          // 파싱 에러 체크
          const parserError = svgDoc.querySelector('parsererror');
          if (parserError) {
            console.error('❌ SVG 파싱 에러:', parserError.textContent);
            throw new Error('SVG parsing failed');
          }
          
          const svgElement = svgDoc.documentElement;
          console.log('✅ SVG 파싱 성공, tagName:', svgElement.tagName);
          
          // SVG에서 width/height 추출 (viewBox도 확인)
          let width = parseFloat(svgElement.getAttribute('width') || '0');
          let height = parseFloat(svgElement.getAttribute('height') || '0');
          
          // width/height가 없으면 viewBox에서 추출
          if (!width || !height) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
              const parts = viewBox.split(/\s+/);
              width = parseFloat(parts[2] || '100');
              height = parseFloat(parts[3] || '100');
              console.log('📐 viewBox에서 크기 추출:', { width, height });
            } else {
              // 기본값
              width = 100;
              height = 100;
              console.log('⚠️ width/height/viewBox 없음 → 기본값 사용');
            }
          }
          
          const aspectRatio = width / height;
          console.log('📏 크기:', { width, height, aspectRatio });
          
          // SVG에서 fill 색상 추출
          const fillElements = svgElement.querySelectorAll('[fill]');
          let brandColor = '#000000';
          
          console.log('🎨 fill 속성 개수:', fillElements.length);
          
          for (let i = 0; i < fillElements.length; i++) {
            const fill = fillElements[i].getAttribute('fill');
            console.log(`  - fill[${i}]:`, fill);
            
            if (fill && fill !== 'none' && !fill.includes('url(')) {
              if (fill.startsWith('#')) {
                brandColor = fill;
                console.log('✅ 색상 발견:', brandColor);
                break;
              } else if (fill.startsWith('rgb')) {
                // rgb(r, g, b) 형식 변환
                const matches = fill.match(/\d+/g);
                if (matches && matches.length >= 3) {
                  const r = parseInt(matches[0]).toString(16).padStart(2, '0');
                  const g = parseInt(matches[1]).toString(16).padStart(2, '0');
                  const b = parseInt(matches[2]).toString(16).padStart(2, '0');
                  brandColor = `#${r}${g}${b}`;
                  console.log('✅ RGB 색상 변환:', brandColor);
                  break;
                }
              }
            }
          }
          
          // text 요소의 fill도 확인
          if (brandColor === '#000000') {
            const textElements = svgElement.querySelectorAll('text[fill]');
            console.log('📝 text fill 속성 개수:', textElements.length);
            
            for (let i = 0; i < textElements.length; i++) {
              const fill = textElements[i].getAttribute('fill');
              if (fill && fill !== 'none' && fill.startsWith('#')) {
                brandColor = fill;
                console.log('✅ text에서 색상 발견:', brandColor);
                break;
              }
            }
          }
          
          console.log('🎨 최종 브랜드 컬러:', brandColor);
          
          // 로고 형태 분류
          let logoShape: 'horizontal' | 'vertical' | 'square';
          if (aspectRatio > 1.5) {
            logoShape = 'horizontal';
          } else if (aspectRatio < 0.7) {
            logoShape = 'vertical';
          } else {
            logoShape = 'square';
          }
          
          // 추천 레이아웃
          let recommendedLayouts: string[] = [];
          if (logoShape === 'horizontal') {
            recommendedLayouts = ['modern', 'classic', 'minimal'];
          } else if (logoShape === 'vertical') {
            recommendedLayouts = ['creative', 'minimal', 'classic'];
          } else {
            recommendedLayouts = ['classic', 'creative', 'modern'];
          }
          
          // 명암 분석
          const rgb = brandColor.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
          const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
          const isLightLogo = brightness > 128;
          
          const result = {
            width,
            height,
            aspectRatio: aspectRatio.toFixed(2),
            logoShape,
            brandColor,
            colorPalette: [brandColor], // SVG는 단색으로 처리
            recommendedLayouts,
            isLightLogo,
            brightness: Math.round(brightness),
          };
          
          console.log('🎨 SVG 로고 분석 완료:', result);
          setAnalysisResult(result);
          setIsAnalyzing(false);
          return;
        } catch (svgError) {
          console.error('❌ SVG 분석 중 에러:', svgError);
          // SVG 분석 실패 시 래스터 이미지 방식으로 재시도
          console.log('🔄 래스터 이미지 방식으로 재시도...');
        }
      }
      
      // PNG/JPG 등 래스터 이미지는 기존 방식으로 분석
      console.log('🎨 래스터 이미지 로고 감지 → ColorThief로 분석');
      
      // 1. 이미지 로드 및 크기 분석
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error('❌ 이미지 로드 실패:', e);
          reject(new Error('이미지 로드 실패'));
        };
        img.src = logoUrl;
      });

      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;

      console.log('✅ 이미지 로드 성공:', { width, height, aspectRatio });

      // 2. 로고 형태 분류
      let logoShape: 'horizontal' | 'vertical' | 'square';
      if (aspectRatio > 1.5) {
        logoShape = 'horizontal'; // 가로형
      } else if (aspectRatio < 0.7) {
        logoShape = 'vertical'; // 세로형
      } else {
        logoShape = 'square'; // 심볼형
      }

      // 3. Color Thief로 주색상 추출
      const colorThief = new ColorThief();
      const dominantColor = colorThief.getColor(img);
      const palette = colorThief.getPalette(img, 5);
      
      const brandColor = `#${dominantColor.map(c => c.toString(16).padStart(2, '0')).join('')}`;
      const colorPalette = palette.map(color => 
        `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`
      );

      // 4. 추천 레이아웃 결정
      let recommendedLayouts: string[] = [];
      if (logoShape === 'horizontal') {
        recommendedLayouts = ['modern', 'classic', 'minimal'];
      } else if (logoShape === 'vertical') {
        recommendedLayouts = ['creative', 'minimal', 'classic'];
      } else {
        recommendedLayouts = ['classic', 'creative', 'modern'];
      }

      // 5. 명암 분석 (밝은 로고 vs 어두운 로고)
      const brightness = (dominantColor[0] * 299 + dominantColor[1] * 587 + dominantColor[2] * 114) / 1000;
      const isLightLogo = brightness > 128;

      const result = {
        width,
        height,
        aspectRatio: aspectRatio.toFixed(2),
        logoShape,
        brandColor,
        colorPalette,
        recommendedLayouts,
        isLightLogo,
        brightness: Math.round(brightness),
      };

      console.log('🎨 로고 분석 완료:', result);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    } catch (err) {
      console.error('❌ 로고 분석 오류:', err);
      console.error('❌ 에러 상세:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      });
      setIsAnalyzing(false);
      alert('로고 분석 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.');
    }
  };

  const handleProceedToEditor = async () => {
    if (!uploadedLogo || !analysisResult) return;

    // 주소록에 등록 체크되어 있으면 저장
    if (saveToContactBook && !selectedContact) {
      try {
        let companyId: string;

        if (selectedCompanyId === 'new') {
          // 새 그룹 생성
          console.log('🔵 새 그룹 생성 중:', formData.company);
          const createCompanyRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                name: formData.company,
                address: formData.address,
                phone: formData.phone,
              }),
            }
          );

          if (!createCompanyRes.ok) {
            const errorText = await createCompanyRes.text();
            console.error('❌ 회사 생성 실패:', errorText);
            throw new Error(`회사 생성 실패: ${errorText}`);
          }

          const newCompany = await createCompanyRes.json();
          console.log('✅ 회사 생성 성공:', newCompany);
          companyId = newCompany.id;
        } else {
          // 기존 그룹 사용
          console.log('🔵 기존 그룹 사용:', selectedCompanyId);
          companyId = selectedCompanyId;
        }

        // 연락처 생성
        console.log('🔵 연락처 생성 중:', formData.name, 'in company:', companyId);
        const createContactRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              name: formData.name,
              position: formData.title,
              companyId: companyId,
              mobile: formData.phone,
              email: formData.email,
              address: formData.address,
            }),
          }
        );

        if (!createContactRes.ok) {
          const errorText = await createContactRes.text();
          console.error('❌ 연락처 생성 실패:', errorText);
          throw new Error(`연락처 생성 실패: ${errorText}`);
        }

        const newContact = await createContactRes.json();
        console.log('✅ 주소록에 연락처가 저장되었습니다:', newContact);
        
        // 성공 알림
        alert(`주소록에 "${formData.name}"님의 연락처가 저장되었습니다!`);
      } catch (error) {
        console.error('❌ 주소록 저장 실패:', error);
        alert(`주소록 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        // 저장 실패 시 사용자에게 물어보기
        if (!confirm('주소록 저장에 실패했습니다. 그래도 편집기로 진행하시겠습니까?')) {
          return; // 사용자가 취소하면 진행 중단
        }
      }
    }

    const data = {
      ...formData,
      brandColor: analysisResult.brandColor,
      logoShape: analysisResult.logoShape,
    };

    onLogoAnalyzed(uploadedLogo, data, analysisResult.recommendedLayouts);
    onNavigate('card');
  };

  const getShapeIcon = (shape: string) => {
    if (shape === 'horizontal') return '▬';
    if (shape === 'vertical') return '▮';
    return '◼';
  };

  const getShapeDescription = (shape: string) => {
    if (shape === 'horizontal') return '가로형 로고 - 넓은 레이아웃에 적합';
    if (shape === 'vertical') return '세로형 로고 - 측면 배치에 적합';
    return '심볼형 로고 - 다양한 레이아웃에 활용 가능';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
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
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className={`flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-all ${
              !uploadedLogo ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="mr-2">1</span>
              로고 업로드
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-all ${
              uploadedLogo && !analysisResult ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="mr-2">2</span>
              AI 분석
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold transition-all ${
              analysisResult ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600'
            }`}>
              <span className="mr-2">3</span>
              정보 입력
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Logo Upload */}
            <div>
              <Card className="p-8">
                <h2 className="text-xl font-bold mb-6">로고 업로드</h2>

                {!uploadedLogo ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">로고 파일 선택</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      PNG, JPG, SVG (최대 2MB)
                    </p>
                    <Button variant="outline">파일 선택</Button>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 rounded-lg p-8 mb-4 flex items-center justify-center min-h-[200px]">
                      <img
                        src={uploadedLogo}
                        alt="Uploaded logo"
                        className="max-w-full max-h-[200px]"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      다른 로고 선택
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />

                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      <div>
                        <p className="font-semibold text-purple-900">AI가 로고를 분석하고 있습니다...</p>
                        <p className="text-sm text-purple-700">색상, 형태, 비율 분석 중</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Result */}
                {analysisResult && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">분석 완료!</span>
                    </div>

                    {/* Logo Shape */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shapes className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-700">로고 형태</h4>
                      </div>
                      <p className="text-2xl mb-1">{getShapeIcon(analysisResult.logoShape)}</p>
                      <p className="text-sm text-gray-600">{getShapeDescription(analysisResult.logoShape)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        비율: {analysisResult.aspectRatio} ({analysisResult.width}×{analysisResult.height}px)
                      </p>
                    </div>

                    {/* Brand Color */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-semibold text-gray-700">브랜드 컬러</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: analysisResult.brandColor }}
                        />
                        <div>
                          <p className="font-mono text-sm font-semibold">{analysisResult.brandColor}</p>
                          <p className="text-xs text-gray-500">
                            {analysisResult.isLightLogo ? '밝은 톤' : '어두운 톤'} (밝기: {analysisResult.brightness})
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {analysisResult.colorPalette.map((color: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded border border-gray-200"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Recommended Layouts */}
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-purple-900 mb-2">추천 레이아웃</h4>
                      <div className="flex gap-2">
                        {analysisResult.recommendedLayouts.map((layout: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full"
                          >
                            {layout === 'classic' && '클래식'}
                            {layout === 'modern' && '모던'}
                            {layout === 'minimal' && '미니멀'}
                            {layout === 'creative' && '크리에이티브'}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-purple-700 mt-2">
                        이 레이아웃들이 로고 형태와 가장 잘 어울립니다
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Information Form */}
            <div>
              <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">명함 정보 입력</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContactBookOpen?.()}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    주소록에서 선택
                  </Button>
                </div>

                {selectedContact && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">주소록에서 '{selectedContact.name}'님의 정보를 불러왔습니다</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="홍길동"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">직함 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="UX Designer"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">회사명 *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="MyBrands.ai"
                      className="mt-1"
                    />
                    {matchingCompany && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-xs text-green-700">
                          ✅ 주소록에 "{matchingCompany.name}" 그룹이 이미 있습니다. 자동으로 해당 그룹에 추가됩니다.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">전화번호 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-1234-5678"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">이메일 *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="hello@mybrands.ai"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">주소 *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="서울특별시 강남구 테헤란로 123"
                      className="mt-1"
                    />
                  </div>

                  {/* Save to Contact Book Checkbox */}
                  {!selectedContact && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input
                          type="checkbox"
                          id="saveToContactBook"
                          checked={saveToContactBook}
                          onChange={(e) => setSaveToContactBook(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="saveToContactBook" className="text-sm font-medium text-blue-900 cursor-pointer">
                          주소록에 등록
                        </label>
                      </div>

                      {/* Group Selection Dropdown */}
                      {saveToContactBook && (
                        <div>
                          <Label htmlFor="groupSelect">저장할 그룹 선택</Label>
                          <select
                            id="groupSelect"
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="new">+ 새 그룹 만들기 ({formData.company})</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedCompanyId === 'new' 
                              ? `"${formData.company}" 그룹이 새로 생성됩니다`
                              : `기존 "${matchingCompany?.name}" 그룹에 추가됩니다`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">💡 자동 적용 기능</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>✓ 로고 주색상이 회사명에 자동 적용됩니다</li>
                    <li>✓ 로고 형태에 맞는 레이아웃이 추천됩니다</li>
                    <li>✓ 텍스트 색상이 로고 밝기에 맞춰 조정됩니다</li>
                  </ul>
                </div>

                {/* Proceed Button */}
                <Button
                  onClick={handleProceedToEditor}
                  disabled={!uploadedLogo || !analysisResult || !formData.name || !formData.title || !formData.company || !formData.phone || !formData.email}
                  className="w-full mt-6 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                  size="lg"
                >
                  편집기로 이동
                  <Sparkles className="w-5 h-5" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
