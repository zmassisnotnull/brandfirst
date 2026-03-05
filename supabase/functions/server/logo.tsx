import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as pdfGen from './pdf-generator.tsx';

const app = new Hono();

// 하이브리드 로고 생성 (The Starter용 - 서버 폰트 렌더링)
app.post('/generate-hybrid', async (c) => {
  try {
    console.log('🎨 하이브리드 로고 생성 요청 받음');
    
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { brandName, mood, color, style } = await c.req.json();
    
    console.log('📝 요청 데이터:', { brandName, mood, color, style });

    if (!brandName || !mood || !color) {
      return c.json({ error: '모든 정보를 입력해주세요.' }, 400);
    }

    // 하이브리드 로고타입 생성 (SVG 3가지) - userId 전달
    const logos = await pdfGen.generateLogotypeHybrid(brandName, mood, color, style || 'text', user.id);
    
    console.log(`✅ ${logos.length}개 로고 생성 완료`);

    return c.json({
      success: true,
      logos: logos,
    });
  } catch (error) {
    console.error('❌ 하이브리드 로고 생성 에러:', error);
    return c.json({ error: '로고 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// Professional: 심볼마크 + 로고타입 조합 (하이브리드 방식)
app.post('/generate-professional', async (c) => {
  console.log('🎨 Professional 로고 생성 요청 받음 (심볼마크 + 로고타입)');
  
  try {
    const accessToken = c.req.header('x-access-token');
    if (!accessToken) {
      return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { brandName, mood, color, style, business } = await c.req.json();
    
    console.log('📝 요청 데이터:', { brandName, mood, color, style, business });

    if (!brandName || !mood || !color) {
      return c.json({ error: '모든 정보를 입력해주세요.' }, 400);
    }

    try {
      // 1. 하이브리드로 로고타입 3가지 생성 (스타일별로 다른 폰트) - userId 전달
      console.log('🎨 Step 1: 하이브리드로 로고타입 3가지 생성 중...');
      const logotypes = await pdfGen.generateLogotypeHybrid(brandName, mood, color, style || mood, user.id);
      console.log('✅ Step 1 완료: 로고타입 3개 생성됨');
      
      // 2. DALL-E 3로 심볼마크 3개 생성 (각기 다른 스타일)
      console.log('🎨 Step 2: DALL-E 3로 심볼마크 3개 생성 중...');
      const symbolUrls = await pdfGen.generateSymbolMarks(brandName, business || brandName, mood, color, '');
      console.log('✅ Step 2 완료: 심볼마크 3개 생성됨');
      
      console.log('📦 반환 데이터:', {
        symbolMarks: symbolUrls.length,
        logotypes: logotypes.length
      });

      return c.json({
        success: true,
        symbolMarks: symbolUrls,
        logotypes: logotypes,
      });
    } catch (stepError) {
      console.error('❌ Professional 로고 생성 단계 에러:', stepError);
      console.error('❌ 에러 스택:', stepError instanceof Error ? stepError.stack : '');
      return c.json({ 
        error: '로고 생성 중 오류가 발생했습니다.',
        details: stepError instanceof Error ? stepError.message : String(stepError)
      }, 500);
    }
  } catch (error) {
    console.error('❌ Professional 로고 생성 에러:', error);
    console.error('❌ 에러 스택:', error instanceof Error ? error.stack : '');
    return c.json({ 
      error: '로고 생성 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Professional: 심볼마크 + 로고타입 조합
app.post('/combine-logo', async (c) => {
  console.log('🔨 로고 조합 요청 받음');
  
  try {
    const accessToken = c.req.header('x-access-token');
    if (!accessToken) {
      return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { symbolUrl, logotype, layout } = await c.req.json();
    
    console.log('📝 조합 요청:', { 
      hasSymbol: !!symbolUrl, 
      hasLogotype: !!logotype,
      layout 
    });

    if (!symbolUrl || !logotype || !layout) {
      return c.json({ error: '모든 정보를 입력해주세요.' }, 400);
    }

    try {
      // 단일 조합 생성
      const combined = await pdfGen.combineSingleLogo(symbolUrl, logotype, layout);
      
      console.log('✅ 조합 완료');

      return c.json({
        success: true,
        logo: combined,
      });
    } catch (combineError) {
      console.error('❌ 조합 에러:', combineError);
      return c.json({ 
        error: '로고 조합 중 오류가 발생했습니다.',
        details: combineError instanceof Error ? combineError.message : String(combineError)
      }, 500);
    }
  } catch (error) {
    console.error('❌ 로고 조합 에러:', error);
    return c.json({ 
      error: '로고 조합 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 로고 저장
app.post('/save', async (c) => {
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { logoUrl, brandName, business, mood, color, logoType, font, fontFamily, fontColor, weight, spacing, transform, isDuotone, secondaryColor } = await c.req.json();

    if (!logoUrl) {
      return c.json({ error: '로고 URL이 필요합니다.' }, 400);
    }

    // ✅ SQL 테이블에 저장
    const { data, error } = await supabase
      .from('logos')
      .insert({
        user_id: user.id,
        logo_url: logoUrl,
        brand_name: brandName || '',
        business: business || '',
        mood: mood || '',
        color: color || '',
        logo_type: logoType || '',
        font: font || '',
        font_family: fontFamily || '',
        font_color: fontColor || '',
        weight: weight || '',
        spacing: spacing || '',
        transform: transform || '',
        is_duotone: isDuotone || false,
        secondary_color: secondaryColor || '',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    console.log(`✅ Logo saved for user ${user.id}: ${data.id}`);

    return c.json({ 
      success: true,
      message: '로고가 저장되었습니다.',
      logoId: data.id,
    });
  } catch (error) {
    console.error('Error saving logo:', error);
    return c.json({ error: '로고 저장 중 오류가 발생했습니다.' }, 500);
  }
});

// 저장된 로고 조회
app.get('/list', async (c) => {
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    console.log(`📊 로고 조회 시작 - User ID: ${user.id}`);

    // ✅ SQL 테이블에서 조회
    const { data: logos, error } = await supabase
      .from('logos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    console.log(`✅ 조회된 로고 개수: ${logos?.length || 0}`);

    // 프론트엔드와 호환되도록 필드명 변환
    const formattedLogos = (logos || []).map(logo => ({
      logoUrl: logo.logo_url,
      brandName: logo.brand_name,
      business: logo.business,
      mood: logo.mood,
      color: logo.color,
      logoType: logo.logo_type,
      font: logo.font,
      fontFamily: logo.font_family,
      fontColor: logo.font_color,
      weight: logo.weight,
      spacing: logo.spacing,
      transform: logo.transform,
      isDuotone: logo.is_duotone,
      secondaryColor: logo.secondary_color,
      createdAt: logo.created_at,
    }));

    return c.json({ logos: formattedLogos });
  } catch (error) {
    console.error('❌ Error fetching logos:', error);
    return c.json({ error: '로고 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 로고 삭제
app.post('/delete', async (c) => {
  console.log('🚀 [DELETE] Logo delete endpoint called');
  
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.log('❌ [DELETE] No access token');
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (!user || authError) {
      console.log('❌ [DELETE] Auth failed:', authError);
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    console.log('✅ [DELETE] User verified:', user.id);

    const { logoUrl, createdAt } = await c.req.json();

    if (!createdAt) {
      console.log('❌ [DELETE] No createdAt provided');
      return c.json({ error: '로고 정보가 필요합니다.' }, 400);
    }

    console.log('🗑️ [DELETE] 삭제 요청:', { createdAt, userId: user.id });

    // ✅ SQL 테이블에서 삭제
    const { data, error } = await supabase
      .from('logos')
      .delete()
      .eq('user_id', user.id)
      .eq('created_at', createdAt)
      .select();

    if (error) {
      console.error('❌ [DELETE] DB error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.error('❌ 일치하는 로고를 찾을 수 없음');
      return c.json({ error: '로고를 찾을 수 없습니다.' }, 404);
    }

    console.log(`✅ [DELETE] 로고 삭제 완료`);

    return c.json({ success: true, message: '로고가 삭제되었습니다.' });
  } catch (error) {
    console.error('❌ 로고 삭제 오류:', error);
    return c.json({ 
      error: '로고 삭제 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

export default app;