// app/init-local-db.tsx
"use client";
import { useEffect } from "react";
import { getLocalDb } from "@/lib/local-db";

export default function InitLocalDb() {
  useEffect(() => {
    getLocalDb().catch(console.error);
  }, []);
  return null;
}
