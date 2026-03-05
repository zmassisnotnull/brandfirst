import { createClient } from 'npm:@supabase/supabase-js@2';
import * as jose from 'npm:jose@5';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const signUp = async (email: string, password: string, name: string) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    // ✅ 회원가입 시 Postgres user_credits 테이블에 초기 크레딧 100개 부여
    if (data.user) {
      await supabase
        .from('user_credits')
        .insert({
          user_id: data.user.id,
          credits: 100,
          package_id: null,
        });
      console.log(`✅ Initial 100 credits granted to user ${data.user.id} in Postgres table`);
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign up exception:', error);
    return { user: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

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

export const getUser = async (accessToken: string) => {
  console.log('🔐 getUser called with token:', accessToken?.substring(0, 30) + '...');
  
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
  
  console.log('🔐 Using ANON_KEY with Authorization header');

  try {
    console.log('🔐 Calling supabase.auth.getUser()...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('🔐 getUser result - User:', user?.id, 'Error:', error);
    
    if (error) {
      console.error('❌ Supabase auth error:', error);
      console.error('❌ Error message:', error.message);
      return { user: null, error };
    }
    
    if (!user) {
      console.log('❌ No user found in token');
      return { user: null, error: new Error('Invalid token') };
    }
    
    console.log('✅ User authenticated:', user.id, user.email);
    return { user, error: null };
  } catch (error) {
    console.error('❌ Get user exception:', error);
    return { user: null, error };
  }
};

export const signOut = async (accessToken: string) => {
  const supabase = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY')!
  );

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Sign out exception:', error);
    return { error };
  }
};