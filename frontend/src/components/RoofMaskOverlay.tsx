import { Compass, Layers, Sun, ShieldAlert } from 'lucide-react';
import type { ImageAnalysisResult } from '../types';

interface Props {
    originalSrc: string;
    maskSrc: string;
    result: ImageAnalysisResult;
}

export default function RoofMaskOverlay({ originalSrc, maskSrc, result }: Props) {
    const fmt = (n: number, d = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: d });
    const pct = (n: number) => `${Math.round(n * 100)}%`;

    const stats = [
        { icon: Layers, label: 'Roof Area', value: `${fmt(result.total_roof_area_m2)} m²`, color: 'text-blue-400' },
        { icon: Sun, label: 'Usable', value: `${fmt(result.usable_area_m2)} m²`, color: 'text-lime-400' },
        { icon: Compass, label: 'Orientation', value: result.roof_orientation ?? '—', color: 'text-amber-400' },
        { icon: ShieldAlert, label: 'Shading', value: pct(result.shading_factor ?? 0.85), color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-4">
            {/* Image with mask overlay */}
            <div className="relative rounded-xl overflow-hidden border border-[#1E3550] h-56">
                <img src={originalSrc} alt="Rooftop" className="w-full h-full object-cover" />
                {maskSrc && (
                    <img
                        src={maskSrc}
                        alt="Roof mask overlay"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70"
                    />
                )}

                {/* Confidence badge */}
                {result.model_confidence != null && (
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-mono text-lime-300">
                        {Math.round(result.model_confidence * 100)}% confidence
                    </div>
                )}

                {/* Model badge */}
                {result.model_name && (
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-mono text-gray-300">
                        {result.model_name}
                    </div>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
                {stats.map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 bg-[#060B12]/80 rounded-xl border border-[#1E3550]">
                        <Icon size={14} className={color} />
                        <div className="min-w-0">
                            <p className="text-gray-500 text-[10px] font-mono font-bold uppercase tracking-wider">{label}</p>
                            <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Obstructions */}
            {result.obstructions && result.obstructions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-gray-500 text-xs font-mono mr-1">Detected:</span>
                    {result.obstructions.map((o) => (
                        <span key={o} className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-mono">
                            {o}
                        </span>
                    ))}
                </div>
            )}

            {/* Key result */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF6B1A]/10 to-[#FF8C42]/5 border border-[#FF6B1A]/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-400 text-xs font-mono font-bold">ESTIMATED ANNUAL GENERATION</p>
                        <p className="text-[#FF6B1A] text-2xl font-bold font-mono mt-1">{fmt(result.annual_generation_kwh)} kWh</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 text-xs font-mono font-bold">SOLAR SCORE</p>
                        <p className="text-lime-400 text-2xl font-bold font-mono mt-1">{result.solar_score}/100</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
