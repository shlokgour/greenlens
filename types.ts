
export interface Ingredient {
  name: string;
  purpose: string;
  health_risk: 'Low' | 'Medium' | 'High';
  environment_risk: 'Low' | 'Medium' | 'High';
  safety: string; // Emoji + Text e.g. "🌱 Safe"
  explanation: string;
}

export interface ClaimAnalysis {
  claim: string;
  technique_type: string;
  truth_score: number;
  evidence_required: string;
  flagged: boolean;
}

export interface Certification {
  name: string;
  status: 'Trusted' | 'Weak' | 'Fake' | 'Marketing';
  explanation: string;
}

export interface Alternative {
  product_name: string;
  reason: string;
}

export interface AllergyAlert {
  ingredient: string;
  risk_type: 'Allergy' | 'Sensitivity';
  warning: string;
}

export interface ProductAnalysis {
  product_name: string;
  product_type: string;
  eco_score: number;
  greenwashing_risk: 'Low' | 'Medium' | 'High';
  final_decision: 'Good Choice' | 'Think Twice' | 'Avoid';
  ingredients: Ingredient[];
  allergy_alerts: AllergyAlert[];
  claims_analysis: ClaimAnalysis[];
  certifications: Certification[];
  alternatives: Alternative[];
  voice_output: string;
  safety_advice: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: ProductAnalysis;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';
