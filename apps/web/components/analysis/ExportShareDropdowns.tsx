"use client";

import { useEffect, useRef, useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { CompanyCardData } from './CompanyResultCard';

// ─── Tiny brand SVGs ─────────────────────────────────────────────────────────

const PdfIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="3" y="2" width="14" height="18" rx="2" fill="#EF4444" opacity="0.15" stroke="#EF4444" strokeWidth="1.5" />
        <rect x="3" y="2" width="14" height="7" rx="2" fill="#EF4444" />
        <text x="10" y="8.5" fontSize="4" fontWeight="bold" fill="white" textAnchor="middle">PDF</text>
        <path d="M7 13h6M7 16h4" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15 6h4l-4-4v4z" fill="#EF4444" opacity="0.6" />
    </svg>
);

const DocsIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="3" y="2" width="14" height="18" rx="2" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
        <rect x="3" y="2" width="14" height="7" rx="2" fill="#2563EB" />
        <text x="10" y="8.5" fontSize="5" fontWeight="bold" fill="white" textAnchor="middle">W</text>
        <path d="M7 13h6M7 16h4" stroke="#2563EB" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M15 6h4l-4-4v4z" fill="#2563EB" opacity="0.6" />
    </svg>
);

const CsvIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#10B981" opacity="0.15" stroke="#10B981" strokeWidth="1.4" />
        <path d="M2 8h20M8 4v16" stroke="#10B981" strokeWidth="1.2" />
        <path d="M2 12h20M2 16h20" stroke="#10B981" strokeWidth="0.8" strokeDasharray="3 2" />
    </svg>
);

const GmailLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="#fff" />
        <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="1.5" fill="none" />
        <path d="M2 6v12h3.5V10L2 6z" fill="#4285F4" />
        <path d="M22 6v12h-3.5V10L22 6z" fill="#34A853" />
        <path d="M5.5 10v8h13V10L12 13 5.5 10z" fill="#FBBC05" opacity="0.15" />
    </svg>
);

const DriveLogo = () => (
    <svg viewBox="0 0 87.3 78" className="w-5 h-5">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a7.3 7.3 0 0 0 1 3.65z" fill="#0066DA" />
        <path d="M43.65 25L29.9 1.2a8.4 8.4 0 0 0-3.3 3.3L1 61.5a7.3 7.3 0 0 0-1 3.65h27.5z" fill="#00AC47" />
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25a7.3 7.3 0 0 0 1-3.65H59.85l5.85 11.5z" fill="#EA4335" />
        <path d="M43.65 25L57.4 1.2C56.05.43 54.5 0 52.85 0H34.45c-1.65 0-3.2.43-4.55 1.2z" fill="#00832D" />
        <path d="M59.85 53.5H27.5L13.75 77.1c1.35.77 2.9 1.2 4.55 1.2h50.7c1.65 0 3.2-.43 4.55-1.2z" fill="#2684FC" />
        <path d="M73.4 26.5l-13-22.5A8.4 8.4 0 0 0 57.1 1L43.35 25l16.5 28.5h27.45a7.3 7.3 0 0 0-1-3.65z" fill="#FFBA00" />
    </svg>
);

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#25D366">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.06L2 22l5.06-1.36A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M8.53 7.5c.15 0 .32.01.46.01.2 0 .4.1.5.28l1.27 2.2c.13.22.08.5-.1.68l-.6.6c.58.98 1.38 1.78 2.37 2.36l.6-.6c.18-.18.46-.23.68-.1l2.2 1.27c.18.1.28.3.28.5v1.8c0 .27-.22.5-.5.5C9 17 7 11.28 7.5 8.5c.06-.62.42-1 1.03-1z" fill="white" />
    </svg>
);

const XLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <rect width="24" height="24" rx="4" fill="#000" />
        <path d="M13.96 10.58L19.4 4h-1.28l-4.73 5.5L9.5 4H5l5.7 8.29L5 20h1.28l4.99-5.8L15.5 20H20l-6.04-9.42zm-1.77 2.06l-.58-.83-4.6-6.58H9l3.72 5.33.58.83 4.83 6.92H16.2l-4-5.67z" fill="white" />
    </svg>
);

