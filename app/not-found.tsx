"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#121212] flex flex-col font-sans selection:bg-purple-100 relative overflow-hidden transition-colors duration-300">
      {/* Noise Overlay */}
      <motion.div 
        animate={{ 
          backgroundPosition: ["0% 0%", "10% 5%", "-5% 10%", "5% -5%", "-10% 0%"] 
        }}
        transition={{ 
          duration: 0.1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-0 opacity-[0.05] pointer-events-none z-50 bg-[length:200px_200px]"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />

      {/* Top Left Icon */}
      <div className="absolute top-8 left-8">
        <div className="w-10 h-10 bg-purple-600 rounded-sm shadow-sm" />
      </div>

      <main className="flex-1 flex flex-col pt-[15vh] px-12 md:px-24">
        {/* Main Heading - Clean as requested */}
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-7xl md:text-9xl font-bold tracking-tight text-black dark:text-white"
        >
          Got lost?
        </motion.h1>

        {/* Terminal Stacks Container */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-[600px] h-[500px] pointer-events-none hidden lg:block">
            {/* Background blurred cards */}
            <div className="absolute top-12 right-24 w-[400px] h-[280px] bg-[#edf2f7]/60 dark:bg-[#1a202c]/40 border border-slate-200 dark:border-slate-800 rounded-lg blur-[2px] opacity-40" />
            <div className="absolute top-6 right-12 w-[400px] h-[280px] bg-[#edf2f7]/80 dark:bg-[#1a202c]/60 border border-slate-200 dark:border-slate-800 rounded-lg blur-[1px] opacity-60" />

            {/* Main Terminal Card */}
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 right-0 w-[420px] bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden pointer-events-auto"
            >
                {/* Title Bar */}
                <div className="h-10 bg-[#343b48] dark:bg-[#2d3748] flex items-center px-4 gap-3">
                    <div className="w-3 h-3 bg-purple-600 rounded-sm" />
                    <span className="text-white text-xs font-medium opacity-90">Error 404</span>
                </div>

                <div className="p-6 bg-[#f7fafc] dark:bg-[#121212] font-mono text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                    <div className="flex gap-2 mb-4">
                        <span className="text-slate-400">$</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">Error: 404 - Base module not found</span>
                    </div>

                    <div className="mb-6 opacity-80 text-purple-600/60 dark:text-purple-400/60 leading-tight relative overflow-hidden">
                        {/* Scanning line animation */}
                        <motion.div 
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-[2px] bg-purple-400/20 z-10 pointer-events-none"
                        />
                        
                        <div className="relative">
                            {/* Base ASCII art */}
                            <pre className="text-[10px] md:text-xs font-mono tracking-widest">{`      ___           ___           ___     
     /\\__\\         /\\  \\         /\\__\\    
    /:/  /        /::\\  \\       /:/  /    
   /:/__/        /:/\\:\\  \\     /:/__/     
  /::\\  \\ ___   /:/  \\:\\  \\   /::\\  \\ ___ 
 /:/\\:\\  /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\
 \\/__\\:\\/:/  / \\:\\  \\ /:/  / \\/__\\:\\/:/  /
      \\::/  /   \\:\\  /:/  /       \\::/  / 
      /:/  /     \\:\\/:/  /        /:/  /  
     /:/  /       \\::/  /        /:/  /   
     \\/__/         \\/__/         \\/__/    `}</pre>

                            {/* Glitch Overlay - Horizontal shifts */}
                            <motion.pre 
                              animate={{ 
                                x: [0, -2, 2, 0, -3, 0],
                                opacity: [0, 0.5, 0, 0.2, 0],
                                clipPath: [
                                  "inset(0% 0% 0% 0%)",
                                  "inset(20% 0% 40% 0%)",
                                  "inset(60% 0% 10% 0%)",
                                  "inset(0% 0% 0% 0%)"
                                ]
                              }}
                              transition={{ 
                                duration: 0.15, 
                                repeat: Infinity, 
                                repeatDelay: 2,
                                times: [0, 0.2, 0.4, 0.6, 0.8, 1] 
                              }}
                              className="absolute top-0 left-0 text-[10px] md:text-xs font-mono tracking-widest text-red-500/30 select-none pointer-events-none"
                            >{`      ___           ___           ___     
     /\\__\\         /\\  \\         /\\__\\    
    /:/  /        /::\\  \\       /:/  /    
   /:/__/        /:/\\:\\  \\     /:/__/     
  /::\\  \\ ___   /:/  \\:\\  \\   /::\\  \\ ___ 
 /:/\\:\\  /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\
 \\/__\\:\\/:/  / \\:\\  \\ /:/  / \\/__\\:\\/:/  /
      \\::/  /   \\:\\  /:/  /       \\::/  / 
      /:/  /     \\:\\/:/  /        /:/  /  
     /:/  /       \\::/  /        /:/  /   
     \\/__/         \\/__/         \\/__/    `}</motion.pre>

                            <motion.pre 
                              animate={{ 
                                x: [0, 3, -2, 0, 1, 0],
                                opacity: [0, 0.4, 0, 0.3, 0],
                                clipPath: [
                                  "inset(10% 0% 70% 0%)",
                                  "inset(30% 0% 20% 0%)",
                                  "inset(80% 0% 5% 0%)",
                                  "inset(0% 0% 0% 0%)"
                                ]
                              }}
                              transition={{ 
                                duration: 0.2, 
                                repeat: Infinity, 
                                repeatDelay: 1.5,
                                times: [0, 0.2, 0.4, 0.6, 0.8, 1] 
                              }}
                              className="absolute top-0 left-0 text-[10px] md:text-xs font-mono tracking-widest text-purple-500/30 select-none pointer-events-none"
                            >{`      ___           ___           ___     
     /\\__\\         /\\  \\         /\\__\\    
    /:/  /        /::\\  \\       /:/  /    
   /:/__/        /:/\\:\\  \\     /:/__/     
  /::\\  \\ ___   /:/  \\:\\  \\   /::\\  \\ ___ 
 /:/\\:\\  /\\__\\ /:/__/ \\:\\__\\ /:/\\:\\  /\\__\\
 \\/__\\:\\/:/  / \\:\\  \\ /:/  / \\/__\\:\\/:/  /
      \\::/  /   \\:\\  /:/  /       \\::/  / 
      /:/  /     \\:\\/:/  /        /:/  /  
     /:/  /       \\::/  /        /:/  /   
     \\/__/         \\/__/         \\/__/    `}</motion.pre>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex gap-2">
                            <span className="text-slate-400">#</span>
                            <span>Suggestion: <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline">get back to /base</Link></span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-slate-400">#</span>
                            <span>API Key: <span className="text-purple-600 dark:text-purple-400">Not needed</span></span>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <span className="text-slate-400">::</span>
                            <button onClick={() => window.location.href = '/'} className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors underline decoration-slate-300 dark:decoration-slate-700">
                                Click here to reboot Base
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </main>

      {/* Footer / Mobile View terminal */}
      <div className="lg:hidden px-12 pb-24">
         <div className="w-full max-w-sm bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="h-8 bg-[#343b48] dark:bg-[#2d3748] flex items-center px-3 gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-sm" />
                <span className="text-white text-[10px] font-medium opacity-90">Error 404</span>
            </div>
            <div className="p-4 bg-[#f7fafc] dark:bg-[#121212] font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <div className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Error: 404 - Base module not found</div>
                <Link href="/" className="text-purple-600 dark:text-purple-400 hover:underline block mb-1">get back to /base</Link>
                <div className="text-slate-400">API Key: Not needed</div>
            </div>
         </div>
      </div>

      {/* Back to home Button */}
      <div className="absolute bottom-12 right-12 z-20">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-[#222222] dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium shadow-lg hover:bg-black dark:hover:bg-zinc-200 transition-colors"
          >
            Back to home
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
