'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/src/lib/api';

const REFRESH_EVERY = 10 * 60 * 1000; // 10 min

export function useSessionRefresh() {
  const router = useRouter();
  const wasActive = useRef(false);

  useEffect(() => {
    const markActive = () => { wasActive.current = true; };
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    // capture: true so we still hear events from inside the code editor
    events.forEach((e) => window.addEventListener(e, markActive, true));

    const timer = setInterval(async () => {
      if (!wasActive.current) return;               // idle: let the token run out
      if (!localStorage.getItem('token')) return;
      wasActive.current = false;

      try {
        const data = await apiFetch<{ accessToken: string }>(
          '/auth/refresh',
          { method: 'POST' },
        );
        localStorage.setItem('token', data.accessToken);
      } catch {
        // Token was already dead: user came back after being idle
        localStorage.removeItem('token');
        router.push('/login?expired=true');
      }
    }, REFRESH_EVERY);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive, true));
      clearInterval(timer);
    };
  }, [router]);
}