const SlackLogo = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
        <path d="M5.04 15.17a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.27 0a2.52 2.52 0 0 1 5.04 0v6.31a2.52 2.52 0 1 1-5.04 0v-6.31z" fill="#E01E5A" />
        <path d="M8.83 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.83zm0 1.27a2.52 2.52 0 0 1 0 5.04H2.52a2.52 2.52 0 1 1 0-5.04h6.31z" fill="#36C5F0" />
        <path d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.83zm-1.27 0a2.52 2.52 0 0 1-5.04 0V2.52a2.52 2.52 0 1 1 5.04 0v6.31z" fill="#2EB67D" />
        <path d="M15.17 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.27a2.52 2.52 0 0 1 0-5.04h6.31a2.52 2.52 0 1 1 0 5.04h-6.31z" fill="#ECB22E" />
    </svg>
);

const CopyIcon = ({ copied }: { copied: boolean }) => copied
    ? <Check className="w-5 h-5 text-[#10B981]" />
    : <Link2 className="w-5 h-5 text-[var(--indigo)]" />;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildShareText(data: CompanyCardData) {
    return encodeURIComponent(
        `📊 Sentiment Report: ${data.projectName}\n` +
        `• ${data.rowCount} rows analyzed\n` +
        `• Avg Score: ${data.avgScore}/100\n` +
        `• ${data.positivePct}% Positive · ${data.negativePct}% Negative · ${data.neutralPct}% Neutral\n` +
        `\nPowered by PULSE_ AI`
    );
}

function rowsToCsv(data: CompanyCardData): string {
    const header = ['Text', 'Score', 'Label', 'Source'].join(',');
    const rows = data.rows.map(r => [
        `"${r.text.replace(/"/g, '""')}"`,
        r.score,
        r.score >= 60 ? 'positive' : r.score >= 40 ? 'neutral' : 'negative',
        r.source ?? '',
    ].join(','));
    return [header, ...rows].join('\n');
}

function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function safeFilename(name: string) {
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
}

// ─── Click-outside hook ───────────────────────────────────────────────────────

function useClickOutside(callback: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) callback();
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [callback]);
    return ref;
}

// ─── Dropdown shell ───────────────────────────────────────────────────────────

