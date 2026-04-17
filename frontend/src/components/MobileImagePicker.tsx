import React from 'react';
import { useCapacitorCamera } from '../hooks/useCapacitorCamera';

export const MobileImagePicker: React.FC<{ onImageSelected: (file: File | string) => void }> = ({ onImageSelected }) => {
    const { takePicture } = useCapacitorCamera();

    const handleTap = async () => {
        const photoUrl = await takePicture();
        if (photoUrl) onImageSelected(photoUrl);
    };

    return (
        <button onClick={handleTap} className="btn-primary w-full py-4 text-lg">
            📸 Take Photo / Select from Gallery
        </button>
    );
};
