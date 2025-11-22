import React from 'react';

// --- SPLASH SCREEN ---
export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black">
    {/* Animated Background Glow */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-600/20 blur-[100px] rounded-full animate-pulse"></div>
    </div>

    {/* Logo Container */}
    <div className="relative flex flex-col items-center animate-bounce-in">
      
      {/* App Icon */}
      <div className="w-28 h-28 mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-3xl rotate-6 opacity-80 blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-fuchsia-900/50 border border-white/10">
          <div className="w-14 h-14 rounded-full border-4 border-white/30 bg-black/20 backdrop-blur-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white/80 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </div>
        </div>
      </div>
      
      {/* Text */}
      <h1 className="text-5xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
        MOOD<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">CAM</span>
      </h1>
      
      {/* Loading Bar */}
      <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full animate-loading-slide"></div>
      </div>
      
      <p className="text-[10px] font-bold text-slate-500 mt-4 tracking-[0.2em] uppercase">Checking Vibe Check...</p>
    </div>
  </div>
);

// --- PROCESSING SCREEN ---
interface ProcessingScreenProps {
  capturedImage: string | null;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ capturedImage }) => (
  <div className="flex flex-col items-center justify-center h-full bg-black relative z-50">
    {capturedImage && (
      <img src={capturedImage} alt="processing bg" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-md" />
    )}
    <div className="z-10 text-center p-8 rounded-2xl bg-black/40 backdrop-blur-sm">
      <div className="w-16 h-16 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
      <h2 className="text-2xl font-bold text-white mb-2">Judging You...</h2>
      <p className="text-slate-400 animate-pulse">Consulting the vibe algorithms</p>
    </div>
  </div>
);

// --- ERROR SCREEN ---
interface ErrorScreenProps {
  onRetake: () => void;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ onRetake }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-900 z-50">
    <div className="text-6xl mb-4">😵‍💫</div>
    <h2 className="text-xl font-bold text-white mb-2">Vibe Check Failed</h2>
    <p className="text-slate-400 mb-8">Something went wrong. The vibes were too powerful.</p>
    <button
      onClick={onRetake}
      className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
    >
      Try Again
    </button>
  </div>
);
