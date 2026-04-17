import React from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin } from 'lucide-react';

export const GPSButton: React.FC<{ onLocate: (lat: number, lng: number) => void }> = ({ onLocate }) => {
    const { loc, requestLocation } = useGeolocation();

    React.useEffect(() => {
        if (loc) onLocate(loc.lat, loc.lng);
    }, [loc, onLocate]);

    return (
        <button
            onClick={requestLocation}
            className="absolute bottom-6 right-6 bg-cyan-500 hover:bg-cyan-400 text-white p-4 rounded-full shadow-lg z-[1000] border border-cyan-400/30 transition-transform active:scale-95"
        >
            <MapPin size={24} />
        </button>
    );
};
