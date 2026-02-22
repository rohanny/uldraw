"use client";

import { motion } from "framer-motion";

type PickerProps = {
  items: (string | number)[];
  selectedValue: string | number;
  onSelect: (value: any) => void;
  isColor?: boolean;
};

export default function Picker({ items, selectedValue, onSelect, isColor }: PickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-3 rounded-full bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-zinc-700/50 z-40"
    >
      {items.map((item) => {
        const isSelected = selectedValue === item;
        
        if (isColor) {
          return (
            <button
              key={item as string}
              onClick={() => onSelect(item)}
              className={`w-10 h-10 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
              }`}
              style={{ backgroundColor: item as string }}
              title={item as string}
            />
          );
        } else {
          const size = item as number;
          return (
            <button
              key={size}
              onClick={() => onSelect(size)}
              className={`w-10 h-10 rounded-full bg-white dark:bg-zinc-800 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
              }`}
              title={`Size ${size}`}
            >
              <div
                className="rounded-full bg-gray-700 dark:bg-gray-300"
                style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
              />
            </button>
          );
        }
      })}
    </motion.div>
  );
}
