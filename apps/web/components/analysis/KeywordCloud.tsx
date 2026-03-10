"use client";

interface Keyword {
    word: string;
    sentiment: number; // -1 to 1
}

interface KeywordCloudProps {
    keywords: Keyword[];
}

function getKeywordStyle(sentiment: number) {
    if (sentiment > 0.2) {
        return {
            bg: 'bg-[#10B98115] border-[#10B98135] text-[#10B981]',
            arrow: '↑',
        };
    }
    if (sentiment < -0.2) {
        return {
            bg: 'bg-[#EF444415] border-[#EF444435] text-[#EF4444]',
            arrow: '↓',
        };
    }
    return {
        bg: 'bg-[#4F46E515] border-[#4F46E535] text-[#8B85FF]',
        arrow: '→',
    };
}

export function KeywordCloud({ keywords }: KeywordCloudProps) {
    if (!keywords || keywords.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 8).map((kw, i) => {
                const style = getKeywordStyle(kw.sentiment);
                return (
                    <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded border font-mono text-[11px] font-semibold cursor-default
                        transition-transform duration-150 hover:-translate-y-0.5 ${style.bg}`}
                    >
                        <span className="opacity-60 text-[10px]">{style.arrow}</span>
                        {kw.word}
                    </span>
                );
            })}
        </div>
    );
}
