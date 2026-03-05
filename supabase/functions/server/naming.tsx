import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// 서비스 성격별 추천 도메인 매핑
const getIndustryDomains = (serviceType: string): string[] => {
  const type = serviceType.toLowerCase();
  
  if (type.includes('디자인') || type.includes('크리에이티브') || type.includes('디자이너')) {
    return ['design', 'studio'];
  } else if (type.includes('it') || type.includes('기술') || type.includes('개발') || type.includes('소프트웨어') || type.includes('앱')) {
    return ['tech', 'io'];
  } else if (type.includes('교육') || type.includes('학원') || type.includes('강의')) {
    return ['academy', 'education'];
  } else if (type.includes('컨설팅') || type.includes('전문') || type.includes('상담')) {
    return ['consulting', 'expert'];
  } else if (type.includes('쇼핑') || type.includes('커머스') || type.includes('판매')) {
    return ['shop', 'store'];
  } else if (type.includes('미디어') || type.includes('콘텐츠') || type.includes('방송')) {
    return ['media', 'digital'];
  } else if (type.includes('헬스') || type.includes('건강') || type.includes('의료')) {
    return ['health', 'care'];
  } else if (type.includes('금융') || type.includes('투자') || type.includes('자산')) {
    return ['finance', 'capital'];
  } else if (type.includes('부동산') || type.includes('건물')) {
    return ['realty', 'properties'];
  } else if (type.includes('음식') || type.includes('식당') || type.includes('요리')) {
    return ['restaurant', 'cafe'];
  } else if (type.includes('여행') || type.includes('관광')) {
    return ['travel', 'tours'];
  } else if (type.includes('예술') || type.includes('아트')) {
    return ['art', 'gallery'];
  } else if (type.includes('사진') || type.includes('포토')) {
    return ['photo', 'photography'];
  } else if (type.includes('음악')) {
    return ['music', 'sound'];
  } else if (type.includes('스포츠') || type.includes('운동') || type.includes('피트니스')) {
    return ['fitness', 'sports'];
  } else {
    // 기본값: 범용 도메인
    return ['io', 'digital'];
  }
};

