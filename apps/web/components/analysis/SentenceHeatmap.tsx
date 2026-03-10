"use client";

interface Sentence {
    text: string;
    sentiment: number; // -1 to 1
}

interface SentenceHeatmapProps {
    sentences: Sentence[];
}

function getSentenceStyle(sentiment: number): React.CSSProperties {
    if (sentiment > 0.3) {
        return {
            background: 'rgba(16,185,129,0.12)',
            borderBottom: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 3,
        };
    }
    if (sentiment < -0.3) {
        return {
            background: 'rgba(239,68,68,0.12)',
            borderBottom: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 3,
        };
    }
    return {};
}

export function SentenceHeatmap({ sentences }: SentenceHeatmapProps) {
    if (!sentences || sentences.length === 0) return null;

    return (
        <div>
            <p
                className="font-sans text-[13px] leading-[1.9] text-[var(--text-secondary)]"
                style={{ wordBreak: 'break-word' }}
            >
                {sentences.map((s, i) => (
                    <span
                        key={i}
                        className="inline px-0.5 mx-0.5 transition-all"
                        style={getSentenceStyle(s.sentiment)}
                        title={`Sentiment: ${s.sentiment.toFixed(2)}`}
                    >
                        {s.text.trim()}
                        {i < sentences.length - 1 ? ' ' : ''}
                    </span>
                ))}
            </p>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }} />
                    <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Positive</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }} />
                    <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Neutral</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)' }} />
                    <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-widest">Negative</span>
                </div>
            </div>
        </div>
    );
}
