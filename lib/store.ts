import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AvatarState {
  avatarSeeds: Record<string, string>; // userId -> avatarSeed
  getAvatarSeed: (userId: string) => string;
  setAvatarSeed: (userId: string, seed: string) => void;
  generateAvatarSeed: (userId: string, useTimestamp?: boolean) => string;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      avatarSeeds: {},
      
      getAvatarSeed: (userId: string) => {
        const seeds = get().avatarSeeds;
        if (seeds[userId]) {
          return seeds[userId];
        }
        // Generate and save if doesn't exist
        return get().generateAvatarSeed(userId);
      },
      
      setAvatarSeed: (userId: string, seed: string) => {
        set((state) => ({
          avatarSeeds: {
            ...state.avatarSeeds,
            [userId]: seed,
          },
        }));
      },
      
      generateAvatarSeed: (userId: string, useTimestamp?: boolean) => {
        const newSeed = useTimestamp 
          ? Date.now().toString() 
          : Math.random().toString(36).substring(7);
        get().setAvatarSeed(userId, newSeed);
        return newSeed;
      },
    }),
    {
      name: 'avatar-storage',
    }
  )
);
