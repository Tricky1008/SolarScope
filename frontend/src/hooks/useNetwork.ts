import { Network } from '@capacitor/network';
import { useState, useEffect } from 'react';

export const useNetwork = () => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        Network.getStatus().then(status => setIsOnline(status.connected));
        const handle = Network.addListener('networkStatusChange', status => {
            setIsOnline(status.connected);
        });
        return () => { handle.then(h => h.remove()); };
    }, []);

    return isOnline;
};
