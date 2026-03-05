import { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Instagram,
  QrCode,
  Download,
  Share2,
  Edit,
  Camera,
  MessageSquare,
  Eye,
  TrendingUp,
  Users,
  Check,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Footer } from './Footer';
import QRCode from 'qrcode';
import { downloadVCard } from '../utils/vcard';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getSupabaseClient } from '../../../utils/supabase/client';
import { digitalCardApi } from '../services/digitalCardApi';

interface DigitalCardProps {
  onNavigate: (page: string) => void;
}

interface Profile {
  id: string;
  name: string;
  title: string;
  role: string; // ✅ 직무 필드 추가
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
  customFields: CustomField[];
}

interface SocialLink {
  platform: string;
  icon: any;
  url: string;
  enabled: boolean;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
}

interface Stats {
  views: number;
  shares: number;
  saves: number;
  linkClicks: number;
}

export function DigitalCard({ onNavigate }: DigitalCardProps) {
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    views: 1234,
    shares: 89,
    saves: 156,
    linkClicks: 432,
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: '1',
      name: '김철수',
      title: 'Software Engineer',
      role: '개발자', // ✅ 직무 필드 추가
      company: 'MyBrands.ai',
      tagline: '사용자 경험을 혁신합니다',
      bio: 'AI와 디자인의 경계에서 새로운 가능성을 탐구하는 풀스택 개발자입니다.',
      phone: '010-1234-5678',
      email: 'hello@mybrands.ai',
      website: 'mybrands.ai',
      location: 'Seoul, South Korea',
      themeColor: 'from-blue-500 to-blue-600',
      socialLinks: [
        { platform: 'LinkedIn', icon: Linkedin, url: 'linkedin.com/in/example', enabled: true },
        { platform: 'GitHub', icon: Github, url: 'github.com/example', enabled: true },
        { platform: 'Twitter', icon: Twitter, url: 'twitter.com/example', enabled: false },
        { platform: 'Instagram', icon: Instagram, url: 'instagram.com/example', enabled: true },
      ],
      customFields: [
        { id: '1', label: '프로젝트', value: '프로젝트 A' },
        { id: '2', label: '기술 스택', value: 'React, Node.js' },
      ],
    },
    {
      id: '2',
      name: '김철수 (부업)',
      title: 'UI/UX Designer',
      role: '디자이너', // ✅ 직무 필드 추가
      company: 'Freelance',
      tagline: '디자인으로 세상을 바꿉니다',
      bio: '사용자 중심의 아름다운 경험을 만드는 디자이너입니다.',
      phone: '010-1234-5678',
      email: 'design@mybrands.ai',
      website: 'portfolio.mybrands.ai',
      location: 'Seoul, South Korea',
      themeColor: 'from-purple-500 to-pink-600',
      socialLinks: [
        { platform: 'LinkedIn', icon: Linkedin, url: 'linkedin.com/in/designer', enabled: true },
        { platform: 'Instagram', icon: Instagram, url: 'instagram.com/designer', enabled: true },
        { platform: 'Twitter', icon: Twitter, url: 'twitter.com/designer', enabled: false },
        { platform: 'GitHub', icon: Github, url: '', enabled: false },
      ],
      customFields: [
        { id: '1', label: '포트폴리오', value: '포트폴리오 A' },
        { id: '2', label: '디자인 툴', value: 'Adobe XD, Sketch' },
      ],
    },
  ]);

  const currentProfile = profiles[activeProfileIndex];

  useEffect(() => {
    // Generate QR code for current profile
    const profileUrl = `${window.location.origin}?card=${currentProfile.id}`;
    QRCode.toDataURL(profileUrl, { width: 300, margin: 2 })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [currentProfile.id]);

  // Load profiles from backend on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // ✅ 초기 프로필을 localStorage에 저장 (QR 스캔 시 사용)
  useEffect(() => {
    try {
      const serializedProfiles = profiles.map(p => ({
        ...p,
        socialLinks: p.socialLinks.map(link => ({
          platform: link.platform,
          url: link.url,
          enabled: link.enabled,
        })),
      }));
      localStorage.setItem('digital_card_profiles', JSON.stringify(serializedProfiles));
      console.log('✅ Profiles saved to localStorage for QR access');
    } catch (err) {
      console.warn('Failed to save initial profiles to localStorage:', err);
    }
  }, [profiles.length]); // profiles가 로드되면 저장

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      
      // ✅ Supabase에서 직접 세션 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('=== Load Profiles Debug ===');
      console.log('Session exists:', !!session);
      
      if (!session) {
        console.log('No session found, using default profiles');
        setLoadingProfiles(false);
        return;
      }
      
      const accessToken = session.access_token;
      
      if (!accessToken) {
        console.error('No access_token in session');
        setLoadingProfiles(false);
        return;
      }
      
      console.log('Access token found, length:', accessToken.length);
      console.log('Token preview:', accessToken.substring(0, 20) + '...');

      console.log('Calling API...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card/profiles`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('API Response text:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        
        if (data.profiles && data.profiles.length > 0) {
          // Restore icon references
          const loadedProfiles = data.profiles.map((p: any) => ({
            ...p,
            socialLinks: p.socialLinks.map((link: any) => {
              const iconMap: Record<string, any> = {
                'LinkedIn': Linkedin,
                'GitHub': Github,
                'Twitter': Twitter,
                'Instagram': Instagram,
              };
              return {
                ...link,
                icon: iconMap[link.platform] || link.icon,
              };
            }),
          }));
          
          setProfiles(loadedProfiles);
          console.log('Profiles loaded:', loadedProfiles.length);
        }
      } else {
        // If authentication failed, just log it without showing error to user
        console.warn('Failed to load profiles from server:', responseText);
        console.log('Using local/default profiles');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      // Don't show error to user, just use default profiles
    } finally {
      setLoadingProfiles(false);
      console.log('=== Load Profiles Complete ===');
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // ✅ Supabase에서 직접 세션 가져오기
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('Session exists:', !!session);
      
      if (!session) {
        alert('로그인이 필요합니다.');
        return;
      }

      const accessToken = session.access_token;
      
      console.log('Access token:', accessToken?.substring(0, 50));

      // Prepare profile data (remove icon functions for JSON serialization)
      const profileToSave = {
        ...currentProfile,
        socialLinks: currentProfile.socialLinks.map(link => ({
          platform: link.platform,
          url: link.url,
          enabled: link.enabled,
        })),
      };

      console.log('Saving profile:', profileToSave.id);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card/profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(profileToSave),
        }
      );

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        alert('✅ 프로필이 저장되었습니다!');
        console.log('Profile saved:', data);
      } else {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        alert(`저장 실패: ${errorData.error || '알 수 없는 오류'}`);
        console.error('Save error:', errorData);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (updates: Partial<Profile>) => {
    setProfiles(prev => {
      const updated = prev.map((p, i) => 
        i === activeProfileIndex ? { ...p, ...updates } : p
      );
      
      // ✅ localStorage에 저장 (QR 공개 프로필용)
      try {
        const serializedProfiles = updated.map(p => ({
          ...p,
          socialLinks: p.socialLinks.map(link => ({
            platform: link.platform,
            url: link.url,
            enabled: link.enabled,
          })),
        }));
        localStorage.setItem('digital_card_profiles', JSON.stringify(serializedProfiles));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
      
      return updated;
    });
  };

  const updateSocialLink = (index: number, updates: Partial<SocialLink>) => {
    const newLinks = [...currentProfile.socialLinks];
    newLinks[index] = { ...newLinks[index], ...updates };
    updateProfile({ socialLinks: newLinks });
  };

  const handleImageUpload = (file: File, type: 'profile' | 'cover') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'profile') {
        updateProfile({ profileImage: dataUrl });
      } else {
        updateProfile({ coverImage: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVCardDownload = () => {
    downloadVCard({
      name: currentProfile.name,
      title: currentProfile.title,
      company: currentProfile.company,
      phone: currentProfile.phone,
      email: currentProfile.email,
      website: currentProfile.website,
      address: currentProfile.location,
    });
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}?card=${currentProfile.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentProfile?.name}의 디지털 명함`,
          text: `${currentProfile?.name} - ${currentProfile?.title}`,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(profileUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea');
          textArea.value = profileUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            console.error('Fallback copy failed:', err);
            alert(`공유 링크: ${profileUrl}`);
          }
          textArea.remove();
        }
      } catch (err) {
        console.error('Copy failed:', err);
        alert(`공유 링크: ${profileUrl}`);
      }
    }
  };

  const switchProfile = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setActiveProfileIndex(prev => (prev > 0 ? prev - 1 : profiles.length - 1));
    } else {
      setActiveProfileIndex(prev => (prev < profiles.length - 1 ? prev + 1 : 0));
    }
  };

  // ✅ 커스텀 필드 관리 함수
  const addCustomField = () => {
    if (currentProfile.customFields.length >= 3) {
      alert('최대 3개의 커스텀 필드만 추가할 수 있습니다.');
      return;
    }
    const newField: CustomField = {
      id: Date.now().toString(),
      label: '',
      value: '',
    };
    updateProfile({
      customFields: [...currentProfile.customFields, newField],
    });
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    const newFields = currentProfile.customFields.map(field =>
      field.id === id ? { ...field, ...updates } : field
    );
    updateProfile({ customFields: newFields });
  };

  const removeCustomField = (id: string) => {
    const newFields = currentProfile.customFields.filter(field => field.id !== id);
    updateProfile({ customFields: newFields });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Header - 모바일 최적화 3줄 레이아웃 */}
          <div className="mb-8">
            {/* 1줄: 디지털 명함 */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 text-center">
            QR 디지털 명함
            </h1>
            
            {/* 2줄: 모바일에 최적화된 스마트 명함 */}
            <p className="text-gray-600 mb-4 text-center">모바일에 최적화된 스마트 명함</p>
            
            {/* 3줄: QR 코드, 공유하기 버튼 */}
            <div className="flex gap-2 flex items-center justify-center">
              <Button variant="outline" className="gap-2" onClick={() => setShowQRModal(true)}>
                <QrCode className="w-4 h-4" />
                QR 코드
              </Button>
              <Button variant="outline" className="gap-2 text-center" onClick={handleShare}>
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? '복사됨!' : '공유하기'}
              </Button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <span className="flex-1 text-sm text-gray-600 text-center">조회수</span>
              <span className="text-xl font-bold text-gray-900">{stats.views.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <span className="flex-1 text-sm text-gray-600 text-center">저장됨</span>
              <span className="text-xl font-bold text-gray-900">{stats.saves}</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="flex-1 text-sm text-gray-600 text-center">공유됨</span>
              <span className="text-xl font-bold text-gray-900">{stats.shares}</span>
            </div>

            <div className="flex items-center justify-between gap-3 p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <span className="flex-1 text-sm text-gray-600 text-center">링크 클릭</span>
              <span className="text-xl font-bold text-gray-900">{stats.linkClicks}</span>
            </div>
          </div>

          {/* Live Preview - Full Width */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Mobile Frame with Modern Design */}
              <div className="w-full">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl h-full min-h-[800px] flex flex-col">
                  {/* Cover Image / Gradient Header */}
                  <div className={`relative h-48 bg-gradient-to-br ${currentProfile.themeColor} p-12`}>
                    {currentProfile.coverImage ? (
                      <img 
                        src={currentProfile.coverImage} 
                        alt="Cover" 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                    
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                    
                    {/* Profile Section */}
                    <div className="relative h-full flex flex-col items-center justify-center">
                      {/* Profile Image */}
                      <div className="relative mb-3">
                        <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-md shadow-xl overflow-hidden flex items-center justify-center border-2 border-white/50">
                          {currentProfile.profileImage ? (
                            <img 
                              src={currentProfile.profileImage} 
                              alt={currentProfile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-10 h-10 text-white/80" />
                          )}
                        </div>
                      </div>

                      {/* Name and Title */}
                      <h2 className="text-xl font-bold text-white text-center mb-1">
                        {currentProfile.name}
                      </h2>
                      <p className="text-white/90 text-center text-sm font-medium">
                        {currentProfile.title}
                      </p>
                      {/* ✅ 직무 추가 */}
                      {currentProfile.role && (
                        <p className="text-white/80 text-center text-xs mt-1">
                          {currentProfile.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* White Card Content */}
                  <div className="bg-white px-12 pb-12 pt-8 flex-1">
                    {/* Tagline */}
                    <div className="text-center mb-6 py-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 font-medium">
                        {currentProfile.tagline}
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed text-center">
                        {currentProfile.bio}
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm">
                        <Phone className="w-4 h-4" />
                        전화하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm">
                        <MessageSquare className="w-4 h-4" />
                        문자하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm">
                        <Mail className="w-4 h-4" />
                        이메일
                      </button>
                      <button 
                        onClick={handleVCardDownload}
                        className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        연락처 저장
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      {currentProfile.phone && (
                        <div className="flex items-center gap-3 text-sm py-3">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{currentProfile.phone}</span>
                        </div>
                      )}
                      {currentProfile.email && (
                        <div className="flex items-center gap-3 text-sm py-3">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{currentProfile.email}</span>
                        </div>
                      )}
                      {currentProfile.website && (
                        <div className="flex items-center gap-3 text-sm py-3">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{currentProfile.website}</span>
                        </div>
                      )}
                      {currentProfile.location && (
                        <div className="flex items-center gap-3 text-sm py-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">{currentProfile.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {currentProfile.socialLinks.filter(link => link.enabled).length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">소셜 미디어</p>
                        <div className="grid grid-cols-2 gap-3">
                          {currentProfile.socialLinks
                            .filter(link => link.enabled)
                            .map((link, index) => {
                              const Icon = link.icon;
                              return (
                                <a
                                  key={index}
                                  href={`https://${link.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="font-medium">{link.platform}</span>
                                  <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
                                </a>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* ✅ Custom Fields */}
                    {currentProfile.customFields.filter(field => field.label && field.value).length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">추가 정보</p>
                        <div className="space-y-3">
                          {currentProfile.customFields
                            .filter(field => field.label && field.value)
                            .map((field) => (
                              <div key={field.id} className="flex items-center gap-3 text-sm py-2">
                                <Info className="w-4 h-4 text-gray-500" />
                                <span className="font-medium text-gray-600">{field.label}:</span>
                                <span className="text-gray-700">{field.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* QR Code Section */}
                    <div className="border-t pt-6">
                      <p className="text-xs font-semibold text-gray-600 mb-3 text-center uppercase tracking-wide">
                        QR 코드로 명함 공유
                      </p>
                      <div className="flex justify-center">
                        {qrCodeUrl && (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code" 
                            className="w-32 h-32 rounded-lg border-2 border-gray-200"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Panel */}
              <div className="w-full">
                {/* Multi-Profile Switcher - Editor Panel Top */}
                {profiles.length > 1 && (
                  <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-md mb-4">
                    <button
                      onClick={() => switchProfile('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">
                        프로필 {activeProfileIndex + 1} / {profiles.length}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-700">{currentProfile.name}</span>
                    </div>

                    <button
                      onClick={() => switchProfile('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                )}

                <Card className="p-12 bg-white border-none shadow-lg rounded-2xl h-full min-h-[800px] flex flex-col">
                  <Tabs defaultValue="profile" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">프로필</TabsTrigger>
                      <TabsTrigger value="contact" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">연락처</TabsTrigger>
                      <TabsTrigger value="social" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">소셜</TabsTrigger>
                      <TabsTrigger value="design" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">디자인</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-5 mt-0">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">프로필 사진</Label>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-gray-200">
                            {currentProfile.profileImage ? (
                              <img 
                                src={currentProfile.profileImage} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Camera className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              ref={profileImageRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'profile');
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => profileImageRef.current?.click()}
                              className="text-xs"
                            >
                              이미지 업로드
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">커버 이미지</Label>
                        <div>
                          <input
                            ref={coverImageRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, 'cover');
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => coverImageRef.current?.click()}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            커버 이미지 업로드
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          이름
                          <span className="text-purple-600 ml-1">*</span>
                        </Label>
                        <Input
                          value={currentProfile.name}
                          onChange={(e) => updateProfile({ name: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="김철수"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          직함
                          <span className="text-purple-600 ml-1">*</span>
                        </Label>
                        <Input
                          value={currentProfile.title}
                          onChange={(e) => updateProfile({ title: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="Software Engineer"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">직무</Label>
                        <Input
                          value={currentProfile.role}
                          onChange={(e) => updateProfile({ role: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="개발자"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          회사
                          <span className="text-purple-600 ml-1">*</span>
                        </Label>
                        <Input
                          value={currentProfile.company}
                          onChange={(e) => updateProfile({ company: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="MyBrands.ai"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">한 줄 슬로건</Label>
                        <Input
                          value={currentProfile.tagline}
                          onChange={(e) => updateProfile({ tagline: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="디자인으로 세상을 바꿉니다"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">소개</Label>
                        <textarea
                          className="w-full min-h-[100px] p-3 border border-gray-200 bg-gray-50 rounded-lg resize-none text-sm"
                          value={currentProfile.bio}
                          onChange={(e) => updateProfile({ bio: e.target.value })}
                          placeholder="사용자 중심의 아름다운 경험을 만드는 디자이너입니다."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-5 mt-0">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          전화번호
                          <span className="text-purple-600 ml-1">*</span>
                        </Label>
                        <Input
                          value={currentProfile.phone}
                          onChange={(e) => updateProfile({ phone: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="010-1234-5678"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          이메일
                          <span className="text-purple-600 ml-1">*</span>
                        </Label>
                        <Input
                          type="email"
                          value={currentProfile.email}
                          onChange={(e) => updateProfile({ email: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="hello@example.com"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">웹사이트</Label>
                        <Input
                          value={currentProfile.website}
                          onChange={(e) => updateProfile({ website: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="example.com"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">위치</Label>
                        <Input
                          value={currentProfile.location}
                          onChange={(e) => updateProfile({ location: e.target.value })}
                          className="bg-gray-50 border-gray-200"
                          placeholder="Seoul, South Korea"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="space-y-5 mt-0 lg:col-span-2">
                      <p className="text-sm text-gray-600 mb-4">
                        표시할 소셜 미디어를 선택하세요
                      </p>
                      <div className="grid grid-cols-1 gap-4">
                        {currentProfile.socialLinks.map((link, index) => {
                          const Icon = link.icon;
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-4 border rounded-lg"
                            >
                              <Icon className="w-5 h-5 text-gray-600" />
                              <div className="flex-1">
                                <Label className="text-sm font-medium">{link.platform}</Label>
                                <Input
                                  className="mt-1"
                                  value={link.url}
                                  onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                                  disabled={!link.enabled}
                                  placeholder={`${link.platform.toLowerCase()}.com/username`}
                                />
                              </div>
                              <Switch
                                checked={link.enabled}
                                onCheckedChange={(checked) => updateSocialLink(index, { enabled: checked })}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* ✅ 커스텀 필드 섹션 */}
                      <div className="pt-6 border-t">
                        <h3 className="font-semibold mb-2">커스텀 필드</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          최대 3개의 커스텀 필드를 추가할 수 있습니다
                        </p>
                        <div className="space-y-3">
                          {currentProfile.customFields.map(field => (
                            <div key={field.id} className="flex items-center gap-2">
                              <Input
                                value={field.label}
                                onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                                className="w-1/3 bg-gray-50 border-gray-200"
                                placeholder="라벨"
                              />
                              <Input
                                value={field.value}
                                onChange={(e) => updateCustomField(field.id, { value: e.target.value })}
                                className="flex-1 bg-gray-50 border-gray-200"
                                placeholder="값"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomField(field.id)}
                                className="shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {currentProfile.customFields.length < 3 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addCustomField}
                              className="w-full"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              필드 추가
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="design" className="space-y-5 mt-0 lg:col-span-2">
                      <div>
                        <Label className="mb-3 block">테마 컬러</Label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {[
                            'from-blue-500 to-blue-600',
                            'from-green-500 to-emerald-600',
                            'from-orange-500 to-red-600',
                            'from-pink-500 to-purple-600',
                            'from-purple-500 to-indigo-600',
                            'from-cyan-500 to-blue-600',
                          ].map((color) => (
                            <button
                              key={color}
                              onClick={() => updateProfile({ themeColor: color })}
                              className={`h-16 rounded-xl bg-gradient-to-br ${color} transition-all ${
                                currentProfile.themeColor === color
                                  ? 'ring-4 ring-offset-2 ring-blue-600 scale-105'
                                  : 'hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <h3 className="font-semibold mb-2">브랜드 동기화</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          명함 디자인과 테마를 자동으로 동기화합니다
                        </p>
                        <Button variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          명함 디자인에서 가져오기
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 mt-6 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={handleVCardDownload}
                    >
                      <Download className="w-4 h-4" />
                      VCF 포맷 저장
                    </Button>
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={saveProfile}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4" />
                      {saving ? '저장 중...' : '저장하기'}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowQRModal(false)}
        >
          <Card 
            className="p-6 max-w-sm w-full bg-white border-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">QR 코드</h3>
              <p className="text-sm text-gray-600 mb-6">
                스캔하여 내 명함을 확인하세요
              </p>
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-full max-w-xs mx-auto rounded-2xl shadow-lg mb-6"
                />
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeUrl;
                    link.download = `${currentProfile.name}_QR.png`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setShowQRModal(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      
      <Footer />
    </div>
  );
}