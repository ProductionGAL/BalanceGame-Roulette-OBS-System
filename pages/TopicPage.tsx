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
                    <div className="text-6xl">🎰</div>
                    <div className="text-white/60 text-3xl font-black tracking-[0.3em] uppercase">
                        주제 선정 중...
                    </div>
                </div>
            )}

            {/* Winner Display */}
            {gameState === GameState.WON && winnerItem && (
                <div className="flex flex-col items-center w-full px-12 animate-fadeIn">
                    {/* Topic Number / Badge */}
                    <div className="mb-8 px-6 py-2 border-2 border-white/20 text-white/40 text-sm font-bold tracking-[0.2em] uppercase">
                        선정된 주제
                    </div>

                    {/* Main Topic Text */}
                    <div className="flex items-center justify-center gap-8 w-full max-w-[1400px]">
                        {/* Option A */}
                        <div className="flex-1 text-right">
                            <span className="text-white font-black leading-tight break-keep"
                                style={{ fontSize: getOptimalFontSize(leftText.length) }}>
                                {leftText}
                            </span>
                        </div>

                        {/* VS Badge */}
                        <div className="shrink-0 w-24 h-24 bg-yellow-400 flex items-center justify-center">
                            <span className="text-black text-3xl font-black">VS</span>
                        </div>

                        {/* Option B */}
                        <div className="flex-1 text-left">
                            <span className="text-white font-black leading-tight break-keep"
                                style={{ fontSize: getOptimalFontSize(rightText.length) }}>
                                {rightText}
                            </span>
                        </div>
                    </div>

                    {/* Team Labels */}
                    <div className="flex items-center gap-8 w-full max-w-[1400px] mt-10">
                        <div className="flex-1 text-right">
                            <span className="text-teal-400 text-xl font-black tracking-wider">A</span>
                        </div>
                        <div className="w-24" />
                        <div className="flex-1 text-left">
                            <span className="text-orange-400 text-xl font-black tracking-wider">B</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Idle State */}
            {gameState === GameState.IDLE && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-white/20 text-2xl font-bold tracking-[0.2em]">
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
            `}</style>
        </div>
    );
};

function getOptimalFontSize(length: number): string {
    if (length <= 8) return '4.5rem';
    if (length <= 12) return '3.5rem';
    if (length <= 18) return '2.8rem';
    if (length <= 25) return '2.2rem';
    return '1.8rem';
}

export default TopicPage;
