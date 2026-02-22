import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        const user = await login.mutateAsync({ email, password });
        navigate(user.onboardingCompleted ? "/dashboard" : "/onboarding");
      } else {
        await register.mutateAsync({ username, email, password });
        navigate("/onboarding");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <span className="font-bold text-sm tracking-tight text-white">FP</span>
          </div>
          <span className="font-semibold text-slate-100 tracking-tight text-xl">FlowPulse</span>
        </div>

        <div className="glass rounded-2xl border border-slate-700/80 p-6 shadow-soft">
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-slate-900/60 p-1 mb-6 gap-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  mode === m
                    ? "bg-slate-700 text-slate-100 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourhandle"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full btn-gradient text-sm font-semibold text-slate-900 rounded-full py-2.5 shadow-lg hover-elevate active-elevate-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending
                ? "Please wait..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            {mode === "login" ? (
              <>
                No account?{" "}
                <button onClick={() => setMode("register")} className="text-emerald-400 hover:text-emerald-300 transition">
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-emerald-400 hover:text-emerald-300 transition">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          <a href="/" className="hover:text-slate-400 transition">← Back to homepage</a>
        </p>
      </div>
    </div>
  );
}
