/**
 * 로고 편집기 페이지
 * - 폰트 목록 로드
 * - LogoEditor 마운트
 * - 저장 후 다음 단계로 이동
 */

import { useState, useEffect } from 'react';
import { LogoEditor } from '../../features/branding/logo-editor/LogoEditor';
import { toast } from 'sonner';
import type { FontFace, LogoSpec, LogoAsset } from '../../features/branding/logo-editor/logoEditor.types';
import { getSupabaseClient } from '../../../utils/supabase/client';

interface LogoEditorPageProps {
  onNavigate?: (page: string) => void;
}

export default function LogoEditorPage({ onNavigate }: LogoEditorPageProps) {
  const [fonts, setFonts] = useState<FontFace[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    loadFonts();
  }, []);
  
  const loadFonts = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('로그인이 필요합니다.');
        onNavigate && onNavigate('/login');
        return;
      }
      
      // 폰트 목록 가져오기 (임시 - 실제로는 DB에서)
      const response = await fetch(`/api/fonts?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error('폰트 목록 로드 실패');
      }
      
      const data = await response.json();
      const fontsWithUrls: FontFace[] = [];
      
      // Storage에서 signed URL 생성
      for (const font of data.fonts || []) {
        const { data: signedData, error } = await supabase.storage
          .from('fonts')
          .createSignedUrl(font.storage_path, 3600); // 1시간 유효
        
        if (!error && signedData) {
          fontsWithUrls.push({
            ...font,
            url: signedData.signedUrl,
          });
        } else {
          fontsWithUrls.push(font);
        }
      }
      
      setFonts(fontsWithUrls);
      
      if (fontsWithUrls.length === 0) {
        toast.info('폰트를 먼저 업로드하세요.');
      }
      
    } catch (error: any) {
      console.error('폰트 로드 에러:', error);
      toast.error('폰트 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = (spec: LogoSpec, asset: LogoAsset) => {
    console.log('로고 저장 완료:', { spec, asset });
    
    // 다음 단계로 이동 (명함 제작)
    toast.success('이제 명함을 제작하세요!');
    
    // 로고 asset ID를 쿼리로 전달
    onNavigate && onNavigate(`/card-maker?logo=${asset.id}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">폰트 로딩 중...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <LogoEditor
        availableFonts={fonts}
        onSave={handleSave}
      />
    </div>
  );
}