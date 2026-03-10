"use client";

import { useQuery } from '@tanstack/react-query';
import { pulseApi } from '@/lib/api';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ScanText, History, FolderOpen } from 'lucide-react';

const EMOTION_EMOJI: Record<string, string> = {
    joy: '😊', anger: '😠', fear: '😨', sadness: '😢', surprise: '😲', disgust: '🤢',
};

function scoreColor(s: number) {
    return s >= 60 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="rounded-xl p-5 flex flex-col gap-1"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <span className="font-mono text-[9px] tracking-[3px] uppercase text-[var(--text-dim)]">{label}</span>
            <span className="font-mono text-[32px] font-bold text-[var(--text-primary)] leading-none">{value}</span>
            {sub && <span className="font-mono text-[10px] text-[var(--text-dim)]">{sub}</span>}
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useUser();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => pulseApi.getDashboardStats().then(r => r.data),
        refetchInterval: 30_000,
    });

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Overview</span>
                <h1 className="font-mono text-3xl font-bold mt-1">
                    Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
                    {user?.firstName ?? 'there'} 👋
                </h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Here&apos;s what&apos;s happening with your sentiment data.</p>
            </div>

            {isLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                    ))}
                </div>
            )}

            {isError && (
                <div className="p-4 rounded-xl mb-8 font-mono text-sm text-[#EF4444]"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Could not load dashboard stats. Make sure you&apos;re signed in and the API is running.
                </div>
            )}

            {data && (
                <>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <KpiCard label="Total Analyses" value={data.totalAnalyses.toLocaleString()} />
                        <KpiCard label="Avg Score" value={data.avgScore} sub="out of 100" />
                        <KpiCard label="Used Today" value={data.usageToday} sub="analyses" />
                        <KpiCard
                            label="Top Emotion"
                            value={`${EMOTION_EMOJI[data.topEmotion] ?? '❓'} ${data.topEmotion}`}
                        />
                    </div>

                    {/* Trend mini-chart placeholder */}
                    {data.trendData.length >= 2 && (
                        <div className="rounded-xl p-5 mb-8"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <div className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase mb-3">
                                Sentiment Trend (last {data.trendData.length} analyses)
                            </div>
                            <div className="flex items-end gap-1 h-16">
                                {data.trendData.map((s, i) => (
                                    <div key={i} className="flex-1 rounded-sm transition-all"
                                        style={{ height: `${s}%`, background: scoreColor(s), opacity: 0.8 }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent analyses */}
                    {data.recentAnalyses.length > 0 && (
                        <div className="rounded-xl overflow-hidden mb-8"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Recent Analyses</span>
                                <Link href="/dashboard/history" className="font-mono text-[10px] text-[var(--indigo)] hover:text-white transition">
                                    View all →
                                </Link>
                            </div>
                            {data.recentAnalyses.map(row => (
                                <div key={row.id}
                                    className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-elevated)] transition">
                                    <span className="font-mono text-[13px] font-bold" style={{ color: scoreColor(row.score ?? 50), width: 36 }}>
                                        {row.score ?? '--'}
                                    </span>
                                    <span className="flex-1 font-sans text-[12px] text-[var(--text-secondary)] truncate">
                                        {row.inputText}
                                    </span>
                                    <span className="font-mono text-[9px] text-[var(--text-dim)] shrink-0">
                                        {new Date(row.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Quick-action cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { href: '/dashboard/analyze', icon: ScanText, label: 'New Analysis', desc: 'Analyze a piece of text now' },
                    { href: '/dashboard/history', icon: History, label: 'History', desc: 'Browse all past analyses' },
                    { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects', desc: 'Organize analyses into projects' },
                ].map(({ href, icon: Icon, label, desc }) => (
                    <Link key={href} href={href}
                        className="flex items-center gap-4 p-5 rounded-xl transition group hover:-translate-y-0.5"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--indigo-glow)', border: '1px solid var(--indigo)' }}>
                            <Icon className="w-5 h-5 text-[var(--indigo)]" />
                        </div>
                        <div>
                            <div className="font-mono text-[13px] font-bold text-[var(--text-primary)] group-hover:text-white transition">{label}</div>
                            <div className="font-mono text-[10px] text-[var(--text-dim)] mt-0.5">{desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
