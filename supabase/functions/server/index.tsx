import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as auth from './auth.tsx';
import * as pdfGen from './pdf-generator.tsx';
import * as aiGen from './ai-generator.tsx';
import contactsRouter from "./contacts.tsx";
import namingRouter from "./naming.tsx";
import logoRouter from "./logo.tsx";
import digitalCardRouter from "./digital-card.tsx";

const createMockPdfDataUrl = async () => {
  const { PDFDocument, StandardFonts, rgb } = await import('npm:pdf-lib@1.17.1');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([300, 180]);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('MyBrands Print PDF', {
    x: 48,
    y: 94,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  const bytes = await pdfDoc.save();
  const base64 = btoa(String.fromCharCode(...bytes));
  return `data:application/pdf;base64,${base64}`;
};

const createDraftEntries = async () => {
  const proofUrl = await createMockPdfDataUrl();
  return ['A', 'B', 'C'].map((variant) => ({
    variant,
    card_doc_id: crypto.randomUUID(),
    proof_signed_url: proofUrl,
    omitted_fields: [],
    preflight: { ok: true, errors: [] as string[] },
  }));
};

const registerPrintEndpoints = (slug: string) => {
  app.post(`/${slug}/api/card/auto-generate`, async (c) => {
    try {
      const body = await c.req.json();
      const isDoubleSided = Boolean(body?.is_double_sided ?? body?.is_double_sided_override);
      const frontDrafts = await createDraftEntries();
      const backDrafts = isDoubleSided ? await createDraftEntries() : undefined;

      return c.json({
        draft_group_id: crypto.randomUUID(),
        mode: isDoubleSided ? 'professional' : 'starter',
        sides: {
          front: frontDrafts,
          ...(backDrafts ? { back: backDrafts } : {}),
        },
      });
    } catch (error) {
      console.error('auto-generate route error:', error);
      return c.json({ error: '자동 시안 생성 중 오류가 발생했습니다.' }, 500);
    }
  });

  app.post(`/${slug}/api/card/select-and-lock`, async (c) => {
    try {
      const body = await c.req.json();
      const frontCardDocId = body?.front_card_doc_id;

      if (!frontCardDocId) {
        return c.json({ error: 'front_card_doc_id가 필요합니다.' }, 400);
      }

      return c.json({
        chosen_card_doc: { id: frontCardDocId },
        print_export: { id: crypto.randomUUID() },
        signed_url: await createMockPdfDataUrl(),
        deleted_drafts: [crypto.randomUUID(), crypto.randomUUID()],
      });
    } catch (error) {
      console.error('select-and-lock route error:', error);
      return c.json({ error: '시안 확정 중 오류가 발생했습니다.' }, 500);
    }
  });

  app.post(`/${slug}/api/fulfillment/create`, async (c) => {
    try {
      const body = await c.req.json();
      const exportId = body?.export_id;

      if (!exportId) {
        return c.json({ error: 'export_id가 필요합니다.' }, 400);
      }

      return c.json({
        job: {
          id: crypto.randomUUID(),
          status: 'PDF_LOCKED',
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('fulfillment route error:', error);
      return c.json({ error: '출고 요청 생성 중 오류가 발생했습니다.' }, 500);
    }
  });
};

const app = new Hono();

registerPrintEndpoints('make-server-98397747');
registerPrintEndpoints('make-server-45024be7');

// ============================================
// CORS Configuration (CRITICAL - MUST BE FIRST!)
// ============================================

// Handle ALL requests with CORS headers
app.use('*', async (c, next) => {
  // Set CORS headers for all responses
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, x-access-token, X-Access-Token, X-User-Token');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle OPTIONS preflight requests
  if (c.req.method === 'OPTIONS') {
    console.log('🔧 CORS Preflight request received');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-access-token, X-Access-Token, X-User-Token',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  // Continue to next middleware/handler
  await next();
});

// Enable logger
app.use('*', logger(console.log));

// Health check endpoint
app.get("/make-server-98397747/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Test endpoint - no auth required
app.post("/make-server-98397747/test", async (c) => {
  console.log('===== 🧪 TEST ENDPOINT CALLED =====');
  console.log('Method:', c.req.method);
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  try {
    const body = await c.req.json();
    console.log('Body:', body);
    return c.json({ success: true, message: 'Test endpoint working', received: body });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Auth endpoints
app.post("/make-server-98397747/api/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400);
    }

    const { user, error } = await auth.signUp(email, password, name);

    if (error) {
      console.error('Authorization error while signing up user during registration:', error);
      return c.json({ error: error.message || '회원가입에 실패했습니다.' }, 400);
    }

    return c.json({ user, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Server error during signup:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.post("/make-server-98397747/api/auth/signin", async (c) => {
  console.log('===== 🔐 SIGNIN REQUEST =====');
  console.log('Method:', c.req.method);
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  try {
    const body = await c.req.json();
    console.log('📦 Request body:', { email: body.email, password: '***' });
    
    const { email, password } = body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400);
    }

    console.log('🔍 Calling auth.signIn...');
    const { user, session, error } = await auth.signIn(email, password);

    if (error) {
      console.error('❌ Authorization error while signing in user during main login flow:', error);
      return c.json({ error: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.' }, 401);
    }

    console.log('✅ SignIn successful - User:', user?.id, 'Session:', !!session);
    console.log('📤 Returning JSON response...');
    
    return c.json({ user, session, message: '로그인되었습니다.' });
  } catch (error) {
    console.error('❌ Server error during signin:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.post("/make-server-98397747/api/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
    }

    const { error } = await auth.signOut(accessToken);

    if (error) {
      console.error('Authorization error while signing out user:', error);
      return c.json({ error: '로그아웃에 실패했습니다.' }, 400);
    }

    return c.json({ message: '로그아웃되었습니다.' });
  } catch (error) {
    console.error('Server error during signout:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// Initialize user credits after signup
app.post("/make-server-98397747/api/auth/init-user", async (c) => {
  console.log('===== 🎁 INIT USER REQUEST =====');
  
  try {
    const { userId, email, name } = await c.req.json();

    if (!userId || !email) {
      console.log('❌ Missing userId or email');
      return c.json({ error: 'userId와 email은 필수입니다.' }, 400);
    }

    console.log('📝 Initializing user:', { userId, email, name });

    // Get or create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user credits already exist
    const { data: existing, error: checkError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      console.log('✅ User credits already exist');
      return c.json({ message: 'User already initialized', credits: existing });
    }

    // Create user credits with default values
    const { data: newCredits, error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        email: email,
        name: name || '',
        credits: 10, // Default free credits
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create user credits:', insertError);
      throw insertError;
    }

    console.log('✅ User credits created:', newCredits);
    return c.json({ message: 'User initialized successfully', credits: newCredits });
  } catch (error) {
    console.error('❌ Server error during user init:', error);
    return c.json({ error: '사용자 초기화에 실패했습니다.' }, 500);
  }
});

app.get("/make-server-98397747/api/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token') || c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
    }

    const { user, error } = await auth.getUser(accessToken);

    if (error) {
      console.error('Authorization error while getting user info:', error);
      return c.json({ error: '사용자 정보를 가져올 수 없습니다.' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Server error while getting user:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// Credits Management (Postgres)
// ============================================

// Get user credits endpoint (사용자 크레딧 조회)
app.get("/make-server-98397747/api/user/credits", async (c) => {
  console.log('===== 🔍 GET CREDITS REQUEST =====');
  
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      console.log('❌ Missing userId in query');
      return c.json({ error: '사용자 ID가 필요합니다.' }, 400);
    }

    console.log('📊 Getting credits for user:', userId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ✅ Postgres user_credits 테이블에서 조회
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits, package_id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('📊 DB Query Result:', { data, error });

    if (error) {
      console.error('❌ DB error:', error);
      // 레코드가 없으면 자동으로 생성
      if (error.code === 'PGRST116') {
        console.log('⚠️ No credits record found, creating with 100 credits');
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: userId, credits: 100 })
          .select()
          .single();
        
        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }
        
        console.log('✅ Created new credits record:', newData);
        return c.json({ credits: 100, package: null });
      }
      throw error;
    }

    // 데이터가 없는 경우 (maybeSingle이 null 반환)
    if (!data) {
      console.log('⚠️ No credits record found (null), creating with 100 credits');
      const { data: newData, error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: userId, credits: 100 })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw insertError;
      }
      
      console.log('✅ Created new credits record:', newData);
      return c.json({ credits: 100, package: null });
    }

    const creditsNum = data.credits || 0;
    const packageId = data.package_id || null;

    console.log(`✅ User credits from Postgres: ${creditsNum}, package: ${packageId}`);

    return c.json({ 
      credits: creditsNum,
      package: packageId
    });
  } catch (error) {
    console.error('❌ Server error while getting credits:', error);
    return c.json({ error: '서버 오류가 발생했습니다.', details: String(error) }, 500);
  }
});

// 🔧 크레딧 수동 설정 엔드포인트 (관리자/디버깅용)
app.post("/make-server-98397747/api/user/credits/set", async (c) => {
  console.log('===== 🔧 SET CREDITS REQUEST =====');
  
  try {
    const { userId, credits } = await c.req.json();

    if (!userId || credits === undefined) {
      console.log('❌ Missing userId or credits');
      return c.json({ error: 'userId와 credits가 필요합니다.' }, 400);
    }

    console.log(`🔧 Setting credits for user ${userId}: ${credits}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('user_credits')
      .upsert({ 
        user_id: userId, 
        credits: parseInt(credits)
      });

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    console.log(`✅ Credits set successfully: ${credits}`);

    return c.json({ 
      success: true,
      userId,
      credits: parseInt(credits),
      message: `크레딧이 ${credits}로 설정되었습니다.` 
    });
  } catch (error) {
    console.error('Server error while setting credits:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// Get user package endpoint (사용자 패키지 조회)
app.get("/make-server-98397747/api/user/package", async (c) => {
  console.log('===== 🔍 GET PACKAGE REQUEST =====');
  
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      console.log('❌ Missing userId in query');
      return c.json({ error: '사용자 ID가 필요합니다.' }, 400);
    }

    console.log('📦 Getting package for user:', userId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ✅ Postgres user_credits 테이블에서 조회
    const { data, error } = await supabase
      .from('user_credits')
      .select('package_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ DB error:', error);
      throw error;
    }

    const packageId = data?.package_id || null;
    console.log(`✅ User package from Postgres: ${packageId || 'none'}`);

    return c.json({ package: packageId });
  } catch (error) {
    console.error('Server error while getting package:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// Purchase package endpoint (패키지 구매 - 크레딧 추가)
app.post("/make-server-98397747/api/purchase", async (c) => {
  console.log('===== 🔍 PURCHASE REQUEST RECEIVED =====');
  console.log('Method:', c.req.method);
  console.log('URL:', c.req.url);
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  try {
    const body = await c.req.json();
    console.log('📦 Request body:', body);
    
    const { packageId, credits, userId } = body;

    if (!packageId || !credits || !userId) {
      console.log('❌ Missing required fields');
      return c.json({ error: '패키지 정보, 크레딧, 사용자 ID가 필요합니다.' }, 400);
    }

    console.log('📦 Package details:', { userId, packageId, credits });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ✅ Postgres user_credits 테이블에서 현재 크레딧 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits, package_id')
      .eq('user_id', userId)
      .maybeSingle();

    let currentCreditsNum = 0;
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // 레코드가 없으면 0으로 시작
        console.log('⚠️ No existing credits record, starting from 0');
      } else {
        console.error('❌ DB fetch error:', fetchError);
        throw fetchError;
      }
    } else {
      currentCreditsNum = currentData?.credits || 0;
    }

    // Add new credits
    const newCredits = currentCreditsNum + credits;

    // ✅ Postgres user_credits 테이블에 업데이트
    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: newCredits,
        package_id: packageId,
      });

    if (upsertError) {
      console.error('❌ DB upsert error:', upsertError);
      throw upsertError;
    }

    console.log(`✅ 패키지 구매 완료: ${userId} - ${packageId} (${credits} 크레딧)`);
    console.log(`💰 이전 크레딧: ${currentCreditsNum}, 새 크레딧: ${newCredits}`);

    return c.json({ 
      success: true, 
      credits: newCredits,
      package: packageId
    });
  } catch (error: any) {
    console.error('❌ Server error while purchasing package:', error);
    return c.json({ error: '서버 오류가 발생했습니다.', details: String(error) }, 500);
  }
});

// Deduct credits endpoint (크레딧 차감)
app.post("/make-server-98397747/api/deduct-credits", async (c) => {
  console.log('===== 💰 DEDUCT CREDITS REQUEST =====');
  console.log('Headers:', Object.fromEntries(c.req.raw.headers.entries()));
  
  try {
    const body = await c.req.json();
    console.log('📦 Request body:', body);
    
    const { userId, amount, service, serviceType } = body;

    if (!userId || !amount) {
      console.log('❌ Missing required fields');
      return c.json({ error: '사용자 ID와 크레딧 금액이 필요합니다.' }, 400);
    }

    console.log('💳 Deduct details:', { userId, amount, service, serviceType });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ✅ Postgres user_credits 테이블에서 현재 크레딧 조회
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    let currentCreditsNum = 0;
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // 레코드가 없으면 0으로 시작
        console.log('⚠️ No existing credits record, starting from 0');
      } else {
        console.error('❌ DB fetch error:', fetchError);
        throw fetchError;
      }
    } else {
      currentCreditsNum = currentData?.credits || 0;
    }

    console.log(`💰 현재 크레딧: ${currentCreditsNum}, 차감할 크레딧: ${amount}`);

    // Check if user has enough credits
    if (currentCreditsNum < amount) {
      console.log('❌ 크레딧 부족');
      return c.json({ error: '크레딧이 부족합니다.' }, 400);
    }

    // Deduct credits
    const newCredits = currentCreditsNum - amount;
    
    // ✅ Postgres user_credits 테이블에 업데이트
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ DB update error:', updateError);
      throw updateError;
    }

    console.log(`✅ 크레딧 차감 완료: ${userId} - ${service} (${amount} 크레딧)`);
    console.log(`💰 남은 크레딧: ${newCredits}`);

    return c.json({ 
      success: true, 
      remainingCredits: newCredits,
      service,
      serviceType
    });
  } catch (error) {
    console.error('Server error while deducting credits:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// PDF Generation & Analysis
// ============================================

/**
 * Analyze existing business card using OpenAI Vision
 */
app.post("/make-server-98397747/api/analyze-card", async (c) => {
  try {
    console.log('=== Card Analysis Request ===');
    const { imageBase64 } = await c.req.json();

    if (!imageBase64) {
      return c.json({ error: '이미지 데이터가 필요합니다.' }, 400);
    }

    console.log('Image data received, length:', imageBase64.length);
    console.log('Calling OpenAI Vision API...');
    
    // OpenAI Vision API 호출
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      return c.json({ 
        error: 'API 설정이 필요합니다.',
        fallbackMode: true 
      }, 503);
    }

    console.log('OpenAI API key found, making request...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `이 명함 이미지를 분석하여 다음 정보를 JSON 형식으로 추출해주세요:
- name: 이름
- title: 직함/직책
- company: 회사명
- phone: 전화번호
- email: 이메일

정보가 없으면 null을 반환하세요. 오직 JSON만 반환하세요.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error status:', response.status);
      console.error('OpenAI API error response:', errorText);
      
      // Check if it's a quota error
      if (response.status === 429 || errorText.includes('insufficient_quota')) {
        return c.json({
          error: 'AI 분석 서비스 일시적으로 사용 제한에 도달했습니다.',
          errorType: 'quota_exceeded',
          fallbackMode: true,
          suggestion: '수동으로 정보를 입력하거나, 잠시 후 다시 시도해주세요.'
        }, 429);
      }
      
      throw new Error(`OpenAI Vision API 호출 실패: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI API response data:', JSON.stringify(data, null, 2));
    
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response:', data);
      throw new Error('OpenAI 응답이 비어있습니다.');
    }

    console.log('OpenAI response content:', content);

    // JSON 파싱
    let extractedData: Record<string, unknown>;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Content to parse:', content);
      throw new Error('OpenAI 응답을 파싱할 수 없습니다.');
    }

    console.log('Extracted data:', extractedData);
    console.log('=== Card Analysis Success ===');

    return c.json({
      ...extractedData,
      logoUrl: null, // 로고 추출은 추후 구현
    });
  } catch (error: any) {
    console.error('=== Card Analysis Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({
      error: error.message || '명함 분석 중 오류가 발생했습니다.',
      fallbackMode: true
    }, 500);
  }
});

/**
 * Upload user's own logo image
 */
app.post("/make-server-98397747/api/upload/logo", async (c) => {
  try {
    console.log('=== Logo Upload Request ===');
    const accessToken = c.req.header('X-User-Token');
    if (!accessToken) {
      console.log('No access token provided');
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    console.log('Verifying user...');
    const { user, error } = await auth.getUser(accessToken);
    if (!user || error) {
      console.log('User verification failed');
      console.log('Error:', error);
      console.log('User:', user);
      return c.json({ error: error?.message || '인증이 필요합니다.' }, 401);
    }
    console.log('User verified:', user.id);

    console.log('Parsing request body...');
    const body = await c.req.json();
    const { imageData, fileName, contentType } = body;

    if (!imageData || !fileName) {
      console.log('Missing imageData or fileName');
      return c.json({ error: '이미지 파일이 필요합니다.' }, 400);
    }
    console.log('File info:', { fileName, contentType, dataLength: imageData?.length });

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      console.log('Invalid content type:', contentType);
      return c.json({ error: '지원하지 않는 파일 형식입니다. PNG, JPG, SVG, WebP만 가능합니다.' }, 400);
    }

    console.log('Uploading logo for user:', user.id, 'filename:', fileName);

    // Decode base64 image data
    console.log('Decoding base64 data...');
    const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    console.log('Decoded bytes:', imageBytes.length);

    // Save to Supabase Storage
    console.log('Saving to Supabase Storage...');
    const logoUrl = await pdfGen.saveAsset(
      user.id,
      `logo-${fileName}`,
      imageBytes,
      contentType
    );
    console.log('Logo saved successfully:', logoUrl);

    // ✅ Save to Postgres logos table
    console.log('Saving logo metadata to Postgres...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await supabase
      .from('logos')
      .insert({
        user_id: user.id,
        logo_url: logoUrl,
        brand_name: fileName.replace(/\.(png|jpg|jpeg|svg|webp)$/i, ''),
      });
    console.log('Metadata saved to Postgres');

    console.log('=== Logo Upload Success ===');
    return c.json({
      logoUrl,
      message: '로고가 업로드되었습니다.',
    });
  } catch (error: any) {
    console.error('=== Logo Upload Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({
      error: error.message || '로고 업로드 중 오류가 발생했습니다.',
      details: error.toString(),
    }, 500);
  }
});

/**
 * AI 기반 명함 자동 생성
 * 로고와 직업 정보를 기반으로 명함 내용 및 레이아웃을 자동으로 생성
 */
app.post("/make-server-98397747/api/ai/generate-card", async (c) => {
  try {
    const accessToken = c.req.header('X-User-Token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user } = await auth.getUser(accessToken);
    if (!user) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { logoUrl, occupation, userName, companyName, logoWidth, logoHeight } = await c.req.json();

    if (!logoUrl || !occupation) {
      return c.json({ error: '로고와 직업 정보가 필요합니다.' }, 400);
    }

    console.log('AI generating card for:', { occupation, userName, companyName });

    // 1. 로고 분석
    const logoAnalysis = aiGen.analyzeLogo(logoWidth || 400, logoHeight || 400);
    console.log('Logo analysis:', logoAnalysis);

    // 2. AI로 명함 내용 생성
    const cardContent = await aiGen.generateCardContent(occupation, userName, companyName);
    console.log('Generated card content:', cardContent);

    // 3. 로고 레이아웃 계산 (스마트 스케일링)
    const logoLayout = aiGen.calculateLogoLayout(logoAnalysis);
    console.log('Logo layout:', logoLayout);

    // 4. 종합 결과 반환
    return c.json({
      cardContent,
      logoAnalysis,
      logoLayout,
      message: '명함이 자동으로 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('AI card generation error:', error);
    return c.json({ 
      error: error.message || 'AI 명함 생성 중 오류가 발생했습니다.',
      details: error.toString(),
    }, 500);
  }
});

// ============================================
// Logo Generation
// ============================================

/**
 * Generate logo using AI (DALL-E 3)
 */
app.post("/make-server-98397747/api/logo/generate", async (c) => {
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error } = await auth.getUser(accessToken);
    if (!user || error) {
      console.error('❌ Supabase auth error:', error);
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const body = await c.req.json();
    console.log('📦 Logo generation body:', JSON.stringify(body));
    
    const { business, mood, keywords, color, style, count, brandName, logoType } = body;

    // keywords 또는 mood 중 하나는 있어야 함 (하위 호환성)
    const keywordsOrMood = keywords || mood;
    
    console.log('🔍 Validation check:', { business, keywordsOrMood, color, style });
    
    if (!business || !keywordsOrMood || !color || !style) {
      console.log('❌ Validation failed:', { business: !!business, keywordsOrMood: !!keywordsOrMood, color: !!color, style: !!style });
      return c.json({ error: '모든 정보를 입력해주세요.' }, 400);
    }

    console.log('Logo generation request:', { business, keywords: keywordsOrMood, color, style, logoType, brandName });

    // Generate multiple logo variations
    const logoData = {
      industry: business,
      mood: keywordsOrMood,
      color,
      style,
      brandName: brandName || 'Brand',
      logoType: logoType || 'mark', // 'mark', 'logotype', or 'combination'
    };

    const logos = await pdfGen.generateLogoVariations(logoData, count || 4);

    return c.json({
      logos,
      message: '로고가 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('Logo generation error:', error);
    return c.json({
      error: error.message || '로고 생성 중 오류가 발생했습니다.',
    }, 500);
  }
});

/**
 * Save logo permanently to Supabase Storage
 * Downloads DALL-E temporary URL and uploads to Supabase
 */
app.post("/make-server-98397747/api/logo/save-permanent", async (c) => {
  try {
    const accessToken = c.req.header('x-access-token');
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await auth.getUser(accessToken);
    if (authError || !user) {
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    const { logoUrl, brandName, business, keywords, color, style, logoType } = await c.req.json();

    if (!logoUrl) {
      return c.json({ error: '로고 URL이 필요합니다.' }, 400);
    }

    console.log('💾 Saving logo permanently for business card use...');
    console.log('Logo data:', { brandName, business, logoType });

    // 🎨 명함용 고해상도 로고 재생성
    // DALL-E temporary URL을 그대로 쓰지 않고, HD quality로 다시 생성
    let hdLogoUrl = logoUrl;
    
    if (logoUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      console.log('🔥 Regenerating logo in HD quality for printing...');
      
      // 동일한 프롬프트로 HD 재생성
      const logoData = {
        industry: business || 'business',
        mood: keywords || 'professional',
        color: color || 'blue',
        style: style || 'modern',
        brandName: brandName || 'Brand',
        logoType: (logoType as 'mark' | 'logotype' | 'combination') || 'logotype',
      };
      
      hdLogoUrl = await pdfGen.regenerateLogoHighQuality(logoData);
      console.log('✅ HD logo regenerated successfully');
    }

    // Download the HD logo
    const logoResponse = await fetch(hdLogoUrl);
    if (!logoResponse.ok) {
      throw new Error('로고 다운로드에 실패했습니다.');
    }

    const logoBlob = await logoResponse.blob();
    const logoBuffer = await logoBlob.arrayBuffer();

    // Save to Supabase Storage
    const fileName = `logo-hd-${brandName || 'brand'}-${Date.now()}.png`;
    const permanentUrl = await pdfGen.saveAsset(
      user.id,
      fileName,
      new Uint8Array(logoBuffer),
      'image/png'
    );

    console.log('✅ HD logo saved permanently:', permanentUrl);

    return c.json({
      permanentUrl,
      message: '명함용 고해상도 로고가 저장되었습니다.',
    });
  } catch (error: any) {
    console.error('Logo save error:', error);
    return c.json({
      error: error.message || '로고 저장 중 오류가 발생했습니다.',
    }, 500);
  }
});

// ============================================
// Showcase (Logos from Postgres)
// ============================================

// Get recent showcase designs (logos from Postgres)
app.get("/make-server-98397747/api/showcase/recent", async (c) => {
  try {
    console.log('📊 Fetching recent showcase designs...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    // ✅ Postgres logos 테이블에서 조회
    const { data: logoData, error: logoError } = await supabase
      .from('logos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logoError) {
      console.error('❌ Error fetching logos:', logoError);
      return c.json({ logos: [], cards: [], total: 0 });
    }
    
    const logos = (logoData || [])
      .map(logo => ({
        id: logo.id,
        type: 'logo',
        logoUrl: logo.logo_url,
        brandName: logo.brand_name,
        business: logo.business,
        mood: logo.mood,
        color: logo.color,
        font: logo.font,
        fontColor: logo.font_color,
        weight: logo.weight,
        spacing: logo.spacing,
        transform: logo.transform,
        isDuotone: logo.is_duotone,
        secondaryColor: logo.secondary_color,
        created_at: logo.created_at,
      }))
      .slice(0, 3);
    
    // 명함 데이터는 현재 Postgres에 없으므로 빈 배열
    const cards: any[] = [];
    
    console.log(`✅ Found ${logos.length} logos and ${cards.length} cards`);
    
    return c.json({ 
      logos, 
      cards,
      total: logos.length + cards.length 
    });
  } catch (error) {
    console.error('Error fetching showcase designs:', error);
    return c.json({ error: 'Failed to fetch showcase designs' }, 500);
  }
});

// ============================================
// AI Prompt Execution
// ============================================

// AI Prompt Execution API
app.post("/make-server-98397747/api/ai/prompt", async (c) => {
  try {
    console.log('🎯 AI Prompt Execution Request');
    
    const { prompt, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 4000 } = await c.req.json();
    
    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found');
      return c.json({ error: 'API key not configured' }, 503);
    }
    
    console.log('Calling OpenAI API...');
    console.log('Model:', model);
    console.log('Temperature:', temperature);
    console.log('Prompt length:', prompt.length);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens,
        response_format: { type: 'json_object' },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return c.json({ error: 'AI service error', details: error }, 500);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    
    console.log('✅ AI response received');
    console.log('Response length:', content.length);
    
    return c.json({
      content,
      model: result.model,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error('❌ Prompt execution error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// ============================================
// Routers (Modular endpoints)
// ============================================

// Add contacts router
app.route('/make-server-98397747/api/contacts', contactsRouter);
app.route('/make-server-98397747', contactsRouter);
app.route('/make-server-45024be7', contactsRouter);

// Add naming router
app.route('/make-server-98397747/api/naming', namingRouter);

// Add logo router
app.route('/make-server-98397747/api/logo', logoRouter);

// Add digital card router
app.route('/make-server-98397747/api/digital-card', digitalCardRouter);
app.route('/make-server-45024be7/api/digital-card', digitalCardRouter);

// ============================================
// Start Server
// ============================================

Deno.serve(app.fetch);
