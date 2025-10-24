// hooks/use-toast.ts
"use client";

import * as React from "react";
import { type ClassValue } from "clsx"; // safe to keep/remove; not required
import { toast as sonnerToast } from "sonner";

// Shape that matches shadcn's API + adds `variant` for compatibility
type ShadcnToast = {
  title?: string;
  description?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  duration?: NonNullable<Parameters<typeof sonnerToast>[1]>["duration"];
  className?: NonNullable<Parameters<typeof sonnerToast>[1]>["className"];
  // NEW: accept variant like many shadcn examples
  variant?: "default" | "destructive" | "success" | "info";
};

// Overloads so BOTH forms work:
// - toast("Saved", { description: "OK" })
// - toast({ title: "Saved", description: "OK", variant: "success" })
export function toast(message: string, options?: Parameters<typeof sonnerToast>[1]): string;
export function toast(opts: ShadcnToast): string;
export function toast(arg1: string | ShadcnToast, arg2?: Parameters<typeof sonnerToast>[1]) {
  if (typeof arg1 === "string") {
    return sonnerToast(arg1, arg2);
  }

  const { title = "", description, action, variant, ...rest } = arg1;

  // Map `variant` to sonner's helpers without breaking existing behavior
  switch (variant) {
    case "destructive":
      return sonnerToast.error(title || "Error", { description, action, ...rest });
    case "success":
      return sonnerToast.success(title || "Success", { description, action, ...rest });
    case "info":
      return sonnerToast(title || "Info", { description, action, ...rest });
    default:
      return sonnerToast(title, { description, action, ...rest });
  }
}

export function useToast() {
  return { toast };
}
