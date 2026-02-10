"use client";

import { motion } from "framer-motion";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  width,
  height = 20,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <motion.div
      className={className}
      style={{
        width: width ?? "100%",
        height: typeof height === "number" ? `${height}px` : height,
        backgroundColor: "var(--color-bg-muted)",
        borderRadius: "var(--radius-sm)",
        ...style,
      }}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      {...props}
    />
  );
}
