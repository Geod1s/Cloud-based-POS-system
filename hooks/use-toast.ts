// hooks/use-toast.ts
"use client";

import { type ClassValue } from "clsx"; // safe to keep/remove; not required
import { toast as sonnerToast } from "sonner";

// Shape that matches shadcn's API
type ShadcnToast = {
  title?: string;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  duration?: NonNullable<Parameters<typeof sonnerToast>[1]>["duration"];
  className?: NonNullable<Parameters<typeof sonnerToast>[1]>["className"];
};

// Overloads so BOTH forms work:
// - toast("Saved", { description: "OK" })
// - toast({ title: "Saved", description: "OK" })
export function toast(message: string, options?: Parameters<typeof sonnerToast>[1]): string;
export function toast(opts: ShadcnToast): string;
export function toast(arg1: string | ShadcnToast, arg2?: Parameters<typeof sonnerToast>[1]) {
  if (typeof arg1 === "string") {
    return sonnerToast(arg1, arg2);
  }
  const { title = "", description, action, ...rest } = arg1;
  return sonnerToast(title, { description, action, ...rest });
}

export function useToast() {
  return { toast };
}
