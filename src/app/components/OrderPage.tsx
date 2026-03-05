import { useState } from 'react';
import { Check, Truck, CreditCard, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Input } from './ui/input';
import { Footer } from './Footer';

interface OrderPageProps {
  onNavigate: (page: string) => void;
}

export function OrderPage({ onNavigate }: OrderPageProps) {
  const [selectedPaper, setSelectedPaper] = useState('standard');
  const [quantity, setQuantity] = useState(100);

  const paperOptions = [
    {
      id: 'standard',
      name: '일반지',
      description: '250g 아트지, 매트 코팅',
      price: 15000,
      image: '📄',
    },
    {
      id: 'premium',
      name: '고급지',
      description: '300g 스노우지, 양면 코팅',
      price: 25000,
      image: '✨',
    },
    {
      id: 'special',
      name: '특수지',
      description: '크라프트지, 엠보싱',
      price: 35000,
      image: '🎨',
    },
  ];

  const quantities = [50, 100, 200, 500];

  const selectedOption = paperOptions.find((p) => p.id === selectedPaper);
  const totalPrice = selectedOption ? selectedOption.price * (quantity / 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 flex-1">
        <div className="max-w-5xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-8">
                {[
                  { step: 1, label: '용지 선택', active: true },
                  { step: 2, label: '배송 정보', active: false },
                  { step: 3, label: '결제', active: false },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          item.active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {item.active ? item.step : <Check className="w-6 h-6" />}
                      </div>
                      <p className="text-sm mt-2">{item.label}</p>
                    </div>
                    {index < 2 && (
                      <div className="w-24 h-0.5 bg-gray-200 mx-4 mb-6"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left - Options */}
            <div className="lg:col-span-2 space-y-6">
              {/* Paper Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  용지 선택
                </h2>

                <RadioGroup value={selectedPaper} onValueChange={setSelectedPaper}>
                  <div className="space-y-3">
                    {paperOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaper === option.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={option.id} />
                        <div className="text-4xl">{option.image}</div>
                        <div className="flex-1">
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        <p className="text-lg font-semibold">
                          {option.price.toLocaleString()}원
                          <span className="text-sm text-gray-500 font-normal">/100매</span>
                        </p>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </Card>

              {/* Quantity Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">수량 선택</h2>
                <div className="grid grid-cols-4 gap-3">
                  {quantities.map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setQuantity(qty)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        quantity === qty
                          ? 'border-blue-600 bg-blue-50 font-semibold'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {qty}매
                    </button>
                  ))}
                </div>
              </Card>

              {/* Shipping Info */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  배송 정보
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label>받는 분</Label>
                    <Input placeholder="이름을 입력하세요" />
                  </div>
                  <div>
                    <Label>연락처</Label>
                    <Input placeholder="010-0000-0000" />
                  </div>
                  <div>
                    <Label>배송 주소</Label>
                    <Input placeholder="주소를 입력하세요" className="mb-2" />
                    <Input placeholder="상세 주소" />
                  </div>
                  <div>
                    <Label>배송 메모</Label>
                    <Input placeholder="배송 시 요청사항 (선택)" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">주문 요약</h2>

                {/* Preview */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg aspect-[1.6/1] mb-6 flex items-center justify-center text-white">
                  <div className="text-center">
                    <p className="text-2xl font-bold">김철수</p>
                    <p className="text-sm mt-1">Software Engineer</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-3 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">용지</span>
                    <span className="font-medium">{selectedOption?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">수량</span>
                    <span className="font-medium">{quantity}매</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">배송비</span>
                    <span className="font-medium">무료</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">총 결제금액</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>

                {/* Payment Button */}
                <Button className="w-full h-12 gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                  <CreditCard className="w-5 h-5" />
                  결제하기
                </Button>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p>• 평균 제작 기간: 3-5 영업일</p>
                  <p>• 배송 기간: 2-3일</p>
                  <p>• 전국 무료 배송</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}