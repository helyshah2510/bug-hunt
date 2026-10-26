'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiFetch, ApiError } from '@/src/lib/api';

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

type ChallengeFull = {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    brokenCode: string;
    referenceSolution: string;
    explanation: string;
    order: number;
    status: 'DRAFT' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    hints: { id: string; order: number; text: string }[];
    testCases: {
        id: string;
        order: number;
        input: string;
        expectedOutput: string;
    }[];
};

const difficultyColor: Record<Difficulty, string> = {
    EASY: 'bg-emerald-100 text-emerald-800',
    MEDIUM: 'bg-amber-100 text-amber-800',
    HARD: 'bg-rose-100 text-rose-800',
};

const statusColor: Record<ChallengeFull['status'], string> = {
    DRAFT: 'bg-slate-100 text-slate-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-rose-100 text-rose-800',
};

export default function ChallengeDetail() {
    const { id } = useParams<{ id: string }>();

    const [challenge, setChallenge] = useState<ChallengeFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadChallenge() {
            try {
                const data = await apiFetch<ChallengeFull>(
                    `/admin/challenges/${id}`,
                );
                setChallenge(data);
            } catch (err) {
                setError(
                    err instanceof ApiError
                        ? err.message
                        : 'Could not load this challenge.',
                );
            } finally {
                setLoading(false);
            }
        }

        void loadChallenge();
    }, [id]);

    return (
        <main className="min-h-screen bg-[#f5efe3] p-6 text-[#493625] md:p-10">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/admin/challenges"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#98713f] hover:underline"
                >
                    <ArrowLeft size={16} />
                    Back to challenges
                </Link>

                {loading && <p>Loading challenge...</p>}

                {error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                        {error}
                    </div>
                )}

                {challenge && (
                    <>
                        <header className="mb-6">
                            <h1 className="text-3xl font-bold md:text-4xl">
                                {challenge.title}
                            </h1>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                                <span
                                    className={`rounded-full px-3 py-1 font-semibold ${difficultyColor[challenge.difficulty]}`}
                                >
                                    {challenge.difficulty}
                                </span>
                                <span
                                    className={`rounded-full px-3 py-1 font-semibold ${statusColor[challenge.status]}`}
                                >
                                    {challenge.status}
                                </span>
                                <span className="text-[#806b56]">
                                    Question {challenge.order} · Created{' '}
                                    {new Date(
                                        challenge.createdAt,
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                        </header>

                        <section className="rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                            <h2 className="text-xl font-bold">Description</h2>
                            <p className="mt-2 whitespace-pre-wrap">
                                {challenge.description}
                            </p>
                        </section>

                        <div className="mt-6 grid gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                                <h2 className="text-xl font-bold">
                                    Broken code (what players see)
                                </h2>
                                <pre className="mt-3 overflow-x-auto rounded-lg bg-[#2b1d0e] p-4 text-sm text-[#f4e4bc]">
                                    {challenge.brokenCode}
                                </pre>
                            </section>

                            <section className="rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                                <h2 className="text-xl font-bold">
                                    Reference solution (admin only)
                                </h2>
                                <pre className="mt-3 overflow-x-auto rounded-lg bg-[#2b1d0e] p-4 text-sm text-[#f4e4bc]">
                                    {challenge.referenceSolution}
                                </pre>
                            </section>
                        </div>

                        <section className="mt-6 rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                            <h2 className="text-xl font-bold">Explanation</h2>
                            <p className="mt-2 whitespace-pre-wrap">
                                {challenge.explanation}
                            </p>
                        </section>

                        <section className="mt-6 rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] p-6 shadow-sm">
                            <h2 className="text-xl font-bold">
                                Hints ({challenge.hints.length})
                            </h2>
                            {challenge.hints.length === 0 ? (
                                <p className="mt-2 text-[#806b56]">
                                    No hints for this challenge.
                                </p>
                            ) : (
                                <ol className="mt-3 space-y-2">
                                    {challenge.hints.map((h) => (
                                        <li
                                            key={h.id}
                                            className="rounded-lg bg-[#f5efe3] p-3"
                                        >
                                            <span className="font-semibold">
                                                Hint {h.order}:
                                            </span>{' '}
                                            {h.text}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>

                        <section className="mt-6 overflow-x-auto rounded-2xl border border-[#e5d5bc] bg-[#fffaf1] shadow-sm">
                            <h2 className="p-6 pb-3 text-xl font-bold">
                                Test cases ({challenge.testCases.length})
                            </h2>
                            <table className="w-full text-left">
                                <thead className="border-y border-[#e5d5bc] bg-[#eadcc5] text-sm uppercase tracking-wide text-[#806b56]">
                                    <tr>
                                        <th className="px-4 py-3">#</th>
                                        <th className="px-4 py-3">Input</th>
                                        <th className="px-4 py-3">
                                            Expected output
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {challenge.testCases.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="border-b border-[#e5d5bc] last:border-0"
                                        >
                                            <td className="px-4 py-3">
                                                {t.order}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">
                                                {t.input}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm">
                                                {t.expectedOutput}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {challenge.testCases.length === 0 && (
                                <p className="p-6 text-center text-[#806b56]">
                                    No test cases for this challenge.
                                </p>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}