
import React, { useState } from 'react';
import { ProductAnalysis } from '../types';
import ScoreGauge from './ScoreGauge';
import { Play, AlertTriangle, CheckCircle, XCircle, Leaf, ShieldAlert, BadgeCheck, Star, Info } from 'lucide-react';
import { generateSpeechFromText, playAudioBuffer } from '../services/geminiService';

interface AnalysisResultProps {
  data: ProductAnalysis;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const handlePlayAudio = async () => {
    if (isPlaying) return;
    try {
      setLoadingAudio(true);
      const buffer = await generateSpeechFromText(data.voice_output);
      playAudioBuffer(buffer);
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), buffer.duration * 1000); 
    } catch (e) {
      console.error("Audio playback failed", e);
      alert("Could not play audio.");
    } finally {
      setLoadingAudio(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Derived Lists
  const healthAlerts = data.ingredients.filter(ing => 
    ing.health_risk === 'High' || 
    ing.safety.includes('❌') || 
    ing.safety.includes('⚠️')
  );
  
  const goodIngredients = data.ingredients.filter(ing => 
    ing.safety.includes('🌱') || ing.health_risk === 'Low'
  );

  const hasAlerts = healthAlerts.length > 0 || data.allergy_alerts.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* Hero Section */}
      <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-8 border border-slate-100">
        <div className="flex-1 w-full">
           <div className="flex justify-between items-start mb-2">
             <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
               {data.product_type}
             </span>
             <button 
                onClick={handlePlayAudio}
                disabled={loadingAudio || isPlaying}
                className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-600'}`}
             >
                {loadingAudio ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Play size={20} fill={isPlaying ? "currentColor" : "none"} />}
             </button>
           </div>
           <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{data.product_name}</h1>
           <p className="text-slate-500 text-sm mb-4 leading-relaxed italic">"{data.voice_output}"</p>
           
           <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
             data.final_decision === 'Good Choice' ? 'bg-green-100 text-green-700' :
             data.final_decision === 'Think Twice' ? 'bg-yellow-100 text-yellow-700' :
             'bg-red-100 text-red-700'
           }`}>
             {data.final_decision === 'Good Choice' && <CheckCircle size={18} />}
             {data.final_decision === 'Think Twice' && <AlertTriangle size={18} />}
             {data.final_decision === 'Avoid' && <XCircle size={18} />}
             {data.final_decision}
           </div>
        </div>
        
        <div className="w-full md:w-48 shrink-0 flex flex-col items-center">
          <ScoreGauge score={data.eco_score} />
          <div className={`text-center font-semibold text-sm mt-[-20px] ${
             data.greenwashing_risk === 'Low' ? 'text-green-600' :
             data.greenwashing_risk === 'Medium' ? 'text-yellow-600' :
             'text-red-600'
          }`}>
             Risk: {data.greenwashing_risk}
          </div>
        </div>
      </div>

      {/* Safety Advice Banner */}
      {data.safety_advice && (
        <div className="flex gap-3 items-start bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
           <ShieldAlert className="text-slate-500 mt-0.5 shrink-0" size={20} />
           <p className="text-sm text-slate-700"><span className="font-bold text-slate-900">Expert Tip:</span> {data.safety_advice}</p>
        </div>
      )}

      {/* Two Column Layout for Alerts vs Good Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Harmful / Allergen Alerts */}
        <div className={`rounded-2xl p-4 flex flex-col h-full border ${hasAlerts ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-3">
             {hasAlerts ? <AlertTriangle className="text-red-600" size={20} /> : <CheckCircle className="text-slate-400" size={20} />}
             <h4 className={`font-bold text-sm ${hasAlerts ? 'text-red-900' : 'text-slate-700'}`}>
               {hasAlerts ? "Harmful / Allergen Alerts" : "No Alerts Detected"}
             </h4>
          </div>
          
          {hasAlerts ? (
            <ul className="space-y-2 mt-1">
              {data.allergy_alerts.map((alert, idx) => (
                 <li key={`allergy-${idx}`} className="flex justify-between items-start text-xs border-b border-red-200/50 last:border-0 pb-1.5 last:pb-0">
                  <span className="font-semibold text-red-800">❌ {alert.ingredient}</span>
                  <span className="text-red-700 text-right">{alert.warning}</span>
                </li>
              ))}
              {healthAlerts.map((alert, idx) => (
                <li key={`health-${idx}`} className="flex justify-between items-start text-xs border-b border-red-200/50 last:border-0 pb-1.5 last:pb-0">
                  <span className="font-semibold text-red-800">{alert.safety.includes('❌') ? '❌' : '⚠️'} {alert.name}</span>
                  <span className="text-red-700 text-right">{alert.explanation}</span>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-xs text-slate-500">No harmful chemicals or common allergens detected in this product.</p>
          )}
        </div>

        {/* Good Ingredients */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col h-full">
           <div className="flex items-center gap-2 mb-3">
             <Star className="text-emerald-600" size={20} />
             <h4 className="font-bold text-emerald-900 text-sm">Good Ingredients</h4>
           </div>
           {goodIngredients.length > 0 ? (
             <ul className="space-y-2 mt-1">
               {goodIngredients.slice(0, 4).map((ing, idx) => (
                 <li key={idx} className="flex justify-between items-start text-xs border-b border-emerald-200/50 last:border-0 pb-1.5 last:pb-0">
                   <span className="font-semibold text-emerald-800">🌱 {ing.name}</span>
                   <span className="text-emerald-700 text-right truncate max-w-[150px]">{ing.explanation}</span>
                 </li>
               ))}
               {goodIngredients.length > 4 && (
                 <li className="text-xs text-emerald-600 font-medium pt-1">
                   + {goodIngredients.length - 4} more safe ingredients
                 </li>
               )}
             </ul>
           ) : (
             <p className="text-xs text-emerald-600">No specifically beneficial ingredients highlighted.</p>
           )}
        </div>
      </div>

      {/* Grid Layout for details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ingredients Full List */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Leaf className="text-green-600" size={18} />
            <h3 className="font-bold text-slate-800">Full Analysis</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {data.ingredients.map((ing, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-slate-800">{ing.name}</span>
                  <span className="text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full">{ing.safety.split(' ')[0]} {ing.purpose}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-1">
                   <span className={`text-[10px] uppercase font-bold tracking-wide ${ing.health_risk === 'High' ? 'text-red-500' : ing.health_risk === 'Medium' ? 'text-yellow-600' : 'text-green-500'}`}>
                     Health: {ing.health_risk}
                   </span>
                   <span className="text-[10px] text-slate-300">|</span>
                   <span className={`text-[10px] uppercase font-bold tracking-wide ${ing.environment_risk === 'High' ? 'text-red-500' : ing.environment_risk === 'Medium' ? 'text-yellow-600' : 'text-green-500'}`}>
                     Env: {ing.environment_risk}
                   </span>
                </div>
                <p className="text-xs text-slate-600">"{ing.explanation}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Greenwashing & Certifications */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={18} />
              <h3 className="font-bold text-slate-800">Greenwashing Check</h3>
            </div>
            <div className="p-4 space-y-3">
              {data.claims_analysis.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No suspicious claims detected.</p>
              ) : (
                data.claims_analysis.map((claim, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${claim.flagged ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-slate-800">"{claim.claim}"</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${claim.truth_score > 7 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {claim.truth_score}/10
                      </span>
                    </div>
                    <div className="text-xs text-slate-600"><span className="font-semibold">Evidence:</span> {claim.evidence_required}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BadgeCheck className="text-blue-600" size={18} />
              <h3 className="font-bold text-slate-800">Certifications</h3>
            </div>
             <div className="p-4 space-y-3">
              {data.certifications.length === 0 ? (
                 <p className="text-sm text-slate-500 text-center py-4">No certifications found.</p>
              ) : (
                data.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                    {cert.status === 'Trusted' ? <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={16} /> : 
                     cert.status === 'Fake' || cert.status === 'Marketing' ? <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} /> :
                     <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={16} />}
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{cert.name}</div>
                      <div className="text-xs text-slate-500">{cert.explanation}</div>
                    </div>
                  </div>
                ))
              )}
             </div>
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {data.alternatives.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
           <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
             <Leaf size={20} className="text-green-600" />
             Recommended Safer Alternatives
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {data.alternatives.map((alt, idx) => (
               <div key={idx} className="bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-green-100">
                 <div className="font-bold text-green-800 mb-1">{alt.product_name}</div>
                 <div className="text-sm text-green-700">{alt.reason}</div>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
};

export default AnalysisResult;
