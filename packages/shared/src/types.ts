export type PlanType = 'free' | 'pro' | 'enterprise';

export interface SentimentAnalysisResult {
    score: number;
    confidence: number;
    label: 'positive' | 'neutral' | 'negative';
    summary: string;
    emotions: {
        joy: number;
        anger: number;
        fear: number;
        sadness: number;
        surprise: number;
        disgust: number;
    };
    keywords: Array<{ word: string; sentiment: number }>;
    sentences: Array<{ text: string; sentiment: number }>;
}
