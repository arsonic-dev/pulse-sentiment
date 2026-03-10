"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pulseApi, Project } from '@/lib/api';
import { FolderPlus, Trash2, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const mut = useMutation({
        mutationFn: () => pulseApi.createProject(name, desc || undefined),
        onSuccess: () => { onCreated(); onClose(); },
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-xl p-6 z-10"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-mono text-lg font-bold">New Project</h2>
                    <button onClick={onClose} className="text-[var(--text-dim)] hover:text-white transition"><X className="w-4 h-4" /></button>
                </div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name (required)"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-dim)] font-sans text-sm outline-none focus:border-[var(--indigo)] transition mb-3" />
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={3}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-dim)] font-sans text-sm outline-none focus:border-[var(--indigo)] transition resize-none mb-4" />
                <button onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}
                    className="w-full py-2.5 rounded-lg font-mono text-sm text-white disabled:opacity-40 transition"
                    style={{ background: 'var(--indigo)' }}>
                    {mut.isPending ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const [showNew, setShowNew] = useState(false);
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => pulseApi.getProjects() });
    const deleteMut = useMutation({
        mutationFn: pulseApi.deleteProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Projects</span>
                    <h1 className="font-mono text-3xl font-bold mt-1">Your Projects</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Group analyses into projects for better organization.</p>
                </div>
                <button onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm text-white transition hover:-translate-y-0.5"
                    style={{ background: 'var(--indigo)', boxShadow: '0 0 20px var(--indigo-glow)' }}>
                    <FolderPlus className="w-4 h-4" /> New Project
                </button>
            </div>

            {isLoading && (
                <div className="grid gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
                    ))}
                </div>
            )}

            {data?.data.length === 0 && (
                <div className="text-center py-16 font-mono text-[var(--text-dim)]">
                    <FolderPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No projects yet.</p>
                    <button onClick={() => setShowNew(true)} className="mt-3 text-[var(--indigo)] hover:text-white transition text-sm">
                        Create your first project →
                    </button>
                </div>
            )}

            <div className="grid gap-3">
                {data?.data.map(p => (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-4 rounded-xl group transition hover:-translate-y-0.5"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'var(--indigo-glow)', border: '1px solid var(--indigo)' }}>
                            <span className="font-mono text-[var(--indigo)] font-bold text-sm">
                                {p.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <div className="font-mono text-[13px] font-bold text-[var(--text-primary)]">{p.name}</div>
                            {p.description && <div className="font-sans text-[11px] text-[var(--text-dim)] mt-0.5 truncate">{p.description}</div>}
                            <div className="font-mono text-[9px] text-[var(--text-dim)] mt-0.5">
                                Created {new Date(p.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <Link href={`/dashboard/history?projectId=${p.id}`}
                            className="opacity-0 group-hover:opacity-100 text-[var(--indigo)] hover:text-white transition flex items-center gap-1 font-mono text-[10px]">
                            View <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button onClick={() => deleteMut.mutate(p.id)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--text-dim)] hover:text-[#EF4444] transition ml-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['projects'] })} />}
        </div>
    );
}
