export interface GeminiSlide { heading: string; body: string; }
export interface GeminiChartPoint { label: string; value: number; }
export interface GeminiResponse { intro: string; businessCritique: string[]; code: string; slides: GeminiSlide[]; chart: GeminiChartPoint[]; }
