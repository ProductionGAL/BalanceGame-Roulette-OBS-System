import React, { useState, useCallback, useRef } from 'react';
import { GameState, RouletteItem } from '../types';
import { DEFAULT_CONFIG, INITIAL_ITEMS } from '../constants';
import { RouletteDisplay } from '../components/RouletteDisplay';
import { ScoreBoard } from '../components/ScoreBoard';
import { useBroadcastReceiver, RouletteSyncState } from '../hooks/useBroadcast';

const DisplayPage: React.FC = () => {
    const [items, setItems] = useState<RouletteItem[]>(INITIAL_ITEMS);
    const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
    const [lastWinnerId, setLastWinnerId] = useState<string | null>(null);
    const [scores, setScores] = useState({ A: 0, B: 0 });
    const [connected, setConnected] = useState(false);

    // Receive state from Control page
    const handleStateReceived = useCallback((state: RouletteSyncState) => {
        setItems(state.items);
        setGameState(state.gameState);
        setLastWinnerId(state.lastWinnerId);
        setScores(state.scores);
        if (!connected) setConnected(true);
    }, [connected]);

    useBroadcastReceiver(handleStateReceived);

    // Freeze rouletteItems during animation to prevent DOM shifts
    const frozenItemsRef = useRef<RouletteItem[]>([]);

    const rouletteItems = React.useMemo(() => {
        const filtered = items.filter(item => !item.played || item.id === lastWinnerId);
        // Only update the frozen list when NOT actively spinning/stopping
        if (gameState === GameState.IDLE || gameState === GameState.WON) {
            frozenItemsRef.current = filtered;
        }
        // Always return the frozen (stable) list during animation
        return frozenItemsRef.current.length > 0 ? frozenItemsRef.current : filtered;
    }, [items, lastWinnerId, gameState]);

    // This is a display-only callback — the actual win logic is handled by ControlPage
    const handleWin = useCallback((_item: RouletteItem) => {
        // No-op on display side; the control page handles win state
    }, []);

    return (
        <div className="bg-transparent flex flex-col items-center justify-center p-4 font-sans w-full h-full overflow-hidden">
            <main className="flex flex-col items-center gap-4 w-max scale-[0.85] origin-top">

                {/* Score Board */}
                <ScoreBoard scoreA={scores.A} scoreB={scores.B} />

                {/* Roulette Display */}
                <div className="relative flex flex-col gap-4">
                    <RouletteDisplay
                        items={rouletteItems}
                        gameState={gameState}
                        winnerId={lastWinnerId}
                        config={DEFAULT_CONFIG}
                        onWin={handleWin}
                        setGameState={setGameState}
                    />
                </div>

                {/* Connection Status Indicator */}
                {!connected && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-3 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        컨트롤 페이지 연결 대기중...
                    </div>
                )}
            </main>
        </div>
    );
};

export default DisplayPage;
