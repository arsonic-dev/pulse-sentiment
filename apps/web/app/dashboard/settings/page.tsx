"use client";

import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { pulseApi } from '@/lib/api';
import { LogOut, Mail, Calendar, Zap, Star, Building2, Check } from 'lucide-react';

const PLAN_INFO = {
    free: {
        label: 'Free',
        color: '#9B99C0',
        glowColor: '#9B99C020',
        borderColor: '#9B99C040',
        icon: Zap,
        limits: [
            '50 analyses / day',
            'Batch upload: up to 100 rows',
            'API access: 10 calls / day',
            '1 project max',
        ],
    },
    pro: {
        label: 'Pro',
        color: '#4F46E5',
        glowColor: '#4F46E520',
        borderColor: '#4F46E540',
        icon: Star,
        limits: [
            '2,000 analyses / day',
            'Batch upload: up to 10,000 rows',
            'API access: 500 calls / day',
            'Unlimited projects',
            'Multi-language (30+ languages)',
            'White-label PDF export',
        ],
    },
    enterprise: {
        label: 'Enterprise',
        color: '#7C3AED',
        glowColor: '#7C3AED20',
        borderColor: '#7C3AED40',
        icon: Building2,
        limits: [
            'Unlimited everything',
            'SSO',
            'Custom fine-tuned model',
            'SLA + dedicated support',
        ],
    },
} as const;

type Plan = keyof typeof PLAN_INFO;

function PlanCard({ plan, active }: { plan: Plan; active: boolean }) {
    const info = PLAN_INFO[plan];
    const Icon = info.icon;
    return (
        <div className={`rounded-xl p-5 transition ${active ? 'relative' : 'opacity-60'}`}
            style={{
                background: active ? info.glowColor : 'var(--bg-elevated)',
                border: `1px solid ${active ? info.borderColor : 'var(--border)'}`,
                boxShadow: active ? `0 0 40px ${info.glowColor}` : 'none',
            }}>
            {active && (
                <span className="absolute -top-2.5 left-4 font-mono text-[9px] tracking-[2px] px-2 py-0.5 rounded-full text-white"
                    style={{ background: info.color }}>CURRENT PLAN</span>
            )}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${info.color}20`, border: `1px solid ${info.color}40` }}>
                    <Icon className="w-4 h-4" style={{ color: info.color }} />
                </div>
                <span className="font-mono text-[15px] font-bold" style={{ color: info.color }}>{info.label}</span>
            </div>
            <ul className="space-y-1.5">
                {info.limits.map(l => (
                    <li key={l} className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-secondary)]">
                        <Check className="w-3 h-3 shrink-0" style={{ color: info.color }} />
                        {l}
                    </li>
                ))}
            </ul>
            {!active && plan === 'pro' && (
                <button className="w-full mt-4 py-2 rounded-lg font-mono text-[11px] text-white transition hover:-translate-y-0.5"
                    style={{ background: info.color, boxShadow: `0 0 16px ${info.glowColor}` }}>
                    Upgrade to Pro — $19/mo →
                </button>
            )}
        </div>
    );
}

export default function SettingsPage() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const [signOutLoading, setSignOutLoading] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => pulseApi.getDashboardStats().then(r => r.data),
    });

    // For now plan comes from stats or defaults to free
    const currentPlan: Plan = 'free'; // Will be replaced with real plan from API

    const handleSignOut = async () => {
        setSignOutLoading(true);
        await signOut({ redirectUrl: '/' });
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <span className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase">Account</span>
                <h1 className="font-mono text-3xl font-bold mt-1">Settings</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Manage your account and subscription.</p>
            </div>

            {/* Profile card */}
            <div className="rounded-xl p-6 mb-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase mb-4">Profile</div>
                <div className="flex items-center gap-5">
                    {/* Avatar */}
                    {user.imageUrl ? (
                        <img src={user.imageUrl} alt="avatar"
                            className="w-16 h-16 rounded-full ring-2 ring-[var(--indigo)] ring-offset-2 ring-offset-[var(--bg-surface)]" />
                    ) : (
                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-2xl font-bold"
                            style={{ background: 'var(--indigo-glow)', border: '2px solid var(--indigo)' }}>
                            {user.firstName?.charAt(0) ?? user.emailAddresses[0]?.emailAddress.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="font-mono text-[16px] font-bold text-[var(--text-primary)]">
                            {user.fullName ?? 'Anonymous'}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2">
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                                <Mail className="w-3.5 h-3.5" />
                                {user.primaryEmailAddress?.emailAddress}
                            </span>
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                                <Calendar className="w-3.5 h-3.5" />
                                Joined {new Date(user.createdAt!).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Usage stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Analyses', value: stats.totalAnalyses.toLocaleString() },
                        { label: 'Avg Score', value: `${stats.avgScore}/100` },
                        { label: 'Used Today', value: stats.usageToday },
                    ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl p-4"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                            <div className="font-mono text-[8px] tracking-[3px] text-[var(--text-dim)] uppercase mb-1">{label}</div>
                            <div className="font-mono text-[22px] font-bold text-[var(--text-primary)]">{value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plan comparison */}
            <div className="mb-8">
                <div className="font-mono text-[9px] tracking-[3px] text-[var(--text-dim)] uppercase mb-4">Subscription Plan</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <PlanCard plan="free" active={currentPlan === ('free' as Plan)} />
                    <PlanCard plan="pro" active={currentPlan === ('pro' as Plan)} />
                    <PlanCard plan="enterprise" active={currentPlan === ('enterprise' as Plan)} />
                </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-xl p-5"
                style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="font-mono text-[9px] tracking-[3px] text-[#EF4444] uppercase mb-4">Danger Zone</div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-mono text-[13px] font-bold text-[var(--text-primary)]">Sign Out</div>
                        <div className="font-mono text-[10px] text-[var(--text-dim)] mt-0.5">Sign out of all sessions</div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        disabled={signOutLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] text-[#EF4444] transition hover:bg-[#EF444415] disabled:opacity-50"
                        style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        <LogOut className="w-4 h-4" />
                        {signOutLoading ? 'Signing out...' : 'Sign Out'}
                    </button>
                </div>
            </div>
        </div>
    );
}
