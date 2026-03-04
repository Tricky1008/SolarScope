import { useState } from 'react';
import { Map, FormInput, ArrowRight, Sun, Layers, PenTool, Zap } from 'lucide-react';

interface InputChoiceProps {
    onSelectFlow: (flow: 'map' | 'manual') => void;
}

export default function InputChoice({ onSelectFlow }: InputChoiceProps) {
    const [selected, setSelected] = useState<'map' | 'manual' | null>(null);

    return (
        <div className="fixed inset-0 z-modal bg-midnight flex flex-col items-center justify-center p-6 animate-fade-in">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
                <div className="w-12 h-12 bg-gradient-to-br from-solar-orange to-solar-orange-lt rounded-2xl flex items-center justify-center shadow-glow">
                    <Sun size={26} className="text-white" />
                </div>
                <div className="flex items-baseline gap-0.5">
                    <span className="text-solar-orange font-extrabold text-3xl tracking-tight">Solar</span>
                    <span className="text-text-primary font-extrabold text-3xl tracking-tight">Scope</span>
                </div>
            </div>

            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <h1 className="text-h2 font-extrabold text-text-primary mb-3">
                        How would you like to analyze your rooftop?
                    </h1>
                    <p className="text-text-secondary text-body-lg">
                        Choose your preferred workflow to calculate solar generation and financial ROI.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Map Flow Choice */}
                    <button
                        onClick={() => setSelected('map')}
                        className={`group relative text-left bg-surface border rounded-2xl p-8 transition-all duration-300
                            ${selected === 'map'
                                ? 'border-solar-orange ring-1 ring-solar-orange/50 shadow-glow bg-solar-orange/5'
                                : 'border-divider hover:border-solar-orange/50 hover:bg-surface-light card-hover'
                            }`}
                    >
                        <div className="w-14 h-14 bg-solar-orange/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-solar-orange/20 transition-colors">
                            <Map size={28} className="text-solar-orange" />
                        </div>
                        <h3 className="text-h3 font-bold text-text-primary mb-3">Locate on Map</h3>
                        <p className="text-text-secondary text-sm leading-relaxed mb-6">
                            Fly to your property anywhere in the world and click on the building. Our GIS engine will automatically detect the rooftop shape and area using OpenStreetMap data.
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <SearchIcon size={14} className="text-electric-blue" />
                                <span>Global Address Search</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <PenTool size={14} className="text-electric-blue" />
                                <span>Auto Area Detection</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <Layers size={14} className="text-electric-blue" />
                                <span>Visual Building Outlines</span>
                            </div>
                        </div>

                        <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${selected === 'map' ? 'bg-solar-orange text-white' : 'bg-midnight text-text-muted group-hover:text-text-primary'}`
                        }>
                            <ArrowRight size={20} className={selected === 'map' ? 'ml-0.5' : ''} />
                        </div>
                    </button>

                    {/* Manual Flow Choice */}
                    <button
                        onClick={() => setSelected('manual')}
                        className={`group relative text-left bg-surface border rounded-2xl p-8 transition-all duration-300
                            ${selected === 'manual'
                                ? 'border-electric-blue ring-1 ring-electric-blue/50 shadow-[0_0_20px_rgba(40,154,249,0.2)] bg-electric-blue/5'
                                : 'border-divider hover:border-electric-blue/50 hover:bg-surface-light card-hover'
                            }`}
                    >
                        <div className="w-14 h-14 bg-electric-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-electric-blue/20 transition-colors">
                            <FormInput size={28} className="text-electric-blue" />
                        </div>
                        <h3 className="text-h3 font-bold text-text-primary mb-3">Manual Entry</h3>
                        <p className="text-text-secondary text-sm leading-relaxed mb-6">
                            Already know your roof dimensions and address? Skip the map and directly input your building parameters, tilt angles, and electricity tariffs for an instant report.
                        </p>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <FormInput size={14} className="text-success" />
                                <span>Custom Dimensions (L × W)</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <Zap size={14} className="text-success" />
                                <span>Instant ML Prediction</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold">
                                <Sun size={14} className="text-success" />
                                <span>Custom Tilt & Azimuth</span>
                            </div>
                        </div>

                        <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${selected === 'manual' ? 'bg-electric-blue text-white' : 'bg-midnight text-text-muted group-hover:text-text-primary'}`
                        }>
                            <ArrowRight size={20} className={selected === 'manual' ? 'ml-0.5' : ''} />
                        </div>
                    </button>
                </div>

                <div className="mt-10 flex justify-center">
                    <button
                        disabled={!selected}
                        onClick={() => selected && onSelectFlow(selected)}
                        className={`px-10 py-4 rounded-cta font-bold text-base transition-all duration-300 flex items-center gap-2
                            ${selected
                                ? selected === 'map' ? 'bg-solar-orange text-white hover:bg-solar-orange-lt shadow-glow btn-press'
                                    : 'bg-electric-blue text-white hover:bg-electric-blue-lt shadow-[0_4px_20px_rgba(40,154,249,0.3)] btn-press'
                                : 'bg-surface border border-divider text-text-muted cursor-not-allowed'
                            }`}
                    >
                        Start Analysis
                        <ArrowRight size={18} />
                    </button>
                </div>

                <p className="text-center text-text-muted text-xs font-data tracking-widest mt-12">
                    SOLARSCOPE V1.0 · 2025
                </p>
            </div>
        </div>
    );
}

// Temporary icon component for spacing
function SearchIcon({ size, className }: { size: number, className: string }) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" width={size} height={size} className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
    )
}
