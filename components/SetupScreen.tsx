import React from 'react';
import { Database, Copy } from 'lucide-react';
import { SQL_SETUP_SCRIPT } from '../constants/databaseSetup';

export const SetupScreen: React.FC = () => {
  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT.trim());
    alert("SQL copied! Paste it in Supabase SQL Editor.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="max-w-md w-full bg-slate-900 p-6 rounded-2xl border border-red-500/30 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 text-red-400">
          <Database size={32} />
          <h1 className="text-2xl font-bold">Database Setup Required</h1>
        </div>
        <p className="text-slate-300 mb-6 text-sm">
          To fix "RLS" and "Missing Table" errors, you must run this SQL in Supabase.
        </p>
        
        <div className="relative bg-black rounded-lg p-4 mb-6 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 h-48">
          <pre>{SQL_SETUP_SCRIPT}</pre>
          <button 
            onClick={handleCopySQL}
            className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-md text-white transition-colors border border-slate-600"
            title="Copy SQL"
          >
            <Copy size={16} />
          </button>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-bold transition-colors"
        >
          I have run the SQL, Reload App
        </button>
      </div>
    </div>
  );
};