function DropdownItem({
    icon, label, sublabel, onClick,
}: { icon: React.ReactNode; label: string; sublabel: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#4F46E510] transition text-left group"
        >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[var(--bg-surface)] border border-[var(--border)]">
                {icon}
            </div>
            <div>
                <div className="font-mono text-[12px] font-bold text-[var(--text-primary)] group-hover:text-white transition leading-none">
                    {label}
                </div>
                <div className="font-mono text-[9px] text-[var(--text-dim)] mt-0.5">{sublabel}</div>
            </div>
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════
export function ExportDropdown({ data, onClose }: { data: CompanyCardData; onClose: () => void }) {
    const ref = useClickOutside(onClose);
    const name = safeFilename(data.projectName);

    const exportCsv = () => {
        downloadBlob(rowsToCsv(data), `${name}_report.csv`, 'text/csv');
        onClose();
    };

    const exportPdf = () => {
        const rows = data.rows.map(r =>
            `<tr><td>${r.text}</td><td style="text-align:center">${r.score}</td><td>${r.score >= 60 ? '✅ Positive' : r.score >= 40 ? '🟡 Neutral' : '❌ Negative'}</td></tr>`
        ).join('');
        const html = `<!DOCTYPE html><html><head><title>${data.projectName} — PULSE_ Report</title>
        <style>
          body{font-family:monospace;padding:40px;color:#111;max-width:900px;margin:auto}
          h1{font-size:22px;margin-bottom:4px}
          .meta{color:#666;font-size:12px;margin-bottom:24px}
          .kpi{display:flex;gap:16px;margin-bottom:24px}
          .kpi-box{border:1px solid #ddd;border-radius:8px;padding:12px 16px;text-align:center;min-width:90px}
          .kpi-box .val{font-size:24px;font-weight:bold}
          .kpi-box .lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px}
          table{width:100%;border-collapse:collapse;font-size:13px}
          th{background:#f5f5f5;padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #ddd}
          td{padding:8px 10px;border-bottom:1px solid #eee}
          @media print{body{padding:20px}}
        </style></head><body>
        <h1>${data.projectName}</h1>
        <div class="meta">Generated ${new Date().toLocaleDateString()} · ${data.rowCount} rows · PULSE_ Sentiment Intelligence</div>
        <div class="kpi">
          <div class="kpi-box"><div class="val">${data.avgScore}</div><div class="lbl">Avg Score</div></div>
          <div class="kpi-box"><div class="val" style="color:#10B981">${data.positivePct}%</div><div class="lbl">Positive</div></div>
          <div class="kpi-box"><div class="val" style="color:#EF4444">${data.negativePct}%</div><div class="lbl">Negative</div></div>
          <div class="kpi-box"><div class="val" style="color:#F59E0B">${data.neutralPct}%</div><div class="lbl">Neutral</div></div>
        </div>
        <table><thead><tr><th>Text</th><th>Score</th><th>Sentiment</th></tr></thead><tbody>${rows}</tbody></table>
        </body></html>`;
        const w = window.open('', '_blank');
        if (w) { w.document.write(html); w.document.close(); w.print(); }
        onClose();
    };

    const exportDocs = () => {
        const rows = data.rows.map(r =>
            `<tr><td>${r.text}</td><td>${r.score}</td><td>${r.score >= 60 ? 'Positive' : r.score >= 40 ? 'Neutral' : 'Negative'}</td></tr>`
        ).join('');
        const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head><meta charset='utf-8'><title>${data.projectName}</title></head>
        <body style="font-family:Calibri,sans-serif;padding:40px">
          <h1 style="font-size:24pt">${data.projectName}</h1>
          <p style="color:#666">Generated ${new Date().toLocaleDateString()} · ${data.rowCount} rows</p>
          <h2>Summary</h2>
          <p>Average Score: <b>${data.avgScore}/100</b> · Positive: <b>${data.positivePct}%</b> · Negative: <b>${data.negativePct}%</b> · Neutral: <b>${data.neutralPct}%</b></p>
          <h2>Row Breakdown</h2>
          <table border="1" cellpadding="8" style="border-collapse:collapse;width:100%">
            <tr style="background:#f0f0f0"><th>Text</th><th>Score</th><th>Sentiment</th></tr>${rows}
          </table>
        </body></html>`;
        downloadBlob(html, `${name}_report.doc`, 'application/msword');
        onClose();
    };

    return (
        <div
            ref={ref}
            className="absolute top-full right-0 mt-2 w-56 rounded-xl overflow-hidden animate-fadeUp z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        >
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
                <span className="font-mono text-[8px] tracking-[3px] uppercase text-[var(--text-dim)]">Export As</span>
            </div>
            <DropdownItem icon={<PdfIcon />} label="PDF Report" sublabel="Opens print dialog" onClick={exportPdf} />
            <DropdownItem icon={<DocsIcon />} label="Word / Docs" sublabel="Download .doc file" onClick={exportDocs} />
            <DropdownItem icon={<CsvIcon />} label="CSV Spreadsheet" sublabel="Download raw data" onClick={exportCsv} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARE DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════
export function ShareDropdown({ data, onClose }: { data: CompanyCardData; onClose: () => void }) {
    const ref = useClickOutside(onClose);
    const [copied, setCopied] = useState(false);

    const text = buildShareText(data);
    const plainText = decodeURIComponent(text);

    const open = (url: string) => { window.open(url, '_blank'); onClose(); };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(plainText).then(() => {
            setCopied(true);
            setTimeout(() => { setCopied(false); onClose(); }, 1500);
        });
    };

    return (
        <div
            ref={ref}
            className="absolute top-full right-0 mt-2 w-60 rounded-xl overflow-hidden animate-fadeUp z-50"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        >
            <div className="px-4 py-2.5 border-b border-[var(--border)]">
                <span className="font-mono text-[8px] tracking-[3px] uppercase text-[var(--text-dim)]">Share Report</span>
            </div>
            <DropdownItem icon={<GmailLogo />} label="Email" sublabel="Open in mail client"
                onClick={() => open(`mailto:?subject=${encodeURIComponent(data.projectName + ' — Sentiment Report')}&body=${text}`)} />
            <DropdownItem icon={<DriveLogo />} label="Google Drive" sublabel="Open Drive to upload"
                onClick={() => open('https://drive.google.com/drive/my-drive')} />
            <DropdownItem icon={<WhatsAppLogo />} label="WhatsApp" sublabel="Share via WhatsApp"
                onClick={() => open(`https://wa.me/?text=${text}`)} />
            <DropdownItem icon={<XLogo />} label="X / Twitter" sublabel="Post on X"
                onClick={() => open(`https://twitter.com/intent/tweet?text=${text}`)} />
            <DropdownItem icon={<SlackLogo />} label="Slack" sublabel="Open Slack"
                onClick={() => open('https://slack.com')} />
            <div className="border-t border-[var(--border)]">
                <DropdownItem
                    icon={<CopyIcon copied={copied} />}
                    label={copied ? 'Copied!' : 'Copy Summary'}
                    sublabel="Copy report text to clipboard"
                    onClick={copyToClipboard}
                />
            </div>
        </div>
    );
}
