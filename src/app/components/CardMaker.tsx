import { useState, useEffect, useRef } from 'react';
import { Canvas, IText, FabricImage, Rect } from 'fabric';
import { Upload, Type, Image as ImageIcon, Download, Save, ArrowLeft, Trash2, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Layout, Sparkles, Grid3x3, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Footer } from './Footer';
import ColorThief from 'colorthief';

interface CardMakerProps {
  onNavigate: (page: string) => void;
  logoUrl?: string | null;
  logoData?: any;
  recommendedLayouts?: string[];
  editingProfileId?: number | null;
  user?: any;
  onOpenAuthModal?: () => void;
}

export function CardMaker({ onNavigate, logoUrl, logoData, recommendedLayouts = [], editingProfileId = null, user, onOpenAuthModal }: CardMakerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [zoom, setZoom] = useState(1);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [currentLayout, setCurrentLayout] = useState('classic'); // 현재 선택된 레이아웃
  const [isInitialized, setIsInitialized] = useState(false);
  const [cardData, setCardData] = useState<any>(null); // AI 생성 데이터 또는 기본값

  // 명함 표준 크기: 90mm × 50mm
  // 고해상도 출력을 위해 300 DPI 기준으로 설정
  // 90mm = 3.54 inches → 1063px @ 300 DPI
  // 50mm = 1.97 inches → 591px @ 300 DPI
  const CARD_WIDTH = 1063;
  const CARD_HEIGHT = 591;
  const DISPLAY_WIDTH = 800; // 화면 표시용
  const DISPLAY_HEIGHT = Math.round((CARD_HEIGHT / CARD_WIDTH) * DISPLAY_WIDTH);

  // 룰 기반 레이아웃 템플릿 정의
  const LAYOUT_RULES = {
    HORIZONTAL: { // 가로형 로고 (2:1 이상)
      logo: { 
        left: DISPLAY_WIDTH / 2, 
        top: 70, 
        originX: 'center',
        originY: 'top',
        maxScale: 0.3, // 명함 너비의 30% 이내
      },
      text: { 
        left: 60, 
        top: 200, 
        textAlign: 'left',
        centerX: false,
      }
    },
    SQUARE: { // 정사각형/심볼 로고 (1:1)
      logo: { 
        left: 120, 
        top: DISPLAY_HEIGHT / 2,
        originX: 'center',
        originY: 'center', 
        maxScale: 0.25,
      },
      text: { 
        left: 280, 
        top: 120, 
        textAlign: 'left',
        centerX: false,
      }
    },
    VERTICAL: { // 세로형 로고
      logo: { 
        left: 80, 
        top: DISPLAY_HEIGHT / 2,
        originX: 'center',
        originY: 'center',
        maxScale: 0.2,
      },
      text: { 
        left: 200, 
        top: 120, 
        textAlign: 'left',
        centerX: false,
      }
    }
  };

  // 로고 비율 분석 및 최적 스케일 계산
  const calculateSmartLayout = (imageWidth: number, imageHeight: number) => {
    const aspectRatio = imageWidth / imageHeight;
    const SAFE_ZONE = 20; // 5mm @ 300 DPI ≈ 19px, 여유있게 20px
    const TARGET_AREA_RATIO = 0.17; // 명함 면적의 17%

    // 비율에 따른 레이아웃 선택
    let layoutRule;
    if (aspectRatio > 1.5) {
      layoutRule = LAYOUT_RULES.HORIZONTAL;
    } else if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
      layoutRule = LAYOUT_RULES.SQUARE;
    } else {
      layoutRule = LAYOUT_RULES.VERTICAL;
    }

    // 스마트 스케일링: 명함 면적의 15-20% 유지
    const cardArea = DISPLAY_WIDTH * DISPLAY_HEIGHT;
    const targetArea = cardArea * TARGET_AREA_RATIO;
    const scale = Math.sqrt(targetArea / (imageWidth * imageHeight));

    // 세이프존 고려한 최대 크기 제한
    const maxWidth = DISPLAY_WIDTH - (SAFE_ZONE * 2);
    const maxHeight = DISPLAY_HEIGHT - (SAFE_ZONE * 2);
    const maxScaleX = maxWidth / imageWidth;
    const maxScaleY = maxHeight / imageHeight;
    
    // 최종 스케일: 면적 기준 vs 세이프존 기준 중 작은 값
    const finalScale = Math.min(scale, maxScaleX, maxScaleY, layoutRule.logo.maxScale || 0.3);

    return {
      layoutRule,
      scale: finalScale,
      scaledWidth: imageWidth * finalScale,
      scaledHeight: imageHeight * finalScale,
      aspectRatio,
    };
  };

  // Color Thief로 로고 색상 추출
  const extractDominantColor = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const color = colorThief.getColor(img);
          const hexColor = `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`;
          console.log('Extracted dominant color:', hexColor);
          resolve(hexColor);
        } catch (err) {
          console.error('Color extraction failed:', err);
          resolve('#0066cc'); // 기본값
        }
      };
      img.onerror = () => resolve('#0066cc');
      img.src = imageUrl;
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Fabric.js 캔버스 초기화
    const canvas = new Canvas(canvasRef.current, {
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
      backgroundColor: bgColor,
    });

    fabricRef.current = canvas;

    // 캔버스 이벤트
    canvas.on('selection:created', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e: any) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  // 배경색 변경
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.backgroundColor = bgColor;
      fabricRef.current.renderAll();
    }
  }, [bgColor]);

  // 초기 레이아웃 자동 적용 (클래식 - 기본 레이아웃)
  useEffect(() => {
    if (fabricRef.current && !isInitialized) {
      console.log('🎨 기본 레이아웃(클래식) 자동 적용 중...');
      console.log('📦 전달받은 데이터:', {
        logoUrl,
        logoData,
        hasLogo: !!logoUrl,
        hasData: !!logoData,
        editingProfileId,
      });
      
      // 프로필 편집 모드면 저장된 디자인 불러오기 시도
      if (editingProfileId) {
        const storageKey = `cardDesign_profile_${editingProfileId}`;
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
          console.log('✅ 저장된 디자인 발견! 자동 불러오기...');
          fabricRef.current.loadFromJSON(JSON.parse(saved)).then(() => {
            fabricRef.current?.renderAll();
            setIsInitialized(true);
            console.log('✅ 저장된 디자인 불러오기 완료!');
          });
          return;
        }
      }
      
      // 저장된 디자인이 없으면 기본 레이아웃 적용
      setTimeout(() => {
        applyLayout('classic');
        setIsInitialized(true);
        console.log('✅ 클래식 레이아웃 적용 완료!');
      }, 100);
    }
  }, [fabricRef.current, isInitialized, logoUrl, logoData, editingProfileId]);

  // 텍스트 추가
  const addText = () => {
    if (!fabricRef.current) return;

    const text = new IText('텍스트를 입력하세요', {
      left: 100,
      top: 100,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 20,
      fill: '#000000',
    });

    fabricRef.current.add(text);
    fabricRef.current.setActiveObject(text);
    fabricRef.current.renderAll();
  };

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      FabricImage.fromURL(imgUrl).then((img) => {
        img.set({
          left: 100,
          top: 100,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        fabricRef.current?.add(img);
        fabricRef.current?.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  // 선택된 객체 삭제
  const deleteSelected = () => {
    if (!fabricRef.current || !selectedObject) return;
    fabricRef.current.remove(selectedObject);
    fabricRef.current.renderAll();
  };

  // 폰트 스타일 변경
  const toggleBold = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    const text = selectedObject as IText;
    text.set('fontWeight', text.fontWeight === 'bold' ? 'normal' : 'bold');
    fabricRef.current?.renderAll();
  };

  const toggleItalic = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    const text = selectedObject as IText;
    text.set('fontStyle', text.fontStyle === 'italic' ? 'normal' : 'italic');
    fabricRef.current?.renderAll();
  };

  // 텍스트 정렬
  const alignText = (alignment: string) => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    const text = selectedObject as IText;
    text.set('textAlign', alignment);
    fabricRef.current?.renderAll();
  };

  // 색상 변경
  const changeColor = (color: string) => {
    if (!selectedObject) return;
    selectedObject.set('fill', color);
    fabricRef.current?.renderAll();
  };

  // 폰트 크기 변경
  const changeFontSize = (size: number) => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    const text = selectedObject as IText;
    text.set('fontSize', size);
    fabricRef.current?.renderAll();
  };

  // 레이어 순서 변경
  const bringToFront = () => {
    if (!selectedObject || !fabricRef.current) return;
    fabricRef.current.bringObjectToFront(selectedObject);
    fabricRef.current.renderAll();
  };

  const sendToBack = () => {
    if (!selectedObject || !fabricRef.current) return;
    fabricRef.current.sendObjectToBack(selectedObject);
    fabricRef.current.renderAll();
  };

  // 다운로드 (고해상도)
  const downloadCard = () => {
    if (!fabricRef.current) return;

    // 실제 인쇄 크기로 스케일업하여 내보내기
    const scaleFactor = CARD_WIDTH / DISPLAY_WIDTH;
    const dataURL = fabricRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: scaleFactor, // 고해상도 출력
    });

    const link = document.createElement('a');
    link.download = 'business-card.png';
    link.href = dataURL;
    link.click();
  };

  // JSON 저장 (프로필별로 저장)
  const saveDesign = () => {
    // 로그인 체크
    if (!user) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        alert('로그인이 필요합니다.');
      }
      return;
    }

    if (!fabricRef.current) return;
    const json = fabricRef.current.toJSON();
    
    // 프로필 ID가 있으면 해당 프로필로 저장, 없으면 새로운 ID 생성
    let profileId = editingProfileId;
    
    if (!profileId) {
      // 새로운 명함이면 고유 ID 생성
      const existingCards = localStorage.getItem('savedCards');
      const cards = existingCards ? JSON.parse(existingCards) : [];
      profileId = cards.length > 0 ? Math.max(...cards.map((c: any) => c.id)) + 1 : 1;
    }
    
    const storageKey = `cardDesign_profile_${profileId}`;
    localStorage.setItem(storageKey, JSON.stringify(json));
    
    // 명함 메타데이터 저장
    const cardMeta = {
      id: profileId,
      name: logoData?.name || cardData?.name || '이름 없음',
      title: logoData?.title || cardData?.title || '직함 없음',
      company: logoData?.company || cardData?.company || '회사 없음',
      phone: logoData?.phone || cardData?.phone || '연락처 없음',
      email: logoData?.email || cardData?.email || '이메일 없음',
      logoUrl: logoUrl || null,
      brandColor: bgColor,
      createdAt: editingProfileId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // savedCards 배열 업데이트
    const existingCards = localStorage.getItem('savedCards');
    let cards = existingCards ? JSON.parse(existingCards) : [];
    
    const existingIndex = cards.findIndex((c: any) => c.id === profileId);
    if (existingIndex >= 0) {
      // 기존 명함 업데이트
      cards[existingIndex] = { ...cards[existingIndex], ...cardMeta };
    } else {
      // 새 명함 추가
      cards.push(cardMeta);
    }
    
    localStorage.setItem('savedCards', JSON.stringify(cards));
    
    console.log('✅ 명함 저장 완료:', { profileId, cardMeta });
    alert('명함이 저장되었습니다!');
  };

  // JSON 불러오기 (프로필별로 불러오기)
  const loadDesign = () => {
    const storageKey = editingProfileId ? `cardDesign_profile_${editingProfileId}` : 'cardDesign';
    const saved = localStorage.getItem(storageKey);
    
    if (!saved || !fabricRef.current) {
      alert('저장된 디자인이 없습니다.');
      return;
    }
    
    fabricRef.current.loadFromJSON(JSON.parse(saved)).then(() => {
      fabricRef.current?.renderAll();
      alert('디자인을 불러왔습니다!');
    });
  };

  // 레이아웃 템플릿 적용
  const applyLayout = (layoutId: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // 현재 캔버스 내용 삭제
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // 레이아웃별 요소 배치
    switch (layoutId) {
      case 'classic':
        applyClassicLayout(canvas);
        break;
      case 'modern':
        applyModernLayout(canvas);
        break;
      case 'minimal':
        applyMinimalLayout(canvas);
        break;
      case 'creative':
        applyCreativeLayout(canvas);
        break;
    }

    // 현재 레이아웃 업데이트
    setCurrentLayout(layoutId);
  };

  // 클래식 레이아웃: 왼쪽 정렬
  const applyClassicLayout = async (canvas: Canvas) => {
    const SAFE_MARGIN = 60;
    const RIGHT_OFFSET = 150; // 우측으로 이동
    const textStartX = SAFE_MARGIN + RIGHT_OFFSET; // 60 + 150 = 210px
    
    console.log('📏 클래식 레이아웃 영역:', {
      세이프마진: SAFE_MARGIN,
      우측이동: RIGHT_OFFSET,
      시작위치: textStartX,
      명함너비: DISPLAY_WIDTH,
    });
    
    // AI 생성 데이터 또는 기본값 사용
    const data = cardData || logoData || {
      name: '김철수',
      title: 'Software Engineer',
      company: 'MyBrands.ai',
      phone: '010-1234-5678',
      email: 'hello@mybrands.ai',
    };

    // 로고 색상 추출 및 적용
    let brandColor = '#0066cc';
    if (logoUrl) {
      brandColor = await extractDominantColor(logoUrl);
    }

    // 로고 배치 (좌측 정렬 + 우측 이동)
    if (logoUrl) {
      FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' }).then((img) => {
        const imgWidth = img.width || 100;
        const imgHeight = img.height || 100;
        
        // 로고 크기: 최대 140px 너비 또는 80px 높이
        let scale = 1;
        const maxLogoWidth = 140;
        const maxLogoHeight = 80;
        
        if (imgWidth > maxLogoWidth) {
          scale = maxLogoWidth / imgWidth;
        }
        if (imgHeight * scale > maxLogoHeight) {
          scale = maxLogoHeight / imgHeight;
        }

        const logoWidth = imgWidth * scale;

        img.set({
          left: textStartX,
          top: SAFE_MARGIN,
          scaleX: scale,
          scaleY: scale,
        });
        
        canvas.add(img);
        canvas.renderAll();
        
        console.log('🎯 로고 배치:', {
          좌표: `(${textStartX}, ${SAFE_MARGIN})`,
          크기: `${logoWidth.toFixed(0)}x${(imgHeight * scale).toFixed(0)}`,
        });
      });
    }

    // 텍스트 영역 시작 (로고 아래)
    const textStartY = SAFE_MARGIN + 100; // 로고 아래

    // 이름
    const nameText = new IText(data.name || '김철수', {
      left: textStartX,
      top: textStartY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 36,
      fontWeight: '700',
      fill: '#1a1a1a',
      lineHeight: 1.2,
    });

    // 직함
    const titleText = new IText(data.title || 'Software Engineer', {
      left: textStartX,
      top: textStartY + 44,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 16,
      fontWeight: '400',
      fill: '#64748b',
      lineHeight: 1.3,
    });

    // 회사명
    const companyText = new IText(data.company || 'MyBrands.ai', {
      left: textStartX,
      top: textStartY + 44 + 22,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 15,
      fontWeight: '600',
      fill: brandColor,
      lineHeight: 1.3,
    });

    // 구분선
    const divider = new Rect({
      left: textStartX,
      top: textStartY + 44 + 22 + 28,
      width: 50,
      height: 2,
      fill: '#cbd5e1',
    });

    // 연락처
    const contactY = textStartY + 44 + 22 + 40;

    const phoneText = new IText(`T  ${data.phone || '010-1234-5678'}`, {
      left: textStartX,
      top: contactY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 12,
      fontWeight: '400',
      fill: '#64748b',
      lineHeight: 1.5,
    });

    const emailText = new IText(`E  ${data.email || 'hello@mybrands.ai'}`, {
      left: textStartX,
      top: contactY + 18,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 12,
      fontWeight: '400',
      fill: '#64748b',
      lineHeight: 1.5,
    });

    canvas.add(nameText, titleText, companyText, divider, phoneText, emailText);
    
    // 경계 체크
    const bottomY = contactY + 18 + 20;
    const maxY = DISPLAY_HEIGHT - SAFE_MARGIN;
    
    console.log('✅ 클래식 레이아웃 완료:', {
      좌측정렬위치: textStartX,
      하단위치: bottomY,
      최대높이: maxY,
      세로여유: maxY - bottomY,
      상태: bottomY <= maxY ? '✅ 안전' : '⚠️ 초과',
    });
    
    canvas.renderAll();
  };

  // 모던 레이아웃: 중앙 정렬
  const applyModernLayout = async (canvas: Canvas) => {
    const centerX = DISPLAY_WIDTH / 2;
    const SAFE_MARGIN = 40;
    
    // AI 생성 데이터 또는 기본값 사용
    const data = cardData || logoData || {
      name: '김철수',
      title: 'Software Engineer',
      company: 'MyBrands.ai',
      phone: '010-1234-5678',
      email: 'hello@mybrands.ai',
    };

    // 로고 색상 추출
    let brandColor = '#0066cc';
    if (logoUrl) {
      brandColor = await extractDominantColor(logoUrl);
    }

    // 로고 (중앙 상단)
    if (logoUrl) {
      FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' }).then((img) => {
        // 스마트 스케일링 적용
        const smartLayout = calculateSmartLayout(img.width || 100, img.height || 100);
        
        // 세이프존 체크
        let finalScale = smartLayout.scale * 0.7; // 모던은 작게
        const logoHeight = (img.height || 100) * finalScale;
        if (logoHeight > 80) {
          finalScale = 80 / (img.height || 100);
        }
        
        img.set({
          left: centerX,
          top: SAFE_MARGIN + 20,
          scaleX: finalScale,
          scaleY: finalScale,
          originX: 'center',
        });
        canvas.add(img);
        canvas.renderAll();
      });
    }

    // 텍스트 시작 (로고 아래)
    const textStartY = 150;

    // 텍스트 (중앙 정렬)
    const nameText = new IText(data.name || '김철수', {
      left: centerX,
      top: textStartY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 38,
      fontWeight: '700',
      fill: '#000000',
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.2,
    });

    const titleText = new IText(data.title || 'Software Engineer', {
      left: centerX,
      top: textStartY + 46,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 17,
      fontWeight: '400',
      fill: '#64748b',
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.3,
    });

    const companyText = new IText(data.company || 'MyBrands.ai', {
      left: centerX,
      top: textStartY + 46 + 24,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 16,
      fontWeight: '600',
      fill: brandColor,
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.3,
    });

    const divider = new Rect({
      left: centerX - 80,
      top: textStartY + 46 + 24 + 35,
      width: 160,
      height: 1,
      fill: '#e2e8f0',
    });

    const phoneText = new IText(data.phone || '010-1234-5678', {
      left: centerX,
      top: textStartY + 46 + 24 + 50,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 13,
      fontWeight: '400',
      fill: '#475569',
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.6,
    });

    const emailText = new IText(data.email || 'hello@mybrands.ai', {
      left: centerX,
      top: textStartY + 46 + 24 + 50 + 20,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 13,
      fontWeight: '400',
      fill: '#475569',
      textAlign: 'center',
      originX: 'center',
      lineHeight: 1.6,
    });

    canvas.add(nameText, titleText, companyText, divider, phoneText, emailText);
    
    // 하단 경계 체크
    const bottomY = textStartY + 46 + 24 + 50 + 20 + 20;
    if (bottomY > DISPLAY_HEIGHT - SAFE_MARGIN) {
      console.warn('⚠️ 모던: 텍스트가 하단을 벗어남');
    }
    
    canvas.renderAll();
  };

  // 미니멀 레이아웃: 상단 로고, 하단 정보
  const applyMinimalLayout = async (canvas: Canvas) => {
    const SAFE_MARGIN = 50;
    
    // AI 생성 데이터 또는 기본값 사용
    const data = cardData || logoData || {
      name: '김철수',
      title: 'Software Engineer',
      company: 'MyBrands.ai',
      phone: '010-1234-5678',
      email: 'hello@mybrands.ai',
    };

    // 로고 색상 추출
    let brandColor = '#1e40af';
    if (logoUrl) {
      brandColor = await extractDominantColor(logoUrl);
    }
    
    canvas.backgroundColor = '#f8fafc';

    // 상단 컬러 바
    const colorBar = new Rect({
      left: 0,
      top: 0,
      width: DISPLAY_WIDTH,
      height: 140,
      fill: brandColor,
    });

    canvas.add(colorBar);

    // 로고 (상단 중앙)
    if (logoUrl) {
      FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' }).then((img) => {
        const smartLayout = calculateSmartLayout(img.width || 100, img.height || 100);
        
        img.set({
          left: SAFE_MARGIN,
          top: 35,
          scaleX: smartLayout.scale * 0.6, // 작게
          scaleY: smartLayout.scale * 0.6,
        });
        canvas.add(img);
        canvas.renderAll();
      });
    }

    // 텍스트 시작 위치
    const textStartY = 180;

    // 이름
    const nameText = new IText(data.name || '김철수', {
      left: SAFE_MARGIN,
      top: textStartY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 42,
      fontWeight: '700',
      fill: '#1e293b',
      lineHeight: 1.2,
    });

    // 직함
    const titleText = new IText(data.title || 'Software Engineer', {
      left: SAFE_MARGIN,
      top: textStartY + 52,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 19,
      fontWeight: '400',
      fill: '#64748b',
      lineHeight: 1.3,
    });

    // 회사명
    const companyText = new IText(data.company || 'MyBrands.ai', {
      left: SAFE_MARGIN,
      top: textStartY + 52 + 28,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 17,
      fontWeight: '600',
      fill: brandColor,
      lineHeight: 1.3,
    });

    // 연락처 박스
    const contactBox = new Rect({
      left: SAFE_MARGIN,
      top: textStartY + 52 + 28 + 50,
      width: 320,
      height: 70,
      fill: '#ffffff',
      stroke: '#e2e8f0',
      strokeWidth: 1,
      rx: 6,
      ry: 6,
    });

    // 전화번호
    const phoneText = new IText(`T  ${data.phone || '010-1234-5678'}`, {
      left: SAFE_MARGIN + 20,
      top: textStartY + 52 + 28 + 65,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 13,
      fontWeight: '400',
      fill: '#475569',
      lineHeight: 1.6,
    });

    // 이메일
    const emailText = new IText(`E  ${data.email || 'hello@mybrands.ai'}`, {
      left: SAFE_MARGIN + 20,
      top: textStartY + 52 + 28 + 87,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 13,
      fontWeight: '400',
      fill: '#475569',
      lineHeight: 1.6,
    });

    canvas.add(nameText, titleText, companyText, contactBox, phoneText, emailText);
    canvas.renderAll();
  };

  // 크리에이티브 레이아웃: 오른쪽 로고, 왼쪽 정보
  const applyCreativeLayout = async (canvas: Canvas) => {
    const SAFE_MARGIN = 50;
    const SIDEBAR_WIDTH = 260;
    
    // AI 생성 데이터 또는 기본값 사용
    const data = cardData || logoData || {
      name: '김철수',
      title: 'Software Engineer',
      company: 'MyBrands.ai',
      phone: '010-1234-5678',
      email: 'hello@mybrands.ai',
    };

    // 로고 색상 추출
    let brandColor = '#8b5cf6';
    if (logoUrl) {
      brandColor = await extractDominantColor(logoUrl);
    }
    
    canvas.backgroundColor = '#ffffff';

    // 오른쪽 컬러 블록
    const colorBlock = new Rect({
      left: DISPLAY_WIDTH - SIDEBAR_WIDTH,
      top: 0,
      width: SIDEBAR_WIDTH,
      height: DISPLAY_HEIGHT,
      fill: brandColor,
    });

    canvas.add(colorBlock);

    // 로고 (오른쪽 중앙)
    if (logoUrl) {
      FabricImage.fromURL(logoUrl, { crossOrigin: 'anonymous' }).then((img) => {
        const smartLayout = calculateSmartLayout(img.width || 100, img.height || 100);
        
        img.set({
          left: DISPLAY_WIDTH - (SIDEBAR_WIDTH / 2),
          top: DISPLAY_HEIGHT / 2,
          scaleX: smartLayout.scale * 0.7,
          scaleY: smartLayout.scale * 0.7,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(img);
        canvas.renderAll();
      });
    }

    // 텍스트 시작 위치
    const textStartY = 140;

    // 이름
    const nameText = new IText(data.name || '김철수', {
      left: SAFE_MARGIN,
      top: textStartY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 46,
      fontWeight: '700',
      fill: '#1f2937',
      lineHeight: 1.2,
    });

    // 직함 (줄바꿈 처리)
    const titleText = new IText(data.title || 'Software\nEngineer', {
      left: SAFE_MARGIN,
      top: textStartY + 58,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 21,
      fontWeight: '400',
      fill: '#6b7280',
      lineHeight: 1.4,
    });

    // 회사명
    const companyText = new IText(data.company || 'MyBrands.ai', {
      left: SAFE_MARGIN,
      top: textStartY + 58 + 70,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 19,
      fontWeight: '600',
      fill: brandColor,
      lineHeight: 1.3,
    });

    // 구분선
    const divider = new Rect({
      left: SAFE_MARGIN,
      top: textStartY + 58 + 70 + 40,
      width: 70,
      height: 3,
      fill: brandColor,
    });

    // 연락처 시작 위치
    const contactStartY = textStartY + 58 + 70 + 65;

    // 전화번호
    const phoneText = new IText(`T  ${data.phone || '010-1234-5678'}`, {
      left: SAFE_MARGIN,
      top: contactStartY,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 14,
      fontWeight: '400',
      fill: '#4b5563',
      lineHeight: 1.6,
    });

    // 이메일
    const emailText = new IText(`E  ${data.email || 'hello@mybrands.ai'}`, {
      left: SAFE_MARGIN,
      top: contactStartY + 24,
      fontFamily: 'Pretendard, sans-serif',
      fontSize: 14,
      fontWeight: '400',
      fill: '#4b5563',
      lineHeight: 1.6,
    });

    canvas.add(nameText, titleText, companyText, divider, phoneText, emailText);
    canvas.renderAll();
  };

  // 레이아웃 템플릿 목록
  const layoutTemplates = [
    {
      id: 'classic',
      name: '클래식',
      description: '단순하고 전통적인 레이아웃',
      icon: <Layout className="w-8 h-8" />,
      preview: '📄',
    },
    {
      id: 'modern',
      name: '모던',
      description: '중앙 정렬의 현대적 디자인',
      icon: <Sparkles className="w-8 h-8" />,
      preview: '✨',
    },
    {
      id: 'minimal',
      name: '미니멀',
      description: '깔끔한 상하 구조',
      icon: <Grid3x3 className="w-8 h-8" />,
      preview: '▭',
    },
    {
      id: 'creative',
      name: '크리에이티브',
      description: '비대칭 레이아웃',
      icon: <Layers className="w-8 h-8" />,
      preview: '🎨',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">명함 편집기</h1>
            {logoUrl && (
              <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                ✓ 고해상도 로고 적용됨
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDesign}>
              불러오기
            </Button>
            <Button variant="outline" onClick={saveDesign} className="gap-2">
              <Save className="w-4 h-4" />
              저장
            </Button>
            <Button onClick={downloadCard} className="gap-2">
              <Download className="w-4 h-4" />
              고해상도 다운로드
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Toolbar */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">도구</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={addText}
                >
                  <Type className="w-4 h-4" />
                  텍스트 추가
                </Button>
                <label className="w-full block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <span>
                      <ImageIcon className="w-4 h-4" />
                      이미지 추가
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => onNavigate('logo')}
                >
                  <Upload className="w-4 h-4" />
                  AI 로고 생성
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">배경</h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-2 block">배경색</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['#ffffff', '#f8fafc', '#fafafa', '#1e293b', '#1e40af', '#059669', '#f59e0b', '#8b5cf6'].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setBgColor(color)}
                          className={`w-10 h-10 rounded border-2 transition-all ${
                            bgColor === color ? 'border-blue-600 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {selectedObject && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">선택된 객체</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelected}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {selectedObject.type === 'i-text' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs mb-2 block">폰트 크기</Label>
                      <Input
                        type="number"
                        value={(selectedObject as IText).fontSize || 20}
                        onChange={(e) => changeFontSize(Number(e.target.value))}
                        min="8"
                        max="200"
                      />
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">스타일</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleBold}
                          className={
                            (selectedObject as IText).fontWeight === 'bold'
                              ? 'bg-blue-100'
                              : ''
                          }
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleItalic}
                          className={
                            (selectedObject as IText).fontStyle === 'italic'
                              ? 'bg-blue-100'
                              : ''
                          }
                        >
                          <Italic className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">정렬</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alignText('left')}
                        >
                          <AlignLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alignText('center')}
                        >
                          <AlignCenter className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alignText('right')}
                        >
                          <AlignRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">색상</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {['#000000', '#ffffff', '#1e40af', '#dc2626', '#059669', '#f59e0b', '#8b5cf6', '#ec4899'].map(
                          (color) => (
                            <button
                              key={color}
                              onClick={() => changeColor(color)}
                              className="w-10 h-10 rounded border-2 border-gray-300 hover:border-gray-400"
                              style={{ backgroundColor: color }}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <Label className="text-xs mb-2 block">레이어</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={bringToFront}
                    >
                      맨 앞으로
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={sendToBack}
                    >
                      맨 뒤로
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-3">
            <Card className="p-8 bg-white">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">명함 편집</h2>
                  <p className="text-sm text-gray-500">
                    90mm × 50mm (고해상도 {CARD_WIDTH}×{CARD_HEIGHT}px @ 300 DPI)
                  </p>
                </div>
              </div>

              {/* 레이아웃 선택 버튼 */}
              <div className="mb-6">
                <Label className="text-sm font-semibold mb-3 block">레이아웃 선택</Label>
                <div className="grid grid-cols-4 gap-3">
                  {layoutTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => applyLayout(template.id)}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg ${
                        currentLayout === template.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          currentLayout === template.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {template.id === 'classic' && <Layout className="w-6 h-6" />}
                          {template.id === 'modern' && <Sparkles className="w-6 h-6" />}
                          {template.id === 'minimal' && <Grid3x3 className="w-6 h-6" />}
                          {template.id === 'creative' && <Layers className="w-6 h-6" />}
                        </div>
                        <span className={`text-sm font-medium ${
                          currentLayout === template.id ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {template.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Canvas Container */}
              <div className="flex items-center justify-center bg-gray-100 p-8 rounded-lg">
                <div className="relative shadow-2xl" style={{ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT }}>
                  <canvas ref={canvasRef} />
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">💡 사용 팁</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 객체를 클릭하여 선택하고 드래그하여 이동할 수 있습니다</li>
                  <li>• 텍스트를 더블클릭하여 내용을 수정할 수 있습니다</li>
                  <li>• 모서리 핸들을 드래그하여 크기를 조절할 수 있습니다</li>
                  <li>• 고해상도 다운로드 시 {CARD_WIDTH}×{CARD_HEIGHT}px (300 DPI)로 출력됩니다</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => onNavigate('order')}
                >
                  인쇄 주문하기
                </Button>
                <Button onClick={() => onNavigate('digital')}>
                  디지털 명함 만들기
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}