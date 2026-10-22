'use client';

import { Suspense,useState,useEffect } from "react";
import { useParams,useRouter } from 'next/navigation';
import Link from "next/link";
import { apiFetch,ApiError } from "@/src/lib/api";
import { CaseItem,Level } from "@/src/lib/types";

const LEVELS:Level[]=['EASY','MEDIUM','HARD'];
const MARK = { SOLVED: '✓', SKIPPED: '⏭', OPEN: '●', LOCKED: '🔒' } as const;
const STYLE = {
    SOLVED: 'bg-green-600 border-green-300',
    SKIPPED: 'bg-yellow-600 border-yellow-300',
    OPEN: 'bg-amber-400 border-white text-black animate-pulse',
    LOCKED: 'bg-black/60 border-gray-600 opacity-60',
} as const;

function LevelContent() {
    const router = useRouter();
    const params = useParams<{ level: string }>();
    const level = params.level.toUpperCase() as Level;

    const [cases, setCases] = useState<CaseItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        apiFetch<CaseItem[]>('/challenges')
            .then((data) => {
                setCases(data.filter((c) => c.difficulty === level));
                setLoaded(true);
            })
            .catch((err) => {
                if (err instanceof ApiError && err.status === 401) router.push('/login');
                else setError(err instanceof Error ? err.message : 'Something went wrong');
            });
    }, [level, router]);

    if (!LEVELS.includes(level)) return <p className="p-6">Level not found</p>;
    if (error) return <p className="p-6 text-red-600">{error}</p>;
    if (!loaded) return <p className="p-6">Loading...</p>;

    const done = cases.filter((c) => c.state === 'SOLVED' || c.state === 'SKIPPED').length;

    return (
        <main className="min-h-screen bg-cover bg-center p-4 text-white"
            style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/login-bg.png')" }}>
            <div className="mx-auto max-w-2xl">
                <Link href="/challenges" className="text-sm underline">← Back to Challenges</Link>

                <h1 className="mt-4 text-center font-serif text-3xl font-extrabold">{level} Cases</h1>
                <p className="mt-1 text-center text-sm opacity-80">
                    Complete the cases in order to unlock new ones. {done}/10 done
                </p>

                <div className="mt-8 grid grid-cols-5 gap-4">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((order) => {
                        const c = cases.find((x) => x.order === order);
                        const state = c?.state ?? 'LOCKED';
                        const circle = (
                            <div title={c?.title ?? 'Coming soon'}
                                className={`flex aspect-square items-center justify-center rounded-full border-2 text-lg font-bold ${STYLE[state]}`}>
                                {state === 'OPEN' || state === 'LOCKED' ? order : MARK[state]}
                            </div>
                        );
                        return c && state === 'OPEN'
                            ? <Link key={order} href={`/challenges/${c.id}`}>{circle}</Link>
                            : <div key={order}>{circle}</div>;
                    })}
                </div>

                <p className="mt-6 text-center text-xs opacity-70">✓ solved · ⏭ skipped · glowing = your next case</p>
            </div>
        </main>
    );
}
export default function LevelPage(){
    return(
        <Suspense fallback={<p className="p-6">Loading...</p>}>
            <LevelContent/>
        </Suspense>
    );
}