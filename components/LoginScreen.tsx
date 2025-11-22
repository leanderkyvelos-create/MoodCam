
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Lock, User, AlertCircle, Mail, ArrowLeft, Check, Clock, Wrench, Globe, MapPin } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { LocationService } from '../services/locationService';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

type AuthStep = 'LOGIN' | 'REGISTER_CREDENTIALS' | 'REGISTER_PROFILE' | 'REGISTER_PRIVACY';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isPrivate, setIsPrivate] = useState(true); // Default to Private
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [detectedCity, setDetectedCity] = useState('');
  
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0);

  // Handle Rate Limit Countdown
  useEffect(() => {
    if (rateLimitCountdown > 0) {
      const timer = setTimeout(() => setRateLimitCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitCountdown]);

  // Auto-detect region name (fallback)
  useEffect(() => {
      if (step === 'REGISTER_PRIVACY') {
          const city = LocationService.getCityFromTimezone();
          setDetectedCity(city);
      }
  }, [step]);

  const handleEnableLocation = async () => {
      setIsLoading(true);
      const pos = await LocationService.getCurrentPosition();
      if (pos) {
          setLocationEnabled(true);
          // In a real app, we'd reverse geocode pos.lat/lng here.
          // For now, we mark it enabled and use the Timezone city as the name
          // to avoid needing another API key.
          setDetectedCity(LocationService.getCityFromTimezone()); 
      }
      setIsLoading(false);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    
    if (step === 'REGISTER_CREDENTIALS') {
        if (!email.includes('@') || password.length < 6) {
            setError('Please enter a valid email and a password (min 6 chars).');
            return;
        }
        setStep('REGISTER_PROFILE');
    } else if (step === 'REGISTER_PROFILE') {
        if (!username.trim()) {
            setError('Please choose a username.');
            return;
        }
        setStep('REGISTER_PRIVACY');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setIsLoading(true);

    try {
      if (step === 'LOGIN' || step === 'REGISTER_PRIVACY') {
          // Determine if it's a login or registration attempt
          if (step === 'LOGIN') {
            const user = await StorageService.loginUser(email, password);
            if (user) {
              onLoginSuccess(user);
            }
          } else {
             // REGISTRATION FLOW (Final Step)
            const region = LocationService.detectRegion();
            const locationName = detectedCity || LocationService.getCityFromTimezone();

            const user = await StorageService.registerUser(
                email, 
                password, 
                username, 
                isPrivate, 
                region,
                locationName
            );
            onLoginSuccess(user);
          }
      }
    } catch (err: any) {
       console.error(err);
       const msg = (err.message || err.toString() || '').trim();

       if (msg === 'DATABASE_SETUP_REQUIRED') {
           setError('System Error: Database tables are missing. Please reload the app to see setup instructions.');
       } else if (msg === 'EMAIL_NOT_CONFIRMED') {
           setError('Confirmation email sent! You must click the link in your inbox.');
           setErrorCode('EMAIL_NOT_CONFIRMED');
       } else if (msg === 'PROFILE_CREATION_FAILED') {
           setError('Account created, but database setup is incomplete.');
           setErrorCode('PROFILE_CREATION_FAILED');
       } else if (msg.includes('ALREADY_REGISTERED') || msg.toLowerCase().includes('already registered')) {
           setError('Account already exists with this email.');
           setErrorCode('ALREADY_REGISTERED');
       } else if (msg.includes('INVALID_LOGIN') || msg.toLowerCase().includes('invalid login')) {
           setError('Incorrect email or password.');
           setErrorCode('INVALID_LOGIN');
       } else if (msg.includes('security purposes')) {
           const seconds = parseInt(msg.match(/after (\d+) seconds/)?.[1] || '30');
           setRateLimitCountdown(seconds);
           setError(`Too many attempts. Please wait ${seconds} seconds.`);
       } else {
           setError(msg || 'Something went wrong');
       }
       setIsLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderTitle = () => {
      if (step === 'REGISTER_PRIVACY') return 'Privacy & Location';
      if (step === 'REGISTER_PROFILE') return 'One last thing.';
      if (step === 'REGISTER_CREDENTIALS') return 'Create Account';
      return 'Welcome Back';
  };

  const renderSubtitle = () => {
      if (step === 'REGISTER_PRIVACY') return 'Who can see you?';
      if (step === 'REGISTER_PROFILE') return 'Choose a display name for your vibes.';
      if (step === 'REGISTER_CREDENTIALS') return 'Enter your details to get started.';
      return 'Sign in to check your vibe.';
  };

  const isSubmitStep = step === 'LOGIN' || step === 'REGISTER_PRIVACY';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 relative overflow-hidden p-6">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-6 p-5 rounded-3xl bg-slate-900/50 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl animate-bounce-slow">
          <Sparkles className="w-16 h-16 text-fuchsia-400" />
        </div>

        <h1 className="text-4xl font-black mb-2 tracking-tighter text-center text-white">
          {renderTitle()}
        </h1>
        <p className="text-slate-400 text-lg mb-8 text-center font-light">
          {renderSubtitle()}
        </p>

        <div className="w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative">
            
            {/* Back Button */}
            {step !== 'LOGIN' && step !== 'REGISTER_CREDENTIALS' && (
                <button 
                    onClick={() => setStep(prev => prev === 'REGISTER_PRIVACY' ? 'REGISTER_PROFILE' : 'REGISTER_CREDENTIALS')}
                    className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
            )}

            <form onSubmit={isSubmitStep ? handleSubmit : handleNextStep} className="space-y-4 mt-2">
            
            {/* STEP 1: EMAIL & PASSWORD */}
            {(step === 'LOGIN' || step === 'REGISTER_CREDENTIALS') && (
                <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Email</label>
                        <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-500" size={20} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold text-lg transition-all"
                            autoFocus
                        />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Password</label>
                        <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-500" size={20} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold text-lg transition-all"
                        />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: USERNAME */}
            {step === 'REGISTER_PROFILE' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300 pt-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Choose Username</label>
                        <div className="relative">
                        <User className="absolute left-4 top-4 text-slate-500" size={20} />
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@vibecheck"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-bold text-lg transition-all"
                            maxLength={20}
                            autoFocus
                        />
                        </div>
                        <p className="text-xs text-slate-500 ml-2">This will be your public display name.</p>
                    </div>
                </div>
            )}

            {/* STEP 3: PRIVACY & LOCATION */}
            {step === 'REGISTER_PRIVACY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pt-2">
                    
                    {/* Privacy Toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Visibility</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPrivate(false)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${!isPrivate ? 'bg-fuchsia-900/20 border-fuchsia-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                            >
                                <Globe size={24} />
                                <span className="font-bold text-sm">Public</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPrivate(true)}
                                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all relative ${isPrivate ? 'bg-emerald-900/20 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                            >
                                {isPrivate && <div className="absolute top-2 right-2 text-emerald-500"><Check size={16} /></div>}
                                <Lock size={24} />
                                <span className="font-bold text-sm">Private</span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 ml-2">
                            {isPrivate ? 'Default. Only friends see your posts.' : 'Everyone can see your posts in Global Feed.'}
                        </p>
                    </div>

                    {/* Location Toggle */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase">Location</label>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MapPin size={24} className={locationEnabled ? 'text-fuchsia-500' : 'text-slate-500'} />
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        {detectedCity || 'Location'}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {locationEnabled ? 'Location Enabled' : 'Show where you are from?'}
                                    </div>
                                </div>
                            </div>
                            {!locationEnabled && (
                                <button
                                    type="button"
                                    onClick={handleEnableLocation}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Enable
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1">
                   <div className="flex items-start gap-2 text-red-300 text-sm">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <span>{rateLimitCountdown > 0 ? `Please wait ${rateLimitCountdown}s before trying again.` : error}</span>
                   </div>

                   {errorCode === 'EMAIL_NOT_CONFIRMED' && (
                       <div className="text-xs text-slate-400 bg-slate-950/50 p-2 rounded border border-slate-800 mt-1">
                           <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                               <Wrench size={12} /> Developer Tip:
                           </div>
                           Turn off "Confirm email" in Supabase &gt; Auth &gt; Providers.
                       </div>
                   )}
                   
                   {errorCode === 'PROFILE_CREATION_FAILED' && (
                       <button 
                         onClick={() => window.location.reload()}
                         className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 py-1 px-2 rounded transition-colors text-left"
                       >
                          Click here to see the Database Repair SQL again.
                       </button>
                   )}

                    {errorCode === 'ALREADY_REGISTERED' && (
                       <button 
                         onClick={() => { setStep('LOGIN'); setError(''); setErrorCode(''); }}
                         className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 py-1.5 px-2 rounded transition-colors text-left font-bold flex items-center gap-2"
                       >
                          Switch to Login Screen <ArrowRight size={12} />
                       </button>
                   )}

                   {errorCode === 'INVALID_LOGIN' && (
                       <button 
                         onClick={() => { setStep('REGISTER_CREDENTIALS'); setError(''); setErrorCode(''); }}
                         className="text-xs bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 py-1.5 px-2 rounded transition-colors text-left font-bold flex items-center gap-2"
                       >
                          No account? Sign Up <ArrowRight size={12} />
                       </button>
                   )}
                </div>
            )}

            {/* MAIN ACTION BUTTON */}
            <button
                type="submit"
                disabled={isLoading || rateLimitCountdown > 0}
                className={`w-full relative flex items-center justify-center px-6 py-4 text-white transition-all duration-200 rounded-xl font-bold shadow-lg shadow-fuchsia-900/20 mt-4
                    ${(isLoading || rateLimitCountdown > 0) ? 'bg-slate-800 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98]'}
                `}
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : rateLimitCountdown > 0 ? (
                    <div className="flex items-center gap-2">
                        <Clock size={18} /> Wait {rateLimitCountdown}s
                    </div>
                ) : (
                    <>
                        {step === 'LOGIN' && (
                            <>Sign In <ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                        {step === 'REGISTER_CREDENTIALS' && (
                            <>Next Step <ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                        {step === 'REGISTER_PROFILE' && (
                            <>Next Step <ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                        {step === 'REGISTER_PRIVACY' && (
                            <>Finish & Join <Check className="ml-2 w-5 h-5" /></>
                        )}
                    </>
                )}
            </button>
            </form>
        </div>

        {/* FOOTER LINKS (Switch Modes) */}
        <div className="mt-6 text-center">
            {step === 'LOGIN' ? (
                <p className="text-slate-400">
                    Don't have an account?{' '}
                    <button 
                        onClick={() => { setStep('REGISTER_CREDENTIALS'); setError(''); setErrorCode(''); setRateLimitCountdown(0); }}
                        className="text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors"
                    >
                        Sign Up
                    </button>
                </p>
            ) : (
                <p className="text-slate-400">
                    Already have an account?{' '}
                    <button 
                        onClick={() => { setStep('LOGIN'); setError(''); setErrorCode(''); setRateLimitCountdown(0); }}
                        className="text-fuchsia-400 font-bold hover:text-fuchsia-300 transition-colors"
                    >
                        Log In
                    </button>
                </p>
            )}
        </div>

      </div>
    </div>
  );
};
