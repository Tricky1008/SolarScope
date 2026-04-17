import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useState, useCallback } from 'react';

export const useGeolocation = () => {
    const [loc, setLoc] = useState<{ lat: number, lng: number } | null>(null);

    const requestLocation = useCallback(async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') await Geolocation.requestPermissions();
                const position = await Geolocation.getCurrentPosition();
                setLoc({ lat: position.coords.latitude, lng: position.coords.longitude });
            } else {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                });
            }
        } catch (e) {
            console.error("Geolocation error", e);
        }
    }, []);

    return { loc, requestLocation };
};
