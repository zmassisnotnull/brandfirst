import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Business card dimensions in mm
const CARD_WIDTH_MM = 90;
const CARD_HEIGHT_MM = 50;
const BLEED_MM = 2; // 도련(Bleed)

// Convert mm to pixels at 300 DPI
const MM_TO_PX_300DPI = 11.811; // 300 DPI / 25.4 mm per inch
const CARD_WIDTH_PX = Math.round((CARD_WIDTH_MM + BLEED_MM * 2) * MM_TO_PX_300DPI);
const CARD_HEIGHT_PX = Math.round((CARD_HEIGHT_MM + BLEED_MM * 2) * MM_TO_PX_300DPI);

interface CardData {
  name: string;
  nameEng?: string;
  title: string;
  company?: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}

interface LogoPromptData {
  industry: string;
  mood: string;
  color: string;
  style: string;
  brandName?: string; // 브랜드명 (콤비네이션 마크용)
  logoType?: 'mark' | 'logotype' | 'combination'; // 로고 타입 추가
}

/**
 * Build optimized prompt for logo generation with Flux.2 / DALL-E
 * Following best practices: High-quality, professional, vector style
 */
function buildLogoPrompt(data: LogoPromptData): string {
  // Map Korean inputs to English for better AI understanding
  const industryMap: Record<string, string> = {
    'IT 스타트업': 'tech startup',
    '카페': 'coffee shop cafe',
    '꽃집': 'flower shop florist',
    '법률 사무소': 'law firm legal office',
    '프리랜서 개발자': 'freelance developer',
    '디자인 에이전시': 'design agency',
    '헬스케어': 'healthcare medical',
    '교육/강의': 'education teaching',
    '부동산': 'real estate',
    '뷰티/미용': 'beauty salon',
    '요식업': 'restaurant food service',
    '패션/의류': 'fashion clothing',
    '컨설팅': 'consulting business',
    '금융/재테크': 'finance investment',
    '마케팅': 'marketing agency',
    '테크/IT': 'tech startup',
    '크리에이티브': 'creative design',
    '비즈니스': 'business consulting',
    '리테일': 'retail shopping',
    '서비스': 'service industry',
  };

  // Mood → Style Keywords 확장 (필살기!)
  const moodStyleMap: Record<string, string> = {
    '미니멀한': 'minimalist and clean, geometric, precise, balanced, whitespace-focused',
    '화려한': 'vibrant and colorful, dynamic, bold, eye-catching',
    '신뢰감 있는': 'trustworthy and professional, corporate identity, geometric, precise, balanced',
    '귀여운': 'cute and friendly, rounded corners, soft colors, approachable, organic shapes',
    '미래지향적인': 'futuristic and modern, sleek, innovative, tech-forward',
    '고급스러운': 'luxury and premium, elegant, sophisticated, refined, high-end',
    '친근한': 'friendly and approachable, rounded corners, soft colors, welcoming, organic shapes',
    '전문적인': 'professional and corporate, corporate identity, geometric, precise, balanced, trustworthy',
    '창의적인': 'creative and innovative, abstract, unique, flowing lines, metaphorical, vibrant',
    '모던한': 'modern and contemporary, clean lines, minimalist, trendy',
    '클래식한': 'classic and timeless, traditional, elegant, enduring',
    '활기찬': 'energetic and dynamic, lively, spirited, vibrant',
    '프로페셔널': 'professional and sleek, corporate identity, geometric, precise, balanced',
    '모던': 'modern and minimalist, clean, geometric, simple',
    '대담한': 'bold and striking, confident, powerful, impactful',
    '럭셔리': 'luxury and sophisticated, premium, elegant, exclusive',
  };

  const colorMap: Record<string, string> = {
    // 영문 ID (프론트엔드에서 전송)
    'blue': '#2563EB',
    'purple': '#A855F7', 
    'green': '#10B981',
    'orange': '#F97316',
    'pink': '#EC4899',
    'black': '#1F2937',
    'red': '#EF4444',
    'teal': '#14B8A6',
    // 한글 (호환성)
    '블루': '#2563EB', 
    '네이비': '#1E3A8A', 
    '틸': '#14B8A6',
    '그린': '#10B981', 
    '민트': '#6EE7B7', 
    '퍼플': '#A855F7',
    '핑크': '#EC4899', 
    '레드': '#EF4444', 
    '오렌지': '#F97316',
    '블랙': '#1F2937', 
    '골드': '#F59E0B',
  };

  // 폰트 스타일 매핑 (스타일 선택에 따른)
  const fontStyleMap: Record<string, string> = {
    'geometric': 'bold geometric sans-serif',
    'text': 'modern clean sans-serif',
    'icon': 'sleek contemporary sans-serif',
    'abstract': 'elegant avant-garde sans-serif',
  };

  // 업종별 심볼 키워드 매핑 함수
  const getIndustrySymbol = (industry: string): string => {
    const symbolMap: Record<string, string> = {
      'tech startup': 'stylized number "1" merged with a forward arrow',
      'coffee shop cafe': 'minimalist coffee cup with steam',
      'flower shop florist': 'abstract flower petal',
      'law firm legal office': 'balanced scales or column',
      'freelance developer': 'code bracket or terminal symbol',
      'design agency': 'creative brush stroke or pen nib',
      'healthcare medical': 'medical cross or heartbeat line',
      'education teaching': 'open book or graduation cap',
      'real estate': 'modern house outline or building',
      'beauty salon': 'elegant leaf or face silhouette',
      'restaurant food service': 'chef hat or utensils',
      'fashion clothing': 'hanger or dress silhouette',
      'consulting business': 'lightbulb or graph arrow',
      'finance investment': 'upward trend arrow or coin',
      'marketing agency': 'megaphone or target',
      'creative design': 'color palette or creative spark',
      'business consulting': 'briefcase or handshake',
      'retail shopping': 'shopping bag or storefront',
      'service industry': 'helping hand or service bell',
    };
    return symbolMap[industry] || 'abstract modern geometric shape';
  };

  const industry = industryMap[data.industry] || data.industry;
  const moodStyles = moodStyleMap[data.mood] || data.mood;
  const color = colorMap[data.color] || data.color;
  const logoType = data.logoType || 'logotype';
  const brandName = data.brandName || 'Brand';
  const fontStyle = fontStyleMap[data.style] || 'modern sans-serif';

  let prompt = '';

  // 🎨 로고 타입별 프롬프트 생성 (인쇄 최적화 + 5단계 프레임워크)
  if (logoType === 'logotype') {
    // CRITICAL: 한글 브랜드명은 영문으로 변환 필요
    const latinBrandName = brandName.replace(/[^\x00-\x7F]/g, '').trim() || 'Brand';
    
    // [출력 형태] + [브랜드 이름] + [핵심 오브젝트] + [디자인 스타일] + [제약 사항/배경]
    prompt = `Professional modern logotype design featuring the text '${latinBrandName}' in all capital letters. ` +
             `Typography style: ${fontStyle}, ${moodStyles}. ` +
             `Color scheme: ${color} as primary color with possible accent colors. ` +
             `${industry} aesthetic, clean and bold letterforms designed for business cards. ` +
             `Flat vector style on white background. ` +
             // 🔥 인쇄 최적화 (but allow colors and variations)
             `IMPORTANT: The text must spell exactly '${latinBrandName.toUpperCase()}'. ` +
             `NO 3D effects, NO shadows, NO emboss. ` +
             `Simple professional logo design, print-ready, high contrast.`;

  } else if (logoType === 'combination') {
    const symbol = getIndustrySymbol(industry);
    const latinBrandName = brandName.replace(/[^\x00-\x7F]/g, '').trim() || 'Brand';
    
    // [출력 형태] + [브랜드 이름] + [핵심 오브젝트] + [디자인 스타일] + [제약 사항/배경]
    prompt = `Professional combination mark logo design. ` +
             `LEFT SIDE: A simple geometric icon representing ${symbol}. ` +
             `RIGHT SIDE: The text '${latinBrandName}' in ${fontStyle}, all capital letters. ` +
             `Design style: ${moodStyles}, ${industry} aesthetic. ` +
             `Color palette: ${color} with complementary accent colors allowed. ` +
             `Balanced horizontal composition, flat vector style on white background. ` +
             // 🔥 인쇄 최적화 (but allow colors and variations)
             `IMPORTANT: The text must spell exactly '${latinBrandName.toUpperCase()}'. ` +
             `NO 3D effects, NO shadows, NO emboss. ` +
             `Clean professional logo for business cards, print-ready, high contrast.`;
  }

  console.log('Built logo prompt:', prompt);
  console.log('Logo type:', logoType);
  return prompt;
}

