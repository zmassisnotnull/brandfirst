import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white text-gray-700 mt-auto border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl mb-4 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
              <span className="logo-first">Go</span>
              <span className="logo-brand">QR</span>
              <span className="logo-first">Card.com</span>
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">AI 기반 브랜딩 플랫폼.<br />
              당신의 브랜드를 디자인하고 관리하세요.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-gray-600">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors text-gray-600">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors text-gray-600">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors text-gray-600">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">브랜드 네이밍 만들기</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">브랜드 로고 만들기</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">브랜드 명함 만들기</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">인쇄 서비스</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">크레딧 요금제</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">자주 묻는 질문</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">이용 가이드</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">주문 조회</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">환불 정책</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">1:1 문의</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">연락처</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-gray-500" />
                <span className="text-gray-600">support@hiqrcard.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-gray-500" />
                <span className="text-gray-600">1588-0000</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                <span className="text-gray-600">서울특별시 강남구<br />테헤란로 123</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">
            © 2026 DOB LABS INC. All rights reserved.
            BrandFirst.ai 제공{' '}
            <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
            </span>
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">이용약관</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">개인정보처리방침</a>
            <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors">사업자정보</a>
          </div>
        </div>
      </div>
    </footer>
  );
}