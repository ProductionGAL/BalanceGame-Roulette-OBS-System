import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState, RouletteConfig, RouletteItem } from '../types';

interface RouletteDisplayProps {
  items: RouletteItem[];
  gameState: GameState;
  winnerId: string | null;
  config: RouletteConfig;
  onWin: (item: RouletteItem) => void;
  setGameState: (state: GameState) => void;
}

// Channel to notify the control page when a winner is determined
const winChannel = new BroadcastChannel('roulette-win');

export const RouletteDisplay: React.FC<RouletteDisplayProps> = ({
  items,
  gameState,
  winnerId,
  config,
  onWin,
  setGameState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const speedRef = useRef<number>(0);

  // Audio Context Ref (Synthesis)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickIndexRef = useRef<number>(-1);
  const lastTickTimeRef = useRef<number>(0); // Time-based throttle for tick sounds
  const snapTargetRef = useRef<number | null>(null); // Lock snap target during ease phase
  const animationWonRef = useRef<boolean>(false); // Flag: animation set WON, skip useEffect reposition

  // === Refs to decouple animation loop from React re-renders ===
  // These refs hold the latest values so the animation loop can read them
  // without being a dependency of useCallback/useEffect.
  const gameStateRef = useRef<GameState>(gameState);
  const configRef = useRef<RouletteConfig>(config);
  const onWinRef = useRef(onWin);
  const setGameStateRef = useRef(setGameState);
  const displayItemsRef = useRef<RouletteItem[]>([]);
  const totalOriginalHeightRef = useRef<number>(0);

  // Keep refs in sync with latest props
  gameStateRef.current = gameState;
  configRef.current = config;
  onWinRef.current = onWin;
  setGameStateRef.current = setGameState;

  const displayItems = useMemo(() => [...items, ...items, ...items], [items]);
  displayItemsRef.current = displayItems;

  const totalOriginalHeight = items.length * config.itemHeight;
  totalOriginalHeightRef.current = totalOriginalHeight;

  // Calculate blur height for top/bottom areas (non-center)
  const blurHeight = ((config.visibleItems - 1) / 2) * config.itemHeight;

  // Initialize AudioContext
  useEffect(() => {
    // Create AudioContext only once
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }
  }, []);

  // Function to synthesize a mechanical tick sound
  const playTickSound = useCallback(() => {
    if (!audioCtxRef.current) return;

    const ctx = audioCtxRef.current;

    // Auto-resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => { });
    }

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'triangle'; // Sharp sound
      // Start high and drop quickly for a "tick" effect
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      // Short envelope
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  // Function to synthesize a victory fanfare (Arpeggio)
  const playWinSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume().catch(() => { });

    const now = ctx.currentTime;
    // C Major Arpeggio: C5, E5, G5, C6 (High pitched for excitement)
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'triangle'; // Pleasant game-like sound
        oscillator.frequency.setValueAtTime(freq, now + (i * 0.1)); // 100ms interval

        // Envelope
        gainNode.gain.setValueAtTime(0, now + (i * 0.1));
        gainNode.gain.linearRampToValueAtTime(0.2, now + (i * 0.1) + 0.05);

        // Last note sustains longer
        const duration = i === notes.length - 1 ? 0.8 : 0.2;
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(now + (i * 0.1));
        oscillator.stop(now + (i * 0.1) + duration + 0.1);
      } catch (e) {
        console.error("Fanfare play failed", e);
      }
    });
  }, []);

  // Animation Loop — reads all changing values from refs to stay stable across re-renders
  const animate = useCallback(() => {
    const gs = gameStateRef.current;
    const cfg = configRef.current;
    const totalH = totalOriginalHeightRef.current;

    if (gs === GameState.IDLE || gs === GameState.WON) return;

    if (gs === GameState.SPINNING) {
      if (speedRef.current < cfg.spinSpeed) {
        speedRef.current += 0.5;
      }
    } else if (gs === GameState.STOPPING) {
      speedRef.current *= cfg.friction;
    }

    offsetRef.current += speedRef.current;

    // Wrap around logic — only during free-running deceleration, NOT during snap ease
    if (snapTargetRef.current === null) {
      if (offsetRef.current >= totalH) {
        offsetRef.current -= totalH;
      }
      if (offsetRef.current < 0) {
        offsetRef.current += totalH;
      }
    }

    // Sound Logic: Calculate which item index is currently passing the center
    const currentItemIndex = Math.floor(offsetRef.current / cfg.itemHeight);

    // Play sound if index changed — with time-based throttle to prevent audio overload
    const now = performance.now();
    const minTickInterval = 80; // ms — minimum gap between ticks
    if (currentItemIndex !== lastTickIndexRef.current && speedRef.current > 2 && (now - lastTickTimeRef.current) > minTickInterval) {
      playTickSound();
      lastTickIndexRef.current = currentItemIndex;
      lastTickTimeRef.current = now;
    }

    // --- Smooth stopping logic ---
    if (gs === GameState.STOPPING) {
      // Phase 1: When speed is still noticeable, just let friction do its work (already applied above).
      // Phase 2: When speed drops low enough, determine target snap and ease into it smoothly.
      if (speedRef.current < 5) {
        const viewportCenter = (cfg.visibleItems * cfg.itemHeight) / 2;

        // Lock the snap target on first entry — don't recalculate every frame
        if (snapTargetRef.current === null) {
          const currentScrollCenter = offsetRef.current + viewportCenter;
          const exactIndex = (currentScrollCenter - (cfg.itemHeight / 2)) / cfg.itemHeight;
          let snapIndex = Math.round(exactIndex);

          // Clamp to valid displayItems range (0 to 3*itemCount - 1)
          const maxIndex = displayItemsRef.current.length - 1;
          snapIndex = Math.max(0, Math.min(snapIndex, maxIndex));

          // If it's a played item, search forward for the next unplayed one (same copy)
          const items = displayItemsRef.current;
          for (let i = 0; i < items.length; i++) {
            const idx = (snapIndex + i) % items.length;
            if (items[idx] && !items[idx].played) {
              snapIndex = idx;
              break;
            }
          }
          snapTargetRef.current = snapIndex;
        }

        const clampedSnapIndex = snapTargetRef.current;
        const targetOffset = (clampedSnapIndex * cfg.itemHeight) - viewportCenter + (cfg.itemHeight / 2);
        const diff = targetOffset - offsetRef.current;

        // Override friction-based movement with spring-like ease
        speedRef.current = 0;

        if (Math.abs(diff) < 0.5) {
          // Close enough — snap exactly and declare winner
          offsetRef.current = targetOffset;
          snapTargetRef.current = null; // Reset for next round
          animationWonRef.current = true; // Flag to prevent useEffect repositioning

          const actualWinner = displayItemsRef.current[clampedSnapIndex];
          setGameStateRef.current(GameState.WON);
          playWinSound();
          onWinRef.current(actualWinner);
          winChannel.postMessage({ winnerId: actualWinner.id });
          return;
        } else {
          // Smooth spring-like ease: move 5% of remaining distance each frame
          offsetRef.current += diff * 0.05;
        }
      }
    }

    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [playTickSound, playWinSound]); // Only stable audio callbacks

  // Start/stop animation based on gameState — depends only on gameState (not animate)
  useEffect(() => {
    if (gameState === GameState.SPINNING) {
      // Ensure audio context is ready when game starts
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      speedRef.current = 0;
      snapTargetRef.current = null; // Reset snap target for fresh calculation
      requestRef.current = requestAnimationFrame(animate);
    } else if (gameState === GameState.STOPPING) {
      // Only start a new loop if one isn't already running
      // (the SPINNING loop transitions into STOPPING naturally via the ref)
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  useEffect(() => {
    if (!containerRef.current || items.length === 0) return;

    // Don't force-set position during SPINNING or STOPPING — the animation loop handles movement
    if (gameState === GameState.SPINNING || gameState === GameState.STOPPING) return;

    const setPosition = (index: number) => {
      const viewportCenter = (config.visibleItems * config.itemHeight) / 2;
      const targetOffset = (index * config.itemHeight) - viewportCenter + (config.itemHeight / 2);

      offsetRef.current = targetOffset;
      containerRef.current!.style.transform = `translateY(-${targetOffset}px)`;

      // Update tick index to prevent initial sound
      lastTickIndexRef.current = Math.floor(targetOffset / config.itemHeight);
    };

    if (gameState === GameState.WON && winnerId) {
      // Skip repositioning if the animation loop already set the final offset
      if (animationWonRef.current) {
        animationWonRef.current = false;
        return;
      }
      const winnerIndex = items.findIndex(item => item.id === winnerId);
      if (winnerIndex !== -1) {
        setPosition(winnerIndex + items.length);
      } else {
        setPosition(items.length);
      }
    } else if (gameState === GameState.IDLE) {
      // Reset to first item of middle block for stability during editing
      setPosition(items.length);
    }
  }, [items, gameState, winnerId, config, items.length]);

  const getTextSizeClass = (length: number) => {
    if (length <= 15) return 'text-4xl';
    if (length <= 25) return 'text-3xl';
    return 'text-2xl';
  };

  return (
    <>
      <style>{`
        @keyframes shine-move {
          0% { left: -100%; opacity: 0; }
          10% { opacity: 0.5; }
          40% { left: 200%; opacity: 0; }
          100% { left: 200%; opacity: 0; }
        }
        .shine-effect {
          position: absolute;
          top: 0;
          left: -100%;
          width: 80%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg);
          animation: shine-move 4s infinite linear;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>
      <div className="flex flex-col bg-white overflow-hidden" style={{ width: '1596px' }}>
        {/* Header Section for A/B Labels - Reduced Height 60px -> 45px */}
        <div className="flex w-full h-[45px] shrink-0">
          <div className="flex-1 bg-teal-400 flex items-center justify-center relative overflow-hidden">
            <span className="font-black text-3xl text-white tracking-widest">A</span>
          </div>
          <div className="flex-1 bg-orange-500 flex items-center justify-center relative overflow-hidden">
            <span className="font-black text-3xl text-white tracking-widest">B</span>
          </div>
        </div>

        {/* Roulette Viewport */}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            height: `${config.visibleItems * config.itemHeight}px`,
            width: '100%'
          }}
        >
          {/* STATIC LAYER: Colored Background for the Center Highlight Only */}
          <div
            className="absolute w-full flex pointer-events-none"
            style={{
              height: `${config.itemHeight}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 0
            }}
          >
            <div className="flex-1 h-full bg-teal-400/15" /> {/* A side highlight (Mint) */}
            <div className="w-[80px] h-full bg-slate-900" /> {/* Center column background */}
            <div className="flex-1 h-full bg-orange-500/15" /> {/* B side highlight (Orange) */}
          </div>

          {/* STATIC LAYER: Blur Overlays for Non-Center Items (Split to avoid center stripe) */}
          {blurHeight > 0 && (
            <>
              {/* Top Blur Area */}
              <div
                className="absolute top-0 left-0 w-full flex pointer-events-none z-[25]"
                style={{ height: `${blurHeight}px` }}
              >
                <div className="flex-1 h-full" style={{
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)'
                }} />
                <div className="w-[80px] h-full" /> {/* No Blur on Center Stripe */}
                <div className="flex-1 h-full" style={{
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)'
                }} />
              </div>

              {/* Bottom Blur Area */}
              <div
                className="absolute bottom-0 left-0 w-full flex pointer-events-none z-[25]"
                style={{ height: `${blurHeight}px` }}
              >
                <div className="flex-1 h-full" style={{
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  background: 'linear-gradient(to top, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)'
                }} />
                <div className="w-[80px] h-full" /> {/* No Blur on Center Stripe */}
                <div className="flex-1 h-full" style={{
                  backdropFilter: 'blur(3px)',
                  WebkitBackdropFilter: 'blur(3px)',
                  background: 'linear-gradient(to top, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)'
                }} />
              </div>
            </>
          )}

          {/* STATIC LAYER: VS Badge (Topmost) - No Borders - Reduced Size */}
          <div
            className="absolute w-full pointer-events-none flex items-center justify-center"
            style={{
              height: `${config.itemHeight}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 30
            }}
          >
            {/* Center VS Badge - Reduced from w-20 to w-16 (64px) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 text-yellow-400 flex items-center justify-center shadow-none">
              <span className="text-2xl font-black">VS</span>
            </div>
          </div>

          {/* DYNAMIC LAYER: Moving Content */}
          <div ref={containerRef} className="w-full will-change-transform relative z-10">
            {displayItems.map((item, index) => {
              const parts = item.text.split(' VS ');
              const leftText = parts[0] || item.text;
              const rightText = parts[1] || '';
              // Create a unique delay for each item's shine
              const shineDelay = `${(index * 0.7) % 3}s`;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className="w-full relative flex items-center group bg-transparent"
                  style={{
                    height: `${config.itemHeight}px`,
                  }}
                >
                  {/* Independent Shine Effect */}
                  <div
                    className="shine-effect"
                    style={{
                      animationDelay: shineDelay
                    }}
                  />

                  <div className="w-full h-full grid grid-cols-[1fr_80px_1fr] items-center relative z-20">

                    {/* Left Option (A) */}
                    <div className="px-6 h-full flex items-center justify-center text-center">
                      <span className={`font-black text-slate-900 leading-none break-keep ${getTextSizeClass(leftText.length)}`}>
                        {leftText}
                      </span>
                    </div>

                    {/* Solid Black Stripe for VS badge area */}
                    <div className="h-full bg-slate-900 w-full" />

                    {/* Right Option (B) */}
                    <div className="px-6 h-full flex items-center justify-center text-center">
                      <span className={`font-black text-slate-900 leading-none break-keep ${getTextSizeClass(rightText.length)}`}>
                        {rightText}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};