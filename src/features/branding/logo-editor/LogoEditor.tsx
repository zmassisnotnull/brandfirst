/**
 * 폰트 기반 로고 편집기
 * - 텍스트 입력
 * - 폰트 선택
 * - 자간/커닝/리가처 조정
 * - 실시간 미리보기
 * - 서버 렌더링 → SVG Path 저장
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Slider } from '../../../app/components/ui/slider';
import { Switch } from '../../../app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Download, 
  Sparkles, 
  RefreshCw, 
  Save, 
  Eye,
  Type,
  Palette,
  Settings2,
} from 'lucide-react';

import type { 
  LogoEditorState, 
  FontFace, 
  LogoRenderResult,
  LogoSpec,
  LogoAsset,
} from './logoEditor.types';

import { 
  getDefaultLogoState, 
  validateLogoText,
  FONT_SIZE_RANGE,
  TRACKING_RANGE,
  isValidHexColor,
  buildFontFaceCSS,
} from './utils';

import { LogoPreview, LogoColorVariants } from './LogoPreview';

interface LogoEditorProps {
  availableFonts: FontFace[];
  initialState?: Partial<LogoEditorState>;
  onSave?: (spec: LogoSpec, asset: LogoAsset) => void;
}

export function LogoEditor({
  availableFonts,
  initialState,
  onSave,
}: LogoEditorProps) {
  
  const [state, setState] = useState<LogoEditorState>(() => ({
    ...getDefaultLogoState(),
    ...initialState,
  }));
  
  const [renderResult, setRenderResult] = useState<LogoRenderResult | null>(null);
  const [previewMode, setPreviewMode] = useState<'live' | 'rendered'>('live');
  
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const selectedFont = useMemo(() => {
    return availableFonts.find(f => f.id === state.fontId) || null;
  }, [availableFonts, state.fontId]);
  
  // 폰트 동적 로드
  useEffect(() => {
    if (!selectedFont || !selectedFont.url) return;
    
    const styleId = `font-${selectedFont.id}`;
    
    // 이미 로드되어 있으면 스킵
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = buildFontFaceCSS(selectedFont, selectedFont.url);
    document.head.appendChild(style);
    
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [selectedFont]);
  
  // 상태 업데이트 헬퍼
  function updateState(patch: Partial<LogoEditorState>) {
    setState(prev => ({ ...prev, ...patch }));
  }
  
  // 서버 렌더링 (SVG Path 생성)
  const handleRender = async () => {
    const validation = validateLogoText(state.text);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    if (!selectedFont) {
      toast.error('폰트를 선택하세요.');
      return;
    }
    
    setRendering(true);
    
    try {
      const response = await fetch('/api/logo/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          font_id: state.fontId,
          text: state.text,
          font_size_px: state.fontSizePx,
          tracking_em: state.trackingEm,
          kerning: state.kerning,
          ligatures: state.ligatures,
        }),
      });
      
      if (!response.ok) {
        throw new Error('렌더링 실패');
      }
      
      const { render } = await response.json();
      setRenderResult(render);
      setPreviewMode('rendered');
      
      toast.success('로고가 렌더링되었습니다.');
    } catch (error: any) {
      console.error('렌더링 에러:', error);
      toast.error(error.message || '로고 렌더링에 실패했습니다.');
    } finally {
      setRendering(false);
    }
  };
  
  // 저장 (Spec + Asset)
  const handleSave = async () => {
    if (!renderResult) {
      toast.error('먼저 로고를 렌더링하세요.');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/logo/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: state.text,
          font_id: state.fontId,
          font_size_px: state.fontSizePx,
          tracking_em: state.trackingEm,
          kerning: state.kerning,
          ligatures: state.ligatures,
          colors: {
            primary: state.primaryColor,
            secondary: state.secondaryColors,
          },
          canonical: {
            svg_path_d: renderResult.svg_path_d,
            view_box: renderResult.view_box,
            metrics: renderResult.metrics,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('저장 실패');
      }
      
      const { spec, asset } = await response.json();
      
      toast.success('로고가 저장되었습니다!');
      
      if (onSave) {
        onSave(spec, asset);
      }
    } catch (error: any) {
      console.error('저장 에러:', error);
      toast.error(error.message || '로고 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  
  // SVG 다운로드
  const handleDownloadSVG = () => {
    if (!renderResult) {
      toast.error('먼저 로고를 렌더링하세요.');
      return;
    }
    
    const svg = `
      <svg viewBox="${renderResult.view_box}" xmlns="http://www.w3.org/2000/svg">
        <path d="${renderResult.svg_path_d}" fill="${state.primaryColor}" />
      </svg>
    `;
    
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.text.replace(/\s+/g, '-')}-logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('SVG 파일이 다운로드되었습니다.');
  };
  
  return (
    <div className="flex h-[calc(100vh-2rem)] gap-4 p-4">
      
      {/* Left: 미리보기 */}
      <div className="flex-1 flex flex-col gap-4">
        
        {/* 메인 미리보기 */}
        <Card className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">로고 미리보기</h3>
              <p className="text-sm text-muted-foreground">
                {previewMode === 'live' ? '실시간 미리보기' : '렌더링된 결과'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={previewMode === 'live' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('live')}
              >
                <Eye className="w-4 h-4 mr-1" />
                Live
              </Button>
              
              <Button
                size="sm"
                variant={previewMode === 'rendered' ? 'default' : 'outline'}
                onClick={() => setPreviewMode('rendered')}
                disabled={!renderResult}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Rendered
              </Button>
            </div>
          </div>
          
          <LogoPreview
            state={state}
            font={selectedFont}
            mode={previewMode}
            renderResult={renderResult || undefined}
            className="w-full aspect-[2/1] rounded-lg border"
          />
        </Card>
        
        {/* 컬러 변형 미리보기 */}
        {renderResult && (
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">컬러 변형</h3>
            <LogoColorVariants result={renderResult} />
          </Card>
        )}
        
        {/* 액션 버튼 */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRender}
              disabled={rendering || !selectedFont}
              className="flex-1"
              size="lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${rendering ? 'animate-spin' : ''}`} />
              {rendering ? '렌더링 중...' : '로고 렌더링'}
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={!renderResult || saving}
              variant="default"
              size="lg"
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
            
            <Button
              onClick={handleDownloadSVG}
              disabled={!renderResult}
              variant="outline"
              size="lg"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
      
      {/* Right: 컨트롤 패널 */}
      <div className="w-[400px] overflow-auto">
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">
              <Type className="w-4 h-4 mr-1" />
              텍스트
            </TabsTrigger>
            <TabsTrigger value="style">
              <Settings2 className="w-4 h-4 mr-1" />
              스타일
            </TabsTrigger>
            <TabsTrigger value="color">
              <Palette className="w-4 h-4 mr-1" />
              컬러
            </TabsTrigger>
          </TabsList>
          
          {/* 텍스트 탭 */}
          <TabsContent value="text" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>로고 텍스트</Label>
                  <Input
                    value={state.text}
                    onChange={(e) => updateState({ text: e.target.value })}
                    placeholder="브랜드 이름 입력"
                    maxLength={30}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {state.text.length} / 30자
                  </p>
                </div>
                
                <div>
                  <Label>폰트 선택</Label>
                  <select
                    className="w-full mt-2 p-2 border rounded-lg"
                    value={state.fontId || ''}
                    onChange={(e) => updateState({ fontId: e.target.value || null })}
                  >
                    <option value="">폰트 선택</option>
                    {availableFonts.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.family} · {font.weight}
                      </option>
                    ))}
                  </select>
                  
                  {availableFonts.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-2">
                      폰트를 먼저 업로드하세요.
                    </p>
                  )}
                </div>
                
                {selectedFont && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">선택된 폰트</p>
                    <p className="text-sm font-medium">{selectedFont.family}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFont.style} · {selectedFont.weight}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
          
          {/* 스타일 탭 */}
          <TabsContent value="style" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-6">
                
                {/* 폰트 크기 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>폰트 크기</Label>
                    <span className="text-sm font-mono">{state.fontSizePx}px</span>
                  </div>
                  <Slider
                    value={[state.fontSizePx]}
                    min={FONT_SIZE_RANGE.min}
                    max={FONT_SIZE_RANGE.max}
                    step={FONT_SIZE_RANGE.step}
                    onValueChange={([v]) => updateState({ fontSizePx: v })}
                  />
                </div>
                
                {/* 자간 (Tracking) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>자간 (Letter Spacing)</Label>
                    <span className="text-sm font-mono">{state.trackingEm.toFixed(3)}em</span>
                  </div>
                  <Slider
                    value={[state.trackingEm]}
                    min={TRACKING_RANGE.min}
                    max={TRACKING_RANGE.max}
                    step={TRACKING_RANGE.step}
                    onValueChange={([v]) => updateState({ trackingEm: v })}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    음수: 글자를 가깝게 / 양수: 글자를 멀게
                  </p>
                </div>
                
                {/* 커닝 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>커닝 (Kerning)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      글자 간격 자동 조정
                    </p>
                  </div>
                  <Switch
                    checked={state.kerning}
                    onCheckedChange={(v) => updateState({ kerning: v })}
                  />
                </div>
                
                {/* 리가처 */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label>리가처 (Ligatures)</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      특수 문자 조합 (fi, fl 등)
                    </p>
                  </div>
                  <Switch
                    checked={state.ligatures}
                    onCheckedChange={(v) => updateState({ ligatures: v })}
                  />
                </div>
                
              </div>
            </Card>
          </TabsContent>
          
          {/* 컬러 탭 */}
          <TabsContent value="color" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                
                <div>
                  <Label>Primary Color</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="color"
                      value={state.primaryColor}
                      onChange={(e) => updateState({ primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={state.primaryColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isValidHexColor(val)) {
                          updateState({ primaryColor: val });
                        }
                      }}
                      placeholder="#111111"
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 인쇄용 로고는 단색(흑백) 버전도 함께 제공됩니다.
                  </p>
                </div>
                
              </div>
            </Card>
          </TabsContent>
          
        </Tabs>
        
        {/* 설정 요약 */}
        <Card className="mt-4 p-4">
          <h3 className="text-sm font-semibold mb-3">현재 설정</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">텍스트</span>
              <span className="font-medium">{state.text || '(없음)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">폰트</span>
              <span className="font-medium">{selectedFont?.family || '(없음)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">크기</span>
              <span className="font-medium">{state.fontSizePx}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">자간</span>
              <span className="font-medium">{state.trackingEm.toFixed(3)}em</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">커닝</span>
              <span className="font-medium">{state.kerning ? 'ON' : 'OFF'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">리가처</span>
              <span className="font-medium">{state.ligatures ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </Card>
        
      </div>
    </div>
  );
}