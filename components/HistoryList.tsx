
import React from 'react';
import { History, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect, onClear }) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 animate-fade-in">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History size={20} className="text-slate-500" />
          Recent Scans
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if(window.confirm('Clear all history?')) onClear();
          }}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium"
        >
          <Trash2 size={14} /> Clear
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-green-300 transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover:via-green-400 transition-colors"></div>
            
            <div className="pl-2">
              <div className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">
                {item.data.product_name || "Unknown Product"}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Clock size={12} />
                <span>
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    {' • '}
                    {new Date(item.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex flex-col items-end`}>
                 <span className={`text-sm font-bold px-2.5 py-0.5 rounded-md ${
                    item.data.eco_score >= 70 ? 'bg-green-100 text-green-700' :
                    item.data.eco_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.data.eco_score}
                 </span>
                 <span className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">EcoScore</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-green-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
