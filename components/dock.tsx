"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

export interface DockItemData {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
}

function DockItem({
  item,
  mouseX,
  distance = 200,
  baseItemSize = 50,
  magnification = 70,
}: {
  item: DockItemData;
  mouseX: any;
  distance?: number;
  baseItemSize?: number;
  magnification?: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distanceCalc, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onClick={item.onClick}
      className={`flex items-center cursor-pointer justify-center rounded-full bg-zinc-50/90 dark:bg-zinc-800/90 backdrop-blur-md shadow-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors ${item.className || ""}`}
      title={item.label}
    >
      {item.icon}
    </motion.button>
  );
}

export default function Dock({
  items,
  className = "",
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-3 px-5 py-2.5 rounded-full bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-zinc-700/50 ${className}`}
      style={{ height: panelHeight }}
    >
      {items.map((item, i) => (
        <DockItem
          key={i}
          item={item}
          mouseX={mouseX}
          distance={distance}
          baseItemSize={baseItemSize}
          magnification={magnification}
        />
      ))}
    </motion.div>
  );
}
