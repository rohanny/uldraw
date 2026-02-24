"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GridNode = ({ className = "" }: { className?: string }) => (
  <div className={`absolute w-[5px] h-[5px] border border-white/20 bg-black z-10 ${className}`} />
);

export default function BlogPage() {
  return (
    <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Background Grid */}
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

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-16 flex flex-col min-h-screen">
        
        {/* Navbar */}
        <nav className="flex justify-between items-center py-8 border-b border-white/10 relative">
          <GridNode className="-bottom-[3px] -left-[3px]" />
          <GridNode className="-bottom-[3px] -right-[3px]" />
          
          <Link href="/landing" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-700 rounded-[4px]" />
            <span className="font-bold text-xl tracking-tight">Uldraw</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="/roadmap" className="hover:text-white transition-colors">roadmap</Link>
            <Link href="/blog" className="text-white font-medium transition-colors">blog</Link>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/register" className="text-white/60 hover:text-white transition-colors">sign up</Link>
            <Link href="/" className="text-purple-500 font-medium flex items-center gap-1 hover:text-purple-400 transition-colors">
              launch app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Blog Header */}
        <header className="pt-24 pb-12">
            <h1 className="text-5xl font-medium tracking-tight mb-4">Blog</h1>
            <p className="text-white/50 text-lg">Thoughts, updates, and ramblings.</p>
        </header>

        {/* Blog Grid */}
        <main className="flex-1 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* The Unclickable Easter Egg Card */}
                <div className="relative group p-6 rounded-xl border border-white/10 bg-[#111] overflow-hidden flex flex-col justify-between min-h-[300px] cursor-default transition-colors hover:border-white/20">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end">
                        <span className="text-xs font-mono text-purple-400 mb-4 block">CLASSIFIED // ENTRY_01</span>
                        <h2 className="text-2xl font-medium tracking-tight text-white mb-3">Jedi Archives</h2>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Impossible? Perhaps.<br/><br/>
                            <span className="text-white/80">The archives are incomplete.</span><br/>
                            What you seek has not yet been recorded.<br/><br/>
                            Patience. Not all knowledge reveals itself at once.<br/><br/>
                            Return when the records are whole.
                        </p>
                    </div>
                </div>

            </div>
        </main>

      </div>
    </div>
  );
}
