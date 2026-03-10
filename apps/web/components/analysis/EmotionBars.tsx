"use client";

import { useEffect, useRef } from 'react';

interface EmotionBarsProps {
    emotions: {
        joy: number;
        anger: number;
        fear: number;
        sadness: number;
        surprise: number;
        disgust: number;
    };
}

const EMOTION_CONFIG = [
    { key: 'joy', label: 'JOY', color: '#10B981', glow: '#10B98160' },
    { key: 'surprise', label: 'SURPRISE', color: '#F59E0B', glow: '#F59E0B60' },
    { key: 'anger', label: 'ANGER', color: '#EF4444', glow: '#EF444460' },
    { key: 'sadness', label: 'SADNESS', color: '#4A9EDB', glow: '#4A9EDB60' },
    { key: 'fear', label: 'FEAR', color: '#7C3AED', glow: '#7C3AED60' },
    { key: 'disgust', label: 'DISGUST', color: '#6B7280', glow: '#6B728060' },
] as const;

export function EmotionBars({ emotions }: EmotionBarsProps) {
    const barRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Animate bars from 0 to full width on mount
        barRefs.current.forEach((bar, i) => {
            if (!bar) return;
            const key = EMOTION_CONFIG[i].key;
            const value = emotions[key] ?? 0;
            bar.style.width = '0%';
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (bar) {
                        bar.style.width = `${Math.round(value * 100)}%`;
                    }
                }, 80 + i * 60);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(emotions)]);

    return (
        <div className="space-y-2.5">
            {EMOTION_CONFIG.map((cfg, i) => {
                const value = emotions[cfg.key] ?? 0;
                const pct = Math.round(value * 100);
                const isHigh = pct >= 50;

                return (
                    <div key={cfg.key} className="flex items-center gap-3">
                        {/* Emotion label — fixed width */}
                        <span
                            className="font-mono text-[9px] font-semibold tracking-[2px] uppercase shrink-0"
                            style={{ width: 52, color: cfg.color }}
                        >
                            {cfg.label}
                        </span>

                        {/* Track */}
                        <div className="flex-1 h-[5px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div
                                ref={(el) => { barRefs.current[i] = el; }}
                                className="h-full rounded-full transition-all duration-[1000ms] ease-out"
                                style={{
                                    width: '0%',
                                    background: cfg.color,
                                    boxShadow: isHigh ? `0 0 8px ${cfg.glow}` : 'none',
                                }}
                            />
                        </div>

                        {/* Percentage */}
                        <span
                            className="font-mono text-[10px] font-bold shrink-0 tabular-nums"
                            style={{ width: 28, textAlign: 'right', color: cfg.color, opacity: pct < 5 ? 0.35 : 1 }}
                        >
                            {pct}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
