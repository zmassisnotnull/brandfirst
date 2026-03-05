-- ============================================
-- MyBrands.ai 완전 설치 + KV 마이그레이션 통합 스크립트
-- 1. 모든 테이블 생성
-- 2. KV store에서 데이터 마이그레이션
-- ============================================

-- ============================================
-- PART 1: 테이블 생성
-- ============================================

-- 1. 사용자 크레딧 테이블
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 100,
  package_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 크레딧 업데이트 시 자동으로 updated_at 갱신
CREATE OR REPLACE FUNCTION update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_credits_timestamp ON user_credits;
CREATE TRIGGER trigger_update_user_credits_timestamp
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_user_credits_timestamp();

-- 2. 로고 테이블
CREATE TABLE IF NOT EXISTS logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT NOT NULL,
  brand_name TEXT,
  business TEXT,
  mood TEXT,
  color TEXT,
  logo_type TEXT,
  font TEXT,
  font_family TEXT,
  font_color TEXT,
  weight TEXT,
  spacing TEXT,
  transform TEXT,
  is_duotone BOOLEAN DEFAULT FALSE,
  secondary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logos_user_id ON logos(user_id);
CREATE INDEX IF NOT EXISTS idx_logos_created_at ON logos(created_at DESC);

-- 3. 네이밍 테이블
CREATE TABLE IF NOT EXISTS namings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  korean_name TEXT,
  name TEXT NOT NULL,
  description TEXT,
  service_category TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_namings_user_id ON namings(user_id);
CREATE INDEX IF NOT EXISTS idx_namings_created_at ON namings(created_at DESC);

