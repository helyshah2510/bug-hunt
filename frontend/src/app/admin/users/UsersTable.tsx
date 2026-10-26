'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/src/lib/api";
import { ArrowLeft, Search } from "lucide-react";

type Player = {
    id: string;
    username: string;
    email: string;
    role: 'ADMIN' | 'PLAYER';
    xp: number;
    createdAt: string;
};

export default function UsersTable() {
    const [players, setPlayers] = useState<Player[]>([])
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadPlayers() {
            try {
                const data = await apiFetch<Player[]>('/admin/users');
                setPlayers(data);
            } catch (err) {
                setError(
                    err instanceof ApiError
                        ? err.message
                        : 'could not load players',
                );
            } finally {
                setLoading(false);
            }
        }
        void loadPlayers();
    }, []);

    const visible = players.filter(
        (p) =>
            p.username.toLowerCase().includes(search.toLowerCase()) ||
            p.email.toLowerCase().includes(search.toLowerCase()),
    );
    return (
        <main className="min-h-screen bg-[#f5efe3] p-6 text-[#493625] md:p-10">
            <div className="mx-auto max-w-6xl">
                <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#98713f] hover:underline">
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
                <header className="mb-6">
                    <h1 className="text-3xl font-bold md:text-4xl">Players</h1>
                    <p className="mt-2 text-[#806b56]">Click a player to see their progress</p>
                </header>
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#d8c4a5] bg-[#fffaf1] px-3 shadow-sm">
                    <Search size={18} className="text-[#806b56]" />
                    <input
                        type="text"
                        placeholder="Search by username or email"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent py-2 outline-none"
                    />
                </div>
                {loading && <p>Loading players...</p>}
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
                                    <th className="px-4 py-3">Username</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">XP</th>
                                    <th className="px-4 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((p) => (
                                    <tr key={p.id} className="border-b border-[#e5d5bc] last:border-0 hover:bg-[#f5efe3]">
                                        <td className="px-4 py-3 font-semibold">
                                            <Link href={`/admin/users/${p.id}`}
                                                className="text-[#98713f] hover:underline">
                                                {p.username}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">{p.email}</td>
                                        <td className="px-4 py-3">{p.xp}</td>
                                        <td className="px-4 py-3">
                                            {new Date(
                                                p.createdAt,
                                            ).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {visible.length === 0 && (
                            <p className="p-6 text-center text-[#806b56]">
                                No players found.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}