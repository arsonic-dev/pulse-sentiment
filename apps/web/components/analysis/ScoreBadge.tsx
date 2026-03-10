"use client";

interface ScoreBadgeProps {
    label: 'positive' | 'neutral' | 'negative';
    size?: 'sm' | 'md';
}

const CONFIG = {
    positive: {
        bg: 'bg-[#10B98120]',
        border: 'border-[#10B98140]',
        text: 'text-[#10B981]',
        dot: 'bg-[#10B981]',
        shadow: 'shadow-[0_0_12px_#10B98140]',
    },
    neutral: {
        bg: 'bg-[#F59E0B20]',
        border: 'border-[#F59E0B40]',
        text: 'text-[#F59E0B]',
        dot: 'bg-[#F59E0B]',
        shadow: 'shadow-[0_0_12px_#F59E0B40]',
    },
    negative: {
        bg: 'bg-[#EF444420]',
        border: 'border-[#EF444440]',
        text: 'text-[#EF4444]',
        dot: 'bg-[#EF4444]',
        shadow: 'shadow-[0_0_12px_#EF444440]',
    },
};

export function ScoreBadge({ label, size = 'md' }: ScoreBadgeProps) {
    const cfg = CONFIG[label];
    const padSize = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
    const textSize = size === 'sm' ? 'text-[9px]' : 'text-[11px]';

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded ${padSize} ${cfg.bg} ${cfg.border} border ${cfg.text} ${cfg.shadow} font-mono ${textSize} font-bold tracking-widest uppercase`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
            {label}
        </span>
    );
}
