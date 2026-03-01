"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Creative card with subtle hover scale and shadow animation.
 * Uses design tokens (--primary, --background) for consistency.
 */
const AnimatedCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children }, ref) => (
  <motion.div
    ref={ref}
    initial={false}
    whileHover={{
      scale: 1.02,
      transition: { duration: 0.2 },
    }}
    whileTap={{ scale: 0.99 }}
    className={cn(
      "rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-lg",
      className
    )}
  >
    {children}
  </motion.div>
));
AnimatedCard.displayName = "AnimatedCard";

/**
 * Spotlight-style gradient overlay for hero or section headers.
 * Uses primary/foreground for a 2026 look.
 */
const SpotlightOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]",
      className
    )}
    {...props}
  />
));
SpotlightOverlay.displayName = "SpotlightOverlay";

export { AnimatedCard, SpotlightOverlay };
