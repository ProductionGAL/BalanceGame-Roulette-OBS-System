import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GameState, RouletteItem } from '../types';
import { INITIAL_ITEMS } from '../constants';
import { ControlPanel } from '../components/ControlPanel';
import { ScoreControls } from '../components/ScoreControls';
import { Play, Square, RotateCcw, Monitor, Tv } from 'lucide-react';
import { useBroadcastSender, RouletteSyncState } from '../hooks/useBroadcast';

const ControlPage: React.FC = () => {
    const [items, setItems] = useState<RouletteItem[]>(INITIAL_ITEMS);
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
    const [scores, setScores] = useState({ A: 0, B: 0 });

    // Broadcast state to Display page
    const syncState: RouletteSyncState = useMemo(() => ({
        items,
        gameState,
        lastWinnerId,
        scores,
    }), [items, gameState, lastWinnerId, scores]);

    useBroadcastSender(syncState);

    const playableItemCount = items.filter(item => !item.played).length;

    const handleStart = () => {
        if (playableItemCount < 3) {
            alert("최소 3개 이상의 항목이 필요합니다.");
            return;
        }
        // Don't clear lastWinnerId here — keep the previous winner in the roulette list
        // to prevent a visual jump. It will be naturally replaced when the next winner lands.
        setGameState(GameState.SPINNING);
    };

    const handleStop = () => {
        if (gameState === GameState.SPINNING) {
            setGameState(GameState.STOPPING);
        }
    };

    // Listen for WIN state from display page's animation
    useEffect(() => {
        const channel = new BroadcastChannel('roulette-win');
        channel.onmessage = (event) => {
            const { winnerId } = event.data;
            if (winnerId) {
                setLastWinnerId(winnerId);
                setItems(prev => prev.map(i =>
                    i.id === winnerId ? { ...i, played: true } : i
                ));
                setGameState(GameState.WON);
            }
        };
        return () => channel.close();
    }, []);

    const handleResetAll = () => {
        setItems(prev => prev.map(i => ({ ...i, played: false })));
        setLastWinnerId(null);
        setGameState(GameState.IDLE);
    };

    // Score Handlers
    const handleScoreChange = (side: 'A' | 'B', delta: number) => {
        setScores(prev => ({
            ...prev,
            [side]: Math.max(0, prev[side] + delta)
        }));
    };

    const handleResetScores = () => {
        setScores({ A: 0, B: 0 });
    };

    const handleOpenDisplay = () => {
        window.open('/', 'roulette-display', 'width=1700,height=900');
    };

    const handleOpenTopic = () => {
        window.open('/topic', 'roulette-topic', 'width=1200,height=700');
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center p-6 font-sans">
            {/* Header */}
            <div className="w-full max-w-4xl mb-6">
                <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-widest">🎰 Roulette Control</h1>
                        <p className="text-slate-400 text-xs mt-1">디스플레이 페이지를 별도 창/OBS에서 열어주세요</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleOpenTopic}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 font-bold text-sm flex items-center gap-2 transition-colors"
                        >
                            <Tv size={16} /> 주제 표시
                        </button>
                        <button
                            onClick={handleOpenDisplay}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-bold text-sm flex items-center gap-2 transition-colors"
                        >
                            <Monitor size={16} /> 디스플레이 열기
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Controls */}
            <div className="w-full max-w-4xl flex flex-col gap-4">

                {/* Game State & Score Info */}
                <div className="bg-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 text-xs font-black uppercase tracking-wider ${gameState === GameState.IDLE ? 'bg-slate-200 text-slate-600' :
                            gameState === GameState.SPINNING ? 'bg-green-100 text-green-700 animate-pulse' :
                                gameState === GameState.STOPPING ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {gameState}
                        </div>
                        <span className="text-slate-400 text-sm font-bold">{playableItemCount}개 남음</span>
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-teal-500 font-black">코우가</span>
                            <span className="bg-slate-900 text-teal-400 px-3 py-1 font-black text-lg tabular-nums">{scores.A}</span>
                        </div>
                        <span className="text-slate-300 font-black">-</span>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-orange-400 px-3 py-1 font-black text-lg tabular-nums">{scores.B}</span>
                            <span className="text-orange-500 font-black">피클즈</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    {gameState === GameState.IDLE || gameState === GameState.WON ? (
                        <>
                            <button
                                onClick={handleStart}
                                disabled={playableItemCount < 3}
                                className="flex-1 py-5 bg-slate-900 text-white text-xl font-black hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                <Play fill="currentColor" size={24} /> START
                            </button>

                            <button
                                onClick={handleResetAll}
                                className="py-5 px-8 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider border border-slate-200"
                                title="Reset All"
                            >
                                <RotateCcw size={16} /> RESET
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleStop}
                            disabled={gameState === GameState.STOPPING}
                            className="flex-1 py-5 bg-rose-500 text-white text-xl font-black hover:bg-rose-600 transition-all disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest"
                        >
                            <Square fill="currentColor" size={24} /> STOP
                        </button>
                    )}
                </div>

                {/* Score Controls */}
                <ScoreControls
                    onIncrementA={() => handleScoreChange('A', 1)}
                    onDecrementA={() => handleScoreChange('A', -1)}
                    onIncrementB={() => handleScoreChange('B', 1)}
                    onDecrementB={() => handleScoreChange('B', -1)}
                    onReset={handleResetScores}
                />

                {/* Match List / Control Panel */}
                <ControlPanel
                    items={items}
                    setItems={setItems}
                    disabled={gameState !== GameState.IDLE && gameState !== GameState.WON}
                />

            </div>
        </div>
    );
};

export default ControlPage;
