"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu as MenuIcon, Moon, Sun, LogOut, Download } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAvatarStore } from "@/lib/store";

interface BottomMenuProps {
  user?: any;
  onEditProfile?: () => void;
  onExport?: () => void;
}

export default function BottomMenu({ user, onEditProfile, onExport }: BottomMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { getAvatarSeed } = useAvatarStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isDark = mounted && (theme === "dark" || (theme === "system" && systemTheme === "dark"));

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error: any) {
      toast.error("Failed to sign out");
      console.error(error);
    }
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 shadow-xl w-48"
          >
            {user && (
              <>
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => {
                    if (onEditProfile) onEditProfile();
                    setIsOpen(false);
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-500 shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center shadow-sm">
                     <img 
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${getAvatarSeed(user.id)}`}
                        alt="Avatar" 
                        className="w-full h-full object-cover bg-indigo-100 dark:bg-zinc-800"
                      />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {user.user_metadata?.full_name || "Guest"}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {user.email || "Edit profile"}
                    </span>
                  </div>
                </div>
                <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800 my-1" />
              </>
            )}
            {mounted && (
              <button
                onClick={() => {
                  setTheme(isDark ? "light" : "dark");
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            )}
            
            <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800 my-1" />
            
            {onExport && (
              <button
                onClick={() => {
                  onExport();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
            
            <div className="h-[1px] w-full bg-zinc-200 dark:bg-zinc-800 my-1" />
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-zinc-700 dark:text-zinc-300"
      >
        <MenuIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
