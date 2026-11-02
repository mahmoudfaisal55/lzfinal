
export interface RIASECScores {
  R: number; // Realistic (الواقعي)
  I: number; // Investigative (البحثي)
  A: number; // Artistic (الفني)
  S: number; // Social (الاجتماعي)
  E: number; // Enterprising (المغامر)
  C: number; // Conventional (التقليدي)
}

export type RIASECKey = keyof RIASECScores;

export interface Question {
  id: number;
  text: string;
  category: RIASECKey;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Session {
  id: number;
  title: string;
  description: string;
  objective: string;
  icon: string;
  detailedInfo?: string;
}
