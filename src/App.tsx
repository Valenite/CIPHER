import React, { useState, useEffect } from 'react';
import { Terminal, Lock, Unlock, ChevronRight, LogOut, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from './lib/supabase';

// --- MOCK DATA (To be replaced with real questions later) ---
const CHALLENGES = [
  // CRYPTIC
  { id: 'cryptic-1', category: 'cryptic', level: 1, title: 'Cryptic Stage 1', description: 'Solve the first riddle to begin.', answer: 'test1' },
  { id: 'cryptic-2', category: 'cryptic', level: 2, title: 'Cryptic Stage 2', description: 'The second clue is hidden here.', answer: 'test2' },
  { id: 'cryptic-3', category: 'cryptic', level: 3, title: 'Cryptic Stage 3', description: 'Deepening the mystery.', answer: 'test3' },
  { id: 'cryptic-4', category: 'cryptic', level: 4, title: 'Cryptic Stage 4', description: 'Almost at the final cryptic hurdle.', answer: 'test4' },
  { id: 'cryptic-5', category: 'cryptic', level: 5, title: 'Cryptic Stage 5', description: 'The final cryptic gate. Unlocks the CTF.', answer: 'test5' },
  
  // CTF
  { id: 'ctf-1', category: 'ctf', title: 'Web Exploitation', description: 'Find the hidden flag in the source.', answer: 'flag1' },
  { id: 'ctf-2', category: 'ctf', title: 'Cryptography', description: 'Decrypt this base64 string.', answer: 'flag2' },
  { id: 'ctf-3', category: 'ctf', title: 'OSINT', description: 'Where was this photo taken?', answer: 'flag3' },
];
// ------------------------------------------------------------

export default function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [operativeCode, setOperativeCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Game State
  // For now, storing solved challenges in local state (we can move this to Supabase later)
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);
  
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived Game State
  const crypticLevel = CHALLENGES.filter(c => c.category === 'cryptic' && solvedIds.includes(c.id)).length + 1;
  const isCtfUnlocked = crypticLevel > 5; // Unlocks after Cryptic 5 is solved

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    const codeClean = operativeCode.trim().toUpperCase();
    
    try {
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
      
      // For now, load local storage progress to simulate saving
      const saved = localStorage.getItem(`progress_${codeClean}`);
      if (saved) setSolvedIds(JSON.parse(saved));
      
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error(err);
      setLoginError('Connection error. Try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setOperativeCode('');
    setTeamName('');
    setSolvedIds([]);
    setSelectedChallenge(null);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !selectedChallenge) return;
    
    setIsSubmitting(true);
    
    // Placeholder logic - checks against the mock data array
    if (answer.trim().toLowerCase() === selectedChallenge.answer) {
      setFeedback('success');
      
      setTimeout(() => {
        const newSolved = [...solvedIds, selectedChallenge.id];
        setSolvedIds(newSolved);
        // Save locally for now
        localStorage.setItem(`progress_${operativeCode.trim().toUpperCase()}`, JSON.stringify(newSolved));
        
        setAnswer('');
        setFeedback('idle');
        setIsSubmitting(false);
        setSelectedChallenge(null); // Go back to dashboard
      }, 1500);
      
    } else {
      setFeedback('error');
      setTimeout(() => {
        setFeedback('idle');
        setIsSubmitting(false);
      }, 1500);
    }
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
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        
        {/* If a challenge is selected, show the puzzle view */}
        {selectedChallenge ? (
          <div className="max-w-3xl mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => { setSelectedChallenge(null); setAnswer(''); }}
              className="self-start flex items-center gap-2 text-cipher-muted hover:text-white transition-colors mb-8 font-mono text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> RETURN TO DASHBOARD
            </button>

            <div className="w-full mb-8 flex items-center justify-between">
              <div className="font-mono text-sm tracking-widest text-cipher-green border border-cipher-green/30 bg-cipher-green/10 px-4 py-1 rounded-full uppercase">
                {selectedChallenge.category} - {selectedChallenge.title}
              </div>
            </div>

            <div className="w-full bg-cipher-card border border-neutral-800 p-8 md:p-12 rounded-lg shadow-2xl mb-8 min-h-[300px] flex flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-bold mb-6">{selectedChallenge.title}</h2>
              <div className="text-neutral-300 leading-relaxed max-w-xl space-y-4">
                <p>{selectedChallenge.description}</p>
                <p className="font-mono text-sm text-neutral-500 mt-8">
                  (Type "{selectedChallenge.answer}" to pass this test level)
                </p>
              </div>
            </div>

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
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {feedback === 'success' && <CheckCircle className="w-6 h-6 text-cipher-green animate-pulse" />}
                {feedback === 'error' && <XCircle className="w-6 h-6 text-cipher-red animate-pulse" />}
              </div>
            </form>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div className="space-y-12 animate-in fade-in duration-300">
            
            {/* CRYPTIC SECTION */}
            <section>
              <div className="flex items-center gap-4 mb-6 border-b border-neutral-800 pb-2">
                <h2 className="text-xl font-bold tracking-widest text-white">CRYPTIC STAGES</h2>
                <span className="font-mono text-xs text-cipher-green border border-cipher-green/30 bg-cipher-green/10 px-2 py-0.5 rounded">
                  STAGE {crypticLevel > 5 ? 'COMPLETED' : crypticLevel}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CHALLENGES.filter(c => c.category === 'cryptic').map((chal) => {
                  const isSolved = solvedIds.includes(chal.id);
                  const isLocked = chal.level! > crypticLevel;
                  
                  return (
                    <div 
                      key={chal.id}
                      onClick={() => !isLocked && !isSolved && setSelectedChallenge(chal)}
                      className={`relative p-6 rounded-lg border flex flex-col items-start transition-all ${
                        isSolved ? 'bg-cipher-green/5 border-cipher-green/30 cursor-default' : 
                        isLocked ? 'bg-black/50 border-neutral-900 cursor-not-allowed opacity-60' : 
                        'bg-cipher-card border-neutral-700 hover:border-cipher-green hover:shadow-[0_0_15px_rgba(0,255,65,0.1)] cursor-pointer'
                      }`}
                    >
                      <div className="w-full flex justify-between items-start mb-4">
                        <span className={`font-mono text-sm ${isSolved ? 'text-cipher-green' : isLocked ? 'text-neutral-600' : 'text-white'}`}>
                          {chal.title}
                        </span>
                        {isSolved ? <CheckCircle className="w-5 h-5 text-cipher-green" /> : 
                         isLocked ? <Lock className="w-5 h-5 text-neutral-600" /> : 
                         <Unlock className="w-5 h-5 text-neutral-400" />}
                      </div>
                      <div className="text-sm text-neutral-500 font-mono mt-auto">
                        {isSolved ? 'STATUS: SOLVED' : isLocked ? 'STATUS: CLASSIFIED' : 'STATUS: READY'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* CTF SECTION */}
            <section>
              <div className="flex items-center gap-4 mb-6 border-b border-neutral-800 pb-2">
                <h2 className="text-xl font-bold tracking-widest text-white">CAPTURE THE FLAG</h2>
                {!isCtfUnlocked && (
                  <span className="font-mono text-xs text-cipher-red border border-cipher-red/30 bg-cipher-red/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CHALLENGES.filter(c => c.category === 'ctf').map((chal) => {
                  const isSolved = solvedIds.includes(chal.id);
                  const isLocked = !isCtfUnlocked;
                  
                  return (
                    <div 
                      key={chal.id}
                      onClick={() => !isLocked && !isSolved && setSelectedChallenge(chal)}
                      className={`relative p-6 rounded-lg border flex flex-col items-start transition-all ${
                        isSolved ? 'bg-cipher-green/5 border-cipher-green/30 cursor-default' : 
                        isLocked ? 'bg-black/50 border-neutral-900 cursor-not-allowed opacity-60' : 
                        'bg-cipher-card border-neutral-700 hover:border-cipher-green hover:shadow-[0_0_15px_rgba(0,255,65,0.1)] cursor-pointer'
                      }`}
                    >
                      <div className="w-full flex justify-between items-start mb-4">
                        <span className={`font-mono text-sm ${isSolved ? 'text-cipher-green' : isLocked ? 'text-neutral-600' : 'text-white'}`}>
                          {chal.title}
                        </span>
                        {isSolved ? <CheckCircle className="w-5 h-5 text-cipher-green" /> : 
                         isLocked ? <Lock className="w-5 h-5 text-neutral-600" /> : 
                         <Unlock className="w-5 h-5 text-neutral-400" />}
                      </div>
                      <div className="text-sm text-neutral-500 font-mono mt-auto">
                        {isLocked ? 'REQUIRES CRYPTIC 5' : isSolved ? 'STATUS: SOLVED' : 'STATUS: READY'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            
          </div>
        )}

      </main>
    </div>
  );
}
