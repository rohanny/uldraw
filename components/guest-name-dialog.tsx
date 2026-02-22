"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

interface GuestNameDialogProps {
  isOpen: boolean;
  canClose?: boolean;
  onClose?: () => void;
  onComplete: (name: string, avatarSeed: string) => void;
  initialName?: string;
  initialAvatarSeed?: string;
}

export default function GuestNameDialog({ isOpen, canClose, onClose, onComplete, initialName = "", initialAvatarSeed = "" }: GuestNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [avatarSeed, setAvatarSeed] = useState(initialAvatarSeed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate a permanent random seed for this session when dialog opens
    if (isOpen && !avatarSeed) {
      setAvatarSeed(Math.random().toString(36).substring(7));
    } else if (isOpen && initialAvatarSeed) {
      setAvatarSeed(initialAvatarSeed);
    }
    if (isOpen && initialName) {
      setName(initialName);
    }
  }, [isOpen, avatarSeed, initialAvatarSeed, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !avatarSeed) return;

    setLoading(true);
    try {
      // Save it to Supabase session metadata so it persists locally
      await supabase.auth.updateUser({
        data: { full_name: name.trim(), avatar_seed: avatarSeed }
      });
      onComplete(name.trim(), avatarSeed);
    } catch (err) {
      console.error("Failed to update guest name", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm m-4 flex flex-col gap-6 relative"
          >
            {canClose && onClose && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {canClose ? "Edit Profile" : "Welcome, Guest!"}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {canClose ? "Change what people call you." : "What would you like to be called?"}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-indigo-500 border-4 border-white dark:border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden">
                  {avatarSeed && (
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`}
                      alt="Random Avatar" 
                      className="w-full h-full object-cover bg-indigo-100 dark:bg-zinc-800"
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-0.5 rounded-full left-1/2 -translate-x-1/2 whitespace-nowrap shadow-sm">
                  LOCKED
                </div>
              </div>
              <p className="text-xs text-zinc-400 text-center max-w-[200px]">
                You've been assigned this random avatar for your session.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter display name..."
                required
                maxLength={20}
                className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors text-center font-medium"
              />
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2 shadow-sm"
              >
                {loading ? "Saving..." : canClose ? "Save Profile" : "Join Canvas"}
                {!canClose && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
