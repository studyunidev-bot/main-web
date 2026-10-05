import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg space-y-5 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">404</p>
        <h1 className="text-4xl font-semibold">Content not found.</h1>
        <p className="text-sm leading-7 text-slate-300">The requested page may have been removed or the slug does not exist yet.</p>
        <Link href="/" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">
          Back to homepage
        </Link>
      </div>
    </div>
  );
}