// AI 기반 명함 자동 생성 엔진
// OpenAI API를 사용하여 직업 정보를 기반으로 명함 내용을 자동 생성

interface LogoAnalysis {
  width: number;
  height: number;
  ratio: number; // width / height
  type: 'horizontal' | 'square' | 'vertical'; // 가로형, 정사각형, 세로형
  dominantColor?: string;
  recommendedLayout: 'horizontal_top' | 'left_right' | 'vertical_left' | 'modern_center';
}

interface CardContent {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website?: string;
  layout: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

/**
 * OpenAI Vision API를 사용하여 명함 이미지 분석 및 텍스트 추출
 */
export async function analyzeBusinessCard(base64Image: string): Promise<Partial<CardContent>> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, returning mock data');
    return {
      name: '홍길동',
      title: '대표이사',
      company: '(주)브랜드퍼스트',
      phone: '010-1234-5678',
      email: 'ceo@brandfirst.ai'
    };
  }

  try {
    // base64에서 데이터 헤더(data:image/jpeg;base64,) 제거
    const imageUrl = base64Image.includes('base64,') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 명함 정보를 정확하게 추출하는 AI 전문가입니다. 특히 한국 명합의 "M"(Mobile/010), "T"(Tel/지역번호), "F"(Fax) 라벨을 정확히 인지하여 정보를 추출합니다. 항상 JSON 형식으로만 응답해주세요.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '이 명함 이미지에서 다음 정보를 추출해주세요: name, title, company, mobile, landline, email. **중요: "M" 또는 "Mobile" 옆의 010으로 시작하는 번호는 무조건 mobile 필드에, "T" 또는 "Tel" 옆의 지역번호(02, 031 등)로 시작하는 번호는 landline 필드에 넣어주세요. 만약 "M" 표시가 없더라도 010으로 시작하는 번호는 mobile로 간주하세요.** 한국어 정보가 있으면 한국어로 우선 추출해주세요. JSON으로만 답변하세요.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI Vision Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing business card:', error);
    throw error;
  }
}

/**
 * 로고 이미지 분석
 * - 비율 계산
 * - 추천 레이아웃 결정
 */
export function analyzeLogo(imageWidth: number, imageHeight: number): LogoAnalysis {
  const ratio = imageWidth / imageHeight;
  
  let type: 'horizontal' | 'square' | 'vertical';
  let recommendedLayout: LogoAnalysis['recommendedLayout'];
  
  if (ratio > 1.5) {
    // 가로형 로고 (2:1 이상)
    type = 'horizontal';
    recommendedLayout = 'horizontal_top'; // 상단 중앙 배치
  } else if (ratio > 0.7 && ratio <= 1.3) {
    // 정사각형/심볼형 (거의 1:1)
    type = 'square';
    recommendedLayout = 'left_right'; // 좌측 로고, 우측 텍스트
  } else {
    // 세로형 로고
    type = 'vertical';
    recommendedLayout = 'vertical_left'; // 좌측 끝 배치
  }
  
  return {
    width: imageWidth,
    height: imageHeight,
    ratio,
    type,
    recommendedLayout,
  };
}

/**
 * OpenAI API를 사용하여 명함 내용 자동 생성
 */
export async function generateCardContent(
  occupation: string,
  userName?: string,
  companyName?: string
): Promise<CardContent> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set, using fallback generation');
    return generateFallbackContent(occupation, userName, companyName);
  }

  try {
    const prompt = `당신은 프로페셔널한 명함 디자이너입니다. 다음 정보를 기반으로 명함에 들어갈 내용을 JSON 형식으로 생성해주세요.

직업: ${occupation}
${userName ? `이름: ${userName}` : ''}
${companyName ? `회사: ${companyName}` : ''}

다음 JSON 형식으로 응답해주세요:
{
  "name": "예시 이름 (제공되지 않았다면 한국식 이름으로 생성)",
  "title": "영문 직함 (예: Software Engineer, Marketing Manager)",
  "titleKo": "한글 직함 (예: 소프트웨어 엔지니어, 마케팅 매니저)",
  "company": "회사명 (제공되지 않았다면 해당 직업에 어울리는 회사명 생성)",
  "phone": "010-XXXX-XXXX",
  "email": "example@company.com",
  "website": "www.company.com",
  "layout": "modern_center",
  "colorScheme": {
    "primary": "#1e40af",
    "secondary": "#64748b",
    "accent": "#0066cc"
  }
}

직업에 어울리는 색상 스킴을 선택해주세요:
- IT/Tech: 파란색 계열
- 디자인/크리에이티브: 보라색, 핑크 계열
- 금융/법률: 네이비, 그레이 계열
- 마케팅: 밝은 파란색, 오렌지 계열
- 의료: 청록색, 그린 계열`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 프로페셔널한 명함 디자이너입니다. 항상 JSON 형식으로만 응답해주세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return generateFallbackContent(occupation, userName, companyName);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // 사용자가 제공한 정보로 덮어쓰기
    if (userName) content.name = userName;
    if (companyName) content.company = companyName;

    return content;
  } catch (error) {
    console.error('Error generating card content with AI:', error);
    return generateFallbackContent(occupation, userName, companyName);
  }
}