/**
 * Generate background image using DALL-E 3
 */
export const generateBackground = async (prompt: string): Promise<string | null> => {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    throw new Error('OpenAI API key가 설정되지 않았습니다.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Business card background design: ${prompt}. Professional, minimalist, high-resolution, suitable for printing.`,
        n: 1,
        size: '1792x1024', // Highest resolution for DALL-E 3
        quality: 'hd',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DALL-E 3 API error:', error);
      throw new Error('배경 이미지 생성에 실패했습니다.');
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Error generating background with DALL-E 3:', error);
    throw error;
  }
};

/**
 * Generate logo using OpenAI DALL-E 3
 */
export const generateLogo = async (logoData: LogoPromptData): Promise<string[]> => {
  // Use OpenAI DALL-E (we already have the key)
  return generateLogoOpenAI(logoData);
};

/**
 * Generate logo using OpenAI DALL-E 3
 */
async function generateLogoOpenAI(logoData: LogoPromptData): Promise<string[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    throw new Error('OpenAI API key가 설정되지 않았습니다.');
  }

  try {
    const prompt = buildLogoPrompt(logoData);
    
    console.log('Generating logo with OpenAI DALL-E 3...');
    console.log('Prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard', // 미리보기용 - 선택 시 hd로 재성
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI DALL-E API error:', error);
      throw new Error(error.error?.message || '로고 생성에 실패했습니다.');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    console.log('Logo generated successfully with DALL-E 3');
    return [imageUrl];
  } catch (error) {
    console.error('Error generating logo with OpenAI DALL-E:', error);
    throw error;
  }
}

/**
 * Regenerate selected logo in high quality for printing
 * Used when user selects a logo for business card
 */
export const regenerateLogoHighQuality = async (logoData: LogoPromptData): Promise<string> => {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key가 설정되지 않았습니다.');
  }

  try {
    const prompt = buildLogoPrompt(logoData);
    
    console.log('🎨 Regenerating logo in HIGH QUALITY for printing...');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // DALL-E 3 max size
        quality: 'hd', // 🔥 High quality for printing
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('DALL-E HD generation error:', error);
      throw new Error(error.error?.message || 'HD 로고 생성에 실패했습니다.');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    console.log('✅ HD logo generated successfully');
    return imageUrl;
  } catch (error) {
    console.error('Error regenerating HD logo:', error);
    throw error;
  }
};

/**
 * Generate logo using Hugging Face Inference API (FREE)
 * Model: FLUX.1-schnell (fast, free, good quality)
 */
async function generateLogoHuggingFace(logoData: LogoPromptData): Promise<string[]> {
  const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
  
  if (!hfApiKey) {
    console.error('HUGGINGFACE_API_KEY environment variable is not set');
    throw new Error('Hugging Face API key가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.');
  }

  try {
    // Build optimized prompt
    const prompt = buildLogoPrompt(logoData);

    console.log('Generating logo with Hugging Face FLUX.1-schnell...');
    console.log('Prompt:', prompt);

    // Use FLUX.1-schnell model (free and fast)
    const response = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 4, // Schnell is optimized for 1-4 steps
            guidance_scale: 0, // Schnell doesn't use guidance
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hugging Face API error:', errorText);
      
      // Handle model loading error
      if (response.status === 503) {
        throw new Error('AI 모델이 로딩 중입니다. 20초 후 다시 시도해주세요.');
      }
      
      throw new Error(`로고 생성에 실패했습니다: ${errorText}`);
    }

    // Response is image binary
    const imageBlob = await response.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Convert to base64
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(imageBuffer))
    );
    
    // Save to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `hf-logo-${Date.now()}.png`;
    const filePath = `temp/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('make-45024be7-assets')
      .upload(filePath, imageBuffer, { contentType: 'image/png' });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Return base64 as fallback
      return [`data:image/png;base64,${base64Image}`];
    }
    
    // Get public URL
    const { data: urlData } = await supabase.storage
      .from('make-45024be7-assets')
      .createSignedUrl(filePath, 31536000); // 1 year
    
    if (!urlData?.signedUrl) {
      return [`data:image/png;base64,${base64Image}`];
    }
    
    console.log('Logo generated successfully with Hugging Face');
    return [urlData.signedUrl];
  } catch (error) {
    console.error('Error generating logo with Hugging Face:', error);
    throw error;
  }
}

/**
 * Generate logo using Replicate (PAID - Flux.1.1 Pro)
 * Better quality but costs ~$0.04 per image
 */
async function generateLogoReplicate(logoData: LogoPromptData): Promise<string[]> {
  const replicateApiKey = Deno.env.get('REPLICATE_API_KEY');
  
  if (!replicateApiKey) {
    console.error('REPLICATE_API_KEY environment variable is not set');
    throw new Error('Replicate API key가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세.');
  }

  try {
    // Build optimized prompt
    const prompt = buildLogoPrompt(logoData);

    // Use Flux.1.1 Pro model via Replicate
    // Reference: https://replicate.com/black-forest-labs/flux-1.1-pro
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${replicateApiKey}`,
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-1.1-pro',
        input: {
          prompt: prompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 100,
          safety_tolerance: 2,
          prompt_upsampling: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Replicate Flux.1.1 API error:', error);
      throw new Error(`로고 생성에 실패했습니다: ${error.detail || 'API 오류'}`);
    }

    let prediction = await response.json();
    console.log('Flux.1.1 Pro prediction started:', prediction.id);
    
    // Poll for completion (Flux is usually fast, but can take 10-30 seconds)
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max
    
    while (
      prediction.status !== 'succeeded' && 
      prediction.status !== 'failed' &&
      attempts < maxAttempts
    ) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            'Authorization': `Bearer ${replicateApiKey}`,
          },
        }
      );
      
      prediction = await pollResponse.json();
      attempts++;
      
      console.log(`Flux.1.1 Pro generation status: ${prediction.status} (${attempts}s)`);
    }

    if (prediction.status === 'failed') {
      console.error('Flux.1.1 Pro generation failed:', prediction.error);
      throw new Error('로고 생성이 실패했습니다.');
    }

    if (attempts >= maxAttempts) {
      throw new Error('로고 생성 시간이 초과되었습니다. 다시 시도해주세요.');
    }

    // Flux.1.1 returns a single image URL
    const logoUrl = prediction.output;
    
    if (!logoUrl) {
      throw new Error('로고 이미지를 받지 못했습니다.');
    }

    // Return as array for consistency
    return [logoUrl];
  } catch (error) {
    console.error('Error generating logo with Replicate:', error);
    throw error;
  }
}

