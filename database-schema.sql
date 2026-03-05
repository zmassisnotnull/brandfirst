-- ============================================
-- MyBrands.ai 통합 데이터베이스 스키마
-- Print + QR Card 통합 관리
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

CREATE TRIGGER trigger_update_user_credits_timestamp
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_user_credits_timestamp();

-- ============================================
-- Print 관련 테이블
-- ============================================

-- 2. 로고 테이블
CREATE TABLE IF NOT EXISTS logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT NOT NULL,
  brand_name TEXT,
  business TEXT,
  mood TEXT,
  color TEXT,
  logo_type TEXT, -- 'mark', 'logotype', 'combination'
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

CREATE INDEX idx_logos_user_id ON logos(user_id);
CREATE INDEX idx_logos_created_at ON logos(created_at DESC);

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

CREATE INDEX idx_namings_user_id ON namings(user_id);
CREATE INDEX idx_namings_created_at ON namings(created_at DESC);

-- 4. 회사 테이블 (Contacts - 명함첩)
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

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);

-- 5. 연락처 테이블 (Contacts - 명함첩)
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

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);

-- 4. 명함 테이블
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
  card_type TEXT, -- 'starter', 'professional', 'rebuilder'
  pdf_url TEXT,
  image_url TEXT,
  card_data JSONB, -- 전체 명함 데이터 (레이아웃, 색상 등)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX idx_business_cards_logo_id ON business_cards(logo_id);
CREATE INDEX idx_business_cards_created_at ON business_cards(created_at DESC);

-- ============================================
-- QR Card (디지털 명함) 관련 테이블
-- ============================================

-- 5. 디지털 명함 프로필 테이블
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

CREATE INDEX idx_digital_profiles_user_id ON digital_card_profiles(user_id);
CREATE INDEX idx_digital_profiles_is_public ON digital_card_profiles(is_public);
CREATE INDEX idx_digital_profiles_created_at ON digital_card_profiles(created_at DESC);

-- 6. 소셜 링크 테이블
CREATE TABLE IF NOT EXISTS digital_card_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'linkedin', 'twitter', etc.
  url TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, platform)
);

CREATE INDEX idx_social_links_profile_id ON digital_card_social_links(profile_id);

-- 7. 커스텀 필드 테이블 (최대 3개)
CREATE TABLE IF NOT EXISTS digital_card_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_custom_fields_profile_id ON digital_card_custom_fields(profile_id);

-- 커스텀 필드 개수 제한 (최대 3개)
CREATE OR REPLACE FUNCTION check_custom_fields_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM digital_card_custom_fields WHERE profile_id = NEW.profile_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum 3 custom fields allowed per profile';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_custom_fields_limit
BEFORE INSERT ON digital_card_custom_fields
FOR EACH ROW
EXECUTE FUNCTION check_custom_fields_limit();

-- 8. 디지털 명함 통계 테이블
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

CREATE INDEX idx_stats_profile_id ON digital_card_stats(profile_id);

-- 9. 조회 로그 테이블
CREATE TABLE IF NOT EXISTS digital_card_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES digital_card_profiles(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_view_logs_profile_id ON digital_card_view_logs(profile_id);
CREATE INDEX idx_view_logs_created_at ON digital_card_view_logs(created_at DESC);

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
-- 초기 데이터 및 RLS (Row Level Security)
-- ============================================

-- RLS 활성화
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
CREATE POLICY "Users can view their own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credits"
  ON user_credits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- logos 정책
CREATE POLICY "Users can view their own logos"
  ON logos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logos"
  ON logos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logos"
  ON logos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logos"
  ON logos FOR DELETE
  USING (auth.uid() = user_id);

-- namings 정책
CREATE POLICY "Users can view their own namings"
  ON namings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own namings"
  ON namings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own namings"
  ON namings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own namings"
  ON namings FOR DELETE
  USING (auth.uid() = user_id);

-- companies 정책
CREATE POLICY "Users can view their own companies"
  ON companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON companies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companies"
  ON companies FOR DELETE
  USING (auth.uid() = user_id);

-- contacts 정책
CREATE POLICY "Users can view their own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- business_cards 정책
CREATE POLICY "Users can view their own business cards"
  ON business_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business cards"
  ON business_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business cards"
  ON business_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business cards"
  ON business_cards FOR DELETE
  USING (auth.uid() = user_id);

-- digital_card_profiles 정책
CREATE POLICY "Users can view their own profiles"
  ON digital_card_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by anyone"
  ON digital_card_profiles FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Users can insert their own profiles"
  ON digital_card_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON digital_card_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON digital_card_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- digital_card_social_links 정책
CREATE POLICY "Users can manage their profile social links"
  ON digital_card_social_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_social_links.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

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
CREATE POLICY "Users can manage their profile custom fields"
  ON digital_card_custom_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_custom_fields.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view their profile stats"
  ON digital_card_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM digital_card_profiles
      WHERE digital_card_profiles.id = digital_card_stats.profile_id
      AND digital_card_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can update stats"
  ON digital_card_stats FOR UPDATE
  USING (auth.jwt()->>'role' = 'service_role');

-- digital_card_view_logs 정책
CREATE POLICY "Anyone can insert view logs"
  ON digital_card_view_logs FOR INSERT
  WITH CHECK (TRUE);

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
-- 인덱스 최적화
-- ============================================

-- 복합 인덱스 추가
CREATE INDEX idx_logos_user_brand ON logos(user_id, brand_name);
CREATE INDEX idx_namings_user_name ON namings(user_id, name);
CREATE INDEX idx_business_cards_user_company ON business_cards(user_id, company);
CREATE INDEX idx_digital_profiles_user_public ON digital_card_profiles(user_id, is_public);

-- ============================================
-- 완료
-- ============================================

COMMENT ON TABLE user_credits IS 'Print + QR Card 통합 크레딧 관리';
COMMENT ON TABLE logos IS 'Print - 로고 저장소';
COMMENT ON TABLE namings IS 'Print - 네이밍 저장소';
COMMENT ON TABLE companies IS 'Print - 회사 저장소';
COMMENT ON TABLE contacts IS 'Print - 연락처 저장소';
COMMENT ON TABLE business_cards IS 'Print - 명함 저장소';
COMMENT ON TABLE digital_card_profiles IS 'QR Card - 디지털 명함 프로필';
COMMENT ON TABLE digital_card_social_links IS 'QR Card - 소셜 미디어 링크';
COMMENT ON TABLE digital_card_custom_fields IS 'QR Card - 커스텀 필드 (최대 3개)';
COMMENT ON TABLE digital_card_stats IS 'QR Card - 통계 (조회수, 공유, 저장)';
COMMENT ON TABLE digital_card_view_logs IS 'QR Card - 조회 로그';