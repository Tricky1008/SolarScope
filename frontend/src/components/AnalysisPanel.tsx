import { X, Download, Loader, AlertCircle, Zap, Sun, IndianRupee, Leaf, BarChart2, TrendingUp, TreePine, Trophy, Bot, Ruler, Compass } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import ScoreGauge from './ScoreGauge';
import MonthlyChart from './MonthlyChart';
import RoofMaskOverlay from './RoofMaskOverlay';

// Framer Motion Variants for Staggered Entrance
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

// Mini Metric Card
const MetricCard = ({ icon: Icon, label, value, sub, color = 'text-[#FF6B1A]' }: any) => (
  <motion.div
    variants={item}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.96 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] p-4 rounded-xl flex flex-col gap-1 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)] hover:border-[#0A84FF]/50 cursor-pointer"
  >
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 p-2 rounded-xl bg-[#060B12]/80 shadow-inner ${color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs leading-none mb-1.5 font-bold tracking-wider font-mono">{label}</p>
        <p className={`font-mono font-bold text-base ${color} animate-count`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1 font-mono">{sub}</p>}
      </div>
    </div>
  </motion.div>
);

export default function AnalysisPanel() {
  const {
    analysis, isCalculating, calculationError,
    setPanelOpen, selectedBuilding, setReportOpen,
    imageAnalysisResult, uploadedImageSrc
  } = useAppStore();


  const fmt = (n: number, dec = 0) =>
    n.toLocaleString('en-IN', { maximumFractionDigits: dec });

  const currency = analysis?.currency ?? 'INR';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <motion.div
      initial={isMobile ? { y: '100%' } : { x: '-100%' }}
      animate={{ x: 0, y: 0 }}
      exit={isMobile ? { y: '100%' } : { x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      role="complementary"
      aria-label="Solar analysis results"
      className="w-full sm:w-[450px] h-[70vh] sm:h-full mt-auto sm:mt-0 pointer-events-auto bg-[#060B12]/80 backdrop-blur-2xl border-t sm:border-t-0 sm:border-r border-[#1E3550] rounded-t-3xl sm:rounded-none flex flex-col overflow-hidden z-[1000] relative shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.7)] sm:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.7)]"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E3550] shrink-0 bg-[#0A111C]/60">
        <div>
          <h2 className="text-white font-bold text-2xl flex items-center gap-3" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>
            <div className="p-2 bg-gradient-to-br from-[#FF6B1A]/20 to-[#FF6B1A]/5 rounded-xl border border-[#FF6B1A]/20">
              <Sun size={20} className="text-[#FF6B1A]" />
            </div>
            SOLAR ANALYSIS
          </h2>
          {selectedBuilding?.properties.address && (
            <p className="text-gray-400 text-xs mt-1.5 truncate max-w-[280px] font-mono">
              {selectedBuilding.properties.address}
            </p>
          )}
        </div>
        <button
          onClick={() => setPanelOpen(false)}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
          aria-label="Close analysis panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Loading */}
        {isCalculating && (
          <div className="flex flex-col items-center justify-center py-20 gap-5" aria-busy="true">
            <div className="relative">
              <div className="w-16 h-16 bg-solar-orange/10 rounded-full flex items-center justify-center animate-pulse">
                <Sun size={32} className="text-solar-orange" />
              </div>
              <Loader size={16} className="text-solar-orange animate-spin absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="text-text-primary font-semibold">Analyzing rooftop...</p>
              <p className="text-text-secondary text-sm mt-1">Fetching irradiance data from NASA POWER</p>
            </div>
            {/* Skeleton placeholders */}
            <div className="w-full space-y-3 mt-4">
              <div className="skeleton h-20 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="skeleton h-24" />
                <div className="skeleton h-24" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {!isCalculating && calculationError && (() => {
          const isNetworkError = calculationError.toLowerCase().includes('failed to fetch') || calculationError.toLowerCase().includes('network error') || calculationError.toLowerCase().includes('unreachable');
          return (
            <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-card p-5 animate-fade-in">
              <AlertCircle size={18} className="text-error mt-0.5 shrink-0" />
              <div>
                <p className="text-error font-semibold">{isNetworkError ? 'Backend Unreachable' : 'Calculation Error'}</p>
                <p className="text-text-secondary text-sm mt-1">{calculationError}</p>
                {isNetworkError && <p className="text-text-muted text-xs mt-2">Make sure the backend is running on port 8000.</p>}
              </div>
            </div>
          );
        })()}

        {/* Results */}
        {!isCalculating && analysis && (
          <>
            {/* Score Section */}
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] rounded-2xl p-5 hover:border-[#0A84FF]/50 cursor-pointer shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2 font-semibold">Solar Suitability</p>
                  <p className="text-white text-sm font-mono">
                    {analysis.num_panels} panels · {analysis.system_capacity_kwp} kWp
                  </p>
                  <p className="text-gray-400 text-xs font-mono mt-1">
                    Roof: {fmt(analysis.roof_area_m2)} m² · Usable: {fmt(analysis.usable_area_m2)} m²
                  </p>
                </div>
                <ScoreGauge score={analysis.solar_score} />
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-3"
            >
              <MetricCard
                icon={Zap}
                label="Annual Gen"
                value={`${fmt(analysis.annual_generation_kwh)} kWh`}
                sub="per year"
                color="text-[#FF6B1A]"
              />
              <MetricCard
                icon={IndianRupee}
                label="Savings"
                value={`${currency} ${fmt(analysis.annual_savings)}`}
                sub="per year"
                color="text-[#22c55e]"
              />
              <MetricCard
                icon={Sun}
                label="GHI"
                value={`${analysis.irradiance.ghi} kWh/m²`}
                sub={`PVOUT: ${fmt(analysis.irradiance.pvout)}`}
                color="text-[#FF9A5C]"
              />
              <MetricCard
                icon={TrendingUp}
                label="Payback"
                value={`${analysis.payback_years} yrs`}
                sub={`${currency} ${fmt(analysis.installation_cost)}`}
                color="text-[#0A84FF]"
              />
            </motion.div>

            {/* Monthly Chart */}
            <div className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] rounded-2xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-gradient-to-br from-[#FF6B1A]/20 to-[#FF6B1A]/5 rounded-lg border border-[#FF6B1A]/20">
                  <BarChart2 size={16} className="text-[#FF6B1A]" />
                </div>
                <p className="text-white text-sm font-semibold tracking-wide">Monthly Generation</p>
                <span className="text-gray-500 text-xs font-mono ml-auto">kWh</span>
              </div>
              <MonthlyChart data={analysis.monthly_generation} />
            </div>

            {/* Financial Overview */}
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] rounded-2xl p-5 hover:border-[#22c55e]/50 cursor-pointer shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]"
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-4 font-semibold">Financial Overview</p>
              <div className="space-y-3">
                {[
                  ['Installation Cost', `${currency} ${fmt(analysis.installation_cost)}`],
                  ['Annual Savings', `${currency} ${fmt(analysis.annual_savings)}`],
                  ['Payback Period', `${analysis.payback_years} years`],
                  ['25-Year NPV', `${currency} ${fmt(analysis.npv_25yr)}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className={`font-mono font-semibold text-sm ${label === '25-Year NPV'
                      ? analysis.npv_25yr > 0 ? 'text-[#22c55e]' : 'text-red-500'
                      : 'text-white'
                      }`}>{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CO₂ Impact */}
            <motion.div
              whileHover={{ y: -2, scale: 1.01 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-[#22c55e]/5 backdrop-blur-md border border-[#22c55e]/20 rounded-2xl p-5 hover:bg-[#22c55e]/10 cursor-pointer text-left shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={16} className="text-[#22c55e]" />
                <p className="text-[#22c55e] text-sm font-semibold tracking-wide">Environmental Impact</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CO₂ avoided/year</span>
                  <span className="text-[#22c55e] font-mono font-medium">{fmt(analysis.co2_annual_kg)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CO₂ over 25 years</span>
                  <span className="text-[#22c55e] font-mono font-medium">{fmt(analysis.co2_annual_kg * 25 / 1000, 1)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Equivalent trees/year</span>
                  <span className="text-[#22c55e] font-mono font-medium"><TreePine size={14} className="inline mr-1" />{fmt(analysis.trees_equivalent)}</span>
                </div>
              </div>
            </motion.div>

            {/* Image Analysis Metadata */}
            {analysis.prediction_source === 'model_image' && (
              <motion.div
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] border-l-[#0A84FF] border-l-4 rounded-2xl overflow-hidden hover:border-[#0A84FF]/50 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]"
              >
                {imageAnalysisResult && uploadedImageSrc && (
                  <div className="p-4 border-b border-[#1E3550] bg-black/20">
                    <RoofMaskOverlay
                      originalSrc={uploadedImageSrc}
                      maskSrc={imageAnalysisResult.mask_bytes ?? ''}
                      result={imageAnalysisResult}
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Compass size={16} className="text-[#0A84FF]" />
                    <p className="text-[#0A84FF] text-sm font-semibold tracking-wide">Extracted Geometry</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#060B12] rounded-lg p-2 border border-[#1E3550] text-center">
                      <p className="text-gray-500 text-[10px] uppercase font-mono mb-1">Orientation</p>
                      <p className="text-white text-xs font-bold">{analysis.roof_orientation || 'Unknown'}</p>
                    </div>
                    <div className="bg-[#060B12] rounded-lg p-2 border border-[#1E3550] text-center">
                      <p className="text-gray-500 text-[10px] uppercase font-mono mb-1">Tilt</p>
                      <p className="text-white text-xs font-bold">{analysis.roof_tilt_degrees ? `${analysis.roof_tilt_degrees}°` : 'Unknown'}</p>
                    </div>
                    <div className="bg-[#060B12] rounded-lg p-2 border border-[#1E3550] text-center">
                      <p className="text-gray-500 text-[10px] uppercase font-mono mb-1">Shading</p>
                      <p className="text-white text-xs font-bold">{analysis.shading_factor != null ? `${(analysis.shading_factor * 100).toFixed(0)}%` : 'Unknown'}</p>
                    </div>
                  </div>
                  {analysis.model_confidence && (
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-mono">Detection Confidence</span>
                      <span className="text-lime-400 font-mono font-bold">{(analysis.model_confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ML Model Predictions */}
            {analysis.ml_predictions && analysis.ml_predictions.predictions.length > 0 && (
              <div className="bg-[#0A111C]/60 backdrop-blur-md border border-[#1E3550] rounded-2xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 rounded-lg border border-[#0A84FF]/20">
                      <BarChart2 size={16} className="text-[#0A84FF]" />
                    </div>
                    <p className="text-white text-sm font-semibold tracking-wide">Model Predictions</p>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${analysis.ml_predictions.confidence === 'high'
                    ? 'bg-[#22c55e]/15 text-[#22c55e]'
                    : analysis.ml_predictions.confidence === 'medium'
                      ? 'bg-yellow-500/15 text-yellow-500'
                      : 'bg-red-500/15 text-red-500'
                    }`}>
                    {analysis.ml_predictions.confidence} confidence
                  </span>
                </div>

                <div className="space-y-2.5">
                  {analysis.ml_predictions.predictions
                    .filter(p => p.predicted_kwh != null)
                    .sort((a, b) => (a.is_primary ? -1 : 1))
                    .map((pred) => {
                      const isWinner = pred.is_primary;
                      return (
                        <div
                          key={pred.model_key}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isWinner
                            ? 'bg-[#FF6B1A]/5 border-[#FF6B1A]/30'
                            : 'bg-[#060B12] border-[#1E3550]'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isWinner && <Trophy size={14} className="text-[#FF6B1A]" />}
                            <div>
                              <p className={`text-xs font-semibold ${isWinner ? 'text-[#FF6B1A]' : 'text-gray-300'}`}>
                                {pred.display_name}
                              </p>
                              {pred.r2_score != null && (
                                <span className="text-gray-500 text-[10px] font-mono">
                                  R²={pred.r2_score}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`font-mono font-bold text-sm ${isWinner ? 'text-[#FF6B1A]' : 'text-white'}`}>
                            {fmt(pred.predicted_kwh!)} kWh
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Ensemble Average */}
                {analysis.ml_predictions.ensemble_avg_kwh != null && (
                  <div className="mt-3 pt-3 border-t border-[#1E3550] flex justify-between items-center">
                    <span className="text-gray-400 text-xs font-medium">Ensemble Average</span>
                    <span className="font-mono font-bold text-sm text-[#0A84FF]">
                      {fmt(analysis.ml_predictions.ensemble_avg_kwh)} kWh
                    </span>
                  </div>
                )}

                {/* ML vs PVLib comparison */}
                {analysis.ml_predicted_kwh != null && analysis.pvlib_kwh != null && (
                  <div className="mt-3 pt-3 border-t border-[#1E3550]">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2 font-medium">ML vs Formula</p>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#FF6B1A]/5 border border-[#FF6B1A]/20 rounded-lg p-2.5 text-center">
                        <p className="text-gray-500 text-[10px] uppercase">ML Model</p>
                        <p className="font-mono font-bold text-sm text-[#FF6B1A]">{fmt(analysis.ml_predicted_kwh)} kWh</p>
                      </div>
                      <div className="flex-1 bg-[#0A84FF]/5 border border-[#0A84FF]/20 rounded-lg p-2.5 text-center">
                        <p className="text-gray-500 text-[10px] uppercase">PVLib</p>
                        <p className="font-mono font-bold text-sm text-[#0A84FF]">{fmt(analysis.pvlib_kwh)} kWh</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Source */}
            <div className="text-center space-y-1">
              <p className="text-gray-500 text-xs font-mono">
                Source: {analysis.irradiance.source} · Avg temp: {analysis.irradiance.avg_temp}°C
              </p>
              {analysis.prediction_source && (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${analysis.prediction_source === 'ml_model'
                  ? 'bg-[#FF6B1A]/10 text-[#FF6B1A]'
                  : analysis.prediction_source === 'model_image'
                    ? 'bg-lime-500/10 text-lime-400'
                    : 'bg-[#0A84FF]/10 text-[#0A84FF]'
                  }`}>
                  {analysis.prediction_source === 'ml_model'
                    ? <><Bot size={12} className="inline mr-0.5" /> ML Predicted</>
                    : analysis.prediction_source === 'model_image'
                      ? <><Compass size={12} className="inline mr-0.5" /> Image Analysis</>
                      : <><Ruler size={12} className="inline mr-0.5" /> Formula Based</>}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Export Button */}
      {!isCalculating && analysis && (
        <div className="p-5 border-t border-[#1E3550] shrink-0 bg-[#0A111C]/60">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setReportOpen(true)}
            className="w-full flex items-center justify-center gap-2
                       bg-gradient-to-r from-[#FF6B1A] to-[#FF9A5C] text-white font-bold
                       py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,107,26,0.3)] hover:shadow-[0_0_30px_rgba(255,107,26,0.6)]"
          >
            <Download size={18} />
            EXPORT FULL REPORT
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
