/**
 * 출고 요청 폼
 */

import React, { useState } from 'react';
import { Card } from '../../../app/components/ui/card';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Button } from '../../../app/components/ui/button';
import { Textarea } from '../../../app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../app/components/ui/select';
import { Package, Truck, Phone, MapPin } from 'lucide-react';

interface FulfillmentFormProps {
  onSubmit: (data: FulfillmentData) => void;
  loading?: boolean;
}

export interface FulfillmentData {
  qty: number;
  paper_type: string;
  finish: string;
  receiver: string;
  phone: string;
  address: string;
  postal_code: string;
  memo: string;
}

export function FulfillmentForm({ onSubmit, loading }: FulfillmentFormProps) {
  const [data, setData] = useState<FulfillmentData>({
    qty: 200,
    paper_type: 'premium',
    finish: 'matte',
    receiver: '',
    phone: '',
    address: '',
    postal_code: '',
    memo: '',
  });
  
  const updateField = <K extends keyof FulfillmentData>(
    field: K,
    value: FulfillmentData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };
  
  const isValid =
    data.receiver.trim().length > 0 &&
    data.phone.trim().length > 0 &&
    data.address.trim().length > 0 &&
    data.qty > 0;
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Package className="w-5 h-5" />
          인쇄 출고 요청
        </h3>
        
        <div className="space-y-6">
          {/* 인쇄 옵션 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              인쇄 옵션
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              {/* 수량 */}
              <div>
                <Label htmlFor="qty">수량</Label>
                <Select
                  value={data.qty.toString()}
                  onValueChange={(v) => updateField('qty', parseInt(v))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100매</SelectItem>
                    <SelectItem value="200">200매</SelectItem>
                    <SelectItem value="500">500매</SelectItem>
                    <SelectItem value="1000">1,000매</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 용지 */}
              <div>
                <Label htmlFor="paper_type">용지</Label>
                <Select
                  value={data.paper_type}
                  onValueChange={(v) => updateField('paper_type', v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">스탠다드 (250g)</SelectItem>
                    <SelectItem value="premium">프리미엄 (300g)</SelectItem>
                    <SelectItem value="luxury">럭셔리 (400g)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 후가공 */}
              <div>
                <Label htmlFor="finish">후가공</Label>
                <Select
                  value={data.finish}
                  onValueChange={(v) => updateField('finish', v)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matte">무광 코팅</SelectItem>
                    <SelectItem value="glossy">유광 코팅</SelectItem>
                    <SelectItem value="uncoated">무코팅</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* 배송 정보 */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Truck className="w-4 h-4" />
              배송 정보
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 수령인 */}
              <div>
                <Label htmlFor="receiver">
                  수령인 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiver"
                  value={data.receiver}
                  onChange={(e) => updateField('receiver', e.target.value)}
                  placeholder="홍길동"
                  className="mt-2"
                  required
                />
              </div>
              
              {/* 연락처 */}
              <div>
                <Label htmlFor="phone">
                  연락처 <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="010-1234-5678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* 주소 */}
            <div>
              <Label htmlFor="address">
                배송 주소 <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="서울시 강남구 테헤란로 123&#10;ABC빌딩 4층"
                  className="pl-10 min-h-[80px]"
                  required
                />
              </div>
            </div>
            
            {/* 우편번호 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="postal_code">우편번호</Label>
                <Input
                  id="postal_code"
                  value={data.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  placeholder="06234"
                  className="mt-2"
                />
              </div>
            </div>
            
            {/* 배송 메모 */}
            <div>
              <Label htmlFor="memo">배송 메모 (선택)</Label>
              <Textarea
                id="memo"
                value={data.memo}
                onChange={(e) => updateField('memo', e.target.value)}
                placeholder="부재 시 경비실에 맡겨주세요"
                className="mt-2"
              />
            </div>
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          disabled={!isValid || loading}
        >
          {loading ? '출고 요청 중...' : '출고 요청 제출'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          출고 요청 후 1-2 영업일 내 제작이 시작됩니다
        </p>
      </Card>
    </form>
  );
}
