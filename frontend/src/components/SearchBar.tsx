import { useState, useRef } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import { geocodeAddress, fetchCities } from '../api/client';
import { useAppStore } from '../store/appStore';
import { useQuery } from '@tanstack/react-query';
import type { City } from '../types';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [searchError, setSearchError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { setMapCenter, setAnalysis, setCalculationError, setPanelOpen, setActiveFlow } = useAppStore();

  const { data: cities } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearchError('');
    try {
      const result = await geocodeAddress(query);
      setMapCenter([result.lat, result.lon], 16);
      setAnalysis(null);
      setCalculationError(null);
      setPanelOpen(false);
      setActiveFlow('map');
      setQuery('');
      setShowCities(false);
    } catch {
      setSearchError('Location not found. Try a different address.');
      setTimeout(() => setSearchError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: City) => {
    setMapCenter([city.lat, city.lon], 14);
    setAnalysis(null);
    setCalculationError(null);
    setPanelOpen(false);
    setActiveFlow('map');
    setShowCities(false);
    setQuery('');
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowCities(true)}
            onBlur={() => setTimeout(() => setShowCities(false), 150)}
            placeholder="Search address or click a building on the map..."
            className="w-full bg-surface-light border border-slate-blue/30 rounded-cta pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted
                       focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25
                       transition-all duration-fast"
            aria-label="Search for an address"
          />
          {loading && (
            <Loader
              size={14}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-solar-orange animate-spin"
            />
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-solar-orange hover:bg-solar-orange-lt disabled:opacity-50 rounded-cta text-white text-sm font-semibold
                     transition-all duration-fast btn-press shrink-0 shadow-sm"
        >
          Go
        </button>
      </form>

      {/* City Dropdown */}
      {showCities && cities && cities.length > 0 && !query && (
        <div className="absolute top-full mt-2 w-full bg-surface border border-slate-blue/20 rounded-card shadow-deep z-dropdown overflow-hidden animate-slide-up">
          <p className="px-4 py-2 text-xs text-text-muted uppercase tracking-wider border-b border-divider font-semibold">
            Quick Cities
          </p>
          {cities.map((city) => (
            <button
              key={city.name}
              onMouseDown={() => handleCitySelect(city)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-light hover:text-solar-orange transition-colors duration-fast text-left cursor-pointer"
            >
              <MapPin size={14} className="text-solar-orange shrink-0" />
              <span>{city.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Search Error Toast */}
      {searchError && (
        <div className="absolute top-full mt-2 w-full bg-error/10 border border-error/30 text-error text-sm px-4 py-2.5 rounded-lg animate-fade-in z-dropdown">
          {searchError}
        </div>
      )}
    </div>
  );
}
