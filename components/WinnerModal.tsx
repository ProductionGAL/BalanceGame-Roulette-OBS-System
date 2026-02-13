import React, { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { RouletteItem } from '../types';

interface WinnerModalProps {
  winner: RouletteItem | null;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (winner) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [winner]);

  if (!winner || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Brutalist Modal */}
      <div className="relative bg-white border-4 border-black shadow-[20px_20px_0px_rgba(0,0,0,0.5)] p-0 max-w-md w-full animate-bounceIn">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h2 className="font-black text-xl italic uppercase tracking-widest flex items-center gap-2">
                <Trophy size={24} /> New Record
            </h2>
            <button onClick={onClose} className="hover:rotate-90 transition-transform">
                <X size={24} strokeWidth={3} />
            </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center gap-6">
            <div 
                className="w-32 h-32 flex items-center justify-center text-white font-black text-6xl shadow-[8px_8px_0px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: winner.color }}
            >
                {winner.text.charAt(0)}
            </div>
            
            <div className="text-center">
                <p className="text-slate-400 font-mono text-sm mb-2">SELECTION RESULT</p>
                <div 
                    className="text-4xl font-black text-slate-900 uppercase leading-none break-words border-b-4 border-transparent hover:border-black transition-all"
                >
                    {winner.text}
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full py-4 bg-black text-white font-bold hover:bg-slate-800 transition-colors uppercase tracking-widest text-lg"
            >
                Confirm
            </button>
        </div>
      </div>
    </div>
  );
};