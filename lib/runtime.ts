// lib/runtime.ts
export const isTauri =
  typeof window !== 'undefined' &&
  (
    // v2 global
    (window as any).__TAURI__ ||
    // some environments expose this
    (window as any).__TAURI_INTERNAL__ ||
    // UA fallback if globals are stripped by tooling
    (typeof navigator !== 'undefined' && /\bTauri\b/i.test(navigator.userAgent))
  )
  ? true
  : false;
