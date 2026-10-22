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
    const [password,setPassword]=useState('');
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
            router.push('/challenges');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }
    return (
        <main className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
            style={{ backgroundImage: "url('/login-bg.png')" }}>
            <form onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-4 rounded-md border-2 border-[#d9c391] bg-[#f4e4bc] p-6 text-[#2b1d0e] shadow-2xl">
                <div className="text-center">
                    <h1 className="font-serif text-2xl font-extrabold">
                        Welcome Back, Detective!
                    </h1>
                    <p className="text-sm opacity-70">Log in to continue your investigation.</p>
                </div>

                <label className="block text-sm font-semibold">
                    Email
                    <div className="mt-1 flex items-center gap-2 rounded border border-[#d9c391] bg-[#fbf3dc] px-3">
                        <Mail size={16} />
                        <input className="w-full bg-transparent py-2 font-normal outline-none" type="email"
                            placeholder="your@email.com" value={email}
                            onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                </label>

                <label className="block text-sm font-semibold">
                    Password
                    <div className="mt-1 flex items-center gap-2 rounded border border-[#d9c391] bg-[#fbf3dc] px-3">
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
                    className="w-full rounded bg-[#f5a623] p-2 font-bold hover:brightness-95 disabled:opacity-50">
                    {loading ? 'Logging in...' : 'Log In'}
                </button>

                <p className="text-center text-sm">
                    Don't have an account? <Link href="/register" className="font-semibold underline">Sign up</Link>
                </p>
            </form>
        </main>
    );
}