// AI 네임 생성
app.post('/generate', async (c) => {
  try {
    const { serviceType, keywords } = await c.req.json();

    if (!serviceType || !keywords) {
      return c.json({ error: '서비스 성격과 키워드를 입력해주세요.' }, 400);
    }

    if (!OPENAI_API_KEY) {
      return c.json({ error: 'OpenAI API 키가 설정되지 않았습니다.' }, 500);
    }

    // GPT-4o를 사용한 네이밍 생성 (프롬프트 개선)
    const prompt = `당신은 브랜드 네이밍 전문가입니다.

서비스 성격: ${serviceType}
키워드: ${keywords}

위 정보를 기반으로 **실제로 .com 도메인을 등록할 수 있는** 브랜드 네임 6개를 생성해주세요.
(최종적으로 3개를 선택하기 위해 여유있게 6개를 생성합니다)

⚠️ 중요 제약 조건:
1. **한글 브랜드명**과 **영문 브랜드명**을 함께 생성
2. 한글: 발음하기 쉬운 2~3음절 (최대 4글자 이내)
3. 영문: 2~3음절 (최대 8자 이내)
4. 기억하기 쉽고 임팩트 있는 이름
5. **매우 독특하고 창의적인 합성어** (일반적인 단어 조합 금지)
6. 서비스 성격을 잘 반영
7. **실제 .com 도메인이 비어있을 확률이 높은 네이밍** - 이것이 가장 중요합니다!
   - 예: Nexify, Blendly, Qruze, Vixio, Zently, Flynk, Pivly 등
   - 피해야 할 예: CloudShop, TechPro, DesignStudio 등 (너무 일반적)

🎯 창의적인 네이밍 전략:
- 관련 단어의 일부를 재조합 (예: Design + Amplify = Damplefy)
- 모음 변형 (예: Create → Kreate, Cloud → Klawd)
- 접미사 활용 (-ify, -ly, -ze, -io, -ux)
- 독특한 철자 (예: Quick → Qwik, Circle → Syrkl)

⚠️ 품질이 양보다 중요합니다. 6개 모두 .com 도메인이 등록 가능할 것 같은 매우 독특한 네이밍을 생성하세요.

각 네임에 대해 다음 JSON 형식으로 응답해주세요:
{
  "names": [
    {
      "koreanName": "넥시파이",
      "name": "Nexify",
      "description": "Next와 Simplify의 합성어로, 다음 단계를 간소화한다는 의미"
    },
    {
      "koreanName": "빅슬리",
      "name": "Vixly",
      "description": "Vivid와 Quickly의 합성어로, 생동감 있고 빠른 서비스를 의미"
    },
    {
      "koreanName": "젠틸리",
      "name": "Zently",
      "description": "Zen과 Gently의 합성어로, 편안하고 쉬운 경험을 제공한다는 의미"
    }
  ]
}

중요: 
- 반드시 유효한 JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 브랜드 네이밍 전문가입니다. 창의적이고 기억하기 쉬운 브랜드 네임을 만들어냅니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error during naming generation:', errorText);
      
      // OpenAI API 할당량 초과 에러 체크
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.code === 'insufficient_quota' || errorJson.error?.type === 'insufficient_quota') {
          return c.json({ 
            error: 'OpenAI API 할당량이 초과되었습니다. 서비스 관리자에게 문의해주세요.' 
          }, 429);
        }
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
      
      return c.json({ error: 'AI 네이밍 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 500);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('OpenAI raw response:', content);

    // JSON 파싱 (마크다운 코드 블록 제거)
    let result;
    try {
      // 마크다운 코드 블록 제거 (```json ... ``` 형식)
      let jsonContent = content.trim();
      
      // 코드 블록으로 감싸져 있으면 제거
      if (jsonContent.startsWith('```')) {
        const lines = jsonContent.split('\n');
        // 첫 줄(```json)과 마지막 줄(```) 제거
        jsonContent = lines.slice(1, -1).join('\n').trim();
      }
      
      // JSON 파싱
      result = JSON.parse(jsonContent);
      console.log('Parsed result:', result);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      console.error('Parse error:', e);
      return c.json({ error: 'AI 응답 파싱에 실패했습니다.' }, 500);
    }

    if (!result.names || !Array.isArray(result.names)) {
      return c.json({ error: '유효하지 않은 응답 형식입니다.' }, 500);
    }

    // ✅ .com 도메인 가용성 체크 추가
    console.log('🔍 .com 도메인 가용성 체크 시작...');
    
    const checkDomainAvailability = async (domain: string): Promise<boolean> => {
      try {
        // DNS lookup 시도
        const result = await Deno.resolveDns(domain, 'A');
        // DNS 레코드가 존재하면 도메인이 사용 중
        return false;
      } catch (error) {
        // DNS 레코드가 없으면 도메인이 사용 가능할 가능성이 높음
        return true;
      }
    };

    // 각 네이밍 .com 도메인 체크
    const validNames = [];
    const fallbackNames = []; // .com은 없만 다른 도메인으로 사용 가능한 네이밍
    
    for (const nameItem of result.names) {
      const domainName = nameItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isComAvailable = await checkDomainAvailability(`${domainName}.com`);
      
      console.log(`  - ${nameItem.name}: .com ${isComAvailable ? '✅ 사용 가능' : '❌ 사용 불가'}`);
      
      if (isComAvailable) {
        validNames.push(nameItem);
      } else {
        // .com은 없지만 백업용으로 저장
        fallbackNames.push(nameItem);
      }
      
      // 3개를 찾으면 중단
      if (validNames.length >= 3) {
        break;
      }
    }

    // .com이 사용 가능한 네이밍이 3개 미만이면 fallback 사용
    let finalNames = validNames;
    
    if (finalNames.length < 3) {
      console.log(`⚠️ .com 사용 가능한 네이밍이 ${finalNames.length}개만 발견됨. 다른 네이밍으로 3개 채웁니다.`);
      
      // 부족한 만큼 fallback에서 추가 (.io, .co.kr 등으로 사용 가능)
      const needed = 3 - finalNames.length;
      finalNames = [...finalNames, ...fallbackNames.slice(0, needed)];
    }

    console.log(`✅ 최종 ${finalNames.length}개 네이밍 반환`);

    return c.json({ names: finalNames });
  } catch (error) {
    console.error('Error generating brand names:', error);
    return c.json({ error: '네이밍 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 도메인 가용성 체크
app.post('/check-domain', async (c) => {
  try {
    const { name, serviceType } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const domainName = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // DNS lookup을 통한 간단한 도메인 체크
    // 실제 도메인 등록 가능 여부가 아닌, DNS 레코드 존재 여부를 확인
    const checkDomainAvailability = async (domain: string): Promise<boolean> => {
      try {
        // DNS lookup 시도
        const result = await Deno.resolveDns(domain, 'A');
        // DNS 레코드가 존재하면 도메인이 사용 중
        return false;
      } catch (error) {
        // DNS 레코드가 없으면 도메인이 사용 가능할 가능성이 높음
        return true;
      }
    };

    // 기본 도메인 3개 + 서비스 성격별 도메인 2개
    const industryDomains = serviceType ? getIndustryDomains(serviceType) : ['io', 'digital'];
    
    // 병렬로 여러 도메인 체크
    const [com, cokr, kr, extra1, extra2] = await Promise.all([
      checkDomainAvailability(`${domainName}.com`),
      checkDomainAvailability(`${domainName}.co.kr`),
      checkDomainAvailability(`${domainName}.kr`),
      checkDomainAvailability(`${domainName}.${industryDomains[0]}`),
      checkDomainAvailability(`${domainName}.${industryDomains[1]}`),
    ]);

    return c.json({
      domains: {
        com,
        cokr,
        kr,
        [industryDomains[0]]: extra1,
        [industryDomains[1]]: extra2,
      },
      industryDomains, // 어떤 도메인을 체크했는지 프론트엔드에 알려줌
    });
  } catch (error) {
    console.error('Error checking domain availability:', error);
    // 에러 발생 시 null 반환 (확인 불가)
    return c.json({
      domains: {
        com: null,
        cokr: null,
        kr: null,
      },
      industryDomains: [],
    });
  }
});

// 상표권 중복 확인
app.post('/check-trademark', async (c) => {
  try {
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // KIPRIS API 연동 (한국 특허청 API)
    // 참고: KIPRIS Open API는 별도 API 키 발급이 필요합니다
    // 여기서는 간단한 텍스트 유사도 검사로 시작합니다
    
    // 실제 구현 시에는 KIPRIS API를 사용해야 합니다:
    // http://plus.kipris.or.kr/openapi/service/openApiServiceInfo.do
    
    // 임시로 간단한 유사도 검사 구현
    const similarityCheck = async (brandName: string) => {
      // 실제로는 KIPRIS API 또는 상표 데이터베이스와 비교
      // 여기서는 간단한 예시로 랜덤 유사도 반환
      
      // 일반적인 어들은 높은 유사도
      const commonWords = ['google', 'apple', 'samsung', 'microsoft', 'amazon', 'facebook', 'nike', 'coca', 'cola'];
      const lowerName = brandName.toLowerCase();
      
      const hasCommonWord = commonWords.some(word => lowerName.includes(word));
      
      if (hasCommonWord) {
        return {
          exists: true,
          similarity: 95,
          warning: '유명 상표와 유사합니다. 사용에 주의가 필요합니다.',
        };
      }
      
      // 그 외에는 사용 가능
      return {
        exists: false,
        similarity: 0,
        warning: null,
      };
    };

    const result = await similarityCheck(name);

    return c.json({
      trademark: result,
    });
  } catch (error) {
    console.error('Error checking trademark:', error);
    return c.json({
      trademark: {
        exists: null,
        similarity: null,
        warning: '상표권 확인 중 오류가 발생했습니다.',
      },
    });
  }
});

// 네이밍 저장
app.post('/save', async (c) => {
  try {
    const accessToken = c.req.header('x-access-token') || c.req.header('Authorization')?.split(' ')[1];
    console.log('🔐 Naming save - Token from:', c.req.header('x-access-token') ? 'x-access-token' : 'Authorization');
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    console.log('🔐 User check result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (!user || authError) {
      console.error('❌ Authentication failed:', authError);
      return c.json({ error: '인증이 필요합니다. 다시 로그인해주세요.' }, 401);
    }

    const { koreanName, name, description, serviceCategory, keywords } = await c.req.json();

    if (!name) {
      return c.json({ error: '네이밍을 입력해주세요.' }, 400);
    }

    // ✅ SQL 테이블에 저장
    const { data, error } = await supabase
      .from('namings')
      .insert({
        user_id: user.id,
        korean_name: koreanName || '',
        name,
        description: description || '',
        service_category: serviceCategory || '',
        keywords: keywords || [],
      })
      .select()
      .single();

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    console.log(`✅ Naming saved for user ${user.id}: ${data.id}`);

    return c.json({ 
      success: true,
      message: '네이밍이 저장되었습니다.',
      namingId: data.id,
    });
  } catch (error) {
    console.error('Error saving naming:', error);
    return c.json({ error: '네이밍 저장 중 오류가 발생했습니다.' }, 500);
  }
});

// 저장된 네이밍 조회
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

    // ✅ SQL 테이블에서 조회
    const { data: namings, error } = await supabase
      .from('namings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    console.log(`✅ Fetched ${namings?.length || 0} namings for user ${user.id}`);

    // 프론트엔드와 호환되도록 필드명 변환
    const formattedNamings = (namings || []).map(naming => ({
      koreanName: naming.korean_name,
      name: naming.name,
      description: naming.description,
      serviceCategory: naming.service_category,
      keywords: naming.keywords,
      createdAt: naming.created_at,
    }));

    return c.json({ namings: formattedNamings });
  } catch (error) {
    console.error('Error fetching namings:', error);
    return c.json({ error: '네이밍 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 네이밍 삭제
app.post('/delete', async (c) => {
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

    const { namingId, createdAt } = await c.req.json();

    if (!createdAt) {
      return c.json({ error: '네이밍 정보가 필요합니다.' }, 400);
    }

    // ✅ SQL 테이블에서 삭제
    const { data, error } = await supabase
      .from('namings')
      .delete()
      .eq('user_id', user.id)
      .eq('created_at', createdAt)
      .select();

    if (error) {
      console.error('❌ DB error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return c.json({ error: '네이밍을 찾을 수 없습니다.' }, 404);
    }

    console.log(`✅ 네이밍 삭제 완료`);

    return c.json({ success: true, message: '네이밍이 삭제되었습니다.' });
  } catch (error) {
    console.error('❌ 네이밍 삭제 오류:', error);
    return c.json({ error: '네이밍 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default app;