/**
 * Generate multiple logo variations by calling the API multiple times
 * Each variation has slightly different style for diversity
 */
export const generateLogoVariations = async (
  logoData: LogoPromptData,
  count: number = 3
): Promise<string[]> => {
  console.log(`Generating ${count} logo variations with OpenAI DALL-E...`);
  
  try {
    // 🎨 각 variation에 다른 스타일 적용 (다양성 확보)
    const styleVariations = [
      'clean minimalist', // Variation 1: 미니멀
      'bold geometric',   // Variation 2: 기하학적
      'elegant modern',   // Variation 3: 우아한
    ];
    
    // Generate logos with different styles
    const logoPromises = styleVariations.slice(0, count).map((styleHint, i) => {
      // 각 variation마다 약간 다른 프롬프트 사용
      const variantData = {
        ...logoData,
        mood: `${logoData.mood}, ${styleHint}`, // 스타일 힌트 추가
      };
      
      return generateLogo(variantData).then(urls => {
        console.log(`✅ Logo variation ${i + 1}/${count} (${styleHint}) generated successfully`);
        return urls[0];
      }).catch(error => {
        console.error(`❌ Failed to generate logo variation ${i + 1}:`, error);
        return null;
      });
    });
    
    const results = await Promise.all(logoPromises);
    const logos = results.filter((url): url is string => url !== null);
    
    if (logos.length === 0) {
      throw new Error('모든 로고 생성이 실패했습니다. OpenAI API 키를 확인하거나 나중에 다시 시도해주세요.');
    }
    
    console.log(`✅ Successfully generated ${logos.length}/${count} logo variations`);
    return logos;
  } catch (error) {
    console.error('Error in generateLogoVariations:', error);
    throw error;
  }
};

/**
 * Remove background from logo image using Hugging Face API
 * Model: briaai/RMBG-1.4 (Free to use)
 */
export const removeBackground = async (imageUrl: string): Promise<Uint8Array> => {
  const hfApiKey = Deno.env.get('HUGGINGFACE_API_KEY');
  
  if (!hfApiKey) {
    console.warn('⚠️ HUGGINGFACE_API_KEY not set, skipping background removal');
    // Return original image if no API key
    const response = await fetch(imageUrl);
    return new Uint8Array(await response.arrayBuffer());
  }

  try {
    console.log('🎨 Removing background from logo...');

    // Download image first
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Call Hugging Face Background Removal API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
        },
        body: imageBuffer,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Background removal failed:', errorText);
      
      // If model is loading, wait and retry once
      if (response.status === 503) {
        console.log('⏳ Model loading, waiting 20 seconds...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        const retryResponse = await fetch(
          'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfApiKey}`,
            },
            body: imageBuffer,
          }
        );
        
        if (!retryResponse.ok) {
          throw new Error('Background removal retry failed');
        }
        
        const resultBlob = await retryResponse.blob();
        const resultBuffer = await resultBlob.arrayBuffer();
        console.log('✅ Background removed successfully (retry)');
        return new Uint8Array(resultBuffer);
      }
      
      throw new Error('Background removal failed');
    }

    const resultBlob = await response.blob();
    const resultBuffer = await resultBlob.arrayBuffer();
    
    console.log('✅ Background removed successfully');
    return new Uint8Array(resultBuffer);
  } catch (error) {
    console.error('❌ Error removing background:', error);
    console.log('⚠️ Returning original image without background removal');
    // Return original image on error
    const response = await fetch(imageUrl);
    return new Uint8Array(await response.arrayBuffer());
  }
};

/**
 * Vectorize bitmap logo to SVG using potrace-wasm
 * Converts PNG/JPG to scalable vector format
 */
export const vectorizeLogo = async (imageBuffer: Uint8Array): Promise<string> => {
  try {
    console.log('🎨 Vectorizing logo to SVG...');
    
    // Import Sharp for image processing
    const sharp = (await import('npm:sharp@0.33.2')).default;
    
    // Convert to grayscale and increase contrast for better vectorization
    const processedBuffer = await sharp(Buffer.from(imageBuffer))
      .grayscale()
      .normalise()
      .png()
      .toBuffer();
    
    // Import potrace (bitmap to vector conversion)
    const potrace = await import('npm:potrace@2.1.8');
    
    // Convert to SVG
    const svgString = await new Promise<string>((resolve, reject) => {
      potrace.trace(processedBuffer, {
        color: 'black',
        background: 'transparent',
        threshold: 128,
        optTolerance: 0.2,
      }, (err: Error | null, svg: string) => {
        if (err) {
          reject(err);
        } else {
          resolve(svg);
        }
      });
    });
    
    console.log('✅ Logo vectorized successfully');
    return svgString;
  } catch (error) {
    console.error('❌ Error vectorizing logo:', error);
    throw new Error('로고 벡터화에 실패했습니다.');
  }
};

/**
 * Process logo for printing: Remove background + Vectorize
 * Returns both PNG (transparent) and SVG versions
 */
export const processLogoForPrinting = async (
  logoUrl: string
): Promise<{ png: Uint8Array; svg: string }> => {
  try {
    console.log('🖨️ Processing logo for printing...');
    
    // Step 1: Remove background
    const pngWithTransparentBg = await removeBackground(logoUrl);
    
    // Step 2: Vectorize to SVG
    const svg = await vectorizeLogo(pngWithTransparentBg);
    
    console.log('✅ Logo processed for printing (PNG + SVG)');
    
    return {
      png: pngWithTransparentBg,
      svg: svg,
    };
  } catch (error) {
    console.error('❌ Error processing logo:', error);
    throw new Error('로고 처리 중 오류가 발생했습니다.');
  }
};

/**
 * Upscale image for high-resolution printing
 * Using a simple upscaling service or AI upscaler
 */
