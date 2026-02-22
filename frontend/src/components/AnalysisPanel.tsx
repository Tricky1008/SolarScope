import { X, Download, Loader, AlertCircle, Zap, Sun, DollarSign, Leaf, BarChart2, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import ScoreGauge from './ScoreGauge';
import MonthlyChart from './MonthlyChart';

function MetricCard({
  icon: Icon, label, value, sub, color = 'text-solar-orange'
}: {
  icon: any; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-surface border border-divider rounded-card p-4 card-hover">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-lg bg-midnight ${color}`}>
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-text-secondary text-xs leading-none mb-1.5 uppercase tracking-wider font-medium">{label}</p>
          <p className={`font-data font-bold text-base ${color} animate-count`}>{value}</p>
          {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPanel() {
  const {
    analysis, isCalculating, calculationError,
    setPanelOpen, selectedBuilding, setReportOpen,
  } = useAppStore();


  const fmt = (n: number, dec = 0) =>
    n.toLocaleString('en-IN', { maximumFractionDigits: dec });

  const currency = analysis?.currency ?? 'INR';

  return (
    <div
      role="complementary"
      aria-label="Solar analysis results"
      className="animate-slide-in w-full sm:w-panel h-full bg-midnight border-l border-divider flex flex-col overflow-hidden z-raised shrink-0"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-divider shrink-0 bg-surface">
        <div>
          <h2 className="text-text-primary font-bold text-h3 flex items-center gap-2">
            <Sun size={18} className="text-solar-orange" />
            Solar Analysis
          </h2>
          {selectedBuilding?.properties.address && (
            <p className="text-text-secondary text-xs mt-1 truncate max-w-[280px] font-data">
              {selectedBuilding.properties.address}
            </p>
          )}
        </div>
        <button
          onClick={() => setPanelOpen(false)}
          className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all duration-fast"
          aria-label="Close analysis panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

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
        {!isCalculating && calculationError && (
          <div className="flex items-start gap-3 bg-error/10 border border-error/30 rounded-card p-5 animate-fade-in">
            <AlertCircle size={18} className="text-error mt-0.5 shrink-0" />
            <div>
              <p className="text-error font-semibold">Analysis Failed</p>
              <p className="text-text-secondary text-sm mt-1">{calculationError}</p>
              <p className="text-text-muted text-xs mt-2">Make sure the backend is running on port 8000.</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!isCalculating && analysis && (
          <>
            {/* Score Section */}
            <div className="bg-surface border border-divider rounded-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-2 font-semibold">Solar Suitability</p>
                  <p className="text-text-primary text-sm font-data">
                    {analysis.num_panels} panels · {analysis.system_capacity_kwp} kWp
                  </p>
                  <p className="text-text-secondary text-xs font-data mt-1">
                    Roof: {fmt(analysis.roof_area_m2)} m² · Usable: {fmt(analysis.usable_area_m2)} m²
                  </p>
                </div>
                <ScoreGauge score={analysis.solar_score} />
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={Zap}
                label="Annual Gen"
                value={`${fmt(analysis.annual_generation_kwh)} kWh`}
                sub="per year"
                color="text-solar-orange"
              />
              <MetricCard
                icon={DollarSign}
                label="Savings"
                value={`${currency} ${fmt(analysis.annual_savings)}`}
                sub="per year"
                color="text-success"
              />
              <MetricCard
                icon={Sun}
                label="GHI"
                value={`${analysis.irradiance.ghi} kWh/m²`}
                sub={`PVOUT: ${fmt(analysis.irradiance.pvout)} kWh/kWp`}
                color="text-solar-orange-lt"
              />
              <MetricCard
                icon={TrendingUp}
                label="Payback"
                value={`${analysis.payback_years} yrs`}
                sub={`${currency} ${fmt(analysis.installation_cost)}`}
                color="text-electric-blue"
              />
            </div>

            {/* Monthly Chart */}
            <div className="bg-surface border border-divider rounded-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={16} className="text-solar-orange" />
                <p className="text-text-primary text-sm font-semibold">Monthly Generation</p>
                <span className="text-text-muted text-xs font-data ml-auto">kWh</span>
              </div>
              <MonthlyChart data={analysis.monthly_generation} />
            </div>

            {/* Financial Overview */}
            <div className="bg-surface border border-divider rounded-card p-5">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-4 font-semibold">Financial Overview</p>
              <div className="space-y-3">
                {[
                  ['Installation Cost', `${currency} ${fmt(analysis.installation_cost)}`],
                  ['Annual Savings', `${currency} ${fmt(analysis.annual_savings)}`],
                  ['Payback Period', `${analysis.payback_years} years`],
                  ['25-Year NPV', `${currency} ${fmt(analysis.npv_25yr)}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-text-secondary text-sm">{label}</span>
                    <span className={`font-data font-semibold text-sm ${label === '25-Year NPV'
                      ? analysis.npv_25yr > 0 ? 'text-success' : 'text-error'
                      : 'text-text-primary'
                      }`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CO₂ Impact */}
            <div className="bg-success/5 border border-success/20 rounded-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={16} className="text-success" />
                <p className="text-success text-sm font-semibold">Environmental Impact</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">CO₂ avoided/year</span>
                  <span className="text-success font-data font-medium">{fmt(analysis.co2_annual_kg)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">CO₂ over 25 years</span>
                  <span className="text-success font-data font-medium">{fmt(analysis.co2_annual_kg * 25 / 1000, 1)} tonnes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Equivalent trees/year</span>
                  <span className="text-success font-data font-medium">🌳 {fmt(analysis.trees_equivalent)}</span>
                </div>
              </div>
            </div>

            {/* ML Model Predictions */}
            {analysis.ml_predictions && analysis.ml_predictions.predictions.length > 0 && (
              <div className="bg-surface border border-divider rounded-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-electric-blue" />
                    <p className="text-text-primary text-sm font-semibold">Model Predictions</p>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${analysis.ml_predictions.confidence === 'high'
                      ? 'bg-success/15 text-success'
                      : analysis.ml_predictions.confidence === 'medium'
                        ? 'bg-warning/15 text-warning'
                        : 'bg-error/15 text-error'
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
                              ? 'bg-solar-orange/5 border-solar-orange/30'
                              : 'bg-midnight border-divider'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isWinner && <span className="text-sm">🏆</span>}
                            <div>
                              <p className={`text-xs font-semibold ${isWinner ? 'text-solar-orange' : 'text-text-primary'}`}>
                                {pred.display_name}
                              </p>
                              {pred.r2_score != null && (
                                <span className="text-text-muted text-[10px] font-data">
                                  R²={pred.r2_score}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`font-data font-bold text-sm ${isWinner ? 'text-solar-orange' : 'text-text-primary'}`}>
                            {fmt(pred.predicted_kwh!)} kWh
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Ensemble Average */}
                {analysis.ml_predictions.ensemble_avg_kwh != null && (
                  <div className="mt-3 pt-3 border-t border-divider flex justify-between items-center">
                    <span className="text-text-secondary text-xs font-medium">Ensemble Average</span>
                    <span className="font-data font-bold text-sm text-electric-blue">
                      {fmt(analysis.ml_predictions.ensemble_avg_kwh)} kWh
                    </span>
                  </div>
                )}

                {/* ML vs PVLib comparison */}
                {analysis.ml_predicted_kwh != null && analysis.pvlib_kwh != null && (
                  <div className="mt-3 pt-3 border-t border-divider">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-2 font-medium">ML vs Formula</p>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-solar-orange/5 border border-solar-orange/20 rounded-lg p-2.5 text-center">
                        <p className="text-text-muted text-[10px] uppercase">ML Model</p>
                        <p className="font-data font-bold text-sm text-solar-orange">{fmt(analysis.ml_predicted_kwh)} kWh</p>
                      </div>
                      <div className="flex-1 bg-electric-blue/5 border border-electric-blue/20 rounded-lg p-2.5 text-center">
                        <p className="text-text-muted text-[10px] uppercase">PVLib</p>
                        <p className="font-data font-bold text-sm text-electric-blue">{fmt(analysis.pvlib_kwh)} kWh</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Source */}
            <div className="text-center space-y-1">
              <p className="text-text-muted text-xs font-data">
                Source: {analysis.irradiance.source} · Avg temp: {analysis.irradiance.avg_temp}°C
              </p>
              {analysis.prediction_source && (
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${analysis.prediction_source === 'ml_model'
                    ? 'bg-solar-orange/10 text-solar-orange'
                    : 'bg-electric-blue/10 text-electric-blue'
                  }`}>
                  {analysis.prediction_source === 'ml_model' ? '🤖 ML Predicted' : '📐 Formula Based'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Export Button */}
      {!isCalculating && analysis && (
        <div className="p-5 border-t border-divider shrink-0 bg-surface">
          <button
            onClick={() => setReportOpen(true)}
            className="w-full flex items-center justify-center gap-2
                       bg-solar-orange hover:bg-solar-orange-lt text-white font-bold
                       py-3 rounded-cta transition-all duration-fast btn-press text-sm shadow-glow"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      )}
    </div>
  );
}
