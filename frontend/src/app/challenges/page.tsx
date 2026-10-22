'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/src/lib/api';
import type { CaseItem, Level, Me } from '@/src/lib/types';

const LEVELS: { key: Level; label: string; blurb: string; color: string }[] = [
    { key: 'EASY', label: 'Easy', blurb: 'Perfect for beginners', color: 'from-green-700 to-green-500' },
    { key: 'MEDIUM', label: 'Medium', blurb: 'Level up your skills', color: 'from-orange-700 to-orange-500' },
    { key: 'HARD', label: 'Hard', blurb: 'For true detectives', color: 'from-red-900 to-red-600' },
];

export default function ChallengesPage() {
    const router = useRouter();
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [me, setMe] = useState<Me | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([apiFetch<CaseItem[]>('/challenges'), apiFetch<Me>('/auth/me')])
            .then(([c, m]) => {
                setCases(c);
                setMe(m);
            })
            .catch((err) => {
                if (err instanceof ApiError && err.status === 401) {
                    router.push('/login');
                } else {
                    setError(err instanceof Error ? err.message : 'Something went wrong');
                }
            });
    }, [router]);

    function logout() {
        localStorage.removeItem('token');
        router.push('/login');
    }

    if (error) return <p className="p-6 text-red-600">{error}</p>;
    if (!me) return <p className="p-6">Loading...</p>;

    const lockActive = me.lockedUntil !== null && new Date(me.lockedUntil) > new Date();
    const attempts = me.lockedUntil !== null && !lockActive ? 5 : me.attemptsLeft;

    return (
        <main className="min-h-screen bg-cover bg-center p-4 text-white"
            style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/login-bg.png')" }}>
            <header className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded bg-black/40 p-3">
                <span className="font-bold">🕵️ {me.username}</span>
                <span>⭐ {me.xp} XP</span>
                <span>{lockActive ? '🔒 Locked for a while' : `❤️ ${attempts}/5 attempts`}</span>
                <button onClick={logout} className="text-sm underline">Log out</button>
            </header>

            <h1 className="my-8 text-center font-serif text-3xl font-extrabold">Choose Your Cases</h1>

            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
                {LEVELS.map(({ key, label, blurb, color }) => {
                    const list = cases.filter((c) => c.difficulty === key);
                    const done = list.filter((c) => c.state === 'SOLVED' || c.state === 'SKIPPED').length;
                    const locked = list.length === 0 || list[0].state === 'LOCKED';

                    const card = (
                        <div className={`rounded-lg bg-gradient-to-b p-6 text-center shadow-xl ${color} ${locked ? 'opacity-50' : 'hover:scale-105 transition'}`}>
                            <h2 className="text-2xl font-extrabold">{locked && '🔒 '}{label}</h2>
                            <p className="mt-1 text-sm opacity-90">{blurb}</p>
                            <p className="mt-4 rounded bg-black/30 py-1 text-sm">
                                {list.length === 0 ? 'Coming soon' : `${done}/${list.length} cases done`}
                            </p>
                        </div>
                    );

                    return locked ? <div key={key}>{card}</div> : <Link key={key} href={`/levels/${key}`}>{card}</Link>;
                })}
            </div>
        </main>
    );
}