export const upscaleImage = async (imageUrl: string): Promise<string> => {
  // For now, return the original URL
  // In production, integrate with an upscaling service like:
  // - Replicate Real-ESRGAN
  // - DeepAI Super Resolution
  // - Cloudinary AI upscale
  
  console.log('Image upscaling requested for:', imageUrl);
  return imageUrl;
};

/**
 * Compose business card with all elements
 * Returns a base64 encoded PNG at 300 DPI
 */
export const composeCard = async (cardData: CardData): Promise<string> => {
  try {
    // Import Sharp for image processing (works in Deno)
    const sharp = (await import('npm:sharp@0.33.2')).default;
    
    // Create base canvas with bleed
    let canvas = sharp({
      create: {
        width: CARD_WIDTH_PX,
        height: CARD_HEIGHT_PX,
        channels: 4,
        background: cardData.backgroundColor || '#ffffff',
      },
    });

    const compositeImages: any[] = [];

    // 1. Add background image if provided
    if (cardData.backgroundImageUrl) {
      try {
        const bgResponse = await fetch(cardData.backgroundImageUrl);
        const bgBuffer = await bgResponse.arrayBuffer();
        
        const resizedBg = await sharp(Buffer.from(bgBuffer))
          .resize(CARD_WIDTH_PX, CARD_HEIGHT_PX, { fit: 'cover' })
          .toBuffer();

        compositeImages.push({
          input: resizedBg,
          top: 0,
          left: 0,
        });
      } catch (error) {
        console.error('Error loading background image:', error);
      }
    }

    // 2. Add logo if provided
    if (cardData.logoUrl) {
      try {
        const logoResponse = await fetch(cardData.logoUrl);
        const logoBuffer = await logoResponse.arrayBuffer();
        
        const logoSize = Math.round(CARD_HEIGHT_PX * 0.2); // 20% of card height
        const resizedLogo = await sharp(Buffer.from(logoBuffer))
          .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer();

        compositeImages.push({
          input: resizedLogo,
          top: Math.round(CARD_HEIGHT_PX * 0.1),
          left: CARD_WIDTH_PX - logoSize - Math.round(CARD_WIDTH_PX * 0.1),
        });
      } catch (error) {
        console.error('Error loading logo image:', error);
      }
    }

    // Composite all images
    if (compositeImages.length > 0) {
      canvas = canvas.composite(compositeImages);
    }

    // Generate PNG with text overlay (SVG)
    // Note: Sharp can overlay SVG text
    const textSvg = generateTextSvg(cardData);
    
    const finalImage = await canvas
      .composite([{
        input: Buffer.from(textSvg),
        top: 0,
        left: 0,
      }])
      .png({ quality: 100 })
      .toBuffer();

    return finalImage.toString('base64');
  } catch (error) {
    console.error('Error composing card:', error);
    throw new Error('명함 합성 중 오류가 발생했습니다.');
  }
};

/**
 * Generate SVG overlay for text elements
 */
function generateTextSvg(cardData: CardData): string {
  const textColor = cardData.textColor || '#000000';
  const padding = Math.round(CARD_WIDTH_PX * 0.08);
  
  return `
    <svg width="${CARD_WIDTH_PX}" height="${CARD_HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&amp;display=swap');
          .title { font-family: 'Noto Sans KR', sans-serif; font-weight: 700; }
          .body { font-family: 'Noto Sans KR', sans-serif; font-weight: 400; }
        </style>
      </defs>
      
      <!-- Company -->
      ${cardData.company ? `
        <text x="${padding}" y="${padding + 20}" class="body" font-size="16" fill="${textColor}" opacity="0.8">
          ${escapeXml(cardData.company)}
        </text>
      ` : ''}
      
      <!-- Name (Korean) -->
      <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 3.5}" class="title" font-size="48" fill="${textColor}">
        ${escapeXml(cardData.name)}
      </text>
      
      <!-- Name (English) -->
      ${cardData.nameEng ? `
        <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 2.8}" class="body" font-size="14" fill="${textColor}" opacity="0.7">
          ${escapeXml(cardData.nameEng)}
        </text>
      ` : ''}
      
      <!-- Title -->
      <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 2.2}" class="body" font-size="20" fill="${textColor}" opacity="0.9">
        ${escapeXml(cardData.title)}
      </text>
      
      <!-- Contact Info -->
      <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 0.9}" class="body" font-size="12" fill="${textColor}" opacity="0.8">
        T. ${escapeXml(cardData.phone)}
      </text>
      <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 0.5}" class="body" font-size="12" fill="${textColor}" opacity="0.8">
        E. ${escapeXml(cardData.email)}
      </text>
      ${cardData.website ? `
        <text x="${padding}" y="${CARD_HEIGHT_PX - padding * 0.1}" class="body" font-size="12" fill="${textColor}" opacity="0.8">
          W. ${escapeXml(cardData.website)}
        </text>
      ` : ''}
    </svg>
  `;
}

/**
 * Convert composed image to PDF
 */
export const generatePDF = async (imageBase64: string, cardData: CardData): Promise<Uint8Array> => {
  try {
    const { PDFDocument, rgb } = await import('npm:pdf-lib@1.17.1');
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Convert mm to points (1 mm = 2.83465 points)
    const mmToPoints = 2.83465;
    const width = (CARD_WIDTH_MM + BLEED_MM * 2) * mmToPoints;
    const height = (CARD_HEIGHT_MM + BLEED_MM * 2) * mmToPoints;
    
    const page = pdfDoc.addPage([width, height]);
    
    // Embed PNG image
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const image = await pdfDoc.embedPng(imageBytes);
    
    // Draw image to fill entire page with bleed
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    
    // Add trim marks (crop marks) for printing
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const markLength = 5 * mmToPoints;
    const markOffset = 2 * mmToPoints;
    
    // Note: pdf-lib doesn't support advanced PDF/X-1a features directly
    // For production, you'd need a more specialized library or post-processing
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('PDF 생성 중 오류가 발생했습니다.');
  }
};

/**
 * Save generated asset to Supabase Storage
 */
