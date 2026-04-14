"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export function AnimatedPanel({
  children,
  animationKey,
  direction = "right",
}: {
  children: ReactNode;
  animationKey: string;
  direction?: "left" | "right";
}) {
  const xFrom = direction === "right" ? 40 : -40;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{ opacity: 0, x: xFrom }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: xFrom }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 26,
        }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
