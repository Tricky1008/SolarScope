import { useState, useRef, useCallback } from 'react';
import { Upload, ImagePlus, Loader2, CheckCircle2, AlertTriangle, X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { analyzeImage } from '../api/client';
import RoofMaskOverlay from './RoofMaskOverlay';
import { MobileImagePicker } from './MobileImagePicker';

type UploadStep = 'idle' | 'preview' | 'locating' | 'analyzing' | 'done' | 'error';

export default function ImageUploadPanel() {
    const {
        setImageAnalysisResult, setUploadedImageSrc, setPanelOpen,
        setImageAnalyzing, setCalculationError, setAnalysis,
        electricityTariff, costPerKwp, currency,
        imageAnalysisResult, uploadedImageSrc,
    } = useAppStore();

    const [step, setStep] = useState<UploadStep>(uploadedImageSrc ? 'done' : 'idle');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(uploadedImageSrc);
    const [lat, setLat] = useState<string>('');
    const [lon, setLon] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File) => {
        if (!f.type.startsWith('image/')) {
            setErrorMsg('Please upload an image file (JPG, PNG, TIFF)');
            setStep('error');
            return;
        }
        if (f.size > 25 * 1024 * 1024) {
            setErrorMsg('Image must be under 25 MB');
            setStep('error');
            return;
        }
        setFile(f);
        const url = URL.createObjectURL(f);
        setPreviewUrl(url);
        setUploadedImageSrc(url);
        setStep('preview');
    }, [setUploadedImageSrc]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleFileFromMobile = async (url: string | File) => {
        if (typeof url === 'string') {
            try {
                const res = await fetch(url);
                const blob = await res.blob();
                const f = new File([blob], 'mobile_photo.jpg', { type: blob.type });
                handleFile(f);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to process image from camera');
                setStep('error');
            }
        } else {
            handleFile(url);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            setErrorMsg('Enter valid coordinates (lat: -90 to 90, lon: -180 to 180)');
            setStep('error');
            return;
        }

        setStep('analyzing');
        setImageAnalyzing(true);
        setCalculationError(null);

        try {
            const result = await analyzeImage(file, latNum, lonNum, electricityTariff, costPerKwp, currency);
            setImageAnalysisResult(result);
            setAnalysis({ ...result, roof_area_m2: result.total_roof_area_m2 } as any);

            // Make the map jump to the analysis location
            useAppStore.getState().setMapCenter([latNum, lonNum], 18);
            useAppStore.getState().setSelectedLocation(latNum, lonNum);

            setPanelOpen(true);
            useAppStore.getState().setAnalysisMode('map-click');
        } catch (err: any) {
            const msg = err?.response?.data?.detail ?? 'Analysis failed. Check backend logs.';
            setErrorMsg(msg);
            setCalculationError(msg);
            setStep('error');
        } finally {
            setImageAnalyzing(false);
        }
    };

    const resetUpload = () => {
        setFile(null);
        setPreviewUrl(null);
        setUploadedImageSrc(null);
        setImageAnalysisResult(null);
        setStep('idle');
        setErrorMsg('');
    };

    return (
        <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[#030712]/70 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-2xl mx-4 bg-[#0A111C]/95 backdrop-blur-2xl border border-[#1E3550] rounded-3xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3550]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#FF8C42] shadow-lg">
                            <ImagePlus size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">Rooftop Image Analysis</h2>
                            <p className="text-gray-500 text-xs font-mono">AI-powered roof segmentation</p>
                        </div>
                    </div>
                    <button onClick={resetUpload} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <AnimatePresence mode="wait">
                        {/* ── IDLE: Drag & Drop Zone ── */}
                        {step === 'idle' && (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="hidden md:block">
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => inputRef.current?.click()}
                                        className={`
                        border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                        ${dragOver
                                                ? 'border-[#FF6B1A] bg-[#FF6B1A]/10 shadow-[0_0_30px_rgba(255,107,26,0.15)]'
                                                : 'border-[#1E3550] hover:border-[#0A84FF]/50 hover:bg-[#0A84FF]/5'}
                    `}
                                    >
                                        <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-[#FF6B1A]' : 'text-gray-500'}`} />
                                        <p className="text-white font-semibold text-sm mb-1">Drop satellite image here</p>
                                        <p className="text-gray-500 text-xs font-mono">PNG, JPG, or TIFF · max 25 MB</p>
                                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                                    </div>
                                </div>
                                <div className="md:hidden">
                                    <MobileImagePicker onImageSelected={handleFileFromMobile} />
                                    <p className="text-center text-gray-500 text-xs font-mono mt-4">or use drag and drop on desktop</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── PREVIEW: Image + Coordinate Input ── */}
                        {step === 'preview' && previewUrl && (
                            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-[#1E3550] h-48">
                                    <img src={previewUrl} alt="Uploaded" className="w-full h-full object-cover" />
                                    <button
                                        onClick={resetUpload}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-gray-400 text-xs font-mono font-bold mb-1 block">
                                            <MapPin size={12} className="inline mr-1" />Latitude
                                        </label>
                                        <input
                                            type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)}
                                            placeholder="e.g. 19.076"
                                            className="w-full px-3 py-2.5 bg-[#060B12] border border-[#1E3550] rounded-xl text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#0A84FF] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-xs font-mono font-bold mb-1 block">
                                            <MapPin size={12} className="inline mr-1" />Longitude
                                        </label>
                                        <input
                                            type="number" step="any" value={lon} onChange={(e) => setLon(e.target.value)}
                                            placeholder="e.g. 72.877"
                                            className="w-full px-3 py-2.5 bg-[#060B12] border border-[#1E3550] rounded-xl text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#0A84FF] transition-colors"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B1A] to-[#FF8C42] text-white font-bold text-sm tracking-wide shadow-[0_4px_20px_rgba(255,107,26,0.4)] hover:shadow-[0_4px_30px_rgba(255,107,26,0.6)] transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    Analyze Rooftop →
                                </button>
                            </motion.div>
                        )}

                        {/* ── ANALYZING: Progress ── */}
                        {step === 'analyzing' && (
                            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-10 space-y-4">
                                <Loader2 size={40} className="mx-auto text-[#FF6B1A] animate-spin" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Analyzing rooftop image…</p>
                                    <p className="text-gray-500 text-xs font-mono mt-1">Running ML segmentation → area calculation → solar estimation</p>
                                </div>
                                <div className="flex justify-center gap-2">
                                    {['Segment', 'Measure', 'Calculate'].map((s, i) => (
                                        <span key={s} className="px-3 py-1 rounded-full text-xs font-mono border border-[#1E3550] text-gray-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── DONE: Results preview ── */}
                        {step === 'done' && imageAnalysisResult && previewUrl && (
                            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <RoofMaskOverlay
                                    originalSrc={previewUrl}
                                    maskSrc={imageAnalysisResult.mask_bytes ?? ''}
                                    result={imageAnalysisResult}
                                />
                            </motion.div>
                        )}

                        {/* ── ERROR ── */}
                        {step === 'error' && (
                            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-3">
                                <AlertTriangle size={36} className="mx-auto text-red-400" />
                                <p className="text-red-300 text-sm font-semibold">{errorMsg}</p>
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => { setErrorMsg(''); setStep(file ? 'preview' : 'idle'); }}
                                        className="px-5 py-2 rounded-xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/30 text-[#FF6B1A] text-xs font-semibold hover:bg-[#FF6B1A]/20 transition-colors"
                                    >
                                        Fix & Retry
                                    </button>
                                    <button onClick={resetUpload} className="px-5 py-2 rounded-xl bg-white/5 border border-[#1E3550] text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors">
                                        Start Over
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
