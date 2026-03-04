import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormInput, ArrowLeft, ArrowRight, MapPin, Zap, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { calculateSolar } from '../api/client';
import axios from 'axios';

interface ManualInputProps {
    onBack: () => void;
    onSuccess: () => void;
}

export default function ManualInput({ onBack, onSuccess }: ManualInputProps) {
    const {
        electricityTariff, costPerKwp, currency, updateSettings,
        roofLength, roofWidth, panelDirection, roofTiltAngle,
        setAnalysis, setCalculating, setCalculationError, setMapCenter, setSelectedLocation
    } = useAppStore();

    const [address, setAddress] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
    const [geocodedLon, setGeocodedLon] = useState<number | null>(null);
    const [localError, setLocalError] = useState('');

    // Pre-fill directions based on store
    const directionOptions = [
        { value: 'south', label: 'South (Optimal)' },
        { value: 'south-west', label: 'South-West' },
        { value: 'south-east', label: 'South-East' },
        { value: 'east', label: 'East' },
        { value: 'west', label: 'West' },
        { value: 'north', label: 'North' },
    ];

    const handleGeocode = async () => {
        if (!address.trim()) return;
        setIsSearching(true);
        setLocalError('');
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: address,
                    format: 'json',
                    limit: 1
                },
                headers: {
                    'User-Agent': 'SolarScope/1.0'
                }
            });
            if (res.data && res.data.length > 0) {
                const lat = parseFloat(res.data[0].lat);
                const lon = parseFloat(res.data[0].lon);
                setGeocodedLat(lat);
                setGeocodedLon(lon);

                // Also parse out a nicer display name
                setAddress(res.data[0].display_name);

                // Pre-warm the map location in the background
                setMapCenter([lat, lon], 18);
                setSelectedLocation(lat, lon);
            } else {
                setLocalError("Could not find coordinates for this address. Please be more specific.");
                setGeocodedLat(null);
                setGeocodedLon(null);
            }
        } catch (err) {
            setLocalError("Error communicating with geocoding service.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (!geocodedLat || !geocodedLon) {
            setLocalError("Please search for a valid address first to get coordinates.");
            return;
        }

        if (roofLength <= 0 || roofWidth <= 0) {
            setLocalError("Roof dimensions must be greater than 0.");
            return;
        }

        const area = roofLength * roofWidth;

        try {
            setCalculating(true);
            setCalculationError(null);

            // Go to the Analysis UI instantly
            onSuccess();

            // Fire API request
            const data = await calculateSolar({
                lat: geocodedLat,
                lon: geocodedLon,
                roof_area_m2: area,
                tilt_angle: roofTiltAngle,
                electricity_tariff: electricityTariff
            });

            setAnalysis(data);
        } catch (err: any) {
            setCalculationError(err.response?.data?.detail || err.message);
        } finally {
            setCalculating(false);
        }
    };

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const SPRING: any = { type: "spring", stiffness: 300, damping: 20 };
    const BOUNCE_SPRING: any = { type: "spring", stiffness: 400, damping: 15, mass: 0.8 };

    return (
        <div className="fixed inset-0 z-modal bg-[#060B12] overflow-auto ss-root font-['DM_Sans',sans-serif] pb-24">

            {/* NOISE & GRID */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.25]"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")'
                }}
            />
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* DYNAMIC ORBS TRACKING MOUSE */}
            <motion.div
                className="fixed w-[600px] h-[600px] bg-[#FF6B1A]/10 rounded-full blur-[120px] pointer-events-none"
                animate={{
                    x: mousePos.x - 300,
                    y: mousePos.y - 300,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 1.5 }}
            />
            <motion.div
                className="fixed right-0 bottom-0 w-[500px] h-[500px] bg-[#0A84FF]/10 rounded-full blur-[100px] pointer-events-none"
                animate={{
                    x: mousePos.x * -0.2,
                    y: mousePos.y * -0.2,
                }}
                transition={{ type: "tween", ease: "circOut", duration: 2 }}
            />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={BOUNCE_SPRING}
                className="max-w-3xl mx-auto px-6 py-10 relative z-10"
            >
                {/* Back Button */}
                <motion.button
                    whileHover={{ x: -4 }}
                    transition={SPRING}
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={18} />
                    <span className="font-medium tracking-wide">BACK TO CHOICE</span>
                </motion.button>

                <div className="bg-[#0A111C]/60 backdrop-blur-xl border border-[#1E3550] rounded-3xl p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B1A]/50 to-transparent opacity-50" />

                    <div className="flex items-center gap-5 mb-10 pb-8 border-b border-[#1E3550]">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0A84FF]/20 to-[#0A84FF]/5 rounded-2xl flex items-center justify-center border border-[#0A84FF]/20 shadow-[0_0_20px_rgba(10,132,255,0.15)]">
                            <FormInput size={28} className="text-[#0A84FF]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Bebas Neue', letterSpacing: '0.04em' }}>MANUAL CONFIGURATION</h1>
                            <p className="text-gray-400 text-sm font-mono mt-1">Enter your building details directly to skip the map.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Location */}
                        <section>
                            <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-electric-blue/20 text-electric-blue flex items-center justify-center text-xs font-data">1</span>
                                Property Location
                            </h3>
                            <div>
                                <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                    Target Address or City
                                </label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                        <input
                                            type="text"
                                            value={address}
                                            onChange={(e) => {
                                                setAddress(e.target.value);
                                                setGeocodedLat(null); // Reset lat/lon if they type something new
                                            }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGeocode(); } }}
                                            placeholder="e.g. 1 Infinite Loop, Cupertino, CA"
                                            className={`w-full bg-midnight border rounded-lg pl-10 pr-4 py-3 text-sm text-text-primary transition-all duration-fast ${geocodedLat ? 'border-success/50 ring-1 ring-success/20' : 'border-slate-blue/30 focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25'
                                                }`}
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        type="button"
                                        onClick={handleGeocode}
                                        disabled={!address || isSearching}
                                        className="bg-electric-blue hover:bg-electric-blue-lt disabled:opacity-50 text-white px-6 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center min-w-[100px]"
                                    >
                                        {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
                                    </motion.button>
                                </div>

                                {geocodedLat && geocodedLon ? (
                                    <p className="text-success text-xs font-data mt-2 animate-fade-in flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                                        Coordinates locked: {geocodedLat.toFixed(6)}, {geocodedLon.toFixed(6)}
                                    </p>
                                ) : (
                                    <p className="text-text-muted text-xs mt-2">
                                        We need coordinates to fetch NASA POWER irradiance data.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* 2. Dimensions & Roof */}
                        <section>
                            <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-electric-blue/20 text-electric-blue flex items-center justify-center text-xs font-data">2</span>
                                Roof Dimensions
                            </h3>

                            <div className="grid sm:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Length (meters)
                                    </label>
                                    <input
                                        type="number"
                                        min={1} max={500} step={0.5} required
                                        value={roofLength || ''}
                                        onChange={(e) => updateSettings({ roofLength: parseFloat(e.target.value) || 0 })}
                                        inputMode="decimal"
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Width (meters)
                                    </label>
                                    <input
                                        type="number"
                                        min={1} max={500} step={0.5} required
                                        value={roofWidth || ''}
                                        onChange={(e) => updateSettings({ roofWidth: parseFloat(e.target.value) || 0 })}
                                        inputMode="decimal"
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {roofLength > 0 && roofWidth > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="bg-electric-blue/5 border border-electric-blue/20 rounded-lg px-4 py-3 flex items-center gap-3 overflow-hidden"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-electric-blue/15 flex items-center justify-center shrink-0">
                                            <Zap size={14} className="text-electric-blue" />
                                        </div>
                                        <div>
                                            <p className="text-text-secondary text-xs">Computed Roof Area</p>
                                            <p className="font-data font-bold text-electric-blue text-sm">
                                                {roofLength} × {roofWidth} = {(roofLength * roofWidth).toLocaleString()} m²
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Roof Tilt (°)
                                    </label>
                                    <input
                                        type="number"
                                        min={0} max={90} step={1} required
                                        value={roofTiltAngle}
                                        onChange={(e) => updateSettings({ roofTiltAngle: parseFloat(e.target.value) || 0 })}
                                        inputMode="decimal"
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                    <p className="text-text-muted text-xs mt-1">Flat roof = 0°, typical slope = 15–30°</p>
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Panel Direction
                                    </label>
                                    <select
                                        value={panelDirection}
                                        onChange={(e) => updateSettings({ panelDirection: e.target.value })}
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    >
                                        {directionOptions.map((d) => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 3. Financials */}
                        <section>
                            <h3 className="text-text-primary font-bold mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-electric-blue/20 text-electric-blue flex items-center justify-center text-xs font-data">3</span>
                                Financial Defaults
                            </h3>

                            <div className="grid sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Currency
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => updateSettings({ currency: e.target.value })}
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        Tariff / kWh
                                    </label>
                                    <input
                                        type="number"
                                        min={0.1} max={100} step={0.1} required
                                        value={electricityTariff}
                                        onChange={(e) => updateSettings({ electricityTariff: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                </div>
                                <div>
                                    <label className="block text-text-secondary text-xs mb-1.5 font-medium uppercase tracking-wider">
                                        CapEx / kWp
                                    </label>
                                    <input
                                        type="number"
                                        min={1000} step={500} required
                                        value={costPerKwp}
                                        onChange={(e) => updateSettings({ costPerKwp: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Errors */}
                        {localError && (
                            <div className="flex items-start gap-2 bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg animate-fade-in">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{localError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-divider flex justify-end">
                            <button
                                type="submit"
                                className="bg-electric-blue hover:bg-electric-blue-lt text-white px-8 py-3.5 rounded-cta font-bold text-base transition-all duration-300 flex items-center gap-2 shadow-[0_4px_20px_rgba(40,154,249,0.3)] btn-press"
                            >
                                <Zap size={18} />
                                Calculate Generation
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
