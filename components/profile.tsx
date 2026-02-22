"use client";

import { motion } from "framer-motion";

interface ProfileProps {
  collaborators?: { id: string; name: string; avatarSeed?: string }[];
  onShareClick?: () => void;
}

export default function Profile({ collaborators = [], onShareClick }: ProfileProps) {
  return (
    <div className="pointer-events-none absolute top-4 right-4 z-40 flex items-center -space-x-2">
      {collaborators.length > 0 && collaborators.map((user, i) => (
        <div 
          key={user.id}
          className="group relative pointer-events-auto h-10 w-10 rounded-full border-2 border-white dark:border-[#121212] flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 shadow-sm transition-transform hover:-translate-y-1 hover:z-10 cursor-pointer"
          style={{ zIndex: collaborators.length - i }}
        >
          <img 
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.avatarSeed || user.name}`} 

            alt={user.name} 
            className="w-full h-full object-cover rounded-full"
          />
          
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-xs font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {user.name}
          </div>
        </div>
      ))}
      {/* Invite Button */}
      <div 
        onClick={onShareClick}
        className="pointer-events-auto ml-4 h-10 px-4 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-sm font-medium text-zinc-600 dark:text-zinc-300"
      >
        Share
      </div>
    </div>
  );
}
