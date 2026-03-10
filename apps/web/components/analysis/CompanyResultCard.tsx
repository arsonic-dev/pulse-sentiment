"use client";

import { useEffect, useRef, useState } from 'react';
import { SentimentAnalysisResult } from '@pulse/shared';
import { ExportDropdown, ShareDropdown } from './ExportShareDropdowns';
import { MiniTrendChart } from './MiniTrendChart';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BatchRow {
    id: string;
    text: string;
    source?: string;
    score: number;
    /** Full AI result — present when row came from per-row API call */
    fullResult?: SentimentAnalysisResult & { fromCache?: boolean };
}

interface ChurnRisk {
    detected: boolean;
    count: number;
    reason: string;
}

interface RecommendedAction {
    title: string;
    detail: string;
}

export interface TopEmotion {
    name: string;
    value: number; // 0–1
    emoji: string;
}

export interface CompanyCardData {
    projectName: string;
    rowCount: number;
    analyzedAt?: Date;
    processingTime?: number; // seconds
    projectLabel?: string;
    avgScore: number;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    trendData: number[];
    topEmotions: TopEmotion[];
    rows: BatchRow[];
    churnRisk?: ChurnRisk;
    recommendedActions?: RecommendedAction[];
    fromCache?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function scoreColor(score: number) {
    if (score >= 60) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
}

function cardGlow(score: number) {
    if (score >= 60) return '0 0 0 1px #10B98130, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #10B98120';
    if (score >= 40) return '0 0 0 1px #F59E0B30, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #F59E0B20';
    return '0 0 0 1px #EF444430, 0 20px 40px rgba(0,0,0,0.5), 0 0 80px #EF444420';
}

function topBorderGradient(score: number) {
    if (score >= 60) return 'linear-gradient(90deg, transparent, #10B981, transparent)';
    if (score >= 40) return 'linear-gradient(90deg, transparent, #F59E0B, transparent)';
    return 'linear-gradient(90deg, transparent, #EF4444, transparent)';
}

// ─── Animated integer counter ───────────────────────────────────────────────
function AnimatedInt({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const duration = 800;
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(value * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <>{display}{suffix}</>;
}

// ─── KPI box ────────────────────────────────────────────────────────────────
function KpiBox({ label, value, color, suffix = '' }: {
    label: string; value: number; color: string; suffix?: string;
}) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-1 rounded-lg p-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
            <span className="font-mono text-[22px] font-bold" style={{ color }}>
                <AnimatedInt value={value} suffix={suffix} />
            </span>
            <span className="font-mono text-[8px] tracking-[2px] text-[var(--text-dim)] uppercase text-center">
                {label}
            </span>
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-[var(--border)]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="font-mono text-[9px] font-semibold tracking-[3px] uppercase text-[var(--text-dim)] mb-3">
            {children}
        </div>
    );
}

function MiniScoreBar({ score }: { score: number }) {
    return (
        <div className="w-16 h-[4px] bg-[var(--bg-base)] rounded-full overflow-hidden">
            <div
                className="h-full rounded-full"
                style={{
                    width: `${score}%`,
                    background: scoreColor(score),
                    transition: 'width 0.8s ease-out',
                }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
interface CompanyResultCardProps {
    data: CompanyCardData;
    /** Called when user clicks a row to drill down into individual analysis */
    onRowClick?: (row: BatchRow) => void;
    /** Compact mode — no heatmap, no actions (used in history/projects) */
    compact?: boolean;
}

export default function CompanyResultCard({ data, onRowClick, compact = false }: CompanyResultCardProps) {
    const [showExport, setShowExport] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const {
        projectName, rowCount, analyzedAt, processingTime, projectLabel,
        avgScore, positivePct, negativePct, neutralPct,
        trendData, topEmotions, rows, churnRisk, recommendedActions, fromCache,
    } = data;

    const [showAll, setShowAll] = useState(false);
    const visibleRows = showAll ? rows : rows.slice(0, 5);

    const trendDelta = trendData.length >= 2
        ? trendData[trendData.length - 1] - trendData[0]
        : undefined;

    const formattedTime = analyzedAt
        ? `${Math.max(0, Math.round((Date.now() - analyzedAt.getTime()) / 60000))}m ago`
        : 'JUST NOW';

    const processingLabel = processingTime
        ? `${Math.floor(processingTime / 60)}m ${Math.round(processingTime % 60)}s`
        : '—';

    const canDrillDown = typeof onRowClick === 'function';

    return (
        <div
            className="relative flex flex-col w-full rounded-[10px] overflow-hidden animate-fadeUp"
            style={{ background: 'var(--bg-surface)', boxShadow: cardGlow(avgScore) }}
        >
            {/* Top accent border */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: topBorderGradient(avgScore) }} />

            <div className="flex flex-col gap-5 p-6 pt-7">

                {/* 1. Header tag */}
                <div className="font-mono text-[9px] font-semibold tracking-[3px] uppercase text-[var(--text-dim)]">
                    Business · Batch Analysis Report
                </div>

                {/* 2. Company header row */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="font-mono font-bold text-[14px] text-[var(--text-primary)] leading-tight">
                            {projectName}
                        </div>
                        <div className="font-sans text-[11px] text-[var(--text-dim)] mt-1">
                            {rowCount} rows · Analyzed {formattedTime}{projectLabel ? ` · project: ${projectLabel}` : ''}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* ── Export button + dropdown ── */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowExport(!showExport); setShowShare(false); }}
                                className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition flex items-center gap-1
                                    ${showExport
                                        ? 'border-[var(--indigo)] text-[var(--text-primary)] bg-[var(--indigo-glow)]'
                                        : 'border-[var(--border-bright)] text-[var(--text-secondary)] hover:border-[var(--indigo)] hover:text-[var(--text-primary)]'}`}
                            >
                                EXPORT
                                <span className="text-[8px] opacity-60">{showExport ? '▲' : '▼'}</span>
                            </button>
                            {showExport && (
                                <ExportDropdown data={data} onClose={() => setShowExport(false)} />
                            )}
                        </div>

                        {/* ── Share button + dropdown ── */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowShare(!showShare); setShowExport(false); }}
                                className="font-mono text-[10px] tracking-wider px-3 py-1.5 rounded text-white transition hover:-translate-y-0.5 flex items-center gap-1"
                                style={{ background: 'var(--indigo)', boxShadow: '0 0 16px var(--indigo-glow)' }}
                            >
                                SHARE
                                <span className="text-[8px] opacity-70">{showShare ? '▲' : '▼'}</span>
                            </button>
                            {showShare && (
                                <ShareDropdown data={data} onClose={() => setShowShare(false)} />
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. KPI boxes */}
                <div className="grid grid-cols-4 gap-2">
                    <KpiBox label="Avg Score" value={avgScore} color={scoreColor(avgScore)} />
                    <KpiBox label="% Positive" value={positivePct} color="#10B981" suffix="%" />
                    <KpiBox label="% Negative" value={negativePct} color="#EF4444" suffix="%" />
                    <KpiBox label="% Neutral" value={neutralPct} color="#F59E0B" suffix="%" />
                </div>

                {/* 4. Sentiment trend chart */}
                {!compact && trendData.length >= 2 && (
                    <MiniTrendChart data={trendData} delta={trendDelta} />
                )}

                <Divider />

                {/* 6. Top 3 emotions */}
                {topEmotions && topEmotions.length > 0 && (
                    <>
                        <div>
                            <SectionLabel>Dominant Emotions Across Batch</SectionLabel>
                            <div className="grid grid-cols-3 gap-2">
                                {topEmotions.slice(0, 3).map((em) => (
                                    <div
                                        key={em.name}
                                        className="flex flex-col items-center gap-1 rounded-lg p-3"
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                                    >
                                        <span className="text-lg">{em.emoji}</span>
                                        <span className="font-mono text-[8px] text-[var(--text-dim)] tracking-widest uppercase">
                                            {em.name}
                                        </span>
                                        <span className="font-mono text-[13px] font-bold text-[var(--text-primary)]">
                                            {Math.round(em.value * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Divider />
                    </>
                )}

                {/* 8. Per-row breakdown table */}
                {rows && rows.length > 0 && (
                    <>
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <SectionLabel>
                                    {canDrillDown ? (
                                        <span>Sample Breakdown <span className="text-[var(--indigo)] normal-case tracking-normal">· click any row to deep-dive</span></span>
                                    ) : 'Sample Breakdown'}
                                </SectionLabel>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-[var(--border)]">
                                {/* Header */}
                                <div
                                    className="grid gap-3 px-3 py-2"
                                    style={{
                                        gridTemplateColumns: '1fr 72px 36px 60px',
                                        background: 'var(--bg-elevated)',
                                        borderBottom: '1px solid var(--border)',
                                    }}
                                >
                                    {['Text Preview', 'Source', 'Score', 'Bar'].map((h) => (
                                        <span key={h} className="font-mono text-[8px] text-[var(--text-dim)] tracking-[2px] uppercase">{h}</span>
                                    ))}
                                </div>

                                {/* Rows */}
                                {visibleRows.map((row, i) => (
                                    <div
                                        key={row.id}
                                        onClick={() => canDrillDown && onRowClick?.(row)}
                                        className={`grid gap-3 px-3 py-2.5 items-center transition-all group
                                            ${canDrillDown ? 'cursor-pointer hover:bg-[#4F46E512]' : 'hover:bg-[#4F46E508]'}`}
                                        style={{
                                            gridTemplateColumns: '1fr 72px 36px 60px',
                                            borderBottom: i < visibleRows.length - 1 ? '1px solid var(--border)' : 'none',
                                        }}
                                        title={canDrillDown ? 'Click to see full analysis' : undefined}
                                    >
                                        {/* Text */}
                                        <span
                                            className="font-sans text-[12px] text-[var(--text-secondary)] truncate group-hover:text-[var(--text-primary)] transition-colors"
                                            title={row.text}
                                        >
                                            {row.text}
                                        </span>
                                        {/* Source */}
                                        {row.source ? (
                                            <span className="font-mono text-[8px] text-[var(--text-dim)] tracking-widest uppercase truncate">
                                                {row.source}
                                            </span>
                                        ) : (
                                            <span />
                                        )}
                                        {/* Score */}
                                        <span className="font-mono text-[12px] font-bold" style={{ color: scoreColor(row.score) }}>
                                            {row.score}
                                        </span>
                                        {/* Mini bar + drill arrow */}
                                        <div className="flex items-center gap-1">
                                            <MiniScoreBar score={row.score} />
                                            {canDrillDown && (
                                                <span className="text-[var(--indigo)] opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-0.5">›</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {rows.length > 5 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="mt-2 font-mono text-[10px] text-[var(--indigo)] hover:text-[var(--text-primary)] transition tracking-widest"
                                >
                                    {showAll ? '← Show less' : `View all ${rows.length} rows →`}
                                </button>
                            )}
                        </div>
                        <Divider />
                    </>
                )}

                {/* 10. Churn risk alert */}
                {!compact && churnRisk?.detected && (
                    <>
                        <div
                            className="rounded-lg p-4"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[#EF4444] text-base">⚠</span>
                                <span className="font-mono text-[10px] font-bold text-[#EF4444] tracking-[2px] uppercase">
                                    Churn Risk Detected
                                </span>
                            </div>
                            <p className="font-sans text-[12px] text-[var(--text-secondary)] leading-relaxed">
                                {churnRisk.count} {churnRisk.count === 1 ? 'entry' : 'entries'} scored below 20 — {churnRisk.reason}
                            </p>
                        </div>
                        <Divider />
                    </>
                )}

                {/* 11. Recommended actions */}
                {!compact && recommendedActions && recommendedActions.length > 0 && (
                    <div>
                        <SectionLabel>Recommended Actions</SectionLabel>
                        <div className="space-y-3">
                            {recommendedActions.slice(0, 3).map((action, i) => (
                                <div key={i} className="flex gap-3 items-start">
                                    <span
                                        className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold text-white"
                                        style={{ background: 'var(--indigo)', boxShadow: '0 0 12px var(--indigo-glow)' }}
                                    >
                                        {i + 1}
                                    </span>
                                    <div>
                                        <div className="font-mono text-[11px] font-bold text-[var(--text-primary)] mb-0.5">
                                            {action.title}
                                        </div>
                                        <div className="font-sans text-[12px] text-[var(--text-secondary)] leading-relaxed">
                                            {action.detail}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 12. Footer */}
                <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                        {rowCount} ROWS · 100% PROCESSED · {processingLabel}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" style={{ boxShadow: '0 0 6px #10B981' }} />
                        <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                            {fromCache ? 'CACHED · ' : ''}GEMINI 1.5 FLASH
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}
