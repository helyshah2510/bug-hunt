'use client';

import { useSessionRefresh } from '@/src/lib/useSessionRefresh';

export default function SessionKeeper() {
  useSessionRefresh();
  return null; // shows nothing, only runs the hook
}