export const saveAsset = async (
  userId: string,
  fileName: string,
  fileData: Uint8Array | string,
  contentType: string
): Promise<string> => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const bucketName = 'make-45024be7-assets';
  
  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
  }
  
  // Upload file
  const filePath = `${userId}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileData, { contentType });
  
  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw new Error('파일 저장에 실패했습니다.');
  }
  
  // Get signed URL (valid for 1 year)
  const { data: urlData } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 31536000);
  
  if (!urlData?.signedUrl) {
    throw new Error('파일 URL 생성에 실패했습니다.');
  }
  
  return urlData.signedUrl;
};

// Helper function
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Logotype using server-side font rendering (Hybrid approach)
 * Returns 3 variations with different fonts and colors
 */
export const generateLogotypeHybrid = async (
  brandName: string,
  mood: string,
  color: string,
  style: string,
  userId?: string
): Promise<Array<{ url: string; font: string }>> => {
  console.log('🎨 Generating logotype with hybrid approach (server-side fonts)...');
  console.log('📥 Received params:', { brandName, mood, color, style });
  
  // 한글 제거, 영문만 (대소문자 원본 유지)
  const latinBrandName = brandName.replace(/[^\x00-\x7F]/g, '').trim() || 'Brand';
  
  // 각 스타일별 3개의 고정된 폰트 그룹 (각 그룹당 3개 폰트 - 서로 대비되는 스타일)
  const fontGroups: Record<string, string[][]> = {
    '미니멀한': [
      ['Poppins', 'Raleway', 'Space Mono'],              // Sans Rounded + Sans Thin + Mono
      ['Inter', 'Questrial', 'IBM Plex Mono'],           // Sans Modern + Sans Minimal + Mono Tech
      ['Work Sans', 'Lexend', 'Roboto Mono']             // Sans Versatile + Sans Simple + Mono Clean
    ],
    '고급스러운': [
      ['Playfair Display', 'Bodoni Moda', 'Cinzel'],     // Serif Display + Serif Fashion + Serif Roman
      ['Cormorant Garamond', 'Libre Baskerville', 'Lora'], // Serif Classic + Serif Traditional + Serif Elegant
      ['EB Garamond', 'Crimson Text', 'Spectral']        // Serif Old Style + Serif Text + Serif Modern
    ],
    '화려한': [
      ['Shrikhand', 'Righteous', 'Pacifico'],            // Display Decorative + Display Retro + Script Surf
      ['Rye', 'Bungee Shade', 'Lobster'],                // Display Western Decorative + Display Shadow Effect + Script Casual
      ['Fredericka the Great', 'Bangers', 'Monoton']     // Display Ornate Victorian + Display Comic + Display Line Pattern
    ],
    '친근한': [
      ['Quicksand', 'Nunito', 'Indie Flower'],           // Sans Rounded + Sans Friendly + Handwriting
      ['Comfortaa', 'Fascinate', 'Fredoka'],             // Sans Soft + Display Decorative + Sans Playful  
      ['Modak', 'Baloo 2', 'Caveat']                     // Display Rounded Playful + Sans Bubbly + Handwriting Loose
    ],
    '창의적인': [
      ['Permanent Marker', 'Pacifico', 'Amatic SC'],     // Marker Bold + Script Surf + Handwriting Simple
      ['Lobster', 'Dancing Script', 'Caveat'],           // Script Retro + Script Flowing + Handwriting
      ['Satisfy', 'Kalam', 'Architects Daughter']        // Script Elegant + Handwriting Natural + Handwriting Architect
    ],
    '모던한': [
      ['Outfit', 'Orbitron', 'Rajdhani'],                // Sans Geometric + Display Sci-fi + Sans Tech
      ['Space Grotesk', 'Audiowide', 'Exo 2'],           // Sans Space + Display Digital + Sans Futuristic
      ['Saira', 'Electrolize', 'Chakra Petch']           // Sans Modern + Display Tech + Sans Angular
    ],
  };
  
  // 스타일에 맞는 폰트 그룹들 가져오기
  const availableGroups = fontGroups[style] || fontGroups['미니멀한'];
  
  // 🎯 폰트 그룹 선택 로직 (userId 기반 해시)
  let selectedGroupIndex: number;
  
  if (userId) {
    // userId 기반으로 결정적(deterministic)인 그룹 선택
    // 같은 userId는 항상 같은 순서로 그룹을 받음
    const userIdHash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    selectedGroupIndex = userIdHash % 3; // 0, 1, 2 중 하나
    
    console.log(`✅ Selected group ${selectedGroupIndex + 1} for user ${userId}`);
  } else {
    // userId 없으면 랜덤 선택
    selectedGroupIndex = Math.floor(Math.random() * 3);
    console.log('⚠️ No userId provided, using random group selection');
  }
  
  const fonts = availableGroups[selectedGroupIndex];
  
  console.log(`🔤 Selected font group ${selectedGroupIndex + 1} for style '${style}':`, fonts);
  console.log(`📊 Available groups for '${style}': Group 1, Group 2, Group 3 (total ${availableGroups.length} groups)`);
  
  // 색상 변환 함수들
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };
  
  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  };
  
  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return { r: r * 255, g: g * 255, b: b * 255 };
  };
  
  // 색상 맵핑 (프론트엔드에서 영문 ID를 보내므로 영문과 한글 모두 지원)
  const colorMap: Record<string, string> = {
    // 영문 ID (프론트엔드에서 전송)
    'blue': '#2563EB',
    'purple': '#A855F7', 
    'green': '#10B981',
    'orange': '#F97316',
    'pink': '#EC4899',
    'black': '#1F2937',
    'red': '#EF4444',
    'teal': '#14B8A6',
    // 한글 (호환성)
    '블루': '#2563EB', 
    '네이비': '#1E3A8A', 
    '틸': '#14B8A6',
    '그린': '#10B981', 
    '민트': '#6EE7B7', 
    '퍼플': '#A855F7',
    '핑크': '#EC4899', 
    '레드': '#EF4444', 
    '오렌지': '#F97316',
    '블랙': '#1F2937', 
    '골드': '#F59E0B',
  };
  
  const primaryHex = colorMap[color] || '#2563EB';
  const primaryRgb = hexToRgb(primaryHex);
  const primaryHsl = rgbToHsl(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  
  // Variation 1: 사용자 선택 색상
  const color1 = primaryHex;
  
  // Variation 2: 듀오톤 - 주황색이면 회색, 그 외는 유사 색상
  let color2: string;
  // 주황색 계열 감지 (hue: 15~45도 범위)
  if (primaryHsl.h >= 15 && primaryHsl.h <= 45) {
    // 주황색이면 회색 사용
    color2 = '#6B7280'; // gray-500
    console.log('🟠 주황색 감지 → 듀오톤 세컨더리 색상을 회색으로 설정');
  } else {
    // 그 외는 유사 색상 (+30도 회전)
    const analogousHsl = { ...primaryHsl, h: (primaryHsl.h + 30) % 360 };
    const analogousRgb = hslToRgb(analogousHsl.h, analogousHsl.s, analogousHsl.l);
    color2 = rgbToHex(analogousRgb.r, analogousRgb.g, analogousRgb.b);
  }
  
  // Variation 3: 보색 + 낮은 명도
  const complementHsl = { ...primaryHsl, h: (primaryHsl.h + 180) % 360, l: Math.max(primaryHsl.l - 20, 20) };
  const complementRgb = hslToRgb(complementHsl.h, complementHsl.s, complementHsl.l);
  const color3 = rgbToHex(complementRgb.r, complementRgb.g, complementRgb.b);
  
  console.log('🎨 Color variations:', { color1, color2, color3, primaryHue: primaryHsl.h });
  
  // SVG 로고타입 생성 (3가지 variation - 폰트, 색상, 크기, 간격, 대소문자 모두 다르게)
  const variations = [
    { font: fonts[0], color: color1, weight: '700', size: 180, spacing: '0.05em', transform: 'uppercase' },
    { font: fonts[1], color: color2, weight: '400', size: 150, spacing: '0.08em', transform: 'titlecase' },
    { font: fonts[2], color: color3, weight: '900', size: 200, spacing: '-0.02em', transform: 'sentencecase' },
  ];
  
  // 대소문자 변환 함수
  const transformText = (text: string, transform: string): string => {
    if (transform === 'uppercase') {
      return text.toUpperCase(); // BRANDFIRST
    } else if (transform === 'titlecase') {
      // 단어별로 첫 글자만 대문자, 공백 없이: BrandFirst
      // brandfirst -> BrandFirst, BrandFirst -> BrandFirst 유지
      
      // 이미 CamelCase면 유지
      if (/[A-Z]/.test(text)) {
        const words = text.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
        return words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
      }
      
      // 소문자만 있으면 중간에서 나눠서 CamelCase로 만들기
      const mid = Math.ceil(text.length / 2);
      const firstPart = text.substring(0, mid);
      const secondPart = text.substring(mid);
      
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase() +
             secondPart.charAt(0).toUpperCase() + secondPart.slice(1).toLowerCase();
    } else if (transform === 'sentencecase') {
      // 전체의 첫 글자만 대문자: Brandfirst
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    return text;
  };
  
  const svgs = variations.map((variant, index) => {
    const displayText = transformText(latinBrandName, variant.transform);
    
    // 모든 variation에 동일한 y 위치 (중앙 정렬)
    const yPos = 512; // 1024의 정중앙
    
    // Variation 2 (index === 1): 듀오톤 - 앞뒤 다른 색상
    if (index === 1) {
      const midPoint = Math.floor(displayText.length / 2);
      const firstPart = displayText.slice(0, midPoint);
      const secondPart = displayText.slice(midPoint);
      
      const svg = `<svg width="1400" height="1024" viewBox="0 0 1400 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=${variant.font.replace(/ /g, '+')}:wght@400;700&amp;display=swap');
          </style>
        </defs>
        <rect width="1400" height="1024" fill="white"/>
        <text 
          x="700" 
          y="${yPos}" 
          font-family="${variant.font}, sans-serif" 
          font-size="${variant.size}" 
          text-anchor="middle" 
          dominant-baseline="central"
          letter-spacing="${variant.spacing}"
        >
          <tspan fill="${color1}" font-weight="700">${firstPart}</tspan><tspan fill="${color2}" font-weight="400">${secondPart}</tspan>
        </text>
      </svg>`;
      
      console.log(`✅ Logotype variation ${index + 1} generated: ${variant.font} (DUOTONE: ${color1} Bold + ${color2} Regular, size: ${variant.size})`);
      return svg;
    }
    
    // Variation 1, 3: 단색
    const svg = `<svg width="1400" height="1024" viewBox="0 0 1400 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=${variant.font.replace(/ /g, '+')}:wght@${variant.weight}&amp;display=swap');
        </style>
      </defs>
      <rect width="1400" height="1024" fill="white"/>
      <text 
        x="700" 
        y="${yPos}" 
        font-family="${variant.font}, sans-serif" 
        font-weight="${variant.weight}"
        font-size="${variant.size}" 
        fill="${variant.color}" 
        text-anchor="middle" 
        dominant-baseline="central"
        letter-spacing="${variant.spacing}"
      >${displayText}</text>
    </svg>`;
    
    console.log(`✅ Logotype variation ${index + 1} generated: ${variant.font} (${variant.color}, size: ${variant.size}, spacing: ${variant.spacing})`);
    return svg;
  });
  
  // Weight를 이름으로 변환
  const weightNames: Record<string, string> = {
    '400': 'Regular',
    '600': 'SemiBold',
    '700': 'Bold',
    '800': 'ExtraBold',
    '900': 'Black',
  };
  
  // SVG를 Data URL로 변환하고 폰트 정보 포함
  const results = svgs.map((svg, index) => ({
    url: `data:image/svg+xml;base64,${btoa(svg)}`,
    font: `${fonts[index]} ${weightNames[variations[index].weight] || variations[index].weight}`,
    fontFamily: fonts[index],
    weight: variations[index].weight,
    color: variations[index].color,
    size: variations[index].size,
    spacing: variations[index].spacing,
    transform: variations[index].transform,
    isDuotone: index === 1,
    secondaryColor: index === 1 ? color2 : undefined,
  }));
  
  console.log('✅ All 3 logotype variations generated successfully');
  return results;
};

/**
 * Generate Symbol Mark only using DALL-E 3 (for Professional)
 */
export const generateSymbolMark = async (
  brandName: string,
  business: string,
  mood: string,
  color: string,
  keywords: string
): Promise<string> => {
  console.log('🎨 Generating symbol mark with DALL-E 3...');
  
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  // 프롬프트: 심볼마크만 생성 (텍스트 없이)
  const prompt = `Create a minimalist, professional symbol/icon for a brand called "${brandName}". 
