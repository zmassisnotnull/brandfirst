/**
 * 자동 생성된 3개 시안 선택 UI
 * → 선택 → Print PDF 생성 → 출고 요청
 */

import React, { useState } from 'react';
import { Card } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Badge } from '../../../app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../app/components/ui/tabs';
import { Check, AlertCircle, Info, Download, FileText, Package } from 'lucide-react';
import { toast } from 'sonner';
import type { CardDraft } from './types';
import { PreviewRenderer } from './PreviewRenderer';
import { selectAndLockCard, createFulfillmentJob } from './api';
import { generatePrintPdf, pdfBytesToBlobUrl, downloadPdf } from './pdfGenerator';
import { FulfillmentForm, type FulfillmentData } from './FulfillmentForm';

interface CardConceptPickerProps {
  drafts: CardDraft[];
  logoSvgPath?: string;
  qrDataUrl?: string;
  onRegenerate?: () => void;
  onComplete?: () => void;
}

type Step = 'select' | 'finalized' | 'fulfillment';

export function CardConceptPicker({
  drafts,
  logoSvgPath,
  qrDataUrl,
  onRegenerate,
  onComplete,
}: CardConceptPickerProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | 'C' | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<CardDraft | null>(null);
  const [loading, setLoading] = useState(false);
  
  // PDF 관련
  const [printPdfUrl, setPrintPdfUrl] = useState<string | null>(null);
  const [printPdfBytes, setPrintPdfBytes] = useState<Uint8Array | null>(null);
  const [exportId, setExportId] = useState<string | null>(null);
  
  // 출고 완료
  const [fulfillmentJobId, setFulfillmentJobId] = useState<string | null>(null);
  
  // Preflight 통과한 것만 보여주기
  const validDrafts = drafts.filter((d) => d.preflight.ok);
  
  if (validDrafts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">시안 생성 실패</h3>
        <p className="text-sm text-muted-foreground mb-4">
          입력하신 정보가 명함에 들어가기에 너무 깁니다.
          <br />
          주소나 웹사이트를 짧게 수정하거나, 재생성을 시도해주세요.
        </p>
        {onRegenerate && (
          <Button onClick={onRegenerate} variant="outline">
            다시 생성
          </Button>
        )}
      </Card>
    );
  }
  
  /**
   * 시안 선택 핸들러
   */
  const handleSelect = async (draft: CardDraft) => {
    setLoading(true);
    setSelectedDraft(draft);
    setSelectedVariant(draft.variant);
    
    try {
      // 1) Print PDF 생성 (클라이언트에서)
      toast.info('인쇄용 PDF 생성 중...');
      
      const pdfBytes = await generatePrintPdf({
        draft,
        logoSvgPath,
        qrDataUrl,
      });
      
      const pdfUrl = pdfBytesToBlobUrl(pdfBytes);
      
      setPrintPdfBytes(pdfBytes);
      setPrintPdfUrl(pdfUrl);
      
      // 2) 백엔드에 선택 알림 (실제 환경에서는 여기서 서버에 저장)
      // Mock: 바로 export_id 생성
      const mockExportId = crypto.randomUUID();
      setExportId(mockExportId);
      
      toast.success('시안이 선택되고 인쇄용 PDF가 생성되었습니다!');
      setStep('finalized');
    } catch (error: any) {
      console.error('Selection error:', error);
      toast.error(error.message || '시안 선택 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * PDF 다운로드
   */
  const handleDownload = () => {
    if (!printPdfBytes || !selectedDraft) return;
    
    const filename = `MyBrands_${selectedDraft.card_info.name ?? 'BusinessCard'}_Print.pdf`;
    downloadPdf(printPdfBytes, filename);
    
    toast.success('PDF 다운로드 완료!');
  };
  
  /**
   * 출고 요청 제출
   */
  const handleFulfillmentSubmit = async (data: FulfillmentData) => {
    if (!exportId) {
      toast.error('Export ID가 없습니다.');
      return;
    }
    
    if (!selectedDraft) {
      toast.error('선택된 시안이 없습니다.');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. 먼저 마이 명함에 저장
      const existingCards = localStorage.getItem('savedCards');
      let cards = existingCards ? JSON.parse(existingCards) : [];
      
      // 새로운 명함 ID 생성
      const profileId = cards.length > 0 ? Math.max(...cards.map((c: any) => c.id)) + 1 : 1;
      
      // 명함 메타데이터 준비
      const cardMeta = {
        id: profileId,
        name: selectedDraft.card_info.name || '이름 없음',
        title: selectedDraft.card_info.title || '직함 없음',
        company: selectedDraft.card_info.company || '회사 없음',
        phone: selectedDraft.card_info.phone || '연락처 없음',
        email: selectedDraft.card_info.email || '이메일 없음',
        address: selectedDraft.card_info.address || '',
        domain: selectedDraft.card_info.domain || '',
        variant: selectedDraft.variant,
        side: selectedDraft.side,
        exportId: exportId,
        printPdfUrl: printPdfUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // 명함 레이아웃 저장
      const storageKey = `cardDesign_profile_${profileId}`;
      localStorage.setItem(storageKey, JSON.stringify(selectedDraft.layout));
      
      // savedCards 배열에 추가
      cards.push(cardMeta);
      localStorage.setItem('savedCards', JSON.stringify(cards));
      
      console.log('✅ 명함이 마이 브랜딩 박스에 저장되었습니다:', { profileId, cardMeta });
      
      // 2. 출고 요청 제출
      const result = await createFulfillmentJob({
        export_id: exportId,
        print_options: {
          qty: data.qty,
          paper_type: data.paper_type,
          finish: data.finish,
        },
        shipping: {
          receiver: data.receiver,
          phone: data.phone,
          address: data.address,
          postal_code: data.postal_code,
          memo: data.memo,
        },
      });
      
      setFulfillmentJobId(result.job.id);
      
      toast.success('명함 저장 및 출고 요청이 완료되었습니다!');
      
      // 완료 콜백 (다음 단계로 이동)
      if (onComplete) {
        setTimeout(() => onComplete(), 1500);
      }
    } catch (error: any) {
      console.error('Fulfillment error:', error);
      toast.error(error.message || '출고 요청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== 렌더링 ====================
  
  // Step 1: 시안 선택
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">AI가 생성한 3가지 시안</h3>
            <p className="text-sm text-muted-foreground mt-1">
              마음에 드는 디자인을 선택하세요
            </p>
          </div>
          
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="outline" size="sm">
              다시 생성
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {validDrafts.map((draft) => {
            const isSelected = selectedVariant === draft.variant;
            
            return (
              <Card
                key={draft.variant}
                className={`overflow-hidden transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 shadow-lg'
                    : 'hover:shadow-md cursor-pointer'
                }`}
                onClick={() => !isSelected && !loading && handleSelect(draft)}
              >
                <div className="p-4 border-b bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isSelected ? 'default' : 'secondary'}>
                        시안 {draft.variant}
                      </Badge>
                      
                      {isSelected && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    
                    {draft.preflight.warnings && draft.preflight.warnings.length > 0 && (
                      <Info className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {draft.variant === 'A' && '클래식 레이아웃'}
                    {draft.variant === 'B' && '중앙 강조 레이아웃'}
                    {draft.variant === 'C' && '좌우 분할 레이아웃'}
                  </p>
                </div>
                
                {/* 미리보기 */}
                <div className="aspect-[9/5] bg-muted/10 p-4">
                  <PreviewRenderer
                    draft={draft}
                    logoSvgPath={logoSvgPath}
                    qrDataUrl={qrDataUrl}
                    className="w-full h-full"
                  />
                </div>
                
                <div className="p-4 space-y-3">
                  {/* 생략된 필드 표시 */}
                  {draft.omitted_fields.length > 0 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="text-yellow-800">
                        <strong>자동 생략:</strong>{' '}
                        {draft.omitted_fields
                          .map((f) => {
                            const labels: Record<string, string> = {
                              address: '주소',
                              domain: '웹사이트',
                            };
                            return labels[f] ?? f;
                          })
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* 경고 */}
                  {draft.preflight.warnings && draft.preflight.warnings.length > 0 && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p className="text-blue-800">{draft.preflight.warnings[0]}</p>
                    </div>
                  )}
                  
                  <Button
                    className="w-full"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(draft);
                    }}
                    disabled={loading}
                  >
                    {loading && isSelected ? '생성 중...' : isSelected ? '선택됨' : '이 시안 선택'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        
        {/* 하단 안내 */}
        <Card className="p-4 bg-muted/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">자동 생성 시스템 안내</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• AI가 폰트 크기를 자동으로 조정하여 텍스트가 잘리지 않도록 합니다</li>
                <li>• 공간이 부족하면 주소/웹사이트를 자동으로 생략할 수 있습니다</li>
                <li>• 모든 시안은 인쇄 안전 ��역(Safe Zone) 검사를 통과했습니다</li>
                <li>• 선택 후 바로 인쇄 PDF로 저장됩니다</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // Step 2: 확정 완료 (PDF 다운로드 + 출고 요청)
  if (step === 'finalized' && selectedDraft) {
    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-2">명함 디자인이 확정되었습니다!</h3>
          <p className="text-muted-foreground">
            시안 {selectedDraft.variant}이(가) 선택되어 인쇄용 PDF가 생성되었습니다
          </p>
        </div>
        
        {/* 탭: PDF 미리보기 vs 출고 요청 */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF 미리보기
            </TabsTrigger>
            <TabsTrigger value="fulfillment" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              출고 요청
            </TabsTrigger>
          </TabsList>
          
          {/* PDF 미리보기 */}
          <TabsContent value="preview" className="space-y-4 mt-4">
            <Card className="overflow-hidden">
              <div className="aspect-[9/5] bg-muted">
                {printPdfUrl && (
                  <iframe
                    title="print-pdf"
                    src={printPdfUrl}
                    className="w-full h-full"
                  />
                )}
              </div>
            </Card>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={handleDownload} size="lg">
                <Download className="w-4 h-4 mr-2" />
                PDF 다운로드
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep('select')}
              >
                다른 시안 선택
              </Button>
            </div>
          </TabsContent>
          
          {/* 출고 요청 */}
          <TabsContent value="fulfillment" className="mt-4">
            {fulfillmentJobId ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">출고 요청 완료!</h3>
                <p className="text-muted-foreground mb-6">
                  요청 번호: <code className="px-2 py-1 bg-muted rounded">{fulfillmentJobId}</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  1-2 영업일 내 제작이 시작되며, 배송은 3-5 영업일 소요됩니다.
                </p>
              </Card>
            ) : (
              <FulfillmentForm
                onSubmit={handleFulfillmentSubmit}
                loading={loading}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return null;
}