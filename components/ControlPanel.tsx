import React, { useState } from 'react';
import { Plus, Trash2, ListFilter, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { RouletteItem } from '../types';
import { PRESET_COLORS } from '../constants';

interface ControlPanelProps {
  items: RouletteItem[];
  setItems: (items: RouletteItem[]) => void;
  disabled: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ items, setItems, disabled }) => {
  const [leftSide, setLeftSide] = useState('');
  const [rightSide, setRightSide] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLeft, setEditLeft] = useState('');
  const [editRight, setEditRight] = useState('');
  
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leftSide.trim() || !rightSide.trim()) return;

    const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
    
    const newItem: RouletteItem = {
      id: Date.now().toString(),
      text: `${leftSide.trim()} VS ${rightSide.trim()}`,
      color: randomColor,
      played: false
    };

    setItems([...items, newItem]);
    setLeftSide('');
    setRightSide('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const startEditing = (item: RouletteItem) => {
    const parts = item.text.split(' VS ');
    setEditLeft(parts[0] || item.text);
    setEditRight(parts[1] || '');
    setEditingId(item.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditLeft('');
    setEditRight('');
  };

  const saveEditing = () => {
    if (!editLeft.trim() || !editRight.trim()) return;
    
    setItems(items.map(item => {
        if (item.id === editingId) {
            return { ...item, text: `${editLeft.trim()} VS ${editRight.trim()}` };
        }
        return item;
    }));
    setEditingId(null);
    setEditLeft('');
    setEditRight('');
  };

  // Sort items: Active first, Played last
  const sortedItems = [...items].sort((a, b) => {
      if (a.played === b.played) return 0;
      return a.played ? 1 : -1;
  });

  return (
    <div className={`w-full h-full ${disabled ? 'opacity-50 pointer-events-none' : ''} transition-all duration-300`}>
      <div className="bg-white overflow-hidden h-full flex flex-col">
        {/* Panel Header - No Border */}
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <ListFilter size={20} className="text-slate-900" /> Match List
            </h3>
            <span className="text-xs font-black text-white bg-slate-900 px-2 py-1">{items.filter(i => !i.played).length} ACTIVE</span>
        </div>

        <div className="p-6 pt-2 flex flex-col flex-1">
            <form onSubmit={handleAddItem} className="flex gap-3 mb-6 shrink-0">
                <div className="flex-1 flex gap-0 bg-slate-100 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                    <input
                        type="text"
                        value={leftSide}
                        onChange={(e) => setLeftSide(e.target.value)}
                        placeholder="Option A"
                        className="flex-1 bg-transparent px-4 py-3 text-slate-900 font-bold placeholder-slate-400 focus:outline-none text-center"
                    />
                    <div className="flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-black px-2">VS</div>
                    <input
                        type="text"
                        value={rightSide}
                        onChange={(e) => setRightSide(e.target.value)}
                        placeholder="Option B"
                        className="flex-1 bg-transparent px-4 py-3 text-slate-900 font-bold placeholder-slate-400 focus:outline-none text-center"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-slate-900 text-white px-5 hover:bg-slate-700 transition-colors"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </form>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar flex-1 min-h-0">
            {sortedItems.map((item, index) => {
                const isEditing = editingId === item.id;
                const parts = item.text.split(' VS ');
                const left = parts[0] || item.text;
                const right = parts[1] || '';

                return (
                    <div 
                        key={item.id} 
                        className={`group flex items-center justify-between bg-white p-2 transition-all pl-3 min-h-[60px]
                            ${item.played 
                                ? 'bg-slate-50 opacity-60' 
                                : 'hover:bg-slate-50'
                            }`}
                    >
                        {isEditing ? (
                             <div className="flex items-center w-full gap-2 animate-in fade-in duration-200">
                                <input 
                                    className="flex-1 min-w-0 bg-slate-100 px-2 py-1 text-sm focus:outline-none text-center font-bold text-slate-900"
                                    value={editLeft}
                                    onChange={e => setEditLeft(e.target.value)}
                                    autoFocus
                                    placeholder="Option A"
                                />
                                <span className="text-xs font-black text-slate-300">VS</span>
                                <input 
                                    className="flex-1 min-w-0 bg-slate-100 px-2 py-1 text-sm focus:outline-none text-center font-bold text-slate-900"
                                    value={editRight}
                                    onChange={e => setEditRight(e.target.value)}
                                    placeholder="Option B"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') saveEditing();
                                        if (e.key === 'Escape') cancelEditing();
                                    }}
                                />
                                <div className="flex gap-1">
                                    <button onClick={saveEditing} className="text-white bg-green-600 hover:bg-green-700 p-1 transition-colors" title="Save">
                                        <Check size={16} strokeWidth={4} />
                                    </button>
                                    <button onClick={cancelEditing} className="text-white bg-red-500 hover:bg-red-600 p-1 transition-colors" title="Cancel">
                                        <X size={16} strokeWidth={4} />
                                    </button>
                                </div>
                             </div>
                        ) : (
                            <div className="flex items-center h-full w-full gap-3">
                                {/* Number Index instead of Color Box */}
                                <div className="w-8 text-center text-slate-400 font-bold text-lg">
                                    {index + 1}
                                </div>
                                
                                <div className="flex-1 flex items-center text-sm font-bold text-slate-700 relative overflow-hidden">
                                    {item.played && (
                                        <div className="absolute inset-0 flex items-center z-10">
                                            <div className="w-full h-[2px] bg-slate-400" />
                                        </div>
                                    )}
                                    <span className={`truncate ${item.played ? "text-slate-400" : ""}`}>{left}</span>
                                    <span className="mx-2 text-slate-300 text-[10px] shrink-0 font-black">vs</span>
                                    <span className={`truncate ${item.played ? "text-slate-400" : ""}`}>{right}</span>
                                </div>

                                <div className="flex items-center">
                                    {item.played && (
                                        <div className="px-2 py-1 bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider mr-2 flex items-center gap-1">
                                            Done <CheckCircle2 size={12} />
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                        <button
                                            onClick={() => startEditing(item)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all"
                                            title="Edit"
                                        >
                                            <Pencil size={16} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            
            {items.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 border-2 border-dashed border-slate-300 font-bold uppercase">
                Add items to start
                </div>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};