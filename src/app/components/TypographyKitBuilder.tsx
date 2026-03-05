/**
 * Typography Kit 생성기
 * - 로고 폰트 + 본문 폰트 페어링
 * - 실시간 미리보기
 * - 자동 추천 (3세트: Modern/Friendly/Premium)
 */

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import type { FontMetadata, TypographyKit } from '../types/typography';
import { Sparkles, Check } from 'lucide-react';

interface TypographyKitBuilderProps {
  projectId: string;
  fonts: FontMetadata[];
  onKitCreated?: (kit: TypographyKit) => void;
}

interface FontPair {
  id: string;
  name: string;
  logoFont: FontMetadata | null;
  bodyFont: FontMetadata | null;
  description: string;
}

export function TypographyKitBuilder({
  projectId,
  fonts,
  onKitCreated,
}: TypographyKitBuilderProps) {
  const [selectedPairId, setSelectedPairId] = useState<string>('');
  const [customLogoFont, setCustomLogoFont] = useState<FontMetadata | null>(null);
  const [customBodyFont, setCustomBodyFont] = useState<FontMetadata | null>(null);
  const [creating, setCreating] = useState(false);

  // 추천 폰트 페어
  const recommendedPairs: FontPair[] = [
    {
      id: 'modern',
      name: 'Modern',
      logoFont: fonts.find(f => f.family.includes('Pretendard') && f.weight >= 700) || null,
      bodyFont: fonts.find(f => f.family.includes('Pretendard') && f.weight === 400) || null,
      description: '깔끔하고 현대적인 느낌',
    },
    {
      id: 'friendly',
      name: 'Friendly',
      logoFont: fonts.find(f => f.family.includes('Noto Sans') && f.weight >= 600) || null,
      bodyFont: fonts.find(f => f.family.includes('Noto Sans') && f.weight === 400) || null,
      description: '친근하고 접근하기 쉬운 느낌',
    },
    {
      id: 'premium',
      name: 'Premium',
      logoFont: fonts.find(f => f.family.includes('Serif') && f.weight >= 600) || null,
      bodyFont: fonts.find(f => f.family.includes('Sans') && f.weight === 400) || null,
      description: '고급스럽고 전문적인 느낌',
    },
  ];

  const handleCreateKit = async () => {
    let logoFont: FontMetadata | null = null;
    let bodyFont: FontMetadata | null = null;

    if (selectedPairId === 'custom') {
      logoFont = customLogoFont;
      bodyFont = customBodyFont;
    } else {
      const pair = recommendedPairs.find(p => p.id === selectedPairId);
      logoFont = pair?.logoFont || null;
      bodyFont = pair?.bodyFont || null;
    }

    if (!logoFont || !bodyFont) {
      toast.error('로고 폰트와 본문 폰트를 모두 선택해주세요.');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('/api/typography-kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          logo_font_id: logoFont.id,
          body_font_id: bodyFont.id,
          scale_json: {
            logo_size_px: 160,
            name_size_pt: 11,
            body_size_pt: 8.5,
            line_height: 1.4,
            tracking_default_em: 0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Kit 생성 실패');
      }

      const { kit } = await response.json();
      toast.success('Typography Kit이 생성되었습니다!');
      
      if (onKitCreated) {
        onKitCreated(kit);
      }
    } catch (error: any) {
      console.error('Kit 생성 실패:', error);
      toast.error(error.message || 'Kit 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Typography Kit 생성</h2>
        <p className="text-gray-600">
          로고와 명함에 사용할 폰트 조합을 선택하세요
        </p>
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended">
            <Sparkles className="w-4 h-4 mr-2" />
            추천 조합
          </TabsTrigger>
          <TabsTrigger value="custom">직접 선택</TabsTrigger>
        </TabsList>

        {/* 추천 조합 */}
        <TabsContent value="recommended" className="space-y-4">
          {recommendedPairs.map((pair) => (
            <Card
              key={pair.id}
              className={`p-6 cursor-pointer transition-all ${
                selectedPairId === pair.id
                  ? 'border-blue-600 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => setSelectedPairId(pair.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{pair.name}</h3>
                    {selectedPairId === pair.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{pair.description}</p>

                  {/* 미리보기 */}
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-lg border">
                      {pair.logoFont ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">로고 폰트</p>
                          <p
                            className="text-2xl font-bold"
                            style={{
                              fontFamily: pair.logoFont.family,
                              fontWeight: pair.logoFont.weight,
                            }}
                          >
                            MyBrand
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {pair.logoFont.family} · {pair.logoFont.weight}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">로고 폰트 없음</p>
                      )}
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      {pair.bodyFont ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">본문 폰트</p>
                          <p
                            className="text-sm"
                            style={{
                              fontFamily: pair.bodyFont.family,
                              fontWeight: pair.bodyFont.weight,
                            }}
                          >
                            홍길동 대표이사
                            <br />
                            010-1234-5678
                            <br />
                            hello@mybrand.com
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            {pair.bodyFont.family} · {pair.bodyFont.weight}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">본문 폰트 없음</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {recommendedPairs.every(p => !p.logoFont || !p.bodyFont) && (
            <Card className="p-6 border-yellow-200 bg-yellow-50">
              <p className="text-sm text-yellow-800">
                추천 조합을 사용하려면 먼저 폰트를 업로드해주세요.
                <br />
                Pretendard, Noto Sans 등의 폰트를 추천합니다.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* 직접 선택 */}
        <TabsContent value="custom" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label>로고 폰트 (굵고 개성 있는 폰트 추천)</Label>
                <select
                  className="w-full mt-2 p-2 border rounded-lg"
                  value={customLogoFont?.id || ''}
                  onChange={(e) => {
                    const font = fonts.find(f => f.id === e.target.value);
                    setCustomLogoFont(font || null);
                    setSelectedPairId('custom');
                  }}
                >
                  <option value="">폰트 선택</option>
                  {fonts
                    .filter(f => f.weight >= 600)
                    .map(font => (
                      <option key={font.id} value={font.id}>
                        {font.family} · {font.weight}
                      </option>
                    ))}
                </select>
                {customLogoFont && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p
                      className="text-3xl font-bold"
                      style={{
                        fontFamily: customLogoFont.family,
                        fontWeight: customLogoFont.weight,
                      }}
                    >
                      MyBrand
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>본문 폰트 (가독성 좋은 폰트 추천)</Label>
                <select
                  className="w-full mt-2 p-2 border rounded-lg"
                  value={customBodyFont?.id || ''}
                  onChange={(e) => {
                    const font = fonts.find(f => f.id === e.target.value);
                    setCustomBodyFont(font || null);
                    setSelectedPairId('custom');
                  }}
                >
                  <option value="">폰트 선택</option>
                  {fonts.map(font => (
                    <option key={font.id} value={font.id}>
                      {font.family} · {font.weight}
                    </option>
                  ))}
                </select>
                {customBodyFont && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                    <p
                      className="text-sm"
                      style={{
                        fontFamily: customBodyFont.family,
                        fontWeight: customBodyFont.weight,
                      }}
                    >
                      홍길동 대표이사
                      <br />
                      010-1234-5678
                      <br />
                      hello@mybrand.com
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleCreateKit}
        disabled={!selectedPairId || creating}
        className="w-full"
        size="lg"
      >
        {creating ? 'Kit 생성 중...' : 'Typography Kit 생성'}
      </Button>
    </div>
  );
}
