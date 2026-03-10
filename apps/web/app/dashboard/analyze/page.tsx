"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pulseApi, AnalyzeResponse } from '@/lib/api';
import IndividualResultCard from '@/components/analysis/IndividualResultCard';
import { SentimentAnalysisResult } from '@pulse/shared';
import { Loader2 } from 'lucide-react';

export default function AnalyzePage() {
    const [text, setText] = useState('');
    const [result, setResult] = useState<(SentimentAnalysisResult & { id?: string; fromCache?: boolean }) | null>(null);
    const [analyzedAt, setAnalyzedAt] = useState<Date | undefined>();

    const mutation = useMutation({
        mutationFn: (t: string) => pulseApi.analyzeText(t),
        onSuccess: (data: AnalyzeResponse) => {
            setResult(data.data);
            setAnalyzedAt(new Date());
        },
    });

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Analyze</span>
                <h1 className="font-mono text-3xl font-bold mt-1">New Analysis</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Paste any text below to extract sentiment, emotions, and AI insights.
                </p>
            </div>

            {/* Input card */}
            <div className="rounded-xl p-6 mb-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Paste your text here — a review, tweet, support ticket, article, anything..."
                    rows={7}
                    className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none resize-none font-sans text-[14px] leading-relaxed"
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
                    <span className="font-mono text-[10px] text-[var(--text-dim)]">{text.length} characters</span>
                    <button
                        onClick={() => mutation.mutate(text)}
                        disabled={text.length < 10 || mutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-mono text-sm text-white transition disabled:opacity-40"
                        style={{ background: 'var(--indigo)', boxShadow: '0 0 20px var(--indigo-glow)' }}
                    >
                        {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Run Analysis →'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {mutation.isError && (
                <div className="p-4 rounded-xl mb-6 font-mono text-sm text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Analysis failed. Please try again.'}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="animate-fadeUp">
                    <IndividualResultCard result={result} analyzedAt={analyzedAt} charCount={text.length} />
                </div>
            )}
        </div>
    );
}
