export type BlockType = 'intro' | 'critic' | 'code' | 'slides' | 'chart';

export interface BlockBase { id: string; type: BlockType; title: string; loading: boolean; error?: string; review?: string; reviewSuggestion?: string; reviewLoading?: boolean; reviewError?: string; }
export interface IntroBlockData extends BlockBase { type: 'intro'; content: string; }
export interface CriticBlockData extends BlockBase { type: 'critic'; points: string[]; }
export interface CodeBlockData extends BlockBase { type: 'code'; language: string; code: string; }
export interface SlidesBlockData extends BlockBase { type: 'slides'; slides: { heading: string; body: string }[]; }
export interface ChartBlockData extends BlockBase { type: 'chart'; data: { label: string; value: number }[]; }
export type Block = IntroBlockData | CriticBlockData | CodeBlockData | SlidesBlockData | ChartBlockData;
