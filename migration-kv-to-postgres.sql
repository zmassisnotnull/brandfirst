-- ============================================
-- KV Store → Postgres 마이그레이션 스크립트
-- kv_store_45024be7 테이블에서 데이터 추출하여 새 테이블로 이동
-- ============================================

-- 참고: 이 스크립트는 Supabase SQL Editor에서 실행하세요
-- 실행 전 반드시 백업을 권장합니다!

BEGIN;

-- ============================================
-- 1. 크레딧 데이터 마이그레이션
-- Key 패턴: credits:{userId}
-- ============================================

INSERT INTO user_credits (user_id, credits, package_id, created_at, updated_at)
SELECT 
  (regexp_match(key, '^credits:(.+)$'))[1]::uuid AS user_id,
  COALESCE((value->>'credits')::integer, (value->>'value')::integer, 100) AS credits,
  value->>'package' AS package_id,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at,
  NOW() AS updated_at
FROM kv_store_45024be7
WHERE key LIKE 'credits:%'
ON CONFLICT (user_id) 
DO UPDATE SET 
  credits = EXCLUDED.credits,
  package_id = EXCLUDED.package_id,
  updated_at = NOW();

-- package:{userId} 패턴도 확인
INSERT INTO user_credits (user_id, package_id, created_at, updated_at)
SELECT 
  (regexp_match(key, '^package:(.+)$'))[1]::uuid AS user_id,
  value::text AS package_id,
  NOW() AS created_at,
  NOW() AS updated_at
FROM kv_store_45024be7
WHERE key LIKE 'package:%'
ON CONFLICT (user_id) 
DO UPDATE SET 
  package_id = EXCLUDED.package_id,
  updated_at = NOW();

-- ============================================
-- 2. 로고 데이터 마이그레이션
-- Key 패턴: logo:{userId}:{timestamp} 또는 {userId}:logo:{id}
-- ============================================

