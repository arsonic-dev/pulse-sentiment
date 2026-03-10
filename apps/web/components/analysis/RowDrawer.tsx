"use client";

import { useEffect, useRef } from 'react';
import { SentimentAnalysisResult } from '@pulse/shared';
import IndividualResultCard from './IndividualResultCard';

interface RowDrawerProps {
    result: (SentimentAnalysisResult & { fromCache?: boolean }) | null;
    text?: string;
    onClose: () => void;
}

export function RowDrawer({ result, text, onClose }: RowDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Prevent body scroll while open
    useEffect(() => {
        document.body.style.overflow = result ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [result]);

    if (!result) return null;

    return (
        <div className="fixed inset-0 z-[60] flex">
            {/* Backdrop */}
            <div
                className="flex-1 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={onClose}
                aria-label="Close drawer"
            />

            {/* Drawer panel */}
            <div
                ref={drawerRef}
                className="w-full max-w-[460px] h-full flex flex-col animate-slideInRight"
                style={{
                    background: 'var(--bg-base)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
                }}
            >
                {/* Drawer header */}
                <div
                    className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ borderBottom: '1px solid var(--border)' }}
                >
                    <div>
                        <div className="font-mono text-[9px] tracking-[3px] uppercase text-[var(--text-dim)]">
                            Individual · Row Detail
                        </div>
                        <div className="font-mono text-[12px] font-bold text-[var(--text-primary)] mt-0.5">
                            Deep Analysis
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-bright)] transition font-mono text-sm"
                    >
                        ✕
                    </button>
                </div>

                {/* Original text pill (if available) */}
                {text && (
                    <div
                        className="mx-4 mt-4 p-3 rounded-lg shrink-0"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    >
                        <div className="font-mono text-[8px] tracking-[3px] uppercase text-[var(--text-dim)] mb-1.5">
                            Original Text
                        </div>
                        <p className="font-sans text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                            {text}
                        </p>
                    </div>
                )}

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    <IndividualResultCard
                        result={result}
                        charCount={text?.length}
                        analyzedAt={new Date()}
                    />
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-3 shrink-0 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border)' }}
                >
                    <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest">
                        ESC to close
                    </span>
                    <button
                        onClick={onClose}
                        className="font-mono text-[10px] tracking-wider px-4 py-2 rounded border border-[var(--border-bright)] text-[var(--text-secondary)] hover:border-[var(--indigo)] hover:text-white transition"
                    >
                        ← Back to Batch
                    </button>
                </div>
            </div>
        </div>
    );
}
