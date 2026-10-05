"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-300">Something went wrong</p>
        <h1 className="text-4xl font-semibold">The page could not be rendered.</h1>
        <p className="text-sm leading-7 text-slate-300">{error.message || "Please try again or return to the homepage."}</p>
        <button onClick={reset} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">
          Try again
        </button>
      </div>
    </div>
  );
}