import React, { useState } from 'react';
import { Terminal, Lock, ChevronRight, LogOut, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [operativeCode, setOperativeCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [currentLevel, setCurrentLevel] = useState(1);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const codeClean = operativeCode.trim().toUpperCase();
    
    try {
      // ONLY check if it's a valid registration (No progress tracking for now)
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .select('*')
        .ilike('id', codeClean)
        .maybeSingle();

      if (regError) throw regError;
      
      if (!regData) {
        setLoginError('Operative Code not found.');
        setIsLoggingIn(false);
        return;
      }

      setTeamName(regData.team_name || regData.teamName || 'Unknown Team');
      setCurrentLevel(1); // Start at level 1 locally
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error(err);
      setLoginError('Connection error. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Placeholder logic - later this will check against real answers
    // Right now, typing "test" passes the level locally.
    if (answer.trim().toLowerCase() === 'test') {
      setFeedback('success');
      
      setTimeout(() => {
        setCurrentLevel(currentLevel + 1);
        setAnswer('');
        setFeedback('idle');
        setIsSubmitting(false);
      }, 1500);
      
    } else {
      setFeedback('error');
      setTimeout(() => {
        setFeedback('idle');
        setIsSubmitting(false);
      }, 1500);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setOperativeCode('');
    setTeamName('');
    setCurrentLevel(1);
    setAnswer('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-cipher-card p-8 rounded-lg border border-neutral-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="text-cipher-green w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-widest text-white">CIPHERQUEST</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-mono text-cipher-muted mb-2 uppercase tracking-wider">
                Operative Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input 
                  type="text"
                  value={operativeCode}
                  onChange={(e) => setOperativeCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-neutral-800 rounded px-10 py-3 text-white font-mono uppercase tracking-widest focus:border-cipher-green transition-colors"
                  placeholder="GSZ-XXXX-XXXX"
                  required
                  disabled={isLoggingIn}
                />
              </div>
              {loginError && <p className="text-cipher-red text-sm mt-2 font-mono">{loginError}</p>}
            </div>
            
            <button 
              type="submit"
              disabled={isLoggingIn || !operativeCode}
              className="w-full bg-white text-black font-bold py-3 px-4 rounded flex items-center justify-center gap-2 hover:bg-cipher-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : 'INITIALIZE PROTOCOL'} 
              {!isLoggingIn && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-cipher-dark/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="text-cipher-green w-6 h-6" />
            <span className="font-bold tracking-widest hidden sm:block">CIPHERQUEST</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-sm">
            <div className="text-cipher-muted hidden md:block">
              TEAM: <span className="text-white">{teamName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 ml-2"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">EXIT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Play Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 flex flex-col items-center">
        
        {/* Level Indicator */}
        <div className="w-full mb-8 flex items-center justify-between">
          <div className="font-mono text-sm tracking-widest text-cipher-green border border-cipher-green/30 bg-cipher-green/10 px-4 py-1 rounded-full">
            LEVEL {currentLevel}
          </div>
        </div>

        {/* Puzzle Box */}
        <div className="w-full bg-cipher-card border border-neutral-800 p-8 md:p-12 rounded-lg shadow-2xl mb-8 min-h-[300px] flex flex-col items-center justify-center text-center">
          
          <h2 className="text-2xl font-bold mb-6">Placeholder Question Title</h2>
          
          <div className="text-neutral-300 leading-relaxed max-w-xl space-y-4">
            <p>This is where the cryptic hunt puzzle content will go.</p>
            <p>When you provide the questions, I will make this dynamically change based on `currentLevel`.</p>
            <p className="font-mono text-sm text-neutral-500 mt-8">
              "Type 'test' to pass this placeholder level."
            </p>
          </div>

        </div>

        {/* Answer Input */}
        <form onSubmit={handleAnswerSubmit} className="w-full max-w-lg relative group">
          <input 
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            className={`w-full bg-black border-2 rounded px-6 py-4 text-white font-mono text-center tracking-widest text-lg transition-colors ${
              feedback === 'success' ? 'border-cipher-green text-cipher-green' :
              feedback === 'error' ? 'border-cipher-red text-cipher-red' :
              'border-neutral-800 focus:border-white'
            }`}
            placeholder="ENTER FLAG..."
          />
          
          {/* Feedback Icon overlay */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {feedback === 'success' && <CheckCircle className="w-6 h-6 text-cipher-green animate-pulse" />}
            {feedback === 'error' && <XCircle className="w-6 h-6 text-cipher-red animate-pulse" />}
          </div>
        </form>

      </main>
    </div>
  );
}