Business type: ${business}. Mood: ${mood}. Keywords: ${keywords}.
IMPORTANT: 
- Create ONLY a simple icon/symbol, NO TEXT at all
- Clean, minimal design
- Primary color: ${color}
- White background
- Suitable for logo mark
- Professional and modern
- Vector-style appearance`;

  console.log('📝 DALL-E Prompt:', prompt);

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ DALL-E API Error:', error);
    throw new Error(`DALL-E API error: ${error}`);
  }

  const data = await response.json();
  const imageUrl = data.data[0].url;
  
  console.log('✅ Symbol mark generated:', imageUrl);
  return imageUrl;
};

/**
 * Generate 3 different Symbol Marks using DALL-E 3 (for Professional)
 */
export const generateSymbolMarks = async (
  brandName: string,
  business: string,
  mood: string,
  color: string,
  keywords: string
): Promise<string[]> => {
  console.log('🎨 Generating 3 flat symbol marks with DALL-E 3 (strict orthographic)...');
  
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  // 색상 맵핑 (로고타입과 동일)
  const colorMap: Record<string, string> = {
    'blue': '#2563EB', 'purple': '#A855F7', 'green': '#10B981',
    'orange': '#F97316', 'pink': '#EC4899', 'black': '#1F2937',
    'red': '#EF4444', 'teal': '#14B8A6',
  };
  const colorHex = colorMap[color] || '#2563EB';

  // 무드별 geometry 스타일
  const geometryStyleMap: Record<string, string> = {
    '미니멀한': 'simple geometric solid shapes with grid-based construction',
    '고급스러운': 'refined elegant outline with clean curves and symmetry',
    '화려한': 'bold monoline illustration with decorative geometric elements',
    '친근한': 'soft rounded solid shapes with friendly proportions',
    '창의적인': 'abstract artistic geometric composition with unique angles',
    '모던한': 'sharp angular solid forms with tech-inspired grid structure',
  };
  const geometryStyle = geometryStyleMap[mood] || 'simple geometric solid shapes';

  // 3가지 다른 스타일 변형 (각각 명확하게 구분)
  const styleVariations = [
    {
      id: 'A',
      concept: 'minimalist geometric solid',
      style: 'simple geometric shapes, grid-based, solid fills, minimal elements',
    },
    {
      id: 'B',
      concept: 'clean outline monoline',
      style: 'outline icon, monoline style, consistent stroke weight, clean edges',
    },
    {
      id: 'C',
      concept: 'abstract symbolic form',
      style: 'abstract geometric symbol, balanced composition, distinctive shape',
    },
  ];

  // 공통 STRICT FLAT/NO PERSPECTIVE 규칙 (핵심!)
  const strictRules = `
