import React from 'react';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface ScoreControlsProps {
    onIncrementA: () => void;
    onDecrementA: () => void;
    onIncrementB: () => void;
    onDecrementB: () => void;
    onReset: () => void;
}

export const ScoreControls: React.FC<ScoreControlsProps> = ({
    onIncrementA, onDecrementA, onIncrementB, onDecrementB, onReset
}) => {
    return (
        <div className="w-full bg-white p-4 flex items-center justify-between mt-2">
            {/* Left Controls (Kouga) */}
            <div className="flex items-center gap-6 pl-4">
                <span className="font-black text-teal-500 text-lg uppercase tracking-wider">코우가 Score</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDecrementA}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                        title="-1"
                    >
                        <Minus size={24} strokeWidth={3} />
                    </button>
                    <button
                        onClick={onIncrementA}
                        className="w-12 h-12 bg-teal-100 hover:bg-teal-200 active:scale-95 text-teal-700 flex items-center justify-center transition-all"
                        title="+1"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Center Reset */}
            <button
                onClick={onReset}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 hover:text-red-500 active:scale-95 text-slate-400 text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all"
            >
                <RotateCcw size={16} strokeWidth={3} /> Reset Scores
            </button>

            {/* Right Controls (Pickles) */}
            <div className="flex items-center gap-6 pr-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onDecrementB}
                        className="w-12 h-12 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                        title="-1"
                    >
                        <Minus size={24} strokeWidth={3} />
                    </button>
                    <button
                        onClick={onIncrementB}
                        className="w-12 h-12 bg-orange-100 hover:bg-orange-200 active:scale-95 text-orange-700 flex items-center justify-center transition-all"
                        title="+1"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
                <span className="font-black text-orange-500 text-lg uppercase tracking-wider">피클즈 Score</span>
            </div>
        </div>
    );
};