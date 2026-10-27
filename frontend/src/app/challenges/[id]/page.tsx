'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Editor from '@monaco-editor/react';
import { apiFetch, ApiError } from '@/src/lib/api';
import type { CaseDetail, Me, RunResult, SubmitResult } from '@/src/lib/types';

function CaseContent() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<CaseDetail | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [output, setOutput] = useState('');
    const [hasRun, setHasRun] = useState(false);
    const [me, setMe] = useState<Me | null>(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [running, setRunning] = useState(false);

    const refreshMe = () => apiFetch<Me>('/auth/me').then(setMe).catch(() => { });

    useEffect(() => {
        apiFetch<CaseDetail>(`/challenges/${id}`)
            .then((d) => {
                setData(d);
                setCode(d.brokenCode);
            })
            .catch((err) => {
                if (err instanceof ApiError && err.status === 401) router.push('/login');
                else setError(err instanceof Error ? err.message : 'Something went wrong');
            });
        apiFetch<Me>('/auth/me').then(setMe).catch(() => { });
    }, [id, router]);

    async function handleRun() {
        if (running || busy) return;
        setRunning(true);
        setHasRun(false);
        setOutput('Running...');
        try {
            const r = await apiFetch<RunResult>('/runner/run', {
                method: 'POST',
                body: JSON.stringify({ source: code }),
            });
            setOutput(r.outcome === 'success' ? r.output || '(no output)' : `${r.outcome}: ${r.error ?? ''}`);
        } catch (err) {
            setOutput(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setRunning(false);
        }
    }

    async function act(fn: () => Promise<void>) {
        if (busy) return;
        setBusy(true);
        setMessage('');
        try {
            await fn();
        } catch (err) {
            setMessage(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setBusy(false);
            refreshMe();
        }
    }

    const handleSubmit = () => act(async () => {
        const r = await apiFetch<SubmitResult>(`/challenges/${id}/submit`, {
            method: 'POST',
            body: JSON.stringify({ code }),
        });
        if (r.passed) {
            alert(
                r.xpEarned > 0
                    ? `🎉 Yay! Case solved! You earned ${r.xpEarned} XP!`
                    : '🎉 Yay! Case solved!'
            );
            router.push('/levels/${data.difficulty}');
            return;
        }
        alert('❌ Wrong answer. You lost an attempt. Check your code and try again!');
    });

    const handleHint = () => act(async () => {
        const r = await apiFetch<{ hint: string; hintNumber: number }>(`/challenges/${id}/hint`, { method: 'POST' });
        setData((d) => d && { ...d, hints: [...d.hints, r.hint], hintsUsed: r.hintNumber });
    });

    const handleSkip = () => act(async () => {
        if (!data || !window.confirm(`Skip this case for ${data.skipCost} XP?`)) return;
        await apiFetch(`/challenges/${id}/skip`, { method: 'POST' });
        router.push(`/levels/${data.difficulty}`);
    });

    const page = 'min-h-screen bg-cover bg-center p-4 text-white';
    const bg = { backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/login-bg.png')" };

    if (error) {
        return (
            <main className={page} style={bg}>
                <p className="text-red-300">{error}</p>
                <Link href="/challenges" className="underline">← Back to Challenges</Link>
            </main>
        );
    }
    if (!data) return <p className="p-6">Loading...</p>;

    const open = data.status === 'IN_PROGRESS';
    const locked = me?.lockedUntil && new Date(me.lockedUntil) > new Date();

    return (
        <main className={page} style={bg}>
            <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between">
                    <Link href={`/levels/${data.difficulty}`} className="text-sm underline">
                        ← Back to {data.difficulty} cases
                    </Link>
                    {me && (
                        <span className="text-sm">
                            ⭐ {me.xp} XP · {locked ? '🔒 Locked' : `❤️ ${me.lockedUntil ? 5 : me.attemptsLeft}/5`}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <section className="rounded-md border-2 border-[#d9c391] bg-[#f4e4bc] p-5 text-[#2b1d0e]">
                        <p className="text-xs font-bold opacity-70">{data.difficulty} · CASE {data.order}</p>
                        <h1 className="font-serif text-2xl font-extrabold">{data.title}</h1>
                        <p className="mt-3 whitespace-pre-wrap text-sm">{data.description}</p>

                        {data.hints.map((h, i) => (
                            <p key={i} className="mt-3 rounded bg-[#fbf3dc] p-2 text-sm">💡 Hint {i + 1}: {h}</p>
                        ))}

                        {data.explanation && (
                            <div className="mt-4 rounded border border-green-700 bg-green-100 p-3 text-sm">
                                <b>Case closed!</b>
                                <p className="mt-1 whitespace-pre-wrap">{data.explanation}</p>
                            </div>
                        )}
                    </section>

                    <section className="space-y-3">
                        <div className="overflow-hidden rounded-md border border-gray-600">
                            <Editor height="380px" language="python" theme="vs-dark" value={code}
                                onChange={(v) => setCode(v ?? '')}
                                options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false }} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button onClick={handleRun} disabled={running || busy}
                                className="rounded bg-gray-200 px-4 py-2 font-bold text-black disabled:opacity-50">
                                {running ? 'Running...' : '▶ Run (free)'}
                            </button>
                            <button onClick={handleSubmit} disabled={running || busy || !open || hasRun}
                                className="rounded bg-[#f5a623] px-4 py-2 font-bold text-black disabled:opacity-50">
                                Submit (+{data.solveReward})
                            </button>
                            <button onClick={handleHint}
                                disabled={running || busy || !open || data.hintsUsed >= data.hintsTotal}
                                className="rounded bg-blue-500 px-4 py-2 font-bold disabled:opacity-50">
                                💡 Hint (-{data.hintCost})
                            </button>
                            <button onClick={handleSkip} disabled={running || busy || !open}
                                className="rounded bg-red-600 px-4 py-2 font-bold disabled:opacity-50">
                                ⏭ Skip (-{data.skipCost})
                            </button>
                        </div>

                        {message && <p className="rounded bg-black/70 p-3 text-sm">{message}</p>}

                        <pre className="min-h-20 whitespace-pre-wrap rounded bg-black/70 p-3 text-sm">
                            {output || 'Output will appear here'}
                        </pre>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default function CasePage() {
    return (
        <Suspense fallback={<p className="p-6">Loading...</p>}>
            <CaseContent />
        </Suspense>
    );
}