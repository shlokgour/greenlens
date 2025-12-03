
import React, { useState, useEffect } from 'react';
import { Leaf, RefreshCcw } from 'lucide-react';
import InputSection from './components/InputSection';
import AnalysisResult from './components/AnalysisResult';
import HistoryList from './components/HistoryList';
import { analyzeProductWithGemini } from './services/geminiService';
import { ProductAnalysis, HistoryItem } from './types';

const App: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from local storage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('greenlens_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  const addToHistory = (analysis: ProductAnalysis) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: Date.now(),
      data: analysis
    };
    const updated = [newItem, ...history].slice(0, 10); // Keep last 10 items
    setHistory(updated);
    localStorage.setItem('greenlens_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('greenlens_history');
  };

  const handleAnalyze = async (text: string, image?: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeProductWithGemini(text, image);
      setAnalysisData(result);
      addToHistory(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysisData(null);
    setError(null);
  };

  const selectHistoryItem = (item: HistoryItem) => {
    setAnalysisData(item.data);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-green-200">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
            <div className="bg-green-600 p-2 rounded-lg text-white">
              <Leaf size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Green<span className="text-green-600">Lens</span></span>
          </div>
          {analysisData && (
             <button onClick={reset} className="text-sm font-medium text-slate-500 hover:text-green-600 flex items-center gap-1 transition-colors">
               <RefreshCcw size={14} />
               <span>New Scan</span>
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-800 hover:underline text-sm font-bold">Dismiss</button>
          </div>
        )}

        {!analysisData ? (
          <div className="flex flex-col items-center animate-fade-in-up">
            <div className="text-center mb-10 max-w-xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
                See Beyond the <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Green Label</span>
              </h1>
              <p className="text-lg text-slate-500">
                Identify greenwashing, verify ingredients, detect allergens, and make safer choices with AI.
              </p>
            </div>
            <InputSection onAnalyze={handleAnalyze} isLoading={loading} />
            
            <HistoryList 
              items={history} 
              onSelect={selectHistoryItem} 
              onClear={clearHistory}
            />

            {/* Features Grid - Only show if history is empty to reduce clutter, or keep at bottom */}
            {history.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full opacity-80">
                 <div className="text-center p-4">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-700 font-bold text-xl">1</div>
                   <h3 className="font-bold text-slate-800 mb-1">Upload Label</h3>
                   <p className="text-sm text-slate-500">Take a photo of any product label, ingredients, or barcode.</p>
                 </div>
                 <div className="text-center p-4">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-700 font-bold text-xl">2</div>
                   <h3 className="font-bold text-slate-800 mb-1">AI Analysis</h3>
                   <p className="text-sm text-slate-500">Our engine detects harmful chemicals, allergens, and fake claims.</p>
                 </div>
                 <div className="text-center p-4">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-700 font-bold text-xl">3</div>
                   <h3 className="font-bold text-slate-800 mb-1">Get the Truth</h3>
                   <p className="text-sm text-slate-500">Receive an EcoScore, allergy warnings, and safer alternatives.</p>
                 </div>
              </div>
            )}
          </div>
        ) : (
          <AnalysisResult data={analysisData} />
        )}
      </main>
    </div>
  );
};

export default App;
