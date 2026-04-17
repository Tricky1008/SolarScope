import { useState } from 'react';
import html2canvas from 'html2canvas';
import { X, FileText, Table, Image, Download, Loader, Check } from 'lucide-react';
import { generatePdfClientSide } from '../utils/pdfGenerator';
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
                // Generate PDF entirely on the client — no backend call needed
                generatePdfClientSide(analysis);
            } else if (selectedFormat === 'csv') {
                // Generate CSV from analysis data
                const rows = [
                    ['SolarScope Analysis Report'],
                    ['Generated', new Date().toLocaleString('en-IN')],
                    ['Analysis ID', analysis.id],
                    ['Address', analysis.address ?? 'N/A'],
                    [],
                    ['── MONTHLY GENERATION ──'],
                    ['Month', 'Generation (kWh)'],
                    ...analysis.monthly_generation.map((m) => [m.month, m.kwh.toFixed(2)]),
                    [],
                    ['── SYSTEM OVERVIEW ──'],
                    ['Metric', 'Value', 'Unit'],
                    ['Solar Score', analysis.solar_score.toString(), '/100'],
                    ['Annual Generation', analysis.annual_generation_kwh.toFixed(2), 'kWh'],
                    ['Number of Panels', analysis.num_panels.toString(), 'panels'],
                    ['System Capacity', analysis.system_capacity_kwp.toString(), 'kWp'],
                    ['Roof Area', analysis.roof_area_m2?.toFixed(2) ?? 'N/A', 'm²'],
                    ['Usable Roof Area', analysis.usable_area_m2?.toFixed(2) ?? 'N/A', 'm²'],
                    [],
                    ['── FINANCIAL ANALYSIS ──'],
                    ['Metric', 'Value', 'Currency'],
                    [`Installation Cost`, analysis.installation_cost.toFixed(2), analysis.currency],
                    [`Annual Savings`, analysis.annual_savings.toFixed(2), analysis.currency],
                    ['Payback Period', analysis.payback_years.toString(), 'years'],
                    [`25-Year NPV`, analysis.npv_25yr.toFixed(2), analysis.currency],
                    [],
                    ['── ENVIRONMENTAL IMPACT ──'],
                    ['Metric', 'Value', 'Unit'],
                    ['CO₂ Avoided per Year', analysis.co2_annual_kg.toFixed(2), 'kg'],
                    ['CO₂ Avoided over 25 Years', (analysis.co2_annual_kg * 25 / 1000).toFixed(2), 'tonnes'],
                    ['Trees Equivalent', analysis.trees_equivalent?.toFixed(0) ?? 'N/A', 'trees/yr'],
                    [],
                    ['── IRRADIANCE & CLIMATE ──'],
                    ['Metric', 'Value', 'Unit'],
                    ['GHI', analysis.irradiance.ghi.toString(), 'kWh/m²'],
                    ['PVOUT', analysis.irradiance.pvout.toString(), 'kWh/kWp'],
                    ['Avg Temperature', analysis.irradiance.avg_temp.toString(), '°C'],
                    ['Data Source', analysis.irradiance.source, ''],
                    [],
                    ['── ROOF CONFIGURATION ──'],
                    ['Metric', 'Value'],
                    ['Orientation', analysis.roof_orientation ?? 'N/A'],
                    ['Tilt', analysis.roof_tilt_degrees != null ? `${analysis.roof_tilt_degrees}°` : 'N/A'],
                    ['Shading Factor', analysis.shading_factor != null ? `${(analysis.shading_factor * 100).toFixed(0)}%` : 'N/A'],
                    ['Model Confidence', analysis.model_confidence != null ? `${(analysis.model_confidence * 100).toFixed(1)}%` : 'N/A'],
                    ['Prediction Source', analysis.prediction_source ?? 'formula'],
                ];
                const csv = rows.map((r) => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                const safeId = analysis.id ? analysis.id.slice(0, 8) : 'export';
                a.download = `solarscope-data-${safeId}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else if (selectedFormat === 'png') {
                const element = document.getElementById('report-preview-capture');
                if (element) {
                    const canvas = await html2canvas(element, {
                        scale: 3, // Highres scaling
                        backgroundColor: '#060B12',
                        logging: false,
                        useCORS: true
                    });
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    const safeId = analysis.id ? analysis.id.slice(0, 8) : 'export';
                    a.href = url;
                    a.download = `solarscope-summary-${safeId}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } else {
                    alert('Preview element not found.');
                }
            }
            onClose();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#060B12]/80 backdrop-blur-2xl animate-fade-in font-['DM_Sans',sans-serif]"
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
                        <div id="report-preview-capture" className="bg-gradient-to-b from-[#0F192C] to-[#060B12] border-2 border-[#1E3550]/80 rounded-[1.25rem] p-7 space-y-7 shadow-2xl relative overflow-hidden">
                            {/* Decorative ambient flares */}
                            <div className="absolute -top-32 -right-32 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.15) 0%, transparent 70%)' }} />
                            <div className="absolute -bottom-32 -left-32 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,107,26,0.1) 0%, transparent 70%)' }} />

                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <p className="font-extrabold text-base tracking-widest font-mono" style={{ background: 'linear-gradient(to right, #FF8933, #FFB84C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SOLARSCOPE</p>
                                    <p className="text-gray-400 text-xs font-mono mt-1 drop-shadow-sm">{analysis.address ?? 'Location Analysis'}</p>
                                </div>
                                <div className="bg-[#0A111C]/80 border border-[#1E3550] shadow-sm px-4 py-2 rounded-full">
                                    <span className="text-gray-300 text-xs font-mono font-bold tracking-wider">ID: <span className="text-[#0A84FF]">#{analysis.id.slice(0, 6).toUpperCase()}</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-5 relative z-10">
                                {[
                                    ['ANNUAL YIELD', `${fmt(analysis.annual_generation_kwh)} kWh`],
                                    ['SOLAR SCORE', `${analysis.solar_score}/100`],
                                    ['ROI PERIOD', `${analysis.payback_years} Years`],
                                ].map(([label, value]) => (
                                    <div key={label} className="bg-[#0A111C] rounded-xl p-4 border-l-4 border-l-[#FF8933] border-t border-t-[#1E3550]/60 border-r border-r-[#1E3550]/60 border-b border-b-[#1E3550]/60 shadow-lg flex flex-col justify-center relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255,137,51,0.08) 0%, transparent 70%)' }} />
                                        <p className="text-[#8B9DB4] text-[10px] uppercase tracking-wider font-bold mb-1.5">{label}</p>
                                        <p className="text-white font-mono font-bold text-[1.15rem] leading-none drop-shadow-sm">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Mini chart preview */}
                            <div className="h-28 bg-[#0A111C]/80 border border-[#1E3550]/60 shadow-inner rounded-xl flex items-end gap-1.5 px-4 pb-4 pt-6 relative z-10 overflow-hidden">
                                {/* Grid lines background */}
                                <div className="absolute inset-0 flex flex-col justify-between py-6 px-4 pointer-events-none">
                                    {[1,2,3].map(i => <div key={i} className="border-b border-white/5 w-full h-0" />)}
                                </div>
                                {analysis.monthly_generation.map((m, i) => {
                                    const max = Math.max(...analysis.monthly_generation.map((d) => d.kwh));
                                    const h = (m.kwh / max) * 72; // height scale inside h-28 (112px max)
                                    return (
                                        <div
                                            key={m.month}
                                            className="flex-1 rounded-sm relative z-10"
                                            style={{ height: `${Math.max(h, 4)}px`, background: 'linear-gradient(to top, #FF6B1A, #FFB84C)', boxShadow: '0 -2px 10px rgba(255,107,26,0.15)' }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Full Detailed Report Section */}
                            <div className="bg-[#0A111C]/60 rounded-xl px-5 py-4 border border-[#1E3550]/60 relative z-10 w-full mt-4 shadow-lg overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none mix-blend-screen" style={{ background: 'radial-gradient(circle at top right, rgba(10,132,255,0.05) 0%, transparent 70%)' }} />
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                                    {[
                                        ['NUMBER OF PANELS', `${analysis.num_panels} Panels`],
                                        ['SYSTEM CAPACITY', `${analysis.system_capacity_kwp} kWp`],
                                        ['INSTALLATION COST', `${analysis.currency} ${fmt(analysis.installation_cost)}`],
                                        ['ANNUAL SAVINGS', `${analysis.currency} ${fmt(analysis.annual_savings)}`],
                                        ['25-YEAR NPV', `${analysis.currency} ${fmt(analysis.npv_25yr)}`],
                                        ['CO2 AVOIDED', `${fmt(analysis.co2_annual_kg)} kg/yr`],
                                        ['TREES EQUIVALENT', `${fmt(analysis.trees_equivalent ?? 0)} trees/yr`],
                                        ['ROOF AREA', `${fmt(analysis.roof_area_m2 ?? 0)} m²`],
                                    ].map(([label, value]) => (
                                        <div key={label} className="flex flex-col justify-end border-b border-[#1E3550]/60 pb-2">
                                            <p className="text-[#8B9DB4] text-[10px] uppercase tracking-widest font-bold mb-1">{label}</p>
                                            <p className="text-white font-mono font-bold text-sm tracking-tight">{value}</p>
                                        </div>
                                    ))}
                                </div>
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
