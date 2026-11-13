import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  MapPin,
  Wheat,
  Sparkles,
  Camera,
  TestTube,
  Droplets,
  CloudSun,
  History,
  User,
  Settings,
  LogOut,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const farmerNav = [
    { name: t.nav.dashboard, path: '/dashboard', icon: LayoutDashboard },
    { name: t.nav.farms, path: '/farms', icon: MapPin },
    { name: t.nav.crops, path: '/crops', icon: Wheat },
    { name: t.nav.crop_recommend, path: '/crops/recommend', icon: Sparkles },
    { name: t.nav.disease_detect, path: '/disease-detection', icon: Camera },
    { name: t.nav.fertilizer, path: '/fertilizer-advisory', icon: TestTube },
    { name: t.nav.irrigation, path: '/irrigation-advisory', icon: Droplets },
    { name: t.nav.weather, path: '/weather', icon: CloudSun },
    { name: t.nav.history, path: '/history', icon: History },
  ];

  const expertNav = [
    { name: 'Expert Dashboard', path: '/expert/dashboard', icon: ClipboardCheck },
    { name: 'Advisory Reviews', path: '/expert/reviews', icon: History }
  ];

  const adminNav = [
    { name: 'Platform Admin', path: '/admin/dashboard', icon: ShieldAlert },
    { name: 'User Management', path: '/admin/users', icon: User }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200/80 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center h-16 px-6 border-b border-slate-100">
          <span className="font-bold text-lg text-slate-900">
            AgriSmart <span className="text-primary-700">AI</span>
          </span>
          <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary-100 text-primary-800">
            v1.0
          </span>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Farmer Section */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Agricultural Services
            </p>
            <div className="space-y-1">
              {farmerNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-800 font-semibold border-r-4 border-primary-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Expert Section if Expert or Admin */}
          {(user.role === 'expert' || user.role === 'admin') && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Agronomist Review
              </p>
              <div className="space-y-1">
                {expertNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 mr-3 shrink-0 text-emerald-600" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin Section if Admin */}
          {user.role === 'admin' && (
            <div>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                System Administration
              </p>
              <div className="space-y-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 mr-3 shrink-0 text-slate-700" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900"
          >
            <User className="w-4 h-4 mr-3 text-slate-400" />
            {t.nav.profile}
          </NavLink>
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900"
          >
            <Settings className="w-4 h-4 mr-3 text-slate-400" />
            {t.nav.settings}
          </NavLink>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            {t.nav.logout}
          </button>
        </div>
      </aside>
    </>
  );
}
