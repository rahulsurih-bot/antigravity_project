import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe, User, Shield, Stethoscope, Sprout } from 'lucide-react';

export function Header({ onMenuClick }) {
  const { user, switchRole } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 rounded-lg md:hidden hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary-700 text-white rounded-lg">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            AgriSmart <span className="text-primary-700 font-extrabold">AI</span>
          </span>
        </div>
      </div>

      {/* Right side: Language, Role Switcher & Profile */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Language Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer text-slate-800 font-semibold"
          >
            <option value="en">English (EN)</option>
            <option value="kn">ಕನ್ನಡ (KN)</option>
            <option value="hi">हिन्दी (HI)</option>
          </select>
        </div>

        {/* Role Switcher Pill for Demo */}
        <div className="hidden sm:flex items-center space-x-1 bg-slate-100 rounded-lg p-1 text-xs">
          <button
            onClick={() => switchRole('farmer')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              user.role === 'farmer' ? 'bg-primary-700 text-white font-medium shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Farmer
          </button>
          <button
            onClick={() => switchRole('expert')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              user.role === 'expert' ? 'bg-emerald-700 text-white font-medium shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expert
          </button>
          <button
            onClick={() => switchRole('admin')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              user.role === 'admin' ? 'bg-slate-800 text-white font-medium shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
        </div>

        {/* User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs border border-primary-200">
            {user.full_name?.charAt(0) || 'F'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">{user.full_name}</p>
            <p className="text-[10px] text-primary-700 font-medium capitalize mt-0.5">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
