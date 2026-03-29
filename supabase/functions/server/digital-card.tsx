import { Hono } from "npm:hono";
import { createClient } from 'npm:@supabase/supabase-js@2';

const digitalCardRouter = new Hono();

// Supabase 클라이언트 생성 헬퍼
function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// 인증 미들웨어
async function authenticateUser(token: string) {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return { user, error };
}

// ============================================
// 1. GET /profiles - 내 프로필 목록 조회
// ============================================
digitalCardRouter.get('/profiles', async (c) => {
  try {
    console.log('=== GET /profiles ===');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await authenticateUser(accessToken);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    console.log('User authenticated:', user.id);

    const supabase = getSupabaseClient();

    // 프로필 조회 (소셜 링크, 커스텀 필드 포함)
    const { data: profiles, error: profilesError } = await supabase
      .from('digital_card_profiles')
      .select(`
        *,
        social_links:digital_card_social_links(*),
        custom_fields:digital_card_custom_fields(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return c.json({ error: '프로필 조회에 실패했습니다.' }, 500);
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    // 소셜 링크 정렬
    const formattedProfiles = profiles?.map(profile => ({
      ...profile,
      socialLinks: (profile.social_links || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      customFields: (profile.custom_fields || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      social_links: undefined,
      custom_fields: undefined,
    })) || [];

    return c.json({ profiles: formattedProfiles });
  } catch (error: any) {
    console.error('GET /profiles error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// 2. GET /profiles/:id - 특정 프로필 조회 (공개 프로필 지원)
// ============================================
digitalCardRouter.get('/profiles/:id', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== GET /profiles/:id ===', profileId);

    const supabase = getSupabaseClient();

    // 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('digital_card_profiles')
      .select(`
        *,
        social_links:digital_card_social_links(*),
        custom_fields:digital_card_custom_fields(*),
        stats:digital_card_stats(*)
      `)
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return c.json({ error: '프로필을 찾을 수 없습니다.' }, 404);
    }

    // 공개 프로필이 아닌 경우 본인 확인
    if (!profile.is_public) {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: '비공개 프로필입니다.' }, 403);
      }

      const { user, error: authError } = await authenticateUser(accessToken);
      if (authError || !user || user.id !== profile.user_id) {
        return c.json({ error: '접근 권한이 없습니다.' }, 403);
      }
    }

    // 포맷팅
    const formattedProfile = {
      ...profile,
      socialLinks: (profile.social_links || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      customFields: (profile.custom_fields || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      stats: profile.stats?.[0] || null,
      social_links: undefined,
      custom_fields: undefined,
    };

    return c.json({ profile: formattedProfile });
  } catch (error: any) {
    console.error('GET /profiles/:id error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// 3. POST /profiles/anonymous - 익명 프로필 생성 (90일 보관)
// ============================================
digitalCardRouter.post('/profiles/anonymous', async (c) => {
  try {
    console.log('=== POST /profiles/anonymous ===');
    const profileData = await c.req.json();
    const supabase = getSupabaseClient();

    const { data: newProfile, error } = await supabase
      .from('digital_card_profiles')
      .insert({
        name: profileData.name,
        title: profileData.title,
        company: profileData.company,
        phone: profileData.phone,
        email: profileData.email,
        profile_image: profileData.profile_image,
        back_image: profileData.back_image, // 뒷면 이미지 추가
        is_public: true,
        user_id: null,
      })
      .select()
      .single();

    if (error) return c.json({ error: '익명 프로필 저장 실패' }, 500);

    return c.json({ 
      success: true, 
      id: newProfile.id,
      message: '90일 동안 보관됩니다.' 
    });
  } catch (error) {
    return c.json({ error: '서버 오류' }, 500);
  }
});

// ============================================
// 4. POST /profiles - 프로필 생성/업데이트
// ============================================
digitalCardRouter.post('/profiles', async (c) => {
  try {
    console.log('=== POST /profiles ===');

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await authenticateUser(accessToken);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    const body = await c.req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      id,
      name,
      title,
      role,
      company,
      tagline,
      bio,
      phone,
      email,
      website,
      location,
      profile_image,
      cover_image,
      back_image,
      theme_color,
      is_public,
      socialLinks,
      customFields,
    } = body;

    // 필수 필드 검증
    if (!name || !title || !company || !phone || !email) {
      return c.json({ error: '필수 필드를 입력해주세요.' }, 400);
    }

    const supabase = getSupabaseClient();

    // ID가 있으면 업데이트, 없으면 생성
    if (id) {
      console.log('Updating profile:', id);

      // 본인 소유 확인
      const { data: existing } = await supabase
        .from('digital_card_profiles')
        .select('user_id')
        .eq('id', id)
        .single();

      if (!existing || existing.user_id !== user.id) {
        return c.json({ error: '권한이 없습니다.' }, 403);
      }

      // 프로필 업데이트
      const { error: updateError } = await supabase
        .from('digital_card_profiles')
        .update({
          name,
          title,
          role,
          company,
          tagline,
          bio,
          phone,
          email,
          website,
          location,
          profile_image,
          cover_image,
          back_image,
          theme_color,
          is_public: is_public !== undefined ? is_public : true,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update error:', updateError);
        return c.json({ error: '프로필 업데이트에 실패했습니다.' }, 500);
      }

      // 소셜 링크 업데이트
      if (socialLinks && Array.isArray(socialLinks)) {
        for (const link of socialLinks) {
          const { error: linkError } = await supabase
            .from('digital_card_social_links')
            .update({
              url: link.url || '',
              enabled: link.enabled || false,
            })
            .eq('profile_id', id)
            .eq('platform', link.platform);

          if (linkError) {
            console.error('Social link update error:', linkError);
          }
        }
      }

      // 커스텀 필드 업데이트 (기존 삭제 후 재생성)
      if (customFields && Array.isArray(customFields)) {
        // 기존 커스텀 필드 삭제
        await supabase
          .from('digital_card_custom_fields')
          .delete()
          .eq('profile_id', id);

        // 새로운 커스텀 필드 생성
        const fieldsToInsert = customFields
          .filter(f => f.label && f.value)
          .slice(0, 3) // 최대 3개
          .map((field, index) => ({
            profile_id: id,
            label: field.label,
            value: field.value,
            sort_order: index,
          }));

        if (fieldsToInsert.length > 0) {
          const { error: fieldsError } = await supabase
            .from('digital_card_custom_fields')
            .insert(fieldsToInsert);

          if (fieldsError) {
            console.error('Custom fields insert error:', fieldsError);
          }
        }
      }

      return c.json({ success: true, id, message: '프로필이 업데이트되었습니다.' });

    } else {
      console.log('Creating new profile');

      // 프로필 생성
      const { data: newProfile, error: insertError } = await supabase
        .from('digital_card_profiles')
        .insert({
          user_id: user.id,
          name,
          title,
          role,
          company,
          tagline,
          bio,
          phone,
          email,
          website,
          location,
          profile_image,
          cover_image,
          back_image,
          theme_color: theme_color || 'from-blue-500 to-blue-600',
          is_public: is_public !== undefined ? is_public : true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return c.json({ error: '프로필 생성에 실패했습니다.' }, 500);
      }

      console.log('Profile created:', newProfile.id);

      // 소셜 링크가 자동 생성되므로 업데이트만 필요
      if (socialLinks && Array.isArray(socialLinks)) {
        for (const link of socialLinks) {
          await supabase
            .from('digital_card_social_links')
            .update({
              url: link.url || '',
              enabled: link.enabled || false,
            })
            .eq('profile_id', newProfile.id)
            .eq('platform', link.platform);
        }
      }

      // 커스텀 필드 생성
      if (customFields && Array.isArray(customFields)) {
        const fieldsToInsert = customFields
          .filter(f => f.label && f.value)
          .slice(0, 3)
          .map((field, index) => ({
            profile_id: newProfile.id,
            label: field.label,
            value: field.value,
            sort_order: index,
          }));

        if (fieldsToInsert.length > 0) {
          await supabase
            .from('digital_card_custom_fields')
            .insert(fieldsToInsert);
        }
      }

      return c.json({ 
        success: true, 
        id: newProfile.id, 
        message: '프로필이 생성되었습니다.' 
      });
    }
  } catch (error: any) {
    console.error('POST /profiles error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// 4. DELETE /profiles/:id - 프로필 삭제
// ============================================
digitalCardRouter.delete('/profiles/:id', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== DELETE /profiles/:id ===', profileId);

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await authenticateUser(accessToken);
    if (authError || !user) {
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    const supabase = getSupabaseClient();

    // 본인 소유 확인
    const { data: profile } = await supabase
      .from('digital_card_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return c.json({ error: '권한이 없습니다.' }, 403);
    }

    // 프로필 삭제 (CASCADE로 관련 데이터 자동 삭제)
    const { error: deleteError } = await supabase
      .from('digital_card_profiles')
      .delete()
      .eq('id', profileId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return c.json({ error: '프로필 삭제에 실패했습니다.' }, 500);
    }

    return c.json({ success: true, message: '프로필이 삭제되었습니다.' });
  } catch (error: any) {
    console.error('DELETE /profiles/:id error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// 5. POST /profiles/:id/view - 조회수 증가
// ============================================
digitalCardRouter.post('/profiles/:id/view', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== POST /profiles/:id/view ===', profileId);

    const supabase = getSupabaseClient();

    // 조회수 증가
    const { error: updateError } = await supabase.rpc('increment_profile_views', {
      profile_id: profileId,
    });

    if (updateError) {
      console.error('View increment error:', updateError);
      // 에러 무시 (조회수는 필수 기능 아님)
    }

    // 조회 로그 생성 (선택사항)
    const body = await c.req.json().catch(() => ({}));
    const { viewer_ip, user_agent, referrer } = body;

    await supabase
      .from('digital_card_view_logs')
      .insert({
        profile_id: profileId,
        viewer_ip,
        user_agent,
        referrer,
      });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('POST /profiles/:id/view error:', error);
    // 조회수 증가 실패는 치명적 오류 아님
    return c.json({ success: true });
  }
});

// ============================================
// 6. GET /profiles/:id/stats - 통계 조회
// ============================================
digitalCardRouter.get('/profiles/:id/stats', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== GET /profiles/:id/stats ===', profileId);

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await authenticateUser(accessToken);
    if (authError || !user) {
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    const supabase = getSupabaseClient();

    // 본인 소유 확인
    const { data: profile } = await supabase
      .from('digital_card_profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return c.json({ error: '권한이 없습니다.' }, 403);
    }

    // 통계 조회
    const { data: stats, error: statsError } = await supabase
      .from('digital_card_stats')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (statsError) {
      console.error('Stats query error:', statsError);
      return c.json({ 
        stats: { views: 0, shares: 0, saves: 0, link_clicks: 0 } 
      });
    }

    return c.json({ stats });
  } catch (error: any) {
    console.error('GET /profiles/:id/stats error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

// ============================================
// 7. POST /profiles/:id/share - 공유 수 증가
// ============================================
digitalCardRouter.post('/profiles/:id/share', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== POST /profiles/:id/share ===', profileId);

    const supabase = getSupabaseClient();

    // 공유 수 증가
    const { error } = await supabase
      .from('digital_card_stats')
      .update({ shares: supabase.raw('shares + 1') })
      .eq('profile_id', profileId);

    if (error) {
      console.error('Share increment error:', error);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('POST /profiles/:id/share error:', error);
    return c.json({ success: true });
  }
});

// ============================================
// 8. POST /profiles/:id/save - 저장 수 증가
// ============================================
digitalCardRouter.post('/profiles/:id/save', async (c) => {
  try {
    const profileId = c.req.param('id');
    console.log('=== POST /profiles/:id/save ===', profileId);

    const supabase = getSupabaseClient();

    // 저장 수 증가
    const { error } = await supabase
      .from('digital_card_stats')
      .update({ saves: supabase.raw('saves + 1') })
      .eq('profile_id', profileId);

    if (error) {
      console.error('Save increment error:', error);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('POST /profiles/:id/save error:', error);
    return c.json({ success: true });
  }
});

// ============================================
// 9. POST /profiles/claim - 익명 프로필 소유권 이전
// ============================================
digitalCardRouter.post('/profiles/claim', async (c) => {
  try {
    console.log('=== POST /profiles/claim ===');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const { user, error: authError } = await authenticateUser(accessToken);
    if (authError || !user) {
      return c.json({ error: '인증에 실패했습니다.' }, 401);
    }

    const { profileIds } = await c.req.json();
    if (!profileIds || !Array.isArray(profileIds)) {
      return c.json({ error: '유효하지 않은 요청입니다.' }, 400);
    }

    const supabase = getSupabaseClient();

    // user_id가 NULL인 프로필들만 현재 사용자의 ID로 업데이트
    const { data: updated, error } = await supabase
      .from('digital_card_profiles')
      .update({ user_id: user.id })
      .in('id', profileIds)
      .is('user_id', null)
      .select();

    if (error) {
      console.error('Claim error:', error);
      return c.json({ error: '소유권 이전에 실패했습니다.' }, 500);
    }

    console.log(`Claimed ${updated?.length || 0} profiles for user ${user.id}`);

    return c.json({ 
      success: true, 
      count: updated?.length || 0,
      message: '모든 익명 명함이 계정에 연결되었습니다.' 
    });
  } catch (error: any) {
    console.error('POST /profiles/claim error:', error);
    return c.json({ error: '서버 오류가 발생했습니다.' }, 500);
  }
});

export default digitalCardRouter;
