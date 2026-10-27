'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from "@/src/lib/api";
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');
        try {
            const data = await apiFetch<{ accessToken: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            localStorage.setItem('token', data.accessToken);
            const user = await apiFetch<{ role: 'ADMIN' | 'PLAYER' }>(
                '/auth/me',
            );
            if (user.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/challenges');
            }
        } catch (err) {
            localStorage.removeItem('token');
            setError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
    }
    return (
        <main className="login-scene relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center p-4">
            {/* Floating dust */}

            <div className="dust-layer" aria-hidden="true">
                {Array.from({ length: 500 }, (_, i) => (
                    <span
                        key={i}
                        className="dust-particle"
                        style={{
                            left: `${(i * 37 + 11) % 100}%`,
                            top: `${(i * 53 + 7) % 100}%`,
                            animationDelay: `${(i % 8) * 0.5}s`,
                        }}
                    />
                ))}
            </div>
            <form onSubmit={handleSubmit}
                className="login-dossier relative z-10 w-full max-w-sm space-y-4 rounded-md border-2 border-[#d9c391] bg-[#f4e4bc] p-6 text-[#2b1d0e] shadow-2xl">
                <div className="text-center">
                    <p className="mb-2 font-mono text-[10px] tracking-[3px] text-[#8a6339]">
                        PERSONNEL RECORD • #001
                    </p>
                    <h1 className="font-serif text-2xl font-extrabold">
                        Welcome Back, Detective!
                    </h1>
                    <p className="text-sm opacity-70">
                        Log in to continue your investigation.
                    </p>
                </div>

                <label className="block text-sm font-semibold">
                    Email
                    <div className="login-input mt-1 flex items-center gap-2 rounded border border-[#d9c391] bg-[#fbf3dc] px-3">
                        <Mail size={16} />
                        <input className="w-full bg-transparent py-2 font-normal outline-none" type="email"
                            placeholder="your@email.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                </label>

                <label className="block text-sm font-semibold">
                    Password
                    <div className="login-input mt-1 flex items-center gap-2 rounded border border-[#d9c391] bg-[#fbf3dc] px-3">
                        <Lock size={16} />
                        <input className="w-full bg-transparent py-2 font-normal outline-none"
                            type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                            value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </label>

                {error && <p className="text-sm text-red-700">{error}</p>}

                <button disabled={loading}
                    className="login-submit w-full rounded bg-[#f5a623] p-2 font-bold hover:brightness-95 disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <p className="text-center text-sm">
                    Don't have an account? <Link href="/register" className="login-link font-semibold underline">Sign up</Link>
                </p>
            </form>
        </main>
    );
}