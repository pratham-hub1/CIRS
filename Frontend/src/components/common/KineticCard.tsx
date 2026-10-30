import React from 'react';
import { motion, Variants } from 'framer-motion';

export interface KineticCardProps {
  children: React.ReactNode;
  /** Stagger delay in seconds before card dissolves into view */
  delay?: number;
  /** Animation duration in seconds (default 0.7s) */
  duration?: number;
  /** Viewport threshold to trigger animation (default 0.15 = 15% visible) */
  threshold?: number;
  /** Whether to re-animate every time scrolled into/out of view (switching up & down) */
  repeatOnView?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const kineticCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(10px)',
    scale: 0.96,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

/**
 * KineticCard
 * Synchronizes card emergence with KineticText typography.
 * Smoothly dissolves in with optical un-blur, micro-elevation, and scale normalization.
 * Re-triggers on scroll so both up and down pages reveal in harmony whenever toggled.
 */
export const KineticCard: React.FC<KineticCardProps> = ({
  children,
  delay = 0,
  duration = 0.7,
  threshold = 0.15,
  repeatOnView = true,
  className = '',
  style,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(10px)', scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
      viewport={{ once: !repeatOnView, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
};
