import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, RotateCcw } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 1280 }, // Square-ish aspect preferred for social
        }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]); // Re-run when facing mode changes

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Handle varying video dimensions to get a nice crop
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        // Center crop
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        
        // Mirror the image if in user mode (selfie)
        if (facingMode === 'user') {
            context.save();
            context.scale(-1, 1);
            context.drawImage(canvas, -size, 0); // Draw image back flipped
            context.restore();
        }

        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        
        // Stop stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        onCapture(imageSrc);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={onCancel}
          className="px-6 py-2 bg-slate-800 rounded-full hover:bg-slate-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlays */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onCancel} className="text-white/80 hover:text-white">
          Cancel
        </button>
        <button onClick={toggleCamera} className="text-white/80 hover:text-white flex items-center gap-2">
           <RotateCcw size={20} /> Flip
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-center bg-gradient-to-t from-black/60 to-transparent pb-12">
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>
      </div>
    </div>
  );
};