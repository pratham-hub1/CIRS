import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, useInView, Variants } from 'framer-motion';

export interface KineticTextProps {
  /** Text content to animate */
  text: string;
  /** Granularity of kinetic animation: 'char' (letter-by-letter) or 'word' (word-by-word) */
  mode?: 'char' | 'word';
  /** Stagger interval in seconds between each item */
  stagger?: number;
  /** Initial delay in seconds before animation begins */
  delay?: number;
  /** Whether to re-trigger the animation every time the user scrolls it in/out of view */
  repeatOnView?: boolean;
  /** Viewport intersection threshold (0.1 = 10% visible, 0.4 = 40% visible) */
  threshold?: number;
  /** Additional CSS class names */
  className?: string;
}

/**
 * KineticText
 * Renders typography with a fluid, optical blur-and-spring kinetic emergence.
 * Re-animates smoothly whenever scrolled into view (top hero vs down architecture section).
 */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  mode = 'char',
  stagger,
  delay = 0,
  repeatOnView = true,
  threshold = 0.2,
  className = '',
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, {
    amount: threshold,
    once: !repeatOnView,
  });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else if (repeatOnView) {
      controls.start('hidden');
    }
  }, [isInView, controls, repeatOnView]);

  const defaultStagger = mode === 'char' ? 0.022 : 0.065;
  const itemStagger = stagger ?? defaultStagger;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: itemStagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 9,
      filter: 'blur(5px)',
      scale: 0.94,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 18,
        mass: 0.45,
      },
    },
  };

  if (mode === 'char') {
    const words = text.split(' ');
    return (
      <motion.span
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={controls}
        className={`inline ${className}`}
      >
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {word.split('').map((char, charIndex) => (
              <motion.span
                key={charIndex}
                variants={itemVariants}
                className="inline-block will-change-[transform,opacity,filter]"
              >
                {char}
              </motion.span>
            ))}
            {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
      </motion.span>
    );
  }

  // Word-by-word kinetic emergence
  const words = text.split(' ');
  return (
    <motion.span
      ref={containerRef}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className={`inline ${className}`}
    >
      {words.map((word, idx) => (
        <span key={idx} className="inline-block">
          <motion.span
            variants={itemVariants}
            className="inline-block will-change-[transform,opacity,filter]"
          >
            {word}
          </motion.span>
          {idx < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.span>
  );
};