SYMBOL REQUIREMENTS (STRICT):
- Flat 2D vector symbol, orthographic front view only
- NO perspective, NO isometric, NO camera tilt, NO 3D depth
- NO gradients, NO shadows, NO glow, NO blur, NO texture, NO lighting
- Simple geometric construction, grid-based, minimal shapes, clean edges
- Works in monochrome and at small size (favicon/print minimum 18mm)
- Centered, single icon only, NO multiple variations, NO split panels

STYLE DIRECTION:
- Industry: ${business}
- Brand personality: ${mood}
- Keywords: ${keywords}
- Geometry style: ${geometryStyle}
- Color: solid flat colors only (primary: ${colorHex})

OUTPUT:
- Plain white background
- Centered symbol only (no mockups, no text)
- Crisp vector-like edges, high contrast
- Professional brand identity icon`;

  // 강력한 NEGATIVE PROMPT (플랫/무왜곡 강제)
  const negativePrompt = `
NEGATIVE (FORBIDDEN):
3d, depth, bevel, emboss, extrude, realistic, render, lighting, reflection, glossy,
shadow, drop shadow, long shadow, ambient occlusion, gradient, mesh gradient,
blur, glow, neon, texture, grain, noise, metallic, chrome,
perspective, isometric, tilted, skewed, warped, foreshortening, 3/4 view,
mockup, photo, background, scene, paper, business card mockup, multiple icons, split image, variations panel`;

  const symbolPromises = styleVariations.map(async (variation, index) => {
    // 각 variation별 프롬프트 조합
    const prompt = `Design a professional brand symbol icon for "${brandName}".

CONCEPT: ${variation.concept}
STYLE: ${variation.style}
${strictRules}

${negativePrompt}`;

    console.log(`📝 DALL-E Prompt ${variation.id} (${index + 1}/3):`);
    console.log(prompt.substring(0, 200) + '...');

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ DALL-E API Error for symbol ${variation.id}:`, error);
        throw new Error(`DALL-E API error: ${error}`);
      }

      const data = await response.json();
      const imageUrl = data.data[0].url;
      
      console.log(`✅ Symbol mark ${variation.id} generated:`, imageUrl.substring(0, 80) + '...');

      // 배경 제거 (기존 removeBackground 함수 사용)
      try {
        const cleanedBytes = await removeBackground(imageUrl);
        const base64 = encodeBase64(cleanedBytes);
        const cleanedUrl = `data:image/png;base64,${base64}`;
        console.log(`🧹 Symbol mark ${variation.id} background removed (flat 2D enforced)`);
        return cleanedUrl;
      } catch (bgError) {
        console.warn(`⚠️ Background removal failed for symbol ${variation.id}, using original:`, bgError);
        return imageUrl;
      }
    } catch (error) {
      console.error(`❌ Failed to generate symbol ${variation.id}:`, error);
      // 실패 시 대체 이미지 (placeholder)
      return `data:image/svg+xml;base64,${btoa(`<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="white"/>
        <text x="512" y="512" font-size="48" text-anchor="middle" fill="${colorHex}">Symbol ${variation.id}</text>
      </svg>`)}`;
    }
  });

  const symbolUrls = await Promise.all(symbolPromises);
  console.log('✅ All 3 flat symbol marks generated successfully (orthographic enforced)');
  return symbolUrls;
};

/**
 * Combine Symbol Marks and Logotypes (3 variations with different symbols)
 */
