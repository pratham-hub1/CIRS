import { useEffect, useRef } from 'react';
import { useScroll, useVelocity, useSpring, useTransform, useMotionValue } from 'framer-motion';

/**
 * useWarmTextBounce
 * Produces an organic, subtle, and warm elastic bounce on typography during page scrolling,
 * trackpad gestures, mouse wheeling, and mobile touch swiping.
 */
export function useWarmTextBounce() {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);

  // Organic spring physics: warm, cushioned, gentle harmonic resonance
  const springConfig = {
    stiffness: 95,
    damping: 13,
    mass: 0.7,
  };

  // Primary title scroll spring (subtle displacement ~8-10px)
  const smoothTitleVelocity = useSpring(scrollVelocity, springConfig);
  const scrollTitleY = useTransform(smoothTitleVelocity, [-800, 0, 800], [9, 0, -9]);

  // Secondary body scroll spring (slightly more elastic ~12-14px)
  const smoothBodyVelocity = useSpring(scrollVelocity, {
    stiffness: 85,
    damping: 12,
    mass: 0.8,
  });
  const scrollBodyY = useTransform(smoothBodyVelocity, [-800, 0, 800], [13, 0, -13]);

  // Interactive impulse motion value for wheel, trackpad, and touch swipe
  const interactiveImpulse = useMotionValue(0);
  const smoothInteractive = useSpring(interactiveImpulse, springConfig);

  const decayTimerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Mouse wheel & trackpad handler
    const handleWheel = (e: WheelEvent) => {
      // Scale down deltaY smoothly and clamp to safe warm displacement
      const delta = Math.max(-10, Math.min(10, e.deltaY * 0.12));
      interactiveImpulse.set(-delta);

      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
      decayTimerRef.current = setTimeout(() => {
        // Return to rest position with spring oscillation
        interactiveImpulse.set(0);
      }, 110);
    };

    // 2. Mobile touch gesture handler
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
        const impulse = Math.max(-12, Math.min(12, delta * 0.35));
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

  // Combined title bounce (scrollY + wheel/touch impulses)
  const titleBounceY = useTransform(
    [scrollTitleY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) + Number(interVal)
  );

  // Combined body/form bounce (slightly more amplified for organic liquid feel)
  const bodyBounceY = useTransform(
    [scrollBodyY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) + Number(interVal) * 1.3
  );

  // Combined badge/subtext bounce (staggered micro-bounce)
  const subtextBounceY = useTransform(
    [scrollBodyY, smoothInteractive],
    ([scrollVal, interVal]: any) => Number(scrollVal) * 0.8 + Number(interVal) * 1.1
  );

  return {
    titleBounceY,
    bodyBounceY,
    subtextBounceY,
  };
}