/**
 * Fallback: OpenAI API 사용 불가 시 기본 내용 생성
 */
function generateFallbackContent(
  occupation: string,
  userName?: string,
  companyName?: string
): CardContent {
  const occupationMap: { [key: string]: { title: string; titleKo: string; company: string; colors: any } } = {
    '개발자': {
      title: 'Software Engineer',
      titleKo: '소프트웨어 엔지니어',
      company: 'Tech Innovations',
      colors: { primary: '#1e40af', secondary: '#64748b', accent: '#0066cc' },
    },
    'developer': {
      title: 'Software Engineer',
      titleKo: '소프트웨어 엔지니어',
      company: 'Tech Innovations',
      colors: { primary: '#1e40af', secondary: '#64748b', accent: '#0066cc' },
    },
    '디자이너': {
      title: 'Creative Designer',
      titleKo: '크리에이티브 디자이너',
      company: 'Design Studio',
      colors: { primary: '#8b5cf6', secondary: '#64748b', accent: '#a855f7' },
    },
    'designer': {
      title: 'Creative Designer',
      titleKo: '크리에이티브 디자이너',
      company: 'Design Studio',
      colors: { primary: '#8b5cf6', secondary: '#64748b', accent: '#a855f7' },
    },
    '마케터': {
      title: 'Marketing Manager',
      titleKo: '마케팅 매니저',
      company: 'Brand Solutions',
      colors: { primary: '#f59e0b', secondary: '#64748b', accent: '#fb923c' },
    },
    'marketer': {
      title: 'Marketing Manager',
      titleKo: '마케팅 매니저',
      company: 'Brand Solutions',
      colors: { primary: '#f59e0b', secondary: '#64748b', accent: '#fb923c' },
    },
  };

  const key = occupation.toLowerCase();
  const match = occupationMap[key] || {
    title: 'Professional',
    titleKo: '전문가',
    company: 'MyBrands.ai',
    colors: { primary: '#1e40af', secondary: '#64748b', accent: '#0066cc' },
  };

  return {
    name: userName || '홍길동',
    title: match.title,
    company: companyName || match.company,
    phone: '010-1234-5678',
    email: 'hello@mybrands.ai',
    website: 'www.mybrands.ai',
    layout: 'modern_center',
    colorScheme: match.colors,
  };
}

/**
 * 로고 색상 추출 (간단한 버전 - 실제로는 Color Thief 사용)
 * 이미지 URL에서 주요 색상을 추출
 */
export async function extractLogoColor(imageUrl: string): Promise<string> {
  // TODO: 실제 구현 시 Color Thief 또는 이미지 처리 라이브러리 사용
  // 현재는 기본값 반환
  return '#0066cc';
}

/**
 * 명함 레이아웃 계산
 * - 로고 크기: 명함 면적의 15-20%
 * - 세이프존: 5mm (약 19px @ 300 DPI)
 */
export function calculateLogoLayout(
  logoAnalysis: LogoAnalysis,
  cardWidth: number = 1063,
  cardHeight: number = 591
) {
  const safeZone = 19; // 5mm @ 300 DPI
  const targetArea = cardWidth * cardHeight * 0.17; // 명함 면적의 17%
  
  // 로고의 비율을 유지하면서 목표 면적에 맞는 크기 계산
  const scale = Math.sqrt(targetArea / (logoAnalysis.width * logoAnalysis.height));
  
  const scaledWidth = logoAnalysis.width * scale;
  const scaledHeight = logoAnalysis.height * scale;
  
  // 세이프존을 고려한 최대 크기 제한
  const maxWidth = cardWidth - (safeZone * 2);
  const maxHeight = cardHeight - (safeZone * 2);
  
  const finalScale = Math.min(
    scale,
    maxWidth / logoAnalysis.width,
    maxHeight / logoAnalysis.height
  );
  
  return {
    scale: finalScale,
    width: logoAnalysis.width * finalScale,
    height: logoAnalysis.height * finalScale,
    safeZone,
  };
}
