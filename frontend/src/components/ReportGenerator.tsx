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
            className="fixed inset-0 z-modal-bg flex items-center justify-center bg-midnight/60 backdrop-blur-md animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
        >
            <div className="bg-surface border border-divider rounded-xl w-full max-w-[560px] mx-4 shadow-deep animate-scale-in max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-divider shrink-0">
                    <div>
                        <h2 id="export-title" className="text-text-primary font-bold text-lg">Export Analysis Report</h2>
                        <p className="text-text-secondary text-xs font-data mt-1">Configure your solar potential summary</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-midnight text-text-secondary hover:text-text-primary transition-all duration-fast"
                        aria-label="Close export dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                    {/* Report Preview */}
                    <div>
                        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">Report Preview</p>
                        <div className="bg-midnight border border-divider rounded-lg p-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-solar-orange font-extrabold text-sm tracking-wide">SOLARSCOPE</p>
                                    <p className="text-text-secondary text-xs font-data mt-1">{analysis.address ?? 'Location Analysis'}</p>
                                </div>
                                <div className="bg-surface px-3 py-1.5 rounded-full">
                                    <span className="text-text-primary text-xs font-data">ID: #{analysis.id.slice(0, 6).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    ['ANNUAL YIELD', `${fmt(analysis.annual_generation_kwh)} kWh`],
                                    ['SOLAR SCORE', `${analysis.solar_score}/100`],
                                    ['ROI PERIOD', `${analysis.payback_years} Years`],
                                ].map(([label, value]) => (
                                    <div key={label}>
                                        <p className="text-text-muted text-xs uppercase tracking-wider">{label}</p>
                                        <p className="text-text-primary font-data font-bold text-sm mt-1">{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Mini chart preview */}
                            <div className="h-16 bg-surface rounded-md flex items-end gap-0.5 px-2 pb-2">
                                {analysis.monthly_generation.map((m, i) => {
                                    const max = Math.max(...analysis.monthly_generation.map((d) => d.kwh));
                                    const h = (m.kwh / max) * 48;
                                    return (
                                        <div
                                            key={m.month}
                                            className="flex-1 rounded-t bg-solar-orange/70"
                                            style={{ height: `${h}px` }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div>
                        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">Select Export Format</p>
                        <div className="space-y-3">
                            {formats.map((fmt) => (
                                <button
                                    key={fmt.id}
                                    onClick={() => setSelectedFormat(fmt.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-card border transition-all duration-fast text-left ${selectedFormat === fmt.id
                                            ? 'bg-solar-orange/10 border-solar-orange'
                                            : 'bg-midnight border-divider hover:border-slate-blue/50'
                                        }`}
                                >
                                    <div className={`p-2.5 rounded-lg ${selectedFormat === fmt.id ? 'bg-solar-orange/20 text-solar-orange' : 'bg-surface text-text-secondary'
                                        }`}>
                                        <fmt.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-semibold text-sm ${selectedFormat === fmt.id ? 'text-solar-orange' : 'text-text-primary'
                                            }`}>
                                            {fmt.title}
                                        </p>
                                        <p className="text-text-secondary text-xs mt-0.5">{fmt.description}</p>
                                    </div>
                                    {selectedFormat === fmt.id && (
                                        <div className="w-5 h-5 rounded-full bg-solar-orange flex items-center justify-center">
                                            <Check size={12} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div>
                        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-4">Additional Settings</p>
                        <div className="bg-midnight border border-divider rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-text-primary text-sm">Include Financial Projections</span>
                                <button
                                    onClick={() => setIncludeFinancials(!includeFinancials)}
                                    className={`w-11 h-6 rounded-full transition-colors duration-fast relative ${includeFinancials ? 'bg-solar-orange' : 'bg-surface-light'
                                        }`}
                                    role="switch"
                                    aria-checked={includeFinancials}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-fast ease-spring ${includeFinancials ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                            <div className="h-px bg-divider" />
                            <div className="flex items-center justify-between">
                                <span className="text-text-primary text-sm">Include Shading Analysis</span>
                                <button
                                    onClick={() => setIncludeShading(!includeShading)}
                                    className={`w-11 h-6 rounded-full transition-colors duration-fast relative ${includeShading ? 'bg-solar-orange' : 'bg-surface-light'
                                        }`}
                                    role="switch"
                                    aria-checked={includeShading}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform duration-fast ease-spring ${includeShading ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-divider shrink-0 bg-surface">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full flex items-center justify-center gap-2 bg-solar-orange hover:bg-solar-orange-lt disabled:opacity-50
                       text-white font-bold py-3.5 rounded-cta transition-all duration-fast btn-press shadow-glow"
                    >
                        {generating ? (
                            <Loader size={18} className="animate-spin" />
                        ) : (
                            <Download size={18} />
                        )}
                        {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}
