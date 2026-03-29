import { getSupabaseClient } from '../../../utils/supabase/client';
import { projectId } from '../../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-98397747/api/digital-card`;

interface ProfileData {
  id?: string;
  name: string;
  title: string;
  role?: string;
  company: string;
  tagline?: string;
  bio?: string;
  phone: string;
  email: string;
  website?: string;
  location?: string;
  profile_image?: string;
  cover_image?: string;
  back_image?: string;
  theme_color?: string;
  is_public?: boolean;
  socialLinks?: Array<{
    platform: string;
    url: string;
    enabled: boolean;
  }>;
  customFields?: Array<{
    id?: string;
    label: string;
    value: string;
  }>;
}

interface ApiResponse<T> {
  success?: boolean;
  profiles?: T[];
  profile?: T;
  stats?: any;
  message?: string;
  error?: string;
  id?: string;
}

async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export const digitalCardApi = {
  /**
   * 내 프로필 목록 조회
   */
  async getProfiles(): Promise<any[]> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`${API_BASE_URL}/profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로필 조회에 실패했습니다.');
      }

      const data: ApiResponse<any> = await response.json();
      return data.profiles || [];
    } catch (error) {
      console.error('Get profiles error:', error);
      throw error;
    }
  },

  /**
   * 특정 프로필 조회
   */
  async getProfile(id: string): Promise<any> {
    try {
      const token = await getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로필 조회에 실패했습니다.');
      }

      const data: ApiResponse<any> = await response.json();
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * 프로필 저장/업데이트 (인증 필요)
   */
  async saveProfile(profileData: ProfileData): Promise<{ success: boolean; id: string; message: string }> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`${API_BASE_URL}/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로필 저장에 실패했습니다.');
      }

      const data: ApiResponse<any> = await response.json();
      return {
        success: data.success || false,
        id: data.id || '',
        message: data.message || '저장되었습니다.',
      };
    } catch (error) {
      console.error('Save profile error:', error);
      throw error;
    }
  },

  /**
   * 익명 프로필 생성 (No-Login flow)
   */
  async saveAnonymousProfile(profileData: any, anonymousId?: string): Promise<{ success: boolean; id: string; message: string }> {
    try {
      console.log('👣 Saving anonymous profile:', { ...profileData, anonymous_id: anonymousId });
      const response = await fetch(`${API_BASE_URL}/profiles/anonymous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          anonymous_id: anonymousId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '익명 프로필 저장에 실패했습니다.');
      }

      const data: ApiResponse<any> = await response.json();
      return {
        success: data.success || false,
        id: data.id || '',
        message: data.message || '저장되었습니다.',
      };
    } catch (error) {
      console.error('Save anonymous profile error:', error);
      throw error;
    }
  },

  /**
   * 프로필 삭제
   */
  async deleteProfile(id: string): Promise<void> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`${API_BASE_URL}/profiles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '프로필 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete profile error:', error);
      throw error;
    }
  },

  /**
   * 익명 프로필 소유권 이전
   */
  async claimProfiles(profileIds: string[]): Promise<any> {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('인증이 필요합니다.');

      const response = await fetch(`${API_BASE_URL}/profiles/claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '소유권 이전에 실패했습니다.');
      }

      return await response.json();
    } catch (error) {
      console.error('Claim profiles error:', error);
      throw error;
    }
  },

  /**
   * 조회수 로그 기록
   */
  async logView(profileId: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/profiles/${profileId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Log view error:', error);
    }
  },

  /**
   * 통계 조회
   */
  async getStats(id: string): Promise<any> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(`${API_BASE_URL}/profiles/${id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '통계 조회에 실패했습니다.');
      }

      const data: ApiResponse<any> = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Get stats error:', error);
      throw error;
    }
  },
};
