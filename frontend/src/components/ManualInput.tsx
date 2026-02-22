import { useState } from 'react';
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

    return (
        <div className="fixed inset-0 z-modal bg-midnight overflow-auto animate-fade-in">
            <div className="max-w-3xl mx-auto px-6 py-10">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors btn-press"
                >
                    <ArrowLeft size={18} />
                    <span>Back to choice</span>
                </button>

                <div className="bg-surface border border-divider rounded-2xl p-8 shadow-deep">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-divider">
                        <div className="w-12 h-12 bg-electric-blue/10 rounded-xl flex items-center justify-center">
                            <FormInput size={24} className="text-electric-blue" />
                        </div>
                        <div>
                            <h1 className="text-h2 font-extrabold text-text-primary">Manual Configuration</h1>
                            <p className="text-text-secondary text-sm">Enter your building details directly to skip the map.</p>
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
                                    <button
                                        type="button"
                                        onClick={handleGeocode}
                                        disabled={!address || isSearching}
                                        className="bg-electric-blue hover:bg-electric-blue-lt disabled:opacity-50 text-white px-6 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center min-w-[100px]"
                                    >
                                        {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
                                    </button>
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
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
                                </div>
                            </div>

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
                                        className="w-full bg-midnight border border-slate-blue/30 rounded-lg px-4 py-3 text-sm font-data text-text-primary focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25"
                                    />
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
            </div>
        </div>
    );
}