INSERT INTO logos (
  user_id, logo_url, brand_name, business, mood, color, 
  logo_type, font, font_family, font_color, weight, spacing, 
  transform, is_duotone, secondary_color, created_at
)
SELECT DISTINCT ON (value->>'logoUrl', (regexp_match(key, '([a-f0-9-]{36})'))[1])
  (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid AS user_id,
  value->>'logoUrl' AS logo_url,
  value->>'brandName' AS brand_name,
  value->>'business' AS business,
  value->>'mood' AS mood,
  value->>'color' AS color,
  value->>'logoType' AS logo_type,
  value->>'font' AS font,
  value->>'fontFamily' AS font_family,
  value->>'fontColor' AS font_color,
  value->>'weight' AS weight,
  value->>'spacing' AS spacing,
  value->>'transform' AS transform,
  COALESCE((value->>'isDuotone')::boolean, false) AS is_duotone,
  value->>'secondaryColor' AS secondary_color,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at
FROM kv_store_45024be7
WHERE (key LIKE 'logo:%' OR key LIKE '%:logo:%')
  AND value->>'logoUrl' IS NOT NULL
  AND value->>'logoUrl' != ''
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. 브랜드 네이밍 데이터 마이그레이션
-- Key 패턴: naming:{userId}:{timestamp}
-- 스키마: korean_name, name, description, service_category, keywords
-- ============================================

INSERT INTO namings (
  user_id, korean_name, name, description, service_category, keywords, created_at
)
SELECT DISTINCT ON ((value->>'name'), (regexp_match(key, '([a-f0-9-]{36})'))[1])
  (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid AS user_id,
  value->>'koreanName' AS korean_name,
  COALESCE(value->>'name', value->>'brandName') AS name,
  value->>'description' AS description,
  COALESCE(value->>'serviceCategory', value->>'industry') AS service_category,
  CASE 
    WHEN value->>'keywords' IS NOT NULL 
    THEN string_to_array(value->>'keywords', ',')
    ELSE NULL
  END AS keywords,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at
FROM kv_store_45024be7
WHERE key LIKE 'naming:%'
  AND (value->>'name' IS NOT NULL OR value->>'brandName' IS NOT NULL)
  AND COALESCE(value->>'name', value->>'brandName') != ''
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 회사 데이터 마이그레이션
-- Key 패턴: company:{userId}:{companyId}
-- 스키마: name, logo, brand_color, address, phone, fax, website, employee_count
-- ============================================

INSERT INTO companies (
  user_id, name, logo, brand_color, address, phone, fax, website, employee_count, created_at
)
SELECT DISTINCT ON (value->>'name', (regexp_match(key, '([a-f0-9-]{36})'))[1])
  (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid AS user_id,
  COALESCE(value->>'name', value->>'companyName') AS name,
  COALESCE(value->>'logo', value->>'logoUrl') AS logo,
  value->>'brandColor' AS brand_color,
  value->>'address' AS address,
  value->>'phone' AS phone,
  value->>'fax' AS fax,
  value->>'website' AS website,
  COALESCE((value->>'employeeCount')::integer, 0) AS employee_count,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at
FROM kv_store_45024be7
WHERE key LIKE 'company:%'
  AND (value->>'name' IS NOT NULL OR value->>'companyName' IS NOT NULL)
  AND COALESCE(value->>'name', value->>'companyName') != ''
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 연락처 데이터 마이그레이션
-- Key 패턴: contact:{userId}:{contactId}
-- 스키마: name, position, department, mobile, phone, fax, email, website, address
-- ============================================

-- 먼저 회사 ID를 매칭하기 위한 임시 테이블 생성
CREATE TEMP TABLE temp_contact_migration AS
SELECT 
  (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid AS user_id,
  value->>'name' AS contact_name,
  COALESCE(value->>'position', value->>'title') AS position,
  value->>'department' AS department,
  value->>'mobile' AS mobile,
  value->>'phone' AS phone,
  value->>'fax' AS fax,
  value->>'email' AS email,
  value->>'website' AS website,
  value->>'address' AS address,
  COALESCE(value->>'companyName', value->>'company') AS company_name,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at
FROM kv_store_45024be7
WHERE key LIKE 'contact:%'
  AND value->>'name' IS NOT NULL
  AND value->>'name' != '';

-- company_id 매칭하여 contacts에 삽입
INSERT INTO contacts (
  user_id, company_id, name, position, department, mobile, phone, fax, email, website, address, created_at
)
SELECT DISTINCT ON (tcm.contact_name, tcm.email, tcm.user_id)
  tcm.user_id,
  c.id AS company_id,
  tcm.contact_name AS name,
  COALESCE(tcm.position, 'Unknown') AS position, -- position은 NOT NULL
  tcm.department,
  tcm.mobile,
  tcm.phone,
  tcm.fax,
  tcm.email,
  tcm.website,
  tcm.address,
  tcm.created_at
FROM temp_contact_migration tcm
LEFT JOIN companies c 
  ON c.user_id = tcm.user_id 
  AND c.name = tcm.company_name
WHERE c.id IS NOT NULL -- company가 있는 경우만 삽입
ON CONFLICT DO NOTHING;

-- 임시 테이블 삭제
DROP TABLE temp_contact_migration;

-- ============================================
-- 6. 디지털 명함 프로필 데이터 마이그레이션
-- Key 패턴: digital_card_profile:{userId}:{profileId}
-- 스키마: name, title, role, company, tagline, bio, phone, email, website, 
--         location, profile_image, cover_image, theme_color, is_public
-- ============================================

-- 먼저 임시 테이블로 데이터 추출
CREATE TEMP TABLE temp_digital_profile_migration AS
SELECT DISTINCT ON ((regexp_match(key, '([a-f0-9-]{36})'))[1], value->>'name', value->>'email')
  (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid AS user_id,
  value->>'name' AS name,
  COALESCE(value->>'title', 'Professional') AS title,
  value->>'role' AS role,
  COALESCE(value->>'company', 'Company') AS company,
  value->>'tagline' AS tagline,
  value->>'bio' AS bio,
  COALESCE(value->>'phone', '') AS phone,
  COALESCE(value->>'email', '') AS email,
  value->>'website' AS website,
  COALESCE(value->>'location', value->>'address') AS location,
  COALESCE(value->>'profileImage', value->>'profileImageUrl') AS profile_image,
  value->>'coverImage' AS cover_image,
  COALESCE(value->>'themeColor', 'from-blue-500 to-blue-600') AS theme_color,
  COALESCE((value->>'isPublic')::boolean, (value->>'isActive')::boolean, true) AS is_public,
  COALESCE((value->>'createdAt')::timestamptz, NOW()) AS created_at
FROM kv_store_45024be7
WHERE (key LIKE 'digital_card_profile:%' OR key LIKE '%:digital_card:%')
  AND value->>'name' IS NOT NULL
  AND value->>'name' != '';

-- business_cards 테이블에 먼저 삽입 (디지털 명함이 명함 기반일 수 있음)
-- 단, 이 경우는 생략 (명함 데이터가 KV에 없을 수 있음)

-- digital_card_profiles 테이블에 삽입
INSERT INTO digital_card_profiles (
  user_id, business_card_id, name, title, role, company, tagline, bio, 
  phone, email, website, location, profile_image, cover_image, 
  theme_color, is_public, created_at
)
SELECT 
  user_id,
  NULL AS business_card_id, -- 명함 연결은 나중에 수동으로
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
  theme_color,
  is_public,
  created_at
FROM temp_digital_profile_migration
WHERE name IS NOT NULL 
  AND name != ''
  AND title IS NOT NULL
  AND title != ''
  AND company IS NOT NULL
  AND company != ''
  AND phone IS NOT NULL
  AND email IS NOT NULL
ON CONFLICT DO NOTHING;

-- 임시 테이블 삭제
DROP TABLE temp_digital_profile_migration;

COMMIT;

-- ============================================
-- 마이그레이션 결과 확인
-- ============================================

SELECT 'user_credits' AS table_name, COUNT(*) AS row_count FROM user_credits
UNION ALL
SELECT 'logos', COUNT(*) FROM logos
UNION ALL
SELECT 'namings', COUNT(*) FROM namings
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'digital_card_profiles', COUNT(*) FROM digital_card_profiles
ORDER BY table_name;

-- KV store의 원본 데이터 확인
SELECT 
  CASE 
    WHEN key LIKE 'credits:%' THEN 'credits'
    WHEN key LIKE 'package:%' THEN 'package'
    WHEN key LIKE 'logo:%' THEN 'logo'
    WHEN key LIKE '%:logo:%' THEN 'logo'
    WHEN key LIKE 'naming:%' THEN 'naming'
    WHEN key LIKE 'company:%' THEN 'company'
    WHEN key LIKE 'contact:%' THEN 'contact'
    WHEN key LIKE 'digital_card_profile:%' THEN 'digital_card_profile'
    WHEN key LIKE '%:digital_card:%' THEN 'digital_card_profile'
    ELSE 'other'
  END AS data_type,
  COUNT(*) AS kv_count
FROM kv_store_45024be7
GROUP BY data_type
ORDER BY data_type;

-- 샘플 데이터 확인 (각 테이블의 최근 5개)
SELECT '=== USER_CREDITS SAMPLE ===' AS info;
SELECT user_id, credits, package_id, created_at FROM user_credits ORDER BY created_at DESC LIMIT 5;

SELECT '=== LOGOS SAMPLE ===' AS info;
SELECT user_id, brand_name, logo_url, created_at FROM logos ORDER BY created_at DESC LIMIT 5;

SELECT '=== NAMINGS SAMPLE ===' AS info;
SELECT user_id, name, korean_name, service_category, created_at FROM namings ORDER BY created_at DESC LIMIT 5;

SELECT '=== COMPANIES SAMPLE ===' AS info;
SELECT user_id, name, phone, website, created_at FROM companies ORDER BY created_at DESC LIMIT 5;

SELECT '=== CONTACTS SAMPLE ===' AS info;
SELECT user_id, name, position, email, created_at FROM contacts ORDER BY created_at DESC LIMIT 5;

SELECT '=== DIGITAL_CARD_PROFILES SAMPLE ===' AS info;
SELECT user_id, name, title, company, email, created_at FROM digital_card_profiles ORDER BY created_at DESC LIMIT 5;
