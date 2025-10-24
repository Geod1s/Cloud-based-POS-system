// components/sync-button.tsx
"use client";
import { useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncNow } from "@/lib/sync";

export function SyncButton() {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const onClick = async () => {
    setBusy(true);
    try {
      const res = await syncNow();
      toast({ title: res.ok ? "Synced" : "Not synced", description: res.message });
    } catch (e: any) {
      toast({ title: "Sync failed", description: e?.message || "Unknown error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      {busy ? "Syncing…" : "Sync now"}
    </button>
  );
}
