import { Map, ImageUp } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { AnalysisMode } from '../types';

const modes: { key: AnalysisMode; icon: typeof Map; label: string; desc: string }[] = [
    { key: 'map-click', icon: Map, label: 'Map Click', desc: 'Click a rooftop on the map' },
];

export default function AnalysisModeToggle() {
    const { analysisMode, setAnalysisMode, setImageAnalysisResult, setUploadedImageSrc } = useAppStore();

    const handleSwitch = (mode: AnalysisMode) => {
        if (mode === analysisMode) return;
        setAnalysisMode(mode);
        // Reset image state when switching back to map
        if (mode === 'map-click') {
            setImageAnalysisResult(null);
            setUploadedImageSrc(null);
        }
    };

    return (
        <div className="flex gap-1.5 p-1 bg-[#060B12]/80 rounded-xl border border-[#1E3550]">
            {modes.map(({ key, icon: Icon, label }) => {
                const active = analysisMode === key;
                return (
                    <button
                        key={key}
                        onClick={() => handleSwitch(key)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200
              ${active
                                ? 'bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] text-white shadow-[0_0_16px_rgba(255,107,26,0.4)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
