import { Sparkles, Image, CreditCard, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';

export interface UsedService {
  id: string;
  category: 'naming' | 'logo' | 'card';
  title: string;
  credits: number;
  timestamp: number;
}

interface ServiceTrackerProps {
  services: UsedService[];
}

export function ServiceTracker({ services }: ServiceTrackerProps) {
  if (services.length === 0) return null;

  const namingServices = services.filter(s => s.category === 'naming');
  const logoServices = services.filter(s => s.category === 'logo');
  const cardServices = services.filter(s => s.category === 'card');

  const totalCredits = services.reduce((sum, s) => sum + s.credits, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'naming':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'logo':
        return <Image className="w-5 h-5 text-pink-600" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'naming':
        return 'from-purple-500 to-pink-500';
      case 'logo':
        return 'from-pink-500 to-rose-500';
      case 'card':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white py-8 mt-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">사용 중인 서비스</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <span className="text-sm font-medium text-gray-700">총 사용 크레딧</span>
              <span className="text-lg font-bold text-purple-600">{totalCredits.toLocaleString()}</span>
            </div>
          </div>

          {/* Service Flow */}
          <div className="grid md:grid-cols-4 gap-4">
            {/* Naming Section */}
            <Card className="p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">네이밍</h4>
                  <p className="text-xs text-gray-500">Naming</p>
                </div>
              </div>
              
              {namingServices.length > 0 ? (
                <div className="space-y-2">
                  {namingServices.map((service, idx) => (
                    <div key={idx} className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-purple-900">{service.title}</span>
                        <span className="text-xs font-bold text-purple-600">{service.credits.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-gray-400">미사용</p>
                </div>
              )}
            </Card>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center -mx-2">
              <ChevronRight className="w-6 h-6 text-gray-300" />
            </div>

            {/* Logo Section */}
            <Card className="p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">로고</h4>
                  <p className="text-xs text-gray-500">Logo</p>
                </div>
              </div>
              
              {logoServices.length > 0 ? (
                <div className="space-y-2">
                  {logoServices.map((service, idx) => (
                    <div key={idx} className="p-2 bg-pink-50 rounded-lg border border-pink-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-pink-900">{service.title}</span>
                        <span className="text-xs font-bold text-pink-600">{service.credits.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-gray-400">미사용</p>
                </div>
              )}
            </Card>

            {/* Arrow */}
            <div className="hidden md:flex items-center justify-center -mx-2">
              <ChevronRight className="w-6 h-6 text-gray-300" />
            </div>

            {/* Card Section */}
            <Card className="p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">명함</h4>
                  <p className="text-xs text-gray-500">Business Card</p>
                </div>
              </div>
              
              {cardServices.length > 0 ? (
                <div className="space-y-2">
                  {cardServices.map((service, idx) => (
                    <div key={idx} className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-900">{service.title}</span>
                        <span className="text-xs font-bold text-blue-600">{service.credits.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-gray-400">미사용</p>
                </div>
              )}
            </Card>
          </div>

          {/* Total Summary */}
          <Card className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">전체 서비스 비용</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {totalCredits.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-gray-600">크레딧</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">사용한 서비스</p>
                <p className="text-2xl font-bold text-purple-600">{services.length}개</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
