"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GridNode = ({ className = "" }: { className?: string }) => (
  <div className={`absolute w-[5px] h-[5px] border border-white/20 bg-black z-10 ${className}`} />
);

export default function RoadmapPage() {
  const completedTasks = [
    "HTML5 Canvas with React and basic drawing tools",
    "Real-time stroke broadcasting & Supabase sync",
    "Live collaborator cursors with custom DiceBear avatars",
    "Supabase Anonymous Authentication (Guest Mode)",
    "Share Canvas dialog & Private room generation",
    "Infinite canvas with pan/zoom",
    "Local Undo/Redo & Room snapshots",
    "PNG/SVG native export",
  ];

  const currentTasks = [
    "Shape tools (rectangle, ellipse, line)",
    "Shape selection and multi-select",
    "Z-index ordering (bring forward/send back)",
    "Persistent canvas state (PostgreSQL storage)",
    "Text tool & Image upload support",
  ];

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
            <Link href="/roadmap" className="text-white font-medium transition-colors">roadmap</Link>
            <Link href="/blog" className="hover:text-white transition-colors">blog</Link>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link href="/register" className="text-white/60 hover:text-white transition-colors">sign up</Link>
            <Link href="/" className="text-purple-500 font-medium flex items-center gap-1 hover:text-purple-400 transition-colors">
              launch app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Roadmap Header */}
        <header className="pt-24 pb-16 relative border-b border-white/10">
            <GridNode className="-bottom-[3px] -left-[3px]" />
            <GridNode className="-bottom-[3px] -right-[3px]" />
            <h1 className="text-5xl font-medium tracking-tight mb-4">Roadmap</h1>
            <p className="text-white/50 text-lg max-w-2xl">Building in public. Here is what we've accomplished and what we are working on right now.</p>
        </header>

        {/* Roadmap Content */}
        <main className="flex-1 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
             
             {/* Completed Column */}
             <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h2 className="text-xl font-medium">Completed</h2>
                </div>
                <ul className="space-y-6">
                    {completedTasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-4">
                            <span className="text-emerald-500/50 mt-1">✓</span>
                            <span className="text-white/60 leading-relaxed text-sm">{task}</span>
                        </li>
                    ))}
                </ul>
             </div>

             {/* In Progress Column */}
             <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                    <h2 className="text-xl font-medium">In Progress</h2>
                </div>
                <ul className="space-y-6 relative border-l border-white/10 ml-1.5 pl-6">
                    {currentTasks.map((task, i) => (
                        <li key={i} className="relative">
                            <div className="absolute -left-[29px] top-1.5 w-2 h-2 rounded-full bg-yellow-500/50" />
                            <span className="text-white/90 leading-relaxed text-sm block bg-white/5 p-4 rounded-lg border border-white/5">{task}</span>
                        </li>
                    ))}
                </ul>
             </div>
             
             {/* Center Grid Node */}
             <GridNode className="-top-[3px] left-1/2 -translate-x-1/2 hidden lg:block" />
        </main>

      </div>
    </div>
  );
}
