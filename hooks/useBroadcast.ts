import { useEffect, useRef, useCallback } from 'react';
import { RouletteItem, GameState } from '../types';

const CHANNEL_NAME = 'roulette-sync';

export interface RouletteSyncState {
  items: RouletteItem[];
  gameState: GameState;
  lastWinnerId: string | null;
  scores: { A: number; B: number };
}

/**
 * Sender hook — used by ControlPage.
 * Broadcasts the full state to all listening tabs whenever it changes.
 */
export function useBroadcastSender(state: RouletteSyncState) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast whenever state changes
  useEffect(() => {
    channelRef.current?.postMessage(state);
  }, [state]);
}

/**
 * Receiver hook — used by DisplayPage.
 * Listens for state broadcasts and invokes the callback.
 */
export function useBroadcastReceiver(
  onStateReceived: (state: RouletteSyncState) => void
) {
  const callbackRef = useRef(onStateReceived);
  callbackRef.current = onStateReceived;

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event: MessageEvent<RouletteSyncState>) => {
      callbackRef.current(event.data);
    };

    return () => {
      channel.close();
    };
  }, []);
}
