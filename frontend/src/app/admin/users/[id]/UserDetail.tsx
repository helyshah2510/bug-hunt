'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/src/lib/api';

type ProgressItem = {
    status: string;
    hintsUsed: number;
    updatedAt: string;
    challenge: {
        id: string;
        title: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        order: number;
    };
};

type UserProgress = {
    user: {
        id: string;
        username: string;
        email: string;
        xp: number;
        createdAt: string;
    };
    statistics: {
        totalChallengesTracked: number;
        solved: number;
        inProgress: number;
        skipped: number;
        totalAttempts: number;
        successfulAttempts: number;
        failedAttempts: number;
        xpEarnedFromAttempts: number;
    };
    progress: ProgressItem[];
};

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [data, setData] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        async function loadProgress() {
            try {
                const result = await apiFetch<UserProgress>(
                    `/admin/users/${id}/progress`,
                );
                setData(result);
            } catch (err) {
                setError(
                    err instanceof ApiError
                        ? err.message
                        : 'Could not load this player.',
                );
            } finally {
                setLoading(false);
            }
        }

        void loadProgress();
    }, [id]);

    async function handleDelete() {
        if (deleting) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
            router.replace('/admin/users');
        } catch (err) {
            setDeleteError(
                err instanceof ApiError
                    ? err.message
                    : 'Could not delete this player.',
            );
            setDeleting(false);
        }
    }

    const difficultyColor = {
        EASY: 'bg-emerald-100 text-emerald-800',
        MEDIUM: 'bg-amber-100 text-amber-800',
        HARD: 'bg-rose-100 text-rose-800',
    };

    return (
        <main className="min-h-screen bg-[#f5efe3] p-6 text-[#493625] md:p-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/admin/users"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#98713f] hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to players
                </Link>

                {loading && <p>Loading player...</p>}

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {data && (
                    <>
                        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold md:text-4xl">
                                    {data.user.username}
                                </h1>
                                <p className="mt-2 text-[#806b56]">
                                    {data.user.email}
                                </p>
                                <p className="mt-1 text-sm text-[#806b56]">
                                    Joined{' '}
                                    {new Date(
                                        data.user.createdAt,
                                    ).toLocaleDateString()}{' '}
                                    · {data.user.xp} XP
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 font-semibold text-red-800 shadow-sm transition hover:bg-red-100"
                            >
                                <Trash2 size={18} />
                                Delete player
                            </button>
                        </header>

                        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: 'Solved', value: data.statistics.solved },
                                { label: 'In progress', value: data.statistics.inProgress },
                                { label: 'Skipped', value: data.statistics.skipped },
                                { label: 'Total attempts', value: data.statistics.totalAttempts },
                                { label: 'Successful attempts', value: data.statistics.successfulAttempts },
                                { label: 'Failed attempts', value: data.statistics.failedAttempts },
                                { label: 'XP from attempts', value: data.statistics.xpEarnedFromAttempts },
                                { label: 'Challenges tracked', value: data.statistics.totalChallengesTracked },
                            ].map((item) => (
                                <article
                                    key={item.label}
                                    className="rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-5 shadow-sm"
                                >
                                    <p className="text-sm text-[#806b56]">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold">
                                        {item.value}
                                    </p>
                                </article>
                            ))}
                        </section>

                        <section className="mt-8 overflow-x-auto rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] shadow-sm">
                            <h2 className="p-5 text-xl font-bold">
                                Progress by challenge
                            </h2>
                            <table className="w-full text-left">
                                <thead className="border-y border-[#e5d5bc] bg-[#eadcc5] text-sm uppercase tracking-wide text-[#806b56]">
                                    <tr>
                                        <th className="px-4 py-3">Challenge</th>
                                        <th className="px-4 py-3">Level</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Hints used</th>
                                        <th className="px-4 py-3">Last updated</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.progress.map((p) => (
                                        <tr
                                            key={p.challenge.id}
                                            className="border-b border-[#e5d5bc] last:border-0"
                                        >
                                            <td className="px-4 py-3 font-semibold">
                                                {p.challenge.title}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${difficultyColor[p.challenge.difficulty]}`}
                                                >
                                                    {p.challenge.difficulty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{p.status}</td>
                                            <td className="px-4 py-3">{p.hintsUsed}</td>
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    p.updatedAt,
                                                ).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {data.progress.length === 0 && (
                                <p className="p-6 text-center text-[#806b56]">
                                    This player has not started any challenges yet.
                                </p>
                            )}
                        </section>
                    </>
                )}
            </div>

            {showConfirm && data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#fffaf1] p-6 shadow-xl">
                        <h2 className="text-xl font-bold">Delete this player?</h2>
                        <p className="mt-2 text-[#806b56]">
                            {data.user.username} and their progress will be
                            removed. This cannot be undone.
                        </p>

                        {deleteError && (
                            <p className="mt-3 text-sm text-red-700">
                                {deleteError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                disabled={deleting}
                                className="rounded-lg border border-[#d8c4a5] px-4 py-2 font-semibold hover:bg-[#eadcc5] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Yes, delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}