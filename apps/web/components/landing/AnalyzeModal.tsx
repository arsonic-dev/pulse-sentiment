"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { pulseApi, AnalyzeResponse } from '@/lib/api';
import { Loader2, Upload, X, FileText } from 'lucide-react';
import { CompanyCardData, TopEmotion, BatchRow } from '@/components/analysis/CompanyResultCard';

const EMOTION_EMOJI: Record<string, string> = {
    joy: '😊', anger: '😠', fear: '😨',
    sadness: '😢', surprise: '😲', disgust: '🤢',
};

/** Parse a CSV string and return the text column values */
function parseCsvRows(csv: string): { rows: string[]; source: string } {
    const lines = csv.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
    if (lines.length < 2) return { rows: [], source: 'CSV' };

    const rawHeaders = lines[0].match(/(".*?"|[^,]+)/g) || [];
    const headers = rawHeaders.map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const textIdx = headers.indexOf('text');
    const colIdx = textIdx >= 0 ? textIdx : 0;
    const sourceIdx = headers.indexOf('source');

    const rows: string[] = [];
    const sources: string[] = [];

    for (const line of lines.slice(1)) {
        const cols = line.match(/(".*?"|[^,]+)/g) || [];
        const cell = (cols[colIdx] || '').trim().replace(/^"|"$/g, '');
        const src = sourceIdx >= 0 ? (cols[sourceIdx] || '').trim().replace(/^"|"$/g, '') : '';
        if (cell.length > 10) {
            rows.push(cell);
            sources.push(src);
        }
    }

    return { rows: rows.slice(0, 40), source: sources[0] || 'CSV' };
}

