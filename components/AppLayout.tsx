import React from 'react';
import { User, Tab } from '../types';
import { Settings, Home, Plus, MessageSquare } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSettingsClick: () => void;
  isLight: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSettingsClick, isLight }) => {
  const headerBgClass = isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-950/80 border-white/5';
  const textColor = isLight ? 'text-slate-900' : 'text-white';

  return (
    <div className={`absolute top-0 left-0 w-full h-16 backdrop-blur-md z-10 flex items-center justify-between px-4 border-b transition-colors duration-300 ${headerBgClass}`}>
      <button 
        onClick={onSettingsClick}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 p-[2px]">
          <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full rounded-full bg-slate-900 object-cover" />
        </div>
        <div className="flex flex-col items-start">
          <span className={`text-xs font-bold leading-none group-hover:text-fuchsia-500 transition-colors ${textColor}`}>{currentUser.name}</span>
          <span className="text-[10px] text-fuchsia-500 leading-none">{currentUser.handle}</span>
        </div>
      </button>
      
      <button 
        onClick={onSettingsClick} 
        className={`${isLight ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-500 hover:text-white'} transition-colors`}
      >
        <Settings size={20} />
      </button>
    </div>
  );
};

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onCameraClick: () => void;
  requestCount: number;
  isLight: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, onCameraClick, requestCount, isLight }) => {
  const navBgClass = isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800';
  const navActiveColor = isLight ? 'text-indigo-600' : 'text-white';
  const navInactiveColor = isLight ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`absolute bottom-0 left-0 w-full h-20 border-t flex items-center justify-around z-20 pb-2 transition-colors duration-300 ${navBgClass}`}>
      <button 
        onClick={() => onTabChange(Tab.FEED)}
        className={`p-4 flex flex-col items-center gap-1 transition-colors ${activeTab === Tab.FEED ? navActiveColor : navInactiveColor}`}
      >
        <Home size={24} strokeWidth={activeTab === Tab.FEED ? 3 : 2} />
        <span className="text-[10px] font-bold">Feed</span>
      </button>

      <button 
        onClick={onCameraClick}
        className="relative -top-5 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white rounded-full p-4 shadow-lg shadow-indigo-500/40 hover:scale-105 transition-transform active:scale-95"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      <button 
        onClick={() => onTabChange(Tab.CHAT)}
        className={`p-4 flex flex-col items-center gap-1 transition-colors relative ${activeTab === Tab.CHAT ? navActiveColor : navInactiveColor}`}
      >
        <div className="relative">
          <MessageSquare size={24} strokeWidth={activeTab === Tab.CHAT ? 3 : 2} />
          {requestCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center font-bold rounded-full border-2 border-slate-950">
              {requestCount}
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">Chat</span>
      </button>
    </div>
  );
};
