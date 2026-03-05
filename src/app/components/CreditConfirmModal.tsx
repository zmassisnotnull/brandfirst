import { X, Sparkles, AlertCircle, ArrowRight, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CreditConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
  serviceType: string;
  requiredCredits: number;
  currentCredits: number;
  gradient?: string;
}

export function CreditConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  serviceType,
  requiredCredits,
  currentCredits,
  gradient = 'from-blue-600 to-purple-600',
}: CreditConfirmModalProps) {
  if (!isOpen) return null;

  const remainingCredits = currentCredits - requiredCredits;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md relative overflow-hidden animate-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-all"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Header with Gradient */}
        <div className={`bg-gradient-to-br ${gradient} p-8 text-white`}>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">{serviceName}</h2>
          <p className="text-white/90 text-sm text-center">{serviceType}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Credit Info */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">크레딧 사용 내역</h3>
            </div>

            <div className="space-y-3">
              {/* Current Credits */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">현재 보유 크레딧</span>
                <span className="font-semibold text-gray-900">{currentCredits.toLocaleString()}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Required Credits */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">차감될 크레딧</span>
                <span className="font-semibold text-red-600">-{requiredCredits.toLocaleString()}</span>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200"></div>

              {/* Remaining Credits */}
              <div className="flex justify-between items-center py-2 bg-white rounded-lg px-3 -mx-3">
                <span className="text-sm font-semibold text-gray-900">차감 후 잔액</span>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {remainingCredits.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">크레딧 차감 안내</p>
              <p>확인 버튼을 누르면 즉시 크레딧이 차감되며, 이 작업은 되돌릴 수 없습니다.</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 font-semibold"
            >
              취소
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 h-12 font-semibold bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg`}
            >
              확인하고 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
