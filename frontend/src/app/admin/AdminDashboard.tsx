'use client';

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/src/lib/api";
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Link from "next/link";

type DashboardStats = {
    totalUsers: number;
    totalChallenges: number;
    totalAttempts: number;
    challengesByDifficulty: {
        easy: number,
        medium: number,
        hard: number,
    };
};

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const router = useRouter();

    function handleLogout() {
        localStorage.removeItem('token');
        router.replace('/login');
    }

    useEffect(() => {
        async function loadDashboard() {
            try {
                const data = await apiFetch<DashboardStats>(
                    '/admin/dashboard',
                );
                setStats(data);
            } catch (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Could not load dashboard statistics.');
                }
            } finally {
                setLoading(false);
            }
        }

        void loadDashboard();
    }, []);
    return (
        <main className="min-h-screen bg-[#f5efe3] p-6 text-[#493625] md:p-10">
            <div className="mx-auto max-w-6xl">
                <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left side — keep exactly as it is */}
                    <div className="shrink-0">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#98713f]">
                            Investigation board
                        </p>
                        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                            Bug Hunt Admin
                        </h1>
                        <p className="mt-2 text-[#806b56]">
                            Monitor players, challenges, and game activity.
                        </p>
                    </div>

                    {/* Right side — grouped navigation */}
                    <nav className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                        <Link
                            href="/admin/challenges"
                            className="inline-flex items-center justify-center rounded-lg border border-[#d8c4a5] bg-[#fffaf1] px-4 py-2.5 text-sm font-semibold text-[#493625] shadow-sm transition-colors hover:bg-[#eadcc5]"
                        >
                            Challenges
                        </Link>

                        <Link
                            href="/admin/users"
                            className="inline-flex items-center justify-center rounded-lg border border-[#d8c4a5] bg-[#fffaf1] px-4 py-2.5 text-sm font-semibold text-[#493625] shadow-sm transition-colors hover:bg-[#eadcc5]"
                        >
                            Players
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d8c4a5] bg-[#fffaf1] px-4 py-2.5 text-sm font-semibold text-[#493625] shadow-sm transition-colors hover:bg-[#eadcc5]"
                        >
                            <LogOut size={17} />
                            Logout
                        </button>
                    </nav>
                </header>
                {loading && <p>Loading dashboard...</p>}

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {stats && !loading && (
                    <>
                        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    label: 'Total players',
                                    value: stats.totalUsers,
                                    icon: '👥',
                                },
                                {
                                    label: 'Total challenges',
                                    value: stats.totalChallenges,
                                    icon: '🕵️',
                                },
                                {
                                    label: 'Total attempts',
                                    value: stats.totalAttempts,
                                    icon: '🔎',
                                },
                            ].map((item) => (
                                <article
                                    key={item.label}
                                    className="rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm"
                                >
                                    <p className="text-2xl">{item.icon}</p>
                                    <p className="mt-4 text-sm text-[#806b56]">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-3xl font-bold">
                                        {item.value}
                                    </p>
                                </article>
                            ))}
                        </section>

                        <section className="mt-8 rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                            <h2 className="text-xl font-bold">
                                Challenges by difficulty
                            </h2>

                            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                {[
                                    {
                                        label: 'Easy',
                                        value: stats.challengesByDifficulty.easy,
                                        color: 'bg-emerald-100 text-emerald-800',
                                    },
                                    {
                                        label: 'Medium',
                                        value: stats.challengesByDifficulty.medium,
                                        color: 'bg-amber-100 text-amber-800',
                                    },
                                    {
                                        label: 'Hard',
                                        value: stats.challengesByDifficulty.hard,
                                        color: 'bg-rose-100 text-rose-800',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className={`rounded-xl p-5 ${item.color}`}
                                    >
                                        <p className="font-medium">{item.label}</p>
                                        <p className="mt-2 text-2xl font-bold">
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}