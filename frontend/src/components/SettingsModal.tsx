import { useState } from 'react';
import { X, Settings, User, Moon, Sun, LogOut, Shield, Bell, ChevronRight, Palette, Sliders, DollarSign } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'profile' | 'appearance' | 'calculations';

const SPRING = { type: 'spring', stiffness: 400, damping: 30 } as any;

export default function SettingsModal() {
  const { setSettingsOpen, electricityTariff, costPerKwp, currency, updateSettings,
    roofLength, roofWidth, roofArea, panelDirection, roofTiltAngle,
    panelEfficiency, panelWattPeak, usabilityFactor,
  } = useAppStore();
  const { user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

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
    { id: 'calculations', icon: Sliders, label: 'Calculations' },
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
  const inputCls = `w-full bg-[#060B12] border border-[#1E3550] rounded-xl px-4 py-3 text-white text-sm font-mono
                     focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[#0A84FF]/25 transition-all duration-300
                     placeholder:text-gray-600`;
  const selectCls = inputCls;
  const labelCls = 'block text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider';
  const hintCls = 'text-gray-600 text-[11px] mt-1.5 font-mono';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#060B12]/80 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={SPRING}
        className="bg-[#0A111C]/90 backdrop-blur-xl border border-[#1E3550] rounded-3xl w-full max-w-2xl mx-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0A84FF]/50 to-transparent opacity-50" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#1E3550] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 rounded-xl border border-[#0A84FF]/20">
              <Settings size={20} className="text-[#0A84FF]" />
            </div>
            <div>
              <h2 id="settings-title" className="text-white font-extrabold text-xl tracking-wide" style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.04em' }}>
                SETTINGS & PROFILE
              </h2>
              <p className="text-gray-500 text-sm font-mono mt-0.5">Manage your account & preferences</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2.5 rounded-full bg-[#060B12] text-gray-400 hover:text-white border border-[#1E3550] transition-all duration-300 hover:border-gray-500"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-8 py-3 border-b border-[#1E3550]/50 shrink-0 bg-[#060B12]/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30 shadow-[0_0_10px_rgba(10,132,255,0.15)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#0A111C]/50 border border-transparent'
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
                <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-6 relative overflow-hidden">
                  {/* Decorative orb */}
                  <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#0A84FF] to-[#38bdf8] flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(10,132,255,0.4)]"
                      style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-lg tracking-wide truncate">{userName}</p>
                      <p className="text-gray-400 text-sm font-mono truncate">{userEmail}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#22c55e]/20">
                          <Shield size={10} /> Verified
                        </span>
                        <span className="text-gray-600 text-[11px] font-mono">Joined {joinDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-2">
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Account</p>

                  {[
                    { icon: Bell, label: 'Notifications', sub: 'Email alerts for reports', hasChevron: true },
                    { icon: Shield, label: 'Privacy & Security', sub: 'Manage your data', hasChevron: true },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#060B12]/60 border border-[#1E3550] hover:border-gray-600 transition-all duration-300 text-left group"
                    >
                      <div className="p-2.5 rounded-xl bg-[#0A111C] border border-[#1E3550] text-gray-500 group-hover:text-gray-300 transition-colors">
                        <item.icon size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 font-semibold text-sm">{item.label}</p>
                        <p className="text-gray-600 text-xs mt-0.5">{item.sub}</p>
                      </div>
                      {item.hasChevron && <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />}
                    </button>
                  ))}

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
                  <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-6 space-y-6">
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
                          <p className="text-white font-bold text-base tracking-wide">
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </p>
                          <p className="text-gray-500 text-sm mt-0.5">
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
                <div className="bg-[#0A84FF]/5 border border-[#0A84FF]/20 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    💡 Your theme preference is saved locally and will be restored automatically on your next visit.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ═══════════════ CALCULATIONS TAB ═══════════════ */}
            {activeTab === 'calculations' && (
              <motion.div
                key="calculations"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Rooftop Dimensions */}
                <section>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">🏠 Rooftop Dimensions</p>
                  <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="roofLength" className={labelCls}>Length (m)</label>
                        <input id="roofLength" type="number" value={roofLength} min={1} max={200} step={0.5}
                          onChange={(e) => updateSettings({ roofLength: parseFloat(e.target.value) || 0 })}
                          className={inputCls} placeholder="e.g. 15" />
                      </div>
                      <div>
                        <label htmlFor="roofWidth" className={labelCls}>Width (m)</label>
                        <input id="roofWidth" type="number" value={roofWidth} min={1} max={200} step={0.5}
                          onChange={(e) => updateSettings({ roofWidth: parseFloat(e.target.value) || 0 })}
                          className={inputCls} placeholder="e.g. 10" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="roofArea" className={labelCls}>
                        Total Roof Area (m²) {roofLength > 0 && roofWidth > 0 && (
                          <span className="text-[#FF6B1A]">= {(roofLength * roofWidth).toFixed(1)} m²</span>
                        )}
                      </label>
                      <input id="roofArea" type="number"
                        value={roofLength > 0 && roofWidth > 0 ? roofLength * roofWidth : roofArea}
                        min={5} max={10000} step={1}
                        onChange={(e) => updateSettings({ roofArea: parseFloat(e.target.value) || 0 })}
                        disabled={roofLength > 0 && roofWidth > 0}
                        className={`${inputCls} disabled:opacity-40 disabled:cursor-not-allowed`}
                        placeholder="Or enter total area" />
                      <p className={hintCls}>Enter L×W above, or total area directly.</p>
                    </div>
                  </div>
                </section>

                {/* Panel Configuration */}
                <section>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">☀️ Panel Configuration</p>
                  <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-5 space-y-4">
                    <div>
                      <label htmlFor="panelDirection" className={labelCls}>Panel Direction</label>
                      <select id="panelDirection" value={panelDirection}
                        onChange={(e) => updateSettings({ panelDirection: e.target.value })}
                        className={selectCls}
                      >
                        {directionOptions.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                      <p className={hintCls}>South-facing is optimal in the Northern Hemisphere.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="roofTilt" className={labelCls}>Roof Tilt (°)</label>
                        <input id="roofTilt" type="number" value={roofTiltAngle} min={0} max={90} step={1}
                          onChange={(e) => updateSettings({ roofTiltAngle: parseFloat(e.target.value) || 0 })}
                          className={inputCls} />
                        <p className={hintCls}>Flat = 0°, Ideal ≈ latitude</p>
                      </div>
                      <div>
                        <label htmlFor="usability" className={labelCls}>Usability Factor</label>
                        <input id="usability" type="number" value={usabilityFactor} min={0.1} max={1.0} step={0.05}
                          onChange={(e) => updateSettings({ usabilityFactor: parseFloat(e.target.value) || 0.75 })}
                          className={inputCls} />
                        <p className={hintCls}>0.75 = 75% roof usable</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="panelEff" className={labelCls}>Panel Efficiency</label>
                        <input id="panelEff" type="number" value={panelEfficiency} min={0.10} max={0.25} step={0.01}
                          onChange={(e) => updateSettings({ panelEfficiency: parseFloat(e.target.value) || 0.20 })}
                          className={inputCls} />
                        <p className={hintCls}>Standard ≈ 0.20</p>
                      </div>
                      <div>
                        <label htmlFor="panelWp" className={labelCls}>Panel Watt Peak (W)</label>
                        <input id="panelWp" type="number" value={panelWattPeak} min={200} max={700} step={10}
                          onChange={(e) => updateSettings({ panelWattPeak: parseFloat(e.target.value) || 400 })}
                          className={inputCls} />
                        <p className={hintCls}>Typical: 400W</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Financial Parameters */}
                <section>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">💰 Financial Parameters</p>
                  <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-5 space-y-4">
                    <div>
                      <label htmlFor="currency" className={labelCls}>Currency</label>
                      <select id="currency" value={currency}
                        onChange={(e) => updateSettings({ currency: e.target.value })}
                        className={selectCls}
                      >
                        <option value="INR">INR — Indian Rupee (₹)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="GBP">GBP — British Pound (£)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="SGD">SGD — Singapore Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tariff" className={labelCls}>Electricity Tariff ({currency}/kWh)</label>
                      <input id="tariff" type="number" value={electricityTariff} min={0.1} max={100} step={0.5}
                        onChange={(e) => updateSettings({ electricityTariff: parseFloat(e.target.value) })}
                        className={inputCls} />
                      <p className={hintCls}>India avg: ₹8 · UK: £0.28 · UAE: 0.38 AED</p>
                    </div>
                    <div>
                      <label htmlFor="costKwp" className={labelCls}>Installation Cost ({currency}/kWp)</label>
                      <input id="costKwp" type="number" value={costPerKwp} min={1000} max={500000} step={1000}
                        onChange={(e) => updateSettings({ costPerKwp: parseFloat(e.target.value) })}
                        className={inputCls} />
                      <p className={hintCls}>India: ₹55,000–70,000 · US: $1,800–2,500</p>
                    </div>
                  </div>
                </section>

                {/* Info */}
                <div className="bg-[#FF6B1A]/5 border border-[#FF6B1A]/20 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    ⚡ Changes apply to your next calculation. Click a rooftop on the map to recalculate with these settings.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#1E3550] shrink-0 bg-[#0A111C]/80">
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
