import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const useCapacitorCamera = () => {
    const takePicture = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Prompt
                });
                return image.webPath; // URL suitable for <img src=>
            } catch (e) {
                console.error("Camera error:", e);
                return null;
            }
        } else {
            console.warn("Camera not available on web, use standard file input.");
            return null;
        }
    };
    return { takePicture };
};
