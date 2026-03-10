"use client";

import { useEffect, useRef, useState } from 'react';
import { SentimentAnalysisResult } from '@pulse/shared';
import { ScoreBadge } from './ScoreBadge';
import { EmotionBars } from './EmotionBars';
import { SentenceHeatmap } from './SentenceHeatmap';
import { KeywordCloud } from './KeywordCloud';

interface IndividualResultCardProps {
    result: SentimentAnalysisResult & { id?: string; fromCache?: boolean };
    charCount?: number;
    analyzedAt?: Date;
}

// ─── Score color helpers ────────────────────────────────────────────────────
function scoreColor(score: number) {
    if (score >= 60) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
}
function scoreGlow(score: number) {
    if (score >= 60) return '0 0 40px #10B98135, 0 0 80px #10B98120';
    if (score >= 40) return '0 0 40px #F59E0B35, 0 0 80px #F59E0B20';
    return '0 0 40px #EF444435, 0 0 80px #EF444420';
}
function topBorderGradient(score: number) {
    if (score >= 60) return 'linear-gradient(90deg, transparent, #10B981, transparent)';
    if (score >= 40) return 'linear-gradient(90deg, transparent, #F59E0B, transparent)';
    return 'linear-gradient(90deg, transparent, #EF4444, transparent)';
}
function cardGlow(score: number) {
    if (score >= 60) return '0 0 0 1px #10B98130, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #10B98120';
    if (score >= 40) return '0 0 0 1px #F59E0B30, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #F59E0B20';
    return '0 0 0 1px #EF444430, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #EF444420';
}

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value, color }: { value: number; color: string }) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const duration = 900;
        const from = 0;

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(from + (value - from) * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <span style={{ color, textShadow: scoreGlow(value), fontFamily: 'var(--font-mono)', fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
            {display}
        </span>
    );
}

// ─── Confidence bar ─────────────────────────────────────────────────────────
function ConfidenceBar({ confidence }: { confidence: number }) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!barRef.current) return;
        barRef.current.style.width = '0%';
        setTimeout(() => {
            if (barRef.current) barRef.current.style.width = `${confidence}%`;
        }, 200);
    }, [confidence]);

    return (
        <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)]">
            <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-[3px] uppercase">Confidence</span>
                <span className="font-mono text-[13px] font-bold text-[var(--indigo)]">{confidence}%</span>
            </div>
            <div className="h-[6px] bg-[var(--bg-base)] rounded-full overflow-hidden">
                <div
                    ref={barRef}
                    className="h-full rounded-full transition-all duration-[1000ms] ease-out"
                    style={{ width: '0%', background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', boxShadow: '0 0 12px #4F46E560' }}
                />
            </div>
        </div>
    );
}

// ─── Section divider ────────────────────────────────────────────────────────
function Divider() {
    return <div className="h-px bg-[var(--border)]" />;
}

// ─── Card section label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[9px] font-semibold tracking-[3px] uppercase text-[var(--text-dim)] mb-3">
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function IndividualResultCard({
    result,
    charCount,
    analyzedAt,
}: IndividualResultCardProps) {
    const { score, confidence, label, summary, emotions, keywords, sentences, fromCache } = result;
    const color = scoreColor(score);

    const formattedTime = analyzedAt
        ? new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(analyzedAt)
        : 'JUST NOW';

    return (
        <div
            className="relative flex flex-col w-full max-w-[420px] rounded-[10px] overflow-hidden animate-fadeUp"
            style={{
                background: 'var(--bg-surface)',
                boxShadow: cardGlow(score),
            }}
        >
            {/* ── Top accent border line ──────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: topBorderGradient(score) }} />

            <div className="flex flex-col gap-5 p-6 pt-7">
                {/* ── 1. Header tag ─────────────────────────────────────────── */}
                <div className="font-mono text-[9px] font-semibold tracking-[3px] uppercase text-[var(--text-dim)]">
                    Individual · Personal Analysis
                </div>

                {/* ── 2. Status + Score row ─────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                        <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-[3px] uppercase">Status</span>
                        <ScoreBadge label={label} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-[3px] uppercase">Score</span>
                        <AnimatedNumber value={score} color={color} />
                        <span className="font-mono text-[9px] text-[var(--text-dim)]">/ 100</span>
                    </div>
                </div>

                {/* ── 3. Confidence bar ─────────────────────────────────────── */}
                <ConfidenceBar confidence={confidence} />

                <Divider />

                {/* ── 5. All 6 emotion bars ─────────────────────────────────── */}
                <div>
                    <SectionLabel>Emotions</SectionLabel>
                    <EmotionBars emotions={emotions} />
                </div>

                <Divider />

                {/* ── 7. Sentence heatmap ───────────────────────────────────── */}
                {sentences && sentences.length > 0 && (
                    <>
                        <div>
                            <SectionLabel>Sentence Heatmap</SectionLabel>
                            <SentenceHeatmap sentences={sentences} />
                        </div>
                        <Divider />
                    </>
                )}

                {/* ── 9. Keyword cloud ──────────────────────────────────────── */}
                {keywords && keywords.length > 0 && (
                    <>
                        <div>
                            <SectionLabel>Charged Keywords</SectionLabel>
                            <KeywordCloud keywords={keywords} />
                        </div>
                        <Divider />
                    </>
                )}

                {/* ── 11. AI Insight quote ──────────────────────────────────── */}
                {summary && (
                    <div>
                        <SectionLabel>AI Insight</SectionLabel>
                        <div
                            className="rounded-md p-4"
                            style={{
                                background: 'var(--bg-elevated)',
                                borderLeft: '3px solid var(--indigo)',
                            }}
                        >
                            <p className="font-sans text-[13px] italic text-[var(--text-secondary)] leading-relaxed">
                                &ldquo;{summary}&rdquo;
                            </p>
                        </div>
                    </div>
                )}

                {/* ── 12. Card footer ───────────────────────────────────────── */}
                <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                        ANALYZED · {formattedTime}{charCount ? ` · ${charCount} CHARS` : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span
                            className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"
                            style={{ boxShadow: '0 0 6px #10B981' }}
                        />
                        <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                            {fromCache ? 'CACHED · ' : ''}GEMINI 1.5 FLASH
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
