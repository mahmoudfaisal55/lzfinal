
import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'quiz', label: 'المقياس الذكي' },
    { id: 'sessions', label: 'الجلسات الإرشادية' },
    { id: 'market', label: 'السوق المهني' }
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfe] print:bg-white selection:bg-emerald-100 selection:text-emerald-900">
      <header className="print:hidden bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleTabChange('home')}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200/50 transition-transform group-hover:rotate-6">
              <span className="text-xl sm:text-2xl font-black">ب</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-none">بوصلتي</h1>
              <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold tracking-widest uppercase mt-1">My Compass</p>
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`px-4 py-2 text-sm font-bold transition-all rounded-xl relative ${
                  activeTab === item.id 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>

          <div className="hidden lg:block">
            <span className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] text-slate-400 font-black">مدرسة أحمد اللوزي الثانوية للبنين • 2026</span>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-slate-100 shadow-2xl animate-fade-in-up p-4 space-y-2">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full text-right px-6 py-4 rounded-2xl text-base font-bold transition-all ${
                  activeTab === item.id 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>

      <footer className="print:hidden bg-slate-900 text-slate-400 py-16 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl">ب</div>
              <h2 className="text-xl font-bold text-white">بوصلتي</h2>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              منصة إرشادية ذكية تهدف لتمكين الجيل القادم من الطلبة الأردنيين لاتخاذ قرارات مهنية قائمة على البيانات والذكاء الاصطناعي.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">روابط سريعة</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {navItems.map(item => (
                <li key={item.id}>
                  <button onClick={() => handleTabChange(item.id)} className="hover:text-emerald-400 transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 md:text-left text-right">
            <h3 className="text-white font-bold text-lg">المؤسسة التعليمية</h3>
            <div className="text-sm space-y-2">
              <p>إشراف: لجنة التوجيه والإرشاد</p>
              <p>قسم الإرشاد النفسي والتربوي</p>
              <p className="text-emerald-400 font-bold">مدرسة أحمد اللوزي الثانوية للبنين</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-center text-[11px] opacity-40">
          © 2026 جميع الحقوق محفوظة لبرنامج بوصلتي - مدرسة أحمد اللوزي الثانوية للبنين
        </div>
      </footer>
    </div>
  );
};

export default Layout;
