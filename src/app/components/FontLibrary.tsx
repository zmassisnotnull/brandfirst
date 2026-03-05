/**
 * 폰트 라이브러리 관리
 * - 폰트 업로드
 * - 폰트 목록 표시
 * - 폰트 선택
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../../utils/supabase/client';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { FontMetadata } from '../types/typography';

interface FontLibraryProps {
  onSelectFont?: (font: FontMetadata) => void;
  selectedFontId?: string;
}

export function FontLibrary({ onSelectFont, selectedFontId }: FontLibraryProps) {
  const [fonts, setFonts] = useState<FontMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 업로드 폼 상태
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fontFamily, setFontFamily] = useState('');
  const [fontWeight, setFontWeight] = useState<number>(400);
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic' | 'oblique'>('normal');

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // KV store에서 폰트 목록 가져오기 (임시)
      // 실제로는 Supabase DB에서 가져와야 함
      const response = await fetch(`/api/fonts?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFonts(data.fonts || []);
      }
    } catch (error) {
      console.error('폰트 목록 로드 실패:', error);
      toast.error('폰트 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !fontFamily) {
      toast.error('파일과 폰트 이름을 입력해주세요.');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 1. Storage에 폰트 파일 업로드
      const fileName = `${user.id}/${crypto.randomUUID()}-${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('fonts')
        .upload(fileName, uploadFile, {
          contentType: uploadFile.type || 'font/otf',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2. 메타데이터 등록 (서버 API 호출)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/fonts/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          family: fontFamily,
          style: fontStyle,
          weight: fontWeight,
          storage_path: fileName,
          mime: uploadFile.type || 'font/otf',
          embedding_allowed: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();
      
      toast.success(`${fontFamily} 폰트가 등록되었습니다.`);
      
      // 목록 새로고침
      await loadFonts();
      
      // 폼 초기화
      setUploadFile(null);
      setFontFamily('');
      setFontWeight(400);
      setFontStyle('normal');
      
    } catch (error: any) {
      console.error('폰트 업로드 실패:', error);
      toast.error(error.message || '폰트 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fontId: string) => {
    if (!confirm('이 폰트를 삭제하시겠습니까?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/fonts/${fontId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      toast.success('폰트가 삭제되었습니다.');
      await loadFonts();
    } catch (error) {
      console.error('폰트 삭제 실패:', error);
      toast.error('폰트 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 폰트 업로드 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">폰트 업로드</h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label>폰트 파일 (OTF, TTF, WOFF2)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".otf,.ttf,.woff,.woff2"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <div className="text-center">
                  {uploadFile ? (
                    <>
                      <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">클릭하여 파일 선택</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>폰트 이름</Label>
              <Input
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                placeholder="예: Pretendard"
                required
              />
            </div>

            <div>
              <Label>Weight</Label>
              <Select value={String(fontWeight)} onValueChange={(v) => setFontWeight(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Thin (100)</SelectItem>
                  <SelectItem value="200">Extra Light (200)</SelectItem>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Regular (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                  <SelectItem value="900">Black (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Style</Label>
            <Select value={fontStyle} onValueChange={(v: any) => setFontStyle(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="italic">Italic</SelectItem>
                <SelectItem value="oblique">Oblique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={uploading || !uploadFile} className="w-full">
            {uploading ? '업로드 중...' : '폰트 등록'}
          </Button>
        </form>
      </Card>

      {/* 폰트 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">내 폰트 라이브러리</h3>
        
        {loading ? (
          <p className="text-center text-gray-500 py-8">로딩 중...</p>
        ) : fonts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">등록된 폰트가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {fonts.map((font) => (
              <div
                key={font.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  selectedFontId === font.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{font.family}</h4>
                  <p className="text-sm text-gray-600">
                    {font.style} · {font.weight}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectFont && (
                    <Button
                      size="sm"
                      variant={selectedFontId === font.id ? 'default' : 'outline'}
                      onClick={() => onSelectFont(font)}
                    >
                      {selectedFontId === font.id ? '선택됨' : '선택'}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(font.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
