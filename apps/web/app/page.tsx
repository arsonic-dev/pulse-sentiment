"use client";

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ParticleField from '@/components/landing/ParticleField';
import { useAntigravity } from '@/hooks/useAntigravity';
import AnalyzeModal from '@/components/landing/AnalyzeModal';
import { AnalyzeResponse } from '@/lib/api';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import IndividualResultCard from '@/components/analysis/IndividualResultCard';
import CompanyResultCard, { CompanyCardData, BatchRow } from '@/components/analysis/CompanyResultCard';
import { RowDrawer } from '@/components/analysis/RowDrawer';
import { SentimentAnalysisResult } from '@pulse/shared';

// Three.js sections — dynamic import so they never run on the server
const BlobSection = dynamic(() => import('@/components/landing/BlobSection'), { ssr: false });
const GlobeSection = dynamic(() => import('@/components/landing/GlobeSection'), { ssr: false });

export default function LandingPage() {
    const mockupRef = useRef<HTMLDivElement>(null);
    useAntigravity(mockupRef);

    const resultsRef = useRef<HTMLDivElement>(null);

    // ── Modal state ──────────────────────────────────────────────────────────
    const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);

    // ── Result states ────────────────────────────────────────────────────────
    const [individualResult, setIndividualResult] = useState<(SentimentAnalysisResult & { id?: string; fromCache?: boolean }) | null>(null);
    const [individualAt, setIndividualAt] = useState<Date | undefined>(undefined);

    const [companyData, setCompanyData] = useState<CompanyCardData | null>(null);

    // ── Drawer state (row drill-down from CompanyCard) ───────────────────────
    const [drawerRow, setDrawerRow] = useState<BatchRow | null>(null);

    // ── Scroll-reveal observer ───────────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, { threshold: 0.15 });

        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(r => observer.observe(r));
        return () => reveals.forEach(r => observer.unobserve(r));
    }, []);

    // ── After analysis: scroll to results section ────────────────────────────
    const scrollToResults = () => {
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleSingleSuccess = (data: AnalyzeResponse) => {
        setIndividualResult(data.data);
        setIndividualAt(new Date());
        setCompanyData(null); // clear batch if switching modes
        scrollToResults();
    };

    const handleBatchSuccess = (data: CompanyCardData) => {
        setCompanyData(data);
        setIndividualResult(null); // clear single if switching modes
        scrollToResults();
    };

    const handleRowClick = (row: BatchRow) => {
        if (row.fullResult) setDrawerRow(row);
    };

    return (
        <main className="relative min-h-screen text-[var(--text-primary)] z-10">
            <ParticleField />

            {/* Floating background numbers */}
            <div className="absolute top-[20%] left-[10%] text-6xl font-mono text-positive opacity-10 animate-floatNum z-0" style={{ animationDelay: '0s' }}>96</div>
            <div className="absolute top-[60%] right-[15%] text-7xl font-mono text-negative opacity-10 animate-floatNum z-0" style={{ animationDelay: '1s' }}>12</div>
            <div className="absolute top-[30%] right-[30%] text-5xl font-mono text-indigo opacity-10 animate-floatNum z-0" style={{ animationDelay: '2s' }}>87</div>

            {/* ── NAV ──────────────────────────────────────────────────────── */}
            <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-[var(--border)]">
                <div className="font-mono font-bold text-2xl tracking-tighter">PULSE_</div>
                <div className="space-x-4 flex items-center">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="text-[var(--text-secondary)] hover:text-white transition font-mono text-sm uppercase tracking-widest px-4 py-2">Sign In</button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="bg-[var(--indigo)] hover:bg-[var(--violet)] text-white font-mono text-sm px-5 py-2.5 rounded-md shadow-glow-primary transition transform hover:-translate-y-0.5">Try Free</button>
                        </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                        <Link href="/dashboard">
                            <button className="text-[var(--text-secondary)] hover:text-white transition font-mono text-sm uppercase tracking-widest px-4 py-2 mr-4">Dashboard</button>
                        </Link>
                        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-10 h-10 border border-[var(--border)] rounded-md" } }} />
                    </SignedIn>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════════════════════
                HERO — always shows static antigravity mockup, never replaced
            ══════════════════════════════════════════════════════════════ */}
            <section className="relative z-20 max-w-7xl mx-auto px-8 pt-32 pb-20 flex flex-col lg:flex-row items-center gap-16">
                {/* Left: copy + CTAs */}
                <div className="flex-1 space-y-6">
                    <span className="section-label">[ REAL-TIME INTELLIGENCE ]</span>
                    <h1 className="text-5xl lg:text-7xl font-mono font-bold leading-tight tracking-tight">
                        AI That Understands<br />Human Emotion.
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed pt-4 pb-8">
                        Advanced sentiment and emotion analysis powered by high-speed LLMs.
                        Understand opinions, detect emotions, and uncover insights from any text in seconds.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setIsAnalyzeOpen(true)}
                            className="bg-[var(--indigo)] hover:bg-[var(--violet)] text-white font-mono text-sm px-6 py-3 rounded-md shadow-glow-primary transition transform hover:-translate-y-0.5"
                        >
                            Analyze Text
                        </button>
                        <button
                            onClick={() => setIsAnalyzeOpen(true)}
                            className="border border-[var(--border-bright)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--indigo)] font-mono text-sm px-6 py-3 rounded-md transition bg-transparent"
                        >
                            Upload CSV →
                        </button>
                    </div>

                    {/* Hint if results are available */}
                    {(individualResult || companyData) && (
                        <button
                            onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="flex items-center gap-2 text-[var(--indigo)] font-mono text-[11px] tracking-widest uppercase hover:text-white transition animate-fadeUp mt-2"
                        >
                            <span className="animate-bounce">↓</span>
                            View your results
                        </button>
                    )}
                </div>

                {/* Right: static antigravity demo card — NEVER replaced */}
                <div className="flex-1 w-full lg:w-auto mt-12 lg:mt-0 antigravity-wrapper flex justify-center">
                    <div
                        ref={mockupRef}
                        id="heroMockup"
                        className="antigravity-card resting w-full max-w-md glass-panel p-6 flex flex-col gap-5"
                    >
                        <div className="font-mono text-[9px] tracking-[3px] uppercase text-[var(--text-dim)]">
                            Individual · Personal Analysis
                        </div>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-[9px] font-mono text-[var(--text-dim)] tracking-[3px] uppercase mb-2">Status</div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#4F46E515] border border-[#4F46E535] text-[#8B85FF] font-mono text-[11px] font-bold tracking-widest uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] animate-pulse" /> AWAITING
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-mono text-[var(--text-dim)] tracking-[3px] uppercase mb-1">Score</div>
                                <span className="font-mono text-[56px] font-bold leading-none text-[var(--text-dim)]">--</span>
                            </div>
                        </div>
                        <div className="h-px bg-[var(--border)]" />
                        <div>
                            <div className="font-mono text-[9px] tracking-[3px] uppercase text-[var(--text-dim)] mb-3">Emotions</div>
                            {(['JOY', 'SURPRISE', 'ANGER', 'SADNESS'] as const).map((e, i) => (
                                <div key={e} className="flex items-center gap-3 mb-2.5">
                                    <span className="font-mono text-[9px] tracking-[2px] text-[var(--text-dim)] uppercase" style={{ width: 52 }}>{e}</span>
                                    <div className="flex-1 h-[5px] bg-[var(--bg-elevated)] rounded-full">
                                        <div className="h-full rounded-full bg-[var(--border)]" style={{ width: `${[30, 15, 10, 20][i]}%` }} />
                                    </div>
                                    <span className="font-mono text-[10px] text-[var(--text-dim)]" style={{ width: 28, textAlign: 'right' }}>--</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--indigo)] pl-3">
                            &quot;Paste text in the analyzer to instantly extract sentiment, emotions, and AI insights...&quot;
                        </div>
                        <div className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                            AWAITING INPUT · GEMINI 1.5 FLASH
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════
                RESULTS — appears below hero after analysis completes
            ══════════════════════════════════════════════════════════════ */}
            {(individualResult || companyData) && (
                <section
                    ref={resultsRef}
                    className="relative z-20 border-t border-[var(--border)]"
                    style={{ background: 'var(--bg-surface)', backgroundImage: 'var(--glow-positive)' }}
                >
                    <div className="max-w-7xl mx-auto px-8 py-16">
                        <div className="text-center mb-12">
                            <span className="section-label">
                                {companyData ? '[ BATCH ANALYSIS RESULTS ]' : '[ ANALYSIS RESULTS ]'}
                            </span>
                            <h2 className="text-3xl font-mono font-bold mt-4">
                                {companyData ? 'Your Batch Report' : 'Your Analysis'}
                            </h2>
                            {companyData && (
                                <p className="text-[var(--text-secondary)] mt-2 font-sans text-sm">
                                    Click any row in the breakdown table to see its full individual analysis.
                                </p>
                            )}
                        </div>

                        {/* The result card — centered */}
                        <div className="flex justify-center">
                            {companyData ? (
                                <div className="w-full" style={{ maxWidth: 600 }}>
                                    <CompanyResultCard
                                        data={companyData}
                                        onRowClick={handleRowClick}
                                    />
                                </div>
                            ) : individualResult ? (
                                <IndividualResultCard
                                    result={individualResult}
                                    analyzedAt={individualAt}
                                />
                            ) : null}
                        </div>

                        {/* Re-analyze button */}
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={() => setIsAnalyzeOpen(true)}
                                className="bg-[var(--indigo)] hover:bg-[var(--violet)] text-white font-mono text-sm px-6 py-3 rounded-md shadow-glow-primary transition transform hover:-translate-y-0.5"
                            >
                                {companyData ? 'Upload Another CSV' : 'Analyze More Text'}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* ── FEATURES ─────────────────────────────────────────────────── */}
            <section className="relative z-20 max-w-7xl mx-auto px-8 py-32 border-t border-[var(--border)]">
                <div className="text-center mb-16 reveal">
                    <span className="section-label">[ PLATFORM CAPABILITIES ]</span>
                    <h2 className="text-3xl font-mono font-bold mt-4">Built for scale.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { tag: "Real-time Processing", score: "96", color: "positive" },
                        { tag: "Batch Analytics", score: "10k+", color: "indigo" },
                        { tag: "Emotion Detection", score: "6", color: "neutral" },
                        { tag: "REST API", score: "<1s", color: "positive" },
                    ].map((item, i) => (
                        <div key={i} className="glass-panel p-8 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                            <div className="text-2xl font-mono font-bold mb-4">{item.score}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-mono uppercase tracking-widest">{item.tag}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
            <section className="relative z-20 max-w-7xl mx-auto px-8 py-32 border-t border-[var(--border)]">
                <div className="text-center mb-16 reveal">
                    <span className="section-label">[ WORKFLOW ]</span>
                    <h2 className="text-3xl font-mono font-bold mt-4">Simple Integration.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { step: "01", title: "Ingest", desc: "Send text, reviews, or chat logs via our REST API or dashboard." },
                        { step: "02", title: "Process", desc: "Our models categorize sentiment and extract top emotional vectors in ms." },
                        { step: "03", title: "Analyze", desc: "View aggregations, trends, and sudden shifts in user sentiment." },
                    ].map((idx, i) => (
                        <div key={i} className="glass-panel p-8 relative reveal" style={{ transitionDelay: `${i * 150}ms` }}>
                            <div className="text-5xl font-mono font-bold text-[var(--border-bright)] absolute top-6 right-6 opacity-50">{idx.step}</div>
                            <h3 className="text-xl font-mono font-bold mb-3 mt-4 text-[var(--text-primary)]">{idx.title}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{idx.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── GLOBE — GLOBAL INTELLIGENCE ──────────────────────────────── */}
            <GlobeSection />

            {/* ── PRICING ──────────────────────────────────────────────────── */}
            <section className="relative z-20 max-w-7xl mx-auto px-8 py-32 border-t border-[var(--border)]">
                <div className="text-center mb-16 reveal">
                    <span className="section-label">[ PLANS ]</span>
                    <h2 className="text-3xl font-mono font-bold mt-4">Transparent Pricing.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-8 reveal" style={{ transitionDelay: '0ms' }}>
                        <div className="text-[var(--text-secondary)] font-mono text-sm tracking-widest uppercase mb-4">Hobby</div>
                        <div className="text-4xl font-mono font-bold mb-6">$0<span className="text-lg text-[var(--text-dim)]">/mo</span></div>
                        <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8">
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> 10,000 Analyses / mo</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Basic Emotion Detection</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Community Support</li>
                        </ul>
                        <button className="w-full border border-[var(--border-bright)] hover:border-[var(--indigo)] text-white font-mono text-sm px-6 py-3 rounded-md transition">Start Free</button>
                    </div>
                    <div className="glass-panel p-8 border-[var(--indigo)] relative reveal" style={{ transitionDelay: '150ms', boxShadow: '0 0 40px var(--indigo-glow)' }}>
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--indigo)] text-white font-mono text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">Popular</div>
                        <div className="text-[var(--indigo)] font-mono text-sm tracking-widest uppercase mb-4">Pro</div>
                        <div className="text-4xl font-mono font-bold mb-6">$49<span className="text-lg text-[var(--text-dim)]">/mo</span></div>
                        <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8">
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> 500,000 Analyses / mo</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Advanced Vectors</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Priority API Access</li>
                        </ul>
                        <button className="w-full bg-[var(--indigo)] hover:bg-[var(--violet)] text-white font-mono text-sm px-6 py-3 rounded-md transition shadow-glow-primary">Upgrade Pro</button>
                    </div>
                    <div className="glass-panel p-8 reveal" style={{ transitionDelay: '300ms' }}>
                        <div className="text-[var(--text-secondary)] font-mono text-sm tracking-widest uppercase mb-4">Enterprise</div>
                        <div className="text-4xl font-mono font-bold mb-6">Custom</div>
                        <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8">
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Unlimited Analyses</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Custom Model Tuning</li>
                            <li className="flex items-center"><span className="text-[var(--positive)] mr-2">✓</span> Dedicated Support</li>
                        </ul>
                        <button className="w-full border border-[var(--border-bright)] hover:border-[var(--text-secondary)] text-white font-mono text-sm px-6 py-3 rounded-md transition">Contact Sales</button>
                    </div>
                </div>
            </section>

            {/* ── TECH STACK ───────────────────────────────────────────────── */}
            <section className="relative z-20 max-w-7xl mx-auto px-8 py-24 border-t border-[var(--border)]">
                <div className="text-center mb-12 reveal">
                    <span className="section-label">[ ARCHITECTURE ]</span>
                    <h2 className="text-3xl font-mono font-bold mt-4">Powered by modern infra.</h2>
                </div>
                <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto reveal">
                    {["Next.js", "TypeScript", "Tailwind CSS", "Express.js", "PostgreSQL", "Redis", "BullMQ", "Gemini AI", "Groq"].map((tech, i) => (
                        <div key={i} className="px-6 py-3 glass-panel text-sm font-mono text-[var(--text-secondary)]">{tech}</div>
                    ))}
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────────── */}
            <footer className="relative z-20 border-t border-[var(--border)] bg-[var(--bg-surface)] py-16 mt-16">
                <div className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
                    <div className="font-mono font-bold text-2xl tracking-tighter mb-4">PULSE_</div>
                    <p className="text-[var(--text-secondary)] text-sm max-w-md mb-8">
                        The definitive sentiment intelligence platform for modern engineering and product teams.
                    </p>
                    <button
                        onClick={() => setIsAnalyzeOpen(true)}
                        className="bg-[var(--indigo)] hover:bg-[var(--violet)] text-white font-mono text-sm px-8 py-4 rounded-md shadow-glow-primary transition transform hover:-translate-y-0.5 mb-12"
                    >
                        Get Started for Free
                    </button>
                    <div className="w-full flex justify-between items-center pt-8 border-t border-[var(--border)] text-[10px] uppercase tracking-widest font-mono text-[var(--text-dim)]">
                        <div className="flex gap-6">
                            <span className="cursor-pointer hover:text-[var(--text-secondary)] transition">Terms</span>
                            <span className="cursor-pointer hover:text-[var(--text-secondary)] transition">Privacy</span>
                        </div>
                        <div>© 2026 Pulse Intelligence</div>
                    </div>
                </div>
            </footer>

            {/* ── ANALYZE MODAL ────────────────────────────────────────────── */}
            <AnalyzeModal
                isOpen={isAnalyzeOpen}
                onClose={() => setIsAnalyzeOpen(false)}
                onSuccess={handleSingleSuccess}
                onBatchSuccess={handleBatchSuccess}
            />

            {/* ── ROW DRAWER (individual drill-down from batch) ─────────────── */}
            {drawerRow?.fullResult && (
                <RowDrawer
                    result={drawerRow.fullResult}
                    text={drawerRow.text}
                    onClose={() => setDrawerRow(null)}
                />
            )}
        </main>
    );
}
