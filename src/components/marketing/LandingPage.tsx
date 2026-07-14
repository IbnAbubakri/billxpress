// © 2026 Abubakri Faaruq Adebowale (IbnAbubakri). All rights reserved.
// Faruqsuzay@gmail.com | +2349061345507

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
              <Link to="/register" className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold rounded-2xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:scale-[1.02]">
                Get Started
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Link>
            </nav>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t dark:border-dark-700 bg-white dark:bg-dark-900">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">Features</a>
              <a href="#trust" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">Trust</a>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center py-3 bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold rounded-2xl">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-dark-900 dark:via-dark-900 dark:to-dark-800" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Trusted by 10,000+ users across Nigeria
            </div>
            <h1 className="animate-slide-up text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Pay bills, buy airtime &amp; data
              <span className="block text-primary mt-2">
                all in one place
              </span>
            </h1>
            <p className="animate-fade-in text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              BillXpress makes it effortless to pay for airtime, data, cable TV, electricity, education, and more — with instant confirmation and 24/7 support.
            </p>
            <div className="animate-slide-up flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white text-base font-semibold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                Create Free Account
                <ChevronRight className="ml-1.5 w-5 h-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center px-8 py-4 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 text-base font-semibold rounded-2xl border border-gray-200 dark:border-dark-700 hover:shadow-lg transition-all duration-200">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner logos */}
      <section className="py-12 border-y border-gray-100 dark:border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-500 mb-8 uppercase tracking-wider">Trusted partners</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {partners.map((p) => (
              <div key={p.name} className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-dark-800 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-dark-700 hover:shadow-lg hover:border-primary-100 dark:hover:border-primary-800 transition-all duration-200 cursor-pointer p-3">
                <img src={p.icon} alt={p.name} loading="lazy" className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-fade-in text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need, one platform
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              From airtime to electricity bills, handle all your payments in seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.title}
                  onClick={() => navigate(servicePaths[f.title])}
                  className="group p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 hover:shadow-xl hover:border-transparent dark:hover:border-transparent transition-all duration-300 hover:-translate-y-1 text-left"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center p-6 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Lock, title: 'Bank-Grade Security', desc: '256-bit SSL encryption protects every transaction. Your data is safe with us.' },
              { icon: Smartphone, title: 'Mobile-First Experience', desc: 'Optimized for Nigerian mobile networks. Works seamlessly on any device.' },
              { icon: BarChart3, title: 'Real-Time Tracking', desc: 'Instant transaction confirmations and detailed spending analytics.' },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white dark:bg-dark-800 shadow-lg flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t.desc}</p>
                </div>
              );
            })}
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
