"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pulseApi, AnalysisRow } from '@/lib/api';
import { SentimentAnalysisResult } from '@pulse/shared';
import { RowDrawer } from '@/components/analysis/RowDrawer';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

function scoreColor(s: number) {
    return s >= 60 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
}

function ScorePill({ score, label }: { score: number | null; label: string | null }) {
    const color = scoreColor(score ?? 50);
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold"
            style={{ background: `${color}15`, border: `1px solid ${color}40`, color }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            {label?.toUpperCase() ?? '--'}
        </span>
    );
}

function SourceBadge({ source }: { source: string | null }) {
    const isBatch = source === 'batch';
    return (
        <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold tracking-wider uppercase
            ${isBatch ? 'bg-[#7C3AED20] text-[#A78BFA] border border-[#7C3AED40]' : 'bg-[var(--bg-elevated)] text-[var(--text-dim)] border border-[var(--border)]'}`}>
            {isBatch ? 'Batch' : 'Single'}
        </span>
    );
}

export default function HistoryPage() {
    const [page, setPage] = useState(1);
    const [drawer, setDrawer] = useState<AnalysisRow | null>(null);
    const qc = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['analyses', page],
        queryFn: () => pulseApi.getAnalyses(page, 20),
    });

    const deleteMut = useMutation({
        mutationFn: pulseApi.deleteAnalysis,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['analyses'] }),
    });

    const drawerResult = drawer ? {
        score: drawer.score ?? 50,
        confidence: drawer.confidence ?? 70,
        label: ((drawer.label ?? 'neutral') as 'positive' | 'neutral' | 'negative'),
        summary: drawer.summary ?? '',
        emotions: (drawer.emotions ?? { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 }) as SentimentAnalysisResult['emotions'],
        keywords: (drawer.keywords ?? []) as SentimentAnalysisResult['keywords'],
        sentences: (drawer.sentences ?? []) as SentimentAnalysisResult['sentences'],
    } as SentimentAnalysisResult : null;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">History</span>
                <h1 className="font-mono text-3xl font-bold mt-1">Analysis History</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    All your past analyses — click any row to view the full result.
                </p>
            </div>

            {isLoading && (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                    ))}
                </div>
            )}

            {isError && (
                <div className="p-4 rounded-xl font-mono text-sm text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Failed to load history. Make sure the API is running.
                </div>
            )}

            {data && (
                <>
                    <div className="rounded-xl overflow-hidden"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        {/* Table header */}
                        <div className="grid px-4 py-2.5 border-b border-[var(--border)]"
                            style={{ gridTemplateColumns: '1fr 100px 70px 80px 80px 40px', background: 'var(--bg-elevated)' }}>
                            {['Text', 'Date', 'Origin', 'Score', 'Label', ''].map(h => (
                                <span key={h} className="font-mono text-[8px] tracking-[2px] uppercase text-[var(--text-dim)]">{h}</span>
                            ))}
                        </div>

                        {data.data.length === 0 && (
                            <div className="p-8 text-center font-mono text-[12px] text-[var(--text-dim)]">
                                No analyses yet. <a href="/dashboard/analyze" className="text-[var(--indigo)] hover:text-white transition">Run your first analysis →</a>
                            </div>
                        )}

                        {data.data.map((row, i) => (
                            <div
                                key={row.id}
                                onClick={() => setDrawer(row)}
                                className="grid items-center px-4 py-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition group"
                                style={{
                                    gridTemplateColumns: '1fr 100px 70px 80px 80px 40px',
                                    borderBottom: i < data.data.length - 1 ? '1px solid var(--border)' : 'none',
                                }}
                            >
                                <span className="font-sans text-[12px] text-[var(--text-secondary)] truncate group-hover:text-white transition pr-3">
                                    {row.inputText}
                                </span>
                                <span className="font-mono text-[10px] text-[var(--text-dim)]">
                                    {new Date(row.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex">
                                    <SourceBadge source={row.source} />
                                </div>
                                <span className="font-mono text-[14px] font-bold" style={{ color: scoreColor(row.score ?? 50) }}>
                                    {row.score ?? '--'}
                                </span>
                                <ScorePill score={row.score} label={row.label} />
                                <button
                                    onClick={e => { e.stopPropagation(); deleteMut.mutate(row.id); }}
                                    className="text-[var(--text-dim)] hover:text-[#EF4444] transition opacity-0 group-hover:opacity-100"
                                    title="Delete"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {data.meta.pages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <span className="font-mono text-[10px] text-[var(--text-dim)]">
                                Page {data.meta.page} of {data.meta.pages} · {data.meta.total} total
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-white disabled:opacity-30 transition"
                                    style={{ border: '1px solid var(--border)' }}>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => setPage(p => Math.min(data.meta.pages, p + 1))} disabled={page === data.meta.pages}
                                    className="w-8 h-8 rounded flex items-center justify-center text-[var(--text-secondary)] hover:text-white disabled:opacity-30 transition"
                                    style={{ border: '1px solid var(--border)' }}>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Drill-down drawer */}
            {drawer && drawerResult && (
                <RowDrawer result={drawerResult} text={drawer.inputText} onClose={() => setDrawer(null)} />
            )}
        </div>
    );
}
