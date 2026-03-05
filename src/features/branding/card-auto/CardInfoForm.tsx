/**
 * 명함 정보 입력 폼
 */

import React, { useState } from 'react';
import { Card } from '../../../app/components/ui/card';
import { Input } from '../../../app/components/ui/input';
import { Label } from '../../../app/components/ui/label';
import { Button } from '../../../app/components/ui/button';
import { Switch } from '../../../app/components/ui/switch';
import type { CardInfo } from './types';

interface CardInfoFormProps {
  onSubmit: (info: CardInfo, qrEnabled: boolean) => void;
  initialInfo?: CardInfo;
  loading?: boolean;
}

export function CardInfoForm({ onSubmit, initialInfo, loading }: CardInfoFormProps) {
  const [info, setInfo] = useState<CardInfo>(
    initialInfo ?? {
      name: '',
      title: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      domain: '',
    }
  );
  
  const [qrEnabled, setQrEnabled] = useState(true);
  
  const updateField = (field: keyof CardInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(info, qrEnabled);
  };
  
  const isValid = info.name && info.name.trim().length > 0;
  
  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">명함 정보 입력</h3>
        
        <div className="space-y-4">
          {/* 이름 (필수) */}
          <div>
            <Label htmlFor="name">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={info.name ?? ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="홍길동"
              required
              className="mt-2"
            />
          </div>
          
          {/* 직함 */}
          <div>
            <Label htmlFor="title">직함</Label>
            <Input
              id="title"
              value={info.title ?? ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="대표이사"
              className="mt-2"
            />
          </div>
          
          {/* 회사명 */}
          <div>
            <Label htmlFor="company">회사명</Label>
            <Input
              id="company"
              value={info.company ?? ''}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="(주)마이브랜드"
              className="mt-2"
            />
          </div>
          
          {/* 전화번호 */}
          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={info.phone ?? ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="010-1234-5678"
              className="mt-2"
            />
          </div>
          
          {/* 이메일 */}
          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              value={info.email ?? ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="hello@mybrand.ai"
              className="mt-2"
            />
          </div>
          
          {/* 웹사이트/도메인 */}
          <div>
            <Label htmlFor="domain">웹사이트</Label>
            <Input
              id="domain"
              value={info.domain ?? ''}
              onChange={(e) => updateField('domain', e.target.value)}
              placeholder="www.mybrand.ai"
              className="mt-2"
            />
          </div>
          
          {/* 주소 */}
          <div>
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={info.address ?? ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="서울시 강남구 테헤란로 123"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              주소가 길 경우 자동으로 생략될 수 있습니다
            </p>
          </div>
          
          {/* QR 코드 포함 */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>QR 코드 포함</Label>
              <p className="text-xs text-muted-foreground mt-1">
                디지털 명함 링크를 QR로 제공
              </p>
            </div>
            <Switch checked={qrEnabled} onCheckedChange={setQrEnabled} />
          </div>
        </div>
        
        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          disabled={!isValid || loading}
        >
          {loading ? 'AI로 시안 생성 중...' : 'AI로 3개 시안 자동 생성'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-3">
          AI가 자동으로 최적의 레이아웃 3가지를 생성합니다
        </p>
      </Card>
    </form>
  );
}
