import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.solarscope.app',
    appName: 'SolarScope',
    webDir: 'dist',
    plugins: {
        SplashScreen: {
            launchShowDuration: 0,
        },
        StatusBar: {
            overlaysWebView: true
        },
        Camera: {
            _unimplemented: "Using Capacitor Camera"
        }
    },
    server: {
        cleartext: true
    }
};

export default config;
