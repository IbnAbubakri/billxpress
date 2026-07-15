// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScroll } from 'framer-motion';
import {
  Phone, Wifi, Tv, Zap, GraduationCap, Target, ArrowRightLeft,
  Wallet, Shield, Lock, CheckCircle, Smartphone, BarChart3,
  Users, Star, ChevronRight, Menu, X, ArrowRight, Sparkles,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import mtnIcon from '../../assets/icons/mtn.svg';
import gloIcon from '../../assets/icons/glo.png';
import airtelIcon from '../../assets/icons/airtel-logo1.png';
import nineMobileIcon from '../../assets/icons/9mobile.png';
import dstvIcon from '../../assets/icons/dstv.png';
import gotvIcon from '../../assets/icons/gotv.png';
import bet9jaIcon from '../../assets/icons/bet9ja.png';
import sportybetIcon from '../../assets/icons/sportybet.png';

const features = [
  { icon: Phone, title: 'Airtime', desc: 'Instant top-up for MTN, Glo, Airtel & 9mobile', bg: 'bg-blue-50 text-blue-600' },
  { icon: Wifi, title: 'Data Bundles', desc: 'Affordable data plans for all networks', bg: 'bg-green-50 text-green-600' },
  { icon: Tv, title: 'Cable TV', desc: 'DSTV, GOtv & Startimes subscriptions', bg: 'bg-purple-50 text-purple-600' },
  { icon: Zap, title: 'Electricity', desc: 'Pay prepaid & postpaid bills instantly', bg: 'bg-yellow-50 text-yellow-600' },
  { icon: GraduationCap, title: 'Education', desc: 'JAMB, WAEC, NECO & school fees', bg: 'bg-indigo-50 text-indigo-600' },
  { icon: Target, title: 'Betting', desc: 'Fund Bet9ja, SportyBet & more', bg: 'bg-red-50 text-red-600' },
  { icon: ArrowRightLeft, title: 'Airtime to Cash', desc: 'Convert airtime to spendable cash', bg: 'bg-orange-50 text-orange-600' },
];

const stats = [
  { icon: Users, value: '10,000+', label: 'Active Users' },
  { icon: CheckCircle, value: '50,000+', label: 'Transactions Completed' },
  { icon: Star, value: '4.8', label: 'User Rating' },
  { icon: Shield, value: '100%', label: 'Secure Payments' },
];

const partners = [
  { name: 'MTN', icon: mtnIcon },
  { name: 'Glo', icon: gloIcon },
  { name: 'Airtel', icon: airtelIcon },
  { name: '9mobile', icon: nineMobileIcon },
  { name: 'DSTV', icon: dstvIcon },
  { name: 'GOtv', icon: gotvIcon },
  { name: 'Bet9ja', icon: bet9jaIcon },
  { name: 'SportyBet', icon: sportybetIcon },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const { scrollY } = useScroll();

  const servicePaths: Record<string, string> = {
    Airtime: '/airtime',
    'Data Bundles': '/data',
    'Cable TV': '/tv',
    Electricity: '/electricity',
    Education: '/education',
    Betting: '/betting',
    'Airtime to Cash': '/airtime-to-cash',
  };

  useEffect(() => {
    return scrollY.on('change', (y) => setScrolled(y > 20));
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-900">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Logo />
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Features</a>
              <a href="#trust" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Trust</a>
              <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors">Sign In</Link>
              <Link to="/register" className="inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Create Free Account
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu" className="md:hidden p-3 text-gray-600 dark:text-gray-300">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <div className={`md:hidden border-t dark:border-dark-700 bg-white dark:bg-dark-900 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">Features</a>
              <a href="#trust" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">Trust</a>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-3 bg-primary text-white text-sm font-semibold rounded-2xl">
                Create Free Account
              </Link>
            </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 lg:pt-24 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div>
              <div className="motion-safe:animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Trusted by 10,000+ users across Nigeria
              </div>
              <h1 className="motion-safe:animate-slide-up text-4xl sm:text-5xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                Pay bills, buy airtime &amp; data
                <span className="block text-primary mt-2">
                  all in one place
                </span>
              </h1>
              <p className="motion-safe:animate-fade-in text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl mb-10 leading-relaxed">
                BillXpress makes it effortless to pay for airtime, data, cable TV, electricity, education, and more. With instant confirmation and 24/7 support.
              </p>
              <div className="motion-safe:animate-slide-up flex flex-col sm:flex-row items-start gap-4">
                <Link to="/register" className="inline-flex items-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  Create Free Account
                  <ChevronRight className="ml-1.5 w-5 h-5" />
                </Link>
                <Link to="/login" className="inline-flex items-center px-8 py-4 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 text-base font-semibold rounded-2xl border border-gray-200 dark:border-dark-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                  Sign In
                </Link>
              </div>
            </div>
            {/* Phone mockup visual */}
            <div className="flex justify-center items-center mt-10 lg:mt-0 motion-safe:animate-fade-in">
              <div className="relative w-[200px] h-[400px] lg:w-[280px] lg:h-[560px] bg-gray-900 dark:bg-gray-950 rounded-[32px] lg:rounded-[40px] border-4 border-gray-800 dark:border-gray-700 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] lg:w-[120px] h-5 lg:h-6 bg-gray-800 dark:bg-gray-700 rounded-b-xl z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary-600 via-primary-500 to-blue-600">
                  <div className="absolute top-12 lg:top-16 left-4 lg:left-6 right-4 lg:right-6 h-24 lg:h-32 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20" />
                  <div className="absolute top-[148px] lg:top-52 left-4 lg:left-6 right-4 lg:right-6 h-14 lg:h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20" />
                  <div className="absolute top-[226px] lg:top-80 left-4 lg:left-6 right-4 lg:right-6 h-14 lg:h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20" />
                  <div className="absolute bottom-12 lg:bottom-16 left-1/2 -translate-x-1/2 w-10 lg:w-14 h-10 lg:h-14 bg-white/15 rounded-full border border-white/20" />
                  <div className="absolute top-[68px] lg:top-20 left-7 lg:left-10 w-2 lg:w-3 h-2 lg:h-3 bg-emerald-300 rounded-full opacity-80" />
                  <div className="absolute top-24 lg:top-28 right-7 lg:right-10 w-1.5 lg:w-2 h-1.5 lg:h-2 bg-amber-300 rounded-full opacity-80" />
                  <div className="absolute bottom-[100px] lg:bottom-36 left-1/2 -translate-x-1/2 w-4 lg:w-6 h-0.5 lg:h-1 bg-white/20 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section className="py-12 border-y border-gray-100 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {partners.map((p) => (
              <div key={p.name} className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-dark-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-800 transition-all duration-200 p-3">
                <img src={p.icon} alt={p.name} loading="lazy" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="motion-safe:animate-fade-in text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need, one platform
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              From airtime to electricity bills, handle all your payments in seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              const span = i === 0 ? "sm:col-span-2 lg:col-span-2" : "";
              return (
                <button
                  key={f.title}
                  onClick={() => navigate(servicePaths[f.title])}
                  className={`group p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-xl hover:border-transparent dark:hover:border-transparent transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] text-left ${span}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section id="trust" className="py-20 lg:py-28 bg-gray-50 dark:bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {stats.map((s, i) => {
              const Icon = s.icon;
              const span = i === 0 ? "lg:col-span-2" : "";
              return (
                <div key={s.label} className={`text-center p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 ${span}`}>
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="md:col-span-2 bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Bank-Grade Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">256-bit SSL encryption protects every transaction. Your data is safe with us.</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white flex flex-col items-start justify-center">
              <Smartphone className="w-7 h-7 mb-3 opacity-90" />
              <h3 className="text-base font-bold mb-1">Mobile-First</h3>
              <p className="text-sm text-white/80 leading-relaxed">Optimized for Nigerian mobile networks. Works on any device.</p>
            </div>
            <div className="md:col-span-3 bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Real-Time Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Instant transaction confirmations and detailed spending analytics.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 bg-gradient-to-br from-primary to-blue-700 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 relative">
              Ready to get started?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg mx-auto relative">
              Join thousands of Nigerians paying bills the easy way. Create your account in under a minute.
            </p>
            <Link to="/register" className="inline-flex items-center px-8 py-4 bg-white text-primary-700 text-base font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 relative">
              Create Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <p className="text-white/60 text-sm mt-4 relative">No credit card required. Free to get started.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo />
            <p className="text-sm text-gray-600 dark:text-gray-500">
              &copy; {new Date().getFullYear()} BillXpress. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
