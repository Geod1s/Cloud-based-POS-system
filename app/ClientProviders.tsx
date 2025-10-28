// app/ClientProviders.tsx
'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';

import { AuthProvider } from '@/providers/AuthProvider';
import { initLocalDb } from '@/scripts/init-local-db';
import { runSync } from '@/lib/sync';
import { useOnlineStatus } from '@/hooks/useonlinestatus';
import { isTauri } from '@/lib/runtime';
import { supabase } from '@/lib/supabase';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();

  useEffect(() => {
    if (!isTauri) return;                 // ⬅️ guard
    initLocalDb().catch(console.error);
  }, []);

  useEffect(() => {
    if (!isTauri) return;                 // ⬅️ guard
    if (online) {
      
      supabase.auth.startAutoRefresh?.();
      runSync().catch(console.error);
    } else {
      
      supabase.auth.stopAutoRefresh?.();
    }
    const t = setInterval(() => { if (online) runSync().catch(console.error); }, 60_000);
    return () => clearInterval(t);
  }, [online]);

  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
