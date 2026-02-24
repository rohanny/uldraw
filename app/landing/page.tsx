"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LayoutGrid, SquareTerminal, Sparkles, Layers, BoxSelect, Database, Zap, Plus, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const GridNode = ({ className = "" }: { className?: string }) => (
  <div className={`absolute w-[5px] h-[5px] border border-white/20 bg-black z-10 ${className}`} />
);

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (theme !== 'dark') setTheme('dark');
  }, [theme, setTheme]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage("opps i have not implemented this yet my bad 😅");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById("features");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 flex justify-center">
         <div className="w-full max-w-[1400px] h-full flex justify-between px-8 md:px-16 opacity-20">
            <div className="w-[1px] h-full bg-white/20" />
            <div className="w-[1px] h-full bg-white/10 hidden md:block" />
            <div className="w-[1px] h-full bg-white/10 hidden lg:block" />
            <div className="w-[1px] h-full bg-white/10 hidden lg:block" />
            <div className="w-[1px] h-full bg-white/10 hidden md:block" />
            <div className="w-[1px] h-full bg-white/20" />
         </div>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-16">
        <nav className="flex justify-between items-center py-8 border-b border-white/10 relative">
          <GridNode className="-bottom-[3px] -left-[3px]" />
          <GridNode className="-bottom-[3px] -right-[3px]" />
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-700 rounded-[4px]" />
            <span className="font-bold text-xl tracking-tight">Uldraw</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="/" className="hover:text-white transition-colors">roadmap</Link>
            <Link href="/" className="hover:text-white transition-colors">blog</Link>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/register" className="text-white/60 hover:text-white transition-colors">sign up</Link>
            <Link href="/" className="text-purple-500 font-medium flex items-center gap-1 hover:text-purple-400 transition-colors">
              launch app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <section className="pt-32 pb-48 relative border-b border-white/10">
          <GridNode className="-bottom-[3px] -left-[3px]" />
          <GridNode className="-bottom-[3px] -right-[3px]" />
          
          <div className="max-w-4xl">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl md:text-[5.5rem] font-medium tracking-[-0.04em] leading-[1.1] mb-8"
            >
              infinite <span className="text-white">canvas</span><br/>
              <span className="text-white/50">the collaborative whiteboard<br/>for teams shipping fast</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl text-white/40 max-w-2xl mb-12 leading-relaxed"
            >
              Uldraw provides a limitless space for your ideas, architecture diagrams, and brainstorming sessions. Built for performance and realtime sync.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-6"
            >
              <Link href="/" className="px-6 py-3 bg-[#e8e6e3] text-black font-medium rounded-md hover:bg-white transition-colors">
                launch Uldraw
              </Link>
              <a 
                href="#features" 
                onClick={scrollToFeatures}
                className="text-white/60 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
              >
                explore features <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>

        <section id="features" className="grid grid-cols-1 md:grid-cols-2 relative border-b border-white/10 scroll-mt-32">
           <GridNode className="-bottom-[3px] -left-[3px]" />
           <GridNode className="-bottom-[3px] -right-[3px]" />
           <GridNode className="-bottom-[3px] left-1/2 -translate-x-1/2 hidden md:block" />

           <div className="p-12 md:p-16 border-b md:border-b-0 md:border-r border-white/10 relative">
               <GridNode className="-bottom-[3px] -right-[3px] md:hidden" />
               <h3 className="text-xl font-medium mb-4">Real-time synchronization</h3>
               <p className="text-white/50 leading-relaxed text-lg max-w-sm">
                 Uldraw keeps your entire team in sync with sub-16ms latency across the globe, leveraging WebSocket architecture.
               </p>
           </div>
           <div className="p-12 md:p-16">
               <h3 className="text-xl font-medium mb-4">Vector precision</h3>
               <p className="text-white/50 leading-relaxed text-lg max-w-sm">
                 Zoom to infinity without losing quality. Every stroke, shape, and text element remains a crisp vector path.
               </p>
           </div>
        </section>

        <section className="relative border-b border-white/10 py-32 md:py-48 overflow-hidden flex flex-col items-center justify-center text-center">
            <GridNode className="-bottom-[3px] -left-[3px]" />
            <GridNode className="-bottom-[3px] -right-[3px]" />

            <div className="absolute bottom-0 w-[150vw] h-[150vw] left-1/2 -translate-x-1/2 translate-y-1/2 border border-white/10 rounded-full z-0 opacity-50" />
            <div className="absolute bottom-0 w-[150vw] h-[200px] left-1/2 -translate-x-1/2 bg-gradient-to-t from-white/[0.03] to-transparent z-0 pointer-events-none" />

            <div className="relative z-10 max-w-3xl px-6">
                <span className="text-white/40 mb-8 block font-medium">infinite possibilities</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1] mb-8">
                    the whiteboard without <br/> borders or limits
                </h2>
                <p className="text-white/50 text-lg md:text-xl leading-relaxed mb-12">
                    a new way to ideate, brainstorm, and plan architecture <br className="hidden md:block"/>
                    with absolute visual freedom
                </p>
                <Link href="/" className="inline-flex px-6 py-3 bg-[#e8e6e3] text-black font-medium rounded-md hover:bg-white transition-colors items-center gap-2 mx-auto">
                    <LayoutGrid className="w-4 h-4" /> launch workspace
                </Link>
            </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 relative border-b border-white/10 mb-32">
           <GridNode className="-bottom-[3px] -left-[3px]" />
           <GridNode className="-bottom-[3px] -right-[3px]" />
           <GridNode className="-bottom-[3px] left-1/2 -translate-x-1/2 hidden lg:block" />

           <div className="p-12 md:p-16 border-b lg:border-b-0 lg:border-r border-white/10 relative">
               <GridNode className="-bottom-[3px] -right-[3px] lg:hidden" />
               <h3 className="text-xl font-medium mb-4">Global workspaces</h3>
               <p className="text-white/50 leading-relaxed text-lg max-w-sm">
                 Organize your canvases into shared workspaces with granular access control for different teams.
               </p>
           </div>
           <div className="p-12 md:p-16">
               <h3 className="text-xl font-medium mb-4">Export anywhere</h3>
               <p className="text-white/50 leading-relaxed text-lg max-w-sm">
                 Take your ideas out of Uldraw as SVG, PNG, or raw JSON data instantly. Never get locked in.
               </p>
           </div>
        </section>

        <section className="py-32 flex flex-col items-center justify-center text-center relative border-t border-white/10">
            <div className="max-w-md w-full px-6 relative z-10">
                <h3 className="text-2xl font-medium mb-4">stay in the loop</h3>
                <p className="text-white/50 mb-8">Get updates on Uldraw's development and early access drops.</p>
                <form onSubmit={handleSubscribe} className="relative flex items-center">
                    <input 
                        type="email" 
                        placeholder="your@email.com" 
                        required
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    <button type="submit" className="absolute right-2 px-4 py-1.5 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 transition-colors">
                        submit
                    </button>
                </form>
            </div>
            
            <AnimatePresence>
              {toastMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#222] border border-white/10 text-white text-sm px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  {toastMessage}
                </motion.div>
              )}
            </AnimatePresence>
        </section>

      </div>
    </div>
  );
}
