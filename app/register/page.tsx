"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthWrapper from "@/components/auth-wrapper";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });
      
      if (signUpError) {
        throw signUpError;
      }
      
      toast.success("Account created successfully!");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setLoading(true);
    
    try {
      const { error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        throw signInError;
      }
      
      toast.success("Logged in as Guest!");
      router.push("/");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthWrapper requireAuth={false}>
      <div className="min-h-screen w-full flex items-center justify-center bg-[#121212] font-sans selection:bg-white/20">
      <div className="w-full max-w-[400px] p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 relative">
            <div className="w-8 h-8 bg-zinc-800 rounded-md mb-4 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-100">
              Create an account
            </h1>
            <p className="text-sm text-zinc-400">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-colors"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-colors"
                placeholder="Create a password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 text-sm"
            >
              {loading ? "Signing up..." : "Sign up"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Or</span>
            <div className="h-[1px] flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? "Please wait..." : "Continue as Guest"}
          </button>

          <p className="text-center text-xs text-zinc-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
    </AuthWrapper>
  );
}
