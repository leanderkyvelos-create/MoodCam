import React, { useState, useRef } from 'react';
import { User, UserSettings } from '../types';
import { StorageService } from '../services/storageService';
import { Moon, Sun, Lock, LogOut, ChevronRight, Check, RefreshCw, Share2, Camera, Copy } from 'lucide-react';

interface SettingsScreenProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onUpdateUser, onLogout }) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings || {
    theme: 'dark',
    language: 'en',
    privateAccount: false
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    const updatedUser = await StorageService.updateUserSettings(updated);
    if (updatedUser) {
      onUpdateUser(updatedUser);
    }
  };

  const handleRegenerateAvatar = async () => {
    setIsRegenerating(true);
    const newSeed = Math.random().toString(36).substring(7) + Date.now().toString();
    const newAvatarUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${newSeed}`;
    
    const updatedUser = await StorageService.updateUser({ avatarUrl: newAvatarUrl });
    if (updatedUser) {
        onUpdateUser(updatedUser);
    }
    setIsRegenerating(false);
  };

  const handleShareProfile = () => {
    // Simulating copying the ID for sharing
    navigator.clipboard.writeText(`Add me on MoodCam! ID: ${user.handle}`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const updatedUser = await StorageService.updateUser({ avatarUrl: base64 });
        if (updatedUser) {
            onUpdateUser(updatedUser);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isLight = settings.theme === 'light';

  return (
    <div className="flex-1 overflow-y-auto pb-24 h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="pt-16 px-6">
        
        {/* PROFILE HEADER */}
        <div className="flex flex-col items-center mb-8">
           <div className="relative group">
              <div className={`w-28 h-28 rounded-full border-4 overflow-hidden bg-white relative ${isLight ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-indigo-500'}`}>
                 <img 
                   src={user.avatarUrl} 
                   alt="Avatar" 
                   className={`w-full h-full object-cover transition-opacity duration-300 ${isRegenerating ? 'opacity-50' : 'opacity-100'}`}
                 />
                 {/* Upload Overlay */}
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-bold"
                 >
                    <Camera size={24} />
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileUpload}
                 />
              </div>
              <button 
                onClick={handleRegenerateAvatar}
                disabled={isRegenerating}
                className="absolute bottom-0 right-0 p-2 bg-fuchsia-600 text-white rounded-full shadow-lg hover:bg-fuchsia-500 active:scale-95 transition-all border-2 border-slate-900"
                title="Randomize Avatar"
              >
                <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
              </button>
           </div>
           <h2 className={`mt-4 text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h2>
           
           <div className="mt-2 flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700">
             <span className="text-fuchsia-500 font-bold font-mono">{user.handle}</span>
             <button onClick={handleShareProfile} className="text-slate-400 hover:text-white">
                {showCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
             </button>
           </div>

           <button 
             onClick={handleShareProfile}
             className="mt-4 flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-500 active:scale-95 transition-all"
           >
             <Share2 size={16} /> Share Profile
           </button>
        </div>

        <h2 className={`text-lg font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>App Settings</h2>

        <div className="space-y-6">
          
          {/* SECTION: APPEARANCE */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">Appearance</h3>
            <div className={`rounded-2xl overflow-hidden border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
              
              {/* Theme Toggle */}
              <div className={`p-4 flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'} border-b`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-800 text-indigo-400'}`}>
                    {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div>
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Theme</div>
                    <div className="text-xs text-slate-500">{settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                  </div>
                </div>
                
                <div className="flex bg-slate-800 p-1 rounded-full border border-slate-700">
                  <button 
                    onClick={() => handleUpdate({ theme: 'light' })}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${settings.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => handleUpdate({ theme: 'dark' })}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${settings.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* SECTION: PRIVACY */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">Privacy & Visibility</h3>
            <div className={`rounded-2xl overflow-hidden border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-800 text-emerald-400'}`}>
                     <Lock size={18} />
                  </div>
                  <div>
                    <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Private Account</div>
                    <div className="text-xs text-slate-500 max-w-[180px] leading-tight">
                      {settings.privateAccount 
                        ? "You are hidden from Global Feed. Only friends can see your posts." 
                        : "Your posts can appear in the Global Feed."}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleUpdate({ privateAccount: !settings.privateAccount })}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${settings.privateAccount ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${settings.privateAccount ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>
          </section>

           {/* SECTION: DATA */}
           <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 ml-2">Account</h3>
            <div className={`rounded-2xl overflow-hidden border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'}`}>
              
              <button 
                onClick={onLogout}
                className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors`}>
                     <LogOut size={18} />
                   </div>
                   <span className="font-bold text-red-400 group-hover:text-red-500 transition-colors">Log Out</span>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-red-500" />
              </button>

            </div>
            <p className="text-center text-xs text-slate-600 mt-8">MoodCam v1.2.0 (Online)</p>
          </section>

        </div>
      </div>
    </div>
  );
};