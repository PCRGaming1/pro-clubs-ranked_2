// Shared Tailwind class strings for form controls, kept in one place so
// every auth/challenge/squad form looks the same.

export const inputClass =
  "w-full rounded-md border border-[var(--pcr-border)] bg-[var(--pcr-bg)] px-3 py-2 text-sm text-[var(--pcr-fg)] placeholder:text-[var(--pcr-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pcr-accent-strong)] focus:border-transparent";

export const labelClass =
  "block text-xs font-[family-name:var(--font-mono)] uppercase tracking-wide text-[var(--pcr-muted)] mb-1";

export const primaryButtonClass =
  "w-full rounded-md bg-[var(--pcr-accent-strong)] text-[var(--pcr-accent-strong-fg)] font-medium px-4 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";

export const secondaryButtonClass =
  "rounded-md border border-[var(--pcr-border)] px-4 py-2 text-sm hover:bg-[var(--pcr-bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export const errorTextClass = "text-sm text-[var(--pcr-danger)]";
export const successTextClass = "text-sm text-[var(--pcr-success)]";
