import React, { useEffect, useRef, useCallback } from 'react';

interface ScoreBoardProps {
  scoreA: number;
  scoreB: number;
}

interface DigitProps {
  value: string;
}

// Single Digit Component that scrolls vertically
const Digit: React.FC<DigitProps> = ({ value }) => {
  const isNumber = !isNaN(parseInt(value));
  // Increased height to prevent clipping (previous 70px -> 90px)
  const heightClass = "h-[90px]";

  if (!isNumber) {
    return <div className={`${heightClass} flex items-center justify-center`}>{value}</div>;
  }

  const num = parseInt(value);

  return (
    // Increased width to 0.7em to accommodate thick font
    <div className={`${heightClass} w-[0.7em] relative overflow-hidden inline-block align-top`}>
      <div
        className="absolute left-0 top-0 w-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
        style={{ transform: `translateY(-${num * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div key={n} className={`${heightClass} flex items-center justify-center`}>
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ScoreCounterProps {
  value: number;
  colorClass: string;
}

const ScoreCounter: React.FC<ScoreCounterProps> = ({ value, colorClass }) => {
  const digits = value.toString().split('');
  
  return (
    <div className={`flex justify-center items-center tabular-nums leading-none font-black text-6xl tracking-tight ${colorClass}`}>
      {digits.map((digit, index) => (
        <Digit key={index} value={digit} />
      ))}
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ scoreA, scoreB }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevScoreARef = useRef(scoreA);
  const prevScoreBRef = useRef(scoreB);

  // Initialize AudioContext
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
  }, []);

  // Synthesize a "Coin Up" / "Score Point" sound
  const playScoreSound = useCallback((pitchMultiplier: number = 1) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
        const t = ctx.currentTime;
        
        // Oscillator 1: Main "Coin" Tone (Sine wave ramping up)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        
        osc1.type = 'sine';
        // Jump from High B to High E (Satisfying interval)
        osc1.frequency.setValueAtTime(987.77 * pitchMultiplier, t); 
        osc1.frequency.linearRampToValueAtTime(1318.51 * pitchMultiplier, t + 0.1);
        
        gain1.gain.setValueAtTime(0.1, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc1.start(t);
        osc1.stop(t + 0.4);

        // Oscillator 2: Sparkle/Shimmer (Triangle wave, higher pitch)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1975.53 * pitchMultiplier, t);
        
        gain2.gain.setValueAtTime(0.05, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.start(t);
        osc2.stop(t + 0.2);

    } catch (e) {
        console.error("Score sound failed", e);
    }
  }, []);

  // Detect Score Increase for A
  useEffect(() => {
    if (scoreA > prevScoreARef.current) {
        playScoreSound(1.0); // Standard Pitch
    }
    prevScoreARef.current = scoreA;
  }, [scoreA, playScoreSound]);

  // Detect Score Increase for B
  useEffect(() => {
    if (scoreB > prevScoreBRef.current) {
        playScoreSound(1.12); // Slightly Higher Pitch (Major 2nd up) for variety
    }
    prevScoreBRef.current = scoreB;
  }, [scoreB, playScoreSound]);

  return (
    <div className="w-[1596px] flex items-center justify-center mb-6">
       {/* Scoreboard Container */}
       <div className="flex w-[680px] h-[100px] overflow-hidden">
          
          {/* Team A - Kouga */}
          <div className="flex-1 bg-teal-400 flex items-center justify-center px-2 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
             <span className="text-5xl font-black text-white uppercase tracking-tight drop-shadow-sm whitespace-nowrap">
                코우가
             </span>
          </div>

          {/* Center Score Display - Width increased from 200px to 240px */}
          <div className="bg-slate-900 w-[240px] flex items-center justify-center relative z-10">
              <div className="flex items-center gap-1">
                 {/* Increased width for score container from 60px to 80px */}
                 <div className="w-[80px] flex justify-center">
                    <ScoreCounter value={scoreA} colorClass="text-teal-400" />
                 </div>
                 
                 <span className="text-slate-600 font-black text-4xl pb-2">-</span>
                 
                 {/* Increased width for score container from 60px to 80px */}
                 <div className="w-[80px] flex justify-center">
                    <ScoreCounter value={scoreB} colorClass="text-orange-400" />
                 </div>
              </div>
          </div>

          {/* Team B - Pickles */}
          <div className="flex-1 bg-orange-400 flex items-center justify-center px-2 relative">
             <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
             <span className="text-5xl font-black text-white uppercase tracking-tight drop-shadow-sm whitespace-nowrap">
                피클즈
             </span>
          </div>

       </div>
    </div>
  );
};