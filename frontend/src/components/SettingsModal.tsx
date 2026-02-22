import { X, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function SettingsModal() {
  const { setSettingsOpen, electricityTariff, costPerKwp, currency, updateSettings,
    roofLength, roofWidth, roofArea, panelDirection, roofTiltAngle,
    panelEfficiency, panelWattPeak, usabilityFactor,
  } = useAppStore();

  const directionOptions = [
    { value: 'south', label: 'South (Optimal)' },
    { value: 'south-west', label: 'South-West' },
    { value: 'south-east', label: 'South-East' },
    { value: 'east', label: 'East' },
    { value: 'west', label: 'West' },
    { value: 'north', label: 'North' },
  ];

  return (
    <div
      className="fixed inset-0 z-modal-bg flex items-center justify-center bg-midnight/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="bg-surface border border-divider rounded-xl w-full max-w-lg mx-4 shadow-deep animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-divider shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-solar-orange/10 rounded-lg">
              <Settings size={18} className="text-solar-orange" />
            </div>
            <div>
              <h2 id="settings-title" className="text-text-primary font-bold text-lg">Calculation Settings</h2>
              <p className="text-text-secondary text-xs mt-0.5">Configure rooftop & financial parameters</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all duration-fast"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* ── Section: Rooftop Dimensions ── */}
          <section>
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">
              🏠 Rooftop Dimensions
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roofLength" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Length (meters)
                  </label>
                  <input
                    id="roofLength"
                    type="number"
                    value={roofLength}
                    min={1}
                    max={200}
                    step={0.5}
                    onChange={(e) => updateSettings({ roofLength: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                    placeholder="e.g. 15"
                  />
                </div>
                <div>
                  <label htmlFor="roofWidth" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Width (meters)
                  </label>
                  <input
                    id="roofWidth"
                    type="number"
                    value={roofWidth}
                    min={1}
                    max={200}
                    step={0.5}
                    onChange={(e) => updateSettings({ roofWidth: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="roofArea" className="block text-text-secondary text-xs mb-1.5 font-medium">
                  Total Roof Area (m²) {roofLength > 0 && roofWidth > 0 && (
                    <span className="text-solar-orange font-data">
                      = {(roofLength * roofWidth).toFixed(1)} m² (auto)
                    </span>
                  )}
                </label>
                <input
                  id="roofArea"
                  type="number"
                  value={roofLength > 0 && roofWidth > 0 ? roofLength * roofWidth : roofArea}
                  min={5}
                  max={10000}
                  step={1}
                  onChange={(e) => updateSettings({ roofArea: parseFloat(e.target.value) || 0 })}
                  disabled={roofLength > 0 && roofWidth > 0}
                  className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Or enter total area directly"
                />
                <p className="text-text-muted text-xs mt-1">Enter L×W above, or total area directly.</p>
              </div>
            </div>
          </section>

          {/* ── Section: Panel Configuration ── */}
          <section>
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">
              ☀️ Panel Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="panelDirection" className="block text-text-secondary text-xs mb-1.5 font-medium">
                  Panel Direction (Azimuth)
                </label>
                <select
                  id="panelDirection"
                  value={panelDirection}
                  onChange={(e) => updateSettings({ panelDirection: e.target.value })}
                  className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                >
                  {directionOptions.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <p className="text-text-muted text-xs mt-1">South-facing panels produce the most energy in the Northern Hemisphere.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roofTilt" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Roof Tilt (°)
                  </label>
                  <input
                    id="roofTilt"
                    type="number"
                    value={roofTiltAngle}
                    min={0}
                    max={90}
                    step={1}
                    onChange={(e) => updateSettings({ roofTiltAngle: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                  />
                  <p className="text-text-muted text-xs mt-1">Flat = 0°, Ideal ≈ latitude</p>
                </div>
                <div>
                  <label htmlFor="usability" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Usability Factor
                  </label>
                  <input
                    id="usability"
                    type="number"
                    value={usabilityFactor}
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    onChange={(e) => updateSettings({ usabilityFactor: parseFloat(e.target.value) || 0.75 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                  />
                  <p className="text-text-muted text-xs mt-1">0.75 = 75% roof usable</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="panelEff" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Panel Efficiency
                  </label>
                  <input
                    id="panelEff"
                    type="number"
                    value={panelEfficiency}
                    min={0.10}
                    max={0.25}
                    step={0.01}
                    onChange={(e) => updateSettings({ panelEfficiency: parseFloat(e.target.value) || 0.20 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                  />
                  <p className="text-text-muted text-xs mt-1">Standard ≈ 0.20</p>
                </div>
                <div>
                  <label htmlFor="panelWp" className="block text-text-secondary text-xs mb-1.5 font-medium">
                    Panel Watt Peak (W)
                  </label>
                  <input
                    id="panelWp"
                    type="number"
                    value={panelWattPeak}
                    min={200}
                    max={700}
                    step={10}
                    onChange={(e) => updateSettings({ panelWattPeak: parseFloat(e.target.value) || 400 })}
                    className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                  />
                  <p className="text-text-muted text-xs mt-1">Typical: 400W</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section: Financial ── */}
          <section>
            <h3 className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">
              💰 Financial Parameters
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="currency" className="block text-text-secondary text-xs mb-1.5 font-medium">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => updateSettings({ currency: e.target.value })}
                  className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
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
                <label htmlFor="tariff" className="block text-text-secondary text-xs mb-1.5 font-medium">
                  Electricity Tariff ({currency}/kWh)
                </label>
                <input
                  id="tariff"
                  type="number"
                  value={electricityTariff}
                  min={0.1}
                  max={100}
                  step={0.5}
                  onChange={(e) => updateSettings({ electricityTariff: parseFloat(e.target.value) })}
                  className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                />
                <p className="text-text-muted text-xs mt-1">India avg: ₹8 · UK: £0.28 · UAE: 0.38 AED</p>
              </div>

              <div>
                <label htmlFor="costKwp" className="block text-text-secondary text-xs mb-1.5 font-medium">
                  Installation Cost ({currency}/kWp)
                </label>
                <input
                  id="costKwp"
                  type="number"
                  value={costPerKwp}
                  min={1000}
                  max={500000}
                  step={1000}
                  onChange={(e) => updateSettings({ costPerKwp: parseFloat(e.target.value) })}
                  className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-2.5 text-text-primary text-sm font-data
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                />
                <p className="text-text-muted text-xs mt-1">India: ₹55,000–70,000 · US: $1,800–2,500</p>
              </div>
            </div>
          </section>

          {/* Info box */}
          <div className="bg-midnight/60 rounded-lg p-4 border border-divider">
            <p className="text-text-secondary text-xs leading-relaxed">
              ⚡ Changes apply to your next calculation. Click a rooftop on the map to recalculate with these settings.
              If you provide roof dimensions here, they will override the auto-detected area from OpenStreetMap.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-divider shrink-0">
          <button
            onClick={() => setSettingsOpen(false)}
            className="w-full bg-solar-orange hover:bg-solar-orange-lt text-white font-bold py-3 rounded-cta transition-all duration-fast btn-press shadow-glow"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
