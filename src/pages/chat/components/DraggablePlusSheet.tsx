import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";

interface DraggablePlusSheetProps {
  height: number;
  collapsedY: number;
  onClose: () => void;
  children: ReactNode;
  initialExpanded?: boolean;
  dragEnabled?: boolean;
  view?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  bottomOffset?: number;
}

/**
 * Bottom sheet with drag-to-collapse/close, framer-motion based.
 * Replaces vaul because vaul's snap points misbehaved under this app's
 * mobile chat layout (rendered off-screen). Two snap positions:
 *   - collapsed at translateY = collapsedY
 *   - expanded at translateY = 0
 * Dragging below collapsedY + threshold closes the sheet.
 */
export const DraggablePlusSheet = ({
  height,
  collapsedY,
  onClose,
  children,
  initialExpanded = false,
  view,
  onScroll,
  bottomOffset = 0,
}: DraggablePlusSheetProps) => {
  const y = useMotionValue(initialExpanded ? 0 : collapsedY);
  const [expanded, setExpanded] = useState(initialExpanded);

  // Snap points: 0 = full, midY = half, collapsedY = collapsed (peek).
  const midY = collapsedY / 2;
  const snapPoints = collapsedY > 24 ? [0, midY, collapsedY] : [0];
  const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

  useEffect(() => {
    if (view === "skills" || view === "tools") {
      setExpanded(true);
      animate(y, 0, SPRING);
    } else if (view === "main") {
      setExpanded(false);
      animate(y, collapsedY, SPRING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, collapsedY]);

  return (
    <AnimatePresence>
      <motion.div
        key="plus-sheet"
        initial={{ y: height }}
        animate={{ y: initialExpanded ? 0 : collapsedY }}
        exit={{ y: height }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: height }}
        dragElastic={0.02}
        style={{
          y,
          height,
          paddingBottom: bottomOffset,
          boxShadow: "0 -12px 44px hsl(var(--foreground) / 0.14)",
        }}
        onDragEnd={(_, info) => {
          const current = y.get();
          // Close if dragged well past collapsed position
          if (current > collapsedY + 120 || (info.velocity.y > 900 && current > collapsedY - 40)) {
            animate(y, height, {
              type: "spring",
              stiffness: 380,
              damping: 36,
              onComplete: onClose,
            });
            return;
          }
          // Project the flick, then snap to the nearest snap point
          const projected = current + info.velocity.y * 0.12;
          const target = snapPoints.reduce((best, p) =>
            Math.abs(p - projected) < Math.abs(best - projected) ? p : best,
          snapPoints[0]);
          setExpanded(target === 0);
          animate(y, target, SPRING);
        }}
        data-plus-menu
        onClick={(e) => e.stopPropagation()}
        className="mobile-plus-glass-menu md:hidden fixed left-0 right-0 bottom-0 z-overlay flex flex-col rounded-t-[28px] outline-none touch-none"
      >
        <button
          type="button"
          aria-label="Toggle"
          onClick={() => {
            // Cycle collapsed -> half -> full -> collapsed
            const current = y.get();
            const idx = snapPoints.reduce(
              (bi, p, i) =>
                Math.abs(p - current) < Math.abs(snapPoints[bi] - current) ? i : bi,
              0,
            );
            const next = snapPoints[idx === 0 ? snapPoints.length - 1 : idx - 1];
            setExpanded(next === 0);
            animate(y, next, SPRING);
          }}
          className="mx-auto mt-2.5 mb-2 w-10 h-1.5 rounded-full bg-foreground/25 cursor-grab active:cursor-grabbing"
        />
        <div
          onScroll={onScroll}
          className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] touch-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