-- 4. 회사 테이블
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo TEXT,
  brand_color TEXT,
  address TEXT,
  phone TEXT,
  fax TEXT,
  website TEXT,
  employee_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- 5. 연락처 테이블
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  mobile TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- 6. 명함 테이블
CREATE TABLE IF NOT EXISTS business_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_id UUID REFERENCES logos(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  address TEXT,
  logo_url TEXT,
  card_type TEXT,
  pdf_url TEXT,
  image_url TEXT,
  card_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_logo_id ON business_cards(logo_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_created_at ON business_cards(created_at DESC);

-- 7. 디지털 명함 프로필 테이블
CREATE TABLE IF NOT EXISTS digital_card_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_card_id UUID REFERENCES business_cards(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT,
  company TEXT NOT NULL,
  tagline TEXT,
  bio TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  location TEXT,
  profile_image TEXT,
  cover_image TEXT,
  theme_color TEXT DEFAULT 'from-blue-500 to-blue-600',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digital_profiles_user_id ON digital_card_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_profiles_is_public ON digital_card_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_digital_profiles_created_at ON digital_card_profiles(created_at DESC);

-- 8. 소셜 링크 테이블
CREATE TABLE IF NOT EXISTS digital_card_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_links_profile_id ON digital_card_social_links(profile_id);

-- 9. 커스텀 필드 테이블
CREATE TABLE IF NOT EXISTS digital_card_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_profile_id ON digital_card_custom_fields(profile_id);

-- 커스텀 필드 개수 제한 함수
CREATE OR REPLACE FUNCTION check_custom_fields_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM digital_card_custom_fields WHERE profile_id = NEW.profile_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 custom fields allowed per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_custom_fields_limit ON digital_card_custom_fields;
CREATE TRIGGER trigger_check_custom_fields_limit
BEFORE INSERT ON digital_card_custom_fields
FOR EACH ROW
EXECUTE FUNCTION check_custom_fields_limit();

-- 10. 디지털 명함 통계 테이블
CREATE TABLE IF NOT EXISTS digital_card_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stats_profile_id ON digital_card_stats(profile_id);

-- 11. 조회 로그 테이블
CREATE TABLE IF NOT EXISTS digital_card_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_view_logs_profile_id ON digital_card_view_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_created_at ON digital_card_view_logs(created_at DESC);

-- ============================================
-- 트리거 및 함수
-- ============================================

-- 디지털 명함 프로필 생성 시 자동으로 통계 레코드 생성
CREATE OR REPLACE FUNCTION create_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO digital_card_stats (profile_id, views, shares, saves, link_clicks)
  VALUES (NEW.id, 0, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile_stats ON digital_card_profiles;
CREATE TRIGGER trigger_create_profile_stats
AFTER INSERT ON digital_card_profiles
FOR EACH ROW
EXECUTE FUNCTION create_profile_stats();

-- 디지털 명함 프로필 생성 시 자동으로 기본 소셜 링크 생성
CREATE OR REPLACE FUNCTION create_default_social_links()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO digital_card_social_links (profile_id, platform, url, enabled, sort_order)
  VALUES 
    (NEW.id, 'instagram', '', FALSE, 0),
    (NEW.id, 'linkedin', '', FALSE, 1),
    (NEW.id, 'twitter', '', FALSE, 2),
    (NEW.id, 'facebook', '', FALSE, 3),
    (NEW.id, 'youtube', '', FALSE, 4),
    (NEW.id, 'github', '', FALSE, 5),
    (NEW.id, 'behance', '', FALSE, 6),
    (NEW.id, 'dribbble', '', FALSE, 7);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_social_links ON digital_card_profiles;
CREATE TRIGGER trigger_create_default_social_links
AFTER INSERT ON digital_card_profiles
FOR EACH ROW
EXECUTE FUNCTION create_default_social_links();

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE digital_card_stats
  SET views = views + 1, updated_at = NOW()
  WHERE digital_card_stats.profile_id = increment_profile_views.profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE namings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_card_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_card_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_card_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_card_view_logs ENABLE ROW LEVEL SECURITY;

-- user_credits 정책
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own credits" ON user_credits;
CREATE POLICY "Users can update their own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all credits" ON user_credits;
CREATE POLICY "Service role can manage all credits"
  ON user_credits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- logos 정책
DROP POLICY IF EXISTS "Users can view their own logos" ON logos;
CREATE POLICY "Users can view their own logos"
  ON logos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own logos" ON logos;
CREATE POLICY "Users can insert their own logos"
  ON logos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own logos" ON logos;
CREATE POLICY "Users can update their own logos"
  ON logos FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own logos" ON logos;
CREATE POLICY "Users can delete their own logos"
  ON logos FOR DELETE
  USING (auth.uid() = user_id);

-- namings 정책
DROP POLICY IF EXISTS "Users can view their own namings" ON namings;
CREATE POLICY "Users can view their own namings"
  ON namings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own namings" ON namings;
CREATE POLICY "Users can insert their own namings"
  ON namings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own namings" ON namings;
CREATE POLICY "Users can update their own namings"
  ON namings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own namings" ON namings;
CREATE POLICY "Users can delete their own namings"
  ON namings FOR DELETE
  USING (auth.uid() = user_id);

-- companies 정책
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;
CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own companies" ON companies;
CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own companies" ON companies;
CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own companies" ON companies;
CREATE POLICY "Users can delete their own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- contacts 정책
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON contacts;
CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- business_cards 정책
DROP POLICY IF EXISTS "Users can view their own business cards" ON business_cards;
CREATE POLICY "Users can view their own business cards"
  ON business_cards FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own business cards" ON business_cards;
CREATE POLICY "Users can insert their own business cards"
  ON business_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own business cards" ON business_cards;
CREATE POLICY "Users can update their own business cards"
  ON business_cards FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own business cards" ON business_cards;
CREATE POLICY "Users can delete their own business cards"
  ON business_cards FOR DELETE
  USING (auth.uid() = user_id);

-- digital_card_profiles 정책
DROP POLICY IF EXISTS "Users can view their own profiles" ON digital_card_profiles;
CREATE POLICY "Users can view their own profiles"
  ON digital_card_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON digital_card_profiles;
CREATE POLICY "Public profiles are viewable by anyone"
  ON digital_card_profiles FOR SELECT
  USING (is_public = TRUE);

DROP POLICY IF EXISTS "Users can insert their own profiles" ON digital_card_profiles;
CREATE POLICY "Users can insert their own profiles"
  ON digital_card_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profiles" ON digital_card_profiles;
CREATE POLICY "Users can update their own profiles"
  ON digital_card_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profiles" ON digital_card_profiles;
CREATE POLICY "Users can delete their own profiles"
  ON digital_card_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- digital_card_social_links 정책
DROP POLICY IF EXISTS "Users can manage their profile social links" ON digital_card_social_links;
CREATE POLICY "Users can manage their profile social links"
  ON digital_card_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_social_links.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public profile social links are viewable" ON digital_card_social_links;
CREATE POLICY "Public profile social links are viewable"
  ON digital_card_social_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_social_links.profile_id
      AND digital_card_profiles.is_public = TRUE
    )
  );

-- digital_card_custom_fields 정책
DROP POLICY IF EXISTS "Users can manage their profile custom fields" ON digital_card_custom_fields;
CREATE POLICY "Users can manage their profile custom fields"
  ON digital_card_custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_custom_fields.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Public profile custom fields are viewable" ON digital_card_custom_fields;
CREATE POLICY "Public profile custom fields are viewable"
  ON digital_card_custom_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_custom_fields.profile_id
      AND digital_card_profiles.is_public = TRUE
    )
  );

