"use client";

import { useState } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncData } from "@/lib/commands";

function getErrMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

export function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setSyncing(true);
    try {
      await syncData(); // your function that does the work
      toast({ title: "Synced", description: "All set!" });
    } catch (e) {
      toast({ title: "Sync failed", description: getErrMsg(e) });
      console.error("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={syncing}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm disabled:opacity-50"
    >
      {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      {syncing ? "Syncing…" : "Sync now"}
    </button>
  );
}
