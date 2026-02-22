import { Search, PenTool, Zap, Mouse, Maximize2, Layers, Move, ArrowRight } from 'lucide-react';

interface OnboardingProps {
    onEnter: () => void;
}

const steps = [
    {
        number: '01',
        title: 'Locate the Property',
        description: 'Use the global search bar at the top to fly to any address, or manually pan the map to find your target building.',
        icon: Search,
    },
    {
        number: '02',
        title: 'Define the Area',
        description: "Click directly on a building polygon. The system auto-detects rooftop boundaries from OpenStreetMap data.",
        icon: PenTool,
    },
    {
        number: '03',
        title: 'Run SolarScope',
        description: 'Our GIS engine calculates shading, tilt, and irradiance from NASA POWER data in under 3 seconds.',
        icon: Zap,
    },
];

const mapTips = [
    { icon: Mouse, label: 'Left Click', sub: 'Detect Building' },
    { icon: Maximize2, label: 'Scroll', sub: 'Zoom Level' },
    { icon: Layers, label: 'Right Click', sub: 'Switch Layers' },
    { icon: Move, label: 'Shift + Drag', sub: 'Rotate View' },
];

export default function Onboarding({ onEnter }: OnboardingProps) {
    return (
        <div className="fixed inset-0 z-modal bg-midnight overflow-auto">
            <div className="max-w-lg mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 bg-solar-orange/10 text-solar-orange font-bold text-xs tracking-widest uppercase px-4 py-2 rounded-full">
                        <Zap size={14} />
                        GETTING STARTED
                    </div>
                    <h1 className="text-h1 font-extrabold text-text-primary">
                        Master Your Solar Analysis
                    </h1>
                    <p className="text-body-lg text-text-secondary leading-relaxed">
                        Follow these three steps to generate a high-precision irradiance report for any rooftop.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="bg-surface border border-divider rounded-card p-6 flex items-start gap-5 card-hover"
                        >
                            <div className="w-12 h-12 rounded-full bg-solar-orange/10 flex items-center justify-center shrink-0">
                                <span className="font-data text-solar-orange font-extrabold text-xl">{step.number}</span>
                            </div>
                            <div>
                                <h3 className="text-text-primary font-bold text-base mb-1">{step.title}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Map Interaction Guide */}
                <div className="bg-surface border border-divider rounded-card p-6">
                    <h3 className="text-text-primary font-bold text-base mb-5">Map Interaction Guide</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {mapTips.map((tip) => (
                            <div key={tip.label} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-electric-blue/10 flex items-center justify-center shrink-0">
                                    <tip.icon size={16} className="text-electric-blue" />
                                </div>
                                <div>
                                    <p className="text-text-primary text-sm font-semibold">{tip.label}</p>
                                    <p className="text-text-secondary text-xs">{tip.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Preview Image Placeholder */}
                    <div className="mt-5 h-40 rounded-lg bg-midnight border border-divider flex items-center justify-center overflow-hidden">
                        <div className="text-center">
                            <div className="flex items-center gap-2 bg-midnight/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-blue/30">
                                <div className="w-2 h-2 rounded-full bg-success" />
                                <span className="text-text-primary text-xs font-data">GIS Data: High Precision</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-text-primary font-semibold">Ready to begin?</p>
                            <p className="text-text-secondary text-xs">Your first analysis is free.</p>
                        </div>
                        <div className="w-28 h-1 bg-surface rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-solar-orange rounded-full" />
                        </div>
                    </div>
                    <button
                        onClick={onEnter}
                        className="w-full flex items-center justify-center gap-2 bg-solar-orange hover:bg-solar-orange-lt text-white font-bold text-base py-4 rounded-cta transition-all duration-fast btn-press shadow-glow"
                    >
                        Enter Workspace
                        <ArrowRight size={18} />
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-text-muted text-xs font-data tracking-widest">
                    SOLARSCOPE V1.0 · 2025
                </p>
            </div>
        </div>
    );
}
