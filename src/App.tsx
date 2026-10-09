import React, { useState, useEffect } from 'react';
import { Terminal, Lock, ChevronRight, LogOut, CheckCircle, XCircle, Loader2, Trophy, X } from 'lucide-react';
import { supabase } from './lib/supabase';

interface TeamProgress {
  team_name: string;
  current_level: number;
  updated_at: string;
}

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

  // Leaderboard State
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<TeamProgress[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const { data, error } = await supabase
        .from('cipherquest_progress')
        .select('team_name, current_level, updated_at')
        .order('current_level', { ascending: false })
        .order('updated_at', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      setLeaderboard(data || []);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (showLeaderboard) {
      fetchLeaderboard();
    }
  }, [showLeaderboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const codeClean = operativeCode.trim().toUpperCase();
    
    try {
      // 1. Check if it's a valid registration
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

      // 2. Fetch or create progress
      const { data: progData, error: progError } = await supabase
        .from('cipherquest_progress')
        .select('*')
        .eq('operative_code', codeClean)
        .maybeSingle();

      if (progError && progError.code !== 'PGRST116') {
        throw progError;
      }

      if (progData) {
        setCurrentLevel(progData.current_level);
      } else {
        // First time logging in, create progress record
        await supabase
          .from('cipherquest_progress')
          .insert([{ 
            operative_code: codeClean, 
            team_name: regData.team_name || regData.teamName,
            current_level: 1 
          }]);
        setCurrentLevel(1);
      }

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
    // Right now, typing "test" passes the level.
    if (answer.trim().toLowerCase() === 'test') {
      setFeedback('success');
      
      const nextLevel = currentLevel + 1;
      
      try {
        // Save progress to Supabase
        await supabase
          .from('cipherquest_progress')
          .update({ 
            current_level: nextLevel,
            updated_at: new Date().toISOString()
          })
          .eq('operative_code', operativeCode.trim().toUpperCase());
          
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          setAnswer('');
          setFeedback('idle');
          setIsSubmitting(false);
        }, 1500);
      } catch (err) {
        console.error('Failed to save progress', err);
        setIsSubmitting(false);
      }
      
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

  // Helper to format date
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      
      {/* LEADERBOARD MODAL */}
      {showLeaderboard && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cipher-card border border-neutral-800 w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-2">
                <Trophy className="text-cipher-green w-5 h-5" />
                <h2 className="font-bold tracking-widest text-lg">GLOBAL RANKINGS</h2>
              </div>
              <button onClick={() => setShowLeaderboard(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1">
              {isLoadingLeaderboard ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cipher-green" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center p-12 text-cipher-muted font-mono">
                  NO TEAMS ON THE BOARD YET.
                </div>
              ) : (
                <table className="w-full text-left font-mono text-sm">
                  <thead className="bg-black/40 text-cipher-muted sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-normal">RANK</th>
                      <th className="px-6 py-3 font-normal">TEAM</th>
                      <th className="px-6 py-3 font-normal text-center">LEVEL</th>
                      <th className="px-6 py-3 font-normal text-right">LAST SOLVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, idx) => (
                      <tr key={idx} className="border-b border-neutral-800/50 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`${idx === 0 ? 'text-yellow-400 font-bold' : idx === 1 ? 'text-gray-300 font-bold' : idx === 2 ? 'text-amber-600 font-bold' : 'text-neutral-500'}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white">{team.team_name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-cipher-green">LVL {team.current_level}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-neutral-500">
                          {formatTime(team.updated_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-neutral-800 bg-cipher-dark/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="text-cipher-green w-6 h-6" />
            <span className="font-bold tracking-widest hidden sm:block">CIPHERQUEST</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 font-mono text-sm">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="text-neutral-300 hover:text-cipher-green transition-colors flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800"
            >
              <Trophy className="w-4 h-4" /> <span className="hidden sm:inline">LEADERBOARD</span>
            </button>
            <div className="text-cipher-muted hidden md:block border-l border-neutral-800 pl-6">
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
