import { useEffect, useRef } from 'react';
import { useScroll, useVelocity, useSpring, useTransform, useMotionValue } from 'framer-motion';

/**
 * useWarmTextBounce
 * Generates a refined, subtle, and warm elastic bounce strictly for typography text nodes.
 * Keeps all cards, containers, input fields, and grids completely anchored and static.
 */
export function useWarmTextBounce() {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Gentle, warm spring physics with organic cushioning
  const springConfig = {
    stiffness: 120,
    damping: 16,
    mass: 0.5,
  };

  // Primary title text spring (very subtle ~3-4px displacement)
  const smoothTitleVelocity = useSpring(scrollVelocity, springConfig);
  const scrollTitleY = useTransform(smoothTitleVelocity, [-700, 0, 700], [3.5, 0, -3.5]);

  // Secondary body text spring (~4-5px displacement)
  const smoothBodyVelocity = useSpring(scrollVelocity, {
    stiffness: 110,
    damping: 15,
    mass: 0.55,
  });
  const scrollBodyY = useTransform(smoothBodyVelocity, [-700, 0, 700], [4.5, 0, -4.5]);

  // Subtext / label text spring (~3px displacement)
  const smoothSubtextVelocity = useSpring(scrollVelocity, {
    stiffness: 130,
    damping: 17,
    mass: 0.45,
  });
  const scrollSubtextY = useTransform(smoothSubtextVelocity, [-700, 0, 700], [3.0, 0, -3.0]);

  // Interactive impulse for mouse wheel, trackpad, and mobile touch swiping
  const interactiveImpulse = useMotionValue(0);
  const smoothInteractive = useSpring(interactiveImpulse, springConfig);

  const decayTimerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Mouse wheel & trackpad listener
    const handleWheel = (e: WheelEvent) => {
      // Gentle impulse clamped to subtle max ±3.5px
      const delta = Math.max(-3.5, Math.min(3.5, e.deltaY * 0.04));
      interactiveImpulse.set(-delta);

      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      decayTimerRef.current = setTimeout(() => {
        interactiveImpulse.set(0);
      }, 100);
    };

    // 2. Mobile touch gesture listener
    let lastTouchY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const delta = lastTouchY - currentY;
        lastTouchY = currentY;
        const impulse = Math.max(-4, Math.min(4, delta * 0.12));
        interactiveImpulse.set(-impulse);
      }
    };

    const handleTouchEnd = () => {
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      decayTimerRef.current = setTimeout(() => {
        interactiveImpulse.set(0);
      }, 90);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    };
  }, [interactiveImpulse]);

  // Combined title text bounce (applied ONLY to text nodes)
  const titleBounceY = useTransform(
    [scrollTitleY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) + Number(interVal)
  );

  // Combined body text bounce (applied ONLY to paragraphs / descriptions)
  const bodyBounceY = useTransform(
    [scrollBodyY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) + Number(interVal) * 1.15
  );

  // Combined subtext / label bounce (applied ONLY to labels / badge text)
  const subtextBounceY = useTransform(
    [scrollSubtextY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) + Number(interVal) * 0.9
  );

  return {
    titleBounceY,
    bodyBounceY,
    subtextBounceY,
  };
}
