"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
    LayoutDashboard, ScanText, FolderOpen,
    History, Key, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';

const NAV = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/analyze', icon: ScanText, label: 'Analyze' },
    { href: '/dashboard/history', icon: History, label: 'History' },
    { href: '/dashboard/projects', icon: FolderOpen, label: 'Projects' },
    { href: '/dashboard/api-keys', icon: Key, label: 'API Keys' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside
                className="flex flex-col shrink-0 transition-all duration-300"
                style={{
                    width: collapsed ? 64 : 220,
                    background: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border)',
                    position: 'sticky', top: 0, height: '100vh',
                }}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)]">
                    <span className="font-mono font-bold text-lg tracking-tighter shrink-0">P_</span>
                    {!collapsed && <span className="font-mono font-bold text-sm tracking-tighter">PULSE</span>}
                </div>

                {/* Nav links */}
                <nav className="flex-1 py-4 space-y-1 px-2">
                    {NAV.map(({ href, icon: Icon, label }) => {
                        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={collapsed ? label : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-[12px] tracking-wider transition-all group
                                    ${active
                                        ? 'bg-[var(--indigo-glow)] text-[var(--indigo)] border border-[var(--indigo)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-white border border-transparent'
                                    }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: user + collapse */}
                <div className="p-3 border-t border-[var(--border)] flex items-center justify-between">
                    <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-[var(--text-dim)] hover:text-white transition"
                        title={collapsed ? 'Expand' : 'Collapse'}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>
            </aside>

            {/* ── Main content ─────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
