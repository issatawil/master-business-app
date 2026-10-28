import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { AuthUser } from "../lib/types";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demo.com" },
  { label: "Sales", email: "sales@demo.com" },
  { label: "Procurement", email: "procurement@demo.com" },
] as const;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
        email: email.trim().toLowerCase(), password,
      });
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (err) {
      const response = err as { response?: { status?: number } };
      setError(response.response?.status === 429
        ? "Too many attempts. Please try again later."
        : "Sign in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f5f5f6] px-4 py-10 sm:px-6">
      <div className="w-full max-w-[430px] rounded-[18px] border border-neutral-200 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">M</div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold leading-5 text-neutral-900">Master Business Management</h1>
            <p className="text-xs text-neutral-400">Sign in to continue</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Sign in">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-neutral-700">Email</label>
            <input id="login-email" autoComplete="username" type="email" required value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@demo.com"
              className="min-h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-neutral-700">Password</label>
            <div className="relative">
              <input id="login-password" autoComplete="current-password" type={showPassword?"text":"password"} required value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-11 w-full rounded-lg border border-neutral-200 px-3 pr-16 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"/>
              <button type="button" onClick={()=>setShowPassword(s=>!s)}
                className="absolute inset-y-0 right-2 rounded px-2 text-xs font-medium text-neutral-500 hover:text-indigo-600"
                aria-label={showPassword?"Hide password":"Show password"}>{showPassword?"Hide":"Show"}</button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={loading}
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
            {loading?"Signing in…":"Sign in"}
          </button>
        </form>

        <section className="mt-7 border-t border-neutral-100 pt-5" aria-label="Demo accounts">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Demo Accounts</h2>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map(account => (
              <div key={account.email} className="flex min-w-0 items-center justify-between gap-2 rounded-md py-1">
                <p className="min-w-0 truncate text-xs text-neutral-500">
                  <span className="font-medium text-neutral-700">{account.label}</span> — {account.email}
                </p>
                <button type="button" onClick={() => {
                    setEmail(account.email);
                    setError(null);
                    if (import.meta.env.DEV) setPassword("password123");
                  }}
                  className="shrink-0 rounded-md border border-neutral-200 px-3 py-1 text-[11px] font-semibold text-indigo-600 transition hover:border-indigo-200 hover:bg-indigo-50">
                  Use {account.label}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-neutral-400">
            {import.meta.env.DEV
              ? "Local development password: password123."
              : "Choose an account, then enter its password. Demo passwords are not embedded in the website."}
          </p>
        </section>
      </div>
    </main>
  );
}
