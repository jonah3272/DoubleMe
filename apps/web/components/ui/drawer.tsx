"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  title?: string;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariantsLeft = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
  exit: { x: "-100%" },
};

const panelVariantsRight = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

export function Drawer({
  open,
  onClose,
  children,
  side = "right",
  title,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const panelVariants = side === "left" ? panelVariantsLeft : panelVariantsRight;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            aria-hidden
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.25)",
              zIndex: 40,
            }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "drawer-title" : undefined}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "fixed",
              top: 0,
              right: side === "right" ? 0 : undefined,
              left: side === "left" ? 0 : undefined,
              bottom: 0,
              width: "min(400px, 100vw)",
              maxWidth: "100%",
              backgroundColor: "var(--color-bg-elevated)",
              borderLeft: side === "right" ? "1px solid var(--color-border)" : undefined,
              borderRight: side === "left" ? "1px solid var(--color-border)" : undefined,
              boxShadow: "var(--shadow-lg)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {title && (
              <div
                id="drawer-title"
                style={{
                  padding: "var(--space-6)",
                  borderBottom: "1px solid var(--color-border-subtle)",
                  fontSize: "var(--text-lg)",
                  fontWeight: "var(--font-semibold)",
                }}
              >
                {title}
              </div>
            )}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: "var(--space-6)",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
