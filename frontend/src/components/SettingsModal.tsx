import { useState } from 'react';
import { X, Settings, User, Moon, Sun, LogOut, Shield, Bell, Palette, Lock, Key, RefreshCw, Laptop } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'profile' | 'appearance' | 'security';

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as any;

export default function SettingsModal() {
  const { setSettingsOpen, updateSettings } = useAppStore();
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [notificationsEnabled, setNotifications] = useState(true);
  const [privacyEnabled, setPrivacy] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("X11")) os = "UNIX";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  };

  const deviceInfo = getDeviceInfo();

  const isDark = theme === 'dark';
  const bgBase = isDark ? 'bg-[#060B12]' : 'bg-gray-50';
  const bgSurface = isDark ? 'bg-[#0A111C]' : 'bg-white';
  const textPrim = isDark ? 'text-white' : 'text-gray-900';
  const textSec = isDark ? 'text-gray-400' : 'text-gray-700'; // Darker for light mode visibility
  const textSubtle = isDark ? 'text-gray-500' : 'text-gray-600'; // Darker for light mode visibility
  const borderCls = isDark ? 'border-[#1E3550]' : 'border-gray-200';
  const borderSubtle = isDark ? 'border-[#1E3550]/50' : 'border-gray-200';
  const hoverBorder = isDark ? 'hover:border-gray-500' : 'hover:border-gray-400';
  const hoverBg = isDark ? 'hover:bg-[#0A111C]/50' : 'hover:bg-gray-100';

  const directionOptions = [
    { value: 'south', label: 'South (Optimal)' },
    { value: 'south-west', label: 'South-West' },
    { value: 'south-east', label: 'South-East' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'north', label: 'North' },
  ];

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'security', icon: Lock, label: 'Security' },
  ];

  const userInitials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'SS';

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'Not signed in';
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  /* shared input class */
  const inputCls = `w-full ${bgBase} ${borderCls} rounded-xl px-4 py-3 ${textPrim} text-sm font-mono
                     focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all duration-300
                     placeholder:${textSubtle}`;
  const selectCls = inputCls;
  const labelCls = `block ${textSec} text-xs mb-2 font-semibold uppercase tracking-wider`;
  const hintCls = `text-gray-600 text-[11px] mt-1.5 font-mono`;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center ${isDark ? 'bg-[#060B12]/80' : 'bg-white/60'} backdrop-blur-2xl`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={SPRING}
        className={`${isDark ? 'bg-[#0A111C]/90' : 'bg-white/95'} backdrop-blur-xl border ${borderCls} rounded-3xl w-full max-w-2xl mx-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] max-h-[90vh] flex flex-col overflow-hidden relative`}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0A84FF]/50 to-transparent opacity-50" />

        {/* Header */}
        <div className={`flex items-center justify-between px-8 py-6 border-b ${borderCls} shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 rounded-xl border border-[#0A84FF]/20">
              <Settings size={20} className="text-[#0A84FF]" />
            </div>
            <div>
              <h2 id="settings-title" className={`${textPrim} font-extrabold text-xl tracking-wide`} style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
                SETTINGS & PROFILE
              </h2>
              <p className={`${textSec} text-sm font-mono mt-0.5`}>Manage your account & preferences</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className={`p-2.5 rounded-full ${bgBase} ${textSec} hover:${textPrim} border ${borderCls} transition-all duration-300 ${hoverBorder}`}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 px-8 py-3 border-b ${borderSubtle} shrink-0 ${isDark ? 'bg-[#060B12]/30' : 'bg-gray-50/50'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30 shadow-[0_0_10px_rgba(10,132,255,0.15)]'
                  : `${textSec} hover:${textPrim} ${hoverBg} border border-transparent`
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <AnimatePresence mode="wait">
            {/* ═══════════════ PROFILE TAB ═══════════════ */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* User Card */}
                <div className={`${bgBase} border ${borderCls} rounded-2xl p-6 relative overflow-hidden`}>
                  {/* Decorative orb */}
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#38bdf8] flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(10,132,255,0.4)]"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${textPrim} font-bold text-lg tracking-wide truncate`}>{userName}</p>
                      <p className={`${textSec} text-sm font-mono truncate`}>{userEmail}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#22c55e]/20">
                          <Shield size={10} /> Verified
                        </span>
                        <span className="text-gray-500 text-[11px] font-mono">Joined {joinDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Account</p>

                  <button
                    onClick={() => setNotifications(!notificationsEnabled)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl ${bgBase} border ${borderCls} ${hoverBorder} transition-all text-left cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${bgSurface} border ${borderCls} ${textSec}`}>
                        <Bell size={18} />
                      </div>
                      <div>
                        <p className={`${textPrim} font-semibold text-sm`}>Notifications</p>
                        <p className="text-gray-500 text-xs mt-0.5">Email alerts for reports</p>
                      </div>
                    </div>
                    <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${notificationsEnabled ? 'bg-[#0A84FF]' : 'bg-gray-400 dark:bg-gray-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${notificationsEnabled ? 'left-5' : 'left-1'}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setPrivacy(!privacyEnabled)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl ${bgBase} border ${borderCls} ${hoverBorder} transition-all text-left cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${bgSurface} border ${borderCls} ${textSec}`}>
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className={`${textPrim} font-semibold text-sm`}>Privacy mode</p>
                        <p className="text-gray-500 text-xs mt-0.5">Hide data history</p>
                      </div>
                    </div>
                    <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${privacyEnabled ? 'bg-[#22c55e]' : 'bg-gray-400 dark:bg-gray-600'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${privacyEnabled ? 'left-5' : 'left-1'}`} />
                    </div>
                  </button>

                  <button
                    onClick={async () => { await signOut(); setSettingsOpen(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-all duration-300 text-left group"
                  >
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                      <LogOut size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-400 font-semibold text-sm">Sign Out</p>
                      <p className="text-gray-600 text-xs mt-0.5">Log out of your account</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ APPEARANCE TAB ═══════════════ */}
            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Theme Toggle */}
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Theme</p>
                  <div className={`${bgBase} border ${borderCls} rounded-2xl p-6 space-y-6`}>
                    {/* Big toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border transition-all duration-500 ${theme === 'dark'
                            ? 'bg-[#0A84FF]/15 border-[#0A84FF]/30 text-[#0A84FF]'
                            : 'bg-[#FF9A5C]/15 border-[#FF9A5C]/30 text-[#FF9A5C]'
                          }`}>
                          {theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}
                        </div>
                        <div>
                          <p className={`${textPrim} font-bold text-base tracking-wide`}>
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </p>
                          <p className={`${textSec} text-sm mt-0.5`}>
                            {theme === 'dark' ? 'Optimized for low-light environments' : 'Bright interface for daytime use'}
                          </p>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={toggleTheme}
                        className={`relative w-16 h-9 rounded-full transition-all duration-500 ${theme === 'dark'
                            ? 'bg-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.4)]'
                            : 'bg-[#FF9A5C] shadow-[0_0_15px_rgba(255,154,92,0.4)]'
                          }`}
                        role="switch"
                        aria-checked={theme === 'light'}
                        aria-label="Toggle theme"
                      >
                        <motion.div
                          layout
                          transition={SPRING}
                          className="absolute top-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                          style={{ left: theme === 'dark' ? 6 : 34 }}
                        >
                          {theme === 'dark' ? <Moon size={12} className="text-[#0A84FF]" /> : <Sun size={12} className="text-[#FF9A5C]" />}
                        </motion.div>
                      </button>
                    </div>

                    {/* Theme Preview Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      {(['dark', 'light'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => useThemeStore.getState().setTheme(t)}
                          className={`relative rounded-2xl border-2 p-4 transition-all duration-300 text-left overflow-hidden ${theme === t
                              ? t === 'dark'
                                ? 'border-[#0A84FF] shadow-[0_0_15px_rgba(10,132,255,0.2)]'
                                : 'border-[#FF9A5C] shadow-[0_0_15px_rgba(255,154,92,0.2)]'
                              : 'border-[#1E3550] hover:border-gray-600'
                            } ${t === 'dark' ? 'bg-[#060B12]' : 'bg-[#e8ecf0]'}`}
                        >
                          {/* Mini Preview */}
                          <div className={`rounded-lg p-3 mb-3 ${t === 'dark' ? 'bg-[#0A111C]' : 'bg-white'}`}>
                            <div className={`h-2 w-16 rounded-full mb-2 ${t === 'dark' ? 'bg-[#1E3550]' : 'bg-gray-300'}`} />
                            <div className={`h-2 w-10 rounded-full ${t === 'dark' ? 'bg-[#1E3550]' : 'bg-gray-200'}`} />
                            <div className="flex gap-1 mt-2">
                              <div className={`h-6 flex-1 rounded ${t === 'dark' ? 'bg-[#0A84FF]/20' : 'bg-blue-100'}`} />
                              <div className={`h-6 flex-1 rounded ${t === 'dark' ? 'bg-[#FF6B1A]/20' : 'bg-orange-100'}`} />
                            </div>
                          </div>
                          <p className={`font-bold text-sm ${t === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                            {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                          </p>
                          <p className={`text-xs mt-0.5 ${t === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                            {t === 'dark' ? 'Easy on the eyes' : 'Clean and bright'}
                          </p>
                          {theme === t && (
                            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${t === 'dark' ? 'bg-[#0A84FF]' : 'bg-[#FF9A5C]'
                              }`}>
                              ✓
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-[#0A84FF]/5 border border-[#0A84FF]/20 rounded-2xl p-4 mt-8">
                  <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                    💡 Your theme preference is saved locally and will be restored automatically on your next visit.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ SECURITY TAB ═══════════════ */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Password Change */}
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Password & Auth</p>
                  <div className={`${bgBase} border ${borderCls} rounded-2xl p-6 space-y-4`}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className={labelCls}>Current Password</label>
                        <input type="password" className={inputCls} placeholder="••••••••" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>New Password</label>
                          <input type="password" className={inputCls} placeholder="Min 8 chars" />
                        </div>
                        <div>
                          <label className={labelCls}>Confirm New</label>
                          <input type="password" className={inputCls} placeholder="Repeat password" />
                        </div>
                      </div>
                      <button className="bg-[#0A84FF] text-white text-xs font-bold py-2.5 px-6 rounded-xl self-start mt-2 hover:bg-[#0A84FF]/90 transition-all">
                        Update Password
                      </button>
                    </div>

                    <div className={`mt-6 pt-6 border-t ${borderSubtle} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${bgSurface} border ${borderCls} ${textSec}`}>
                          <Key size={18} />
                        </div>
                        <div>
                          <p className={`${textPrim} font-semibold text-sm`}>Two-Factor Auth</p>
                          <p className="text-gray-500 text-xs mt-0.5">Secure account with OTP</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setOtpEnabled(!otpEnabled)}
                        className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${otpEnabled ? 'bg-[#0A84FF]' : 'bg-gray-400 dark:bg-gray-600'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${otpEnabled ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Login Activity */}
                <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Login Activity</p>
                  <div className={`${bgBase} border ${borderCls} rounded-2xl p-4 space-y-3`}>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                      <div className="flex items-center gap-3">
                        <Laptop size={16} className="text-green-500" />
                        <div>
                          <p className={`${textPrim} text-xs font-bold`}>{deviceInfo} (Current)</p>
                          <p className="text-gray-500 text-[10px]">Mumbai, India • Online now</p>
                        </div>
                      </div>
                      <span className="text-green-500 text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <button className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border ${borderCls} ${textSec} hover:${textPrim} hover:${bgSurface} transition-all text-xs font-bold`}>
                      <RefreshCw size={14} />
                      Log out from all other devices
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={`px-8 py-5 border-t ${borderCls} shrink-0 ${bgSurface}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSettingsOpen(false)}
            className="w-full bg-gradient-to-r from-[#0A84FF] to-[#38bdf8] text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.5)] tracking-wider"
          >
            SAVE & CLOSE
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
