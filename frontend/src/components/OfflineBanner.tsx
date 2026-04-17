import React from 'react';
import { useNetwork } from '../hooks/useNetwork';

export const OfflineBanner: React.FC = () => {
    const isOnline = useNetwork();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 w-full bg-red-500 text-white text-center py-2 z-50 animate-pulse font-bold">
            ⚠️ You are offline. Some features may not work.
        </div>
    );
};
