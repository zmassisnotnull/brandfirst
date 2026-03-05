// ============================================
// MyBrands.ai Edge Function - Standalone Version
// All modules combined into a single file for Supabase Dashboard deployment
// ============================================

import { Hono } from 'npm:hono';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// ============================================
// Environment Variables
// ============================================

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// ============================================
// Auth Module (inline)
// ============================================

const authSignUp = async (email: string, password: string, name: string) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    // Initialize user credits
    if (data.user) {
      await supabase
        .from('user_credits')
        .insert({
          user_id: data.user.id,
          email: email,
          name: name,
          credits: 100,
          package_id: null,
        });
      console.log(`✅ Initial 100 credits granted to user ${data.user.id}`);
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign up exception:', error);
    return { user: null, error };
  }
};

const authSignIn = async (email: string, password: string) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    return { 
      user: data.user, 
      session: data.session,
      error: null 
    };
  } catch (error) {
    console.error('Sign in exception:', error);
    return { user: null, session: null, error };
  }
};

const authGetUser = async (accessToken: string) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      return { user: null, error };
    }
    
    if (!user) {
      return { user: null, error: new Error('Invalid token') };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('❌ Get user exception:', error);
    return { user: null, error };
  }
};

const authSignOut = async (accessToken: string) => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { error };
  }
};

// ============================================
// CORS Configuration
// ============================================

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token, X-Access-Token, X-User-Token, apikey, x-client-info');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    console.log('🔧 CORS Preflight request received');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-access-token, X-Access-Token, X-User-Token, apikey, x-client-info',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  await next();
});

app.use('*', logger(console.log));

// ============================================
// Health Check
// ============================================

app.get("/make-server-98397747/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============================================
// Auth Endpoints
// ============================================

app.post("/make-server-98397747/api/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400);
    }

    const { user, error } = await authSignUp(email, password, name);

    if (error) {
      console.error('Authorization error while signing up user:', error);
      return c.json({ error: '회원가입에 실패했습니다.' }, 400);
    }

    return c.json({ user, message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Server error during signup:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.post("/make-server-98397747/api/auth/signin", async (c) => {
  console.log('===== 🔐 SIGNIN REQUEST =====');
  
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400);
    }

    const { user, session, error } = await authSignIn(email, password);

    if (error) {
      console.error('❌ Login failed:', error);
      return c.json({ error: '로그인에 실패했습니다.' }, 401);
    }

    console.log('✅ SignIn successful');
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

    const { error } = await authSignOut(accessToken);

    if (error) {
      return c.json({ error: '로그아웃에 실패했습니다.' }, 400);
    }

    return c.json({ message: '로그아웃되었습니다.' });
  } catch (error) {
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.get("/make-server-98397747/api/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token') || c.req.header('Authorization')?.split(' ')[1];

    if (!accessToken) {
      return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
    }

    const { user, error } = await authGetUser(accessToken);

    if (error) {
      return c.json({ error: '사용자 정보를 가져올 수 없습니다.' }, 401);
    }

    return c.json({ user });
  } catch (error) {
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// Credits Management
// ============================================

app.get("/make-server-98397747/api/user/credits", async (c) => {
  console.log('===== 🔍 GET CREDITS REQUEST =====');
  
  try {
    const userId = c.req.query('userId');

    if (!userId) {
      return c.json({ error: '사용자 ID가 필요합니다.' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits, package_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create initial credits
      const { data: newData, error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: userId, credits: 100 })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      return c.json({ credits: 100, package: null });
    }

    return c.json({ 
      credits: data.credits || 0,
      package: data.package_id || null
    });
  } catch (error) {
    console.error('❌ Error getting credits:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.post("/make-server-98397747/api/purchase", async (c) => {
  console.log('===== 💳 PURCHASE REQUEST =====');
  
  try {
    const { packageId, credits, userId } = await c.req.json();

    if (!packageId || !credits || !userId) {
      return c.json({ error: '필수 정보가 누락되었습니다.' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    const currentCredits = currentData?.credits || 0;
    const newCredits = currentCredits + credits;

    const { error: upsertError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        credits: newCredits,
        package_id: packageId,
      });

    if (upsertError) throw upsertError;

    console.log(`✅ Purchase complete: ${credits} credits added`);

    return c.json({ 
      success: true, 
      credits: newCredits,
      package: packageId
    });
  } catch (error) {
    console.error('❌ Purchase error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

app.post("/make-server-98397747/api/deduct-credits", async (c) => {
  console.log('===== 💰 DEDUCT CREDITS REQUEST =====');
  
  try {
    const { userId, amount, service, serviceType } = await c.req.json();

    if (!userId || !amount) {
      return c.json({ error: '필수 정보가 누락되었습니다.' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    const currentCredits = currentData?.credits || 0;

    if (currentCredits < amount) {
      return c.json({ error: '크레딧이 부족합니다.' }, 400);
    }

    const newCredits = currentCredits - amount;
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: newCredits })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log(`✅ Credits deducted: ${amount}`);

    return c.json({ 
      success: true, 
      remainingCredits: newCredits,
      service,
      serviceType
    });
  } catch (error) {
    console.error('❌ Deduct credits error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// AI Logo Generation (Simplified)
// ============================================

app.post("/make-server-98397747/api/logo/generate", async (c) => {
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error } = await authGetUser(accessToken);
    if (!user || error) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { business, mood, keywords, color, style, brandName } = await c.req.json();
    
    if (!business || !(mood || keywords) || !color || !style) {
      return c.json({ error: '모든 정보를 입력해주세요.' }, 400);
    }

    // Simplified: Return placeholder response
    // Full implementation would call DALL-E API
    console.log('Logo generation request:', { business, mood: mood || keywords, color, style });

    return c.json({
      logos: [
        { id: '1', url: 'https://placehold.co/400x400/png', prompt: 'Logo 1' },
        { id: '2', url: 'https://placehold.co/400x400/png', prompt: 'Logo 2' },
        { id: '3', url: 'https://placehold.co/400x400/png', prompt: 'Logo 3' },
        { id: '4', url: 'https://placehold.co/400x400/png', prompt: 'Logo 4' },
      ],
      message: '로고가 생성되었습니다.',
    });
  } catch (error: any) {
    console.error('Logo generation error:', error);
    return c.json({ error: '로고 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// Showcase
// ============================================

app.get("/make-server-98397747/api/showcase/recent", async (c) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: logoData, error: logoError } = await supabase
      .from('logos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logoError) {
      return c.json({ logos: [], cards: [], total: 0 });
    }
    
    const logos = (logoData || []).map(logo => ({
      id: logo.id,
      type: 'logo',
      logoUrl: logo.logo_url,
      brandName: logo.brand_name,
      created_at: logo.created_at,
    }));
    
    return c.json({ 
      logos, 
      cards: [],
      total: logos.length 
    });
  } catch (error) {
    console.error('Showcase error:', error);
    return c.json({ error: 'Failed to fetch showcase' }, 500);
  }
});

// ============================================
// Start Server
// ============================================

Deno.serve(app.fetch);