"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomId: string;
}

export default function ShareDialog({ isOpen, onClose, currentRoomId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const isGlobal = currentRoomId === "global";

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Construct the shareable URL
      const url = new URL(window.location.href);
      if (isGlobal || currentRoomId === "global") {
        url.search = ""; // Global room is just the base URL
      } else {
        url.searchParams.set("room", currentRoomId);
      }
      setShareUrl(url.toString());
    }
  }, [currentRoomId, isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const generatePrivateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    const url = new URL(window.location.href);
    url.searchParams.set("room", newRoomId);
    window.location.href = url.toString(); // Force a hard navigation to reload cleanly into the new room
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-[#1c1c1c] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-md m-4 flex flex-col gap-6 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Share Canvas
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Invite others to collaborate with you in real-time.
              </p>
            </div>

            {isGlobal ? (
              <div className="flex flex-col gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Public Global Room</span>
                    <span className="text-xs text-amber-700 dark:text-amber-400/80">
                      You are currently in the public landing room. Anyone can join here. We recommend creating a private room for your team.
                    </span>
                  </div>
                </div>
                <button
                  onClick={generatePrivateRoom}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  Create Private Room
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 rounded-xl">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">Private Room</span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-400/80">
                    You are in a private, unlisted room. Only people with the link can join.
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 pl-1">Room Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-300 focus:outline-none truncate"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium p-2.5 rounded-lg transition-colors flex items-center justify-center shadow-sm w-10 h-10"
                  title="Copy Link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400 dark:text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