-- digital_card_stats 정책
DROP POLICY IF EXISTS "Users can view their profile stats" ON digital_card_stats;
CREATE POLICY "Users can view their profile stats"
  ON digital_card_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_stats.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can update stats" ON digital_card_stats;
CREATE POLICY "Service role can update stats"
  ON digital_card_stats FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- digital_card_view_logs 정책
DROP POLICY IF EXISTS "Anyone can insert view logs" ON digital_card_view_logs;
CREATE POLICY "Anyone can insert view logs"
  ON digital_card_view_logs FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view their profile logs" ON digital_card_view_logs;
CREATE POLICY "Users can view their profile logs"
  ON digital_card_view_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_view_logs.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

-- ============================================
-- 복합 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_logos_user_brand ON logos(user_id, brand_name);
CREATE INDEX IF NOT EXISTS idx_namings_user_name ON namings(user_id, name);
CREATE INDEX IF NOT EXISTS idx_business_cards_user_company ON business_cards(user_id, company);
CREATE INDEX IF NOT EXISTS idx_digital_profiles_user_public ON digital_card_profiles(user_id, is_public);

-- ============================================
-- PART 2: KV Store 데이터 마이그레이션
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '테이블 생성 완료! 이제 KV Store 마이그레이션 시작...';
  RAISE NOTICE '============================================';
END $$;

BEGIN;

-- 1. 크레딧 데이터 마이그레이션
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

-- 2. 로고 데이터 마이그레이션
INSERT INTO logos (
  user_id, logo_url, brand_name, business, mood, color, 
  logo_type, font, font_family, font_color, weight, spacing, 
  transform, is_duotone, secondary_color, created_at
)
SELECT DISTINCT ON (value->>'logoUrl', COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid))
  COALESCE(
    (value->>'userId')::uuid,
    (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid
  ) AS user_id,
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
  AND COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid) IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. 네이밍 데이터 마이그레이션
INSERT INTO namings (
  user_id, korean_name, name, description, service_category, keywords, created_at
)
SELECT DISTINCT ON ((value->>'name'), COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid))
  COALESCE(
    (value->>'userId')::uuid,
    (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid
  ) AS user_id,
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
  AND COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid) IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. 회사 데이터 마이그레이션
INSERT INTO companies (
  user_id, name, logo, brand_color, address, phone, fax, website, employee_count, created_at
)
SELECT DISTINCT ON (value->>'name', COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid))
  COALESCE(
    (value->>'userId')::uuid,
    (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid
  ) AS user_id,
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
  AND COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid) IS NOT NULL
ON CONFLICT DO NOTHING;

-- 5. 연락처 데이터 마이그레이션
CREATE TEMP TABLE temp_contact_migration AS
SELECT 
  COALESCE(
    (value->>'userId')::uuid,
    (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid
  ) AS user_id,
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
  AND value->>'name' != ''
  AND COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid) IS NOT NULL;

INSERT INTO contacts (
  user_id, company_id, name, position, department, mobile, phone, fax, email, website, address, created_at
)
SELECT DISTINCT ON (tcm.contact_name, tcm.email, tcm.user_id)
  tcm.user_id,
  c.id AS company_id,
  tcm.contact_name AS name,
  COALESCE(tcm.position, 'Unknown') AS position,
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
WHERE c.id IS NOT NULL
ON CONFLICT DO NOTHING;

DROP TABLE temp_contact_migration;

-- 6. 디지털 명함 프로필 데이터 마이그레이션
CREATE TEMP TABLE temp_digital_profile_migration AS
SELECT DISTINCT ON (COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid), value->>'name', value->>'email')
  COALESCE(
    (value->>'userId')::uuid,
    (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid
  ) AS user_id,
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
  AND value->>'name' != ''
  AND COALESCE((value->>'userId')::uuid, (regexp_match(key, '([a-f0-9-]{36})'))[1]::uuid) IS NOT NULL;

INSERT INTO digital_card_profiles (
  user_id, business_card_id, name, title, role, company, tagline, bio, 
  phone, email, website, location, profile_image, cover_image, 
  theme_color, is_public, created_at
)
SELECT 
  user_id,
  NULL AS business_card_id,
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

DROP TABLE temp_digital_profile_migration;

COMMIT;

-- ============================================
-- 마이그레이션 결과 확인
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '마이그레이션 완료!';
  RAISE NOTICE '============================================';
END $$;

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

-- KV store 원본 데이터 통계
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