import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Droplet, Crosshair, AlertTriangle, Play, RefreshCw, Layers, Compass, Zap, MapPin, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { API_BASE_URL, analyzeImage, geocodeAddress } from '../api/client';
import ScoreGauge from './ScoreGauge';

interface ImageAnalysisPanelProps {
    onBack: () => void;
    onSuccess: () => void;
}

type Phase = 'idle' | 'preview' | 'analyzing' | 'done';

const steps = [
    "📡 Reading image metadata & GPS...",
    "🛰 Fetching satellite reference tile...",
    "✂️ Running SAM2 roof segmentation...",
    "🧠 Claude Vision AI analysing roof...",
    "☀️ Computing solar potential..."
];

export default function ImageAnalysisPanel({ onBack, onSuccess }: ImageAnalysisPanelProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
    const [clickPt, setClickPt] = useState<{ x: number, y: number } | null>(null);
    const [clickCoords, setClickCoords] = useState<{ x: number, y: number } | null>(null);

    const { setMapCenter, setAnalysis, setPanelOpen, setCalculationError, setAnalysisMode, selectedLat, selectedLon } = useAppStore();

    const [manualLat, setManualLat] = useState(selectedLat ? selectedLat.toString() : '');
    const [manualLon, setManualLon] = useState(selectedLon ? selectedLon.toString() : '');
    const [tariff, setTariff] = useState('8');
    const [costPerKwp, setCostPerKwp] = useState('60000');

    const [result, setResult] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [progressSteps, setProgressSteps] = useState<number>(0);

    const imgRef = useRef<HTMLImageElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Auto layout reset defaults
    useEffect(() => {
        if (selectedLat && selectedLon) {
            setManualLat(selectedLat.toString());
            setManualLon(selectedLon.toString());
        }
    }, [selectedLat, selectedLon]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please upload an image file.');
            return;
        }
        setErrorMsg(null);
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setPhase('preview');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (phase !== 'preview') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setClickPt({ x, y });

        // Calculate actual pixel ratio if scaled
        const scaleX = e.currentTarget.naturalWidth / rect.width;
        const scaleY = e.currentTarget.naturalHeight / rect.height;
        setClickCoords({ x: Math.round(x * scaleX), y: Math.round(y * scaleY) });
    };

    const startAnalysis = async () => {
        if (!imageFile) return;

        setPhase('analyzing');
        setErrorMsg(null);
        setProgressSteps(0);

        const stepInterval = setInterval(() => {
            setProgressSteps((prev) => {
                if (prev >= steps.length - 1) {
                    clearInterval(stepInterval);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);

        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            if (clickCoords) {
                formData.append('click_x', clickCoords.x.toString());
                formData.append('click_y', clickCoords.y.toString());
            }
            if (manualLat) formData.append('lat', manualLat);
            if (manualLon) formData.append('lon', manualLon);
            formData.append('tariff_per_kwh', tariff);
            formData.append('cost_per_kwp', costPerKwp);

            // This uses the correct base URL for both Web and Capacitor
            const response = await fetch(`${API_BASE_URL}/api/v1/image/analyze`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(stepInterval);
            setProgressSteps(steps.length);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.detail?.message || errorData?.detail || 'Analysis failed');
            }

            const data = await response.json();
            setResult(data);

            if (data.mask_overlay_base64) {
                setOverlayUrl(`data:image/jpeg;base64,${data.mask_overlay_base64}`);
            }

            // Setup App Store maps
            if (data.lat && data.lon) {
                setMapCenter([data.lat, data.lon], 18);
                useAppStore.getState().setSelectedLocation(data.lat, data.lon);
                setAnalysis({
                    ...data,
                    roof_area_m2: data.roof_area_m2,
                    usable_area_m2: data.usable_area_m2,
                });
            }

            setPhase('done');
            setPanelOpen(true);
            useAppStore.getState().setAnalysisMode('map-click');
            onSuccess?.(); // Typically tells MapView to close the local modal layer

        } catch (err: any) {
            clearInterval(stepInterval);
            setErrorMsg(err.message || 'Vision analysis failed. Please try again.');
            setPhase('preview');
        }
    };

    const resetAll = () => {
        setPhase('idle');
        setImageFile(null);
        setImageUrl(null);
        setOverlayUrl(null);
        setClickPt(null);
        setClickCoords(null);
        setResult(null);
        setErrorMsg(null);
    };

    const fmt = (n: number, d = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: d });

    return (
        <div className="fixed inset-y-16 right-0 z-[2000] w-[450px] bg-[#020812]/95 backdrop-blur-2xl border-l border-amber-500/15 shadow-2xl flex flex-col overflow-hidden text-[#e2e8f0] font-mono">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-amber-500/15 bg-[#0f172a]/90">
                <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
                    <Crosshair size={20} className="text-amber-500" />
                    AI IMAGE ANALYSIS
                </h2>
                <button onClick={onBack} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <AnimatePresence mode="wait">

                    {/* == IDLE == */}
                    {phase === 'idle' && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center">
                            <input type="file" ref={fileRef} className="hidden" accept="image/*,.tif,.tiff" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

                            <div
                                onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                                onClick={() => fileRef.current?.click()}
                                className="w-full h-80 rounded-2xl border-2 border-dashed border-amber-500/20 hover:border-amber-500/50 bg-black/20 hover:bg-amber-900/5 flex flex-col items-center justify-center cursor-pointer transition-all group"
                            >
                                <div className="p-4 bg-amber-500/10 rounded-full group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                                    <Upload size={32} className="text-amber-500" />
                                </div>
                                <h3 className="mt-4 font-bold text-white">Drag & drop image here</h3>
                                <p className="text-sm text-[#64748b] mt-2">or click to browse local files</p>
                                <p className="text-xs text-[#64748b]/60 mt-4 tracking-wider uppercase">Supports GPS EXIF • Drone • Satellite</p>
                            </div>
                        </motion.div>
                    )}

                    {/* == PREVIEW & ANALYZING == */}
                    {(phase === 'preview' || phase === 'analyzing') && imageUrl && (
                        <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

                            {/* Interactive Image Frame */}
                            <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 group">
                                <img
                                    ref={imgRef}
                                    src={overlayUrl || imageUrl}
                                    alt="Rooftop"
                                    onDragStart={e => e.preventDefault()}
                                    onClick={handleImageClick}
                                    className={`w-full h-72 object-cover ${phase === 'preview' ? 'cursor-crosshair' : 'opacity-50'} transition-all`}
                                />

                                {phase === 'preview' && (
                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-xs text-center text-amber-200/80 pointer-events-none">
                                        {clickPt ? `Seed set at x:${clickCoords?.x}, y:${clickCoords?.y}` : "Click directly on the rooftop to set a seed point"}
                                    </div>
                                )}

                                {/* Click Crosshair */}
                                {clickPt && (
                                    <div
                                        className="absolute w-4 h-4 -ml-2 -mt-2 pointer-events-none"
                                        style={{ left: clickPt.x, top: clickPt.y }}
                                    >
                                        <div className="absolute inset-0 border border-amber-400 rounded-full" />
                                        <div className="absolute inset-0 border-2 border-amber-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                                        <div className="absolute inset-1.5 bg-amber-500 rounded-full" />
                                    </div>
                                )}

                                {/* Analyzing Loader Overlay */}
                                {phase === 'analyzing' && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 shadow-[inset_0_0_100px_black]">
                                        <Loader2 size={40} className="text-amber-500 animate-spin mb-4" />
                                        <p className="font-bold tracking-[0.2em] text-sm text-amber-500 animate-pulse">ANALYSING ROOFTOP</p>
                                    </div>
                                )}
                            </div>

                            {/* Analyzing Steps Output */}
                            {phase === 'analyzing' && (
                                <div className="bg-[#0f172a]/90 p-5 rounded-2xl border border-amber-500/10 space-y-3">
                                    {steps.map((step, idx) => {
                                        const isCompleted = idx < progressSteps;
                                        const isCurrent = idx === progressSteps;

                                        return (
                                            <div key={step} className={`flex items-center gap-3 text-sm transition-all duration-500 ${isCompleted ? 'text-green-400' : isCurrent ? 'text-amber-400' : 'text-[#64748b]'}`}>
                                                {isCompleted ? <CheckCircle2 size={16} /> : isCurrent ? <Loader2 size={16} className="animate-spin" /> : <Circle size={16} className="opacity-30" />}
                                                <span className={isCurrent ? 'font-bold' : ''}>{step}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Error Box */}
                            {errorMsg && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-200">
                                    <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
                                    <p className="text-sm">{errorMsg}</p>
                                </motion.div>
                            )}

                            {/* Inputs & Actions (Only in preview) */}
                            {phase === 'preview' && (
                                <>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-[10px] uppercase text-[#64748b] mb-1">Latitude</label>
                                            <input value={manualLat} onChange={e => setManualLat(e.target.value)} className="w-full bg-[#020812] border border-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" placeholder="Auto EXIF" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-[#64748b] mb-1">Longitude</label>
                                            <input value={manualLon} onChange={e => setManualLon(e.target.value)} className="w-full bg-[#020812] border border-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" placeholder="Auto EXIF" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-[#64748b] mb-1">Rate (₹/kWh)</label>
                                            <input value={tariff} onChange={e => setTariff(e.target.value)} className="w-full bg-[#020812] border border-[#1e293b] rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={resetAll} className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={startAnalysis} className="flex-1 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]">
                                            <Play size={16} /> ANALYSE ROOF WITH AI
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* == DONE == */}
                    {phase === 'done' && result && (
                        <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 animate-[fadeSlideUp_0.4s_ease-out]">

                            {/* 1. Score Row */}
                            <div className="bg-[#0f172a]/90 border border-amber-500/15 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                                <div className="w-1/3">
                                    <div className="w-24 h-24 mx-auto relative">
                                        <ScoreGauge score={result.solar_score} />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                                            <span className="text-3xl font-black">{result.solar_score}</span>
                                            <span className="text-[10px] text-gray-500 uppercase">SCORE</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-2/3 pl-4 space-y-3">
                                    {(() => {
                                        const dict: Record<string, { c: string, b: string }> = {
                                            "excellent": { c: "text-green-400", b: "bg-green-400/10 border-green-400/30" },
                                            "good": { c: "text-lime-400", b: "bg-lime-400/10 border-lime-400/30" },
                                            "moderate": { c: "text-amber-400", b: "bg-amber-400/10 border-amber-400/30" },
                                            "poor": { c: "text-red-400", b: "bg-red-400/10 border-red-400/30" }
                                        };
                                        const style = dict[result.solar_suitability] || dict["moderate"];
                                        return (
                                            <div className={`inline-block px-3 py-1 rounded-lg border ${style.b} ${style.c} text-xs font-bold uppercase tracking-wider`}>
                                                {result.solar_suitability} SUITABILITY
                                            </div>
                                        );
                                    })()}
                                    <p className="text-sm font-bold text-gray-300 capitalize">{result.cardinal_orientation} • {result.roof_slope}</p>
                                    <p className="text-xs text-gray-500 capitalize">{result.shading_severity} Shading • {result.roof_material}</p>
                                </div>
                            </div>

                            {/* 2. Metrics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { l: "Roof Area", v: result.roof_area_m2, u: "m²" },
                                    { l: "Usable", v: result.usable_area_m2, u: "m²" },
                                    { l: "Panels", v: result.panel_count, u: "" },
                                    { l: "System Size", v: result.system_kwp, u: "kWp" },
                                    { l: "Annual Output", v: result.annual_kwh, u: "kWh" },
                                    { l: "Savings", v: result.annual_savings_inr, u: "₹" },
                                    { l: "Payback", v: result.payback_years, u: "Yrs" },
                                    { l: "CO₂ Offset", v: result.co2_kg_per_year, u: "kg" }
                                ].map(m => (
                                    <div key={m.l} className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3 text-center">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{m.l}</p>
                                        <p className="font-mono text-base font-bold text-amber-400">
                                            {fmt(m.v, m.l === "Payback" || m.l === "System Size" ? 1 : 0)} <span className="text-xs text-amber-500/50">{m.u}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* 3. Attribute Chips (Wrap row) */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    `Material: ${result.roof_material}`,
                                    `Model Confidence: ${Math.round(result.seg_confidence * 100)}%`,
                                    `Tilt: ${result.roof_slope}`,
                                    `Obstructions: ${result.obstruction_count}`
                                ].map(t => (
                                    <span key={t} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-300 font-mono capitalize">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            {/* 4. Shading Sources */}
                            {result.shading_sources && result.shading_sources.length > 0 && result.shading_sources[0] !== "none" && (
                                <div className="flex flex-wrap gap-2 items-center text-xs">
                                    <span className="text-gray-500 uppercase tracking-widest text-[10px]">Shade Sources:</span>
                                    {result.shading_sources.map((s: string) => (
                                        <span key={s} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-md capitalize">
                                            {s.replace("_", " ")}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* 5. AI Analysis Box */}
                            <div className="bg-[#0b1423] border border-amber-500/30 rounded-2xl overflow-hidden relative shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                                <div className="p-4 border-b border-white/5">
                                    <h3 className="font-bold text-amber-500 text-sm flex items-center justify-between">
                                        <span>🧠 CLAUDE AI ANALYSIS</span>
                                        <span className="text-[10px] opacity-50 px-2 py-0.5 border border-amber-500/20 rounded">claude-opus-4</span>
                                    </h3>
                                </div>
                                <ul className="p-4 space-y-2 text-xs text-gray-300 leading-relaxed font-sans">
                                    {result.key_observations?.map((obs: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-amber-500 mt-0.5">•</span>
                                            <span>{obs}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="bg-green-500/5 border-t border-green-500/10 p-4">
                                    <p className="text-xs text-green-300 font-sans italic">
                                        <span className="font-bold not-italic font-mono text-[10px] text-green-500 uppercase tracking-widest block mb-1">Recommendation</span>
                                        "{result.recommendation}"
                                    </p>
                                </div>
                            </div>

                            {/* 6. Result Actions */}
                            <div className="flex justify-between pt-2 border-t border-white/5">
                                <button onClick={resetAll} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs flex items-center gap-2 transition-colors">
                                    <RefreshCw size={14} /> New Analysis
                                </button>
                                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] uppercase font-bold tracking-wider">
                                    SAM2 + Claude · Live
                                </span>
                            </div>

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
}
