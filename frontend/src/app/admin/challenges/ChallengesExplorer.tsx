'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApiError, apiFetch } from "@/src/lib/api";

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

type challenge = {
    id: string,
    title: string,
    description: string,
    difficulty: Difficulty,
    order: number,
    status: string,
    createdAt: number;
};

const FILTERS: { label: string; value: Difficulty | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Easy', value: 'EASY' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Hard', value: 'HARD' },
];

const difficultyColor: Record<Difficulty, string> = {
    EASY: 'bg-emerald-100 text-emerald-800',
    MEDIUM: 'bg-amber-100 text-amber-800',
    HARD: 'bg-rose-100 text-rose-800',
}

export default function ChallengesExplorer() {
    const [challenges, setChallenges] = useState<challenge[]>([]);
    const [filter, setFilter] = useState<Difficulty | 'ALL'>('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadChallenges() {
            setLoading(true),
                setError('');
            try {
                const path = filter === 'ALL'
                    ? '/admin/challenges'
                    : `/admin/challenges?difficulty=${filter}`;

                const data = await apiFetch<challenge[]>(path);
                setChallenges(data);
            } catch (err) {
                setError(
                    err instanceof ApiError
                        ? err.message
                        : 'could not load challenges',
                );
            } finally {
                setLoading(false);
            }
        }
        void loadChallenges();
    }, [filter]);
    return (
        <main className="min-h-screen bg-[#f5efe3] p-6 text-[#493625] md:p-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/admin"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#98713f] hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>

                <header className="mb-6">
                    <h1 className="text-3xl font-bold md:text-4xl">
                        Challenges
                    </h1>
                    <p className="mt-2 text-[#806b56]">
                        Browse every challenge and filter by difficulty.
                    </p>
                </header>

                <div className="mb-6 flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setFilter(f.value)}
                            className={`rounded-lg border px-4 py-2 font-semibold shadow-sm transition ${filter === f.value
                                ? 'border-[#98713f] bg-[#98713f] text-white'
                                : 'border-[#d8c4a5] bg-[#fffaf1] hover:bg-[#eadcc5]'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading && <p>Loading challenges...</p>}

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="overflow-x-auto rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] shadow-sm">
                        <table className="w-full text-left">
                            <thead className="border-b border-[#e5d5bc] bg-[#eadcc5] text-sm uppercase tracking-wide text-[#806b56]">
                                <tr>
                                    <th className="px-4 py-3">Order</th>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Level</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {challenges.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-b border-[#e5d5bc] last:border-0 hover:bg-[#f5efe3]"
                                    >
                                        <td className="px-4 py-3">{c.order}</td>
                                        <td className="px-4 py-3 font-semibold">
                                            <Link href={`/admin/challenges/${c.id}`}
                                                className="text-[#98713f] hover:underline">
                                                {c.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyColor[c.difficulty]}`}
                                            >
                                                {c.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{c.status}</td>
                                        <td className="px-4 py-3">
                                            {new Date(
                                                c.createdAt,
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {challenges.length === 0 && (
                            <p className="p-6 text-center text-[#806b56]">
                                No challenges found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}