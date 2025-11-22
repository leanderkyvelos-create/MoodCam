import React, { useRef, useState } from 'react';
import { MoodResult } from '../types';
import { Send, Download, RefreshCw, Globe, Lock } from 'lucide-react';

interface ResultDisplayProps {
  imageSrc: string;
  result: MoodResult;
  onRetake: () => void;
  onPost: (isPublic?: boolean) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ imageSrc, result, onRetake, onPost }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | undefined>(undefined); // undefined = use default

  // Helper to draw the composite image for download/share
  const generateCompositeImage = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set canvas to high res square
        const size = 1080; 
        canvas.width = size;
        canvas.height = size;

        if (!ctx) return resolve(null);

        // 1. Draw Image
        ctx.drawImage(img, 0, 0, size, size);

        // 2. Add Gradient Overlay (Bottom up)
        const gradient = ctx.createLinearGradient(0, size * 0.5, 0, size);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.6, 'rgba(0,0,0,0.6)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // 3. Draw Text
        ctx.textAlign = 'center';
        
        // Percentage & Label
        ctx.fillStyle = result.colorHex;
        ctx.font = 'bold 120px "Space Grotesk", sans-serif';
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 20;
        ctx.fillText(`${result.percentage}%`, size / 2, size - 320);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px "Space Grotesk", sans-serif';
        ctx.fillText(result.label.toUpperCase(), size / 2, size - 240);

        // Description
        ctx.fillStyle = '#cbd5e1'; // Slate-300
        ctx.font = 'italic 36px "Space Grotesk", sans-serif';
        const maxWidth = size * 0.8;
        wrapText(ctx, result.description, size / 2, size - 160, maxWidth, 48);

        // Branding
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '24px "Space Grotesk", sans-serif';
        ctx.fillText('MoodCam AI', size / 2, size - 50);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = imageSrc;
    });
  };

  // Helper function to wrap text
  function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
  }

  const handleDownload = async () => {
    setIsGenerating(true);
    const compositeUrl = await generateCompositeImage();
    if (compositeUrl) {
      const link = document.createElement('a');
      link.href = compositeUrl;
      link.download = `moodcam-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 relative overflow-hidden md:rounded-xl">
      
      {/* Main Image Container */}
      <div className="relative flex-1 bg-black w-full overflow-hidden group">
        <img 
          src={imageSrc} 
          alt="Selfie" 
          className="w-full h-full object-cover opacity-80" 
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end items-center pb-36 px-6 text-center">
            
            <div 
              className="text-8xl font-black mb-2 drop-shadow-lg tracking-tighter"
              style={{ color: result.colorHex }}
            >
              {result.percentage}%
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3 uppercase tracking-wide drop-shadow-md">
              {result.label}
            </h2>
            
            {/* Scrollable Description Area */}
            <div className="max-h-24 overflow-y-auto scrollbar-hide w-full flex justify-center">
                <p className="text-slate-300 text-lg italic leading-relaxed max-w-xs drop-shadow-sm">
                "{result.description}"
                </p>
            </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-0 w-full p-6 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-20 rounded-t-3xl">
        <div className="flex flex-col gap-3">
            
          {/* Privacy Toggle */}
          <div className="flex justify-center mb-1">
             <button 
               onClick={() => setIsPublic(prev => !prev)}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isPublic 
                    ? 'bg-fuchsia-900/30 border-fuchsia-500 text-fuchsia-300' 
                    : (isPublic === false ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-transparent border-slate-700 text-slate-500')
               }`}
             >
               {isPublic ? <Globe size={14} /> : <Lock size={14} />}
               <span>{isPublic ? 'Public Post' : 'Friends Only'}</span>
             </button>
          </div>

          <button
            onClick={() => onPost(isPublic)}
            className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold text-lg shadow-lg shadow-fuchsia-900/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
             Post to Feed <Send size={20} />
          </button>

          <div className="flex gap-3">
            <button
              onClick={onRetake}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition active:scale-95"
            >
              <RefreshCw size={18} />
              Trash
            </button>
            
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <Download size={18} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};