/** Build CompanyCardData from a list of analyzed rows */
function buildCompanyData(
    texts: string[],
    results: AnalyzeResponse[],
    fileName: string,
): CompanyCardData {
    const scores = results.map(r => r.data.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const positive = results.filter(r => r.data.label === 'positive').length;
    const negative = results.filter(r => r.data.label === 'negative').length;
    const neutral = results.filter(r => r.data.label === 'neutral').length;
    const total = results.length;

    const positivePct = Math.round((positive / total) * 100);
    const negativePct = Math.round((negative / total) * 100);
    const neutralPct = 100 - positivePct - negativePct;

    // Aggregate emotions
    const emotionTotals = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0, disgust: 0 };
    results.forEach(r => {
        (Object.keys(emotionTotals) as Array<keyof typeof emotionTotals>).forEach(k => {
            emotionTotals[k] += r.data.emotions[k] ?? 0;
        });
    });

    const topEmotions: TopEmotion[] = (Object.entries(emotionTotals) as [string, number][])
        .map(([name, total]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: total / total || 0,
            emoji: EMOTION_EMOJI[name] || '❓',
        }))
        .map(e => ({ ...e, value: emotionTotals[e.name.toLowerCase() as keyof typeof emotionTotals] / results.length }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    const trendData = scores.length >= 2 ? scores : [scores[0], scores[0]];

    // Churn risk: rows with score < 20
    const churnRows = results.filter(r => r.data.score < 20);
    const churnRisk = churnRows.length > 0
        ? {
            detected: true,
            count: churnRows.length,
            reason: `${churnRows.length} ${churnRows.length === 1 ? 'entry' : 'entries'} scored below 20. Recommend immediate outreach within 24 hours.`,
        }
        : undefined;

    // Simple recommended actions derived from data
    const recommendedActions = buildRecommendedActions(positivePct, negativePct, scores, total);

    const batchRows: BatchRow[] = texts.map((text, i) => ({
        id: results[i]?.data?.id || String(i),
        text,
        score: results[i]?.data?.score ?? 50,
        fullResult: results[i]?.data,
    }));

    return {
        projectName: fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
        rowCount: total,
        analyzedAt: new Date(),
        processingTime: total * 1.2,
        avgScore,
        positivePct,
        negativePct,
        neutralPct,
        trendData,
        topEmotions,
        rows: batchRows,
        churnRisk,
        recommendedActions,
        fromCache: results.some(r => r.meta?.fromCache),
    };
}

function buildRecommendedActions(pos: number, neg: number, scores: number[], total: number) {
    const actions = [];
    if (neg >= 30) {
        actions.push({
            title: 'Address Negative Sentiment Sources',
            detail: `${neg}% of entries scored negatively. Investigate root causes and create a response workflow within the next 48 hours.`,
        });
    }
    if (pos >= 50) {
        actions.push({
            title: 'Amplify Positive Signals',
            detail: `${pos}% of entries are positive — surface these as testimonials or use them in marketing materials.`,
        });
    }
    const low = scores.filter(s => s < 40).length;
    if (low > 0) {
        actions.push({
            title: 'Prioritize At-Risk Entries',
            detail: `${low} of ${total} entries scored below 40. Flag these for follow-up within 24 hours to prevent churn.`,
        });
    }
    // Always ensure 3 actions
    if (actions.length < 3) {
        actions.push({
            title: 'Monitor Sentiment Trends',
            detail: `Run weekly batch analysis to track sentiment shifts over time and catch early warning signs.`,
        });
    }
    return actions.slice(0, 3);
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface AnalyzeModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called after a single text analysis — shows IndividualResultCard */
    onSuccess: (data: AnalyzeResponse) => void;
    /** Called after CSV batch analysis — shows CompanyResultCard */
    onBatchSuccess?: (data: CompanyCardData) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
export default function AnalyzeModal({ isOpen, onClose, onSuccess, onBatchSuccess }: AnalyzeModalProps) {
    const [text, setText] = useState('');
    const [triesLeft, setTriesLeft] = useState(3);
    const [isCsvMode, setIsCsvMode] = useState(false);
    const [csvRows, setCsvRows] = useState<string[]>([]);
    const [csvFileName, setCsvFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);

    // ── Read tries from localStorage when modal opens ──────────────────────
    const syncTries = () => {
        const used = parseInt(localStorage.getItem('pulse_demo_count') || '0');
        setTriesLeft(Math.max(0, 3 - used));
    };

    // ── File upload handler ────────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content !== 'string') return;

            if (file.name.toLowerCase().endsWith('.csv')) {
                // CSV mode: parse rows
                const { rows } = parseCsvRows(content);
                if (rows.length === 0) {
                    alert('CSV must have a "text" column with at least one row containing 10+ characters.');
                    return;
                }
                setIsCsvMode(true);
                setCsvRows(rows);
                setCsvFileName(file.name);
                setSelectedFile(file);
                setText(''); // clear any existing text
            } else {
                // Plain text file
                setIsCsvMode(false);
                setCsvRows([]);
                setCsvFileName('');
                setText(content.trim().substring(0, 50000));
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleClearCsv = () => {
        setIsCsvMode(false);
        setCsvRows([]);
        setCsvFileName('');
        setSelectedFile(null);
        setProgress(0);
    };

    // ── Single-text mutation ───────────────────────────────────────────────
    const singleMutation = useMutation({
        mutationFn: pulseApi.analyzeText,
        onSuccess: (data) => {
            const used = parseInt(localStorage.getItem('pulse_demo_count') || '0');
            localStorage.setItem('pulse_demo_count', (used + 1).toString());
            setTriesLeft(Math.max(0, 3 - (used + 1)));
            onSuccess(data);
            onClose();
            resetState();
        },
    });

    // ── Batch mutation (Server-side) ──────────────────────────────────────
    const batchMutation = useMutation({
        mutationFn: async (file: File) => {
            const { data } = await pulseApi.uploadBatch(file);
            const jobId = data.jobId;

            // Polling for status
            return new Promise<AnalyzeResponse[]>((resolve, reject) => {
                const poll = async () => {
                    try {
                        const status = await pulseApi.getBatchStatus(jobId);
                        setProgress(status.data.progress);

                        if (status.data.status === 'completed') {
                            // Fetch the results that were just processed
                            // For demo purposes, we will fetch the last rowCount analyses from history
                            const history = await pulseApi.getAnalyses(1, data.rowCount);
                            resolve(history.data.map(h => ({ data: h as any, meta: { fromCache: false } })) as any);
                        } else if (status.data.status === 'failed') {
                            reject(new Error(status.data.failedReason || 'Batch processing failed'));
                        } else {
                            setTimeout(poll, 1000); // continue polling
                        }
                    } catch (e) {
                        reject(e);
                    }
                };
                poll();
            });
        },
        onSuccess: (results) => {
            const companyData = buildCompanyData(csvRows, results, csvFileName || 'Batch Analysis');
            onBatchSuccess?.(companyData);
            onClose();
            resetState();
        },
    });

    const resetState = () => {
        setText('');
        setIsCsvMode(false);
        setCsvRows([]);
        setCsvFileName('');
        setSelectedFile(null);
        setProgress(0);
    };

    const handleRun = () => {
        syncTries();
        if (isCsvMode && csvRows.length > 0) {
            if (selectedFile) {
                batchMutation.mutate(selectedFile);
            } else {
                alert('File reference lost. Please re-upload your CSV.');
            }
        } else {
            singleMutation.mutate(text);
        }
    };

    const isLoading = singleMutation.isPending || batchMutation.isPending;
    const error = singleMutation.error || batchMutation.error;
    const canRun = isCsvMode ? csvRows.length > 0 : text.length >= 10;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl glass-panel p-1 flex flex-col popup-animation">
                <div className="p-6 bg-[var(--bg-base)] rounded-lg flex flex-col gap-4">

                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="section-label">
                                {isCsvMode ? '[ BATCH CSV ANALYSIS ]' : '[ NEW ANALYSIS ]'}
                            </span>
                            <h2 className="text-2xl font-mono font-bold mt-1">
                                {isCsvMode ? `${csvRows.length} Rows Ready` : 'Input Text'}
                            </h2>
                        </div>
                        <button
                            onClick={!isLoading ? onClose : undefined}
                            className="text-[var(--text-secondary)] hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* CSV mode — file info card */}
                    {isCsvMode ? (
                        <div
                            className="rounded-lg p-4 flex items-center justify-between"
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--indigo)', boxShadow: '0 0 20px var(--indigo-glow)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ background: 'var(--indigo-glow)', border: '1px solid var(--indigo)' }}>
                                    <FileText className="w-5 h-5 text-[var(--indigo)]" />
                                </div>
                                <div>
                                    <div className="font-mono text-[13px] font-bold text-[var(--text-primary)]">{csvFileName}</div>
                                    <div className="font-mono text-[10px] text-[var(--text-dim)] tracking-widest mt-0.5">
                                        {csvRows.length} ROWS DETECTED · BATCH MODE
                                    </div>
                                </div>
                            </div>
                            {!isLoading && (
                                <button onClick={handleClearCsv} className="text-[var(--text-secondary)] hover:text-white transition">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        /* Text mode — textarea */
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text here to analyze sentiment... or upload a CSV file with a 'text' column for batch analysis."
                                className="w-full h-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md p-4 pb-12 text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--indigo)] focus:ring-1 focus:ring-[var(--indigo)] transition-all resize-none font-sans text-[14px] leading-relaxed"
                            />
                            <label className="absolute bottom-3 left-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded text-xs font-mono cursor-pointer transition flex items-center gap-2 shadow-sm">
                                <Upload className="w-3 h-3" />
                                Upload CSV
                                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    )}

                    {/* Batch progress bar */}
                    {isLoading && isCsvMode && (
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <span className="font-mono text-[9px] text-[var(--text-dim)] tracking-widest uppercase">
                                    Analyzing batch...
                                </span>
                                <span className="font-mono text-[9px] text-[var(--indigo)] tracking-widest">
                                    {progress}%
                                </span>
                            </div>
                            <div className="h-[6px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progress}%`,
                                        background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                                        boxShadow: '0 0 12px #4F46E560',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="p-3 bg-[var(--negative-glow)] border border-[var(--negative)] rounded text-[var(--negative)] text-sm font-mono">
                            {(error as { response?: { data?: { message?: string } } })?.response?.data?.message
                                || (error as Error)?.message
                                || 'An error occurred while analyzing.'}
                        </div>
                    )}

                    {/* Footer bar */}
                    <div className="flex justify-between items-center mt-1">
                        {isCsvMode ? (
                            <span className="text-xs font-mono text-[var(--text-dim)]">
                                Batch up to <span className="text-[var(--indigo)]">40 rows</span> · ~{Math.ceil(csvRows.length * 1.2)}s estimated
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-[var(--text-dim)]">
                                {text.length} characters
                            </span>
                        )}

                        <div className="flex items-center gap-4">
                            {!isCsvMode && (
                                <span className="text-[10px] font-mono text-[var(--text-secondary)] tracking-widest uppercase">
                                    {triesLeft} free {triesLeft === 1 ? 'try' : 'tries'} left
                                </span>
                            )}
                            <button
                                onClick={handleRun}
                                disabled={!canRun || isLoading}
                                className="bg-[var(--indigo)] hover:bg-[var(--violet)] disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-dim)] text-white font-mono text-sm px-6 py-3 rounded-md shadow-glow-primary transition flex items-center justify-center min-w-[160px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isCsvMode ? 'Processing...' : 'Analyzing...'}
                                    </>
                                ) : (
                                    isCsvMode ? `Run Batch (${csvRows.length} rows)` : 'Run Analysis'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
