import React, { useState, useCallback } from 'react';
import { GameState, RouletteItem } from '../types';
import { INITIAL_ITEMS } from '../constants';
import { useBroadcastReceiver, RouletteSyncState } from '../hooks/useBroadcast';

const TopicPage: React.FC = () => {
    const [items, setItems] = useState<RouletteItem[]>(INITIAL_ITEMS);
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    // Receive state from Control page
    const handleStateReceived = useCallback((state: RouletteSyncState) => {
        setItems(state.items);
        setGameState(state.gameState);
        setLastWinnerId(state.lastWinnerId);
        if (!connected) setConnected(true);
    }, [connected]);

    useBroadcastReceiver(handleStateReceived);

    // Find the winning item
    const winnerItem = lastWinnerId
        ? items.find(item => item.id === lastWinnerId)
        : null;

    // Split the VS text
    const parts = winnerItem?.text.split(' VS ') || [];
    const leftText = parts[0] || '';
    const rightText = parts[1] || '';

    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none"
            style={{ fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>

            {/* Spinning State */}
            {(gameState === GameState.SPINNING || gameState === GameState.STOPPING) && (
                <div className="flex flex-col items-center gap-6 animate-pulse">
                    <div style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>🎰</div>
                    <div className="text-white/60 font-black tracking-[0.3em] uppercase"
                        style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                        주제 선정 중...
                    </div>
                </div>
            )}

            {/* Winner Display */}
            {gameState === GameState.WON && winnerItem && (
                <div className="flex flex-col items-center w-full h-full p-[3vh_3vw] animate-fadeIn">
                    {/* Topic Badge */}
                    <div className="mb-[3vh] px-6 py-2 border-2 border-white/20 text-white/40 font-bold tracking-[0.2em] uppercase"
                        style={{ fontSize: 'clamp(0.7rem, 1.5vw, 1rem)' }}>
                        선정된 주제
                    </div>

                    {/* Main Topic Area — fills remaining space */}
                    <div className="flex-1 flex items-center justify-center w-full"
                        style={{ minHeight: 0 }}>
                        <div className="flex items-center justify-center w-full h-full"
                            style={{ gap: 'clamp(1rem, 3vw, 3rem)' }}>

                            {/* Option A */}
                            <div className="flex-1 flex items-center justify-end h-full overflow-hidden">
                                <p className="text-white font-black leading-[1.15] text-right break-keep m-0"
                                    style={{
                                        fontSize: 'clamp(1.5rem, 6vw, 7rem)',
                                        wordBreak: 'keep-all',
                                        overflowWrap: 'break-word',
                                    }}>
                                    {leftText}
                                </p>
                            </div>

                            {/* VS Badge */}
                            <div className="shrink-0 bg-yellow-400 flex items-center justify-center"
                                style={{
                                    width: 'clamp(3rem, 7vw, 7rem)',
                                    height: 'clamp(3rem, 7vw, 7rem)',
                                }}>
                                <span className="text-black font-black"
                                    style={{ fontSize: 'clamp(1rem, 2.5vw, 2.5rem)' }}>VS</span>
                            </div>

                            {/* Option B */}
                            <div className="flex-1 flex items-center justify-start h-full overflow-hidden">
                                <p className="text-white font-black leading-[1.15] text-left break-keep m-0"
                                    style={{
                                        fontSize: 'clamp(1.5rem, 6vw, 7rem)',
                                        wordBreak: 'keep-all',
                                        overflowWrap: 'break-word',
                                    }}>
                                    {rightText}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team Labels */}
                    <div className="flex items-center w-full mt-[2vh]"
                        style={{ gap: 'clamp(1rem, 3vw, 3rem)' }}>
                        <div className="flex-1 text-right">
                            <span className="text-teal-400 font-black tracking-wider"
                                style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>A</span>
                        </div>
                        <div className="shrink-0"
                            style={{ width: 'clamp(3rem, 7vw, 7rem)' }} />
                        <div className="flex-1 text-left">
                            <span className="text-orange-400 font-black tracking-wider"
                                style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>B</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Idle State */}
            {gameState === GameState.IDLE && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-white/20 font-bold tracking-[0.2em]"
                        style={{ fontSize: 'clamp(1rem, 3vw, 2rem)' }}>
                        {connected ? '대기 중' : '컨트롤 페이지 연결 대기중...'}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
            `}
            </style>
        </div>
    );
};

export default TopicPage;
