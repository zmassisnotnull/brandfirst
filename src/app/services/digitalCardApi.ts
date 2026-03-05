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
      return data.profile;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * 프로필 생성/업데이트
   */
  async saveProfile(profileData: ProfileData): Promise<{ success: boolean; id: string; message: string }> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('인증이 필요합니다.');
      }

      console.log('💾 Saving profile:', profileData);

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
   * 조회수 증가
   */
  async incrementView(id: string, viewerInfo?: {
    viewer_ip?: string;
    user_agent?: string;
    referrer?: string;
  }): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/profiles/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(viewerInfo || {}),
      });
    } catch (error) {
      console.error('Increment view error:', error);
      // 조회수 증가 실패는 무시
    }
  },

  /**
   * 공유 수 증가
   */
  async incrementShare(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/profiles/${id}/share`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Increment share error:', error);
    }
  },

  /**
   * 저장 수 증가
   */
  async incrementSave(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/profiles/${id}/save`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Increment save error:', error);
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
