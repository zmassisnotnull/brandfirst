import { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Download,
  MessageSquare,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { downloadVCard } from '../utils/vcard';
import { projectId } from '../../../utils/supabase/info';

interface PublicProfileProps {
  profileId: string;
}

interface Profile {
  id: string;
  name: string;
  title: string;
  company: string;
  tagline: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  profileImage?: string;
  coverImage?: string;
  themeColor: string;
  socialLinks: SocialLink[];
}

interface SocialLink {
  platform: string;
  url: string;
  enabled: boolean;
}

const iconMap: Record<string, any> = {
  'LinkedIn': Linkedin,
  'GitHub': Github,
  'Twitter': Twitter,
  'Instagram': Instagram,
};

// ✅ 기본 데모 프로필 (모바일에서도 볼 수 있도록)
const DEFAULT_PROFILES: Record<string, any> = {
  '1': {
    id: '1',
    name: '김철수',
    title: 'Software Engineer',
    company: 'BrandFirst.ai',
    tagline: '사용자 경험을 혁신합니다',
    bio: 'AI와 디자인의 경계에서 새로운 가능성을 탐구하는 풀스택 개발자입니다.',
    phone: '010-1234-5678',
    email: 'hello@brandfirst.ai',
    website: 'brandfirst.ai',
    location: 'Seoul, South Korea',
    themeColor: 'from-blue-500 to-blue-600',
    socialLinks: [
      { platform: 'LinkedIn', url: 'linkedin.com/in/example', enabled: true },
      { platform: 'GitHub', url: 'github.com/example', enabled: true },
      { platform: 'Twitter', url: 'twitter.com/example', enabled: false },
      { platform: 'Instagram', url: 'instagram.com/example', enabled: true },
    ],
  },
  '2': {
    id: '2',
    name: '김철수 (부업)',
    title: 'UI/UX Designer',
    company: 'Freelance',
    tagline: '디자인으로 세상을 바꿉니다',
    bio: '사용자 중심의 아름다운 경험을 만드는 디자이너입니다.',
    phone: '010-1234-5678',
    email: 'design@brandfirst.ai',
    website: 'portfolio.brandfirst.ai',
    location: 'Seoul, South Korea',
    themeColor: 'from-purple-500 to-pink-600',
    socialLinks: [
      { platform: 'LinkedIn', url: 'linkedin.com/in/designer', enabled: true },
      { platform: 'Instagram', url: 'instagram.com/designer', enabled: true },
      { platform: 'Twitter', url: 'twitter.com/designer', enabled: false },
      { platform: 'GitHub', url: '', enabled: false },
    ],
  },
};

export function PublicProfile({ profileId }: PublicProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTracked, setViewTracked] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ 백엔드 API에서 프로필 로드
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card/profiles/${profileId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // API 실패 시 기본 데모 프로필 사용
        console.log('API failed, using default profile');
        const defaultProfile = DEFAULT_PROFILES[profileId];
        if (defaultProfile) {
          const loadedProfile = {
            ...defaultProfile,
            socialLinks: defaultProfile.socialLinks.map((link: any) => ({
              ...link,
              icon: iconMap[link.platform] || null,
            })),
          };
          
          setProfile(loadedProfile);
        } else {
          setError('프로필을 찾을 수 없습니다.');
        }
        return;
      }

      const data = await response.json();
      console.log('Loaded profile from API:', data);

      if (data.profile) {
        // API에서 로드한 프로필
        const loadedProfile = {
          ...data.profile,
          socialLinks: (data.profile.socialLinks || []).map((link: any) => ({
            ...link,
            icon: iconMap[link.platform] || null,
          })),
        };
        
        setProfile(loadedProfile);
      } else {
        // 프로필 없으면 기본 데모 사용
        const defaultProfile = DEFAULT_PROFILES[profileId];
        if (defaultProfile) {
          const loadedProfile = {
            ...defaultProfile,
            socialLinks: defaultProfile.socialLinks.map((link: any) => ({
              ...link,
              icon: iconMap[link.platform] || null,
            })),
          };
          
          setProfile(loadedProfile);
        } else {
          setError('프로필을 찾을 수 없습니다.');
        }
      }
    } catch (err) {
      console.error('프로필 로드 에러:', err);
      
      // 에러 발생 시 기본 데모 프로필 사용
      const defaultProfile = DEFAULT_PROFILES[profileId];
      if (defaultProfile) {
        const loadedProfile = {
          ...defaultProfile,
          socialLinks: defaultProfile.socialLinks.map((link: any) => ({
            ...link,
            icon: iconMap[link.platform] || null,
          })),
        };
        
        setProfile(loadedProfile);
      } else {
        setError('프로필을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const trackView = useCallback(async () => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card/track`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            action: 'view',
          }),
        }
      );
    } catch (err) {
      console.warn('Failed to track view:', err);
    }
  }, [profileId]);

  // Track view on mount
  useEffect(() => {
    if (profile && !viewTracked) {
      trackView();
      setViewTracked(true);
    }
  }, [profile, trackView, viewTracked]);

  const trackAction = async (action: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card/track`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileId,
            action,
          }),
        }
      );
    } catch (err) {
      console.warn(`Failed to track ${action}:`, err);
    }
  };

  const handleVCardDownload = () => {
    if (!profile) return;
    
    trackAction('save');
    
    downloadVCard({
      name: profile.name,
      title: profile.title,
      company: profile.company,
      phone: profile.phone,
      email: profile.email,
      website: profile.website,
      address: profile.location,
    });
  };

  const handleLinkClick = (linkType: string) => {
    trackAction(`click_${linkType}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            프로필을 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            {error || '요청하신 프로필이 존재하지 않거나 삭제되었습니다.'}
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 px-4">
      <div className="max-w-lg w-full">
        {/* Mobile Card Design */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* Cover Image / Gradient Header */}
          <div className={`relative h-56 bg-gradient-to-br ${profile.themeColor}`}>
            {profile.coverImage ? (
              <img 
                src={profile.coverImage} 
                alt="Cover" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
            
            {/* Profile Section */}
            <div className="relative h-full flex flex-col items-center justify-center px-6">
              {/* Profile Image */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-2xl bg-white/30 backdrop-blur-md shadow-xl overflow-hidden flex items-center justify-center border-4 border-white/50">
                  {profile.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-12 h-12 text-white/80" />
                  )}
                </div>
              </div>

              {/* Name and Title */}
              <h1 className="text-2xl font-bold text-white text-center mb-1">
                {profile.name}
              </h1>
              <p className="text-white/90 text-center font-medium">
                {profile.title}
              </p>
              {profile.company && (
                <p className="text-white/80 text-center text-sm mt-1">
                  {profile.company}
                </p>
              )}
            </div>
          </div>

          {/* White Card Content */}
          <div className="bg-white px-6 pb-8 pt-6">
            {/* Tagline */}
            {profile.tagline && (
              <div className="text-center mb-6 py-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-700 font-medium">
                  {profile.tagline}
                </p>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-gray-600 text-sm leading-relaxed text-center">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  onClick={() => handleLinkClick('phone')}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  전화하기
                </a>
              )}
              {profile.phone && (
                <a
                  href={`sms:${profile.phone}`}
                  onClick={() => handleLinkClick('sms')}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  문자하기
                </a>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  onClick={() => handleLinkClick('email')}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  이메일
                </a>
              )}
              <button 
                type="button"
                onClick={handleVCardDownload}
                className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                연락처 저장
              </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              {profile.phone && (
                <div className="flex items-center gap-3 text-sm py-2">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <a 
                    href={`tel:${profile.phone}`}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {profile.phone}
                  </a>
                </div>
              )}
              {profile.email && (
                <div className="flex items-center gap-3 text-sm py-2">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <a 
                    href={`mailto:${profile.email}`}
                    className="text-gray-700 hover:text-blue-600 transition-colors break-all"
                  >
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3 text-sm py-2">
                  <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <a 
                    href={`https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick('website')}
                    className="text-gray-700 hover:text-blue-600 transition-colors break-all"
                  >
                    {profile.website}
                  </a>
                </div>
              )}
              {profile.location && (
                <div className="flex items-center gap-3 text-sm py-2">
                  <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700">{profile.location}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {profile.socialLinks.filter(link => link.enabled).length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  소셜 미디어
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {profile.socialLinks
                    .filter(link => link.enabled)
                    .map((link) => {
                      const Icon = iconMap[link.platform];
                      return (
                        <a
                          key={`${link.platform}-${link.url}`}
                          href={`https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleLinkClick(`social_${link.platform.toLowerCase()}`)}
                          className="flex items-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          {Icon && <Icon className="w-5 h-5" />}
                          <span className="font-medium flex-1">{link.platform}</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-6 text-center">
              {/* VCF 저장 버튼 */}
              <button 
                type="button"
                onClick={handleVCardDownload}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-900 py-3 px-6 rounded-xl font-medium border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <Download className="w-4 h-4" />
                VCF 포맷 저장
              </button>
              
              <p className="text-xs text-gray-500">
                Powered by{' '}
                <a
                  href="/"
                  className="inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text"
                  style={{ 
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}
                >
                  BrandFirst.ai
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Create Your Own CTA */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block"
          >
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              나만의 디지털 명함 만들기
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
