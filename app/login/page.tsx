"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) { toast.error(error.message); setLoading(false); return; }
        toast.success("Account created! You can now sign in.");
        setMode("login");
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else {
        toast.success("Signed in successfully!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background page-enter">
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <div className="h-16 w-16 rounded-full bg-[#FAF5F0] flex items-center justify-center border border-[#E8DCC8] shadow-sm">
            <span className="material-symbols-outlined text-primary text-[32px]">memory</span>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-headline-md font-bold text-on-surface tracking-tight">Restia <span className="text-primary">OS</span></h1>
            <p className="font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mt-2">Authentication Gateway</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-outline-variant/20 rounded-[2rem] p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex rounded-xl bg-[#F0F4F8] p-1 mb-8">
            {(["login", "register"] as const).map((m) => (
              <button 
                key={m} 
                type="button" 
                onClick={() => setMode(m)} 
                className={`flex-1 py-2.5 rounded-lg font-mono-label text-[12px] uppercase tracking-wider transition-all ${
                  mode === m 
                    ? "bg-white text-primary shadow-sm" 
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-[48px] rounded-xl bg-[#F0F4F8] hover:bg-[#E2E8F0] transition-colors font-body-lg text-[14px] font-semibold text-on-surface mb-6 group disabled:opacity-50"
          >
            <svg className="h-5 w-5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-outline-variant/30" />
            <span className="font-mono-label text-[10px] text-on-surface-variant uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-outline-variant/30" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#F0F4F8] border-none rounded-xl px-4 h-[48px] font-body-lg text-[15px] text-on-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono-label text-[11px] text-on-surface-variant uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" minLength={6}
                  className="w-full bg-[#F0F4F8] border-none rounded-xl pl-4 pr-12 h-[48px] font-body-lg text-[15px] text-on-surface focus:outline-none"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">{showPw ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            
            <button
              type="submit" disabled={loading}
              className="w-full h-[48px] mt-4 rounded-xl bg-primary text-white font-bold text-[14px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">login</span>}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
