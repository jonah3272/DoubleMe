"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const DIALOG_MAX_WIDTH = 440;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const center = "translate(-50%, -50%)";
const contentVariants = {
  hidden: { opacity: 0, transform: `${center} scale(0.98)` },
  visible: { opacity: 1, transform: `${center} scale(1)` },
  exit: { opacity: 0, transform: `${center} scale(0.98)` },
};

function clampDragPosition(x: number, y: number) {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const h = window.innerHeight;
  const w = window.innerWidth;
  const maxX = Math.max(0, w / 2 - DIALOG_MAX_WIDTH / 2);
  const maxY = Math.max(0, h / 2 - (h * 0.9) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const previousActive = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!open) return;
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previousActive.current = document.activeElement as HTMLElement | null;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
      previousActive.current?.focus();
    };
  }, [open]);

  const onHandlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }, [dragOffset.x, dragOffset.y]);

  useEffect(() => {
    if (!open) return;
    const onMove = (e: PointerEvent) => {
      if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        setIsDragging(true);
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const next = clampDragPosition(
          dragStart.current.offsetX + dx,
          dragStart.current.offsetY + dy
        );
        setDragOffset(next);
      }
    };
    const onUp = (e: PointerEvent) => {
      if ((e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setIsDragging(false);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [open]);

  const content = (
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
            transition={{ duration: 0.15, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.35)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-6)",
            }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "dialog-title" : undefined}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              width: "100%",
              maxWidth: DIALOG_MAX_WIDTH,
              maxHeight: "90vh",
              overflow: "auto",
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 51,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}>
              {title && (
                <div
                  id="dialog-title"
                  role="button"
                  tabIndex={0}
                  onPointerDown={onHandlePointerDown}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") e.preventDefault();
                  }}
                  style={{
                    padding: "var(--space-6)",
                    borderBottom: "1px solid var(--color-border-subtle)",
                    fontSize: "var(--text-lg)",
                    fontWeight: "var(--font-semibold)",
cursor: isDragging ? "grabbing" : "grab",
                  userSelect: "none",
                }}
                title="Drag to move"
                >
                  {title}
                </div>
              )}
              <div style={{ padding: "var(--space-6)" }}>{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}
