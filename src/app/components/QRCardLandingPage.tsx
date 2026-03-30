import {
  QrCode,
  Smartphone,
  Share2,
  Eye,
  TrendingUp,
  Zap,
  Check,
  ArrowRight,
  Users,
  Globe,
  Download,
  MessageSquare,
  Star,
  Sparkles,
  Scan,
  Camera,
  Link2,
  BarChart3,
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Github,
  Instagram,
  ExternalLink,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Footer } from './Footer';
import { motion } from 'motion/react';
import { RecentCards } from '../../features/qrcard/components/RecentCards';

interface QRCardLandingPageProps {
  onNavigate: (page: string) => void;
  user: any;
  onOpenAuthModal?: () => void;
}

export function QRCardLandingPage({ onNavigate, user, onOpenAuthModal }: QRCardLandingPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Section - Modern Minimal */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-gradient-to-b from-yellow-50 to-orange-50">

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mx-[0px] mt-[0px] mb-[40px]"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">모바일 최적화 디지털 명함</span>
            </div>

            {/* Headline - Extra Large */}
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                명함 사진 찍고 <br />
                <span className="logo-brand text-orange-500">10초</span> 만에 완성
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              AI가 명함 정보를 즉시 분석하여 디지털 명함으로 만들어 드립니다. <br />
              <span className="font-medium text-blue-600">로그인 없이 지금 바로 시작하세요.</span>
            </p>

            {/* CTA Buttons - Minimalist */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {user ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-base rounded-full shadow-lg hover:shadow-xl transition-all group !p-[30px]"
                  onClick={() => onNavigate('qrcard-digital')}
                >
                  내 디지털 명함 관리
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-lg rounded-full shadow-[0_10px_40px_rgba(249,115,22,0.3)] hover:shadow-[0_15px_50px_rgba(249,115,22,0.4)] transition-all group !px-10 !py-8 font-extrabold"
                    onClick={() => onNavigate('qrcard-create')}
                  >
                    10초 만에 만들기
                    <Zap className="w-6 h-6 ml-3 fill-current animate-pulse" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 text-base rounded-full px-[30px] py-[28px]"
                    onClick={() => {
                      const demoSection = document.getElementById('demo-section');
                      demoSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    데모 보기
                  </Button>
                </>
              )}
            </div>

            {/* Stats - Minimal */}
            <div className="flex items-center justify-center gap-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>99.9% 스캔 성공률</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>3초 안에 공유</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>무제한 사용</span>
              </div>
            </div>

            {/* Recent Cards Section */}
            <div className="mt-16 max-w-lg mx-auto">
              <RecentCards onNavigate={onNavigate} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process - Quick & Easy */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">세상에서 가장 빠른 명함 디지털화</h2>
            <p className="text-gray-500">복잡한 입력 없이 사진 한 장이면 충분합니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                icon: <Camera className="w-8 h-8 text-blue-600" />,
                title: "사진 찍기",
                desc: "가지고 계신 종이 명함을 스마트폰으로 선명하게 촬영하세요."
              },
              {
                step: "02",
                icon: <Sparkles className="w-8 h-8 text-purple-600" />,
                title: "AI 분석",
                desc: "AI가 이름, 연락처, 이메일 등의 정보를 1초 만에 정확히 추출합니다."
              },
              {
                step: "03",
                icon: <Smartphone className="w-8 h-8 text-orange-600" />,
                title: "즉시 연결",
                desc: "생성된 QR 코드를 공유하거나 연락처를 주소록에 바로 저장하세요."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative p-8 rounded-3xl bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group text-center"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center font-bold text-gray-300">
                  {item.step}
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-32 px-6 bg-white">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              디지털 명함의 힘
            </h2>
            <p className="text-xl text-gray-500 font-light">
              종이 명함을 넘어선 새로운 경험
            </p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Large Feature Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-3xl p-12 relative overflow-hidden group hover:shadow-2xl transition-shadow"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-6">
                  <Scan className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">
                  QR 코드 스캔
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  스마트폰 카메라로 QR 코드만 스캔하면 모든 정보가 즉시 전달됩니다.
                  별도의 앱 설치나 복잡한 과정 없이 간편하게 연결하세요.
                </p>

                {/* QR Code Visual */}
                <div className="mt-8 flex items-center justify-center">
                  <div className="w-48 h-48 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-800" />
                  </div>
                </div>
              </div>

              {/* Decorative Background */}
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
            </motion.div>

            {/* Small Feature Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                무제한 공유
              </h3>
              <p className="text-gray-600 leading-relaxed">
                링크, 메시지, SNS로 언제 어디서나 공유 가능
              </p>
            </motion.div>

            {/* Small Feature Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-pink-50 to-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-pink-500 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                실시간 업데이트
              </h3>
              <p className="text-gray-600 leading-relaxed">
                정보 변경 시 즉시 반영, 이미 공유한 명함도 자동 업데이트
              </p>
            </motion.div>

            {/* Medium Feature Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-1 bg-gradient-to-br from-green-50 to-white border border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                통계 분석
              </h3>
              <p className="text-gray-600 leading-relaxed">
                조회수, 공유 수, 클릭률 등 명함 활용도를 실시간 확인
              </p>
            </motion.div>

            {/* Large Feature Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-2 bg-gradient-to-br from-orange-50 to-white border border-gray-200 rounded-3xl p-10 relative overflow-hidden group hover:shadow-xl transition-shadow"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">
                  모바일 최적화
                </h3>
                <p className="text-gray-600 leading-relaxed text-lg">
                  모든 스마트폰에서 완벽하게 작동하는 반응형 디자인.
                  연락처 자동 저장(VCard) 기능으로 상대방이 쉽게 저장할 수 있습니다.
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="absolute -bottom-4 -right-8 opacity-20">
                <Smartphone className="w-64 h-64 text-orange-500" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section - Glassmorphism */}
      <section id="demo-section" className="bg-gradient-to-b from-gray-50 to-white relative overflow-hidden px-[24px] pt-[128px] pb-[0px]">
        {/* Background Elements */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />


        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              플랜 미리보기
            </h2>
            <p className="text-xl text-gray-500 font-light">
              스타터와 프로페셔널 플랜을 비교해보세요
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 스타터 플랜 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* 플랜 배지 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Star className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">스타터 플랜</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 font-bold">활용도 높은 개인 프로필</p>
              </div>

              {/* Modern Card Preview */}
              <div className="relative w-[350px] mx-auto">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />

                {/* Card - PublicProfile.tsx와 동일 */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
                  {/* Cover Image / Gradient Header - 단일 칼라 */}
                  <div className="relative h-56 bg-blue-600">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />

                    {/* Profile Section */}
                    <div className="relative h-full flex flex-col items-center justify-center px-6">
                      {/* Profile Image */}
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md shadow-xl overflow-hidden flex items-center justify-center border-4 border-white/50">
                          <Users className="w-12 h-12 text-white/80" />
                        </div>
                      </div>

                      {/* Name and Title */}
                      <h1 className="text-2xl font-bold text-white text-center mb-1">
                        김철수
                      </h1>
                      <p className="text-white/90 text-center font-medium">
                        소프트웨어 엔지니어
                      </p>
                      <p className="text-white/80 text-center text-sm mt-1">
                        개발자
                      </p>
                    </div>
                  </div>

                  {/* White Card Content */}
                  <div className="bg-white px-6 pb-8 pt-6">
                    {/* Tagline */}
                    <div className="text-center mb-6 py-3 bg-blue-600/10 rounded-[25px]">
                      <p className="text-sm text-gray-700 font-medium">
                        사용자 경험을 혁신합니다
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed text-center">
                        AI와 디자인의 경계에서 새로운 가능성을 탐구하는 풀스택 개발자입니다.
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600/15 text-blue-600 py-3 px-4 rounded-full font-medium hover:bg-blue-50 transition-colors text-sm">
                        <Phone className="w-4 h-4" />
                        전화하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-green-600/15 text-green-600 py-3 px-4 rounded-full font-medium hover:bg-green-50 transition-colors text-sm">
                        <MessageSquare className="w-4 h-4" />
                        문자하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-amber-700/15 text-amber-700 py-3 px-4 rounded-full font-medium hover:bg-amber-50 transition-colors text-sm">
                        <Mail className="w-4 h-4" />
                        이메일
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-purple-600/15 text-purple-600 py-3 px-4 rounded-full font-medium hover:bg-purple-50 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        연락처 저장
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">010-1234-5678</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">hello@brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">Seoul, South Korea</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-center">
                      {/* VCF 저장 버튼 */}
                      <button className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-900 py-3 px-4 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm">
                        <Download className="w-4 h-4" />
                        VCF 포맷 저장
                      </button>

                      <p className="text-xs text-gray-500">
                        BrandFirst.ai 제공{' '}
                        <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Your Own CTA */}
                <div className="mt-6 text-center">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all px-[30px] py-[12px]"
                    onClick={() => user ? onNavigate('qrcard-digital') : onNavigate('auth')}
                  >
                    {user ? '디지털 명함 만들기' : '나만의 디지털 명함 만들기'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* 프로페셔널 플랜 - 직업용 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* 플랜 배지 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-red-800">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">프로페셔널 플랜</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium font-bold">개인 비즈니스용 프로필</p>
              </div>

              {/* 멀티 프로필 - 직업용 명함 */}
              <div className="relative w-[350px] mx-auto">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-30" />

                {/* Card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl ring-2 ring-purple-500/30">
                  {/* Cover Image / Gradient Header - 그라데이션 */}
                  <div className="relative h-56 bg-gradient-to-br from-blue-500 to-purple-600">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />

                    {/* Profile Section */}
                    <div className="relative h-full flex flex-col items-center justify-center px-6">
                      {/* Profile Image */}
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md shadow-xl overflow-hidden flex items-center justify-center border-4 border-white/50">
                          <Users className="w-12 h-12 text-white/80" />
                        </div>
                      </div>

                      {/* Name and Title */}
                      <h1 className="text-2xl font-bold text-white text-center mb-1">
                        김철수
                      </h1>
                      <p className="text-white/90 text-center font-medium">
                        소프트웨어 엔지니어
                      </p>
                      <p className="text-white/80 text-center text-sm mt-1">
                        개발자
                      </p>
                    </div>
                  </div>

                  {/* White Card Content */}
                  <div className="bg-white px-6 pb-8 pt-6">
                    {/* Tagline */}
                    <div className="text-center mb-6 py-3 bg-purple-600/10 rounded-[25px]">
                      <p className="text-sm text-gray-700 font-medium">
                        사용자 경험을 혁신합니다
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed text-center">
                        AI와 디자인의 경계에서 새로운 가능성을 탐구하는 풀스택 개발자입니다.
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600/25 text-blue-600 py-3 px-4 rounded-full font-medium hover:bg-blue-50 transition-colors text-sm">
                        <Phone className="w-4 h-4" />
                        전화하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-green-600/25 text-green-600 py-3 px-4 rounded-full font-medium hover:bg-green-50 transition-colors text-sm">
                        <MessageSquare className="w-4 h-4" />
                        문자하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-amber-700/25 text-amber-700 py-3 px-4 rounded-full font-medium hover:bg-amber-50 transition-colors text-sm">
                        <Mail className="w-4 h-4" />
                        이메일
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-purple-600/25 text-purple-600 py-3 px-4 rounded-full font-medium hover:bg-purple-50 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        연락처 저장
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">010-1234-5678</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">hello@brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">Seoul, South Korea</span>
                      </div>
                    </div>

                    {/* Social Links - 프로페셔널 전용 */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                        소셜 미디어
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <a
                          href="#"
                          className="flex items-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                          <span className="font-medium flex-1">LinkedIn</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                        <a
                          href="#"
                          className="flex items-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          <Github className="w-5 h-5" />
                          <span className="font-medium flex-1">GitHub</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                        <a
                          href="#"
                          className="flex items-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="font-medium flex-1">Instagram</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-center">
                      {/* VCF 저장 버튼 */}
                      <button className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-900 py-3 px-4 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm">
                        <Download className="w-4 h-4" />
                        VCF 포맷 저장
                      </button>

                      <p className="text-xs text-gray-500">
                        BrandFirst.ai 제공{' '}
                        <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Your Own CTA */}
                <div className="mt-6 text-center">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all px-[30px] py-[12px]"
                    onClick={() => user ? onNavigate('qrcard-digital') : onNavigate('auth')}
                  >
                    {user ? '디지털 명함 만들기' : '나만의 디지털 명함 만들기'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* 프로페셔널 플랜 - 취미용 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* 플랜 배지 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-600 to-red-800">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">프로페셔널 플랜</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium font-bold">개인 취미/투잡용 프로필</p>
              </div>

              {/* 멀티 프로필 - 취미용 명함 */}
              <div className="relative w-[350px] mx-auto">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />

                {/* Card */}
                <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl ring-2 ring-green-500/30">
                  {/* Cover Image / Gradient Header - 그라데이션 */}
                  <div className="relative h-56 bg-gradient-to-br from-green-500 to-blue-500">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />

                    {/* Profile Section */}
                    <div className="relative h-full flex flex-col items-center justify-center px-6">
                      {/* Profile Image */}
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md shadow-xl overflow-hidden flex items-center justify-center border-4 border-white/50">
                          <Users className="w-12 h-12 text-white/80" />
                        </div>
                      </div>

                      {/* Name and Title */}
                      <h1 className="text-2xl font-bold text-white text-center mb-1">
                        김철수
                      </h1>
                      <p className="text-white/90 text-center font-medium">
                        주말 사진작가
                      </p>
                      <p className="text-white/80 text-center text-sm mt-1">
                        사진작가
                      </p>
                    </div>
                  </div>

                  {/* White Card Content */}
                  <div className="bg-white px-6 pb-8 pt-6">
                    {/* Tagline */}
                    <div className="text-center mb-6 py-3 bg-green-600/10 rounded-[25px]">
                      <p className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        멀티 프로필 (취미용)
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                      <p className="text-gray-600 text-sm leading-relaxed text-center">
                        주말마다 카메라를 들고 세상의 아름다움을 담아냅니다.
                      </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-blue-600/25 text-blue-600 py-3 px-4 rounded-full font-medium hover:bg-blue-50 transition-colors text-sm">
                        <Phone className="w-4 h-4" />
                        전화하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-green-600/25 text-green-600 py-3 px-4 rounded-full font-medium hover:bg-green-50 transition-colors text-sm">
                        <MessageSquare className="w-4 h-4" />
                        문자하기
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-amber-700/25 text-amber-700 py-3 px-4 rounded-full font-medium hover:bg-amber-50 transition-colors text-sm">
                        <Mail className="w-4 h-4" />
                        이메일
                      </button>
                      <button className="flex items-center justify-center gap-2 bg-white border-2 border-purple-600/25 text-purple-600 py-3 px-4 rounded-full font-medium hover:bg-purple-50 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        연락처 저장
                      </button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">010-9999-8888</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">photo@brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">photo.brandfirst.ai</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700">Seoul, South Korea</span>
                      </div>
                    </div>

                    {/* Social Links - 프로페셔널 전용 */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                        소셜 미디어
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <a
                          href="#"
                          className="flex items-center gap-3 py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-full text-sm text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          <Instagram className="w-5 h-5" />
                          <span className="font-medium flex-1">Instagram</span>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      </div>
                    </div>

                    {/* Custom Fields - 커스텀 필드 3개 */}
                    <div className="mb-6">
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                        추가 정보
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm py-2">
                          <Star className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">장비: Canon EOS R5</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm py-2">
                          <Star className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">전문분야: 풍경/인물</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm py-2">
                          <Star className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700">경력: 5년</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t pt-6 text-center">
                      {/* VCF 저장 버튼 */}
                      <button className="w-full mb-4 flex items-center justify-center gap-2 bg-white text-gray-900 py-3 px-4 rounded-full font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm">
                        <Download className="w-4 h-4" />
                        VCF 포맷 저장
                      </button>

                      <p className="text-xs text-gray-500">
                        BrandFirst.ai 제공{' '}
                        <span className="inline-flex items-center text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          <span className="logo-brand">Brand</span><span className="logo-first">First.ai</span>
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Create Your Own CTA */}
                <div className="mt-6 text-center">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all px-[30px] py-[12px]"
                    onClick={() => user ? onNavigate('qrcard-digital') : onNavigate('auth')}
                  >
                    {user ? '디지털 명함 만들기' : '나만의 디지털 명함 만들기'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 플랜 안내 */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500"><span className="font-bold">프로페셔널 플랜 </span>: 스타터 플랜 + 무제한 멀티 프로필 + 소셜 미디어 링크 + 추가 커스텀 필드 3개</p>
          </div>
        </div>
      </section>

      {/* 플랜 보기 버튼 */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => onNavigate('qrcard-pricing')}
              className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 !p-[30px]"
            >
              디지털 명함 플랜 보기
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => onNavigate('qrcard-credit')}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2 !p-[30px]"
            >
              크레딧 구매하기
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}