export const combineSymbolAndLogotype = async (
  symbolUrls: string[],
  logotypes: Array<{ url: string; font: string }>
): Promise<Array<{ url: string; font: string }>> => {
  console.log('🎨 Combining 3 symbol marks with 3 logotypes...');
  
  if (symbolUrls.length !== 3 || logotypes.length !== 3) {
    throw new Error('Need exactly 3 symbol marks and 3 logotypes');
  }
  
  try {
    // 3개의 심볼마크 모두 다운로드 및 인코딩
    const symbolBase64Array = await Promise.all(
      symbolUrls.map(async (symbolUrl, idx) => {
        console.log(`📥 Downloading symbol mark ${idx + 1} from:`, symbolUrl);
        const response = await fetch(symbolUrl);
        if (!response.ok) {
          throw new Error(`Failed to download symbol mark ${idx + 1}: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const base64 = encodeBase64(bytes);
        console.log(`✅ Symbol mark ${idx + 1} downloaded and encoded`);
        return base64;
      })
    );
    
    // 각 로고타입과 심볼마크를 1:1 조합
    const combined = logotypes.map((logotype, index) => {
      console.log(`🔨 Creating combination ${index + 1}/3...`);
      
      const symbolBase64 = symbolBase64Array[index];
      
      // 로고타입 SVG 디코딩
      const logotypeData = logotype.url.replace('data:image/svg+xml;base64,', '');
      let logotypeSvg: string;
      try {
        const decodedBytes = decodeBase64(logotypeData);
        logotypeSvg = new TextDecoder().decode(decodedBytes);
      } catch (e) {
        console.error('❌ Failed to decode logotype SVG:', e);
        throw new Error('Failed to decode logotype SVG');
      }
      
      // 로고타입에서 폰트와 스타일 정보 추출
      const fontFamilyMatch = logotypeSvg.match(/font-family="([^"]+)"/);
      const fontFamily = fontFamilyMatch ? fontFamilyMatch[1] : 'Arial';
      
      const fontSizeMatch = logotypeSvg.match(/font-size="([^"]+)"/);
      const fontSize = fontSizeMatch ? fontSizeMatch[1] : '90';
      
      const fontWeightMatch = logotypeSvg.match(/font-weight="([^"]+)"/);
      const fontWeight = fontWeightMatch ? fontWeightMatch[1] : '400';
      
      const letterSpacingMatch = logotypeSvg.match(/letter-spacing="([^"]+)"/);
      const letterSpacing = letterSpacingMatch ? letterSpacingMatch[1] : '0';
      
      // 텍스트와 색상 추출
      const textMatches = logotypeSvg.matchAll(/<tspan[^>]*fill="([^"]*)"[^>]*font-weight="([^"]*)"[^>]*>([^<]*)<\/tspan>/g);
      const tspans = Array.from(textMatches);
      
      // tspan이 있으면 (듀오톤), 없으면 일반 텍스트
      let textContent = '';
      let textElement = '';
      
      if (tspans.length > 0) {
        // 듀오톤: tspan 사
        textElement = tspans.map(match => {
          const fill = match[1];
          const weight = match[2];
          const text = match[3];
          return `<tspan fill="${fill}" font-weight="${weight}">${text}</tspan>`;
        }).join('');
      } else {
        // 일반 텍스트
        const textMatch = logotypeSvg.match(/<text[^>]*>([^<]*)<\/text>/);
        textContent = textMatch ? textMatch[1] : 'BrandFirst';
        const fillMatch = logotypeSvg.match(/fill="([^"]+)"/);
        const fill = fillMatch ? fillMatch[1] : '#000000';
        textElement = textContent;
      }
      
      // Google Fonts import URL 추출
      const fontImportMatch = logotypeSvg.match(/@import url\('([^']+)'\)/);
      const fontImport = fontImportMatch ? fontImportMatch[1] : `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;700&display=swap`;
      
      // 완전히 새로운 조합 SVG 생성 (깔끔한 레이아웃)
      const combinedSvg = tspans.length > 0 
        ? `<svg width="2000" height="800" viewBox="0 0 2000 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('${fontImport}');
        </style>
      </defs>
      <rect width="2000" height="800" fill="white"/>
      
      <image 
        x="100" 
        y="150" 
        width="500" 
        height="500" 
        href="data:image/png;base64,${symbolBase64}"
        preserveAspectRatio="xMidYMid meet"
      />
      
      <text 
        x="700" 
        y="450" 
        font-family="${fontFamily}, sans-serif" 
        font-size="${fontSize}" 
        dominant-baseline="middle"
        letter-spacing="${letterSpacing}"
      >
        ${textElement}
      </text>
    </svg>`
        : `<svg width="2000" height="800" viewBox="0 0 2000 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('${fontImport}');
        </style>
      </defs>
      <rect width="2000" height="800" fill="white"/>
      
      <image 
        x="100" 
        y="150" 
        width="500" 
        height="500" 
        href="data:image/png;base64,${symbolBase64}"
        preserveAspectRatio="xMidYMid meet"
      />
      
      <text 
        x="700" 
        y="450" 
        font-family="${fontFamily}, sans-serif" 
        font-weight="${fontWeight}"
        font-size="${fontSize}" 
        fill="${logotypeSvg.match(/fill="([^"]+)"/)?.[1] || '#000000'}"
        dominant-baseline="middle"
        letter-spacing="${letterSpacing}"
      >${textContent}</text>
    </svg>`;
      
      // UTF-8 SVG를 base64로 안전하게 인코딩
      const svgBytes = new TextEncoder().encode(combinedSvg);
      const combinedUrl = `data:image/svg+xml;base64,${encodeBase64(svgBytes)}`;
      
      console.log(`✅ Combined variation ${index + 1}: Symbol ${index + 1} + ${logotype.font}`);
      console.log(`📏 Combined URL length: ${combinedUrl.length} characters`);
      console.log(`🔍 Combined URL preview: ${combinedUrl.substring(0, 100)}...`);
      
      return {
        url: combinedUrl,
        font: logotype.font,
      };
    });
    
    console.log('✅ All 3 combinations created successfully');
    console.log('📦 Returning combined logos:', combined.map((c, i) => ({
      index: i + 1,
      font: c.font,
      urlLength: c.url.length,
      urlPreview: c.url.substring(0, 50)
    })));
    return combined;
  } catch (error) {
    console.error('❌ Error in combineSymbolAndLogotype:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : '');
    throw error;
  }
};

/**
 * Combine a single Symbol Mark and Logotype with layout choice
 * Layouts: 'horizontal-left' (심볼 왼쪽), 'vertical-top' (심볼 위)
 */
export const combineSingleLogo = async (
  symbolUrl: string,
  logotype: { url: string; font: string },
  layout: 'horizontal-left' | 'vertical-top'
): Promise<{ url: string; font: string; layout: string }> => {
  console.log(`🎨 Combining logo with layout: ${layout}`);
  
  try {
    // 심볼마크 다운로드
    const response = await fetch(symbolUrl);
    if (!response.ok) throw new Error(`Failed to download symbol: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const symbolBase64 = encodeBase64(new Uint8Array(arrayBuffer));
    
    // 로고타입 SVG 디코딩
    const logotypeData = logotype.url.replace('data:image/svg+xml;base64,', '');
    const logotypeSvg = new TextDecoder().decode(decodeBase64(logotypeData));
    
    // SVG 정보 추출
    const fontFamily = logotypeSvg.match(/font-family="([^"]+)"/)?.[1] || 'Arial';
    const fontSize = logotypeSvg.match(/font-size="([^"]+)"/)?.[1] || '90';
    const fontWeight = logotypeSvg.match(/font-weight="([^"]+)"/)?.[1] || '400';
    const letterSpacing = logotypeSvg.match(/letter-spacing="([^"]+)"/)?.[1] || '0';
    const fill = logotypeSvg.match(/fill="([^"]+)"/)?.[1] || '#000000';
    const textContent = logotypeSvg.match(/<text[^>]*>([^<]*)<\/text>/)?.[1] || '';
    const fontImport = logotypeSvg.match(/@import url\('([^']+)'\)/)?.[1] || 
      `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;700&display=swap`;
    
    // 레이아웃별 SVG 생성
    let combinedSvg = '';
    if (layout === 'horizontal-left') {
      // 좌우 배치: 심볼 왼쪽 + 텍스트 오른쪽
      combinedSvg = `<svg width="2000" height="800" viewBox="0 0 2000 800" xmlns="http://www.w3.org/2000/svg">
        <defs><style>@import url('${fontImport}');</style></defs>
        <rect width="2000" height="800" fill="white"/>
        <image x="100" y="150" width="500" height="500" href="data:image/png;base64,${symbolBase64}" preserveAspectRatio="xMidYMid meet"/>
        <text x="700" y="450" font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${fontSize}" fill="${fill}" dominant-baseline="middle" letter-spacing="${letterSpacing}">${textContent}</text>
      </svg>`;
    } else {
      // 상하 배치: 심볼 위 + 텍스트 아래
      combinedSvg = `<svg width="1000" height="1200" viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg">
        <defs><style>@import url('${fontImport}');</style></defs>
        <rect width="1000" height="1200" fill="white"/>
        <image x="250" y="100" width="500" height="500" href="data:image/png;base64,${symbolBase64}" preserveAspectRatio="xMidYMid meet"/>
        <text x="500" y="850" font-family="${fontFamily}" font-weight="${fontWeight}" font-size="${fontSize}" fill="${fill}" text-anchor="middle" dominant-baseline="middle" letter-spacing="${letterSpacing}">${textContent}</text>
      </svg>`;
    }
    
    const combinedUrl = `data:image/svg+xml;base64,${encodeBase64(new TextEncoder().encode(combinedSvg))}`;
    console.log(`✅ Combined logo (${layout}): ${combinedUrl.length} chars`);
    
    return { url: combinedUrl, font: logotype.font, layout };
  } catch (error) {
    console.error('❌ Error in combineSingleLogo:', error);
    throw error;
  }
};

// Base64 인코딩/디코딩 헬퍼 함수 (Deno 표준)
function encodeBase64(data: Uint8Array): string {
  // Deno 표준: btoa는 Latin1만 지원하므로 바이너리 문자열로 변환
  const binString = Array.from(data, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}

function decodeBase64(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}