"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pulseApi, ApiKey } from '@/lib/api';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, X, AlertTriangle } from 'lucide-react';

// ─── New Key Modal ─────────────────────────────────────────────────────────

function NewKeyModal({
    onClose,
    onCreated,
}: { onClose: () => void; onCreated: (key: ApiKey & { rawKey: string }) => void }) {
    const [name, setName] = useState('');
    const mut = useMutation({
        mutationFn: () => pulseApi.createKey(name),
        onSuccess: (res) => { onCreated(res.data); onClose(); },
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-xl p-6 z-10"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="font-mono text-lg font-bold">New API Key</h2>
                        <p className="font-mono text-[10px] text-[var(--text-dim)] mt-0.5">The raw key is shown ONCE. Save it immediately.</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-dim)] hover:text-white transition"><X className="w-4 h-4" /></button>
                </div>
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Key name (e.g. My App, Production)"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-dim)] font-sans text-sm outline-none focus:border-[var(--indigo)] transition mb-4"
                />
                {mut.isError && (
                    <div className="mb-4 p-3 rounded-lg font-mono text-[11px] text-[#EF4444]"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                        {(mut.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create key.'}
                    </div>
                )}
                <button
                    onClick={() => mut.mutate()}
                    disabled={!name.trim() || mut.isPending}
                    className="w-full py-2.5 rounded-lg font-mono text-sm text-white disabled:opacity-40 transition"
                    style={{ background: 'var(--indigo)' }}
                >
                    {mut.isPending ? 'Generating...' : 'Generate Key →'}
                </button>
            </div>
        </div>
    );
}

// ─── Raw Key Reveal Dialog ─────────────────────────────────────────────────

function RawKeyDialog({ apiKey, onClose }: { apiKey: ApiKey & { rawKey: string }; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(apiKey.rawKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg rounded-xl p-6 z-10"
                style={{ background: 'var(--bg-surface)', border: '1px solid #EF444440', boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.1)' }}>
                {/* Warning header */}
                <div className="flex items-center gap-3 mb-5 p-3 rounded-lg"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0" />
                    <div>
                        <div className="font-mono text-[11px] font-bold text-[#EF4444]">SAVE THIS KEY NOW</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] mt-0.5">
                            This is the only time you will see the full key. It cannot be retrieved after closing.
                        </div>
                    </div>
                </div>

                <div className="mb-1">
                    <span className="font-mono text-[9px] tracking-[2px] text-[var(--text-dim)] uppercase">API Key — {apiKey.name}</span>
                </div>

                {/* Key display box */}
                <div className="flex items-center gap-2 p-3 rounded-lg mb-5"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <code className="flex-1 font-mono text-[12px] text-[var(--indigo)] truncate select-all">
                        {visible ? apiKey.rawKey : apiKey.rawKey.slice(0, 16) + '•'.repeat(32)}
                    </code>
                    <button onClick={() => setVisible(!visible)}
                        className="text-[var(--text-dim)] hover:text-white transition shrink-0">
                        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={copy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-[11px] text-white shrink-0 transition"
                        style={{ background: copied ? '#10B981' : 'var(--indigo)' }}>
                        {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-lg font-mono text-sm text-[var(--text-secondary)] transition hover:text-white"
                    style={{ border: '1px solid var(--border)' }}
                >
                    I&apos;ve saved it — Close
                </button>
            </div>
        </div>
    );
}

// ─── Key Row ───────────────────────────────────────────────────────────────

function KeyRow({ apiKey, onDelete }: { apiKey: ApiKey; onDelete: (id: string) => void }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-0 group hover:bg-[var(--bg-elevated)] transition">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--indigo-glow)', border: '1px solid var(--indigo)' }}>
                <Key className="w-4 h-4 text-[var(--indigo)]" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-mono text-[13px] font-bold text-[var(--text-primary)]">{apiKey.name}</div>
                <div className="flex items-center gap-3 mt-0.5">
                    <code className="font-mono text-[10px] text-[var(--text-dim)]">
                        {apiKey.keyPrefix}{'•'.repeat(16)}
                    </code>
                    <span className="font-mono text-[9px] text-[var(--text-dim)]">
                        Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </span>
                    {apiKey.lastUsed && (
                        <span className="font-mono text-[9px] text-[var(--text-dim)]">
                            · Last used {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {apiKey.callsToday !== null && apiKey.callsToday > 0 && (
                    <div className="text-right">
                        <div className="font-mono text-[12px] font-bold text-[var(--indigo)]">{apiKey.callsToday}</div>
                        <div className="font-mono text-[8px] text-[var(--text-dim)]">calls today</div>
                    </div>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] text-[#10B981]"
                    style={{ background: '#10B98115', border: '1px solid #10B98130' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    ACTIVE
                </span>
                <button
                    onClick={() => onDelete(apiKey.id)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[#EF4444] transition"
                    title="Revoke key"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
    const [showNew, setShowNew] = useState(false);
    const [newKey, setNewKey] = useState<(ApiKey & { rawKey: string }) | null>(null);
    const qc = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['api-keys'],
        queryFn: () => pulseApi.getKeys(),
    });

    const deleteMut = useMutation({
        mutationFn: pulseApi.deleteKey,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
    });

    const handleCreated = (key: ApiKey & { rawKey: string }) => {
        qc.invalidateQueries({ queryKey: ['api-keys'] });
        setNewKey(key);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Developer</span>
                    <h1 className="font-mono text-3xl font-bold mt-1">API Keys</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Use these keys to call the PULSE_ API from your own applications.
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm text-white transition hover:-translate-y-0.5"
                    style={{ background: 'var(--indigo)', boxShadow: '0 0 20px var(--indigo-glow)' }}
                >
                    <Plus className="w-4 h-4" /> New Key
                </button>
            </div>

            {/* Usage hint */}
            <div className="rounded-xl p-5 mb-6"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase mb-2">Example Request</div>
                <pre className="font-mono text-[11px] text-[var(--text-secondary)] overflow-x-auto leading-relaxed">{`curl -X POST https://api.pulse.yourdomain.com/api/v1/analyze \\
  -H "X-API-Key: pk_live_xxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "This product is amazing!"}'`}
                </pre>
            </div>

            {/* Keys list */}
            <div className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                {/* Table header */}
                <div className="px-5 py-3 border-b border-[var(--border)]"
                    style={{ background: 'var(--bg-elevated)' }}>
                    <span className="font-mono text-[8px] tracking-[3px] uppercase text-[var(--text-dim)]">
                        {data?.data.length ?? 0} of 5 keys used
                    </span>
                </div>

                {isLoading && (
                    <div className="p-6 space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
                        ))}
                    </div>
                )}

                {data?.data.length === 0 && (
                    <div className="p-12 text-center">
                        <Key className="w-10 h-10 mx-auto mb-3 opacity-20 text-[var(--indigo)]" />
                        <p className="font-mono text-[12px] text-[var(--text-dim)]">No API keys yet.</p>
                        <button onClick={() => setShowNew(true)}
                            className="mt-3 font-mono text-[11px] text-[var(--indigo)] hover:text-white transition">
                            Generate your first key →
                        </button>
                    </div>
                )}

                {data?.data.map(k => (
                    <KeyRow key={k.id} apiKey={k} onDelete={id => deleteMut.mutate(id)} />
                ))}
            </div>

            {/* Limit bar */}
            {data && (
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${(data.data.length / 5) * 100}%`, background: data.data.length >= 5 ? '#EF4444' : 'var(--indigo)' }} />
                    </div>
                    <span className="font-mono text-[9px] text-[var(--text-dim)] shrink-0">{data.data.length}/5 keys</span>
                </div>
            )}

            {/* Modals */}
            {showNew && <NewKeyModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
            {newKey && <RawKeyDialog apiKey={newKey} onClose={() => setNewKey(null)} />}
        </div>
    );
}
