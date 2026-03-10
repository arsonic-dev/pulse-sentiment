"use client";

import { useEffect, useRef } from 'react';

interface MiniTrendChartProps {
    /** Array of score values (0–100), e.g. last 7 data points */
    data: number[];
    delta?: number; // change from first to last (+/-)
}

export function MiniTrendChart({ data, delta }: MiniTrendChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const deltaPositive = (delta ?? 0) >= 0;
    const deltaFormatted = delta !== undefined
        ? `${deltaPositive ? '↑ +' : '↓ '}${Math.abs(delta).toFixed(1)} pts`
        : null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const padding = { left: 4, right: 4, top: 8, bottom: 8 };
        const innerW = w - padding.left - padding.right;
        const innerH = h - padding.top - padding.bottom;

        const minVal = Math.min(...data) - 5;
        const maxVal = Math.max(...data) + 5;
        const range = maxVal - minVal || 1;

        const toX = (i: number) => padding.left + (i / (data.length - 1)) * innerW;
        const toY = (v: number) => padding.top + innerH - ((v - minVal) / range) * innerH;

        // ── Draw gradient fill ───────────────────────────────────────────────
        const grad = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        grad.addColorStop(0, 'rgba(79,70,229,0.35)');
        grad.addColorStop(1, 'rgba(79,70,229,0)');

        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i < data.length; i++) {
            const cpX = (toX(i - 1) + toX(i)) / 2;
            ctx.bezierCurveTo(cpX, toY(data[i - 1]), cpX, toY(data[i]), toX(i), toY(data[i]));
        }
        ctx.lineTo(toX(data.length - 1), h - padding.bottom);
        ctx.lineTo(toX(0), h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // ── Draw line ───────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0]));
        for (let i = 1; i < data.length; i++) {
            const cpX = (toX(i - 1) + toX(i)) / 2;
            ctx.bezierCurveTo(cpX, toY(data[i - 1]), cpX, toY(data[i]), toX(i), toY(data[i]));
        }
        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#4F46E560';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ── Highlight last point ─────────────────────────────────────────────
        const lastX = toX(data.length - 1);
        const lastY = toY(data[data.length - 1]);
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = '#10B98180';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    }, [data]);

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">
                    Sentiment Trend
                </span>
                {deltaFormatted && (
                    <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: deltaPositive ? '#10B981' : '#EF4444' }}
                    >
                        {deltaFormatted}
                    </span>
                )}
            </div>

            <canvas
                ref={canvasRef}
                className="w-full block rounded"
                style={{ height: 60, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            />
        </div>
    );
}
