import { useState } from 'react';
import { X, FileText, Table, Image, Download, Loader, Check } from 'lucide-react';
import { generateReport } from '../api/client';
import type { SolarAnalysis } from '../types';

interface ReportGeneratorProps {
    analysis: SolarAnalysis;
    onClose: () => void;
}

type ExportFormat = 'pdf' | 'csv' | 'png';

const formats: { id: ExportFormat; icon: any; title: string; description: string }[] = [
    { id: 'pdf', icon: FileText, title: 'Professional PDF', description: 'Full analysis with charts and financial breakdown.' },
    { id: 'csv', icon: Table, title: 'Raw Data (CSV)', description: 'Export hourly irradiance and technical data points.' },
    { id: 'png', icon: Image, title: 'High-Res Image', description: 'A single-page visual summary for presentations.' },
];

export default function ReportGenerator({ analysis, onClose }: ReportGeneratorProps) {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [includeFinancials, setIncludeFinancials] = useState(true);
    const [includeShading, setIncludeShading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            if (selectedFormat === 'pdf') {
                const blob = await generateReport(analysis);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `solarscope-report-${analysis.id.slice(0, 8)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } else if (selectedFormat === 'csv') {
                // Generate CSV from analysis data
                const rows = [
                    ['Month', 'Generation (kWh)'],
                    ...analysis.monthly_generation.map((m) => [m.month, m.kwh.toString()]),
                    [],
                    ['Metric', 'Value'],
                    ['Solar Score', analysis.solar_score.toString()],
                    ['Annual Generation', `${analysis.annual_generation_kwh} kWh`],
                    ['Number of Panels', analysis.num_panels.toString()],
                    ['System Capacity', `${analysis.system_capacity_kwp} kWp`],
                    ['Installation Cost', `${analysis.currency} ${analysis.installation_cost}`],
                    ['Annual Savings', `${analysis.currency} ${analysis.annual_savings}`],
                    ['Payback Period', `${analysis.payback_years} years`],
                    ['25-Year NPV', `${analysis.currency} ${analysis.npv_25yr}`],
                    ['CO2 Avoided/Year', `${analysis.co2_annual_kg} kg`],
                ];
                const csv = rows.map((r) => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `solarscope-data-${analysis.id.slice(0, 8)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
            }
            onClose();
        } catch {
            alert('Export failed. Check that the backend is running.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-modal-bg flex items-center justify-center bg-[#060B12]/80 backdrop-blur-2xl animate-fade-in font-['DM_Sans',sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
        >
            <div className="bg-[#0A111C]/60 backdrop-blur-xl border border-[#1E3550] rounded-3xl w-full max-w-[560px] mx-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] animate-scale-in max-h-[90vh] flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0A84FF]/50 to-transparent opacity-50" />

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-[#1E3550] shrink-0">
                    <div>
                        <h2 id="export-title" className="text-white font-extrabold text-2xl tracking-wide" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>EXPORT ANALYSIS REPORT</h2>
                        <p className="text-gray-400 text-sm font-mono mt-1">Configure your solar potential summary</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full bg-[#060B12] text-gray-400 hover:text-white border border-[#1E3550] transition-all duration-300 hover:border-gray-500"
                        aria-label="Close export dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
                    {/* Report Preview */}
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Report Preview</p>
                        <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-6 space-y-6 shadow-inner">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[#FF6B1A] font-extrabold text-sm tracking-widest font-mono">SOLARSCOPE</p>
                                    <p className="text-gray-400 text-xs font-mono mt-1">{analysis.address ?? 'Location Analysis'}</p>
                                </div>
                                <div className="bg-[#0A111C] border border-[#1E3550] px-3 py-1.5 rounded-full">
                                    <span className="text-gray-300 text-xs font-mono font-bold">ID: #{analysis.id.slice(0, 6).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    ['ANNUAL YIELD', `${fmt(analysis.annual_generation_kwh)} kWh`],
                                    ['SOLAR SCORE', `${analysis.solar_score}/100`],
                                    ['ROI PERIOD', `${analysis.payback_years} Years`],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-[#0A111C]/40 rounded-xl p-3 border border-[#1E3550]/50">
                                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold mb-1">{label}</p>
                                        <p className="text-white font-mono font-bold text-base">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Mini chart preview */}
                            <div className="h-20 bg-[#0A111C]/40 border border-[#1E3550]/50 rounded-xl flex items-end gap-1 px-3 pb-3 pt-4">
                                {analysis.monthly_generation.map((m, i) => {
                                    const max = Math.max(...analysis.monthly_generation.map((d) => d.kwh));
                                    const h = (m.kwh / max) * 56;
                                    return (
                                        <div
                                            key={m.month}
                                            className="flex-1 rounded-sm bg-gradient-to-t from-[#FF6B1A]/80 to-[#FF9A5C]/90"
                                            style={{ height: `${h}px` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Select Export Format</p>
                        <div className="space-y-3">
                            {formats.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setSelectedFormat(fmt.id)}
                                    className={`w-full flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 text-left ${selectedFormat === fmt.id
                                        ? 'bg-gradient-to-r from-[#0A84FF]/10 to-transparent border-[#0A84FF]/50 shadow-[0_0_15px_rgba(10,132,255,0.1)]'
                                        : 'bg-[#060B12]/80 border-[#1E3550] hover:border-gray-600'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${selectedFormat === fmt.id ? 'bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30' : 'bg-[#0A111C] text-gray-500 border border-[#1E3550]'
                                        }`}>
                                        <fmt.icon size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold text-base tracking-wide ${selectedFormat === fmt.id ? 'text-white' : 'text-gray-300'
                                            }`}>
                                            {fmt.title}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">{fmt.description}</p>
                                    </div>
                                    {selectedFormat === fmt.id && (
                                        <div className="w-6 h-6 rounded-full bg-[#0A84FF] flex items-center justify-center shadow-[0_0_10px_rgba(10,132,255,0.5)]">
                                            <Check size={14} className="text-white" strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Additional Settings</p>
                        <div className="bg-[#060B12]/80 border border-[#1E3550] rounded-2xl p-5 space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium tracking-wide">Include Financial Projections</span>
                                <button
                                    onClick={() => setIncludeFinancials(!includeFinancials)}
                                    className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${includeFinancials ? 'bg-[#FF6B1A]' : 'bg-[#1E3550]'
                                        }`}
                                    role="switch"
                                    aria-checked={includeFinancials}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-300 ease-spring ${includeFinancials ? 'translate-x-6 shadow-[0_0_10px_rgba(0,0,0,0.3)]' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                            <div className="h-px bg-[#1E3550]" />
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300 font-medium tracking-wide">Include Shading Analysis</span>
                                <button
                                    onClick={() => setIncludeShading(!includeShading)}
                                    className={`w-12 h-7 rounded-full transition-colors duration-300 relative ${includeShading ? 'bg-[#FF6B1A]' : 'bg-[#1E3550]'
                                        }`}
                                    role="switch"
                                    aria-checked={includeShading}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform duration-300 ease-spring ${includeShading ? 'translate-x-6 shadow-[0_0_10px_rgba(0,0,0,0.3)]' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-[#1E3550] shrink-0 bg-[#0A111C]/80">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#0A84FF] to-[#38bdf8] hover:from-[#0070E0] hover:to-[#0EA5E9] disabled:opacity-50
                       text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_30px_rgba(10,132,255,0.5)] tracking-widest"
                    >
                        {generating ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <Download size={20} />
                        )}
                        {generating ? 'GENERATING...' : 'GENERATE REPORT'}
                    </button>
                </div>
            </div>
        </div>
    );
}
